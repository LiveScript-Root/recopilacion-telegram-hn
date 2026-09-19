import { json, method, adminAuthorized, sameOrigin } from './_lib.js';
import { createChallenge } from './_passkeys.js';

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  if(!adminAuthorized(req)) return json(res,401,{error:'Acceso no autorizado.'});
  if(!sameOrigin(req)) return json(res,403,{error:'Origen no permitido.'});
  try{
    const {options}=await createChallenge(req,res,'register');
    return json(res,200,options);
  }catch(e){console.error(e);return json(res,500,{error:'No se pudo preparar la Passkey.'});}
}
