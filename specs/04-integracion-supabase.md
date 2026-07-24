# Spec 04 — Integración técnica con Supabase

- **Estado:** Implementado
- **Dependencias:** 01-mvp-visual
- **Fecha:** 2026-07-23
- **Objetivo:** Configurar únicamente la conexión técnica con Supabase, viva tanto en el cliente de navegador (browser) como en el cliente de servidor (server), sin crear tablas, sin autenticación y sin perfiles ni puntajes reales — todo eso queda para specs futuros.

## Alcance

### Incluye

- Verificación de que `@supabase/supabase-js` (cliente JS) y `@supabase/ssr` (adaptador para Next.js App Router) son los paquetes correctos y vigentes (ya están en `package.json`).
- Cliente de Supabase para el navegador: `lib/supabase/client.ts`, usando `createBrowserClient` de `@supabase/ssr`.
- Cliente de Supabase para el servidor: `lib/supabase/server.ts`, usando `createServerClient` de `@supabase/ssr` (para Server Components / Route Handlers).
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`:
  - Agregadas a `.env.template` (placeholders vacíos, versionado en git), siguiendo el patrón existente de `RESEND_API_KEY`/`CONTACT_TO_EMAIL`.
  - Agregadas a `.env.local` (placeholders vacíos, no versionado) para que el usuario complete los valores reales de su proyecto ya existente en Supabase.
- Verificación mínima de la conexión: una llamada de prueba a `supabase.auth.getSession()` (por ejemplo desde un componente de servidor temporal o script) que confirme que no hay error de credenciales/conexión, sin agregar UI visible permanente.

### No incluye (fuera de alcance)

- Autenticación real (login/signup/logout, formularios conectados) — `components/Auth.tsx` sigue con el mock de `localStorage` tal cual está. Queda para un spec futuro.
- `middleware.ts` para refresco de sesión — no cumple función sin auth activa; se agrega cuando se conecte el login real.
- Creación de cualquier tabla en Supabase (perfiles, puntajes, o cualquier otra) — no se ejecuta ninguna migración ni SQL en este spec.
- `SUPABASE_SERVICE_ROLE_KEY` — no se usa ni se agrega como placeholder en este spec.
- Persistencia de perfiles, avatares o puntajes — queda para specs futuros.
- Realtime y Edge Functions — mencionados por el usuario como trabajo futuro, explícitamente fuera de alcance aquí.
- Tests automatizados.

## Modelo de datos

Este spec no introduce ninguna estructura de datos ni tabla en Supabase. Los únicos "datos" nuevos son las variables de entorno:

- **Variables de entorno** (`.env.template` y `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

No hay modelo de datos compartido, tipos nuevos en `lib/`, ni esquema de base de datos — la conexión se verifica únicamente contra el servicio de Auth de Supabase (`supabase.auth.getSession()`), sin leer ni escribir ninguna tabla.

## Plan de implementación

1. **Verificar paquetes de Supabase.** Confirmar que `@supabase/supabase-js` (cliente JS) y `@supabase/ssr` (adaptador oficial para Next.js App Router) son los paquetes correctos y las versiones vigentes recomendadas por la documentación de Supabase; ya están declarados en `package.json`, así que solo se valida (no se reinstalan salvo que haya una versión más reciente recomendada). El sistema queda igual, sin cambios visibles.
2. **Variables de entorno.** Agregar `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_ANON_KEY=` como placeholders vacíos tanto en `.env.template` (versionado) como en `.env.local` (no versionado, el usuario completa los valores reales de su proyecto existente). Sin cambios visibles todavía.
3. **Cliente de navegador.** Crear `lib/supabase/client.ts` que exporta una función `createClient()` usando `createBrowserClient` de `@supabase/ssr`, con `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`. No se usa todavía en ningún componente.
4. **Cliente de servidor.** Crear `lib/supabase/server.ts` que exporta una función `createClient()` usando `createServerClient` de `@supabase/ssr` (con manejo de cookies vía `next/headers`, sin lógica de refresco de sesión ya que no hay auth activa). No se usa todavía en ninguna ruta.
5. **Script de verificación de conexión.** Crear `scripts/check-supabase.ts`, un script standalone (ejecutable con `npx tsx scripts/check-supabase.ts`) que instancia el cliente de servidor y llama a `supabase.auth.getSession()`, imprimiendo en consola si la conexión/credenciales son válidas o el error específico si algo falla. No agrega UI ni rutas nuevas a la app.
6. **Repaso final.** Ejecutar `npm run build` para confirmar que el proyecto compila sin errores de tipos con los clientes nuevos, y correr `scripts/check-supabase.ts` (con `.env.local` completado por el usuario) para confirmar que la conexión a Supabase responde correctamente.

## Criterios de aceptación

- [x] `@supabase/supabase-js` y `@supabase/ssr` están confirmados como los paquetes vigentes recomendados por Supabase para Next.js, declarados en `package.json`.
- [x] `.env.template` incluye `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` como placeholders vacíos.
- [x] `.env.local` incluye `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y no está trackeado por git (`git status` no lo muestra).
- [x] `lib/supabase/client.ts` exporta un cliente de navegador funcional creado con `createBrowserClient` de `@supabase/ssr`.
- [x] `lib/supabase/server.ts` exporta un cliente de servidor funcional creado con `createServerClient` de `@supabase/ssr`.
- [x] `npm run build` compila sin errores de tipos ni de build tras agregar los clientes.
- [x] `scripts/check-supabase.ts` se ejecuta con `.env.local` completado y confirma conexión exitosa a Supabase (sin error de credenciales) vía `supabase.auth.getSession()`.
- [x] No existe ninguna tabla nueva en Supabase, ni migración SQL, ni cambio en `components/Auth.tsx`, ni `middleware.ts`.
- [x] `SUPABASE_SERVICE_ROLE_KEY` no aparece en ningún archivo del repositorio (ni `.env.template` ni `.env.local`).

## Decisiones tomadas y descartadas

- **Solo integración técnica, sin autenticación real** en este spec, en vez de conectar también `Auth.tsx`, porque el usuario decidió explícitamente reducir el alcance: la autenticación, los perfiles y los puntajes quedan para specs futuros separados.
- **Sin `middleware.ts`** en este spec, en vez de agregarlo preventivamente, porque sin login real activo no cumple ninguna función; se agrega junto con la auth real en el spec futuro correspondiente.
- **Sin creación de tablas ni migraciones SQL**, en vez de adelantar el esquema de `profiles`/`scores`, porque el usuario pidió explícitamente que este spec sea solo la conexión, sin crear nada en la base de datos.
- **Solo variables públicas (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)**, sin `SUPABASE_SERVICE_ROLE_KEY`, en vez de dejarla como placeholder vacío "por si acaso", porque el usuario indicó explícitamente que ambas serán públicas y no se necesita la clave de servicio hasta que exista lógica privilegiada de servidor.
- **Variables agregadas también a `.env.template`** (no solo `.env.local`), siguiendo el mismo patrón que `RESEND_API_KEY`/`CONTACT_TO_EMAIL` del spec 03, para que cualquier persona que clone el repo sepa qué variables necesita configurar.
- **Script standalone (`scripts/check-supabase.ts`) en vez de UI temporal**, para verificar la conexión sin dejar rastros visibles en la app ni tener que crear y luego eliminar una ruta/página de prueba.
- **Clientes separados browser/server** (`lib/supabase/client.ts` y `lib/supabase/server.ts`) en vez de un único cliente compartido, siguiendo el patrón oficial de `@supabase/ssr` para Next.js App Router, que requiere manejo distinto de cookies según el contexto de ejecución.

### Desviaciones surgidas durante la implementación

- **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en vez de `NEXT_PUBLIC_SUPABASE_ANON_KEY`**, porque el proyecto de Supabase del usuario ya usa el sistema nuevo de API keys (publishable/secret), sin anon key clásica. Se usa este nombre en `.env.template`, `.env.local`, `lib/supabase/client.ts`, `lib/supabase/server.ts` y `scripts/check-supabase.ts`. Decisión confirmada explícitamente por el usuario.
- **`scripts/check-supabase.ts` usa `@supabase/supabase-js` directo (`createClient`)**, no `lib/supabase/server.ts`, porque `cookies()` de `next/headers` solo funciona dentro del contexto de request de Next.js y falla al ejecutarse como script standalone con `tsx`. Decisión confirmada explícitamente por el usuario.
- **`tsx` agregado como devDependency**, según lo previsto por el riesgo identificado en la spec, ya que no estaba instalado.

## Riesgos identificados

- **`next/headers` en Next.js 16 con Server Components asíncronos.** `lib/supabase/server.ts` necesita leer/escribir cookies vía `next/headers`, cuya API puede requerir `await` en las versiones recientes de Next.js (a diferencia de versiones anteriores). Mitigación: verificar en `node_modules/next/dist/docs/01-app` cómo se usa `cookies()` en esta versión antes de implementar el cliente de servidor, siguiendo la advertencia del proyecto sobre no asumir comportamiento de versiones previas.
- **Compatibilidad de `@supabase/ssr` con React 19 / Next 16.** Al ser un stack más nuevo, la versión instalada de `@supabase/ssr` (`^0.12.3`) podría no estar del todo probada contra Next 16.2.10. Mitigación: el paso 1 del plan verifica que sea la versión vigente recomendada; si `npm run build` falla por incompatibilidad, se documenta como bloqueante antes de cerrar el spec.
- **Dependencia `tsx` (o similar) no instalada para correr el script de verificación.** `scripts/check-supabase.ts` necesita un runner de TypeScript (`tsx`, `ts-node`, etc.) que hoy no está en `package.json`. Mitigación: agregar `tsx` como devDependency si hace falta para ejecutar el script, o adaptar el comando de verificación a una herramienta ya disponible en el proyecto.
- **Clave anónima (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) expuesta en el bundle del cliente.** Es el comportamiento esperado de Supabase (la anon key está diseñada para ser pública y depende de RLS para seguridad), pero como en este spec no se crea ninguna tabla ni RLS todavía, no hay datos reales expuestos aún. Mitigación: no aplica en este spec; queda como recordatorio para cuando se creen tablas en specs futuros, que deberán tener RLS habilitado desde el inicio.
- **`.env.local` sin completar por el usuario.** Si el usuario no pega las credenciales reales de su proyecto Supabase antes de correr el script de verificación, el paso 6 del plan fallará con error de conexión (esperado, no es un bug). Mitigación: el criterio de aceptación de conexión exitosa solo se puede validar una vez el usuario complete `.env.local`.
