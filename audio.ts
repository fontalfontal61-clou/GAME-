// Petits sons (WebAudio) et voix (SpeechSynthesis) pour les enfants.

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(value: boolean) {
  enabled = value;
  if (!value && typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function getCtx(): AudioContext | null {
  if (!enabled || typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.18,
  slideTo?: number,
) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export const sfx = {
  tap() {
    tone(660, 0, 0.08, "triangle", 0.12);
  },
  flip() {
    tone(420, 0, 0.09, "triangle", 0.14, 700);
  },
  good() {
    tone(523, 0, 0.14, "triangle");
    tone(659, 0.1, 0.14, "triangle");
    tone(784, 0.2, 0.22, "triangle");
  },
  wrong() {
    tone(300, 0, 0.18, "sawtooth", 0.08, 220);
    tone(220, 0.15, 0.25, "sawtooth", 0.08, 160);
  },
  pop() {
    tone(900, 0, 0.12, "sine", 0.22, 200);
    tone(1500, 0, 0.05, "square", 0.05, 400);
  },
  win() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((n, i) => tone(n, i * 0.13, 0.25, "triangle", 0.18));
  },
};

export function speak(text: string) {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = 0.9;
    u.pitch = 1.15;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("fr"));
    if (voice) u.voice = voice;
    synth.speak(u);
  } catch {
    /* pas de voix disponible : on ignore */
  }
}

export const NUMBER_WORDS = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
];

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
