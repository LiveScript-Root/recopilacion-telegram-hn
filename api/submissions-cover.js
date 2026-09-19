import { json, method, clean, supabaseAdmin, BUCKET, loadCoverBuffer, archiveSubmissionToGithub, sendSubmissionReceivedAdmin, safeRecordSubmissionEvent } from './_lib.js';
export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  try{
    const requestId=clean(req.body?.requestId,40);
    if(!/^NEXO-[A-F0-9]{12}$/.test(requestId)) return json(res,400,{error:'Solicitud inválida.'});
    const db=supabaseAdmin();
    const {data:row,error:getError}=await db.from('nexo_submissions').select('request_id,cover_path').eq('request_id',requestId).single();
    if(getError||!row) return json(res,404,{error:'Solicitud no encontrada.'});
    const folder=row.cover_path.split('/')[0];
    const file=row.cover_path.split('/').slice(1).join('/');
    const {data:list,error:listError}=await db.storage.from(BUCKET).list(folder,{search:file,limit:10});
    if(listError||!Array.isArray(list)||!list.some(x=>x.name===file)) return json(res,400,{error:'La portada todavía no terminó de cargarse.'});
    const {data:updated,error:updateError}=await db.from('nexo_submissions')
      .update({cover_uploaded:true,updated_at:new Date().toISOString()})
      .eq('request_id',requestId)
      .select('*')
      .single();
    if(updateError) throw updateError;
    await safeRecordSubmissionEvent(db,requestId,'cover_uploaded','Portada guardada');

    try{
      const cover=await loadCoverBuffer(db,updated);
      await archiveSubmissionToGithub(updated,cover,'submitted');
      await db.from('nexo_submissions').update({
        github_archive_last_at:new Date().toISOString(),
        github_archive_error:null,
        updated_at:new Date().toISOString()
      }).eq('request_id',requestId);
    }catch(archiveError){
      console.error('GitHub archive:',archiveError);
      await db.from('nexo_submissions').update({
        github_archive_error:String(archiveError.message||archiveError).slice(0,1000),
        updated_at:new Date().toISOString()
      }).eq('request_id',requestId);
    }

    try{
      const cover=await loadCoverBuffer(db,updated);
      await sendSubmissionReceivedAdmin(updated,cover);
      await db.from('nexo_submissions').update({
        submission_notified_at:new Date().toISOString(),
        submission_email_error:null,
        updated_at:new Date().toISOString()
      }).eq('request_id',requestId);
      await safeRecordSubmissionEvent(db,requestId,'submission_email_sent','Aviso inicial enviado a administración');
    }catch(emailError){
      console.error('Submission email:',emailError);
      await db.from('nexo_submissions').update({
        submission_email_error:String(emailError.message||emailError).slice(0,1000),
        updated_at:new Date().toISOString()
      }).eq('request_id',requestId);
    }

    return json(res,200,{ok:true});
  }catch(e){console.error(e);return json(res,500,{error:'No se pudo confirmar la portada.'});}
}
