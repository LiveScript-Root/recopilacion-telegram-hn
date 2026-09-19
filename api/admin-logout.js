import { json, method, clearAdminSession, sameOrigin } from './_lib.js';

export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  if(!sameOrigin(req)) return json(res,403,{error:'Origen no permitido.'});
  clearAdminSession(res);
  return json(res,200,{ok:true});
}
