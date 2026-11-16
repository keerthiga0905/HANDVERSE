/** High-precision Game Timer for HANDVERSE (Module 06). */

export class GameTimer {
  private totalDurationSeconds: number = 60;
  private remainingSeconds: number = 60;
  private elapsedSeconds: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  private onTickCallback?: (remaining: number, elapsed: number) => void;
  private onTimeUpCallback?: () => void;

  constructor(initialSeconds: number = 60) {
    this.totalDurationSeconds = initialSeconds;
    this.remainingSeconds = initialSeconds;
    this.elapsedSeconds = 0;
  }

  public setCallbacks(
    onTick?: (remaining: number, elapsed: number) => void,
    onTimeUp?: () => void
  ): void {
    this.onTickCallback = onTick;
    this.onTimeUpCallback = onTimeUp;
  }

  public start(seconds?: number): void {
    if (seconds !== undefined) {
      this.totalDurationSeconds = seconds;
      this.remainingSeconds = seconds;
    }
    this.elapsedSeconds = 0;
    this.isRunning = true;
    this.isPaused = false;
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    if (this.isRunning) {
      this.isPaused = false;
    }
  }

  public update(dt: number): void {
    if (!this.isRunning || this.isPaused) return;

    this.elapsedSeconds += dt;
    this.remainingSeconds = Math.max(0, this.remainingSeconds - dt);

    if (this.onTickCallback) {
      this.onTickCallback(this.remainingSeconds, this.elapsedSeconds);
    }

    if (this.remainingSeconds <= 0) {
      this.isRunning = false;
      if (this.onTimeUpCallback) {
        this.onTimeUpCallback();
      }
    }
  }

  public getRemainingSeconds(): number {
    return Math.max(0, this.remainingSeconds);
  }

  public getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  public getProgress(): number {
    if (this.totalDurationSeconds <= 0) return 0;
    return Math.min(1.0, this.remainingSeconds / this.totalDurationSeconds);
  }

  public reset(newDuration?: number): void {
    this.isRunning = false;
    this.isPaused = false;
    if (newDuration !== undefined) {
      this.totalDurationSeconds = newDuration;
    }
    this.remainingSeconds = this.totalDurationSeconds;
    this.elapsedSeconds = 0;
  }
}
