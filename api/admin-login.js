import { json, method, adminKeyMatches, adminSessionValid, createAdminSession, sameOrigin } from './_lib.js';

export default async function handler(req,res){
  if(!method(req,res,['GET','POST'])) return;
  if(req.method==='GET'){
    return json(res,200,{authenticated:adminSessionValid(req)});
  }
  if(!sameOrigin(req)) return json(res,403,{error:'Origen no permitido.'});
  const key=typeof req.body?.key==='string'?req.body.key:'';
  if(!adminKeyMatches(key)) return json(res,401,{error:'Clave incorrecta.'});
  const expiresAt=createAdminSession(res,30);
  return json(res,200,{ok:true,expiresAt});
}
