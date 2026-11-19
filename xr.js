// xr.js — 🥽 MODO QUEST (Meta Quest 3S y otros visores con WebXR)
// Es un modo APARTE y opcional: si el navegador no soporta realidad virtual o mixta, el botón ni aparece
// y los modos del celular (táctil, mano y pie) no cambian.
// Aquí vive: entrar y salir del visor, tus manos (el dedo índice es el cursor), el menú 3D flotante,
// los paneles 3D (tarjetas, avisos y mensajes) y las reglas de confort (fundidos, sin sacudidas, vibración del control).
import * as THREE from 'three';

/* ================= Ajustes que puedes tocar ================= */
// MENU_D: a cuántos metros de ti aparece el menú · MENU_DROP: cuánto más abajo de tus ojos (m)
// POKE: el dedo pulsa un botón al llegar a esta distancia de su superficie (m) · POKE_OUT: al alejarlo esto, puede volver a pulsar
// NEAR: con el dedo a menos de esto de un panel se usa el dedo y se esconde el rayo (m)
// FOLLOW: si miras más de estos grados lejos del menú, el menú vuelve frente a ti
// SCALE: resolución en el visor (1 = la recomendada por el visor; menos = más fluido)
// FOVEA: 0 a 1, cuánto se simplifican los bordes de la vista (más = más fluido) · FPS: cuadros por segundo pedidos al visor
// SHADOWS: sombras dentro del visor (se ven mejor pero cuestan rendimiento)
export const QUEST = { MENU_D: 1.0, MENU_DROP: 0.2, POKE: 0.008, POKE_OUT: 0.025, NEAR: 0.15, FOLLOW: 55, SCALE: 1, FOVEA: 1, FPS: 72, SHADOWS: false };

// Juegos que ya se pueden elegir en el visor (los demás dicen «Próximamente en Quest») y cómo se jugarán con las manos
const SPORTS = {
  heat: { c: '#ff8a00', how: 'Agarra el balón con la mano, dribla contra tu piso y lánzalo al aro con el brazo.' },
  fg: { c: '#3ddc84', how: 'Golpea el balón con la mano para meterlo entre los postes. Los jugadores los cambian de lado en cada ronda.' },
  penalty: { c: '#24d1ff', how: 'El estadio se abre como una ventana frente a ti. Golpea el balón con la mano: la esquina dorada vale doble.' }
};

/* ================= Estilo «arcade tropical» (los mismos colores de CSS/style.css) ================= */
const C = { ink: '#1a0b2e', violet: '#2a0e4a', pink: '#ff4fa3', orange: '#ff8a00', sun: '#ffd54a', sea: '#24d1ff', ok: '#3ddc84', bad: '#ff4d5e', text2: '#c9d1ff' };
const PXF = "'Press Start 2P', monospace", UIF = "'Baloo 2', system-ui, sans-serif", EMO = "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
const PX = 1000; // píxeles del dibujo por metro de panel (1 px = 1 mm)
const pxText = s => String(s).normalize('NFD').replace(/[̀-̂̄-ͯ]/g, '').normalize('NFC'); // la fuente pixel no trae tildes
const mg = document.createElement('canvas').getContext('2d'); // solo para medir textos
const htmlText = h => { // las tarjetas del juego vienen en HTML: se pasan a texto con saltos de línea
  const d = document.createElement('div');
  d.innerHTML = String(h).replace(/<li[^>]*>/g, '\n• ').replace(/<\/(p|div|li|ol|ul)>|<br\s*\/?>/g, '\n');
  return d.textContent.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
};
function wrapLines(g, text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (line && g.measureText(t).width > maxW) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function fit(g, text, weight, size, fam, maxW) { // achica la letra hasta que el texto quepa
  do g.font = `${weight} ${size}px ${fam}`; while (g.measureText(text).width > maxW && --size > 10);
}
function panelBg(g, W, H, accent, r = 34) {
  const gr = g.createLinearGradient(0, 0, W * 0.4, H); gr.addColorStop(0, 'rgba(30,40,110,.96)'); gr.addColorStop(1, 'rgba(56,24,96,.96)');
  rr(g, 8, 8, W - 16, H - 16, r); g.fillStyle = gr; g.fill();
  g.lineWidth = 5; g.strokeStyle = accent; g.shadowColor = accent; g.shadowBlur = 14; g.stroke(); g.shadowBlur = 0;
}
function drawBtn(label, kind = 'ghost', size = 30) { // botón redondeado: primary (amarillo-naranja), ghost o danger
  return (g, W, H, st) => {
    const hov = st === 'hover', prs = st === 'press';
    rr(g, 6, 6, W - 12, H - 12, (H - 12) / 2);
    if (kind === 'primary') { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#ffe58a'); gr.addColorStop(0.35, C.sun); gr.addColorStop(1, C.orange); g.fillStyle = gr; }
    else g.fillStyle = kind === 'danger' ? `rgba(255,77,94,${hov ? 0.42 : 0.2})` : `rgba(255,255,255,${hov ? 0.24 : 0.1})`;
    g.fill();
    if (prs) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fill(); }
    g.lineWidth = hov ? 7 : 3; g.strokeStyle = hov ? (kind === 'primary' ? '#fff' : C.sun) : kind === 'danger' ? C.bad : 'rgba(255,255,255,.35)';
    if (hov) { g.shadowColor = C.sun; g.shadowBlur = 14; } g.stroke(); g.shadowBlur = 0;
    g.fillStyle = kind === 'primary' ? C.ink : '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    fit(g, label, 800, size, UIF, W - 50); g.fillText(label, W / 2, H / 2 + 2);
  };
}

/* ================= Módulo ================= */
export function initXR(api) {
  const { renderer, scene, camera, GAMES, ORDER } = api;
  const rig = camera.parent; // la cámara y las manos viven dentro del mismo grupo (el origen del visor)
  const ANISO = renderer.capabilities.getMaxAnisotropy();
  const ui = new THREE.Group(); ui.visible = false; scene.add(ui); // todo lo del visor: menú, tarjetas, rayos y cursores
  const hud = new THREE.Group(); ui.add(hud);                       // avisos que te siguen la mirada con suavidad
  const surfs = new Set();                                          // superficies que tocas o apuntas (paneles y botones)
  let session = null, xmode = '', frames = 0, cardG = null, toastS = null, toastT = 0, state = '';
  const slots = { info: null, hint: null }, pops = [];
  const isQuestUA = /OculusBrowser|Quest/i.test(navigator.userAgent);

  // ---------- superficies dibujadas con canvas ----------
  function surface(w, h, draw, order = 1, top = false) {
    const cv = document.createElement('canvas'); cv.width = Math.ceil(w * PX); cv.height = Math.ceil(h * PX);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = ANISO;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.02, toneMapped: false, fog: false, depthTest: !top }));
    mesh.renderOrder = order;
    const s = { mesh, w, h, tex, st: '', z0: 0, lift: 0, liftV: 0, flash: 0 };
    s.paint = (st = s.st) => { s.st = st; const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); draw(g, cv.width, cv.height, st); tex.needsUpdate = true; };
    mesh.userData.surf = s; s.paint('idle');
    return s;
  }
  function button(w, h, draw, onPress, order = 2) { const b = surface(w, h, draw, order); b.onPress = onPress; surfs.add(b); return b; }
  function pad(s) { surfs.add(s); return s; } // panel que «frena» el dedo y el rayo (sin acción)
  function place(s, parent, x, y, z = 0) { s.mesh.position.set(x, y, z); s.z0 = z; parent.add(s.mesh); return s; }
  function drop(s) { if (!s) return; surfs.delete(s); s.mesh.removeFromParent(); s.mesh.geometry.dispose(); s.mesh.material.dispose(); s.tex.dispose(); }
  function dropGroup(g) { if (!g) return; for (const m of [...g.children]) if (m.userData.surf) drop(m.userData.surf); g.removeFromParent(); }
  const shown = o => { for (; o; o = o.parent) { if (!o.visible) return false; if (o === scene) return true; } return false; };

  // ---------- dónde está tu cabeza y hacia dónde miras ----------
  const _head = new THREE.Vector3(), _fwd = new THREE.Vector3(), _to = new THREE.Vector3(), _goal = new THREE.Vector3();
  function headPose() {
    camera.getWorldPosition(_head); camera.getWorldDirection(_fwd); _fwd.y = 0;
    if (_fwd.lengthSq() < 1e-4) _fwd.set(0, 0, -1); _fwd.normalize();
  }
  function putInFront(obj, dist, dy) {
    headPose(); obj.position.copy(_head).addScaledVector(_fwd, dist); obj.position.y = _head.y + dy;
    obj.lookAt(_head.x, obj.position.y, _head.z);
  }
  // «seguimiento perezoso»: si el panel queda lejos de tu mirada un momento, vuelve con suavidad frente a ti
  function follow(obj, mem, dist, dt, deg = QUEST.FOLLOW) {
    headPose(); _to.copy(obj.position).sub(_head); _to.y = 0;
    const ang = THREE.MathUtils.radToDeg(_to.angleTo(_fwd));
    mem.away = ang > deg ? (mem.away || 0) + dt : 0;
    if (mem.away > 0.6) mem.go = true;
    if (!mem.go) return;
    _goal.copy(_head).addScaledVector(_fwd, dist); _goal.y = obj.position.y;
    obj.position.lerp(_goal, 1 - Math.exp(-dt * 5)); obj.lookAt(_head.x, obj.position.y, _head.z);
    if (obj.position.distanceTo(_goal) < 0.01) mem.go = false;
  }

  // ---------- menú 3D flotante ----------
  const menu = new THREE.Group(); menu.visible = false; ui.add(menu);
  const menuMem = {}; let menuPlaced = false, menuBg = null, soundB = null;
  const MW = 1.12, MH = 0.74;
  const starsN = () => ORDER.filter(([k]) => api.stars[k]).length;
  function buildMenu() {
    for (const m of [...menu.children]) if (m.userData.surf) drop(m.userData.surf);
    menuBg = pad(place(surface(MW, MH, (g, W, H) => {
      panelBg(g, W, H, C.pink);
      g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      g.font = `58px ${PXF}`; const tg = g.createLinearGradient(46, 50, 46 + 430, 110); tg.addColorStop(0, C.sun); tg.addColorStop(0.5, C.orange); tg.addColorStop(1, C.pink);
      g.fillStyle = '#b8005a'; g.fillText('FLORIDA', 50, 112); g.fillStyle = tg; g.fillText('FLORIDA', 46, 108);
      g.font = `20px ${PXF}`; g.fillStyle = C.sea; g.fillText('MODO QUEST', 50, 148);
      const sn = starsN(); g.textAlign = 'right'; g.font = `26px ${PXF}`; g.fillStyle = sn === 7 ? C.sun : '#fff';
      g.fillText(`${sn}/7`, W - 50, 104); g.font = `40px ${EMO}`; g.fillText('⭐', W - 50 - g.measureText(`${sn}/7`).width - 64, 108);
      g.font = `600 22px ${UIF}`; g.fillStyle = C.text2; g.fillText('☝️ Toca con el dedo  ·  🤏 o apunta y junta los dedos', W - 46, 148);
      g.textAlign = 'left'; g.font = `700 24px ${UIF}`;
      g.fillText('DEPORTES · REALIDAD MIXTA', 46, 192); g.fillText('PRÓXIMAMENTE EN QUEST', 46, 480);
    }, 1), menu, 0, 0, 0));
    const at = (x, y, w, h) => [x / PX + w / PX / 2 - MW / 2, MH / 2 - y / PX - h / PX / 2];
    ['heat', 'fg', 'penalty'].forEach((k, i) => { // fichas grandes de los deportes
      const [x, y] = at(46 + i * 352, 208, 324, 234);
      place(button(0.324, 0.234, drawSport(k), () => openSport(k)), menu, x, y, 0.004);
    });
    ORDER.filter(([k]) => !SPORTS[k]).forEach(([k, icon], i) => { // fichas pequeñas: próximamente
      const [x, y] = at(46 + i * 260, 496, 244, 112);
      place(button(0.244, 0.112, drawSoon(k, icon), () => toast(`🛠️ ${GAMES[k].short}: próximamente en Quest`, 2200)), menu, x, y, 0.004);
    });
    let [x, y] = at(46, 630, 290, 84);
    place(button(0.29, 0.084, drawBtn('🚪 Salir del Quest', 'danger', 28), end), menu, x, y, 0.004);
    [x, y] = at(352, 630, 250, 84);
    soundB = place(button(0.25, 0.084, (g, W, H, st) => drawBtn(api.sound() ? '🔊 Sonido: sí' : '🔇 Sonido: no', 'ghost', 28)(g, W, H, st), () => { api.setSound(!api.sound()); soundB.paint(); }), menu, x, y, 0.004);
  }
  function drawSport(k) {
    const G = GAMES[k], icon = (ORDER.find(([q]) => q === k) || [])[1], acc = SPORTS[k].c;
    return (g, W, H, st) => {
      const hov = st === 'hover', got = !!api.stars[k];
      rr(g, 6, 6, W - 12, H - 12, 24); g.fillStyle = st === 'press' ? '#120724' : C.ink; g.fill();
      g.save(); g.clip(); const rg = g.createRadialGradient(W / 2, 84, 8, W / 2, 84, 170); rg.addColorStop(0, acc); rg.addColorStop(1, 'rgba(26,11,46,0)');
      g.globalAlpha = hov ? 0.8 : 0.5; g.fillStyle = rg; g.fillRect(0, 0, W, H); g.restore();
      rr(g, 6, 6, W - 12, H - 12, 24); g.lineWidth = hov ? 8 : 4; g.strokeStyle = hov ? C.sun : acc;
      if (hov) { g.shadowColor = C.sun; g.shadowBlur = 16; } g.stroke(); g.shadowBlur = 0;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `86px ${EMO}`; g.fillText(icon, W / 2, 84);
      g.fillStyle = '#fff'; fit(g, G.short, 800, 34, UIF, W - 40); g.fillText(G.short, W / 2, 166);
      g.font = `600 22px ${UIF}`; g.fillStyle = got ? C.sun : C.text2; g.fillText(got ? '⭐ ¡Estrella conseguida!' : 'Toca para jugar', W / 2, 202);
    };
  }
  function drawSoon(k, icon) {
    const G = GAMES[k];
    return (g, W, H, st) => {
      const hov = st === 'hover';
      rr(g, 5, 5, W - 10, H - 10, 18); g.fillStyle = st === 'press' ? 'rgba(10,12,32,.95)' : 'rgba(20,26,61,.9)'; g.fill();
      g.lineWidth = 3; g.strokeStyle = hov ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.16)'; g.stroke();
      g.globalAlpha = 0.72; g.textBaseline = 'middle'; g.textAlign = 'center'; g.font = `44px ${EMO}`; g.fillText(icon, 50, H / 2 + 2);
      g.textAlign = 'left'; g.fillStyle = '#fff'; fit(g, G.short, 700, 24, UIF, W - 104); g.fillText(G.short, 90, 40);
      g.globalAlpha = 1; rr(g, 90, 62, 104, 28, 14); g.fillStyle = 'rgba(255,213,74,.16)'; g.fill();
      g.fillStyle = C.sun; g.font = `11px ${PXF}`; g.textAlign = 'center'; g.fillText('PRONTO', 142, 77);
    };
  }
  function showMenu() {
    state = 'menu'; buildMenu(); menu.visible = !cardG;
    if (!menuPlaced) { menu.visible = false; menuMem.wait = true; }
  }
  function openSport(k) { // primera entrega: el menú ya elige los deportes; el juego con las manos llega en la siguiente
    const G = GAMES[k];
    card(G.title, `<p>${SPORTS[k].how}</p><p>🛠️ Este juego llega al Quest en la siguiente entrega.</p>`, [{ label: 'Volver al menú', primary: true }], 'how');
  }

  // ---------- tarjeta 3D (lo mismo que las ventanas del celular) ----------
  function card(title, html, btns, kind = '') {
    closeCard();
    const acc = { win: C.sun, lose: C.pink, how: C.sea }[kind] || C.pink;
    const body = htmlText(html); let size = 30, lines;
    do { mg.font = `600 ${size}px ${UIF}`; lines = wrapLines(mg, body, 800); } while (lines.length > 11 && --size > 22);
    const lh = Math.round(size * 1.38), W = 900, bodyY = 150, btnY = bodyY + lines.length * lh + 30, H = btnY + 84 + 44;
    const g = new THREE.Group(); cardG = g; g.userData.t = 0;
    pad(place(surface(W / PX, H / PX, (c) => {
      panelBg(c, W, H, acc);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = kind === 'lose' ? '#fff' : C.sun;
      const t = pxText(title); fit(c, t, '', 34, PXF, W - 100); c.fillText(t, W / 2, 84);
      c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.font = `600 ${size}px ${UIF}`; c.fillStyle = '#fff';
      lines.forEach((l, i) => c.fillText(l, 50, bodyY + (i + 0.75) * lh));
    }, 3), g, 0, 0, 0));
    const n = Math.max(1, btns.length), bw = (800 - 20 * (n - 1)) / n;
    btns.forEach((b, i) => {
      const x = (50 + i * (bw + 20) + bw / 2) / PX - W / PX / 2, y = H / PX / 2 - (btnY + 42) / PX;
      place(button(bw / PX, 0.084, drawBtn(b.label, b.primary ? 'primary' : 'ghost', 28), () => { closeCard(); b.fn && b.fn(); }, 4), g, x, y, 0.004);
    });
    ui.add(g);
    if (state === 'menu' && menuPlaced) { g.position.copy(menu.position); g.quaternion.copy(menu.quaternion); g.translateZ(0.04); }
    else putInFront(g, QUEST.MENU_D, -QUEST.MENU_DROP);
    g.scale.setScalar(0.88); menu.visible = false;
  }
  function closeCard() {
    if (!cardG) return; dropGroup(cardG); cardG = null;
    if (state === 'menu' && menuPlaced) { menu.visible = true; for (const m of menu.children) m.userData.surf && m.userData.surf.paint(); }
  }

  // ---------- avisos, textos de juego y mensajes «pop» ----------
  function pill(text, { size = 28, color = '#fff', bg = 'rgba(11,16,38,.9)', border = 'rgba(255,255,255,.2)' } = {}) {
    mg.font = `700 ${size}px ${UIF}`; const lines = wrapLines(mg, text, 880);
    const lh = size * 1.3, W = Math.ceil(Math.max(...lines.map(l => mg.measureText(l).width)) + 64), H = Math.ceil(lines.length * lh + 34);
    return surface(W / PX, H / PX, g => {
      rr(g, 3, 3, W - 6, H - 6, Math.min(30, H / 2 - 3)); g.fillStyle = bg; g.fill(); g.lineWidth = 3; g.strokeStyle = border; g.stroke();
      g.font = `700 ${size}px ${UIF}`; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
      lines.forEach((l, i) => g.fillText(l, W / 2, 17 + lh * (i + 0.5)));
    }, 20, true);
  }
  const HUD_D = 1.15, HUD_Y = { info: 0.3, toast: -0.27, hint: -0.4 };
  function hudShow() { if (!hud.userData.placed) { putInFront(hud, HUD_D, 0); hud.userData.placed = true; } }
  function toast(msg, ms = 3000) {
    if (!session) return;
    const y = state === 'menu' && !cardG ? 0.27 : HUD_Y.toast; // con el menú abierto, el aviso va por encima para no taparlo
    drop(toastS); toastS = place(pill(htmlText(msg)), hud, 0, y, 0.01); toastT = ms / 1000; hudShow();
  }
  function setSlot(k, t) {
    const txt = htmlText(t || '');
    if (slots[k] && slots[k].txt === txt) return;
    drop(slots[k]); slots[k] = null;
    if (txt) { slots[k] = place(pill(txt, k === 'hint' ? { size: 26, color: C.text2 } : {}), hud, 0, HUD_Y[k]); slots[k].txt = txt; hudShow(); }
  }
  const POPC = { good: [C.sun, '#b8005a'], fire: ['#ffc04d', '#c21800'], bad: ['#fff', C.bad], small: [C.sun, '#b8005a'] };
  function pop(text, kind = 'good') {
    if (!session) return;
    const t = pxText(text), size = kind === 'bad' || kind === 'small' ? 34 : 52;
    mg.font = `${size}px ${PXF}`; const W = Math.ceil(mg.measureText(t).width + 40), H = size * 2;
    const [fg, sh] = POPC[kind] || POPC.good;
    const s = surface(W / PX, H / PX, g => {
      g.font = `${size}px ${PXF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = C.violet; g.fillText(t, W / 2 + 6, H / 2 + 6); g.fillStyle = sh; g.fillText(t, W / 2 + 3, H / 2 + 3); g.fillStyle = fg; g.fillText(t, W / 2, H / 2);
    }, 30, true);
    putInFront(s.mesh, 1.5, 0.12 - pops.length * 0.02); ui.add(s.mesh); s.life = 0; s.y0 = s.mesh.position.y; pops.push(s);
  }
  function countdown(cb) { // 3 · 2 · 1 · ¡YA!
    let n = 3;
    const step = () => { pop(n > 0 ? String(n) : '¡YA!'); api.sfx(n > 0 ? 'tick' : 'go'); if (n-- > 0) setTimeout(step, 620); else setTimeout(cb, 450); };
    step();
  }

  // ---------- confort: fundidos suaves, destello tenue y vibración del control en vez de sacudir la vista ----------
  const veil = (r, order) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color: 0, side: THREE.BackSide, transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false, fog: false })); m.renderOrder = order; m.visible = false; return m; };
  const fadeM = veil(0.3, 9999), flashM = veil(0.28, 9998); let fadeGoal = 0;
  function fade(on) { fadeGoal = on ? 1 : 0; }
  function flash(kind = 'red') { if (!api.fx()) return; flashM.material.color.set(kind === 'white' ? 0xffffff : 0xff0032); flashM.material.opacity = kind === 'white' ? 0.22 : 0.18; }
  function haptic(v = 0.5, ms = 40, only = null) {
    for (const inp of inputs) {
      if (only && inp !== only) continue;
      const a = inp.src && !inp.src.hand && inp.src.gamepad && inp.src.gamepad.hapticActuators && inp.src.gamepad.hapticActuators[0];
      if (a && a.pulse) try { a.pulse(Math.min(1, v), ms); } catch (e) {}
    }
  }
  const shake = a => haptic(0.3 + a, 60 + a * 140);

  // ---------- tus manos y los controles: el dedo índice es el cursor ----------
  const rayTex = (() => { const cv = document.createElement('canvas'); cv.width = 4; cv.height = 64; const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff'); g.fillStyle = gr; g.fillRect(0, 0, 4, 64); return new THREE.CanvasTexture(cv); })();
  const rayGeo = new THREE.CylinderGeometry(0.0012, 0.0028, 1, 8, 1, true).rotateX(-Math.PI / 2).translate(0, 0, -0.5);
  const ringGeo = new THREE.RingGeometry(0.007, 0.0115, 28), dotGeo = new THREE.SphereGeometry(0.0055, 12, 8), jointGeo = new THREE.SphereGeometry(1, 8, 6);
  const mat = (color, o = {}) => new THREE.MeshBasicMaterial({ color, toneMapped: false, fog: false, ...o });
  const inputs = [0, 1].map(i => {
    const inp = {
      i, ctl: renderer.xr.getController(i), hand: renderer.xr.getHand(i), src: null, hover: null, pressBtn: null, armed: null, near: null, tip: new THREE.Vector3(),
      ray: new THREE.Mesh(rayGeo, mat(0xffffff, { alphaMap: rayTex, transparent: true, depthWrite: false })),
      ring: new THREE.Mesh(ringGeo, mat(C.sun, { transparent: true, depthWrite: false })),
      dot: new THREE.Mesh(dotGeo, mat(C.sun)),
      joints: new THREE.InstancedMesh(jointGeo, mat(0xffffff, { transparent: true, opacity: 0.85 }), 25)
    };
    inp.ray.renderOrder = 40; inp.ring.renderOrder = 41; inp.dot.renderOrder = 42;
    inp.joints.frustumCulled = false; inp.joints.count = 0;
    for (const m of [inp.ray, inp.ring, inp.dot, inp.joints]) { m.visible = false; ui.add(m); }
    rig.add(inp.ctl, inp.hand);
    inp.ctl.addEventListener('connected', e => { inp.src = e.data; });
    inp.ctl.addEventListener('disconnected', () => { inp.src = null; inp.hover = inp.pressBtn = inp.armed = inp.near = null; });
    inp.ctl.addEventListener('selectstart', () => {
      if (!session || inp.near) return; // con el dedo cerca de un panel manda el dedo, no la pinza
      if (inp.hover) inp.pressBtn = inp.hover; else sceneInput('selectstart', inp);
    });
    inp.ctl.addEventListener('selectend', () => {
      const b = inp.pressBtn; inp.pressBtn = null;
      if (b) { if (b === inp.hover) press(b, inp); } else if (session) sceneInput('selectend', inp);
    });
    return inp;
  });
  function sceneInput(type, inp) { const sc = api.current(); if (sc && sc.xrInput) sc.xrInput(type, inp); } // para los juegos (siguiente entrega)
  function press(b, inp) { b.flash = 0.14; api.sfx('click'); haptic(0.5, 30, inp); queueMicrotask(() => b.onPress()); }
  const uiActive = () => !!cardG || (state === 'menu' && menu.visible);
  const _l = new THREE.Vector3(), _o = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3();
  const rc = new THREE.Raycaster(); rc.far = 8;
  function nearest(tip, list) { // el panel o botón que tienes justo delante del dedo
    let best = null;
    for (const s of list) {
      s.mesh.worldToLocal(_l.copy(tip));
      if (Math.abs(_l.x) > s.w / 2 + 0.01 || Math.abs(_l.y) > s.h / 2 + 0.01 || _l.z < -0.04 || _l.z > QUEST.NEAR) continue;
      const score = _l.z - (s.onPress ? 0.02 : 0); // los botones están delante de su panel: ganan
      if (!best || score < best.score) best = { s, z: _l.z, x: _l.x, y: _l.y, score };
    }
    return best;
  }
  function updateInput(inp, list, meshes) {
    inp.ray.visible = inp.ring.visible = inp.dot.visible = inp.joints.visible = false; inp.near = null;
    if (!inp.src) { inp.hover = null; return; }
    const isHand = !!inp.src.hand, j = isHand && inp.hand.joints && inp.hand.joints['index-finger-tip'];
    if (isHand && xmode === 'immersive-vr') drawJoints(inp); // en VR no ves tus manos reales: se dibujan con puntos
    if (j && j.visible) {
      j.getWorldPosition(inp.tip); inp.dot.position.copy(inp.tip); inp.dot.visible = uiActive();
      const nb = uiActive() ? nearest(inp.tip, list) : null;
      if (nb) { // modo dedo: un aro bajo la yema que se achica al acercarte; al «hundir» el dedo, pulsa
        inp.near = nb; const k = THREE.MathUtils.clamp(nb.z / QUEST.NEAR, 0, 1);
        nb.s.mesh.localToWorld(inp.ring.position.set(nb.x, nb.y, 0.003)); nb.s.mesh.getWorldQuaternion(inp.ring.quaternion);
        inp.ring.scale.setScalar(0.55 + k * 1.5); inp.ring.material.opacity = 1 - k * 0.6; inp.ring.visible = true;
        const btn = nb.s.onPress ? nb.s : null; inp.hover = btn;
        if (!btn) { inp.armed = null; return; }
        if (nb.z > QUEST.POKE_OUT) inp.armed = btn;
        if (inp.armed === btn && nb.z < QUEST.POKE) { inp.armed = null; press(btn, inp); }
        return;
      }
      inp.armed = null;
    }
    if (!uiActive()) { inp.hover = null; return; }
    // de lejos: rayo desde la mano o el control; la pinza (o el gatillo) es el clic
    inp.ctl.getWorldPosition(_o); inp.ctl.getWorldQuaternion(_q); _d.set(0, 0, -1).applyQuaternion(_q);
    rc.set(_o, _d); const h = rc.intersectObjects(meshes, false)[0];
    inp.ray.position.copy(_o); inp.ray.quaternion.copy(_q); inp.ray.scale.set(1, 1, h ? h.distance : 0.5);
    inp.ray.material.opacity = h ? 0.9 : 0.35; inp.ray.visible = true;
    if (h) { inp.ring.position.copy(h.point); h.object.getWorldQuaternion(inp.ring.quaternion); inp.ring.translateZ(0.003); inp.ring.scale.setScalar(1); inp.ring.material.opacity = 1; inp.ring.visible = true; }
    const s = h && h.object.userData.surf; inp.hover = s && s.onPress ? s : null;
  }
  function drawJoints(inp) {
    let n = 0;
    for (const jn of Object.values(inp.hand.joints || {})) {
      if (!jn.visible || n >= 25) continue;
      jn.getWorldPosition(_o); _s.setScalar(Math.max(0.004, (jn.jointRadius || 0.008) * 0.9));
      inp.joints.setMatrixAt(n++, _m.compose(_o, _q.identity(), _s));
    }
    inp.joints.count = n; inp.joints.instanceMatrix.needsUpdate = true; inp.joints.visible = n > 0;
  }
  function syncButtons(dt) { // estado visual de cada botón y un pequeño resorte: se levanta al apuntarlo y se hunde al pulsarlo
    for (const b of surfs) {
      if (!b.onPress) continue;
      const hov = inputs.some(i => i.hover === b), prs = b.flash > 0 || inputs.some(i => i.pressBtn === b);
      const st = prs ? 'press' : hov ? 'hover' : 'idle';
      if (st !== b.st) { if (st === 'hover' && b.st === 'idle') haptic(0.12, 12, inputs.find(i => i.hover === b)); b.paint(st); }
      const goal = st === 'press' ? -0.003 : st === 'hover' ? 0.008 : 0;
      b.liftV += ((goal - b.lift) * 320 - b.liftV * 30) * dt; b.lift += b.liftV * dt; b.mesh.position.z = b.z0 + b.lift;
      if (b.flash > 0) b.flash -= dt;
    }
  }

  // ---------- fondo simple si el visor solo tiene realidad virtual (sin cámaras de passthrough) ----------
  let env = null;
  function vrEnv() {
    const g = new THREE.Group(), cv = document.createElement('canvas'); cv.width = 4; cv.height = 256;
    const c = cv.getContext('2d'), gr = c.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#0b1026'); gr.addColorStop(0.42, '#2a0e4a'); gr.addColorStop(0.5, '#ff4fa3'); gr.addColorStop(0.52, '#141a3d'); gr.addColorStop(1, '#0b1026');
    c.fillStyle = gr; c.fillRect(0, 0, 4, 256);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), mat(0xffffff, { map: new THREE.CanvasTexture(cv), side: THREE.BackSide }));
    const grid = new THREE.GridHelper(16, 32, C.sea, '#2a6bff'); grid.material.transparent = true; grid.material.opacity = 0.35;
    g.add(sky, grid); return g;
  }

  // ---------- entrar y salir del visor ----------
  const fontsReady = Promise.race([
    Promise.all([`58px ${PXF}`, `800 30px ${UIF}`, `700 24px ${UIF}`, `600 22px ${UIF}`].map(f => document.fonts.load(f).catch(() => {}))),
    new Promise(r => setTimeout(r, 2500))
  ]);
  const sup = { ar: false, vr: false };
  const supported = (async () => {
    if (!navigator.xr || !navigator.xr.isSessionSupported || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return sup; // en celulares no se ofrece
    try { sup.ar = await navigator.xr.isSessionSupported('immersive-ar'); } catch (e) {}
    try { sup.vr = await navigator.xr.isSessionSupported('immersive-vr'); } catch (e) {}
    return sup;
  })();
  async function start() {
    if (session) return;
    api.audioInit();
    const opts = { requiredFeatures: ['local-floor'], optionalFeatures: ['hand-tracking', 'bounded-floor'] };
    let s = null;
    for (const m of sup.ar ? ['immersive-ar', 'immersive-vr'] : ['immersive-vr']) { // realidad mixta primero (ves tu cuarto)
      try { s = await navigator.xr.requestSession(m, opts); xmode = m; break; } catch (e) { console.warn('XR', m, e); }
    }
    if (!s) { api.toastDom('No se pudo abrir el modo Quest. Revisa que el navegador del visor tenga permiso de realidad virtual.', 5000); return; }
    session = s; frames = 0; menuPlaced = false; state = ''; hud.userData.placed = false;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    renderer.xr.setFramebufferScaleFactor(QUEST.SCALE);
    api.onStart(xmode);
    camera.add(fadeM, flashM);
    if (xmode === 'immersive-vr') { env = vrEnv(); ui.add(env); }
    ui.visible = true;
    try {
      await renderer.xr.setSession(s);
      renderer.xr.setFoveation(QUEST.FOVEA);
      if (s.supportedFrameRates && s.updateTargetFrameRate && [...s.supportedFrameRates].includes(QUEST.FPS)) s.updateTargetFrameRate(QUEST.FPS).catch(() => {});
    } catch (e) { console.warn(e); s.end().catch(() => {}); return; }
    await fontsReady;
    if (session === s) showMenu();
  }
  function end() { if (session) session.end().catch(() => {}); }
  renderer.xr.addEventListener('sessionend', () => { // al quitarte el visor o tocar «Salir»: todo vuelve a la pantalla del celular
    session = null; state = ''; renderer.xr.enabled = false;
    closeCard(); drop(toastS); toastS = null; setSlot('info', ''); setSlot('hint', '');
    for (const p of pops.splice(0)) drop(p);
    for (const m of [...menu.children]) if (m.userData.surf) drop(m.userData.surf);
    if (env) { ui.remove(env); env.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); }); env = null; }
    camera.remove(fadeM, flashM); fadeM.material.opacity = flashM.material.opacity = 0; fadeGoal = 0;
    for (const inp of inputs) { inp.src = inp.hover = inp.pressBtn = inp.armed = inp.near = null; }
    ui.visible = false; menu.visible = false;
    api.onEnd();
  });

  // ---------- botón «🥽 Modo Quest» en «¿Cómo juegas?» ----------
  const btn = document.getElementById('optQuest');
  supported.then(s => {
    if (!btn || !(s.ar || s.vr)) return;
    btn.classList.remove('hidden');
    btn.onclick = () => { api.sfx('click'); start(); };
  });

  // ---------- cada cuadro ----------
  function frame(dt) {
    if (!session) return;
    frames++;
    if (menuMem.wait && frames > 3) { menuMem.wait = false; putInFront(menu, QUEST.MENU_D, -QUEST.MENU_DROP); menuPlaced = true; menu.visible = !cardG; }
    if (state === 'menu' && menu.visible) follow(menu, menuMem, QUEST.MENU_D, dt);
    if (cardG) { // la tarjeta entra con un pequeño «pop» y también te sigue si te giras
      cardG.userData.t += dt; cardG.scale.setScalar(THREE.MathUtils.lerp(0.88, 1, 1 - Math.pow(1 - Math.min(1, cardG.userData.t / 0.22), 3)));
      follow(cardG, cardG.userData, QUEST.MENU_D, dt);
    }
    if (hud.userData.placed) follow(hud, hud.userData, HUD_D, dt, 28);
    const list = [], meshes = [];
    for (const s of surfs) if (shown(s.mesh)) { s.mesh.updateWorldMatrix(true, false); list.push(s); meshes.push(s.mesh); }
    for (const inp of inputs) updateInput(inp, list, meshes);
    syncButtons(dt);
    if (toastS && (toastT -= dt) <= 0) { drop(toastS); toastS = null; }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i]; p.life += dt;
      p.mesh.position.y = p.y0 + p.life * 0.09; p.mesh.scale.setScalar(Math.min(1, 0.6 + p.life * 3));
      p.mesh.material.opacity = p.life < 0.7 ? 1 : Math.max(0, 1 - (p.life - 0.7) / 0.4);
      if (p.life > 1.1) { drop(p); pops.splice(i, 1); }
    }
    const fm = fadeM.material; fm.opacity = THREE.MathUtils.clamp(fm.opacity + Math.sign(fadeGoal - fm.opacity) * dt / 0.25, 0, 1); fadeM.visible = fm.opacity > 0.001;
    if (flashM.material.opacity > 0) flashM.material.opacity = Math.max(0, flashM.material.opacity - dt / 0.35); flashM.visible = flashM.material.opacity > 0.001;
  }

  // para las pruebas automáticas (?debug)
  const _dbg = {
    state: () => ({ on: !!session, mode: xmode, menu: menu.visible, card: !!cardG, toast: !!toastS, inputs: inputs.map(i => ({ src: !!i.src, side: i.src && i.src.handedness, hand: !!(i.src && i.src.hand), hover: !!i.hover, near: !!i.near })) }),
    where: name => { // centro (en el mundo) de un botón del menú o de la tarjeta: 'heat', 'fg', 'penalty', 'orlando'…, 'salir', 'sonido' o 'card0'
      const ms = cardG && name.startsWith('card') ? cardG.children.filter(m => m.userData.surf && m.userData.surf.onPress) : menu.children.filter(m => m.userData.surf && m.userData.surf.onPress);
      const idx = name.startsWith('card') ? +name.slice(4) : ['heat', 'fg', 'penalty', ...ORDER.filter(([k]) => !SPORTS[k]).map(([k]) => k), 'salir', 'sonido'].indexOf(name);
      const m = ms[idx]; if (!m) return null;
      const p = m.getWorldPosition(new THREE.Vector3()), n = new THREE.Vector3(0, 0, 1).applyQuaternion(m.getWorldQuaternion(new THREE.Quaternion()));
      return { p: p.toArray(), n: n.toArray() };
    },
    tip: i => inputs[i].src && inputs[i].src.hand ? inputs[i].tip.toArray() : null,
    ray: i => { inputs[i].ctl.getWorldPosition(_o); inputs[i].ctl.getWorldQuaternion(_q); return { o: _o.toArray(), d: _d.set(0, 0, -1).applyQuaternion(_q).toArray() }; }
  };
  return { on: () => !!session, start, end, card, toast, info: t => setSlot('info', t), hint: t => setSlot('hint', t), pop, countdown, fade, flash, shake, haptic, frame, inputs, _dbg };
}
