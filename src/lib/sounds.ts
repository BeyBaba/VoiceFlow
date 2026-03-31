const AudioCtx = typeof window !== "undefined" ? (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) : null;

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!AudioCtx) return null;
  if (!ctx || ctx.state === "closed") {
    ctx = new AudioCtx();
  }
  return ctx;
}

function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("voiceflow-sounds") !== "off";
}

function beep(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, c.currentTime);
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

export function playClick() {
  beep(800, 0.08, "sine", 0.08);
}

export function playRecordStart() {
  beep(523, 0.12, "sine", 0.12);
  setTimeout(() => beep(659, 0.12, "sine", 0.12), 100);
}

export function playRecordStop() {
  beep(659, 0.12, "sine", 0.12);
  setTimeout(() => beep(523, 0.12, "sine", 0.12), 100);
}

export function playSuccess() {
  beep(523, 0.1, "sine", 0.1);
  setTimeout(() => beep(659, 0.1, "sine", 0.1), 80);
  setTimeout(() => beep(784, 0.15, "sine", 0.1), 160);
}

export function playError() {
  beep(330, 0.2, "square", 0.08);
  setTimeout(() => beep(262, 0.3, "square", 0.08), 150);
}

export function playCopy() {
  beep(1047, 0.06, "sine", 0.06);
}
