import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin, BUCKET } from './api/_lib.js';

import publicConfig from './api/public-config.js';
import submissions from './api/submissions.js';
import submissionsCover from './api/submissions-cover.js';
import submissionStatus from './api/submission-status.js';
import paypalCreateOrder from './api/paypal-create-order.js';
import paypalCaptureOrder from './api/paypal-capture-order.js';
import paypalWebhook from './api/paypal-webhook.js';
import adminSubmissions from './api/admin-submissions.js';
import adminResend from './api/admin-resend.js';
import adminResendSubmission from './api/admin-resend-submission.js';
import health from './api/health.js';

const app=express();
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const webRoot=path.join(__dirname,'nexo-production');

app.disable('x-powered-by');
app.set('trust proxy',1);
app.use(express.json({limit:'1mb'}));

app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=(self)');
  res.setHeader('Cross-Origin-Opener-Policy','same-origin-allow-popups');
  res.setHeader('Content-Security-Policy',"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.paypal.com https://www.paypalobjects.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co https://www.paypal.com https://www.paypalobjects.com; connect-src 'self' https://*.supabase.co https://www.paypal.com https://*.paypal.com; frame-src https://www.paypal.com https://*.paypal.com; form-action 'self' https://www.paypal.com; font-src 'self' data:; upgrade-insecure-requests");
  next();
});

function api(handler){ return (req,res)=>Promise.resolve(handler(req,res)).catch(err=>{console.error(err);if(!res.headersSent)res.status(500).json({error:'Error interno.'})}); }
app.get('/api/public-config',api(publicConfig));
app.post('/api/submissions',api(submissions));
app.post('/api/submissions-cover',api(submissionsCover));
app.get('/api/submission-status',api(submissionStatus));
app.post('/api/paypal-create-order',api(paypalCreateOrder));
app.post('/api/paypal-capture-order',api(paypalCaptureOrder));
app.post('/api/paypal-webhook',api(paypalWebhook));
app.get('/api/admin-submissions',api(adminSubmissions));
app.post('/api/admin-resend',api(adminResend));
app.post('/api/admin-resend-submission',api(adminResendSubmission));
app.get('/api/health',api(health));

app.use(['/admin','/admin/','/anunciar','/anunciar/','/pago','/pago/','/solicitud-recibida','/solicitud-recibida/'],(req,res,next)=>{
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Pragma','no-cache');
  next();
});
app.use('/assets',express.static(path.join(__dirname,'assets'),{maxAge:'7d',immutable:true}));
app.use(express.static(webRoot,{extensions:['html'],maxAge:'5m'}));

const page=(route,file)=>app.get(route,(req,res)=>res.sendFile(path.join(webRoot,file)));
page('/','index.html');
page('/anunciar/','anunciar/index.html');
page('/pago/','pago/index.html');
page('/solicitud-recibida/','solicitud-recibida/index.html');
page('/contacto/','contacto/index.html');
page('/eliminacion/','eliminacion/index.html');
page('/terminos/','terminos/index.html');
page('/privacidad/','privacidad/index.html');
page('/admin/','admin/index.html');

app.use((req,res)=>res.status(404).sendFile(path.join(webRoot,'404.html')));

const port=Number(process.env.PORT||3000);
app.listen(port,'0.0.0.0',()=>{
  console.log('NEXO listening on '+port);
  setTimeout(async()=>{
    try{
      const key=process.env.ADMIN_ACCESS_TOKEN||'';
      if(!key) throw new Error('ADMIN_ACCESS_TOKEN ausente');
      const r=await fetch('http://127.0.0.1:'+port+'/api/admin-submissions',{
        headers:{'X-Admin-Key':key,'Accept':'application/json'}
      });
      if(r.status!==200){
        const body=await r.text();
        throw new Error('HTTP '+r.status+' '+body.slice(0,240));
      }
      const data=await r.json();
      if(!Array.isArray(data.submissions)) throw new Error('Respuesta administrativa inválida');
      console.log('NEXO admin self-check: OK ('+data.submissions.length+' solicitudes)');

      if(process.env.NEXO_DEEP_SELF_TEST==='1'){
        let rid='',coverPath='';
        try{
          const payload={
            profileName:'NEXO PRUEBA AUTOMATICA',
            telegramLink:'https://t.me/nexoe2e',
            email:process.env.ADMIN_EMAIL||'soportepagoseguros@gmail.com',
            contactTelegram:'@nexoe2e',
            relation:'Administrador/a autorizado/a',
            note:'Prueba automática interna. Se elimina al terminar.',
            coverName:'nexo-e2e.png',
            coverMime:'image/png',
            coverSize:68,
            authorized:true,
            adult:true
          };
          const createResp=await fetch('http://127.0.0.1:'+port+'/api/submissions',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(payload)
          });
          const created=await createResp.json();
          if(createResp.status!==201||!created.requestId||!created.uploadToken) throw new Error('Crear solicitud: HTTP '+createResp.status+' '+JSON.stringify(created));
          rid=created.requestId;coverPath=created.coverPath;

          const publicDb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
          const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
          const {error:uploadError}=await publicDb.storage.from(BUCKET).uploadToSignedUrl(coverPath,created.uploadToken,png,{contentType:'image/png'});
          if(uploadError) throw uploadError;

          const confirmResp=await fetch('http://127.0.0.1:'+port+'/api/submissions-cover',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({requestId:rid})
          });
          const confirmed=await confirmResp.json();
          if(confirmResp.status!==200||confirmed.ok!==true) throw new Error('Confirmar portada: HTTP '+confirmResp.status+' '+JSON.stringify(confirmed));

          const statusResp=await fetch('http://127.0.0.1:'+port+'/api/submission-status?requestId='+encodeURIComponent(rid));
          const status=await statusResp.json();
          if(statusResp.status!==200||status.requestId!==rid||status.status!=='pending_payment') throw new Error('Estado solicitud inválido: '+JSON.stringify(status));

          const db=supabaseAdmin();
          const {data:row,error:rowError}=await db.from('nexo_submissions').select('request_id,cover_uploaded,cover_path,submission_notified_at,submission_email_error').eq('request_id',rid).single();
          if(rowError||!row||row.cover_uploaded!==true) throw rowError||new Error('La portada no quedó confirmada.');

          console.log('NEXO deep self-check: OK ('+rid+', email='+(row.submission_notified_at?'sent':row.submission_email_error?'pending':'unknown')+')');
        }catch(error){
          console.error('NEXO deep self-check: FAILED',error);
        }finally{
          try{
            const db=supabaseAdmin();
            if(coverPath) await db.storage.from(BUCKET).remove([coverPath]);
            if(rid) await db.from('nexo_submissions').delete().eq('request_id',rid);
          }catch(cleanupError){
            console.error('NEXO deep self-check cleanup: FAILED',cleanupError);
          }
        }
      }
    }catch(error){
      console.error('NEXO admin self-check: FAILED',error);
    }
  },1500);
});
