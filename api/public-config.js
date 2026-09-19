import { json, method, PRICE, CURRENCY } from './_lib.js';
export default async function handler(req,res){
  if(!method(req,res,['GET'])) return;
  const supabaseUrl=process.env.SUPABASE_URL||'';
  const supabaseAnonKey=process.env.SUPABASE_ANON_KEY||'';
  const paypalClientId=process.env.PAYPAL_CLIENT_ID||'';
  if(!supabaseUrl||!supabaseAnonKey||!paypalClientId) return json(res,503,{error:'El servicio no está configurado.'});
  const paypalHostedAmount=process.env.PAYPAL_HOSTED_AMOUNT||PRICE;
  const paypalHostedButtonId=process.env.PAYPAL_HOSTED_BUTTON_ID||'WCC2TYW6EW2R2';
  return json(res,200,{supabaseUrl,supabaseAnonKey,paypalClientId,price:PRICE,currency:CURRENCY,paypalEnv:process.env.PAYPAL_ENV==='sandbox'?'sandbox':'live',paypalHostedAmount,paypalHostedButtonId});
}
