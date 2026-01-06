// ===============================
// VARIABLES GLOBALES
// ===============================
let modelos = [];
let piezas = [];
let piezaSeleccionada = null;
let offsetX = 0;
let offsetY = 0;
let SNAP = 15;

let mouseReleaseX = 0;
let mouseReleaseY = 0;

let btnEliminar;
let btnRotar;

// ===============================
// SETUP
// ===============================
function setup() {
  createCanvas(900, 500);

  modelos.push(crearPieza(40, 50, 80, 80, 'x2', true));   // x*x
  modelos.push(crearPieza(40, 160, 80, 30, 'x', true));  // x*1
  modelos.push(crearPieza(40, 220, 30, 30, '1', true));  // 1*1

  // BOTÓN ELIMINAR
  btnEliminar = createButton('🗑 Eliminar');
  btnEliminar.position(20, height - 40);
  btnEliminar.mousePressed(eliminarFicha);

  // BOTÓN ROTAR
  btnRotar = createButton('🔄 Rotar');
  btnRotar.position(20, height - 80);
  btnRotar.mousePressed(rotarPiezaSeleccionada);
}

// ===============================
function draw() {
  background(240);

  fill(220);
  rect(0, 0, 150, height);

  for (let m of modelos) dibujarPieza(m);
  for (let p of piezas) dibujarPieza(p);
}

// ===============================
function crearPieza(x, y, w, h, tipo, modelo = false) {
  return {
    x, y,
    w, h,
    tipo,
    modelo,
    rotada: false
  };
}

// ===============================
// DIBUJO COHERENTE CON GEOMETRÍA
// ===============================
function dibujarPieza(p) {
  push();
  translate(p.x, p.y);

  if (p.tipo === 'x2') fill(80, 130, 255);
  if (p.tipo === 'x')  fill(255, 220, 80);
  if (p.tipo === '1')  fill(255, 100, 100);

  stroke(0);

  let w = p.rotada ? p.h : p.w;
  let h = p.rotada ? p.w : p.h;

  rect(0, 0, w, h);

  // resaltar selección
  if (p === piezaSeleccionada) {
    noFill();
    stroke(0, 255, 0);
    strokeWeight(3);
    rect(0, 0, w, h);
    strokeWeight(1);
  }

  pop();
}

// ===============================
function mousePressed() {

  for (let m of modelos) {
    if (sobrePieza(m)) {
      let n = crearPieza(mouseX, mouseY, m.w, m.h, m.tipo);
      piezas.push(n);
      seleccionarPieza(n);
      return;
    }
  }

  for (let i = piezas.length - 1; i >= 0; i--) {
    if (sobrePieza(piezas[i])) {
      seleccionarPieza(piezas[i]);
      return;
    }
  }

  piezaSeleccionada = null;
}

// ===============================
function seleccionarPieza(p) {
  piezaSeleccionada = p;
  offsetX = mouseX - p.x;
  offsetY = mouseY - p.y;

  piezas = piezas.filter(x => x !== p);
  piezas.push(p);
}

// ===============================
function mouseDragged() {
  if (piezaSeleccionada) {
    piezaSeleccionada.x = mouseX - offsetX;
    piezaSeleccionada.y = mouseY - offsetY;
  }
}

// ===============================
function mouseReleased() {
  if (!piezaSeleccionada) return;

  mouseReleaseX = mouseX;
  mouseReleaseY = mouseY;

  let mejor = null;

  for (let otra of piezas) {
    if (otra === piezaSeleccionada) continue;

    let candidato = calcularImantacion(piezaSeleccionada, otra);
    if (candidato && (!mejor || candidato.dist < mejor.dist)) {
      mejor = candidato;
    }
  }

  if (mejor) {
    piezaSeleccionada.x = mejor.x;
    piezaSeleccionada.y = mejor.y;
  }
}

// ===============================
// BOTÓN ROTAR
// ===============================
function rotarPiezaSeleccionada() {
  if (!piezaSeleccionada) return;

  // SOLO rota la ficha amarilla
  if (piezaSeleccionada.tipo === 'x') {
    piezaSeleccionada.rotada = !piezaSeleccionada.rotada;
  }
}

// ===============================
// BOTÓN ELIMINAR
// ===============================
function eliminarFicha() {
  if (!piezaSeleccionada) return;

  piezas = piezas.filter(p => p !== piezaSeleccionada);
  piezaSeleccionada = null;
}

// ===============================
// HITBOX CORRECTO
// ===============================
function sobrePieza(p) {
  let w = p.rotada ? p.h : p.w;
  let h = p.rotada ? p.w : p.h;

  return mouseX >= p.x && mouseX <= p.x + w &&
         mouseY >= p.y && mouseY <= p.y + h;
}

// ===============================
// IMANTACIÓN CORRECTA
// ===============================
function calcularImantacion(a, b) {

  let Aw = a.rotada ? a.h : a.w;
  let Ah = a.rotada ? a.w : a.h;
  let Bw = b.rotada ? b.h : b.w;
  let Bh = b.rotada ? b.w : b.h;

  let A = { x: a.x, y: a.y, w: Aw, h: Ah };
  let B = { x: b.x, y: b.y, w: Bw, h: Bh };

  let opciones = [];

  // laterales (misma altura)
  if (A.h === B.h) {

    if (abs(A.x - (B.x + B.w)) < SNAP) {
      opciones.push({ x: B.x + B.w, y: B.y });
    }

    if (abs((A.x + A.w) - B.x) < SNAP) {
      opciones.push({ x: B.x - A.w, y: B.y });
    }
  }

  // verticales (mismo ancho)
  if (A.w === B.w) {

    if (abs(A.y - (B.y + B.h)) < SNAP) {
      opciones.push({ x: B.x, y: B.y + B.h });
    }

    if (abs((A.y + A.h) - B.y) < SNAP) {
      opciones.push({ x: B.x, y: B.y - A.h });
    }
  }

  if (opciones.length === 0) return null;

  let mejor = null;
  let mejorDist = Infinity;

  for (let o of opciones) {
    let cx = o.x + A.w / 2;
    let cy = o.y + A.h / 2;
    let d = dist(cx, cy, mouseReleaseX, mouseReleaseY);

    if (d < mejorDist) {
      mejorDist = d;
      mejor = o;
    }
  }

  return { x: mejor.x, y: mejor.y, dist: mejorDist };
}