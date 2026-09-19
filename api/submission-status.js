import { json, method, clean, supabaseAdmin } from './_lib.js';
export default async function handler(req,res){
  if(!method(req,res,['GET'])) return;
  try{
    const rid=clean(req.query?.requestId,40);
    if(!/^NEXO-[A-F0-9]{12}$/.test(rid)) return json(res,400,{error:'Solicitud inválida.'});
    const db=supabaseAdmin();
    const {data,error}=await db.from('nexo_submissions').select('request_id,status,payment_amount,payment_currency,paypal_capture_id,paid_at,emails_sent_at').eq('request_id',rid).single();
    if(error||!data) return json(res,404,{error:'Solicitud no encontrada.'});
    return json(res,200,{requestId:data.request_id,status:data.status,amount:data.payment_amount,currency:data.payment_currency,transactionId:data.paypal_capture_id,paidAt:data.paid_at,emailSent:!!data.emails_sent_at});
  }catch(e){console.error(e);return json(res,500,{error:'No se pudo consultar la solicitud.'});}
}
