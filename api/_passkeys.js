import crypto from 'node:crypto';
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { supabaseAdmin, createAdminSession } from './_lib.js';

export function requestIdentity(req){
  const proto=String(req.headers?.['x-forwarded-proto']||'https').split(',')[0].trim();
  const host=String(req.headers?.['x-forwarded-host']||req.headers?.host||'').split(',')[0].trim();
  const rpID=host.split(':')[0];
  return {rpID,origin:proto+'://'+host};
}

export async function createChallenge(req,res,type){
  const db=supabaseAdmin();
  const {rpID,origin}=requestIdentity(req);
  const {data:keys}=await db.from('nexo_admin_passkeys').select('*').order('created_at',{ascending:true});
  let options;
  if(type==='register'){
    options=await generateRegistrationOptions({
      rpName:'NEXO',
      rpID,
      userName:'Administrador NEXO',
      userDisplayName:'Administrador NEXO',
      userID:new TextEncoder().encode('nexo-admin'),
      attestationType:'none',
      excludeCredentials:(keys||[]).map(k=>({id:k.credential_id,transports:k.transports||[]})),
      authenticatorSelection:{residentKey:'preferred',userVerification:'required'}
    });
  }else{
    options=await generateAuthenticationOptions({
      rpID,
      allowCredentials:(keys||[]).map(k=>({id:k.credential_id,transports:k.transports||[]})),
      userVerification:'required'
    });
  }
  const {data:challenge,error}=await db.from('nexo_admin_challenges').insert({
    challenge:options.challenge,
    challenge_type:type,
    rp_id:rpID,
    origin,
    expires_at:new Date(Date.now()+5*60*1000).toISOString()
  }).select('*').single();
  if(error) throw error;
  res.setHeader('Set-Cookie',`nexo_passkey_challenge=${challenge.id}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=300`);
  return {options,keys:keys||[]};
}

function challengeId(req){
  const raw=String(req.headers?.cookie||'');
  for(const part of raw.split(';')){
    const [k,...rest]=part.trim().split('=');
    if(k==='nexo_passkey_challenge') return decodeURIComponent(rest.join('='));
  }
  return '';
}

export async function consumeChallenge(req,type){
  const id=challengeId(req);
  if(!id) throw new Error('Desafío de seguridad ausente.');
  const db=supabaseAdmin();
  const {data,error}=await db.from('nexo_admin_challenges').select('*').eq('id',id).eq('challenge_type',type).single();
  if(error||!data) throw new Error('Desafío de seguridad inválido.');
  await db.from('nexo_admin_challenges').delete().eq('id',id);
  if(new Date(data.expires_at).getTime()<Date.now()) throw new Error('El desafío de seguridad expiró.');
  return {db,row:data};
}

export async function verifyRegistration(req,res,response,deviceName=''){
  const {db,row}=await consumeChallenge(req,'register');
  const verification=await verifyRegistrationResponse({
    response,
    expectedChallenge:row.challenge,
    expectedOrigin:row.origin,
    expectedRPID:row.rp_id,
    requireUserVerification:true
  });
  if(!verification.verified||!verification.registrationInfo) throw new Error('No se pudo verificar la Passkey.');
  const credential=verification.registrationInfo.credential;
  const {error}=await db.from('nexo_admin_passkeys').upsert({
    credential_id:credential.id,
    public_key:Buffer.from(credential.publicKey).toString('base64'),
    counter:Number(credential.counter||0),
    transports:credential.transports||response?.response?.transports||[],
    device_name:String(deviceName||'Passkey').slice(0,120)
  },{onConflict:'credential_id'});
  if(error) throw error;
  return {verified:true};
}

export async function verifyAuthentication(req,res,response){
  const {db,row}=await consumeChallenge(req,'authenticate');
  const credentialId=String(response?.id||'');
  const {data:key,error}=await db.from('nexo_admin_passkeys').select('*').eq('credential_id',credentialId).single();
  if(error||!key) throw new Error('Passkey no registrada.');
  const verification=await verifyAuthenticationResponse({
    response,
    expectedChallenge:row.challenge,
    expectedOrigin:row.origin,
    expectedRPID:row.rp_id,
    credential:{
      id:key.credential_id,
      publicKey:Buffer.from(key.public_key,'base64'),
      counter:Number(key.counter||0),
      transports:key.transports||[]
    },
    requireUserVerification:true
  });
  if(!verification.verified) throw new Error('No se pudo verificar la Passkey.');
  await db.from('nexo_admin_passkeys').update({
    counter:Number(verification.authenticationInfo.newCounter||key.counter||0),
    last_used_at:new Date().toISOString()
  }).eq('credential_id',credentialId);
  createAdminSession(res,30);
  res.setHeader('X-NEXO-Passkey','verified');
  return {verified:true};
}
