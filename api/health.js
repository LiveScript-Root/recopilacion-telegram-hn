import { json, method } from './_lib.js';

export default async function handler(req,res){
  if(!method(req,res,['GET'])) return;
  return json(res,200,{
    ok:true,
    services:{
      supabase:Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY&&process.env.NEXO_BACKEND_SECRET),
      paypal:Boolean(process.env.PAYPAL_CLIENT_ID&&process.env.PAYPAL_CLIENT_SECRET&&process.env.PAYPAL_WEBHOOK_ID),
      email:Boolean(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM),
      admin:Boolean(process.env.ADMIN_ACCESS_TOKEN)
    }
  });
}
