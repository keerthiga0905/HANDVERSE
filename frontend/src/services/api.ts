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
}
