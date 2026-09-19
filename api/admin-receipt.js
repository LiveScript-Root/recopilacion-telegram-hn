import PDFDocument from 'pdfkit';
import { method, adminAuthorized, clean, supabaseAdmin } from './_lib.js';

export default async function handler(req,res){
  if(!method(req,res,['GET'])) return;
  if(!adminAuthorized(req)){res.status(401).json({error:'Acceso no autorizado.'});return;}
  try{
    const rid=clean(req.query?.requestId,40);
    if(!/^NEXO-[A-F0-9]{12}$/.test(rid)){res.status(400).json({error:'Solicitud inválida.'});return;}
    const db=supabaseAdmin();
    const {data:r,error}=await db.from('nexo_submissions').select('*').eq('request_id',rid).single();
    if(error||!r){res.status(404).json({error:'Solicitud no encontrada.'});return;}
    const amount=r.payment_amount?Number(r.payment_amount).toFixed(2):'12.00';
    const paid=r.paid_at?new Date(r.paid_at).toLocaleString('es-US',{timeZone:'America/Los_Angeles'}):'Pendiente';
    res.status(200);
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`inline; filename="NEXO-${rid}.pdf"`);
    res.setHeader('Cache-Control','no-store');
    const doc=new PDFDocument({size:'LETTER',margin:54,info:{Title:'NEXO - '+rid,Author:'NEXO'}});
    doc.pipe(res);
    doc.fontSize(24).text('NEXO',{continued:true}).fontSize(11).fillColor('#667085').text('  Comprobante / registro administrativo');
    doc.moveDown(1.3).fillColor('#111827').fontSize(18).text('Solicitud '+rid);
    doc.moveDown(.7);
    const rows=[
      ['Perfil',r.profile_name],
      ['Telegram',r.telegram_link],
      ['Correo',r.applicant_email],
      ['Usuario Telegram',r.contact_telegram],
      ['Relación',r.relation],
      ['Estado de pago',r.status],
      ['Estado de revisión',r.review_status||'new'],
      ['Importe',r.payment_amount?amount+' '+(r.payment_currency||'USD'):'Pendiente'],
      ['Fecha de pago',paid],
      ['Transacción PayPal',r.paypal_capture_id||'—'],
      ['Orden PayPal',r.paypal_order_id||'—'],
      ['Creada',new Date(r.created_at).toLocaleString('es-US',{timeZone:'America/Los_Angeles'})]
    ];
    for(const [label,value] of rows){
      doc.fontSize(9).fillColor('#667085').text(label);
      doc.fontSize(11).fillColor('#111827').text(String(value??'—'));
      doc.moveDown(.45);
    }
    if(r.note){
      doc.moveDown(.4).fontSize(9).fillColor('#667085').text('Información adicional');
      doc.fontSize(11).fillColor('#111827').text(r.note);
    }
    if(r.admin_notes){
      doc.moveDown(.7).fontSize(9).fillColor('#667085').text('Notas administrativas');
      doc.fontSize(11).fillColor('#111827').text(r.admin_notes);
    }
    doc.moveDown(1.4).fontSize(9).fillColor('#667085').text('Documento administrativo generado por NEXO. No constituye factura fiscal.');
    doc.end();
  }catch(e){
    console.error(e);
    if(!res.headersSent) res.status(500).json({error:'No se pudo generar el PDF.'});
  }
}
