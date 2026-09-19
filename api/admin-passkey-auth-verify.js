import { json, method, sameOrigin } from './_lib.js';
import { verifyAuthentication } from './_passkeys.js';

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  if(!sameOrigin(req)) return json(res,403,{error:'Origen no permitido.'});
  try{
    await verifyAuthentication(req,res,req.body?.response);
    return json(res,200,{ok:true});
  }catch(e){console.error(e);return json(res,401,{error:e.message||'Passkey no válida.'});}
}
