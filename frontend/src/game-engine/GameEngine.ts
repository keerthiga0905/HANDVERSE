/** Master HANDVERSE Game Engine Orchestrator (Module 06). */

import {
  AchievementEvent,
  Difficulty,
  GameEngineConfig,
  GameInputEvent,
  GameSessionStats,
  GameState,
  LevelConfig,
  ScoreBreakdown,
} from './types';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
import { GameStateMachine } from './stateMachine';
import { GameLoop } from './gameLoop';
import { GameInputManager } from './inputManager';
import { ScoreManager } from './scoreManager';
import { GameTimer } from './timerManager';
import { LivesManager } from './livesManager';
import { LevelManager } from './levelManager';
import { ComboManager } from './comboManager';
import { GameSoundManager } from './soundManager';
import { ApiService } from '../services/api';
import { TrackingResult } from '../types/tracking';

export interface GameEngineStateSnapshot {
  state: GameState;
  previousState: GameState;
  gameId: string;
  difficulty: Difficulty;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  lives: number;
  maxLives: number;
  level: LevelConfig;
  remainingTime: number;
  timeProgress: number;
  combo: number;
  highestCombo: number;
  comboMultiplier: number;
  comboProgress: number;
  accuracy: number;
  hits: number;
  misses: number;
  countdownNumber: number | null;
  isTrackingActive: boolean;
  fps: number;
}

export type StateListener = (snapshot: GameEngineStateSnapshot) => void;

export class GameEngine {
  public readonly stateMachine: GameStateMachine;
  public readonly input: GameInputManager;
  public readonly score: ScoreManager;
  public readonly timer: GameTimer;
  public readonly lives: LivesManager;
  public readonly level: LevelManager;
  public readonly combo: ComboManager;
  public readonly sound: GameSoundManager;
  private loop: GameLoop;

  private gameId: string = 'engine-sandbox';
  private currentSessionId: string = '';
  private countdownValue: number | null = null;
  private countdownTimerId: number | null = null;
  private stateListeners: Set<StateListener> = new Set();
  private achievementListeners: Set<(ach: AchievementEvent) => void> = new Set();

  private config: GameEngineConfig;
  private fpsCounter: number = 60;
  private frameCount: number = 0;
  private lastFpsTimestamp: number = performance.now();
  private sessionSaved: boolean = false;

  constructor(initialGameId: string = 'engine-sandbox', initialDifficulty: Difficulty = 'Normal') {
    this.gameId = initialGameId;
    this.currentSessionId = generateUUID();

    this.config = {
      timeLimit: 45,
      initialLives: 3,
      basePoints: 100,
      comboTimeout: 2.5,
      maxCombo: 20,
      difficulty: initialDifficulty,
      trackingLossTimeout: 1.5,
      autoPauseOnTrackingLoss: true,
      soundEnabled: true,
      masterVolume: 0.5,
    };

    this.stateMachine = new GameStateMachine('IDLE');
    this.input = new GameInputManager({
      trackingLossTimeoutSeconds: this.config.trackingLossTimeout,
    });
    this.score = new ScoreManager();
    this.timer = new GameTimer(this.config.timeLimit);
    this.level = new LevelManager(initialDifficulty);
    this.lives = new LivesManager(this.level.getInitialLives());
    this.combo = new ComboManager({ comboTimeoutSeconds: this.config.comboTimeout });
    this.sound = new GameSoundManager(this.config.soundEnabled, this.config.masterVolume);

    this.loop = new GameLoop(
      this.update.bind(this),
      this.render.bind(this),
      this.handleVisibilityChange.bind(this)
    );

    this.setupInterconnections();
  }

  private setupInterconnections(): void {
    // 1. Timer hooks
    this.timer.setCallbacks(
      () => {},
      () => {
        // Time up event
        if (this.stateMachine.getState() === 'PLAYING') {
          this.triggerGameOver('time_up');
        }
      }
    );

    // 2. Lives hooks
    this.lives.setCallbacks(
      () => {
        this.sound.playLifeLost();
      },
      () => {},
      () => {
        // Game Over when lives hit 0
        if (this.stateMachine.getState() === 'PLAYING') {
          this.triggerGameOver('out_of_lives');
        }
      }
    );

    // 3. Combo hooks
    this.combo.setCallbacks(
      (milestone) => {
        this.sound.playCombo(milestone.multiplier);
      },
      () => {}
    );

    // 4. Input events mapping
    this.input.subscribe((event: GameInputEvent) => {
      const state = this.stateMachine.getState();

      if (event.type === 'TRACKING_LOST') {
        if (state === 'PLAYING' && this.config.autoPauseOnTrackingLoss) {
          this.pause();
        }
      } else if (event.type === 'CLOSED_FIST') {
        // Closed fist toggles pause/resume in active game
        if (state === 'PLAYING') {
          this.pause();
        } else if (state === 'PAUSED') {
          this.resume();
        }
      }
    });

    // 5. State machine transition listener
    this.stateMachine.onStateChange((newState) => {
      if (newState === 'PLAYING') {
        this.loop.start();
        this.timer.resume();
      } else if (newState === 'PAUSED') {
        this.loop.pause();
        this.timer.pause();
      } else if (['GAME_OVER', 'RESULTS', 'IDLE'].includes(newState)) {
        this.loop.pause();
        this.timer.pause();
      }
      this.notifyListeners();
    });
  }

  public subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getSnapshot());
    return () => this.stateListeners.delete(listener);
  }

  public onAchievement(listener: (ach: AchievementEvent) => void): () => void {
    this.achievementListeners.add(listener);
    return () => this.achievementListeners.delete(listener);
  }

  public emitAchievement(id: string, title: string, description: string, badgeIcon: string): void {
    const ach: AchievementEvent = {
      id,
      title,
      description,
      badgeIcon,
      unlockedAt: Date.now(),
    };
    this.achievementListeners.forEach((l) => l(ach));
  }

  private notifyListeners(): void {
    const snapshot = this.getSnapshot();
    this.stateListeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[GameEngine] State listener error:', err);
      }
    });
  }

  public init(gameId: string, difficulty: Difficulty = 'Normal'): void {
    this.gameId = gameId;
    this.currentSessionId = generateUUID();
    this.sessionSaved = false;
    this.config.difficulty = difficulty;

    this.level.setDifficulty(difficulty);
    const lvlConfig = this.level.getCurrentLevelConfig();

    this.score.reset();
    this.combo.reset();
    this.lives.reset(this.level.getInitialLives());
    this.timer.reset(lvlConfig.timeLimit);
    this.input.reset();

    this.stateMachine.transition('READY');
    this.notifyListeners();
  }

  public startCountdown(): void {
    if (!this.stateMachine.transition('COUNTDOWN')) return;

    this.countdownValue = 3;
    this.sound.playCountdown();
    this.notifyListeners();

    if (this.countdownTimerId !== null) {
      clearInterval(this.countdownTimerId);
    }

    this.countdownTimerId = window.setInterval(() => {
      if (this.countdownValue === null) return;

      if (this.countdownValue > 1) {
        this.countdownValue -= 1;
        this.sound.playCountdown();
        this.notifyListeners();
      } else if (this.countdownValue === 1) {
        this.countdownValue = 0; // "GO!"
        this.sound.playCountdownGo();
        this.notifyListeners();
      } else {
        if (this.countdownTimerId !== null) {
          clearInterval(this.countdownTimerId);
          this.countdownTimerId = null;
        }
        this.countdownValue = null;
        this.startGame();
      }
    }, 1000);
  }

  public startGame(): void {
    if (this.countdownTimerId !== null) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
    this.countdownValue = null;

    if (!this.stateMachine.transition('PLAYING')) return;

    const lvlConfig = this.level.getCurrentLevelConfig();
    this.timer.start(lvlConfig.timeLimit);
    this.loop.start();
    this.notifyListeners();
  }

  public pause(): void {
    if (this.stateMachine.transition('PAUSED')) {
      this.sound.playClick();
      this.notifyListeners();
    }
  }

  public resume(): void {
    if (this.stateMachine.transition('PLAYING')) {
      this.sound.playClick();
      this.loop.resume();
      this.timer.resume();
      this.notifyListeners();
    }
  }

  public restart(): void {
    if (this.countdownTimerId !== null) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
    this.init(this.gameId, this.config.difficulty);
    this.startCountdown();
  }

  public completeLevel(): void {
    if (!this.stateMachine.transition('LEVEL_COMPLETE')) return;

    this.sound.playLevelComplete();
    const remainingTime = this.timer.getRemainingSeconds();
    const timeBonus = Math.round(remainingTime * 20);
    this.score.addTimeBonus(timeBonus);
    this.score.addLevelBonus(500);

    this.notifyListeners();
  }

  public nextLevel(): void {
    this.level.advanceLevel();
    const nextConfig = this.level.getCurrentLevelConfig();
    this.timer.reset(nextConfig.timeLimit);
    this.startCountdown();
  }

  public triggerGameOver(reason: string = 'unknown'): void {
    if (!this.stateMachine.transition('GAME_OVER')) return;

    this.sound.playGameOver();
    this.saveSession('game_over');
    this.notifyListeners();
  }

  public viewResults(): void {
    if (this.stateMachine.transition('RESULTS')) {
      this.notifyListeners();
    }
  }

  public feedTrackingResult(result: TrackingResult): void {
    this.input.processTrackingResult(result);
  }

  private update(dt: number): void {
    if (this.stateMachine.getState() !== 'PLAYING') return;

    this.timer.update(dt);
    this.combo.update(dt);
    this.score.setMultiplier(this.combo.getMultiplier());

    // Compute FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTimestamp >= 1000) {
      this.fpsCounter = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTimestamp = now;
      this.notifyListeners();
    }
  }

  private render(): void {
    // Engine rendering hooks available for custom canvas renderers
  }

  private handleVisibilityChange(isVisible: boolean): void {
    if (!isVisible && this.stateMachine.getState() === 'PLAYING') {
      this.pause();
    }
  }

  public registerTargetHit(basePoints: number = 100, accuracyMultiplier: number = 1): number {
    this.combo.registerSuccess();
    this.sound.playScore();
    const points = this.score.addHit(basePoints, Math.round((accuracyMultiplier - 1) * 50));
    this.notifyListeners();
    return points;
  }

  public registerTargetMiss(penalty: number = 20): void {
    this.combo.registerBreak();
    this.score.addMiss(penalty);
    this.notifyListeners();
  }

  public async saveSession(status: 'completed' | 'game_over' | 'aborted' = 'completed'): Promise<void> {
    if (this.sessionSaved) return;
    this.sessionSaved = true;

    const stats = this.getSessionStats(status);
    try {
      await ApiService.recordGameSession({
        session_id: stats.sessionId,
        game_id: stats.gameId,
        player_name: stats.playerName,
        difficulty: stats.difficulty,
        score: stats.score,
        duration_seconds: stats.durationSeconds,
        highest_combo: stats.highestCombo,
        accuracy_percent: stats.accuracyPercent,
        status: stats.status,
      });
      console.log('[GameEngine] Session saved to backend successfully.');
    } catch (err) {
      console.warn('[GameEngine] Failed to persist session to backend:', err);
    }
  }

  public getSessionStats(
    status: 'completed' | 'game_over' | 'aborted' = 'completed'
  ): GameSessionStats {
    const s = this.score.getStats();
    return {
      sessionId: this.currentSessionId,
      gameId: this.gameId,
      playerName: 'Player 1',
      difficulty: this.config.difficulty,
      score: this.score.getTotalScore(),
      durationSeconds: Math.round(this.timer.getElapsedSeconds() * 10) / 10,
      highestCombo: this.combo.getHighestCombo(),
      accuracyPercent: s.accuracy,
      hits: s.hits,
      misses: s.misses,
      status,
      createdAt: new Date().toISOString(),
    };
  }

  public getSnapshot(): GameEngineStateSnapshot {
    const s = this.score.getStats();
    return {
      state: this.stateMachine.getState(),
      previousState: this.stateMachine.getPreviousState(),
      gameId: this.gameId,
      difficulty: this.config.difficulty,
      score: this.score.getTotalScore(),
      scoreBreakdown: this.score.getBreakdown(),
      lives: this.lives.getLives(),
      maxLives: this.lives.getMaxLives(),
      level: this.level.getCurrentLevelConfig(),
      remainingTime: this.timer.getRemainingSeconds(),
      timeProgress: this.timer.getProgress(),
      combo: this.combo.getCombo(),
      highestCombo: this.combo.getHighestCombo(),
      comboMultiplier: this.combo.getMultiplier(),
      comboProgress: this.combo.getProgress(),
      accuracy: s.accuracy,
      hits: s.hits,
      misses: s.misses,
      countdownNumber: this.countdownValue,
      isTrackingActive: true,
      fps: this.fpsCounter,
    };
  }

  public destroy(): void {
    if (this.countdownTimerId !== null) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
    this.loop.destroy();
    this.input.destroy();
    this.stateListeners.clear();
    this.achievementListeners.clear();
  }
}
