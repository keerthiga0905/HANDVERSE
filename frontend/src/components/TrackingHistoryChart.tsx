/** Real-time tracking history graph with latency and hands-detected indicators. */

import React from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import { TrackingHistoryItem } from '../types/tracking';

interface TrackingHistoryChartProps {
  history: TrackingHistoryItem[];
  onClear: () => void;
}

export const TrackingHistoryChart: React.FC<TrackingHistoryChartProps> = ({ history, onClear }) => {
  const maxItems = 40;
  const recentHistory = history.slice(-maxItems);

  return (
    <div className="rounded-2xl bg-[#19101D] border border-[#2D1B36] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#FF2D95]" />
          <h4 className="text-xs font-mono uppercase text-white font-bold">
            Real-Time Tracking Stream History
          </h4>
        </div>
        <button
          onClick={onClear}
          className="text-[11px] font-mono text-zinc-400 hover:text-[#FF2D95] flex items-center gap-1 transition-colors"
          title="Clear session history buffer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Clear History</span>
        </button>
      </div>

      {recentHistory.length === 0 ? (
        <div className="h-16 flex items-center justify-center text-xs font-mono text-zinc-600">
          History stream empty. Frame metrics log automatically while streaming.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Timeline Bar Chart */}
          <div className="h-14 w-full bg-[#08060A] rounded-xl border border-[#2D1B36] p-1.5 flex items-end gap-1 overflow-hidden">
            {recentHistory.map((item, i) => {
              // Height proportional to hands detected (0 = 15%, 1 = 55%, 2 = 100%)
              const heightPercent = item.handsDetected === 0 ? 12 : item.handsDetected === 1 ? 55 : 100;
              const barColor =
                item.handsDetected === 0
                  ? 'bg-zinc-800'
                  : item.handsDetected === 1
                  ? 'bg-[#FF2D95]'
                  : 'bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]';

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  <div
                    className={`w-full rounded-sm transition-all ${barColor}`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  {/* Hover tooltip */}
                  <div className="absolute -top-7 hidden group-hover:block bg-[#19101D] text-white text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#FF2D95] whitespace-nowrap z-30 shadow-md">
                    {item.handsDetected} hand(s) • {item.latencyMs}ms
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-1">
            <span>T - {recentHistory.length} frames</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-zinc-800 inline-block" /> 0 Hands
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-[#FF2D95] inline-block" /> 1 Hand
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-[#00E5FF] inline-block" /> 2 Hands
              </span>
            </div>
            <span>LIVE (CURRENT)</span>
          </div>
        </div>
      )}
    </div>
  );
};
