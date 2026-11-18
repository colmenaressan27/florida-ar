# florida-ar

## Créditos de modelos 3D (carpeta `assets/`)

- `Michelle.glb`: personaje y animación de Mixamo (Adobe), tomado de los ejemplos de three.js.
- `Flamingo.glb` y `Parrot.glb`: aves animadas de mirada (ro.me), tomadas de los ejemplos de three.js. Uso académico, sin fines comerciales.

## Modelos del proyecto (carpeta `assets/modelos/`, formato FBX)

Varitas, martillo, arco, escudo, lancha, moto acuática, tabla de surf, balones (baloncesto, fútbol americano y fútbol), arco de fútbol, postes de fútbol americano y tableros de baloncesto (con y sin red).

- Se cargan y ajustan en `models.js` (orientación, tamaño y materiales). Los FBX no incluyen las imágenes de textura, así que los colores salen del modelo y los diseños (balones, tabla, escudo, red, tablero) se dibujan por código con diseños originales.
- Para cambiar un modelo: exporta desde Blender un FBX con el mismo nombre de archivo y reemplázalo en `assets/modelos/`.
- Para usar tus propias imágenes de textura: cópialas a `assets/modelos/texturas/` y regístralas en `TEXTURAS`, al inicio de `models.js`.
- La lancha y la moto acuática FBX no se usan por ahora (el tour acuático usa sus vehículos hechos por código). Para volver a usarlas, quítalas de `SIN_USO` en `models.js`.

## Ajustes de juego (si algo se siente difícil o fácil)

- Patada con el pie: `KICK` en `footTracking.js`.
- Gestos de Orlando (⚡ zigzag, ➖ línea, ⭕ círculo): `GEST` en `gestures.js`; tiempos del duelo: `DUEL` en `scenes.js`.
- Héroes (vida de drones y jefe, cada cuánto disparan): `HZ` en `scenes2.js`.
- Penales (los 3 porteros): `STY` en `scenes2.js`. Postes que se mueven en fútbol americano: `POST_X`, `PUSH_SP` y `CAM_LIFT` en `scenes2.js`.
