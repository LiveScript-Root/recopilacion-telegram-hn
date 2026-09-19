import { json, method, adminAuthorized, clean, supabaseAdmin, loadCoverBuffer, sendEmails } from './_lib.js';

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  if(!adminAuthorized(req)) return json(res,401,{error:'Acceso no autorizado.'});
  try{
    const rid=clean(req.body?.requestId,40);
    const db=supabaseAdmin();
    const {data:r,error}=await db.from('nexo_submissions').select('*').eq('request_id',rid).single();
    if(error||!r) return json(res,404,{error:'Solicitud no encontrada.'});
    if(!['paid','email_sent','email_error','payment_processing'].includes(r.status)) return json(res,409,{error:'La solicitud todavía no tiene un pago confirmado.'});

    const cover=await loadCoverBuffer(db,r);
    await sendEmails(r,cover);
    await db.from('nexo_submissions').update({
      status:'email_sent',
      emails_sent_at:new Date().toISOString(),
      email_error:null,
      updated_at:new Date().toISOString()
    }).eq('request_id',rid);
    return json(res,200,{ok:true});
  }catch(e){
    console.error(e);
    return json(res,500,{error:'No se pudieron reenviar los correos.'});
  }
}
