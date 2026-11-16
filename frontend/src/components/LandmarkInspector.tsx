/** Collapsible landmark coordinate telemetry inspector. */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, Hash } from 'lucide-react';
import { HandDetection } from '../types/tracking';

interface LandmarkInspectorProps {
  hands: HandDetection[];
}

export const LandmarkInspector: React.FC<LandmarkInspectorProps> = ({ hands }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedHandIdx, setSelectedHandIdx] = useState(0);

  if (!hands || hands.length === 0) {
    return (
      <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-6 text-center text-xs font-mono text-zinc-500">
        No active hand detected. Position your hand inside the webcam frame to inspect 21 3D landmarks.
      </div>
    );
  }

  const activeHand = hands[selectedHandIdx] || hands[0];
  const lms = activeHand.landmarks;

  // Key landmark indices
  const keyNodes = [
    { name: 'Wrist (0)', point: lms[0] },
    { name: 'Thumb Tip (4)', point: lms[4] },
    { name: 'Index Tip (8)', point: lms[8] },
    { name: 'Middle Tip (12)', point: lms[12] },
    { name: 'Ring Tip (16)', point: lms[16] },
    { name: 'Pinky Tip (20)', point: lms[20] },
  ];

  return (
    <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-5 space-y-4">
      {/* Header with hand switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#FF2D95]" />
          <h4 className="text-xs font-mono uppercase text-white font-bold">
            Live Landmark Coordinates
          </h4>
        </div>

        {/* Hand switcher tabs */}
        {hands.length > 1 && (
          <div className="flex items-center gap-1 bg-[#120B14] p-1 rounded-lg border border-[#2D1B36]">
            {hands.map((h, i) => (
              <button
                key={i}
                onClick={() => setSelectedHandIdx(i)}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                  selectedHandIdx === i
                    ? 'bg-[#FF2D95] text-white shadow-[0_0_10px_#FF2D95]'
                    : 'text-[#B8A9B8] hover:text-white'
                }`}
              >
                {h.handedness} Hand ({Math.round(h.confidence * 100)}%)
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6 Key Tip Coordinates Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
        {keyNodes.map((node, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-[#120B14] border border-[#2D1B36] space-y-1">
            <span className="text-[10px] text-zinc-400 block truncate">{node.name}</span>
            {node.point ? (
              <div className="space-y-0.5 text-[11px]">
                <div className="text-zinc-300">X: <strong className="text-white">{node.point.x.toFixed(3)}</strong></div>
                <div className="text-zinc-300">Y: <strong className="text-white">{node.point.y.toFixed(3)}</strong></div>
                <div className="text-zinc-500 text-[10px]">Z: {node.point.z.toFixed(3)}</div>
              </div>
            ) : (
              <span className="text-zinc-600">--</span>
            )}
          </div>
        ))}
      </div>

      {/* Collapsible 21 Full Landmark Table */}
      <div className="pt-2 border-t border-[#2D1B36]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs font-mono text-[#FF78BD] hover:text-[#FF2D95] py-1"
        >
          <span>{expanded ? 'Hide Full 21-Landmark Matrix' : 'Inspect All 21 3D Landmark Nodes'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-1.5 max-h-60 overflow-y-auto p-2 rounded-xl bg-[#08060A] border border-[#2D1B36]">
            {lms.map((lm) => (
              <div key={lm.id} className="p-1.5 rounded bg-[#120B14] text-[10px] font-mono border border-zinc-800">
                <span className="text-[#FF2D95] font-bold">#{lm.id}</span>
                <div className="text-zinc-300 truncate">X:{lm.x.toFixed(2)}</div>
                <div className="text-zinc-300 truncate">Y:{lm.y.toFixed(2)}</div>
                <div className="text-zinc-500 truncate">Z:{lm.z.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
