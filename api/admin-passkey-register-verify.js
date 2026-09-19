import { json, method, adminAuthorized, sameOrigin, clean } from './_lib.js';
import { verifyRegistration } from './_passkeys.js';

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  if(!adminAuthorized(req)) return json(res,401,{error:'Acceso no autorizado.'});
  if(!sameOrigin(req)) return json(res,403,{error:'Origen no permitido.'});
  try{
    await verifyRegistration(req,res,req.body?.response,clean(req.body?.deviceName,120));
    return json(res,200,{ok:true});
  }catch(e){console.error(e);return json(res,400,{error:e.message||'No se pudo registrar la Passkey.'});}
}
