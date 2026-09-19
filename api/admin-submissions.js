import { json, method, adminAuthorized, supabaseAdmin, BUCKET } from './_lib.js';

export default async function handler(req,res){
  if(!method(req,res,['GET'])) return;
  if(!adminAuthorized(req)) return json(res,401,{error:'Acceso no autorizado.'});
  try{
    const db=supabaseAdmin();
    const {data,error}=await db.from('nexo_submissions').select('*').order('created_at',{ascending:false}).limit(100);
    if(error) throw error;
    const rows=await Promise.all((data||[]).map(async r=>{
      let coverUrl=null;
      if(r.cover_path){
        const {data:signed}=await db.storage.from(BUCKET).createSignedUrl(r.cover_path,900);
        coverUrl=signed?.signedUrl||null;
      }
      return {...r,cover_url:coverUrl};
    }));
    return json(res,200,{submissions:rows});
  }catch(e){
    console.error(e);
    return json(res,500,{error:'No se pudieron cargar las solicitudes.'});
  }
}
