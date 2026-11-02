import { readPreference, writePreference } from "@/lib/preferences";
// Tiny synth for game sounds. No audio files: everything is generated with Web Audio.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = readPreference("muted") === "true";
const listeners = new Set<() => void>();
export const getMuted = () => muted;
export const subscribeSound = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function setMuted(value: boolean) {
  muted = value;
  writePreference("muted", String(value));
  if (master && ctx) master.gain.setValueAtTime(value ? 0 : 1, ctx.currentTime);
  if (!value) audio();
  listeners.forEach((listener) => listener());
}

function audio() {
  if (typeof window === "undefined" || muted) return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return ctx;
  } catch { return null; }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, at = 0, slide = 0) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  unlock() { audio(); },
  /** Green lever: a soft mechanical clunk. */
  green(vol = 1) {
    tone(220, 0.08, "square", 0.05 * vol);
    tone(330, 0.12, "triangle", 0.06 * vol, 0.05);
  },
  /** Red lever: a harsh two-tone alarm, loud enough that nearby players notice. */
  red(vol = 1) {
    for (let i = 0; i < 3; i++) {
      tone(880, 0.12, "sawtooth", 0.07 * vol, i * 0.26);
      tone(620, 0.12, "sawtooth", 0.07 * vol, i * 0.26 + 0.13);
    }
  },
  /** One real wheel pass: a little squeak from the Wheel Room. */
  squeak(vol = 1) {
    tone(1500, 0.05, "sine", 0.02 * vol, 0, 1.35);
  },
  /** The wheel stopped: the power winds down. */
  powerDown() {
    tone(320, 0.7, "sawtooth", 0.05, 0, 0.25);
  },
  /** The wheel is turning again. */
  powerUp() {
    tone(180, 0.4, "triangle", 0.05, 0, 2.6);
  },
  done() {
    tone(660, 0.1, "triangle", 0.08, 0);
    tone(990, 0.18, "triangle", 0.08, 0.09);
  },
  deny() {
    tone(180, 0.15, "square", 0.05, 0, 0.7);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, "triangle", 0.08, i * 0.12));
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, "sawtooth", 0.05, i * 0.16));
  },
};
