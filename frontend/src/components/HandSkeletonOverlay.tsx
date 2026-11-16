/** High-performance Canvas overlay rendering MediaPipe 21-landmark skeleton
 * with recognized gesture badges, pinch sparks, and two-hand indicators.
 */

import React, { useEffect, useRef } from 'react';
import { FINGERTIP_IDS, HAND_CONNECTIONS, HandDetection } from '../types/tracking';

interface HandSkeletonOverlayProps {
  hands: HandDetection[];
  twoHandGesture?: string | null;
  width: number;
  height: number;
}

export const HandSkeletonOverlay: React.FC<HandSkeletonOverlayProps> = ({
  hands,
  twoHandGesture,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset and clear overlay canvas
    ctx.clearRect(0, 0, width, height);

    if (!hands || hands.length === 0) return;

    // Pulse animation phase
    const pulseOffset = (Math.sin(Date.now() / 150) + 1) * 1.5;

    hands.forEach((hand) => {
      const isRight = hand.handedness === 'Right';
      const primaryColor = isRight ? '#FF2D95' : '#00E5FF'; // Hot Pink for Right, Cyan Neon for Left
      const secondaryColor = isRight ? '#FF00A8' : '#38BDF8';
      const glowColor = isRight ? 'rgba(255, 45, 149, 0.8)' : 'rgba(0, 229, 255, 0.8)';

      const landmarks = hand.landmarks;
      if (!landmarks || landmarks.length < 21) return;

      // 1. Draw Skeleton Connection Bones
      ctx.save();
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = primaryColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 14;

      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const p1 = landmarks[startIdx];
        const p2 = landmarks[endIdx];

        if (p1 && p2) {
          const x1 = p1.x * width;
          const y1 = p1.y * height;
          const x2 = p2.x * width;
          const y2 = p2.y * height;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      });
      ctx.restore();

      // 2. Draw Landmark Joint Points
      landmarks.forEach((lm) => {
        const x = lm.x * width;
        const y = lm.y * height;
        const isFingertip = FINGERTIP_IDS.includes(lm.id);

        ctx.save();
        if (isFingertip) {
          // Large glowing fingertip radar node
          ctx.shadowColor = secondaryColor;
          ctx.shadowBlur = 16;

          // Outer glowing halo
          ctx.beginPath();
          ctx.arc(x, y, 6.5 + pulseOffset, 0, Math.PI * 2);
          ctx.fillStyle = secondaryColor;
          ctx.fill();

          // Core bright white dot
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        } else {
          // Standard joint node
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 8;

          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = primaryColor;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        }
        ctx.restore();
      });

      // 3. Pinch Visual Effect (Lightning / Spark connection between thumb 4 and index 8)
      if (hand.is_pinching) {
        const p4 = landmarks[4];
        const p8 = landmarks[8];
        if (p4 && p8) {
          const x4 = p4.x * width;
          const y4 = p4.y * height;
          const x8 = p8.x * width;
          const y8 = p8.y * height;

          ctx.save();
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#FFFFFF';
          ctx.shadowColor = '#FF00A8';
          ctx.shadowBlur = 20;

          ctx.beginPath();
          ctx.moveTo(x4, y4);
          ctx.lineTo(x8, y8);
          ctx.stroke();

          // Spark center
          const mx = (x4 + x8) * 0.5;
          const my = (y4 + y8) * 0.5;
          ctx.fillStyle = '#FF2D95';
          ctx.beginPath();
          ctx.arc(mx, my, 8 + pulseOffset * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 4. Draw Floating Gesture Label & Handedness Badge near wrist (Landmark 0)
      const wrist = landmarks[0];
      if (wrist) {
        const tagX = Math.max(15, Math.min(width - 160, wrist.x * width - 65));
        const tagY = Math.min(height - 20, Math.max(30, wrist.y * height + 35));

        ctx.save();
        ctx.fillStyle = 'rgba(18, 11, 20, 0.90)';
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;

        const gestureText = hand.primary_gesture && hand.primary_gesture !== 'NONE'
          ? hand.primary_gesture.replace(/_/g, ' ')
          : 'TRACKING';
        const handednessText = `${hand.handedness.toUpperCase()}`;

        const fullText = `${handednessText} • ${gestureText}`;
        ctx.font = 'bold 11px Rajdhani, Consolas, monospace';
        const textWidth = ctx.measureText(fullText).width;

        // Draw pill container
        ctx.beginPath();
        ctx.roundRect(tagX - 6, tagY - 16, textWidth + 16, 22, 7);
        ctx.fill();
        ctx.stroke();

        // Draw text
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 0;
        ctx.fillText(fullText, tagX + 2, tagY);
        ctx.restore();
      }
    });

    // 5. Draw Two-Hand Cooperative Gesture Banner
    if (twoHandGesture) {
      const bannerText = `⚡ ${twoHandGesture.replace(/_/g, ' ')}`;
      ctx.save();
      ctx.font = 'bold 15px Orbitron, sans-serif';
      const bWidth = ctx.measureText(bannerText).width;
      const bx = width * 0.5 - bWidth * 0.5 - 14;
      const by = 25;

      ctx.fillStyle = 'rgba(25, 16, 29, 0.95)';
      ctx.strokeStyle = '#FF2D95';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FF2D95';
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.roundRect(bx, by, bWidth + 28, 36, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FF78BD';
      ctx.shadowBlur = 0;
      ctx.fillText(bannerText, bx + 14, by + 23);
      ctx.restore();
    }
  }, [hands, twoHandGesture, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    />
  );
};
