# CONTEXTO — florida-ar

> Memoria viva del proyecto para personas e IAs: qué es, cómo va, qué se decidió y qué sigue.
> Última actualización: 2026-11-19 17:24 · rama main · commit a037ed0 · sin versión
> Cómo mantenerlo: AGENTS.md → «Al terminar un bloque de trabajo».

<!-- hilo:estado:inicio -->
## Estado actual
- **Qué es:** juego web de realidad aumentada para una feria universitaria: un cofre abre 7 minijuegos arcade sobre Florida y cada uno da 1 estrella.
- **Fase:** MVP (rediseño arcade: fases 1 y 2 terminadas, commit 1.1).
- **Funciona hoy:** los 7 minijuegos en celular con 3 modos de control: táctil, mano (índice frente a la cámara trasera) y pie (patada con la cámara trasera sobre el piso real) en los deportes.
- **Modo Quest VR-1 hecho** (base en `xr.js`): botón 🥽 solo en visores con WebXR, menú 3D flotante con el índice o rayo, tarjetas y cuenta regresiva en 3D, confort y calidad. Los deportes muestran por ahora una tarjeta «llega en la siguiente entrega».
- **Modo Quest es aparte y opcional:** los modos del celular no cambian.
- **En curso:** VR-2, Miami Heat, Penales y Fútbol americano en realidad mixta.
- **Siguiente paso:** probar VR-1 en Meta Quest 3S real y arrancar VR-2.
- **Bloqueos / riesgos:** Modo Quest verificado solo con emulador IWER (Quest 3); nada probado en Quest real ni en iPhone real. El Quest no sigue los pies, así que la patada en el visor será con la mano.
<!-- hilo:estado:fin -->

## 1. Propósito y alcance
- **Problema / para quién:** proyecto de Cielo (Ingeniería Multimedia, Universidad Simón Bolívar, Cúcuta) para mostrar en una feria: visitantes que juegan 1–3 minutos por minijuego con su celular. Prioridad: iPhone 15 Pro Max con Safari.
- **Incluye:** intro «Welcome to Florida!», cofre con 7 portales (Orlando, Héroes, Miami urbano, tour acuático, Miami Heat, fútbol americano, penales), medallas y récords guardados en el celular, y el Modo Quest (en desarrollo).
- **No incluye (por ahora):** servidor ni cuentas (todo corre en el navegador); logos o diseños protegidos (Miami Heat, Harry Potter, Marvel, Thor, Capitán América); seguimiento del pie dentro del Quest.

## 2. Stack y entorno
| Capa | Tecnología | Versión | Nota |
|---|---|---|---|
| Base | HTML + CSS + JavaScript (sitio estático, módulos ES, sin compilación) | — | |
| 3D | Three.js (importmap desde jsDelivr) | 0.160.0 | FBXLoader y GLTFLoader para los modelos |
| Mano | MediaPipe Tasks Vision (HandLandmarker, desde jsDelivr) | 0.10.x | ver `VER` en `handTracking.js` |
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
xr.js               Modo Quest: sesión WebXR, manos, menú 3D, paneles canvas y confort (se conecta a game.js con ganchos)
gestures.js         reconocedor de figuras de Orlando: zigzag, línea y círculo (GEST)
assets/modelos/     FBX con nombres genéricos (los que usa el juego)
Modelos texturizados/  FBX originales de Cielo (no se usan en el juego; no subir: nombres de marcas)
JUEGO.md            biblia del juego: arte, game feel, decisiones de diseño
```

## 4. Convenciones
- Código, comentarios y textos en español. Los textos en fuente pixel van sin tildes (`pxText`), porque «Press Start 2P» no las trae.
- Cada minijuego es una función `(ctx, opt)` que devuelve `{ start, update, dispose, tap/onDown/onMove/onUp… }`; se registra en `GAMES`/`GAMES2` con `pix`, `tag`, `how` y `fact`.
- Los ajustes que Cielo puede tocar van en constantes con nombre al inicio de cada sección (`KICK`, `FLOOR`, `GEST`, `DUEL`, `HZ`, `STY`, `POST_X`, `QUEST`), con un comentario en español.
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

## 6. Pendientes
- [x] Modo Quest, VR-1: base (WebXR, manos, menú 3D, paneles, confort, calidad).
- [ ] Modo Quest, VR-2: Miami Heat, Penales y Fútbol americano en realidad mixta.
- [ ] Modo Quest, después: Orlando, Héroes, Miami urbano y tour acuático.
- [ ] Probar en iPhone real y en Quest 3S real (patada, mano, gestos, giroscopio).
- [ ] Confirmar el origen del balón «Trionda Ball 2026» (posibles derechos).
- [ ] No subir la carpeta «Modelos texturizados» (nombres de marcas y duplicados).

## 7. Problemas conocidos y trampas
- Hay dos juegos con la clave `miami`: el de `scenes.js` no se usa, porque `GAMES2.miami` (tour acuático de scenes2.js) lo reemplaza.
- En Chrome automático (SwiftShader) el juego corre más lento que en un celular (`dt` limitado a 0.05 s): las pruebas deben esperar estados del juego, no tiempos fijos.
- Los FBX no traen texturas (rutas de otro PC); los colores se fijan en `models.js`.
- En el Quest, una página web no puede usar las cámaras del visor de forma confiable: el detector de patada del celular no sirve allí.
- Modo Quest: verificado solo con emulador IWER 2.8 (Quest 3) en Chrome automático, 15/15 comprobaciones; regresión de penales y fútbol americano en iPhone emulado sin errores. No probado en Quest real.

## 8. Bitácora
<!-- Entradas nuevas ARRIBA. Aquí se conservan las últimas 8; las anteriores se archivan solas en .hilo/historial.md -->
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
