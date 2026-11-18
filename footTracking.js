// Seguimiento de los pies con MediaPipe Pose Landmarker + detector de patadas.
// El cuerpo se procesa internamente y NO se dibuja: solo se usa la punta del zapato (el círculo amarillo del recuadro de cámara).
const VER = '0.10.14';
const BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';

// ext: cuánto se prolonga el punto desde el talón hacia la punta (botones "Punto ▲ / ▼").
// sens: sensibilidad de la patada (botón "Sensibilidad"): 1 = normal, más alto = basta una patada más suave.
export const foot = { side: 'right', ext: 0.3, sens: 1 };
// Umbrales de la patada, medidos en "largos de pierna" (cadera→tobillo), así funciona igual cerca o lejos de la cámara.
//   dist: cuánto debe alejarse la punta del pie de donde estaba quieta (0.25 = un cuarto de pierna). Bajar = más fácil.
//   time: en cuántos milisegundos como máximo debe hacer ese recorrido. Subir = acepta patadas más lentas.
//   calm: cuánto puede bailar el pie mientras "estás quieto". cooldown: espera entre una patada y la siguiente (ms).
export const KICK = { dist: 0.22, time: 280, calm: 0.15, cooldown: 1500 };

let pl = null, on = false, lastTime = -1, lastRun = 0;
const det = createKickDetector();

export async function startFoot(video, cb) {
  if (on) return;
  if (!pl) {
    const { FilesetResolver, PoseLandmarker } = await import(`${BASE}/vision_bundle.mjs`);
    const files = await FilesetResolver.forVisionTasks(`${BASE}/wasm`);
    const opts = delegate => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.3, minPosePresenceConfidence: 0.3, minTrackingConfidence: 0.3 });
    try { pl = await PoseLandmarker.createFromOptions(files, opts('GPU')); }
    catch (e) { pl = await PoseLandmarker.createFromOptions(files, opts('CPU')); }
  }
  on = true; det.reset();
  const step = () => {
    if (!on) return;
    requestAnimationFrame(step);
    const now = performance.now();
    if (now - lastRun < 20 || video.readyState < 2 || video.currentTime === lastTime) return;
    lastRun = now; lastTime = video.currentTime;
    let r; try { r = pl.detectForVideo(video, now); } catch (e) { return; }
    cb(det.update(r.landmarks && r.landmarks[0], now, video.videoWidth || 640, video.videoHeight || 480));
  };
  step();
}
export function stopFoot() { on = false; }

/* ---------------- Detector de patadas (sin dependencias: se puede probar aparte) ----------------
   Recibe los 33 puntos del cuerpo de cada cuadro y devuelve:
   { present, body, x, y (punta del zapato elegido, 0..1 en el video), ready (pie quieto, listo para patear), kick: { pw, lat } }
   Una patada = el pie estaba QUIETO y de pronto se mueve rápido hacia arriba (o lejos de donde estaba).
   Así un paso o caminar no cuentan, porque el pie ya venía moviéndose. */
const IDX = { left: { hip: 23, ankle: 27, heel: 29, toe: 31 }, right: { hip: 24, ankle: 28, heel: 30, toe: 32 } };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const spread = w => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const q of w) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); } return Math.max(x1 - x0, y1 - y0); };
function analyze(hs, t) {
  const last = hs.filter(h => t - h.t <= 500);
  const calmNow = last.length >= 3 && t - last[0].t >= 400 && spread(last) < KICK.calm; // quieto durante casi medio segundo
  const rest = hs.filter(h => t - h.t >= 300 && t - h.t <= 1000);
  if (rest.length < 4 || rest[rest.length - 1].t - rest[0].t < 300 || spread(rest) > KICK.calm) return { calmNow };
  const R = { x: rest.reduce((s, q) => s + q.x, 0) / rest.length, y: rest.reduce((s, q) => s + q.y, 0) / rest.length };
  const dist = q => Math.hypot(q.x - R.x, q.y - R.y), now = hs[hs.length - 1], D = dist(now), need = KICK.dist / foot.sens;
  if (D < need) return { calmNow };
  // ¿cuándo salió el pie de su sitio? (última muestra que seguía cerca del reposo)
  const rec = hs.filter(h => t - h.t <= 400);
  let k = -1; for (let i = rec.length - 1; i >= 0; i--) if (dist(rec[i]) < 0.1) { k = i; break; }
  if (k < 0) return { calmNow };
  const took = t - rec[k].t;
  // debe haber al menos un cuadro intermedio: así un salto de un solo cuadro (error del detector) no cuenta
  const mid = rec.slice(k + 1, -1).some(h => dist(h) > 0.1);
  const dx = now.x - R.x, dy = now.y - R.y, speed = D / Math.max(took / 1000, 0.05);
  if (took <= KICK.time * Math.sqrt(foot.sens) && speed > 1.1 / foot.sens && mid && (-dy > need * 0.6 || D > need * 1.8)) {
    // la cámara mira a la persona: su derecha aparece a la IZQUIERDA de la imagen (x menor)
    let lat = clamp(-dx / Math.max(0.3, Math.abs(dy)) * 0.9, -1, 1); if (Math.abs(lat) < 0.15) lat = 0;
    const pw = clamp(1 + (speed - 1.5) / 1.5 * 0.2, 1, 1.3);
    return { calmNow, kick: { pw, lat, speed } };
  }
  return { calmNow };
}
export function createKickDetector() {
  let leg = 0, hist = { left: [], right: [] }, cdUntil = 0;
  const vis = (p, i) => (p[i] && (p[i].visibility ?? 1)) || 0;
  const toe = (p, s) => { // punta del zapato: dedo del pie prolongado desde el talón; si no se ve, el tobillo
    const I = IDX[s];
    if (vis(p, I.toe) > 0.15 && vis(p, I.heel) > 0.1) { const h = p[I.heel], q = p[I.toe]; return { x: q.x + (q.x - h.x) * foot.ext, y: q.y + (q.y - h.y) * foot.ext }; }
    if (vis(p, I.ankle) > 0.2) return { x: p[I.ankle].x, y: p[I.ankle].y + 0.04 };
    return null;
  };
  return {
    reset() { leg = 0; hist = { left: [], right: [] }; cdUntil = 0; },
    update(p, t, W, H) {
      if (!p) { hist.left.length = hist.right.length = 0; return { present: false, body: false }; }
      // largo de pierna = la pierna de apoyo (la más larga en la imagen; la que patea se ve más corta al venir hacia la cámara)
      let L = 0;
      for (const s of ['left', 'right']) { const I = IDX[s]; if (vis(p, I.hip) > 0.3 && vis(p, I.ankle) > 0.2) L = Math.max(L, Math.hypot((p[I.ankle].x - p[I.hip].x) * W, (p[I.ankle].y - p[I.hip].y) * H)); }
      if (L) leg = leg ? leg + (L - leg) * 0.1 : L;
      const main = foot.side === 'left' ? 'left' : 'right', other = main === 'left' ? 'right' : 'left';
      const pts = { left: toe(p, 'left'), right: toe(p, 'right') }, show = pts[main] || pts[other];
      const hips = [IDX.left.hip, IDX.right.hip].filter(i => vis(p, i) > 0.3);
      if (!show) return { present: false, body: true };
      if (!leg || !hips.length) return { present: true, body: true, x: show.x, y: show.y, ready: false };
      const hx = hips.reduce((s, i) => s + p[i].x, 0) / hips.length, hy = hips.reduce((s, i) => s + p[i].y, 0) / hips.length;
      let kick = null, ready = false;
      for (const s of [main, other]) { // se puede patear con cualquiera de los dos pies
        const q = pts[s], hs = hist[s];
        if (!q) { hs.length = 0; continue; }
        hs.push({ t, x: (q.x - hx) * W / leg, y: (q.y - hy) * H / leg });
        while (hs.length && t - hs[0].t > 1200) hs.shift();
        const r = analyze(hs, t);
        if (s === main || !pts[main]) ready = r.calmNow;
        if (!kick && r.kick && t > cdUntil) kick = r.kick;
      }
      if (kick) { cdUntil = t + KICK.cooldown; hist.left.length = hist.right.length = 0; }
      return { present: true, body: true, x: show.x, y: show.y, ready, kick };
    }
  };
}
