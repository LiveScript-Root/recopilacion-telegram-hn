import { json, method, clean, supabaseAdmin, paypalAccessToken, finalizePaidSubmission, PRICE, CURRENCY } from './_lib.js';

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  try{
    const rid=clean(req.body?.requestId,40);
    const orderId=clean(req.body?.orderId,80);
    if(!/^NEXO-[A-F0-9]{12}$/.test(rid)||!orderId) return json(res,400,{error:'Datos de pago inválidos.'});

    const db=supabaseAdmin();
    const {data:row,error}=await db.from('nexo_submissions').select('*').eq('request_id',rid).single();
    if(error||!row) return json(res,404,{error:'Solicitud no encontrada.'});
    if(row.paypal_order_id!==orderId) return json(res,409,{error:'La orden no corresponde a esta solicitud.'});
    if(row.status==='email_sent') return json(res,200,{ok:true,requestId:rid,status:'email_sent',transactionId:row.paypal_capture_id});

    const {token,base}=await paypalAccessToken();
    const resp=await fetch(base+'/v2/checkout/orders/'+encodeURIComponent(orderId)+'/capture',{
      method:'POST',
      headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','PayPal-Request-Id':'capture-'+rid}
    });
    let order=await resp.json();
    if(!resp.ok&&order?.name!=='ORDER_ALREADY_CAPTURED') throw new Error(order?.message||'No se pudo capturar el pago.');
    if(order?.name==='ORDER_ALREADY_CAPTURED'){
      const existing=await fetch(base+'/v2/checkout/orders/'+encodeURIComponent(orderId),{headers:{Authorization:'Bearer '+token}});
      order=await existing.json();
    }

    if(order.status!=='COMPLETED') return json(res,409,{error:'PayPal todavía no confirmó el pago.',status:order.status});
    const unit=order.purchase_units?.[0];
    const cap=unit?.payments?.captures?.[0];
    const amount=cap?.amount?.value||unit?.amount?.value;
    const currency=cap?.amount?.currency_code||unit?.amount?.currency_code;
    const customId=unit?.custom_id||unit?.invoice_id||unit?.reference_id;
    if(customId!==rid||amount!==PRICE||currency!==CURRENCY){
      return json(res,409,{error:'Los datos del pago no coinciden con la solicitud.'});
    }

    const record=await finalizePaidSubmission(rid,{
      orderId,
      captureId:cap?.id||'',
      payerEmail:order.payer?.email_address||'',
      amount,
      currency,
      paidAt:cap?.create_time||new Date().toISOString()
    });
    return json(res,200,{ok:true,requestId:rid,status:record?.status||'paid',transactionId:cap?.id||''});
  }catch(e){
    console.error(e);
    return json(res,500,{error:'El pago fue recibido, pero no se pudo completar la confirmación automática. No vuelvas a pagar; soporte puede revisar la transacción.'});
  }
}
