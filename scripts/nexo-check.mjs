import fs from 'node:fs';
import { adminAuthorized } from '../api/_lib.js';

const mustExist = [
  'nexo-production/index.html',
  'nexo-production/anunciar/index.html',
  'nexo-production/pago/index.html',
  'nexo-production/solicitud-recibida/index.html',
  'nexo-production/admin/index.html',
  'api/_lib.js',
  'api/public-config.js',
  'api/submissions.js',
  'api/submissions-cover.js',
  'api/submission-status.js',
  'api/paypal-create-order.js',
  'api/paypal-capture-order.js',
  'api/paypal-webhook.js',
  'api/paypal-ipn.js',
  'api/admin-submissions.js',
  'api/admin-resend.js',
  'api/admin-resend-submission.js',
  'api/admin-passkey-auth-verify.js',
  'api/admin-passkey-auth-options.js',
  'api/admin-passkey-register-verify.js',
  'api/admin-passkey-register-options.js',
  'api/admin-receipt.js',
  'api/admin-cover.js',
  'api/admin-delete.js',
  'api/admin-events.js',
  'api/admin-action.js',
  'api/admin-logout.js',
  'api/admin-login.js',
  'supabase/schema.sql',
  'vercel.json',
  '.env.example'
];
for (const p of mustExist) {
  if (!fs.existsSync(p)) throw new Error('Falta archivo: '+p);
}

const all = mustExist.filter(p=>p.endsWith('.html')||p.endsWith('.js')||p.endsWith('.sql')||p.endsWith('.json')).map(p=>fs.readFileSync(p,'utf8')).join('\n');
for (const bad of ['Go Live','pago de prueba','paypal.me/AlfaroBarahona','rapidopago@outlook.com','SoporteTelegramHN']) {
  if (all.includes(bad)) throw new Error('Referencia no permitida: '+bad);
}

const announce=fs.readFileSync('nexo-production/anunciar/index.html','utf8');
if (!announce.includes('/api/submissions') || !announce.includes('uploadToSignedUrl') || !announce.includes('/api/submissions-cover')) throw new Error('El formulario no persiste solicitud + portada antes del pago.');

const payment=fs.readFileSync('nexo-production/pago/index.html','utf8');
if (!payment.includes('/api/paypal-create-order') || !payment.includes('/api/paypal-capture-order')) throw new Error('Pago no usa Orders API.');
if (!payment.includes('paypal-standard-form') || !payment.includes('hosted_button_id') || !payment.includes('/api/paypal-ipn')) throw new Error('Falta el respaldo PayPal asociado por IPN.');

const received=fs.readFileSync('nexo-production/solicitud-recibida/index.html','utf8');
if (!received.includes('/api/submission-status')) throw new Error('La página de retorno no verifica estado server-side.');
if (received.includes("st==='COMPLETED'")) throw new Error('La página de retorno confía en query string de PayPal.');

const admin=fs.readFileSync('nexo-production/admin/index.html','utf8');
if (!admin.includes('/api/admin-submissions') || !admin.includes('/api/admin-resend')) throw new Error('Panel admin incompleto.');
for (const term of ['/api/admin-login','/api/admin-logout','/api/admin-action','/api/admin-events','/api/admin-delete','/api/admin-receipt','/api/admin-cover','Exportar CSV','En revisión','Publicada','Descargar foto','PDF con foto']) { if (!admin.includes(term)) throw new Error('Mejora administrativa ausente: '+term); }
if (admin.includes('Reenviar aviso inicial')) throw new Error('El botón de aviso inicial no debe mostrarse.');
if (admin.includes('You can only send testing emails')) throw new Error('El panel no debe mostrar errores técnicos en inglés.');

const preview=fs.readFileSync('nexo-production/anunciar/index.html','utf8');
for (const term of ['Vista previa','previewImage','previewName','previewPlaceholder']) {
  if (!preview.includes(term)) throw new Error('Vista previa incompleta: '+term);
}


for (const [name,html] of [['admin',admin],['anunciar',preview]]) {
  const styles=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]);
  for (const css of styles) {
    const opens=(css.match(/{/g)||[]).length;
    const closes=(css.match(/}/g)||[]).length;
    if (opens!==closes) throw new Error('CSS desbalanceado en '+name+': '+opens+' llaves abren y '+closes+' cierran.');
  }
}

const originalAdminToken=process.env.ADMIN_ACCESS_TOKEN;
process.env.ADMIN_ACCESS_TOKEN='NEXO-CI-AUTH-TEST';
if (!adminAuthorized({headers:{'x-admin-key':'NEXO-CI-AUTH-TEST'}})) throw new Error('Autenticación administrativa rechaza una clave correcta.');
if (adminAuthorized({headers:{'x-admin-key':'clave-incorrecta'}})) throw new Error('Autenticación administrativa acepta una clave incorrecta.');
if (originalAdminToken===undefined) delete process.env.ADMIN_ACCESS_TOKEN;
else process.env.ADMIN_ACCESS_TOKEN=originalAdminToken;

const scriptRe = new RegExp('<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>', 'gi');
for (const [name,html] of [['admin',admin],['anunciar',preview],['pago',payment],['solicitud-recibida',received]]) {
  const scripts=[...html.matchAll(scriptRe)].map(m=>m[1]).filter(Boolean);
  for (const source of scripts) {
    try { new Function(source); }
    catch (error) { throw new Error('JavaScript inválido en '+name+': '+error.message); }
  }
}

const schema=fs.readFileSync('supabase/schema.sql','utf8');
for (const term of ['nexo_submissions','nexo_paypal_events','cover_uploaded','nexo-submissions','nexo_submission_events','nexo_admin_passkeys','review_status']) {
  if (!schema.includes(term)) throw new Error('Schema incompleto: '+term);
}

const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
if (vercel.rewrites?.some(r=>r.source==='/admin/')) throw new Error('La ruta pública /admin/ no debe existir.');
if (!vercel.rewrites?.some(r=>r.source==='/nexo-control-9x4/')) throw new Error('Falta la ruta administrativa privada.');
if (!vercel.headers?.some(r=>JSON.stringify(r).includes('Content-Security-Policy'))) throw new Error('Falta CSP.');

console.log('NEXO production static checks: OK');
