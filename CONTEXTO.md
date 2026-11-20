# CONTEXTO — florida-ar

> Memoria viva del proyecto para personas e IAs: qué es, cómo va, qué se decidió y qué sigue.
> Última actualización: 2026-11-20 11:40 · rama main · commit 4049c31 · sin versión
> Cómo mantenerlo: AGENTS.md → «Al terminar un bloque de trabajo».

<!-- hilo:estado:inicio -->
## Estado actual
- **Qué es:** juego web de realidad aumentada para una feria universitaria: un cofre abre 7 minijuegos arcade sobre Florida y cada uno da 1 estrella.
- **Fase:** MVP (rediseño arcade: fases 1 y 2 terminadas, commit 1.1).
- **Funciona hoy:** los 7 minijuegos en celular con 3 modos de control: táctil, mano (índice frente a la cámara trasera) y pie (patada con la cámara trasera sobre el piso real) en los deportes.
- **Modo Quest VR-1 y VR-2 hechos** (base en `xr.js`): botón 🥽 solo en visores con WebXR, menú 3D con el índice o rayo, tarjetas y cuenta regresiva en 3D, confort y calidad. Es aparte y opcional: los modos del celular no cambian.
- **Deportes y mundos en el Quest:** Touchdown NFL y Penales MLS en realidad mixta (ventana al estadio, golpe con la palma); Miami Heat rehecho en el cuarto (agarre con la palma, dribleo, barra de tiro, zonas y clavada). Orlando e Isla de Héroes en VR completa (hechizos y escudo con las manos). Miami urbano y tour acuático muestran aún una tarjeta.
- **Modo «🦶 Con mis pies (PC)»** (nuevo, sin probar): Touchdown NFL y Penales MLS; `sensor.html` en una PC detecta la patada y la envía al visor por PeerJS con un código de 4 dígitos.
- **Siguiente paso:** probar en Quest 3S real VR-1, VR-2, el Miami Heat nuevo, Orlando e Héroes en VR y el modo pies con una PC (ajustar HANDKICK, XRB, KICKCAM, XO.PX y XH.SHIELD_R); revisar si la red de la feria deja conectar PeerJS (si no, hotspot de celular).
- **Bloqueos / riesgos:** nada de las sesiones del 2026-11-20 (Miami Heat nuevo, modo pies, Orlando e Héroes en VR) se probó (ni emulador, pedido de Cielo). Quest verificado solo con IWER; PeerJS depende de un servicio externo gratuito e internet. El Quest no sigue los pies: la patada en el visor es con la mano.
<!-- hilo:estado:fin -->

## 1. Propósito y alcance
- **Problema / para quién:** proyecto de Cielo (Ingeniería Multimedia, Universidad Simón Bolívar, Cúcuta) para mostrar en una feria: visitantes que juegan 1–3 minutos por minijuego con su celular. Prioridad: iPhone 15 Pro Max con Safari.
- **Incluye:** intro «Welcome to Florida!», cofre con 7 portales (Orlando, Héroes, Miami urbano, tour acuático, Miami Heat, Touchdown NFL, Penales MLS), medallas y récords guardados en el celular, y el Modo Quest (en desarrollo).
- **No incluye (por ahora):** servidor ni cuentas (todo corre en el navegador); logos o diseños protegidos (Miami Heat, Harry Potter, Marvel, Thor, Capitán América); seguimiento del pie dentro del Quest.

## 2. Stack y entorno
| Capa | Tecnología | Versión | Nota |
|---|---|---|---|
| Base | HTML + CSS + JavaScript (sitio estático, módulos ES, sin compilación) | — | |
| 3D | Three.js (importmap desde jsDelivr) | 0.160.0 | FBXLoader y GLTFLoader para los modelos |
| Mano | MediaPipe Tasks Vision (HandLandmarker, desde jsDelivr) | 0.10.x | ver `VER` en `handTracking.js` |
| Cuerpo (sensor de pies) | MediaPipe Tasks Vision · PoseLandmarker lite (desde jsDelivr) | 0.10.14 | solo en `sensor.html`, en la PC |
| Conexión PC ↔ visor | PeerJS (WebRTC; su servidor público solo presenta a los dos por el código) | 1.5.4 | `FEET.PEER` en `xr.js` y `PEER` en `sensor.js` |
| Fuentes | Google Fonts: Press Start 2P y Baloo 2 | — | |

| Acción | Comando |
|---|---|
| Previsualizar | abrir `index.html` con Live Preview o `npx serve .` (la cámara exige HTTPS o localhost) |
| Modo depuración | añadir `?debug` a la URL (expone `window.__fl`) |

- **Entorno:** navegador móvil con HTTPS (cámara, giroscopio y Wake Lock). No hay dependencias que instalar.
- **Despliegue:** GitHub Pages desde el repositorio `colmenaressan27/florida-ar` (rama main) → https://colmenaressan27.github.io/florida-ar/ (responde, verificado 2026-11-19).

## 3. Mapa del código
<!-- Solo lo que no es obvio: dónde vive cada pieza importante y cómo se conectan. -->
```text
index.html          pantallas (intro, cámara, controles, menú ⚙️, tarjetas) e importmap de Three.js
CSS/style.css       estilo «arcade tropical» (tokens, botones, intro, HUD, recuadro de cámara)
game.js             punto de entrada: escena 3D, puntero unificado (táctil, ratón, índice), giroscopio, sonidos, capa arcade, modo pie y bucle principal
scenes.js           cofre (hub), Orlando (duelo por gestos), Miami Heat y utilidades 3D compartidas; catálogo GAMES
scenes2.js          Miami urbano, Isla de Héroes, fútbol americano, penales y tour acuático; catálogo GAMES2 (tiene prioridad sobre GAMES)
models.js           carga y ajuste de los 14 FBX de assets/modelos/ (TEXTURAS, SIN_USO)
footTracking.js     patada por movimiento con la cámara trasera (KICK)
handTracking.js     dedo índice con MediaPipe
sensor.html         sensor de pies en una PC aparte (MediaPipe Pose): detecta la patada y la envía al visor por PeerJS con código de 4 dígitos; el video no sale de la PC
sensor.js           lógica de sensor.html (detección de patada y conexión PeerJS)
xr.js               Modo Quest: sesión WebXR, manos, menú 3D, paneles canvas y confort (se conecta a game.js con ganchos)
gestures.js         reconocedor de figuras de Orlando: zigzag, línea y círculo (GEST)
assets/modelos/     FBX con nombres genéricos (los que usa el juego)
Modelos texturizados/  FBX originales de Cielo (no se usan en el juego; no subir: nombres de marcas)
JUEGO.md            biblia del juego: arte, game feel, decisiones de diseño
```

## 4. Convenciones
- Código, comentarios y textos en español. Los textos en fuente pixel van sin tildes (`pxText`), porque «Press Start 2P» no las trae.
- Cada minijuego es una función `(ctx, opt)` que devuelve `{ start, update, dispose, tap/onDown/onMove/onUp… }`; se registra en `GAMES`/`GAMES2` con `pix`, `tag`, `how` y `fact`.
- Los ajustes que Cielo puede tocar van en constantes con nombre al inicio de cada sección (`KICK`, `KICKCAM`, `FLOOR`, `GEST`, `DUEL`, `HZ`, `STY`, `POST_X`, `QUEST`, `XZ`, `XO`, `XH`), con un comentario en español.
- Nada de recursos protegidos: modelos y texturas originales o dibujados por código; sonidos sintetizados con Web Audio.
- Commits: los hace Cielo (mensajes cortos tipo «1.0.2», «1.1»).

## 5. Decisiones
| Fecha | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| 2026-11-18 | Patear con la cámara trasera y el celular en la mano; balón anclado al piso con el giroscopio | con la cámara frontal había que alejar el celular | cámara frontal con detección de cuerpo |
| 2026-11-18 | Estilo «arcade tropical» y rediseño por fases (detalle en JUEGO.md) | elegido por Cielo | — |
| 2026-11-18 | Fase 2: penales con 3 porteros y esquina x2; postes que se mueven; Orlando por gestos; Héroes con oleadas y jefe; Miami urbano igual; tour acuático como antes | respuesta de Cielo al plan | viento en fútbol americano |
| 2026-11-19 | Modo Quest como modo aparte y opcional; vuelve WebXR solo para el visor | Cielo quiere jugar en un Meta Quest 3S sin cambiar los modos actuales | reemplazar los modos del celular |
| 2026-11-19 | En el Quest: deportes en realidad mixta y mundos en VR («según el juego»); menú 3D flotante con el índice como cursor; patada con la mano | elegido por Cielo; el Quest no sigue los pies | control amarrado al tobillo (queda para después) |
| 2026-11-19 | Paneles 3D del Modo Quest dibujados con canvas, sin librería de UI | menos dependencias y control total del diseño | librería three-mesh-ui |
| 2026-11-19 | Modo Quest aislado en `xr.js`, con ganchos (`inXR()`, `onStart`/`onEnd`, grupo `rig`) en `game.js` | no tocar los modos del celular | mezclar la lógica XR dentro de cada minijuego |
| 2026-11-19 | Penales y fútbol americano en el Quest: ventana al estadio con stencil y marco neón en el cuarto | el estadio flotando en el cuarto atravesaba las paredes | estadio flotando en el cuarto |
| 2026-11-19 | Miami Heat en el Quest: tiro con física real y ayuda parcial (ASSIST) hacia un arco *(reemplazada el 2026-11-20 por la barra de tiro)* | el medidor de tiro del celular no encaja con la mano | medidor de tiro del celular |
| 2026-11-20 | Miami Heat en el Quest: barra de tiro por tiempo estilo 2K (verde entra, amarillo pega en el aro, fuera falla), agarre con la palma, zonas con puntos y clavada | física pura con ayuda parcial se sentía difícil e incómodo (pedido de Cielo) | física pura (ASSIST) |
| 2026-11-20 | Modo «🦶 Con mis pies (PC)»: `sensor.html` con MediaPipe Pose en una PC aparte; la patada llega al visor por PeerJS/WebRTC con código de 4 dígitos; el video no sale de la PC | Cielo quiere patear con el cuerpo usando la cámara de la PC, como modo adicional | seguimiento de piernas del propio Quest (no es real); servidor propio |
| 2026-11-20 | Nombres «Touchdown NFL» y «Penales MLS»; marcas solo como texto, sin logos | pedido de Cielo | nombres anteriores («Fútbol americano», «Penales») |
| 2026-11-20 | Mundos en el Quest (Orlando, Héroes) en VR completa con manos virtuales de puntos, no en realidad mixta | los mundos son escenas propias; la realidad mixta no encajaba | realidad mixta para los mundos |
| 2026-11-20 | Orlando en el Quest: hechizos dibujados con la pinza sostenida (gestures.js sobre el plano de la vista), no detección automática por velocidad | evita hechizos falsos al mover la mano | detección por velocidad, como en el celular |
| 2026-11-20 | Héroes en el Quest: bloqueo con escudo en la mano izquierda y esquivar moviéndose, sin botón de cubrirse | más físico y acorde al visor | botón de cubrirse |

## 6. Pendientes
- [x] Modo Quest, VR-1: base (WebXR, manos, menú 3D, paneles, confort, calidad).
- [x] Modo Quest, VR-2: Miami Heat, Penales y Fútbol americano en realidad mixta (sin probar en Quest real).
- [x] Modo Quest: Orlando e Isla de Héroes en VR (sin probar en Quest real).
- [ ] Probar Orlando e Héroes en Quest 3S real (reconocimiento de figuras y XO.PX; tamaño del escudo XH.SHIELD_R y puntería).
- [ ] Modo Quest, después: Miami urbano y tour acuático.
- [ ] Probar en iPhone real y en Quest 3S real (patada, mano, gestos, giroscopio).
- [ ] Probar VR-1 y VR-2 en Quest 3S real; ajustar HANDKICK (`xr.js`) y XRB (`scenes.js`).
- [ ] Probar el Miami Heat nuevo en Quest 3S real (barra, zonas, clavada).
- [ ] Probar el modo «Con mis pies (PC)» con una PC (ajustar KICKCAM); revisar si la red de la feria permite PeerJS (si no, hotspot de celular).
- [ ] Confirmar el origen del balón «Trionda Ball 2026» (posibles derechos).
- [ ] No subir la carpeta «Modelos texturizados» (nombres de marcas y duplicados).

## 7. Problemas conocidos y trampas
- Hay dos juegos con la clave `miami`: el de `scenes.js` no se usa, porque `GAMES2.miami` (tour acuático de scenes2.js) lo reemplaza.
- En Chrome automático (SwiftShader) el juego corre más lento que en un celular (`dt` limitado a 0.05 s): las pruebas deben esperar estados del juego, no tiempos fijos.
- Los FBX no traen texturas (rutas de otro PC); los colores se fijan en `models.js`.
- En el Quest, una página web no puede usar las cámaras del visor de forma confiable: el detector de patada del celular no sirve allí.
- Modo Quest: verificado solo con emulador IWER 2.8 (Quest 3) en Chrome automático. VR-1: 15/15 comprobaciones. VR-2: 18/18 deportes en dos corridas. Regresión de penales y fútbol americano en iPhone emulado sin errores. No probado en Quest real.
- Sesión 2026-11-20 (Miami Heat nuevo, modo pies y renombres): nada se probó, ni con emulador; solo se revisó la sintaxis (pedido de Cielo).
- Sesión 2026-11-20 (Orlando e Héroes en VR): nada se probó, ni con emulador; solo sintaxis (pedido de Cielo).
- «Touchdown» no es técnicamente lo que pasa en el juego (es un gol de campo); se usó por pedido de Cielo.
- Modo pies: PeerJS depende de un servicio externo gratuito y de internet.

## 8. Bitácora
<!-- Entradas nuevas ARRIBA. Aquí se conservan las últimas 8; las anteriores se archivan solas en .hilo/historial.md -->
### 2026-11-20 · sin versión · Claude Code
- Orlando en el visor (`scenes.js`, bloque XO): vitrina de varitas flotante, varita en la mano derecha, hechizos dibujados en el aire con la pinza sostenida (`gestures.js` proyecta el trazo al plano de la vista), palma abierta = escudo y leyenda de hechizos en 3D con demostración en chispas. Se aparece frente al mago con fundido.
- Isla de Héroes en el visor (`scenes2.js`, bloque XH): vitrina de poderes y botones, arma en la mano derecha (apuntar y pinza para atacar, escudo con gesto), escudo de energía en la mano izquierda que bloquea bolas rojas, y esquivar moviéndose («¡ESQUIVADA!»). Ambas escenas usan la posición real de la cabeza en el mundo.
- `xr.js`: manos dibujadas con puntos de luz cuando el mundo tapa el cuarto, detección de mano abierta, leyenda 3D reutilizable (`legend`), rayo para apuntar si la escena lo pide (`xrRays`), y menú con la fila «Mundos · realidad virtual» (Orlando, Héroes) y «Próximamente» (Miami urbano, tour acuático).
- `README.md` actualizado. No probado: solo revisión de sintaxis, por pedido de Cielo (ni emulador).
### 2026-11-20 · sin versión · Claude Code
- Miami Heat en el visor rehecho (`scenes.js`, bloque XZ/XRB): agarre con la palma (sin pinza), dribleo que empuja hacia el piso y rebota a la altura de la mano, y barra de tiro estilo 2K junto al balón (verde entra, amarillo pega en el aro, fuera falla).
- Zonas de tiro (bandeja, doble, triple, clavada) con puntos por zona; la clavada sube el balón y lo baja fuerte cerca del aro. Al cambiar de zona el juego gira al jugador hacia el aro (teleport con mirada en `xr.js`).
- Modo «🦶 Con mis pies (PC)» para Touchdown NFL y Penales MLS: nuevos `sensor.html` y `sensor.js` (MediaPipe Pose en la PC; la patada llega al visor por PeerJS con código de 4 dígitos). En `xr.js` el balón queda en el piso y la tarjeta ofrece «Con la palma» o «Con mis pies».
- Renombres en `scenes2.js` (GAMES2: short, title, pix): «Penales» → «Penales MLS», «Fútbol americano» → «Touchdown NFL». `README.md` actualizado.
- No probado: solo se revisó la sintaxis, por pedido de Cielo (ni emulador).
### 2026-11-19 · sin versión · Claude Code
- Modo Quest VR-2 en `xr.js`: fútbol americano y penales con una «ventana» al estadio en el cuarto (stencil, marco neón). El balón flota a la altura de la cintura y se golpea con la palma: velocidad = fuerza, lado = dirección, detección por barrido entre cuadros.
- Miami Heat en el visor (`scenes.js`, `XRB`): aro en el cuarto sin arena; agarrar con pinza, driblar soltándolo hacia el piso y lanzar con el brazo, con ayuda hacia un tiro en arco (≥40° de caída).
- `scenes2.js` (penales y fútbol americano: `xrWorld` y teleport) y `game.js` (enter/ready en el visor): sin intros de cámara en el visor; cambiar de posición es un salto con fundido. Botonera izquierda: 🏠 Menú y 🌍 Estadio/Cancha completo.
- `README.md` actualizado. Los modos del celular no cambian.
- Verificado solo con emulador IWER 2.8 en Chrome automático: 18/18 deportes (dos corridas) y 15/15 menú; regresión en iPhone emulado (penales y fútbol americano en oro) sin errores. No probado en Quest real.
### 2026-11-19 · sin versión · Claude Code
- Modo Quest VR-1 (pasos 1-4): nuevo `xr.js` con sesión immersive-ar (respaldo immersive-vr), botón 🥽 en «¿Cómo juegas?» solo para visores con WebXR, dedo índice y rayo con pinza/gatillo, menú 3D flotante con 3 deportes y 4 «Próximamente».
- Tarjetas, avisos, pops y cuenta regresiva en 3D; confort (fundido, destello tenue, vibración en vez de sacudida); calidad (sin sombras, foveado, 72 fps); menú con seguimiento perezoso.
- `game.js`: grupo `rig`, ganchos `inXR()`, `clearScene`, `onStart`/`onEnd`. Los modos del celular no cambian.
- `index.html` (`#optQuest`), `CSS/style.css` (`.opt.quest`), `README.md` (sección Modo Quest y ajustes QUEST).
- Tocar un deporte abre por ahora una tarjeta «llega en la siguiente entrega».
- Verificado solo con emulador IWER 2.8 (Quest 3) en Chrome automático: 15/15 comprobaciones; regresión en iPhone emulado sin errores. No probado en Quest real.
### 2026-11-19 · sin versión · hilo:init
- Se crea la memoria del proyecto (CONTEXTO.md, AGENTS.md, CLAUDE.md, .hilo/) a partir del estado actual del repositorio.
- Antes de esto (commits 1.0.1 → 1.1): rediseño arcade (fase 1), patada con cámara trasera y balón anclado al piso, fase 2 de minijuegos (gestures.js nuevo).
- Cielo aprobó el Modo Quest: según el juego, patada con la mano, menú 3D flotante, empezar por los 3 deportes, como modo aparte.
