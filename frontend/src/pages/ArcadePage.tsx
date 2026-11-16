/** Game Arcade Page with search, category filtering, difficulty filters, and 10 game cards. */

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Gamepad2, X, AlertCircle } from 'lucide-react';
import { Game } from '../types';
import { ApiService } from '../services/api';
import { GameCardItem } from '../components/GameCardItem';
import { GameDetailModal } from '../components/GameDetailModal';
import { useNavigation } from '../context/NavigationContext';

export const ArcadePage: React.FC = () => {
  const { selectedGameId, closeGameModal } = useNavigation();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  useEffect(() => {
    setLoading(true);
    ApiService.getGames()
      .then((data) => {
        setGames(data.games);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch games');
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(games.map((g) => g.category));
    return ['All', ...Array.from(set)];
  }, [games]);

  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  // Client-side instant filtering
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.control_type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' ||
        game.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesDifficulty =
        selectedDifficulty === 'All' ||
        game.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [games, searchQuery, selectedCategory, selectedDifficulty]);

  const activeModalGame = games.find((g) => g.id === selectedGameId) || null;

  return (
    <div className="relative z-10 w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-left space-y-2">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-[#FF2D95]" />
          <span className="text-xs font-mono uppercase text-[#FF78BD] tracking-wider">
            COMPLETE CATALOG
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-heading text-white">
          Game Arcade
        </h1>
        <p className="text-sm sm:text-base font-subheading text-[#B8A9B8] max-w-2xl">
          Discover all 10 planned motion-controlled titles. Filter by genre, difficulty, or search specific hand control mechanics.
        </p>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-4 sm:p-6 space-y-4">
        {/* Search Input Row */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games by title, description, or gesture control..."
            className="w-full pl-12 pr-10 py-3 rounded-xl bg-[#08060A] border border-[#2D1B36] focus:border-[#FF2D95] focus:outline-none focus:ring-1 focus:ring-[#FF2D95] text-sm text-white placeholder-zinc-500 transition-all font-subheading"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category & Difficulty Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-[#2D1B36]">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono text-zinc-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> CATEGORY:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#FF2D95] text-white shadow-[0_0_12px_#FF2D95]'
                    : 'bg-[#120B14] text-[#B8A9B8] hover:text-white border border-[#2D1B36]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Difficulty Dropdown / Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">DIFFICULTY:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#120B14] border border-[#2D1B36] text-xs font-mono text-white focus:outline-none focus:border-[#FF2D95]"
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff} className="bg-[#19101D]">
                  {diff}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
        <span>SHOWING {filteredGames.length} OF {games.length} GAMES</span>
        {(searchQuery || selectedCategory !== 'All' || selectedDifficulty !== 'All') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedDifficulty('All');
            }}
            className="text-[#FF2D95] hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Game Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 font-mono">
          Loading arcade library...
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-400 text-center font-mono">
          {error}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#19101D] border border-[#2D1B36] space-y-3">
          <AlertCircle className="w-10 h-10 text-zinc-500 mx-auto" />
          <h3 className="text-lg font-heading text-white">No Matching Games Found</h3>
          <p className="text-xs font-subheading text-zinc-400 max-w-sm mx-auto">
            No arcade titles match your current search and filter settings. Try adjusting your query or resetting filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <GameCardItem key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <GameDetailModal game={activeModalGame} onClose={closeGameModal} />
    </div>
  );
};
