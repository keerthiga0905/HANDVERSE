/** Lives and Health Management for HANDVERSE (Module 06). */

export class LivesManager {
  private maxLives: number = 3;
  private currentLives: number = 3;

  private onLifeLostCallback?: (remainingLives: number) => void;
  private onLifeGainedCallback?: (remainingLives: number) => void;
  private onGameOverCallback?: () => void;

  constructor(initialLives: number = 3, maxLives: number = 5) {
    this.maxLives = maxLives;
    this.currentLives = initialLives;
  }

  public setCallbacks(
    onLifeLost?: (remaining: number) => void,
    onLifeGained?: (remaining: number) => void,
    onGameOver?: () => void
  ): void {
    this.onLifeLostCallback = onLifeLost;
    this.onLifeGainedCallback = onLifeGained;
    this.onGameOverCallback = onGameOver;
  }

  public loseLife(): number {
    if (this.currentLives <= 0) return 0;

    this.currentLives -= 1;
    if (this.onLifeLostCallback) {
      this.onLifeLostCallback(this.currentLives);
    }

    if (this.currentLives <= 0 && this.onGameOverCallback) {
      this.onGameOverCallback();
    }

    return this.currentLives;
  }

  public gainLife(): number {
    if (this.currentLives < this.maxLives) {
      this.currentLives += 1;
      if (this.onLifeGainedCallback) {
        this.onLifeGainedCallback(this.currentLives);
      }
    }
    return this.currentLives;
  }

  public getLives(): number {
    return this.currentLives;
  }

  public getMaxLives(): number {
    return this.maxLives;
  }

  public reset(initialLives: number = 3): void {
    this.currentLives = Math.min(this.maxLives, initialLives);
  }
}
