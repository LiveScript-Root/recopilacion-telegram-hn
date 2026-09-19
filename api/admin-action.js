import { json, method, adminAuthorized, clean, sameOrigin, supabaseAdmin, safeRecordSubmissionEvent } from './_lib.js';

const ACTIONS=new Set(['mark_viewed','reviewing','published','rejected','reset_review']);

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  if(!adminAuthorized(req)) return json(res,401,{error:'Acceso no autorizado.'});
  if(!sameOrigin(req)) return json(res,403,{error:'Origen no permitido.'});
  try{
    const rid=clean(req.body?.requestId,40);
    const action=clean(req.body?.action,40);
    const note=clean(req.body?.note,1200);
    if(!/^NEXO-[A-F0-9]{12}$/.test(rid)||!ACTIONS.has(action)) return json(res,400,{error:'Acción inválida.'});
    const db=supabaseAdmin();
    const now=new Date().toISOString();
    const updates={updated_at:now};
    let label='Actualización administrativa';
    if(action==='mark_viewed'){updates.admin_viewed_at=now;label='Solicitud marcada como vista';}
    if(action==='reviewing'){updates.review_status='reviewing';updates.review_started_at=now;updates.admin_viewed_at=now;label='Solicitud en revisión';}
    if(action==='published'){updates.review_status='published';updates.published_at=now;updates.admin_viewed_at=now;label='Solicitud marcada como publicada';}
    if(action==='rejected'){updates.review_status='rejected';updates.rejected_at=now;updates.admin_viewed_at=now;label='Solicitud rechazada';}
    if(action==='reset_review'){updates.review_status='new';updates.review_started_at=null;updates.published_at=null;updates.rejected_at=null;label='Estado de revisión reiniciado';}
    if(note) updates.admin_notes=note;
    const {data,error}=await db.from('nexo_submissions').update(updates).eq('request_id',rid).select('*').single();
    if(error||!data) return json(res,404,{error:'Solicitud no encontrada.'});
    await safeRecordSubmissionEvent(db,rid,'admin_'+action,label,note?{note}:{});
    return json(res,200,{ok:true,submission:data});
  }catch(e){
    console.error(e);
    return json(res,500,{error:'No se pudo actualizar la solicitud.'});
  }
}
