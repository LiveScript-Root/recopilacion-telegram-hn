import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'node:crypto';

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'soportepagoseguros@gmail.com';
export const BUCKET = 'nexo-submissions';
export const PRICE = '12.00';
export const CURRENCY = 'USD';

export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.end(JSON.stringify(body));
}

export function method(req, res, allowed) {
  if (!allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '));
    json(res, 405, { error: 'Método no permitido.' });
    return false;
  }
  return true;
}

export function clean(value, max = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function validEmail(v) {
  const x = clean(v, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) ? x : null;
}

export function validTelegramLink(v) {
  try {
    const u = new URL(clean(v, 300));
    if (u.protocol !== 'https:' || !['t.me', 'telegram.me'].includes(u.hostname.toLowerCase())) return null;
    if (u.username || u.password || u.port || u.search || u.hash) return null;
    if (!/^\/(?:\+[A-Za-z0-9_-]+|joinchat\/[A-Za-z0-9_-]+|[A-Za-z][A-Za-z0-9_]{4,31})\/?$/.test(u.pathname)) return null;
    return 'https://t.me' + u.pathname;
  } catch { return null; }
}

export function validTelegramUser(v) {
  const name = clean(v, 40).replace(/^@/, '');
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(name) ? '@' + name : null;
}

export function requestId() {
  return 'NEXO-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

export function safeFilename(name, mime) {
  const ext = mime === 'image/png' ? '.png' : mime === 'image/webp' ? '.webp' : '.jpg';
  const base = clean(name, 120).replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'portada';
  return base.slice(0, 70) + ext;
}

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  const backendSecret = process.env.NEXO_BACKEND_SECRET;
  if (!url || !key || !backendSecret) throw new Error('Supabase no está configurado.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { 'x-nexo-backend-secret': backendSecret } } });
}

export function adminAuthorized(req) {
  const expected = process.env.ADMIN_ACCESS_TOKEN || '';
  const got = clean(req.headers['x-admin-key'], 300);
  if (!expected || !got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function paypalAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error('PayPal no está configurado.');
  const base = process.env.PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  const r = await fetch(base + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(id + ':' + secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await r.json();
  if (!r.ok || !data.access_token) throw new Error('No se pudo autenticar con PayPal.');
  return { token: data.access_token, base };
}

export async function sendEmails(record, coverAttachment) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error('El servicio de correo no está configurado.');
  const resend = new Resend(apiKey);
  const support = ADMIN_EMAIL;
  const amount = Number(record.payment_amount || PRICE).toFixed(2);
  const date = record.paid_at ? new Date(record.paid_at).toLocaleString('es-US', { timeZone: 'America/Los_Angeles' }) : new Date().toLocaleString('es-US', { timeZone: 'America/Los_Angeles' });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const common = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111827">
      <div style="background:#0b1220;color:#fff;padding:24px;border-radius:14px 14px 0 0">
        <div style="font-size:22px;font-weight:800">NEXO</div>
      </div>
      <div style="border:1px solid #dbe3ef;border-top:0;padding:24px;border-radius:0 0 14px 14px">
        <h1 style="font-size:22px;margin:0 0 14px">Comprobante de pago</h1>
        <p>Pago recibido correctamente. Gracias por enviar tu solicitud para publicar un perfil en NEXO.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Número de comprobante</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:700">${esc(record.request_id)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Fecha</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(date)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Servicio</td><td style="padding:8px;border-bottom:1px solid #eee">Publicación de perfil en NEXO</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Nombre del perfil</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(record.profile_name)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Importe</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:700">$${amount} USD</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Estado</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:700">PAGADO</td></tr>
          <tr><td style="padding:8px">ID de transacción</td><td style="padding:8px">${esc(record.paypal_capture_id)}</td></tr>
        </table>
        <p>Tu solicitud ha sido recibida correctamente. Nuestro equipo revisará la información proporcionada. El proceso de revisión puede tardar hasta 3 días hábiles.</p>
        <p>La realización del pago no garantiza la publicación automática. La solicitud debe cumplir con los requisitos y condiciones de NEXO.</p>
        <p>Soporte: <a href="mailto:${support}">${support}</a></p>
      </div>
    </div>`;
  const adminHtml = `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;color:#111827">
      <h1>NEXO — Nueva publicación pagada</h1>
      <p><b>ID:</b> ${esc(record.request_id)}</p>
      <p><b>Perfil:</b> ${esc(record.profile_name)}</p>
      <p><b>Telegram:</b> <a href="${esc(record.telegram_link)}">${esc(record.telegram_link)}</a></p>
      <p><b>Correo:</b> ${esc(record.applicant_email)}</p>
      <p><b>Usuario Telegram:</b> ${esc(record.contact_telegram)}</p>
      <p><b>Relación:</b> ${esc(record.relation)}</p>
      <p><b>Información adicional:</b> ${esc(record.note || 'Sin información adicional')}</p>
      <p><b>Autorización:</b> ${record.authorized ? 'Sí' : 'No'}</p>
      <p><b>Mayoría de edad:</b> ${record.adult ? 'Sí' : 'No'}</p>
      <p><b>Importe:</b> $${amount} USD</p>
      <p><b>PayPal:</b> ${esc(record.paypal_capture_id)}</p>
      <p><b>Fecha de pago:</b> ${esc(date)}</p>
    </div>`;

  const attachment = coverAttachment ? [{ filename: record.cover_name || 'portada.jpg', content: coverAttachment.toString('base64') }] : undefined;
  const client = await resend.emails.send({
    from,
    to: [record.applicant_email],
    replyTo: support,
    subject: 'NEXO — Comprobante de pago y solicitud recibida',
    html: common
  });
  if (client.error) throw new Error('No se pudo enviar el comprobante al cliente: ' + client.error.message);

  const admin = await resend.emails.send({
    from,
    to: [support],
    replyTo: record.applicant_email,
    subject: 'NEXO — Nueva publicación pagada — ' + record.profile_name,
    html: adminHtml,
    attachments: attachment
  });
  if (admin.error) throw new Error('No se pudo enviar la solicitud a administración: ' + admin.error.message);
  return { clientId: client.data?.id, adminId: admin.data?.id };
}


async function githubArchiveRepo() {
  const token = process.env.GITHUB_ARCHIVE_TOKEN || '';
  const repo = process.env.GITHUB_ARCHIVE_REPO || '';
  if (!token || !repo) return null;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('GITHUB_ARCHIVE_REPO inválido.');

  const headers = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'NEXO-Production'
  };

  const infoResp = await fetch('https://api.github.com/repos/' + repo, { headers });
  const info = await infoResp.json().catch(() => ({}));
  if (!infoResp.ok) throw new Error('No se pudo acceder al repositorio privado de archivo.');
  if (info.private !== true) throw new Error('El repositorio de archivo de GitHub debe ser PRIVADO.');
  return { repo, headers };
}

async function githubPutPrivateFile(path, buffer, message) {
  const cfg = await githubArchiveRepo();
  if (!cfg) return { skipped: true };

  const url = 'https://api.github.com/repos/' + cfg.repo + '/contents/' + path.split('/').map(encodeURIComponent).join('/');
  let sha = null;
  const currentResp = await fetch(url, { headers: cfg.headers });
  if (currentResp.ok) {
    const current = await currentResp.json();
    sha = current.sha || null;
  } else if (currentResp.status !== 404) {
    throw new Error('No se pudo revisar el archivo existente en GitHub.');
  }

  const body = {
    message,
    content: Buffer.from(buffer).toString('base64')
  };
  if (sha) body.sha = sha;

  const putResp = await fetch(url, {
    method: 'PUT',
    headers: { ...cfg.headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const result = await putResp.json().catch(() => ({}));
  if (!putResp.ok) throw new Error(result?.message || 'No se pudo guardar la copia privada en GitHub.');
  return { skipped: false, url: result?.content?.html_url || null };
}

export async function archiveSubmissionToGithub(record, coverBuffer = null, stage = 'submitted') {
  if (!process.env.GITHUB_ARCHIVE_TOKEN || !process.env.GITHUB_ARCHIVE_REPO) return { skipped: true };
  const rid = String(record.request_id || '').replace(/[^A-Z0-9-]/g, '');
  if (!/^NEXO-[A-F0-9]{12}$/.test(rid)) throw new Error('ID de solicitud inválido para archivo.');

  const snapshot = {
    request_id: record.request_id,
    stage,
    status: record.status,
    profile_name: record.profile_name,
    telegram_link: record.telegram_link,
    applicant_email: record.applicant_email,
    contact_telegram: record.contact_telegram,
    relation: record.relation,
    note: record.note || '',
    cover_name: record.cover_name,
    cover_mime: record.cover_mime,
    cover_size: record.cover_size,
    authorized: Boolean(record.authorized),
    adult: Boolean(record.adult),
    paypal_order_id: record.paypal_order_id || null,
    paypal_capture_id: record.paypal_capture_id || null,
    paypal_payer_email: record.paypal_payer_email || null,
    payment_amount: record.payment_amount || null,
    payment_currency: record.payment_currency || null,
    paid_at: record.paid_at || null,
    created_at: record.created_at,
    updated_at: record.updated_at,
    archived_at: new Date().toISOString()
  };

  const json = Buffer.from(JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  await githubPutPrivateFile(
    'solicitudes/' + rid + '/solicitud.json',
    json,
    'NEXO: archivar ' + rid + ' (' + stage + ')'
  );

  if (coverBuffer) {
    const filename = safeFilename(record.cover_name || 'portada', record.cover_mime || 'image/jpeg');
    await githubPutPrivateFile(
      'solicitudes/' + rid + '/' + filename,
      coverBuffer,
      'NEXO: archivar portada ' + rid
    );
  }

  return { skipped: false };
}

export async function loadCoverBuffer(db, record) {
  if (!record.cover_path) return null;
  const { data, error } = await db.storage.from(BUCKET).download(record.cover_path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function finalizePaidSubmission(requestIdValue, payment) {
  const db = supabaseAdmin();
  const { data: existing, error: getError } = await db.from('nexo_submissions').select('*').eq('request_id', requestIdValue).single();
  if (getError || !existing) throw new Error('Solicitud no encontrada.');
  if (existing.status === 'email_sent') return existing;
  if (existing.status === 'payment_processing') return existing;

  const updates = {
    status: 'payment_processing',
    paypal_order_id: payment.orderId || existing.paypal_order_id,
    paypal_capture_id: payment.captureId || existing.paypal_capture_id,
    paypal_payer_email: payment.payerEmail || existing.paypal_payer_email,
    payment_amount: payment.amount || PRICE,
    payment_currency: payment.currency || CURRENCY,
    paid_at: payment.paidAt || existing.paid_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: locked, error: lockError } = await db
    .from('nexo_submissions')
    .update(updates)
    .eq('request_id', requestIdValue)
    .in('status', ['pending_payment','paid','email_error'])
    .select('*')
    .maybeSingle();

  if (lockError) throw lockError;
  if (!locked) {
    const { data: current } = await db.from('nexo_submissions').select('*').eq('request_id', requestIdValue).single();
    return current || existing;
  }

  try {
    const cover = await loadCoverBuffer(db, locked);

    try {
      await archiveSubmissionToGithub(locked, cover, 'paid');
      await db.from('nexo_submissions').update({
        github_archive_last_at: new Date().toISOString(),
        github_archive_error: null,
        updated_at: new Date().toISOString()
      }).eq('request_id', requestIdValue);
    } catch (archiveError) {
      console.error('GitHub archive:', archiveError);
      await db.from('nexo_submissions').update({
        github_archive_error: String(archiveError.message || archiveError).slice(0, 1000),
        updated_at: new Date().toISOString()
      }).eq('request_id', requestIdValue);
    }

    await sendEmails(locked, cover);
    const { data: emailed, error: emailStateError } = await db.from('nexo_submissions').update({
      status: 'email_sent',
      emails_sent_at: new Date().toISOString(),
      email_error: null,
      updated_at: new Date().toISOString()
    }).eq('request_id', requestIdValue).select('*').single();
    if (emailStateError) throw emailStateError;
    return emailed || locked;
  } catch (error) {
    await db.from('nexo_submissions').update({
      status: 'email_error',
      email_error: String(error.message || error).slice(0, 1000),
      updated_at: new Date().toISOString()
    }).eq('request_id', requestIdValue);
    throw error;
  }
}
