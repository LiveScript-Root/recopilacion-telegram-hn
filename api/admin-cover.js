import { method, adminAuthorized, clean, supabaseAdmin, loadCoverBuffer } from './_lib.js';

const PAID_STATES=new Set(['paid','email_sent','email_error','payment_processing']);

export default async function handler(req,res){
  if(!method(req,res,['GET'])) return;
  if(!adminAuthorized(req)){res.status(401).json({error:'Acceso no autorizado.'});return;}
  try{
    const rid=clean(req.query?.requestId,40);
    if(!/^NEXO-[A-F0-9]{12}$/.test(rid)){res.status(400).json({error:'Solicitud inválida.'});return;}
    const db=supabaseAdmin();
    const {data:r,error}=await db.from('nexo_submissions').select('*').eq('request_id',rid).single();
    if(error||!r){res.status(404).json({error:'Solicitud no encontrada.'});return;}
    if(!PAID_STATES.has(r.status)){res.status(409).json({error:'La foto estará disponible para descarga cuando el pago esté confirmado.'});return;}
    const buffer=await loadCoverBuffer(db,r);
    if(!buffer){res.status(404).json({error:'La solicitud no tiene una foto disponible.'});return;}
    const mime=r.cover_mime||'application/octet-stream';
    const name=(r.cover_name||('portada-'+rid+'.jpg')).replace(/[^A-Za-z0-9._-]+/g,'-');
    res.status(200);
    res.setHeader('Content-Type',mime);
    res.setHeader('Content-Disposition',`attachment; filename="${name}"`);
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.end(buffer);
  }catch(error){
    console.error(error);
    if(!res.headersSent)res.status(500).json({error:'No se pudo descargar la foto.'});
  }
}
