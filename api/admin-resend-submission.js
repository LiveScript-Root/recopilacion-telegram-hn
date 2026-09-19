import { json, method, adminAuthorized, clean, supabaseAdmin, loadCoverBuffer, sendSubmissionReceivedAdmin, safeRecordSubmissionEvent, sameOrigin } from './_lib.js';

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  if(!adminAuthorized(req)) return json(res,401,{error:'Acceso no autorizado.'});
  if(!sameOrigin(req)) return json(res,403,{error:'Origen no permitido.'});
  try{
    const rid=clean(req.body?.requestId,40);
    if(!/^NEXO-[A-F0-9]{12}$/.test(rid)) return json(res,400,{error:'Solicitud inválida.'});
    const db=supabaseAdmin();
    const {data:r,error}=await db.from('nexo_submissions').select('*').eq('request_id',rid).single();
    if(error||!r) return json(res,404,{error:'Solicitud no encontrada.'});
    const cover=await loadCoverBuffer(db,r);
    await sendSubmissionReceivedAdmin(r,cover);
    await db.from('nexo_submissions').update({
      submission_notified_at:new Date().toISOString(),
      submission_email_error:null,
      updated_at:new Date().toISOString()
    }).eq('request_id',rid);
    await safeRecordSubmissionEvent(db,rid,'submission_email_resent','Aviso inicial reenviado');
    return json(res,200,{ok:true});
  }catch(e){
    console.error(e);
    return json(res,500,{error:'No se pudo reenviar el aviso de la solicitud.'});
  }
}
