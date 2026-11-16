/** High-performance delta-time Game Loop for HANDVERSE (Module 06). */

export class GameLoop {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private maxDeltaTime: number = 0.1; // Clamp to 100ms max to prevent physics teleportation

  private onUpdate: (dt: number) => void;
  private onRender: () => void;
  private onVisibilityChange?: (isVisible: boolean) => void;

  private boundFrameStep: (timestamp: number) => void;
  private boundVisibilityHandler: () => void;

  constructor(
    onUpdate: (dt: number) => void,
    onRender: () => void,
    onVisibilityChange?: (isVisible: boolean) => void
  ) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.onVisibilityChange = onVisibilityChange;

    this.boundFrameStep = this.step.bind(this);
    this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.boundFrameStep);
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    if (!this.isRunning) {
      this.start();
      return;
    }
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now(); // Reset timestamp so delta time doesn't jump
    }
  }

  public stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy(): void {
    this.stop();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
    }
  }

  private step(timestamp: number): void {
    if (!this.isRunning) return;

    if (this.lastTime === 0) {
      this.lastTime = timestamp;
    }

    const rawDelta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Clamp delta time to avoid large jumps when tab resumes or thread lags
    const dt = Math.max(0, Math.min(rawDelta, this.maxDeltaTime));

    if (!this.isPaused) {
      this.onUpdate(dt);
    }

    this.onRender();

    this.animationFrameId = requestAnimationFrame(this.boundFrameStep);
  }

  private handleVisibilityChange(): void {
    const isVisible = document.visibilityState === 'visible';
    if (!isVisible && this.isRunning && !this.isPaused) {
      // Auto-pause if tab becomes hidden
      this.pause();
    }
    if (this.onVisibilityChange) {
      this.onVisibilityChange(isVisible);
    }
  }

  public getStatus(): { isRunning: boolean; isPaused: boolean } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
    };
  }
}
