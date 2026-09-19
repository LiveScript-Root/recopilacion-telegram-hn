import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
app.listen(port,'0.0.0.0',()=>console.log('NEXO listening on '+port));
