/** Neon pink glowing cursor trailer for immersive gaming experience. */

import React, { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';

export const GlowingCursor: React.FC = () => {
  const { settings } = useSettings();
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!settings.glowingCursor || settings.reducedMotion) return;

    // Detect touch device
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('button, a, input, select, [role="button"]');
        setIsHoveringInteractive(!!interactive);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [settings.glowingCursor, settings.reducedMotion, isVisible]);

  if (!settings.glowingCursor || settings.reducedMotion || !isVisible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-50 transition-transform duration-75 ease-out"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `translate(-50%, -50%) scale(${isHoveringInteractive ? 1.8 : 1})`,
      }}
      aria-hidden="true"
    >
      <div
        className="rounded-full bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] opacity-35 blur-xl transition-all duration-150"
        style={{
          width: isHoveringInteractive ? '50px' : '32px',
          height: isHoveringInteractive ? '50px' : '32px',
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white opacity-90 shadow-[0_0_8px_#FF2D95]" />
    </div>
  );
};
