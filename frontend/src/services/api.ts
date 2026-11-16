/** Frontend API service for HANDVERSE backend communications. */

import { Game, HealthStatus, SystemConfig } from '../types';

const API_BASE = '/api';

export class ApiService {
  /** Fetch backend health status */
  static async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      throw new Error(`Failed to fetch health: ${res.statusText}`);
    }
    return res.json();
  }

  /** Fetch arcade games with optional filters */
  static async getGames(params?: {
    search?: string;
    category?: string;
    difficulty?: string;
  }): Promise<{
    total: number;
    categories: string[];
    difficulties: string[];
    games: Game[];
  }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.difficulty && params.difficulty !== 'All') query.set('difficulty', params.difficulty);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/games${queryString}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch games: ${res.statusText}`);
    }
    return res.json();
  }

  /** Fetch individual game metadata by ID */
  static async getGameById(gameId: string): Promise<Game> {
    const res = await fetch(`${API_BASE}/games/${gameId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch game '${gameId}': ${res.statusText}`);
    }
    return res.json();
  }

  /** Fetch system runtime configuration */
  static async getConfig(): Promise<SystemConfig> {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) {
      throw new Error(`Failed to fetch config: ${res.statusText}`);
    }
    return res.json();
  }

  /** Submit completed or ended game session statistics */
  static async recordGameSession(sessionData: {
    session_id: string;
    game_id: string;
    player_name?: string;
    difficulty: string;
    score: number;
    duration_seconds: number;
    highest_combo: number;
    accuracy_percent: number;
    status: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/game-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to record session: ${res.statusText}`);
    }
    return res.json();
  }

  /** Fetch past session history */
  static async getGameSessionsHistory(gameId?: string, limit: number = 50): Promise<{
    total: number;
    sessions: any[];
  }> {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (gameId) query.set('game_id', gameId);
    const res = await fetch(`${API_BASE}/game-sessions/history?${query.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch session history: ${res.statusText}`);
    }
    return res.json();
  }

  /** Fetch high scores per game and difficulty */
  static async getBestScores(gameId?: string): Promise<{
    scores: Array<{
      game_id: string;
      difficulty: string;
      best_score: number;
      highest_combo: number;
      achieved_at: string;
      player_name: string;
    }>;
  }> {
    const query = gameId ? `?game_id=${encodeURIComponent(gameId)}` : '';
    const res = await fetch(`${API_BASE}/game-sessions/best-scores${query}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch best scores: ${res.statusText}`);
    }
    return res.json();
  }
}
