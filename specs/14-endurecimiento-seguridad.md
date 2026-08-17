# SPEC 14 — Endurecimiento de seguridad (RLS, función SECURITY DEFINER, headers y configuración de Auth)

> **Estado:** Aprobado
> **Depende de:** `04-integracion-supabase` (clientes de Supabase), `06-leaderboard-supabase` (tablas `games`/`scores` y sus políticas RLS originales), `13-registro-login-autenticacion` (sesión real, de la que depende `auth.uid()` para la nueva política de `scores`)
> **Fecha:** 2026-08-16
> **Objetivo:** Cerrar los hallazgos de `references/security/security-checklist.md` que no requieren plan pago — eliminar las políticas RLS permisivas de `games` (INSERT/UPDATE públicos), exigir `auth.uid() = user_id` para insertar en `scores`, revocar la ejecución pública de la función `rls_auto_enable()`, agregar headers de seguridad en `next.config.ts`, ampliar `proxy.ts` para proteger `/auth/actualizar-contrasena` y redirigir `/auth` cuando ya hay sesión, y documentar como paso manual la configuración pendiente en el Dashboard de Supabase (contraseña mínima de 8 caracteres, requisito de complejidad "Lowercase, uppercase letters, digits and symbols", límite de signups por IP); Leaked Password Protection queda fuera por requerir el plan Pro de Supabase.

## Alcance

**Incluye:**

- Migración nueva `supabase/migrations/006_security_hardening.sql`:
  - Elimina `games_public_insert` y `games_public_update` (solo queda `games_public_read`). El catálogo de juegos se sigue administrando por migraciones (acceso elevado, evita RLS), como ya documenta `supabase/CLAUDE.md`; ningún código de la app inserta o actualiza `games` hoy.
  - Reemplaza `scores_public_insert` por una versión que exige `with check (auth.uid() = user_id)`. Cierra el hueco donde cualquiera podía insertar un puntaje directo por la API de Supabase, aun con el botón de guardar deshabilitado en la UI para invitados (spec 13).
  - Revoca `EXECUTE` sobre `public.rls_auto_enable()` para los roles `anon` y `authenticated`, sin tocar su definición ni el event trigger que la dispara al crear tablas nuevas.
- `next.config.ts`: agrega `headers()` con 5 headers aplicados a `/(.*)`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- Ampliar `proxy.ts` (no `middleware.ts` — convención de Next.js 16 ya establecida en la spec 13; el helper interno `lib/supabase/middleware.ts` conserva su nombre) con dos redirecciones nuevas, evaluadas por `pathname` exacto para no afectar `/auth/callback` ni otras subrutas:
  - `/auth/actualizar-contrasena` sin sesión activa → redirige a `/auth`. Reemplaza el chequeo equivalente que hoy hace `app/auth/actualizar-contrasena/page.tsx` a nivel de componente (spec 13, paso 6), que se elimina para no duplicar la lógica.
  - `/auth` (ruta exacta) con sesión activa → redirige a `/biblioteca`, para no mostrarle el formulario de login/registro a un usuario ya logueado.
- Configuración manual en el Dashboard de Supabase (Authentication → Policies / Rate Limits), documentada como paso del plan, no como código:
  - Minimum password length en 8.
  - "Password requirements" en "Lowercase, uppercase letters, digits and symbols".
  - Confirmar que el rate limit de signups por IP está activo (valor por defecto de Supabase, sin cambiar el número).
- Marcar como resuelto en `references/security/security-checklist.md` cada ítem cubierto por esta spec; el de Leaked Password Protection queda anotado explícitamente como pendiente por costo (no como resuelto ni como descartado).

**No incluye (fuera de alcance):**

- **Activar "Leaked password protection".** Confirmado contra la documentación de Supabase: está disponible desde el plan Pro en adelante (plan de pago). Se deja documentada en el checklist como pendiente conocido; se activa sin necesidad de código el día que se decida el upgrade de plan.
- Validación de complejidad de contraseña en el frontend (`components/Auth.tsx`). Supabase Auth ya rechaza contraseñas que no cumplan el requisito configurado en el Dashboard y devuelve un mensaje de error; `Auth.tsx` ya muestra los errores de Supabase tal cual (spec 13), sin duplicar esa validación en el cliente.
- Header `Content-Security-Policy`. Requiere mapear todos los orígenes externos en uso (Supabase, Resend, fuentes, etc.) y validar que no rompe nada; queda para una spec futura si hace falta.
- Restringir `games_public_insert`/`games_public_update` a un rol `authenticated` o admin en vez de eliminarlas: se descarta, no hay ni está planeado un panel de administración de juegos desde la app.
- Proteger con `proxy.ts` cualquier otra ruta (`/`, `/biblioteca`, `/salon`, `/about`, jugar) exigiendo sesión. Decisión explícita: se mantiene el criterio de la spec 13 de que esas rutas siguen accesibles sin sesión; el modo invitado no se toca en esta spec.
- Cambiar el valor del límite de signups por IP a un número específico: se deja el valor por defecto de Supabase.
- Validación de rango o anti-cheat sobre `scores.score` (ej. rechazar puntajes absurdamente altos). No estaba en el checklist original.
- Cambiar `rls_auto_enable()` a `SECURITY INVOKER`, eliminarla, o modificar su lógica. Solo se revoca el `EXECUTE` público.
- Tabla `profiles`, roles o permisos de usuario. Ya descartado en la spec 13, sigue fuera.
- Rate limiting a nivel de aplicación más allá del que ofrece Supabase Auth por defecto.
- Tests automatizados.

## Modelo de datos

Esta spec no introduce estructuras de datos nuevas ni cambia columnas o tipos de `games`/`scores`. Modifica únicamente las políticas RLS definidas originalmente en `001_games_and_scores.sql` (spec `06-leaderboard-supabase`) y los privilegios de una función existente, vía la migración `006_security_hardening.sql`:

```sql
-- games: ya no se puede insertar/actualizar vía API pública
drop policy if exists "games_public_insert" on games;
drop policy if exists "games_public_update" on games;

-- scores: insert solo si el user_id coincide con la sesión autenticada
drop policy if exists "scores_public_insert" on scores;
create policy "scores_public_insert" on scores
  for insert with check (auth.uid() = user_id);

-- rls_auto_enable: ya no invocable vía RPC público
revoke execute on function public.rls_auto_enable() from anon, authenticated;
```

Convención: como en las migraciones previas (`002`–`005`), el archivo lleva el número correlativo siguiente (`006`) y se aplica con la tool `apply_migration` del MCP de Supabase, nunca a mano.

## Plan de implementación

1. Crear y aplicar la migración `supabase/migrations/006_security_hardening.sql` (contenido del bloque SQL de arriba) vía `apply_migration`. Test manual: `mcp__supabase__get_advisors(type: "security")` ya no reporta los warnings `rls_policy_always_true` (los 3 de `games`/`scores`) ni `anon_security_definer_function_executable`/`authenticated_security_definer_function_executable`.
2. Verificar el flujo de guardado de puntaje sin tocar código: `lib/scores.ts` ya envía `user_id: session?.user.id ?? null`, así que un usuario autenticado sigue insertando con su propio `user_id` (permitido por la policy nueva) y un intento sin sesión queda rechazado por Postgres. Test manual: jugar logueado, guardar puntaje, verlo en `/salon`; luego, desde el SQL editor o `execute_sql`, intentar un insert con un `user_id` distinto al de la sesión activa y confirmar que la policy lo rechaza.
3. Agregar `headers()` a `next.config.ts` con los 5 headers listados en el Alcance, aplicados a `source: '/(.*)'`. Test manual: `npm run build && npm run dev`, inspeccionar los response headers de `/` (devtools o `curl -I`) y confirmar los 5 presentes con esos valores.
4. Ampliar `proxy.ts` con las dos redirecciones por `pathname` (`/auth/actualizar-contrasena` sin sesión → `/auth`; `/auth` exacto con sesión → `/biblioteca`), y quitar el chequeo redundante de `app/auth/actualizar-contrasena/page.tsx`. Test manual: sin sesión, entrar directo a `/auth/actualizar-contrasena` redirige a `/auth`; logueado, entrar a `/auth` redirige a `/biblioteca`; logueado, entrar a `/auth/callback` con un código de recuperación válido sigue funcionando (no lo intercepta la redirección de `/auth`).
5. Configurar manualmente en el Dashboard de Supabase (Authentication → Policies): mínimo de contraseña en 8, "Password requirements" en "Lowercase, uppercase letters, digits and symbols"; y en Authentication → Rate Limits confirmar que el límite de signups por IP está activo (valor por defecto). No se toca "Leaked password protection" (requiere plan Pro, fuera de alcance). Test manual: intentar registrarse en `/auth` con una contraseña débil (ej. `abc12345`, sin mayúscula ni símbolo) y confirmar que aparece el mensaje de error de Supabase en el formulario, sin caerse la página.
6. Marcar como resuelto (`- [x]`) cada ítem de `references/security/security-checklist.md` cubierto por esta spec; dejar el de Leaked Password Protection sin marcar, con una nota de "pendiente — requiere plan Pro de Supabase". Test manual: `mcp__supabase__get_advisors(type: "security")` ya no devuelve los 3 warnings `rls_policy_always_true` ni los 2 `*_security_definer_function_executable`; `auth_leaked_password_protection` sigue apareciendo y es esperado.
7. Repaso final: `npm run build` sin errores; recorrer manualmente login → guardar puntaje → cerrar sesión → intento de guardar como invitado sigue bloqueado en la UI igual que antes de esta spec; confirmar los 5 headers presentes en la respuesta; confirmar que `/`, `/biblioteca`, `/salon`, `/about` y jugar siguen accesibles sin sesión (sin cambios respecto a la spec 13).

## Criterios de aceptación

- [ ] `games_public_insert` y `games_public_update` ya no existen; solo `games_public_read` sigue activa sobre `games`.
- [ ] `scores_public_insert` exige `auth.uid() = user_id`; un insert sin sesión o con un `user_id` distinto al de la sesión activa es rechazado por Postgres.
- [ ] Un usuario autenticado sigue guardando su puntaje normalmente y viéndolo en `/salon`, sin cambios de código en `lib/scores.ts`.
- [ ] `anon` y `authenticated` ya no pueden ejecutar `rls_auto_enable()` vía `/rest/v1/rpc/rls_auto_enable`; la función sigue funcionando como event trigger al crear tablas nuevas en `public`.
- [ ] Las respuestas HTTP de la app incluyen los 5 headers de seguridad (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`) con los valores definidos en el plan.
- [ ] Entrar a `/auth/actualizar-contrasena` sin sesión activa redirige a `/auth`, mediante `proxy.ts` (ya no mediante el chequeo del componente de página).
- [ ] Entrar a `/auth` con una sesión activa redirige a `/biblioteca`; sin sesión, `/auth` muestra el formulario normalmente.
- [ ] El flujo de recuperación de contraseña (`/auth/callback` con código de recuperación → `/auth/actualizar-contrasena`) sigue funcionando de punta a punta sin quedar atrapado en ninguna de las dos redirecciones nuevas.
- [ ] `/`, `/biblioteca`, `/salon`, `/about` y jugar siguen siendo accesibles sin sesión iniciada (sin cambios respecto a la spec 13).
- [ ] En el Dashboard de Supabase quedan activados: contraseña mínima de 8 caracteres y requisito de complejidad "Lowercase, uppercase letters, digits and symbols"; registrarse con una contraseña débil muestra el error de Supabase en `/auth` sin romper la página.
- [ ] El límite de signups por IP del Dashboard está confirmado como activo (valor por defecto de Supabase).
- [ ] `mcp__supabase__get_advisors(type: "security")` ya no reporta los 3 warnings `rls_policy_always_true` ni los 2 `*_security_definer_function_executable`. El warning `auth_leaked_password_protection` sigue apareciendo — es esperado, queda pendiente por costo.
- [ ] `references/security/security-checklist.md` tiene marcados como resueltos todos los ítems cubiertos por esta spec; el de Leaked Password Protection queda explícitamente anotado como pendiente por requerir plan Pro.
- [ ] `npm run build` compila sin errores de tipos.

## Decisiones tomadas y descartadas

- **Sí:** eliminar `games_public_insert`/`games_public_update` en vez de restringirlas a `authenticated`. El catálogo de juegos se administra solo por migraciones (acceso elevado, evita RLS); no existe ni está planeado un panel de administración desde la app.
- **Sí:** exigir `auth.uid() = user_id` en `scores_public_insert` en vez de dejar la política abierta. Cierra el hueco donde cualquiera podía insertar puntajes falsos llamando directo a la API de Supabase, aun con el botón de guardar deshabilitado en la UI para invitados (spec 13); coincide con la decisión ya tomada en esa spec de que solo usuarios logueados guardan puntaje.
- **Sí:** revocar `EXECUTE` de `rls_auto_enable()` para `anon`/`authenticated`, sin cambiar su definición ni desactivar el event trigger. Elimina la superficie de ataque de invocarla por RPC público sin afectar su función real (auto-habilitar RLS en tablas nuevas).
- **Sí:** sumar `Strict-Transport-Security` y `Permissions-Policy` a los 3 headers del checklist. Son headers estándar de bajo riesgo que complementan el checklist sin agrandar mucho el alcance.
- **Sí:** mover el chequeo de sesión de `/auth/actualizar-contrasena` desde el componente de página hacia `proxy.ts`, en vez de mantenerlo solo en la página o duplicarlo en ambos lados. Centraliza la protección de rutas en un único lugar, en línea con el pedido explícito de sumar protección de rutas vía proxy en esta spec.
- **Sí:** redirigir `/auth` (ruta exacta) a `/biblioteca` cuando ya hay sesión, evaluado por `pathname` estricto para no interceptar `/auth/callback` ni `/auth/actualizar-contrasena`. Evita mostrarle el formulario de login/registro a un usuario ya logueado.
- **No:** extender la protección de `proxy.ts` a `/`, `/biblioteca`, `/salon`, `/about` o jugar. Se mantiene la decisión de la spec 13 de que esas rutas siguen accesibles sin sesión; esta spec no reabre esa decisión.
- **No:** agregar un header `Content-Security-Policy`. Requiere mapear todos los orígenes externos en uso (Supabase, Resend, fuentes, etc.) y probar que no rompe nada; se deja para una spec futura si hace falta.
- **No:** activar "Leaked password protection" en esta spec. Confirmado en la documentación de Supabase que es una feature del plan Pro en adelante; el usuario no está dispuesto a pagar el upgrade por ahora. Queda anotada como pendiente conocido en el checklist, no como resuelta ni descartada — se activa sin código el día que se pague el plan.
- **Sí:** dejar la configuración de contraseña mínima, complejidad y límite de signups como paso manual documentado en el plan, igual que el alta de OAuth en la spec 13 — no hay tool de MCP para aplicar configuración de Auth por código.
- **Sí:** no agregar validación de complejidad de contraseña en el frontend. Supabase Auth ya rechaza contraseñas que no cumplen el requisito configurado en el Dashboard y devuelve un mensaje de error; `Auth.tsx` ya muestra los errores de Supabase tal cual (spec 13).
- **No:** cambiar el valor del límite de signups por IP a un número específico. Se deja el valor por defecto de Supabase, decisión explícita del usuario.
- **No:** validación de rango o anti-cheat sobre `scores.score`. No estaba en el checklist original; se deja fuera para no ampliar el alcance.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                                                              | Mitigación                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Si en el futuro se agrega un panel de administración de juegos que inserte/actualice `games` desde el cliente, se romperá silenciosamente al no existir ya las políticas públicas de insert/update.                                                                                 | Documentado en las decisiones de esta spec; esa spec futura debería agregar una política nueva (ej. restringida a un rol admin), no reabrir el acceso público.                                                                                                                      |
| Endurecer `scores_public_insert` podría bloquear un guardado como invitado si en el futuro se reactiva esa opción en la UI sin actualizar la política.                                                                                                                              | El paso 2 del plan prueba explícitamente el insert autenticado y el rechazo del insert sin sesión antes de cerrar la spec; reactivar el guardado como invitado requeriría revisar esta policy a propósito.                                                                          |
| `Permissions-Policy` con un valor mal elegido podría bloquear una API del navegador que un juego futuro llegue a necesitar (ej. acelerómetro/giroscopio para controles móviles).                                                                                                    | El valor exacto queda documentado en el plan; si un juego futuro necesita una API bloqueada, esa spec ajusta el header puntualmente.                                                                                                                                                |
| Si el `pathname` de la redirección de `/auth` no queda evaluado en modo estricto (exacto), podría interceptar por error `/auth/callback` o `/auth/actualizar-contrasena` y romper el flujo de confirmación de correo, login OAuth o recuperación de contraseña.                     | El paso 4 del plan prueba explícitamente que `/auth/callback` con un código de recuperación válido sigue funcionando sin quedar atrapado en la redirección nueva, antes de cerrar la spec.                                                                                          |
| Los pasos manuales del Dashboard de Supabase (contraseña, rate limit) dependen de que el usuario los configure fuera de este repo; si se saltean, el checklist quedaría marcado como resuelto sin estarlo.                                                                          | El paso 4 del plan detalla exactamente qué configurar, y el criterio de aceptación correspondiente pide probar el rechazo de una contraseña débil como verificación concreta.                                                                                                       |
| Mientras el proyecto siga en el plan Free de Supabase, las contraseñas de los usuarios no se validan contra la lista de HaveIBeenPwned; una cuenta con una contraseña ya filtrada en otro sitio (pero que cumple longitud/complejidad) podría ser vulnerable a credential stuffing. | Riesgo aceptado explícitamente por el usuario por motivos de costo; queda documentado como pendiente conocido en `references/security/security-checklist.md`, no oculto. Se resuelve activando "Leaked password protection" el día que se pague el plan Pro, sin cambios de código. |

## Lo que **no** está en esta spec

- Activar "Leaked password protection" (requiere plan Pro de Supabase, fuera de alcance por costo; queda como pendiente conocido en el checklist).
- Validación de complejidad de contraseña en el frontend (queda del lado de Supabase Auth).
- Header `Content-Security-Policy` (spec futura si hace falta).
- Panel de administración de juegos o cualquier rol admin.
- Proteger con `proxy.ts` cualquier ruta más allá de `/auth/actualizar-contrasena` y `/auth`: `/`, `/biblioteca`, `/salon`, `/about` y jugar siguen sin requerir sesión (decisión de la spec 13, no reabierta aquí).
- Cambiar el valor numérico del límite de signups por IP.
- Validación anti-cheat sobre `scores.score`.
- Cambios en la definición o el comportamiento de `rls_auto_enable()` más allá de revocar `EXECUTE`.
- Tabla `profiles`, roles/permisos de usuario, tests automatizados.

Cada uno de estos, si se necesita, va en su propia spec.
