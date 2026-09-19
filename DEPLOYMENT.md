# NEXO — Despliegue de producción

## Arquitectura
- Vercel: frontend + API serverless.
- Supabase: PostgreSQL + Storage privado de portadas.
- PayPal Orders API: pago correlacionado con cada solicitud NEXO.
- Resend: comprobante al cliente y solicitud completa al correo administrativo.

## 1. Supabase
1. Crear un proyecto.
2. Ejecutar `supabase/schema.sql` en SQL Editor.
3. Guardar en Vercel:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
4. El bucket `nexo-submissions` queda privado.

## 2. PayPal
Crear/usar una aplicación REST y configurar:
- PAYPAL_CLIENT_ID
- PAYPAL_CLIENT_SECRET
- PAYPAL_ENV=live (o sandbox mientras se prueba)

Crear un webhook a:
`https://TU-DOMINIO/api/paypal-webhook`

Eventos mínimos:
- PAYMENT.CAPTURE.COMPLETED
- PAYMENT.CAPTURE.REFUNDED

Guardar el ID del webhook como:
- PAYPAL_WEBHOOK_ID

El checkout de producción usa Orders API y fija:
- 12.00 USD
- custom_id = ID de solicitud NEXO
- invoice_id = ID de solicitud NEXO
- sin envío físico

## 3. Resend
1. Verificar un dominio remitente.
2. Crear API key.
3. Configurar:
   - RESEND_API_KEY
   - EMAIL_FROM
   - ADMIN_EMAIL=soportepagoseguros@gmail.com

Después de pago confirmado:
- el comprador recibe su comprobante;
- administración recibe todos los datos y la portada adjunta.

## 4. Panel administrativo
Configurar un secreto aleatorio largo:
- ADMIN_ACCESS_TOKEN

Abrir:
`https://TU-DOMINIO/admin/`

La clave nunca se guarda en el repositorio ni se envía en la URL. Solo se conserva en sessionStorage durante la sesión del navegador.

## 5. Vercel
Importar este repositorio y desplegar desde la raíz.
El archivo `vercel.json` sirve el frontend de `nexo-production/` y expone `/api/*`.

## 6. Dominio
Cuando todo funcione con el dominio de Vercel:
1. conectar `nexocanales.com`;
2. actualizar el webhook de PayPal si estaba usando el dominio temporal;
3. comprobar `https://nexocanales.com/solicitud-recibida/`.

## Prueba de aceptación
1. Completar /anunciar/ con una foto.
2. Confirmar que se crea un ID NEXO.
3. Verificar que la foto existe en el bucket privado.
4. Pagar con PayPal.
5. Confirmar que /solicitud-recibida/ consulta el estado del servidor.
6. Confirmar que /admin/ muestra los datos y la portada.
7. Confirmar que llegan dos correos:
   - comprobante al cliente;
   - solicitud completa a soportepagoseguros@gmail.com.
8. Verificar que un refresh o webhook repetido no duplica correos.
