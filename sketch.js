let currentMode = 0;
let phase = 'collect'; 
let collected = [0, 0, 0];
const MAX_VAL = 100;

let floaters = [];
let scatterStars = [];
let MODES;

let port, writer;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  MODES = [
    { name: 'Gold', color: color(245, 216, 122) },
    { name: 'Rose', color: color(247, 184, 196) },
    { name: 'Frost', color: color(168, 216, 240) }
  ];

  for (let i = 0; i < 50; i++) floaters.push(new Floater());

  // Listeners
  select('#mode0').mousePressed(() => setMode(0));
  select('#mode1').mousePressed(() => setMode(1));
  select('#mode2').mousePressed(() => setMode(2));
  select('#connect-btn').mousePressed(initSerial);
  select('#release-btn').mousePressed(triggerRelease);
  select('#reset-btn').mousePressed(triggerReset);
}

function draw() {
  if (phase === 'collect') {
    background(5, 4, 15);
    for (let f of floaters) {
      f.update();
      f.display();
    }
    drawStar(mouseX, mouseY, 12, 5, 4, MODES[currentMode].color, true);
  } else {
    background(250, 248, 244);
    for (let s of scatterStars) {
      s.update();
      s.display();
    }
  }
}

function setMode(m) {
  currentMode = m;
  selectAll('.mode-btn').forEach(b => b.style('border-color', 'rgba(255,255,255,0.3)'));
  select(`#mode${m}`).style('border-color', MODES[m].color);
}

function triggerRelease() {
  let total = collected[0] + collected[1] + collected[2];
  if (total > 0) {
    phase = 'scatter';
    scatterStars = [];
    for (let m = 0; m < 3; m++) {
      for (let i = 0; i < collected[m]; i++) {
        scatterStars.push(new ScatterStar(m));
      }
    }
    collected = [0, 0, 0];
    sendSerial(0, 0, 0); 
    updateHUD();
    select('#release-btn').addClass('hidden');
    select('#reset-btn').removeClass('hidden');
  }
}

function triggerReset() {
  phase = 'collect';
  scatterStars = [];
  floaters = [];
  for (let i = 0; i < 50; i++) floaters.push(new Floater());
  select('#reset-btn').addClass('hidden');
  updateHUD();
}

function updateHUD() {
  let total = 0;
  for (let i = 0; i < 3; i++) {
    select(`#cnt${i}`).html(collected[i]);
    total += collected[i];
  }
  
  if (total > 0 && phase === 'collect') {
    select('#release-btn').removeClass('hidden');
  } else {
    select('#release-btn').addClass('hidden');
  }
  
  let g = floor(constrain((collected[0] / MAX_VAL) * 255, 0, 255));
  let r = floor(constrain((collected[1] / MAX_VAL) * 255, 0, 255));
  let f = floor(constrain((collected[2] / MAX_VAL) * 255, 0, 255));
  sendSerial(g, r, f);
}

// --- SERIAL ---
async function initSerial() {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    writer = port.writable.getWriter();
    
    // This part is the "Brain" that handles incoming text
    const decoder = new TextDecoderStream();
    const inputClosed = port.readable.pipeTo(decoder.writable);
    const reader = decoder.readable
      .pipeThrough(new TransformStream(new LineBreakTransformer()))
      .getReader();

    readLoop(reader); 
    select('#connect-btn').html('Connected');
  } catch (e) { 
    console.error("Serial error:", e); 
  }
}

async function readLoop(reader) {
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        let msg = value.trim();
        console.log("Received from Arduino:", msg); // Check your console!
        if (msg === "RELEASE") {
          triggerRelease();
        }
      }
    }
  } catch (e) {
    console.error("Read error:", e);
  } finally {
    reader.releaseLock();
  }
}

// Add this class to the bottom of your sketch.js
class LineBreakTransformer {
  constructor() { this.container = ''; }
  transform(chunk, controller) {
    this.container += chunk;
    const lines = this.container.split('\r\n');
    this.container = lines.pop();
    lines.forEach(line => controller.enqueue(line));
  }
  flush(controller) { controller.enqueue(this.container); }
}

async function sendSerial(g, r, f) {
  if (writer) {
    const data = `L:${g},${r},${f}\n`;
    await writer.write(new TextEncoder().encode(data));
  }
}

// --- CLASSES ---
function drawStar(x, y, r1, r2, n, col, isGlow) {
  push();
  if (isGlow) {
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = col.toString();
  }
  fill(col); noStroke();
  beginShape();
  for (let a = -HALF_PI; a < TWO_PI; a += TWO_PI/n) {
    vertex(x + cos(a) * r1, y + sin(a) * r1);
    vertex(x + cos(a + TWO_PI/(n*2)) * r2, y + sin(a + TWO_PI/(n*2)) * r2);
  }
  endShape(CLOSE);
  pop();
}

class Floater {
  constructor() { this.reset(); this.y = random(height); }
  reset() {
    this.x = random(width); this.y = height + 20;
    this.vel = createVector(random(-0.5, 0.5), random(-0.5, -1.5));
    this.mode = floor(random(3)); this.sz = random(4, 8);
  }
  update() {
    this.x += this.vel.x; this.y += this.vel.y;
    if (this.y < -20) this.reset();
    if (phase === 'collect' && this.mode === currentMode && dist(mouseX, mouseY, this.x, this.y) < 50) {
      if (collected[this.mode] < MAX_VAL) {
        collected[this.mode]++;
        updateHUD();
      }
      this.reset();
    }
  }
  display() {
    let alpha = (this.mode === currentMode) ? 255 : 50;
    let c = color(red(MODES[this.mode].color), green(MODES[this.mode].color), blue(MODES[this.mode].color), alpha);
    drawStar(this.x, this.y, this.sz, this.sz*0.4, 4, c, this.mode === currentMode);
  }
}

class ScatterStar {
  constructor(m) {
    this.pos = createVector(width/2, height/2);
    this.vel = p5.Vector.random2D().mult(random(5, 15));
    this.m = m; this.sz = random(10, 20);
  }
  update() {
    this.vel.y += 0.25; this.pos.add(this.vel);
    if (this.pos.y > height - this.sz) { this.pos.y = height - this.sz; this.vel.y *= -0.55; this.vel.x *= 0.9; }
    if (this.pos.x < 0 || this.pos.x > width) this.vel.x *= -0.7;
  }
  display() {
    drawStar(this.pos.x, this.pos.y, this.sz, this.sz*0.4, 4, MODES[this.m].color, true);
  }
}