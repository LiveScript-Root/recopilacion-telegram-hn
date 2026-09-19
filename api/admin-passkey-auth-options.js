import { json, method, sameOrigin } from './_lib.js';
import { createChallenge } from './_passkeys.js';

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  if(!sameOrigin(req)) return json(res,403,{error:'Origen no permitido.'});
  try{
    const {options,keys}=await createChallenge(req,res,'authenticate');
    if(!keys.length) return json(res,404,{error:'No hay Passkeys registradas.'});
    return json(res,200,options);
  }catch(e){console.error(e);return json(res,500,{error:'No se pudo preparar el acceso con Passkey.'});}
}
