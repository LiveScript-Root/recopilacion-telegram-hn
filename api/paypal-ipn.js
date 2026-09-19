import { clean, supabaseAdmin, finalizePaidSubmission, CURRENCY, safeRecordSubmissionEvent } from './_lib.js';

export default async function handler(req,res){
  // PayPal requires a fast 200 acknowledgment. We still validate the message
  // cryptographically with PayPal before changing any NEXO record.
  res.status(200);
  res.setHeader('Content-Type','text/plain; charset=utf-8');

  try{
    const raw=Buffer.isBuffer(req.body)?req.body.toString('utf8'):String(req.body||'');
    if(!raw){res.end('OK');return;}

    const verifyUrl=process.env.PAYPAL_ENV==='sandbox'
      ?'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
      :'https://ipnpb.paypal.com/cgi-bin/webscr';

    const verification=await fetch(verifyUrl,{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'NEXO-PayPal-IPN/1.0'},
      body:'cmd=_notify-validate&'+raw
    });
    const verdict=(await verification.text()).trim();
    if(!verification.ok||verdict!=='VERIFIED'){
      console.error('PayPal IPN no verificado:',verification.status,verdict);
      res.end('OK');return;
    }

    const p=new URLSearchParams(raw);
    const rid=clean(p.get('custom'),40);
    const txnId=clean(p.get('txn_id'),100);
    const status=clean(p.get('payment_status'),40);
    const amount=clean(p.get('mc_gross'),30);
    const currency=clean(p.get('mc_currency'),10);
    const payerEmail=clean(p.get('payer_email'),254);
    const receiverEmail=clean(p.get('receiver_email'),254).toLowerCase();
    const expectedReceiver=clean(process.env.PAYPAL_RECEIVER_EMAIL,254).toLowerCase();
    const expectedAmount=Number(process.env.PAYPAL_HOSTED_AMOUNT||'1.00').toFixed(2);
    const receivedAmount=Number(amount||0).toFixed(2);

    if(!/^NEXO-[A-F0-9]{12}$/.test(rid)||!txnId){
      console.error('PayPal IPN sin referencia NEXO válida.');
      res.end('OK');return;
    }
    if(expectedReceiver&&receiverEmail!==expectedReceiver){
      console.error('PayPal IPN para un destinatario distinto.');
      res.end('OK');return;
    }
    if(currency!==CURRENCY||receivedAmount!==expectedAmount){
      console.error('PayPal IPN con importe o moneda no esperados.',receivedAmount,currency);
      res.end('OK');return;
    }

    const db=supabaseAdmin();
    const eventId='IPN:'+txnId+':'+status;
    const {data:seen}=await db.from('nexo_paypal_events').select('event_id').eq('event_id',eventId).maybeSingle();
    if(seen){res.end('OK');return;}

    if(status==='Completed'){
      try{
        await finalizePaidSubmission(rid,{
          orderId:clean(p.get('parent_txn_id'),100)||'',
          captureId:txnId,
          payerEmail,
          amount:receivedAmount,
          currency,
          paidAt:new Date().toISOString()
        });
      }catch(error){
        // finalizePaidSubmission can fail only while sending email after the payment
        // has already been safely recorded. Never make PayPal retry because of email.
        console.error('Pago confirmado; correo pendiente:',error);
      }
      await safeRecordSubmissionEvent(db,rid,'paypal_ipn_confirmed','Pago confirmado automáticamente por PayPal',{transactionId:txnId,amount:receivedAmount,currency});
    }

    if(['Refunded','Reversed','Reversed-Reversal'].includes(status)){
      await db.from('nexo_submissions').update({status:'refunded',updated_at:new Date().toISOString()}).eq('paypal_capture_id',txnId);
    }

    const {error:eventError}=await db.from('nexo_paypal_events').insert({event_id:eventId,event_type:'IPN_'+status});
    if(eventError&&eventError.code!=='23505') console.error('Registro IPN:',eventError);
    res.end('OK');
  }catch(error){
    console.error('PayPal IPN:',error);
    if(!res.writableEnded)res.end('OK');
  }
}
