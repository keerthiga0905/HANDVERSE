/** Dedicated Game Engine Arena Page for HANDVERSE (Module 06). */

import React from 'react';
import { GameEngineView } from '../components/game/GameEngineView';
import { useNavigation } from '../context/NavigationContext';

export const GameEnginePage: React.FC = () => {
  const { navigateTo, selectedGameId } = useNavigation();

  return (
    <div className="w-full min-h-screen bg-[#08060A]">
      <GameEngineView
        gameId={selectedGameId || 'engine-sandbox'}
        onExit={() => navigateTo('arcade')}
      />
    </div>
  );
};
