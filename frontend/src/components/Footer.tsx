/** Arcade footer with platform links, tech badges, and localhost information. */

import React from 'react';
import { Gamepad2, Heart, ExternalLink } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export const Footer: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <footer className="w-full border-t border-[#2D1B36] bg-[#08060A] text-[#B8A9B8] py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Brand column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#19101D] border border-[#FF2D95] flex items-center justify-center shadow-[0_0_12px_#FF2D95]">
              <Gamepad2 className="w-5 h-5 text-[#FF2D95]" />
            </div>
            <span className="font-heading text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-[#FF78BD]">
              HANDVERSE
            </span>
          </div>
          <p className="text-sm font-subheading text-[#B8A9B8] max-w-sm">
            Next-generation motion-controlled web gaming arcade. Play interactive games directly in your browser using real-time webcam hand tracking.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-[#FF78BD]">
            <span className="w-2 h-2 rounded-full bg-[#FF2D95] animate-ping" />
            <span>LOCAL DEV SERVERS ACTIVE (PORTS 5173 & 8000)</span>
          </div>
        </div>

        {/* Arcade Navigation */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
            Arcade Navigation
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <button
                onClick={() => navigateTo('home')}
                className="hover:text-[#FF2D95] transition-colors"
              >
                Home Arena
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('arcade')}
                className="hover:text-[#FF2D95] transition-colors"
              >
                10 Planned Games
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('tutorial')}
                className="hover:text-[#FF2D95] transition-colors"
              >
                Gesture Guide & Tutorials
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('gesture-lab')}
                className="hover:text-[#FF2D95] transition-colors"
              >
                Gesture Lab (Camera Test)
              </button>
            </li>
          </ul>
        </div>

        {/* Technical Architecture */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
            System Stack
          </h4>
          <ul className="space-y-2 text-xs font-mono text-zinc-400">
            <li>Frontend: React 18, Vite, Tailwind</li>
            <li>Motion: Framer Motion, Lucide</li>
            <li>Backend: FastAPI, Uvicorn, Python</li>
            <li>ML Core: MediaPipe, OpenCV Ready</li>
            <li>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="text-[#FF78BD] hover:underline inline-flex items-center gap-1"
              >
                API Swagger Docs <ExternalLink className="w-3 h-3" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-[#2D1B36]/60 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-500 gap-4">
        <p>© 2026 HANDVERSE Motion Gaming Arcade. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Designed with <Heart className="w-3 h-3 text-[#FF2D95] fill-[#FF2D95]" /> in Hot Pink & Neon
        </p>
      </div>
    </footer>
  );
};
