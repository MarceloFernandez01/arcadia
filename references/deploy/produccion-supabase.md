# Runbook: migrar Supabase de desarrollo a producción

Pasos manuales para dejar operativa la instancia de producción de Arcade
Vault. El asistente no tiene acceso a esta instancia: todo lo de este
documento lo ejecuta el usuario desde el dashboard de Supabase y el panel
del proveedor de hosting.

Scripts SQL de referencia: `supabase/production/001_bootstrap_produccion.sql`
(obligatorio) y `supabase/production/002_registrar_migraciones.sql`
(opcional, solo si se va a usar el Supabase CLI contra producción).

## 1. Esquema y catálogo

1. Abrir el SQL Editor del proyecto de **producción**.
2. Pegar y ejecutar `supabase/production/001_bootstrap_produccion.sql`.
3. Verificar con las consultas que trae comentadas al final del propio
   archivo (5 juegos, RLS habilitado en ambas tablas, 3 políticas).

No se migran usuarios ni puntajes de desarrollo: producción arranca con
`scores` vacía. Si más adelante se quisiera migrar `auth.users` /
`auth.identities`, las identidades OAuth no sobreviven un copiado directo
y hay que tratarlo aparte.

## 2. Authentication → Providers

- **Email**: activado, con **Confirm email = ON**.
- **Google**: crear credenciales OAuth propias para producción (no
  reutilizar las de dev) en Google Cloud Console. Agregar como redirect
  URI: `https://<ref-prod>.supabase.co/auth/v1/callback`.
- **GitHub**: ídem, con una OAuth App nueva en GitHub Developer Settings,
  mismo redirect URI con el ref de producción.

## 3. Authentication → URL Configuration

- **Site URL**: `https://TU-DOMINIO`
- **Redirect URLs**: `https://TU-DOMINIO/**`

Esto cubre `/auth/callback` y `/auth/callback?next=/auth/actualizar-contrasena`,
que `components/Auth.tsx` construye con `window.location.origin` (el
código no hardcodea ningún dominio, así que no hace falta tocarlo). Si el
hosting es Vercel y se van a usar preview deployments, agregar también el
patrón de dominios de preview a la lista de Redirect URLs.

Reemplazar `TU-DOMINIO` en cuanto el dominio de producción esté definido.

## 4. Authentication → Policies

Replicar lo ya decidido en `specs/14-endurecimiento-seguridad.md`:

- Minimum password length: **8**.
- Password requirements: **"Lowercase, uppercase letters, digits and symbols"**.
- Rate limit de signups por IP: dejar el valor por defecto (ya viene activo).
- Leaked Password Protection: **no activar** (requiere plan Pro; riesgo
  aceptado y documentado en `references/security/security-checklist.md`).

## 5. Email — bloqueante antes de abrir al público

El proyecto usa el servicio de correo por defecto de Supabase, que en
proyectos nuevos limita el envío a pocos correos por hora y solo a
direcciones del equipo del proyecto. Con "Confirm email" obligatorio,
eso deja a usuarios reales sin poder completar el registro.

Antes de anunciar producción hay que configurar SMTP propio en
**Authentication → Emails → SMTP Settings**. La vía más directa es
reutilizar la cuenta de Resend que ya existe en el proyecto (usada hoy
en `app/api/contact/route.ts`), con un dominio verificado.

## 6. Variables de entorno de producción

Configurar en el panel del proveedor de hosting (no en `.env.local`, que
sigue apuntando a desarrollo):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de producción |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key de producción (sistema nuevo de keys, no la anon key clásica) |
| `RESEND_API_KEY` | API key de Resend |
| `CONTACT_TO_EMAIL` | Correo destino del formulario de contacto |
| `SUPABASE_DB_PASSWORD` | Solo si se va a usar el CLI/psql contra producción; guardar en local, nunca en el repo |

Si en Settings → API del proyecto de producción solo aparece la "anon
key" clásica, hay que habilitar el sistema nuevo de API keys
(publishable/secret) ahí mismo — no renombrar la variable en el código.

## 7. Backups

Confirmar el plan del proyecto de producción y si incluye backups
diarios o point-in-time recovery (PITR).

## 8. Verificación funcional end-to-end

Una vez desplegada la app contra producción:

1. `/biblioteca` lista los 5 juegos.
2. Registro con email → llega el correo de confirmación → confirma →
   cae en `/biblioteca`.
3. Login con Google y con GitHub.
4. Jugar una partida y guardar puntaje → aparece en `/salon` y en la
   tabla `scores` del dashboard.
5. Recuperar contraseña → el enlace lleva a `/auth/actualizar-contrasena`.
6. Dashboard de producción → Advisors → Security: el único hallazgo
   esperado es `auth_leaked_password_protection`.

## Fuera de alcance

Hallazgos de seguridad ya abiertos en desarrollo y que viajan igual a
producción (ver `references/security/security-checklist.md`): open
redirect en `app/auth/callback/route.ts`, `lib/scores.ts:11` insertando
`user_id: null` de forma incompatible con la política de `006`, falta de
validación server-side de `score`/`player_name`, y `/api/contact` sin
rate limit. Corregirlos es trabajo aparte vía `/spec` → `/spec-impl`, y
conviene cerrarlos antes de abrir producción al público.
