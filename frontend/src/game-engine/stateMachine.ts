/** Strict Game State Machine for HANDVERSE (Module 06). */

import { GameState } from './types';

export class GameStateMachine {
  private currentState: GameState = 'IDLE';
  private previousState: GameState = 'IDLE';
  private listeners: Set<(newState: GameState, oldState: GameState) => void> = new Set();

  private static readonly VALID_TRANSITIONS: Record<GameState, GameState[]> = {
    IDLE: ['READY'],
    READY: ['COUNTDOWN', 'IDLE'],
    COUNTDOWN: ['PLAYING', 'READY', 'IDLE'],
    PLAYING: ['PAUSED', 'LEVEL_COMPLETE', 'GAME_OVER'],
    PAUSED: ['PLAYING', 'READY', 'IDLE'],
    LEVEL_COMPLETE: ['COUNTDOWN', 'PLAYING', 'RESULTS', 'READY', 'IDLE'],
    GAME_OVER: ['RESULTS', 'READY', 'IDLE'],
    RESULTS: ['READY', 'COUNTDOWN', 'IDLE'],
  };

  constructor(initialState: GameState = 'IDLE') {
    this.currentState = initialState;
    this.previousState = initialState;
  }

  public getState(): GameState {
    return this.currentState;
  }

  public getPreviousState(): GameState {
    return this.previousState;
  }

  public canTransition(targetState: GameState): boolean {
    const allowed = GameStateMachine.VALID_TRANSITIONS[this.currentState];
    return allowed ? allowed.includes(targetState) : false;
  }

  public transition(targetState: GameState): boolean {
    if (this.currentState === targetState) {
      return true;
    }

    if (!this.canTransition(targetState)) {
      console.warn(
        `[GameStateMachine] Invalid transition requested: ${this.currentState} -> ${targetState}`
      );
      return false;
    }

    const oldState = this.currentState;
    this.previousState = oldState;
    this.currentState = targetState;

    this.listeners.forEach((callback) => {
      try {
        callback(targetState, oldState);
      } catch (err) {
        console.error('[GameStateMachine] Error in state change listener:', err);
      }
    });

    return true;
  }

  public onStateChange(
    callback: (newState: GameState, oldState: GameState) => void
  ): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public reset(state: GameState = 'IDLE'): void {
    const oldState = this.currentState;
    this.currentState = state;
    this.previousState = state;
    this.listeners.forEach((callback) => callback(state, oldState));
  }
}
