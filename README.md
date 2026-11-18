# florida-ar

## Créditos de modelos 3D (carpeta `assets/`)

- `Michelle.glb`: personaje y animación de Mixamo (Adobe), tomado de los ejemplos de three.js.
- `Flamingo.glb` y `Parrot.glb`: aves animadas de mirada (ro.me), tomadas de los ejemplos de three.js. Uso académico, sin fines comerciales.

## Modelos del proyecto (carpeta `assets/modelos/`, formato FBX)

Varitas, martillo, arco, escudo, lancha, moto acuática, tabla de surf, balones (baloncesto, fútbol americano y fútbol), arco de fútbol, postes de fútbol americano y tableros de baloncesto (con y sin red).

- Se cargan y ajustan en `models.js` (orientación, tamaño y materiales). Los FBX no incluyen las imágenes de textura, así que los colores salen del modelo y los diseños (balones, tabla, escudo, red, tablero) se dibujan por código con diseños originales.
- Para cambiar un modelo: exporta desde Blender un FBX con el mismo nombre de archivo y reemplázalo en `assets/modelos/`.
- Para usar tus propias imágenes de textura: cópialas a `assets/modelos/texturas/` y regístralas en `TEXTURAS`, al inicio de `models.js`.
