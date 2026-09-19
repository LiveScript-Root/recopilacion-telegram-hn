import { json, method, adminAuthorized, clean, sameOrigin, supabaseAdmin, BUCKET } from './_lib.js';

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  if(!adminAuthorized(req)) return json(res,401,{error:'Acceso no autorizado.'});
  if(!sameOrigin(req)) return json(res,403,{error:'Origen no permitido.'});
  try{
    const rid=clean(req.body?.requestId,40);
    const confirmation=clean(req.body?.confirmation,80);
    if(!/^NEXO-[A-F0-9]{12}$/.test(rid)||confirmation!==rid) return json(res,400,{error:'Confirmación inválida.'});
    const db=supabaseAdmin();
    const {data:row,error:getError}=await db.from('nexo_submissions').select('request_id,cover_path').eq('request_id',rid).single();
    if(getError||!row) return json(res,404,{error:'Solicitud no encontrada.'});
    if(row.cover_path) await db.storage.from(BUCKET).remove([row.cover_path]);
    const {error}=await db.from('nexo_submissions').delete().eq('request_id',rid);
    if(error) throw error;
    return json(res,200,{ok:true});
  }catch(e){
    console.error(e);
    return json(res,500,{error:'No se pudo eliminar la solicitud.'});
  }
}
