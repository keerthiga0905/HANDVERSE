/** Interactive Game Engine Motion Arena (Module 06).
 *
 * Demonstrates the full Game Engine in action with real webcam hand tracking,
 * neon particle effects, target popping, hazard dodging, combo scaling, and sound.
 */

import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../../game-engine/GameEngine';
import { GameInputEvent } from '../../game-engine/types';

interface Target {
  id: number;
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  radius: number; // in pixels
  speed: number;
  color: string;
  points: number;
  isHazard: boolean;
  alpha: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

interface SandboxGameArenaProps {
  engine: GameEngine;
  cursorPos: { x: number; y: number; isVisible: boolean; isPinching: boolean };
}

export const SandboxGameArena: React.FC<SandboxGameArenaProps> = ({ engine, cursorPos }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetsRef = useRef<Target[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextTargetIdRef = useRef<number>(1);
  const lastSpawnTimeRef = useRef<number>(0);

  // Subscribe to input events from the engine
  useEffect(() => {
    const unsubscribe = engine.input.subscribe((event: GameInputEvent) => {
      if (event.type === 'PINCH_START' || event.type === 'POINTER_DOWN') {
        const curX = event.x ?? cursorPos.x;
        const curY = event.y ?? cursorPos.y;
        checkTargetInteraction(curX, curY);
      }
    });

    return () => unsubscribe();
  }, [engine, cursorPos]);

  const checkTargetInteraction = (normX: number, normY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const px = normX * canvas.width;
    const py = normY * canvas.height;

    const remainingTargets: Target[] = [];

    targetsRef.current.forEach((t) => {
      const tx = t.x * canvas.width;
      const ty = t.y * canvas.height;
      const dist = Math.hypot(px - tx, py - ty);

      if (dist <= t.radius + 15) {
        // Hit target!
        if (t.isHazard) {
          engine.lives.loseLife();
          spawnExplosion(tx, ty, '#EF4444', 30);
        } else {
          engine.registerTargetHit(t.points, 1.2);
          spawnExplosion(tx, ty, t.color, 25);
        }
      } else {
        remainingTargets.push(t);
      }
    });

    targetsRef.current = remainingTargets;
  };

  const spawnExplosion = (x: number, y: number, color: string, count: number = 20) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03,
      });
    }
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const now = performance.now();
      const state = engine.stateMachine.getState();

      // Clear with dark neon background
      ctx.fillStyle = '#08060A';
      ctx.fillRect(0, 0, width, height);

      // Subtle cyber grid
      ctx.strokeStyle = 'rgba(255, 45, 149, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (state === 'PLAYING') {
        // 1. Target spawning
        if (now - lastSpawnTimeRef.current > 1100 && targetsRef.current.length < 7) {
          lastSpawnTimeRef.current = now;
          const isHazard = Math.random() < 0.22;
          const colors = ['#FF2D95', '#FF00A8', '#FF78BD', '#38BDF8'];

          targetsRef.current.push({
            id: nextTargetIdRef.current++,
            x: 0.12 + Math.random() * 0.76,
            y: 0.15 + Math.random() * 0.65,
            radius: isHazard ? 24 : 28,
            speed: (Math.random() - 0.5) * 0.001,
            color: isHazard ? '#EF4444' : colors[Math.floor(Math.random() * colors.length)],
            points: isHazard ? -50 : 100,
            isHazard,
            alpha: 1.0,
          });
        }

        // 2. Update and draw targets
        targetsRef.current.forEach((t) => {
          t.x = Math.max(0.08, Math.min(0.92, t.x + t.speed));

          const tx = t.x * width;
          const ty = t.y * height;

          // Glowing pulse
          ctx.save();
          ctx.shadowColor = t.color;
          ctx.shadowBlur = 18;

          // Outer aura ring
          ctx.beginPath();
          ctx.arc(tx, ty, t.radius + 4, 0, Math.PI * 2);
          ctx.strokeStyle = t.color;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Inner filled core
          ctx.beginPath();
          ctx.arc(tx, ty, t.radius - 2, 0, Math.PI * 2);
          ctx.fillStyle = t.isHazard ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 45, 149, 0.35)';
          ctx.fill();

          // Target center icon / marker
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(t.isHazard ? '✕' : `${t.points}`, tx, ty);

          ctx.restore();
        });

        // 3. Update and draw particles
        const aliveParticles: Particle[] = [];
        particlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;

          if (p.alpha > 0) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            aliveParticles.push(p);
          }
        });
        particlesRef.current = aliveParticles;
      }

      // 4. Draw Hand Cursor Reticle
      if (cursorPos.isVisible) {
        const cx = cursorPos.x * width;
        const cy = cursorPos.y * height;
        const isPinch = cursorPos.isPinching;

        ctx.save();
        ctx.shadowColor = isPinch ? '#FF00A8' : '#FF2D95';
        ctx.shadowBlur = isPinch ? 25 : 15;

        // Crosshairs
        ctx.strokeStyle = isPinch ? '#FF00A8' : '#FF78BD';
        ctx.lineWidth = isPinch ? 3 : 2;

        const arm = isPinch ? 18 : 12;
        ctx.beginPath();
        ctx.moveTo(cx - arm, cy);
        ctx.lineTo(cx + arm, cy);
        ctx.moveTo(cx, cy - arm);
        ctx.lineTo(cx, cy + arm);
        ctx.stroke();

        // Target reticle circle
        ctx.beginPath();
        ctx.arc(cx, cy, isPinch ? 12 : 20, 0, Math.PI * 2);
        ctx.strokeStyle = isPinch ? '#FF00A8' : '#FF2D95';
        ctx.lineWidth = isPinch ? 3 : 2;
        ctx.stroke();

        if (isPinch) {
          ctx.fillStyle = 'rgba(255, 0, 168, 0.5)';
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine, cursorPos]);

  return (
    <canvas
      ref={canvasRef}
      width={960}
      height={540}
      className="w-full h-full object-cover rounded-2xl border border-[#2D1B36]"
    />
  );
};
