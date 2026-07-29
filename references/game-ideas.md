# Ideas de juegos evaluadas

Memoria del agente `game-planner`. Una fila por juego evaluado; el agente agrega filas, nunca las borra.
Veredictos: `Implementado` | `Sugerido` | `Descartado`.

| Fecha      | Juego      | Categoría | Veredicto    | Motivo         |
| ---------- | ---------- | --------- | ------------ | -------------- |
| 2026-07-24 | Asteroides | SHOOTER   | Implementado | Spec 05.        |
| 2026-07-26 | Tetris     | PUZZLE    | Implementado | Spec 07.        |
| 2026-07-28 | Arkanoid   | ARCADE    | Implementado | Spec 08.        |
| 2026-07-28 | Snake      | ARCADE    | Implementado | Spec 09.        |
| 2026-07-28 | Pong       | VERSUS    | Sugerido     | Recomendación principal: llena hueco VERSUS, motor bajo, sin assets nuevos, color red libre. |
| 2026-07-28 | Frogger    | ARCADE    | Sugerido     | Alternativa: viable pero no diversifica categoría (ya hay 2 ARCADE). |
| 2026-07-28 | 2048       | PUZZLE    | Sugerido     | Alternativa: viable pero no diversifica categoría (ya hay 1 PUZZLE) y encaja peor con Canvas+rAF. |
| 2026-07-28 | Space Invaders | SHOOTER | Descartado | Criterio 7: duplica categoría/mecánica de Asteroides. |
| 2026-07-28 | Pac-Man    | ARCADE    | Descartado   | Criterio 3: motor de pathfinding/laberinto de complejidad alta. |
| 2026-07-28 | Missile Command | SHOOTER | Descartado | Criterio 5: mecánica original depende de apuntar con puntero, no teclado. |
| 2026-07-28 | Lunar Lander | ARCADE | Sugerido | Alternativa nueva: score por aterrizajes/combustible, motor bajo y solo formas vectoriales, pero repite categoría ARCADE y su bucle es más lento que el resto del catálogo. |
| 2026-07-28 | Breakout clásico | ARCADE | Descartado | Criterio 7: solapa por completo con Arkanoid (spec 08). |
| 2026-07-28 | Simon (memoria de secuencias) | PUZZLE | Descartado | Criterio 3/criterio 4: depende de retroalimentación sonora para ser jugable y su score es un contador de rondas muy plano. |
| 2026-07-28 | Bomberman | VERSUS | Descartado | Criterio 3: IA de enemigos y propagación de explosiones elevan la complejidad del motor a alta. |
| 2026-07-28 | Flappy Bird | ARCADE | Descartado | Criterio 8: estética y mecánica de una sola tecla ajenas al canon retro/neón de la plataforma. |
| 2026-07-28 | Muro de Luz (Tron/Light Cycles) | VERSUS | Sugerido | Grilla de ocupación + colisión por celda, sin física continua. Llena VERSUS junto a Pong con mecánica distinta; IA de CPU trivial (lookahead corto, sin pathfinding). |
| 2026-07-28 | Duelo de Tanques (Combat 1977) | VERSUS | Sugerido | Propuesto de forma independiente por dos corridas del agente: señal fuerte. Motor medio (rotación, proyectiles con rebote, IA de persecución simple); reutiliza patrones ya resueltos en Asteroides. |
| 2026-07-28 | Neón Rally (carrera vertical) | ARCADE | Sugerido | Scroll vertical, colisión AABB contra rivales, score por distancia. Motor bajo, pero repite ARCADE (ya hay 2). |
| 2026-07-28 | Conquista Neón (Qix) | ARCADE | Sugerido | Grilla + flood fill de área conquistada. Score muy rico, pero motor menos canónico y necesita más ajuste de balance; repite ARCADE. |
| 2026-07-28 | Torre Neón (ascenso, Icy Tower) | ARCADE | Sugerido | Cámara ascendente, plataformas one-way. Roza el límite de complejidad por gravedad/física; repite ARCADE en vez de diversificar. |
| 2026-07-28 | Burbujas Neón (Puzzle Bobble) | PUZZLE | Sugerido | Recomendación fuerte de la corrida puzzle/shooter: colisión círculo-grilla hexagonal + flood fill por color, motor medio-bajo, cero assets, diversifica PUZZLE sin parecerse a Tetris. |
| 2026-07-28 | Enjambre Neón (Galaxian/Galaga) | SHOOTER | Sugerido | Formaciones en grilla + picadas paramétricas. Motor medio; riesgo de percepción como "otro shooter de naves" junto a Asteroides. |
| 2026-07-28 | Vórtice Neón (Tempest) | SHOOTER | Sugerido | Geometría de tubo por segmentos. Estética vectorial insuperable, pero proyección de profundidad sube el costo del motor; repite SHOOTER. |
| 2026-07-28 | Columnas Neón (Columns) | PUZZLE | Sugerido | Reutiliza casi toda la arquitectura de grilla/gravedad de Tetris cambiando el match por color. Motor más barato del lote, pero diversifica poco dentro de PUZZLE. |
| 2026-07-28 | Vitaminas Neón (Dr. Mario) | PUZZLE | Sugerido | Piezas de dos celdas, match de 4, gravedad de mitades huérfanas. Motor bajo-medio; comparte familia "piezas que caen en grilla" con Tetris y Columnas. |
| 2026-07-28 | Salto Neón (torre vertical de plataformas) | PLATAFORMAS | Sugerido | Categoría nueva para el catálogo (criterio 7 al máximo). Gravedad vertical simple, colisión solo al caer, cero assets. Motor bajo: el mejor candidato para abrir PLATAFORMAS. |
| 2026-07-28 | Cañón Neón (artillería/tiro parabólico) | PRECISIÓN | Sugerido | Física de una sola partícula con gravedad y viento; terreno como arreglo de alturas. Control por teclado nativo (a diferencia de Missile Command, ya descartado). |
| 2026-07-28 | Minigolf Neón | PRECISIÓN | Sugerido | Rebote contra segmentos alineados a los ejes, motor medio. El costo dominante es el diseño de niveles (`levels.ts`), no la física. Score par-a-la-inversa debe quedar explícito en el spec. |
| 2026-07-28 | Defensa del Núcleo (tower defense simple) | ESTRATEGIA | Sugerido | Camino fijo (sin pathfinding), torres por distancia, proyectiles lineales. Única propuesta que aporta un género de decisión en vez de reflejos puros; sin IA de enemigos. |
| 2026-07-28 | Escalada Neón (plataformero de pantalla fija, Donkey Kong) | PLATAFORMAS | Sugerido | Motor medio (gravedad + colisión en ambos ejes + estados de escalera). Riesgo en assets: sin spritesheet el personaje pierde legibilidad; queda como segundo plataformero tras Salto Neón. |
| 2026-07-28 | Avalancha (Kaboom!, atrapar objetos) | ARCADE | Sugerido | Motor más barato del lote: caída rectilínea + paddle + colisión punto-rectángulo. Cero assets nuevos, pero suma un tercer/cuarto ARCADE al catálogo. |
| 2026-07-28 | Túnel Neón (cave flyer / endless runner) | ARCADE | Sugerido | Túnel procedural por dos arreglos de alturas, control analógico continuo (a diferencia de Flappy Bird, ya descartado). Motor bajo, estética vectorial coherente; repite ARCADE. |
| 2026-07-28 | Topos Neón (whac-a-mole por teclado) | ARCADE | Sugerido | Mecánica de reflejos única en el catálogo, partida a contrarreloj fija (score muy comparable). Motor bajo; riesgo de diseño en el feedback visual sin audio. |
| 2026-07-28 | Justa Neón (Joust) | VERSUS | Sugerido | Gravedad + impulso, wrap-around lateral, duelo resuelto por comparación de altura. Motor medio; el ajuste del "feel" de vuelo es el trabajo más delicado del lote. |
| 2026-07-28 | Bejeweled/match-3 por intercambio | PUZZLE | Descartado | Criterio 5: swap con cursor de teclado es lento frente al mouse original; sin presión de tiempo el bucle se estira más de 3 min. |
| 2026-07-28 | Centipede | SHOOTER | Descartado | Criterio 7: tercer shooter de nave, campo de hongos y movimiento serpenteante suben el motor sin diferenciarse lo suficiente de Asteroides/Enjambre Neón. |
| 2026-07-28 | Nonograma/Picross | PUZZLE | Descartado | Criterio 1/2: desenlace único por tablero, sin score acumulable real, partidas largas. |
| 2026-07-28 | Sokoban | PUZZLE | Descartado | Criterio 1: score sería contador de movimientos/niveles, no puntaje acumulable comparable. |
| 2026-07-28 | Lights Out | PUZZLE | Descartado | Criterio 1/2: desenlace único por tablero, sin escala de puntaje. |
| 2026-07-28 | Bomb Jack / Snow Bros y similares | PLATAFORMAS | Descartado | Criterio 3: física de plataformas, colisión por tiles y spritesheets inexistentes; complejidad alta. |
| 2026-07-28 | Zuma | ARCADE | Descartado | Criterio 5: apuntar en 360° desde el centro depende del puntero; se solapa parcialmente con Burbujas Neón. |
| 2026-07-28 | Pinball neón | ARCADE | Descartado | Criterio 3: colisiones contra flippers rotatorios y geometría curva exigen física de cuerpos rígidos. |
| 2026-07-28 | Angry Birds (proyectil + estructuras destructibles) | ARCADE | Descartado | Criterio 3: simulación de cuerpos conectados; Cañón Neón cubre el mismo nicho con física de una partícula. |
| 2026-07-28 | Stick Hero (puente extensible) | ARCADE | Descartado | Criterio 8: mecánica de una sola tecla, mismo motivo por el que ya se descartó Flappy Bird. |
| 2026-07-28 | Lemmings / puzzle de rutas | PUZZLE | Descartado | Criterio 1/2: desenlace único por nivel, sin score acumulable real, partidas largas. |
| 2026-07-28 | Ajedrez / puzzles por turnos | ESTRATEGIA | Descartado | Criterio 1/3: sin score numérico continuo y con necesidad de IA. |
| 2026-07-28 | Q*bert | ARCADE | Descartado | Criterio 3: render isométrico + varios enemigos con patrones distintos, complejidad alta. |
| 2026-07-28 | Dig Dug / Burger Time | ARCADE | Descartado | Criterio 3: IA de enemigos por túneles/escaleras, mismo motivo por el que Bomberman ya está descartado. |
| 2026-07-28 | Duck Hunt / shooters de puntería | SHOOTER | Descartado | Criterio 5: dependen del puntero, igual que Missile Command. |
| 2026-07-28 | Track & Field (mashing de teclas) | ARCADE | Descartado | Criterio 1/8: score plano y mecánica de aporreo poco compatible con partidas rejugables. |
