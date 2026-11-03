let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(next: boolean): void {
  muted = next;
}

export function unlockAudio(): void {
  const ac = context();
  if (ac && ac.state === "suspended") void ac.resume().catch(() => {});
}

function context(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number): void {
  const ac = context();
  if (!ac || muted) return;
  try {
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + start);
    amp.gain.setValueAtTime(0.0001, ac.currentTime + start);
    amp.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start(ac.currentTime + start);
    osc.stop(ac.currentTime + start + dur + 0.02);
  } catch {
    /* audio is a courtesy, never a crash */
  }
}

export function playFlip(): void {
  tone(540, 0, 0.07, "triangle", 0.05);
  tone(780, 0.05, 0.08, "triangle", 0.04);
}

export function playError(): void {
  tone(196, 0, 0.12, "sawtooth", 0.03);
  tone(140, 0.08, 0.14, "triangle", 0.03);
}

export function playWin(): void {
  [523, 659, 784, 1047].forEach((freq, i) => tone(freq, i * 0.09, 0.16, "triangle", 0.06));
}
