/** Level and Difficulty Progression Manager for HANDVERSE (Module 06). */

import { Difficulty, LevelConfig } from './types';

export class LevelManager {
  private currentLevelNumber: number = 1;
  private currentDifficulty: Difficulty = 'Normal';

  private static readonly DIFFICULTY_MODIFIERS: Record<
    Difficulty,
    { speed: number; lives: number; time: number; scoreScale: number }
  > = {
    Easy: { speed: 0.8, lives: 5, time: 60, scoreScale: 0.8 },
    Normal: { speed: 1.0, lives: 3, time: 45, scoreScale: 1.0 },
    Medium: { speed: 1.0, lives: 3, time: 45, scoreScale: 1.0 },
    Hard: { speed: 1.35, lives: 2, time: 35, scoreScale: 1.4 },
    Extreme: { speed: 1.75, lives: 1, time: 25, scoreScale: 2.0 },
  };

  constructor(difficulty: Difficulty = 'Normal') {
    this.currentDifficulty = difficulty;
    this.currentLevelNumber = 1;
  }

  public setDifficulty(difficulty: Difficulty): void {
    this.currentDifficulty = difficulty;
    this.reset();
  }

  public getDifficulty(): Difficulty {
    return this.currentDifficulty;
  }

  public getLevelNumber(): number {
    return this.currentLevelNumber;
  }

  public getCurrentLevelConfig(): LevelConfig {
    const mod = LevelManager.DIFFICULTY_MODIFIERS[this.currentDifficulty];
    const lvl = this.currentLevelNumber;

    const speedMultiplier = mod.speed * (1 + (lvl - 1) * 0.15);
    const targetScore = Math.round(500 * mod.scoreScale * lvl);
    const timeLimit = Math.max(15, Math.round(mod.time - (lvl - 1) * 3));

    return {
      levelNumber: lvl,
      speedMultiplier,
      targetScore,
      timeLimit,
      description: `Wave ${lvl} - ${this.currentDifficulty.toUpperCase()} DEFENSE`,
    };
  }

  public advanceLevel(): LevelConfig {
    this.currentLevelNumber += 1;
    return this.getCurrentLevelConfig();
  }

  public getInitialLives(): number {
    return LevelManager.DIFFICULTY_MODIFIERS[this.currentDifficulty].lives;
  }

  public reset(difficulty?: Difficulty): void {
    if (difficulty) {
      this.currentDifficulty = difficulty;
    }
    this.currentLevelNumber = 1;
  }
}
