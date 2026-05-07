// ── Haptic ─────────────────────────────────────────────────────────────────
export function haptic(pattern = [45]) {
  try { navigator.vibrate?.(pattern); } catch {}
}

export function hapticCelebrate() {
  haptic([60, 40, 80, 40, 120]);
}

// ── Audio (Web Audio API) ───────────────────────────────────────────────────
let _ctx = null;
function audioCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  // Safari requires resume after a user gesture
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

function tone(freq, startTime, duration, gainVal = 0.28, type = "sine", ctx) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(gainVal, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

// Single satisfying "done" ding — two-tone pop
export function playDing() {
  try {
    const c   = audioCtx();
    const now = c.currentTime;
    tone(660, now,        0.06, 0.22, "sine",     c);
    tone(990, now + 0.04, 0.35, 0.18, "sine",     c);
  } catch {}
}

// Full-day celebration chord sweep
export function playCelebration() {
  try {
    const c   = audioCtx();
    const now = c.currentTime;
    // Ascending arpeggio: C5 E5 G5 C6 E6
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      tone(freq, now + i * 0.1, 0.55, 0.2, "sine", c);
    });
    // Warm sub layer
    tone(130, now, 0.7, 0.12, "triangle", c);
  } catch {}
}

// Meal check — softer click
export function playClick() {
  try {
    const c   = audioCtx();
    const now = c.currentTime;
    tone(440, now,        0.04, 0.15, "sine", c);
    tone(660, now + 0.03, 0.25, 0.10, "sine", c);
  } catch {}
}

// All meals done for the day
export function playMealCelebration() {
  try {
    const c   = audioCtx();
    const now = c.currentTime;
    [392, 523, 659, 784].forEach((freq, i) => {
      tone(freq, now + i * 0.11, 0.5, 0.18, "sine", c);
    });
  } catch {}
}
