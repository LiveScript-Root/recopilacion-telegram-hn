import { json, method, adminAuthorized, clean, supabaseAdmin } from './_lib.js';

export default async function handler(req,res){
  if(!method(req,res,['GET'])) return;
  if(!adminAuthorized(req)) return json(res,401,{error:'Acceso no autorizado.'});
  try{
    const rid=clean(req.query?.requestId,40);
    if(!/^NEXO-[A-F0-9]{12}$/.test(rid)) return json(res,400,{error:'Solicitud inválida.'});
    const db=supabaseAdmin();
    const {data,error}=await db.from('nexo_submission_events').select('*').eq('request_id',rid).order('created_at',{ascending:false}).limit(100);
    if(error) throw error;
    return json(res,200,{events:data||[]});
  }catch(e){
    console.error(e);
    return json(res,500,{error:'No se pudo cargar el historial.'});
  }
}
