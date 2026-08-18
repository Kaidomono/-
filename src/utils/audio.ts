/**
 * Web Audio API Sound Synthesizer & Haptic Controller
 * Fully client-side, dependency-free, and safe from CORS/loading failures.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume context if suspended (browser security requirement)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Triggers native physical vibration on Android devices if enabled.
 */
export function triggerVibration(duration: number = 40, enabled: boolean = true) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(duration);
    }
  } catch (e) {
    console.warn("Haptics not supported or blocked by sandbox", e);
  }
}

/**
 * Synthesizes a crisp, clean button click sound.
 */
export function playClickSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch (err) {
    console.error("Audio synthesis error", err);
  }
}

/**
 * Synthesizes a rapid coin jingle (cascade of metal rings).
 */
export function playCoinSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [987.77, 1318.51, 1567.98, 2093.00]; // B5, E6, G6, C7
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.04 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.15);
    });
  } catch (err) {
    console.error("Audio synthesis error", err);
  }
}

/**
 * Synthesizes a metallic clashing sound for combat encounters.
 */
export function playCombatSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // Create white-ish noise for the clash
    const bufferSize = ctx.sampleRate * 0.15; // 150ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Filter to make it metallic (bandpass around 2.5kHz)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2500;
    filter.Q.value = 2.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Also add a high pitched ping
    const pingOsc = ctx.createOscillator();
    const pingGain = ctx.createGain();
    pingOsc.type = 'triangle';
    pingOsc.frequency.setValueAtTime(3200, now);
    pingOsc.frequency.exponentialRampToValueAtTime(2800, now + 0.08);

    pingGain.gain.setValueAtTime(0.04, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    pingOsc.connect(pingGain);
    pingGain.connect(ctx.destination);

    noiseNode.start(now);
    pingOsc.start(now);
    
    noiseNode.stop(now + 0.15);
    pingOsc.stop(now + 0.15);
  } catch (err) {
    console.error("Audio synthesis error", err);
  }
}

/**
 * Synthesizes a deep booming war drum followed by a low war horn sweep.
 */
export function playWarSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // --- WAR DRUM BOOM ---
    const drumOsc = ctx.createOscillator();
    const drumGain = ctx.createGain();
    drumOsc.type = 'triangle';
    drumOsc.frequency.setValueAtTime(120, now);
    drumOsc.frequency.exponentialRampToValueAtTime(45, now + 0.4);

    drumGain.gain.setValueAtTime(0.3, now);
    drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    drumOsc.connect(drumGain);
    drumGain.connect(ctx.destination);

    drumOsc.start(now);
    drumOsc.stop(now + 0.5);

    // --- WAR HORN (Slightly delayed) ---
    const hornDelay = 0.15;
    const hornOsc = ctx.createOscillator();
    const hornGain = ctx.createGain();
    
    // Sawtooth gives a rich buzzy brassy tone
    hornOsc.type = 'sawtooth';
    hornOsc.frequency.setValueAtTime(110, now + hornDelay); // Low A2
    hornOsc.frequency.linearRampToValueAtTime(146.83, now + hornDelay + 0.4); // Sweeps up to D3
    hornOsc.frequency.exponentialRampToValueAtTime(95, now + hornDelay + 0.9); // Low growling taper

    // Low-pass filter to make it sound muffled/distant and majestic
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now + hornDelay);
    filter.frequency.exponentialRampToValueAtTime(250, now + hornDelay + 0.8);

    hornGain.gain.setValueAtTime(0, now);
    hornGain.gain.setValueAtTime(0, now + hornDelay);
    hornGain.gain.linearRampToValueAtTime(0.18, now + hornDelay + 0.1);
    hornGain.gain.linearRampToValueAtTime(0.14, now + hornDelay + 0.6);
    hornGain.gain.exponentialRampToValueAtTime(0.001, now + hornDelay + 1.0);

    hornOsc.connect(filter);
    filter.connect(hornGain);
    hornGain.connect(ctx.destination);

    hornOsc.start(now + hornDelay);
    hornOsc.stop(now + hornDelay + 1.1);
  } catch (err) {
    console.error("Audio synthesis error", err);
  }
}

/**
 * Synthesizes a beautiful rising major pentatonic arpeggio (Mongolian steppe-like flute/chime).
 */
export function playAgeUpSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Pentatonic scale notes: C4, D4, E4, G4, A4, C5, D5
    const freqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
    
    freqs.forEach((freq, idx) => {
      const delay = idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Use triangle or sine for flute/chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.06, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);

      // Add simple echo effect or pass through directly
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.4);
    });
  } catch (err) {
    console.error("Audio synthesis error", err);
  }
}

/**
 * Synthesizes a deep, mournful low minor chord representing death/tragedy.
 */
export function playDeathSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Mournful root, minor third, perfect fifth, octave
    const notes = [110.00, 130.81, 164.81, 220.00]; // A2, C3, E3, A3
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Clean up buzzing harmonics
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350;
      
      osc.disconnect(gain);
      osc.connect(filter);
      filter.connect(gain);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.start(now);
      osc.stop(now + 2.0);
    });
  } catch (err) {
    console.error("Audio synthesis error", err);
  }
}
