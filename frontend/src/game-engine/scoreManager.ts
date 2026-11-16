/** Reusable Scoring System for HANDVERSE (Module 06). */

import { ScoreBreakdown } from './types';

export class ScoreManager {
  private baseScore: number = 0;
  private currentMultiplier: number = 1.0;
  private accuracyBonus: number = 0;
  private timeBonus: number = 0;
  private levelBonus: number = 0;
  private penalties: number = 0;
  private totalHits: number = 0;
  private totalMisses: number = 0;

  constructor() {
    this.reset();
  }

  public setMultiplier(multiplier: number): void {
    this.currentMultiplier = Math.max(1.0, multiplier);
  }

  public addHit(basePoints: number, accuracyBonus: number = 0): number {
    this.totalHits += 1;
    const pointsAwarded = Math.round(basePoints * this.currentMultiplier) + accuracyBonus;
    this.baseScore += pointsAwarded;
    this.accuracyBonus += accuracyBonus;
    return pointsAwarded;
  }

  public addMiss(penaltyPoints: number = 0): void {
    this.totalMisses += 1;
    if (penaltyPoints > 0) {
      this.penalties += penaltyPoints;
      this.baseScore = Math.max(0, this.baseScore - penaltyPoints);
    }
  }

  public addTimeBonus(bonus: number): void {
    this.timeBonus += Math.max(0, bonus);
  }

  public addLevelBonus(bonus: number): void {
    this.levelBonus += Math.max(0, bonus);
  }

  public getTotalScore(): number {
    return Math.max(0, this.baseScore + this.timeBonus + this.levelBonus);
  }

  public getAccuracyPercent(): number {
    const totalAttempts = this.totalHits + this.totalMisses;
    if (totalAttempts === 0) return 100.0;
    return Math.round((this.totalHits / totalAttempts) * 1000) / 10;
  }

  public getBreakdown(): ScoreBreakdown {
    return {
      baseScore: this.baseScore,
      comboMultiplier: this.currentMultiplier,
      accuracyBonus: this.accuracyBonus,
      timeBonus: this.timeBonus,
      levelBonus: this.levelBonus,
      penalties: this.penalties,
      totalScore: this.getTotalScore(),
    };
  }

  public getStats(): { hits: number; misses: number; accuracy: number } {
    return {
      hits: this.totalHits,
      misses: this.totalMisses,
      accuracy: this.getAccuracyPercent(),
    };
  }

  public reset(): void {
    this.baseScore = 0;
    this.currentMultiplier = 1.0;
    this.accuracyBonus = 0;
    this.timeBonus = 0;
    this.levelBonus = 0;
    this.penalties = 0;
    this.totalHits = 0;
    this.totalMisses = 0;
  }
}
