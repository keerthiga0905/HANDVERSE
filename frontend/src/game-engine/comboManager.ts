/** Dynamic Combo Streak and Multiplier Engine for HANDVERSE (Module 06). */

export interface ComboMilestone {
  streak: number;
  multiplier: number;
  label: string;
}

export class ComboManager {
  private currentCombo: number = 0;
  private highestCombo: number = 0;
  private comboTimeoutSeconds: number = 2.5;
  private remainingTime: number = 0;
  private isActive: boolean = false;
  private maxMultiplier: number = 5.0;

  private onMilestoneCallback?: (milestone: ComboMilestone) => void;
  private onComboBrokenCallback?: () => void;

  constructor(options?: { comboTimeoutSeconds?: number; maxMultiplier?: number }) {
    if (options?.comboTimeoutSeconds) {
      this.comboTimeoutSeconds = options.comboTimeoutSeconds;
    }
    if (options?.maxMultiplier) {
      this.maxMultiplier = options.maxMultiplier;
    }
  }

  public setCallbacks(
    onMilestone?: (milestone: ComboMilestone) => void,
    onComboBroken?: () => void
  ): void {
    this.onMilestoneCallback = onMilestone;
    this.onComboBrokenCallback = onComboBroken;
  }

  public registerSuccess(): number {
    this.currentCombo += 1;
    this.remainingTime = this.comboTimeoutSeconds;
    this.isActive = true;

    if (this.currentCombo > this.highestCombo) {
      this.highestCombo = this.currentCombo;
    }

    const mult = this.getMultiplier();

    // Trigger milestone events on key streak numbers
    if ([3, 5, 10, 15, 20, 30, 50].includes(this.currentCombo)) {
      if (this.onMilestoneCallback) {
        let label = `COMBO x${this.currentCombo}!`;
        if (this.currentCombo >= 15) label = `UNSTOPPABLE! ${this.currentCombo}x`;
        else if (this.currentCombo >= 10) label = `HYPER COMBO! ${this.currentCombo}x`;
        else if (this.currentCombo >= 5) label = `SUPER COMBO! ${this.currentCombo}x`;

        this.onMilestoneCallback({
          streak: this.currentCombo,
          multiplier: mult,
          label,
        });
      }
    }

    return this.currentCombo;
  }

  public registerBreak(): void {
    if (this.currentCombo > 0) {
      this.currentCombo = 0;
      this.remainingTime = 0;
      this.isActive = false;
      if (this.onComboBrokenCallback) {
        this.onComboBrokenCallback();
      }
    }
  }

  public update(dt: number): void {
    if (!this.isActive || this.currentCombo === 0) return;

    this.remainingTime -= dt;
    if (this.remainingTime <= 0) {
      this.registerBreak();
    }
  }

  public getMultiplier(): number {
    if (this.currentCombo >= 20) return Math.min(this.maxMultiplier, 5.0);
    if (this.currentCombo >= 15) return Math.min(this.maxMultiplier, 4.0);
    if (this.currentCombo >= 10) return Math.min(this.maxMultiplier, 3.0);
    if (this.currentCombo >= 6) return Math.min(this.maxMultiplier, 2.0);
    if (this.currentCombo >= 3) return Math.min(this.maxMultiplier, 1.5);
    return 1.0;
  }

  public getCombo(): number {
    return this.currentCombo;
  }

  public getHighestCombo(): number {
    return this.highestCombo;
  }

  public getProgress(): number {
    if (!this.isActive || this.comboTimeoutSeconds <= 0) return 0;
    return Math.max(0, Math.min(1.0, this.remainingTime / this.comboTimeoutSeconds));
  }

  public reset(): void {
    this.currentCombo = 0;
    this.highestCombo = 0;
    this.remainingTime = 0;
    this.isActive = false;
  }
}
