# Spec 03 — About page y envío de correo con Resend

- **Estado:** Aprobado
- **Dependencias:** 01-mvp-visual, 02-home-page
- **Fecha:** 2026-07-20
- **Objetivo:** Agregar la página "Acerca de" (`/about`) con su formulario de contacto funcional, que envía correos reales mediante Resend a través de una API Route.

## Alcance

### Incluye

- Nueva ruta `/about` con el componente `About` (`components/About.tsx`), port fiel de `references/templates/home-about/about.jsx`: hero "Acerca de" con misión y highlights (`HighlightIcon`), animación scroll-reveal (`.reveal`/`.in`) en el divisor y la sección de contacto, y formulario de contacto (nombre, correo, mensaje) con estado de éxito tipo terminal.
- CSS: portar el bloque `/* ===== ABOUT PAGE ===== */` de `references/templates/home-about/styles.css` (líneas ~1071 en adelante: `.about`, `.about-hero`, `.about-title`, `.about-mission`, `.highlight-row`, `.about-divider`, `.about-contact`, `.contact-*`, `.terminal-success`, etc.) hacia `app/globals.css`, agregado al final del archivo.
- `components/Nav.tsx`: agregar enlace "Acerca de" apuntando a `/about`, junto a Inicio/Biblioteca/Salón de la Fama, tanto en el nav de escritorio como en el panel móvil. Se actualiza `isActive` para reflejar la nueva ruta.
- API Route `app/api/contact/route.ts` (`POST`) que recibe `{ name, email, message }`, valida que los campos no estén vacíos, y usa el SDK `resend` para enviar un correo con `From: no-reply@arcadevault.gg`, `Reply-To: <email del remitente del formulario>`, hacia la dirección definida en `CONTACT_TO_EMAIL` (variable de entorno), con el nombre/correo/mensaje en el cuerpo.
- El formulario de `About.tsx` pasa a ser `"use client"`, valida en el cliente (campos no vacíos + formato de email) igual que el prototipo (shake si falla), y al enviar hace `fetch("/api/contact")`. Mientras espera respuesta muestra un estado de carga; si la respuesta es exitosa muestra la pantalla `terminal-success` existente; si falla, muestra un estado de error (línea `[FAIL]` en la terminal) con opción de reintentar sin perder los datos escritos.
- Dependencia nueva `resend` agregada a `package.json`.
- Archivo `.env.local` (nuevo, ya está en `.gitignore` vía patrón `*.local` de Next.js) con `RESEND_API_KEY=`, `CONTACT_TO_EMAIL=` como placeholders para que el usuario complete los valores reales.

### No incluye (fuera de alcance)

- Protección anti-spam (honeypot, rate limiting, captcha).
- Validación de servidor con librerías como `zod`; la API route solo valida presencia de campos.
- Envío de correo de confirmación al remitente (solo se notifica al equipo vía `CONTACT_TO_EMAIL`).
- Plantillas de correo HTML con diseño (React Email, etc.); el cuerpo del correo es texto plano simple.
- Persistencia de los mensajes de contacto (no se guardan en `localStorage` ni en ninguna base de datos).
- Tests automatizados.

## Modelo de datos

Este spec no introduce estructuras de datos en `lib/data.ts`. Los únicos "datos" nuevos son:

- **Payload del formulario de contacto** (tipo local en `About.tsx` y en la API route, sin exportar a `lib/`): `{ name: string; email: string; message: string }`.
- **Respuesta de la API route**: `{ ok: true }` en éxito, o `{ ok: false; error: string }` en fallo (HTTP 400/500 según el caso).
- **Variables de entorno** (`.env.local`): `RESEND_API_KEY`, `CONTACT_TO_EMAIL`.

No hay persistencia ni modelo compartido — el mensaje vive solo mientras dura la petición HTTP.

## Plan de implementación

1. **Dependencia y variables de entorno.** Agregar `resend` a `package.json` (`npm install resend`). Crear `.env.local` con `RESEND_API_KEY=` y `CONTACT_TO_EMAIL=` como placeholders (el usuario completa los valores reales). El sistema queda igual, sin cambios visibles.
2. **CSS del About.** Portar el bloque `/* ===== ABOUT PAGE ===== */` de `references/templates/home-about/styles.css` al final de `app/globals.css`. Sin cambios visibles todavía (CSS sin usar).
3. **Componente `About` (solo UI, sin envío real).** Crear `components/About.tsx` como port de `about.jsx`: hero, highlights, divisor con scroll-reveal, y formulario de contacto con validación de cliente (shake) y el estado `terminal-success` existente. El botón de submit todavía no llama a la API; deja el sistema navegable y visualmente completo.
4. **Ruta `/about`.** Crear `app/about/page.tsx` que renderiza `About`.
5. **`Nav`.** Agregar el enlace "Acerca de" (`/about`) en escritorio y panel móvil, y actualizar `isActive` para marcarlo activo en `/about`.
6. **API Route de envío.** Crear `app/api/contact/route.ts`: valida `name`/`email`/`message` no vacíos (400 si falta alguno), instancia `Resend` con `RESEND_API_KEY`, envía el correo (`from: "no-reply@arcadevault.gg"`, `to: process.env.CONTACT_TO_EMAIL`, `replyTo: email`, asunto y cuerpo de texto con nombre/correo/mensaje), y responde `{ ok: true }` o `{ ok: false, error }` (500) si Resend falla.
7. **Conectar formulario a la API.** En `About.tsx`, el `onSubmit` pasa a ser `async`: tras la validación de cliente, hace `fetch("/api/contact", { method: "POST", body: JSON.stringify(form) })`; muestra estado de carga mientras espera, `terminal-success` si `ok: true`, y un estado de error (línea `[FAIL]`) con botón para reintentar si falla, sin perder los valores del formulario.
8. **Repaso final.** Verificar que el flujo Nav → Acerca de → llenar formulario → enviar → ver éxito (con `RESEND_API_KEY` real) funciona sin errores de consola, y que el enlace "Acerca de" se marca activo correctamente en escritorio y móvil.

## Criterios de aceptación

- [ ] `/about` renderiza el componente `About` con hero, misión, highlights, divisor scroll-reveal y formulario de contacto, visualmente equivalente a `about.jsx`/`home-about/styles.css`.
- [ ] `Nav` muestra el enlace "Acerca de" apuntando a `/about`, tanto en escritorio como en el panel móvil, y se marca activo solo en `/about`.
- [ ] Si se intenta enviar el formulario con `name`, `email` o `message` vacío, se dispara la animación shake y no se llama a la API.
- [ ] Al enviar el formulario con datos válidos y `RESEND_API_KEY`/`CONTACT_TO_EMAIL` configurados correctamente, llega un correo real a la dirección de `CONTACT_TO_EMAIL`, con remitente `no-reply@arcadevault.gg`, `Reply-To` igual al email ingresado en el formulario, y el nombre/correo/mensaje en el cuerpo.
- [ ] Tras un envío exitoso, se muestra la pantalla `terminal-success` con el nombre del remitente, igual que en el prototipo.
- [ ] Si la API route falla (por ejemplo `RESEND_API_KEY` inválida), el formulario muestra un estado de error (línea `[FAIL]`) sin perder los datos escritos, y permite reintentar.
- [ ] `app/api/contact/route.ts` responde 400 si falta algún campo, y no llama a Resend en ese caso.
- [ ] `.env.local` existe con `RESEND_API_KEY` y `CONTACT_TO_EMAIL`, y no está trackeado por git (`git status` no lo muestra).
- [ ] `resend` aparece como dependencia en `package.json`.

## Decisiones tomadas y descartadas

- **API Route (`app/api/contact/route.ts`) en vez de Server Action**, siguiendo la convención existente del proyecto de usar `app/*` para rutas, y porque un endpoint HTTP explícito es más simple de probar de forma aislada (curl/Postman) que una Server Action.
- **`CONTACT_TO_EMAIL` como variable de entorno** en vez de hardcodear el destinatario, para no exponer ni fijar en código una dirección de correo real y poder cambiarla sin tocar código.
- **`From: no-reply@arcadevault.gg` con `Reply-To` al email del formulario**, en vez de usar `marceloafj99@gmail.com` como remitente directo, porque Resend exige que el dominio del remitente esté verificado en la cuenta y `gmail.com` no se puede verificar (no es un dominio propio). El `Reply-To` permite que, al responder el correo recibido, la respuesta llegue igual al remitente del formulario.
- **Validación solo en cliente**, sin `zod` ni validación estricta de servidor, siguiendo el mismo nivel de rigor del resto del MVP (sin backend real, sin lógica de negocio compleja); la API route solo verifica presencia de campos como salvaguarda mínima.
- **Sin anti-spam (honeypot/captcha/rate limit)**, decisión explícita del usuario: se puede agregar en un spec futuro si aparece spam real, no es necesario para un MVP visual.
- **`RESEND_API_KEY` no se genera ni se pega en el spec/código**: el usuario ya tiene la clave y la completa manualmente en `.env.local` tras la implementación, por ser un secreto que no debe pasar por el repositorio ni por esta conversación.
- **Cuerpo del correo en texto plano**, sin plantilla HTML (React Email u otra), para mantener el alcance mínimo; una plantilla con diseño queda fuera de este spec.

## Riesgos identificados

- **`RESEND_API_KEY` inválida o dominio no verificado en Resend.** Si la clave es incorrecta o `arcadevault.gg` no está realmente verificado en la cuenta de Resend, el envío falla en producción. Mitigación: el paso 8 del plan incluye probar el envío real antes de dar por cerrado el spec; el estado de error en la UI hace visible el fallo.
- **`IntersectionObserver` en Server Components.** El scroll-reveal del divisor y la sección de contacto requiere `useEffect`/`document.querySelectorAll`, por lo que `About.tsx` debe marcarse `"use client"` explícitamente. Mitigación: agregar la directiva al inicio del archivo, igual que se hizo con `Home.tsx` en el spec 02.
- **Variables de entorno ausentes en otros entornos (ej. Vercel).** `.env.local` no se sube al repositorio, por lo que cualquier despliegue nuevo necesita configurar `RESEND_API_KEY` y `CONTACT_TO_EMAIL` manualmente en el panel del proveedor. Mitigación: fuera del alcance de este spec resolverlo automáticamente, pero se documenta como paso manual pendiente si se despliega.
