import { json, method, clean, validEmail, validTelegramLink, validTelegramUser, requestId, safeFilename, supabaseAdmin, BUCKET } from './_lib.js';
export default async function handler(req,res){
  if(!method(req,res,['POST'])) return;
  try{
    const b=req.body||{};
    const profileName=clean(b.profileName,80);
    const telegramLink=validTelegramLink(b.telegramLink);
    const applicantEmail=validEmail(b.email);
    const contactTelegram=validTelegramUser(b.contactTelegram);
    const relation=clean(b.relation,100);
    const note=clean(b.note,1200);
    const coverName=clean(b.coverName,140);
    const coverMime=clean(b.coverMime,60);
    const coverSize=Number(b.coverSize||0);
    const authorized=b.authorized===true;
    const adult=b.adult===true;
    if(!profileName||!telegramLink||!applicantEmail||!contactTelegram||!relation||!coverName||!authorized||!adult) return json(res,400,{error:'Faltan datos requeridos.'});
    if(!['image/jpeg','image/png','image/webp'].includes(coverMime)||!Number.isFinite(coverSize)||coverSize<1||coverSize>8*1024*1024) return json(res,400,{error:'La portada debe ser JPG, PNG o WEBP de hasta 8 MB.'});
    const rid=requestId();
    const coverPath=rid+'/'+safeFilename(coverName,coverMime);
    const db=supabaseAdmin();
    const {error:insertError}=await db.from('nexo_submissions').insert({
      request_id:rid,profile_name:profileName,telegram_link:telegramLink,applicant_email:applicantEmail,
      contact_telegram:contactTelegram,relation,note,cover_path:coverPath,cover_name:coverName,
      cover_mime:coverMime,cover_size:coverSize,cover_uploaded:false,authorized,adult,status:'pending_payment'
    });
    if(insertError) throw insertError;
    const {data:upload,error:uploadError}=await db.storage.from(BUCKET).createSignedUploadUrl(coverPath);
    if(uploadError||!upload?.token) throw uploadError||new Error('No se pudo preparar la carga de imagen.');
    return json(res,201,{requestId:rid,coverPath,uploadToken:upload.token});
  }catch(e){console.error(e);return json(res,500,{error:'No se pudo guardar la solicitud.'});}
}
