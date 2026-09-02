// Web Audio API synthesizer for control room audio alerts & beeps

class SoundService {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.alertInterval = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted) {
      this.stopAlarm();
    }
  }

  isMuted() {
    return this.muted;
  }

  playBeep(freq = 600, duration = 0.08, type = 'sine') {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  playCriticalAlarm() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      // Alternating high-low siren
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.linearRampToValueAtTime(440, now + 0.35);
      osc1.frequency.linearRampToValueAtTime(880, now + 0.7);

      osc2.frequency.setValueAtTime(885, now);
      osc2.frequency.linearRampToValueAtTime(445, now + 0.35);
      osc2.frequency.linearRampToValueAtTime(885, now + 0.7);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.75);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.75);
      osc2.stop(now + 0.75);
    } catch (e) {
      console.warn('Alarm sound error', e);
    }
  }

  // durationMs: if provided, the siren auto-stops after that many ms
  // (e.g. 5000 -> rings for up to 5 seconds then goes silent on its own).
  // If the alarm is already ringing, this is a no-op so re-renders don't
  // restart/stack the siren.
  startContinuousAlarm(durationMs = null) {
    if (this.muted) return;
    if (this.alertInterval) return;

    this.playCriticalAlarm();
    this.alertInterval = setInterval(() => {
      this.playCriticalAlarm();
    }, 1200);

    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
      this.alertTimeout = null;
    }
    if (durationMs) {
      this.alertTimeout = setTimeout(() => {
        this.stopAlarm();
      }, durationMs);
    }
  }

  stopAlarm() {
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
    }
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
      this.alertTimeout = null;
    }
  }

  playSuccess() {
    if (this.muted) return;
    this.playBeep(523.25, 0.1, 'triangle');
    setTimeout(() => this.playBeep(659.25, 0.1, 'triangle'), 100);
    setTimeout(() => this.playBeep(783.99, 0.2, 'triangle'), 200);
  }
}

export const soundService = new SoundService();

