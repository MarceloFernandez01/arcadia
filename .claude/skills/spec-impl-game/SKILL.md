---
name: spec-impl-game
description: Implementa un spec de juego aprobado igual que /spec-impl y, al terminar, encadena los agentes skin-designer y mobile-porter en ese orden.
disable-model-invocation: true
argument-hint: "<NN-spec-name>"
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(cat:*), Bash(ls:*), Agent
---

# /spec-impl-game — Implementador de specs de juego + skins + móvil

Variante de `/spec-impl` para specs que agregan un juego nuevo. Sigue exactamente el mismo
lineamiento de las fases 1 a 4 y, al terminar la implementación, encadena automáticamente dos agentes
propios de este repositorio: primero `skin-designer`, y solo cuando termina, `mobile-porter`.

Responde siempre en español neutro, con "tú"/"usted", sin voseo ni modismos regionales.

## Contexto de sesión

Estado del repositorio:
!`git status --short`

Rama actual:
!`git branch --show-current`

Specs disponibles:
!`ls specs/ 2>/dev/null || echo "La carpeta specs/ no existe"`

Specs de game jam disponibles:
!`ls specs/game-jam/*/ 2>/dev/null || echo "No hay specs de game jam"`

Configuración de creación de rama:
!`cat specs/.spec-config.yml 2>/dev/null || echo "AutoCreateBranch: true (default, sin archivo de config)"`

---

## Instrucciones

Sigue estas cinco fases en orden estricto. **No avances a la siguiente fase si la anterior no se completó correctamente.**

---

### Fase 1 — Identificar el spec

El argumento recibido es: `$ARGUMENTS`

Si `$ARGUMENTS` está vacío:

- Lista los archivos disponibles en `specs/` y `specs/game-jam/*/` (ya los tienes arriba).
- Pide al usuario que indique el nombre exacto del spec.
- Detente y espera respuesta. No continúes.

Si `$ARGUMENTS` tiene un valor:

- Busca el archivo en `specs/` o en `specs/game-jam/<slug>/`. El usuario puede haber escrito el
  nombre completo (`09-snake-game`), solo el número (`09`) o solo el slug (`snake-game`). Intenta
  encontrar el archivo correcto en cualquiera de esos casos.
- Si no encuentras el archivo, muestra los specs disponibles y pide al usuario que corrija el nombre.
- Si lo encuentras, continúa a la Fase 2.

---

### Fase 2 — Validar el estado del spec

Lee el archivo del spec localizado en la Fase 1 con la herramienta Read o `cat`.

En el contenido del archivo, busca la línea que contiene el estado del spec. La etiqueta suele ser
`**Status:**` (inglés) o `**Estado:**` (español), pero puede estar en cualquier idioma. Identifícala
por posición (línea de estado cerca del inicio del spec) y por la máquina de estados circundante, no
por la etiqueta exacta.

**Regla absoluta:** solo puedes continuar si el estado **significa "Aprobado"**, sin importar el
idioma usado.

Trata como estado **Aprobado** (y continúa) cualquiera de los siguientes y sus equivalentes en otros
idiomas:

- Español: `Aprobado`
- Inglés: `Approved`
- Portugués: `Aprovado`
- Francés: `Approuvé`
- Alemán: `Genehmigt`
- Italiano: `Approvato`
- …o cualquier otra palabra que signifique claramente "aprobado".

Cualquier otro valor (Draft / Borrador, En revisión / In review, Implementado / Implemented,
Obsoleto / Obsolete, o cualquier valor no reconocido) significa **detenerse** y mostrar el mensaje de
error de abajo.

| Categoría de estado                           | Ejemplos (cualquier idioma)                       | Acción                                                                   |
| --------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| Aprobado                                      | `Aprobado`, `Approved`, `Aprovado`, `Approuvé`, … | Continúa a la Fase 3.                                                    |
| Borrador                                      | `Borrador`, `Draft`, …                            | Detente. Muestra el mensaje de error de abajo.                           |
| En revisión                                   | `En revisión`, `In review`, …                     | Detente. Muestra el mensaje de error de abajo.                           |
| Implementado                                  | `Implementado`, `Implemented`, …                  | Detente. Muestra el mensaje de error de abajo.                           |
| Obsoleto                                      | `Obsoleto`, `Obsolete`, …                         | Detente. Muestra el mensaje de error de abajo.                           |
| Línea de estado no encontrada / no reconocida | —                                                 | Detente. El archivo no sigue el formato esperado. Comunícalo al usuario. |

Si no estás seguro de si un valor significa "aprobado", **no asumas**. Detente y pide al usuario que
aclare o actualice el spec con la redacción canónica.

**Mensaje de error estándar cuando el estado no significa Aprobado:**

```
❌ No puedo implementar este spec.

Estado actual: [ESTADO ENCONTRADO]
Solo trabajo con specs cuyo estado significa "Aprobado" (por ejemplo, `Aprobado`, `Approved`,
o el equivalente en otro idioma).

Para continuar tienes dos opciones:
  1. Si el spec ya está listo para implementarse, ábrelo y cambia el estado
     a "Aprobado" (o el término equivalente que use tu equipo) manualmente.
     Ese cambio lo hace la persona, no el agente.
  2. Si el spec todavía necesita trabajo, usa /spec [nombre] para retomarlo.
```

No ofrezcas alternativas, no sugieras "puedo empezar igual si quieres". El bloqueo es intencional.

---

### Fase 3 — Crear la rama de git y cambiar a ella

Una vez confirmado que el estado significa `Aprobado`:

1. Deriva el nombre de la rama a partir del nombre completo del archivo del spec, sin la extensión.
   Formato: `spec-NN-slug`. Ejemplos:

   - `09-snake-game.md` → rama `spec-09-snake-game`
   - `specs/game-jam/frogger/01-frogger-game.md` → rama `spec-frogger-game`

2. Lee el flag `AutoCreateBranch` de la **Configuración de creación de rama** mostrada en el contexto
   de sesión arriba.

   - Si el archivo de config no existe, falta el valor, o el valor no es reconocido → trátalo como
     `true` (el default).
   - Solo un `false` explícito (en cualquier capitalización) desactiva la creación automática de rama.

   **Si `AutoCreateBranch` es `true` (default):** procede sin preguntar.

   - Si la rama **no existe**: créala con `git checkout -b spec-NN-slug`.
   - Si **ya existe**: informa al usuario que la rama ya existía (puede significar que se retoma
     trabajo previo).
   - En ambos casos: cambia a la rama con `git checkout spec-NN-slug` y confirma el cambio antes de
     continuar.

   **Si `AutoCreateBranch` es `false`:** pregunta antes de tocar git. Muestra:

   ```
   AutoCreateBranch está en false.
   ¿Crear y cambiar a la rama spec-NN-slug? [s/N]
   ```

   - Si el usuario responde **sí**: crea/cambia a la rama exactamente como en el caso `true` de arriba.
   - Si el usuario responde **no** o deja vacío: **no crees ninguna rama.** Dile al usuario que
     implementarás en la rama actual (la mostrada en el contexto de sesión arriba) y pide confirmación
     explícita para continuar ahí. No improvises — espera la respuesta.

3. Confirma visualmente al usuario que el spec está listo y qué rama está activa:

   ```
   ✅ Listo para implementar.

   Spec:   specs/NN-slug.md
   Rama:   spec-NN-slug  (activa)   (← o la rama actual, si no se creó una rama nueva)
   Estado: Aprobado   (← repite el valor real encontrado en el spec)
   ```

4. **No empieces a implementar todavía.** Primero muestra al usuario el resumen del spec para que lo
   tenga fresco. Extrae y muestra:
   - El **objetivo** (la línea después de `**Objetivo:**` / `**Objective:**` / etiqueta equivalente).
   - El **alcance** (la sección `## Alcance` / `## Scope` / equivalente).
   - El **plan de implementación** (la sección con los pasos numerados — `## Plan de implementación` /
     `## Implementation plan` / equivalente).
   - Los **criterios de aceptación** (el checklist — `## Criterios de aceptación` /
     `## Acceptance criteria` / equivalente).

Identifica las secciones por significado, no por redacción exacta — el spec puede estar en cualquier
idioma.

---

### Fase 4 — Implementar paso a paso

Después de mostrar el resumen del spec, dile al usuario:

```
Voy a implementar el spec siguiendo exactamente el plan de implementación.
Voy a pausar después de cada paso para que revises el diff.

¿Empezamos con el Paso 1?
```

Espera confirmación explícita ("sí", "adelante", "dale" no aplica por la regla de voseo del proyecto
— usa formas como "continúa" o "procede", o equivalente). No empieces sin ella.

Una vez confirmado, sigue estas reglas durante toda la implementación:

**Una regla por encima de todas:** implementa lo que dice el spec. Si algo del spec te parece
subóptimo, menciónalo como observación pero implementa lo acordado. Los cambios al spec van al spec,
no al código por sorpresa.

**Ritmo de trabajo:**

- Implementa un paso del plan.
- Muestra un resumen de qué archivos tocaste y qué hiciste.
- Di: `Paso N completado. ¿Puedes revisar el diff y avisarme si continúo con el Paso N+1?`
- Espera confirmación antes de continuar.

**Si durante la implementación encuentras una ambigüedad** que el spec no resuelve:

- Detente.
- Describe la ambigüedad con precisión.
- Presenta dos o tres opciones concretas.
- Espera la decisión del usuario.
- No improvises.

**Si el usuario pide algo fuera del alcance del spec:**

- Recuérdale que está fuera del alcance de este spec.
- Sugiere anotarlo para el siguiente spec.
- No lo implementes en esta rama.

---

### Fase 5 — Cierre: build, skins y móvil (skin-designer → mobile-porter)

Cuando termines el último paso del plan, **no cierres la conversación todavía**. Sigue este orden
estricto:

1. **Verificación de cierre.** Revisa uno por uno los criterios de aceptación del spec. Luego corre
   `npm run build`. Si falla, **no invoques ningún agente**: corrige primero y vuelve a correr el
   build hasta que quede limpio.

2. **Determinar el objetivo de los agentes** (el juego recién implementado):
   - Fuente primaria: el `id` del juego declarado en el spec (el valor insertado en la tabla `games`
     de Supabase, usado como carpeta `lib/games/<id>/` y como clave en `lib/games/registry.ts`).
   - Fuente secundaria, si la primaria no es clara: el slug del archivo del spec y los archivos que
     efectivamente creaste durante la Fase 4 (por ejemplo, si creaste `lib/games/pacman/engine.ts`, el
     id es `pacman`).
   - Si con eso no puedes identificar el juego con certeza, **detente y pregunta al usuario** (con
     AskUserQuestion o en texto) qué spec/juego se estaba implementando. No lances ningún agente hasta
     tener la respuesta.

3. **Agente 1 — `skin-designer`.** Invócalo con la herramienta Agent, `subagent_type: "skin-designer"`
   y `run_in_background: false` (debes esperar su resultado antes de seguir). En el prompt, nómbrale
   explícitamente el juego objetivo (id y nombre) y el spec del que salió, y aclara que es la primera
   vez que se le pide skins a este juego salvo que el contexto indique lo contrario.

4. **Agente 2 — `mobile-porter`.** Solo después de que `skin-designer` haya devuelto su resultado
   completo, invoca a `mobile-porter` con `subagent_type: "mobile-porter"` y
   `run_in_background: false`, pasándole el mismo juego como objetivo (nombre y ruta `/jugar/<id>`).

   **Regla dura: nunca invoques los dos agentes en el mismo bloque de tool calls.** Deben ir en
   turnos/mensajes separados, `skin-designer` primero y `mobile-porter` solo cuando el primero ya
   terminó y devolvió su reporte.

5. **Resumen final** al usuario, cerrando con:

   ```
   ✅ Spec implementado, con skins y adaptación móvil aplicadas.

   Build: npm run build → limpio
   Skins (skin-designer): [resumen breve de lo aplicado]
   Móvil (mobile-porter): [resumen breve de hallazgos corregidos y abiertos]

   Próximo paso: verificar los criterios de aceptación uno por uno si aún no lo hiciste,
   actualizar el estado del spec a "Implementado" (o el equivalente en el idioma de tu repo)
   y hacer el commit final antes de mergear esta rama.
   ```

---

## Reglas duras

- Los dos agentes van en serie, `skin-designer` → `mobile-porter`, **nunca en paralelo** y nunca en el
  mismo bloque de tool calls.
- No se invoca ningún agente si la implementación quedó incompleta o si `npm run build` falla.
- No cambias el estado del spec ni haces commit ni merge por cuenta propia; eso queda para el usuario.
- Si no puedes derivar con certeza qué juego se implementó, preguntas al usuario antes de invocar
  cualquier agente — no adivinas.
- Respuestas siempre en español neutro, con "tú"/"usted", sin voseo ni modismos regionales.

---

## Resumen del comportamiento esperado

```
/spec-impl-game 09-snake-game

  Fase 1  →  Encuentra specs/09-snake-game.md
  Fase 2  →  Lee el estado → "Aprobado" → ✅ continúa
  Fase 3  →  git checkout -b spec-09-snake-game → git checkout spec-09-snake-game
              Muestra objetivo, alcance, plan y criterios
  Fase 4  →  Implementa paso a paso con pausas
  Fase 5  →  npm run build limpio
              → Agente skin-designer (juego: snake) — espera su reporte
              → Agente mobile-porter (juego: snake) — espera su reporte
              Resumen final + recordatorio de marcar el spec como Implementado

/spec-impl-game 02-powerups  (estado: Borrador)

  Fase 1  →  Encuentra el archivo
  Fase 2  →  Lee el estado → "Borrador" → ❌ se detiene
              Muestra el mensaje de error estándar
              No crea rama, no toca código, no invoca agentes
```

**La creación de rama se controla con el flag `AutoCreateBranch`** en `specs/.spec-config.yml`.
Default `true` (crea la rama automáticamente, como arriba). En `false`, la Fase 3 pregunta `[s/N]`
antes de crear la rama.
