type AC = AudioContext;

let ctx: AC | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let muted = false;

function ac(): AC | null {
  return ctx;
}

export function unlockAudio() {
  if (typeof window === "undefined") return;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  if (!ctx) {
    ctx = new Ctor({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    sfx.connect(master);
    master.connect(ctx.destination);
    master.gain.value = muted ? 0 : 0.72;
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function setMuted(v: boolean) {
  muted = v;
  if (master && ctx) {
    master.gain.setTargetAtTime(v ? 0 : 0.72, ctx.currentTime, 0.03);
  }
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  slide?: number,
) {
  if (!ctx || !sfx || muted) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(sfx);
  o.start(t);
  o.stop(t + dur + 0.02);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
  };
}

function noise(dur: number, vol: number, hp = 400) {
  if (!ctx || !sfx || muted) return;
  const n = 2 * ctx.sampleRate * dur;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(sfx);
  src.start(t);
  src.stop(t + dur);
  src.onended = () => {
    src.disconnect();
    filter.disconnect();
    g.disconnect();
  };
}

export function sfxClick() {
  const f = 420 + Math.random() * 90;
  tone(f, 0.07, "sine", 0.05, f * 1.6);
}

export function sfxCrit() {
  noise(0.12, 0.18, 200);
  tone(90, 0.22, "sawtooth", 0.12, 40);
  tone(720, 0.16, "square", 0.05, 180);
}

export function sfxBuy() {
  tone(520, 0.08, "triangle", 0.07, 780);
  tone(780, 0.12, "sine", 0.05, 1040);
}

export function sfxKill() {
  tone(160, 0.18, "sawtooth", 0.08, 60);
  tone(640, 0.14, "triangle", 0.05, 220);
}

export function sfxDomain() {
  noise(0.4, 0.1, 80);
  tone(48, 0.6, "sine", 0.16, 28);
  tone(880, 0.5, "triangle", 0.04, 220);
}

export function sfxPrestige() {
  tone(220, 0.4, "sine", 0.1, 880);
  tone(440, 0.5, "triangle", 0.07, 1320);
}

export function sfxSkill(kind: "blue" | "red" | "purple") {
  if (kind === "blue") {
    tone(640, 0.2, "sine", 0.1, 160);
    tone(980, 0.14, "triangle", 0.05, 240);
  } else if (kind === "red") {
    noise(0.12, 0.12, 280);
    tone(130, 0.24, "sawtooth", 0.12, 55);
  } else {
    noise(0.28, 0.14, 90);
    tone(70, 0.42, "sine", 0.14, 32);
    tone(920, 0.22, "triangle", 0.05, 180);
  }
}

export function sfxHit() {
  tone(360 + Math.random() * 90, 0.05, "square", 0.035, 120);
}

export function sfxHurt() {
  noise(0.14, 0.12, 180);
  tone(110, 0.18, "sawtooth", 0.1, 40);
}

export function sfxLevel() {
  tone(520, 0.12, "sine", 0.07, 780);
  tone(780, 0.18, "triangle", 0.05, 1040);
}

export function sfxDash(kind: "gojo" | "sukuna") {
  if (kind === "gojo") {
    tone(880, 0.09, "sine", 0.08, 220);
    noise(0.06, 0.05, 700);
  } else {
    noise(0.1, 0.12, 280);
    tone(170, 0.12, "sawtooth", 0.1, 64);
  }
}

export function sfxOver(won: boolean) {
  if (won) {
    tone(320, 0.28, "sine", 0.1, 640);
    tone(480, 0.4, "triangle", 0.07, 960);
  } else {
    tone(140, 0.42, "sawtooth", 0.1, 48);
    noise(0.2, 0.08, 120);
  }
}

export { ac };
