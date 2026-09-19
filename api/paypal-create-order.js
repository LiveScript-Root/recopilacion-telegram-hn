import { json, method, clean, supabaseAdmin, paypalAccessToken, PRICE, CURRENCY, safeRecordSubmissionEvent } from './_lib.js';
export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  try{
    const rid=clean(req.body?.requestId,40);
    if(!/^NEXO-[A-F0-9]{12}$/.test(rid)) return json(res,400,{error:'Solicitud inválida.'});
    const db=supabaseAdmin();
    const {data:row,error}=await db.from('nexo_submissions').select('*').eq('request_id',rid).single();
    if(error||!row) return json(res,404,{error:'Solicitud no encontrada.'});
    if(!row.cover_uploaded) return json(res,409,{error:'La portada todavía no está lista.'});
    if(['paid','email_sent','payment_processing'].includes(row.status)) return json(res,409,{error:'Esta solicitud ya fue pagada o está siendo procesada.'});
    const {token,base}=await paypalAccessToken();
    if(row.paypal_order_id){
      const check=await fetch(base+'/v2/checkout/orders/'+encodeURIComponent(row.paypal_order_id),{headers:{Authorization:'Bearer '+token}});
      if(check.ok){const o=await check.json();if(['CREATED','PAYER_ACTION_REQUIRED','APPROVED'].includes(o.status)) return json(res,200,{orderId:row.paypal_order_id});}
    }
    const r=await fetch(base+'/v2/checkout/orders',{
      method:'POST',
      headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','PayPal-Request-Id':rid+'-'+Date.now()},
      body:JSON.stringify({
        intent:'CAPTURE',
        purchase_units:[{
          reference_id:rid,
          custom_id:rid,
          invoice_id:rid,
          description:'Publicación de perfil en NEXO',
          amount:{currency_code:CURRENCY,value:PRICE}
        }],
        application_context:{brand_name:'NEXO',shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW'}
      })
    });
    const order=await r.json();
    if(!r.ok||!order.id) throw new Error(order?.message||'No se pudo crear la orden.');
    await db.from('nexo_submissions').update({paypal_order_id:order.id,updated_at:new Date().toISOString()}).eq('request_id',rid);
    await safeRecordSubmissionEvent(db,rid,'payment_started','Pago PayPal iniciado',{orderId:order.id,amount:PRICE,currency:CURRENCY});
    return json(res,201,{orderId:order.id});
  }catch(e){console.error(e);return json(res,500,{error:'No se pudo iniciar el pago con PayPal.'});}
}
