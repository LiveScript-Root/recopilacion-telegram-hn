import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { method, adminAuthorized, clean, supabaseAdmin, loadCoverBuffer } from './_lib.js';

const pagoLabel=s=>({
  pending_payment:'Pendiente de pago',
  payment_processing:'Pago confirmado',
  paid:'Pagado',
  email_sent:'Pagado',
  email_error:'Pagado',
  refunded:'Reembolsado',
  rejected:'Rechazado'
}[s]||'Sin estado');

const revisionLabel=s=>({
  new:'Nueva',
  reviewing:'En revisión',
  published:'Publicada',
  rejected:'Rechazada'
}[s||'new']||'Nueva');

export default async function handler(req,res){
  if(!method(req,res,['GET'])) return;
  if(!adminAuthorized(req)){res.status(401).json({error:'Acceso no autorizado.'});return;}
  try{
    const rid=clean(req.query?.requestId,40);
    if(!/^NEXO-[A-F0-9]{12}$/.test(rid)){res.status(400).json({error:'Solicitud inválida.'});return;}
    const db=supabaseAdmin();
    const {data:r,error}=await db.from('nexo_submissions').select('*').eq('request_id',rid).single();
    if(error||!r){res.status(404).json({error:'Solicitud no encontrada.'});return;}

    let cover=null;
    try{
      const original=await loadCoverBuffer(db,r);
      if(original){
        if(r.cover_mime==='image/webp') cover=await sharp(original).png().toBuffer();
        else cover=original;
      }
    }catch(imageError){
      console.error('PDF portada:',imageError);
    }

    res.status(200);
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`attachment; filename="NEXO-${rid}.pdf"`);
    res.setHeader('Cache-Control','no-store');

    const doc=new PDFDocument({size:'LETTER',margin:54,info:{Title:'NEXO - '+rid,Author:'NEXO'}});
    doc.pipe(res);
    doc.fontSize(24).fillColor('#111827').text('NEXO',{continued:true}).fontSize(11).fillColor('#667085').text('  Registro administrativo');
    doc.moveDown(1.1).fillColor('#111827').fontSize(18).text('Solicitud '+rid);

    if(cover){
      doc.moveDown(.8);
      const x=54,y=doc.y;
      try{
        doc.image(cover,x,y,{fit:[170,210],align:'left',valign:'top'});
        doc.y=y+220;
      }catch(imageError){
        console.error('PDF imagen:',imageError);
      }
    }

    const rows=[
      ['Nombre del perfil',r.profile_name],
      ['Telegram',r.telegram_link],
      ['Correo',r.applicant_email],
      ['Usuario de Telegram',r.contact_telegram],
      ['Relación',r.relation],
      ['Autorización',r.authorized?'Sí':'No'],
      ['Mayoría de edad',r.adult?'Sí':'No'],
      ['Estado de pago',pagoLabel(r.status)],
      ['Estado de revisión',revisionLabel(r.review_status)],
      ['Importe',r.payment_amount?Number(r.payment_amount).toFixed(2)+' '+(r.payment_currency||'USD'):''],
      ['Fecha de pago',r.paid_at?new Date(r.paid_at).toLocaleString('es-US',{timeZone:'America/Los_Angeles'}):''],
      ['Transacción PayPal',r.paypal_capture_id||''],
      ['Orden PayPal',r.paypal_order_id||''],
      ['Solicitud creada',new Date(r.created_at).toLocaleString('es-US',{timeZone:'America/Los_Angeles'})]
    ].filter(([,value])=>String(value??'').trim()!=='');

    for(const [label,value] of rows){
      if(doc.y>700) doc.addPage();
      doc.fontSize(9).fillColor('#667085').text(label);
      doc.fontSize(11).fillColor('#111827').text(String(value));
      doc.moveDown(.42);
    }

    if(r.note){
      if(doc.y>680) doc.addPage();
      doc.moveDown(.3).fontSize(9).fillColor('#667085').text('Información adicional');
      doc.fontSize(11).fillColor('#111827').text(r.note);
    }
    if(r.admin_notes){
      if(doc.y>680) doc.addPage();
      doc.moveDown(.6).fontSize(9).fillColor('#667085').text('Notas administrativas');
      doc.fontSize(11).fillColor('#111827').text(r.admin_notes);
    }
    doc.moveDown(1.2).fontSize(9).fillColor('#667085').text('Documento administrativo generado por NEXO. No constituye factura fiscal.');
    doc.end();
  }catch(error){
    console.error(error);
    if(!res.headersSent) res.status(500).json({error:'No se pudo generar el PDF.'});
  }
}
