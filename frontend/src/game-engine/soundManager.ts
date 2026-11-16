/** Web Audio API Synthesized Sound Manager for HANDVERSE (Module 06).
 *
 * Uses native Web Audio oscillators to synthesize high-energy neon arcade SFX
 * with zero network payload, zero latency, and zero audio asset loading errors.
 */

export class GameSoundManager {
  private audioCtx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private masterVolume: number = 0.5;
  private lastSoundTimes: Record<string, number> = {};

  constructor(enabled: boolean = true, volume: number = 0.5) {
    this.isEnabled = enabled;
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  private initContext(): boolean {
    if (!this.isEnabled) return false;
    if (typeof window === 'undefined') return false;

    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    return this.audioCtx !== null && this.audioCtx.state === 'running';
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  private checkCooldown(soundKey: string, cooldownMs: number = 60): boolean {
    const now = performance.now();
    const last = this.lastSoundTimes[soundKey] || 0;
    if (now - last < cooldownMs) {
      return false;
    }
    this.lastSoundTimes[soundKey] = now;
    return true;
  }

  public playClick(): void {
    if (!this.initContext() || !this.checkCooldown('click', 50)) return;
    const ctx = this.audioCtx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2 * this.masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  public playCountdown(): void {
    if (!this.initContext() || !this.checkCooldown('countdown', 200)) return;
    const ctx = this.audioCtx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime); // Pitch A4

    gain.gain.setValueAtTime(0.3 * this.masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  public playCountdownGo(): void {
    if (!this.initContext() || !this.checkCooldown('countdownGo', 200)) return;
    const ctx = this.audioCtx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // High A5
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.4 * this.masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  public playScore(): void {
    if (!this.initContext() || !this.checkCooldown('score', 60)) return;
    const ctx = this.audioCtx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.25 * this.masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  public playCombo(multiplier: number = 1): void {
    if (!this.initContext() || !this.checkCooldown('combo', 80)) return;
    const ctx = this.audioCtx!;
    const baseFreq = 440 * Math.min(2.5, 1 + multiplier * 0.2);

    [0, 0.05, 0.1].forEach((delay, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * (1 + idx * 0.25), ctx.currentTime + delay);

      gain.gain.setValueAtTime(0.2 * this.masterVolume, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.15);
    });
  }

  public playLifeLost(): void {
    if (!this.initContext() || !this.checkCooldown('lifeLost', 150)) return;
    const ctx = this.audioCtx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.35 * this.masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  public playLevelComplete(): void {
    if (!this.initContext() || !this.checkCooldown('levelComplete', 300)) return;
    const ctx = this.audioCtx!;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  public playGameOver(): void {
    if (!this.initContext() || !this.checkCooldown('gameOver', 500)) return;
    const ctx = this.audioCtx!;
    const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4

    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.15;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3 * this.masterVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }
}
