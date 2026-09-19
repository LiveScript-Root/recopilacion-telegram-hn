import { json, method, supabaseAdmin, paypalAccessToken, finalizePaidSubmission, PRICE, CURRENCY } from './_lib.js';

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  try{
    const event=req.body;
    if(!event?.id||!event?.event_type) return json(res,400,{error:'Evento inválido.'});
    const webhookId=process.env.PAYPAL_WEBHOOK_ID;
    if(!webhookId) return json(res,503,{error:'Webhook no configurado.'});

    const {token,base}=await paypalAccessToken();
    const verify=await fetch(base+'/v1/notifications/verify-webhook-signature',{
      method:'POST',
      headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({
        auth_algo:req.headers['paypal-auth-algo'],
        cert_url:req.headers['paypal-cert-url'],
        transmission_id:req.headers['paypal-transmission-id'],
        transmission_sig:req.headers['paypal-transmission-sig'],
        transmission_time:req.headers['paypal-transmission-time'],
        webhook_id:webhookId,
        webhook_event:event
      })
    });
    const verdict=await verify.json();
    if(!verify.ok||verdict.verification_status!=='SUCCESS') return json(res,400,{error:'Firma de webhook inválida.'});

    const db=supabaseAdmin();
    const {data:seen}=await db.from('nexo_paypal_events').select('event_id').eq('event_id',event.id).maybeSingle();
    if(seen) return json(res,200,{ok:true,duplicate:true});

    if(event.event_type==='PAYMENT.CAPTURE.COMPLETED'){
      const r=event.resource||{};
      const rid=r.custom_id||r.invoice_id||'';
      const amount=r.amount?.value;
      const currency=r.amount?.currency_code;
      if(/^NEXO-[A-F0-9]{12}$/.test(rid)&&amount===PRICE&&currency===CURRENCY){
        await finalizePaidSubmission(rid,{
          orderId:r.supplementary_data?.related_ids?.order_id||'',
          captureId:r.id||'',
          payerEmail:r.payer?.email_address||'',
          amount,
          currency,
          paidAt:r.create_time||new Date().toISOString()
        });
      }
    }

    if(event.event_type==='PAYMENT.CAPTURE.REFUNDED'){
      const captureId=event.resource?.supplementary_data?.related_ids?.capture_id||event.resource?.id||'';
      if(captureId) await db.from('nexo_submissions').update({status:'refunded',updated_at:new Date().toISOString()}).eq('paypal_capture_id',captureId);
    }

    const {error:eventError}=await db.from('nexo_paypal_events').insert({event_id:event.id,event_type:event.event_type});
    if(eventError&&eventError.code!=='23505') throw eventError;
    return json(res,200,{ok:true});
  }catch(e){
    console.error(e);
    return json(res,500,{error:'No se pudo procesar el webhook.'});
  }
}
