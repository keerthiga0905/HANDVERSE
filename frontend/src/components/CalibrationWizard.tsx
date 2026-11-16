import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  Crosshair,
  Hand,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { CalibrationBounds, CalibrationStatusResponse } from '../types/motion';
import { HandDetection } from '../types/tracking';
import { motionApi } from '../services/motionApi';

interface CalibrationWizardProps {
  hands: HandDetection[];
  status: CalibrationStatusResponse | null;
  onCalibrationChange: () => void;
}

const STEPS = [
  { id: 1, title: 'Position Hand', desc: 'Place hand inside camera frame' },
  { id: 2, title: 'Steady Detect', desc: 'Hold hand steady for sensor lock' },
  { id: 3, title: 'Four Corners', desc: 'Reach 4 corners of motion volume' },
  { id: 4, title: 'Neutral Center', desc: 'Return hand to comfortable center' },
  { id: 5, title: 'Complete', desc: 'Calibration verified and saved' },
];

const CORNER_ORDER = [
  { id: 'top_left', label: 'Top-Left', x: 0.20, y: 0.20 },
  { id: 'top_right', label: 'Top-Right', x: 0.80, y: 0.20 },
  { id: 'bottom_left', label: 'Bottom-Left', x: 0.20, y: 0.80 },
  { id: 'bottom_right', label: 'Bottom-Right', x: 0.80, y: 0.80 },
];

export const CalibrationWizard: React.FC<CalibrationWizardProps> = ({
  hands,
  status,
  onCalibrationChange,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeCornerIndex, setActiveCornerIndex] = useState<number>(0);
  const [capturedPoints, setCapturedPoints] = useState<Set<string>>(new Set());
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<boolean>(false);

  // Sync with backend status
  useEffect(() => {
    if (status) {
      if (status.is_calibrated) {
        setActiveStep(5);
      }
      if (status.points_captured) {
        setCapturedPoints(new Set(status.points_captured));
      }
    }
  }, [status]);

  const primaryHand = hands.length > 0 ? hands[0] : null;
  const isHandDetected = primaryHand !== null && primaryHand.confidence >= 0.65;

  // Step 2 auto-advance: if hand is detected with high confidence in Step 1 or 2
  useEffect(() => {
    if (activeStep === 1 && isHandDetected) {
      setActiveStep(2);
    } else if (activeStep === 2 && isHandDetected) {
      const timer = setTimeout(() => {
        setActiveStep(3);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [activeStep, isHandDetected]);

  // Capture current corner or point
  const handleCapturePoint = async (pointName: string, explicitX?: number, explicitY?: number) => {
    setIsCapturing(true);
    setErrorMessage(null);

    try {
      const sampleX = explicitX !== undefined ? explicitX : primaryHand?.landmarks[8]?.x;
      const sampleY = explicitY !== undefined ? explicitY : primaryHand?.landmarks[8]?.y;

      if (sampleX === undefined || sampleY === undefined) {
        throw new Error('Please position your hand in frame before capturing.');
      }

      const res = await motionApi.capturePoint(pointName, sampleX, sampleY);
      const nextCaptured = new Set(capturedPoints);
      nextCaptured.add(pointName);
      setCapturedPoints(nextCaptured);

      // Advance corner index
      if (activeStep === 3) {
        if (activeCornerIndex < CORNER_ORDER.length - 1) {
          setActiveCornerIndex((prev) => prev + 1);
        } else {
          setActiveStep(4); // Advance to center
        }
      } else if (activeStep === 4) {
        // Complete calibration automatically
        await handleComplete();
      }

      onCalibrationChange();
    } catch (err: any) {
      setErrorMessage(err.message || 'Capture failed');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleComplete = async () => {
    try {
      const res = await motionApi.completeCalibration();
      setSuccessAnimation(true);
      setActiveStep(5);
      onCalibrationChange();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not complete calibration');
    }
  };

  const handleRestart = async () => {
    try {
      await motionApi.startCalibration();
      setActiveStep(1);
      setActiveCornerIndex(0);
      setCapturedPoints(new Set());
      setSuccessAnimation(false);
      setErrorMessage(null);
      onCalibrationChange();
    } catch (err: any) {
      console.error('Reset error:', err);
    }
  };

  const currentCorner = CORNER_ORDER[activeCornerIndex];

  return (
    <div className="w-full rounded-3xl bg-[#120B14] border border-[#2D1B36] p-6 lg:p-8 space-y-6 shadow-[0_0_35px_rgba(255,45,149,0.08)]">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2D1B36] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-[#FF2D95]" />
            <span className="text-xs font-mono uppercase text-[#FF78BD] tracking-wider">
              5-STEP CALIBRATION WIZARD
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading text-white mt-1">
            Hand Motion Calibration Studio
          </h2>
          <p className="text-xs font-subheading text-[#B8A9B8]">
            Calibrates your physical reach volume into a responsive, zero-jitter virtual cursor space.
          </p>
        </div>

        <button
          onClick={handleRestart}
          className="px-3.5 py-2 rounded-xl bg-[#19101D] border border-[#2D1B36] hover:border-[#FF2D95] text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#FF2D95]" />
          <span>Restart</span>
        </button>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {STEPS.map((s) => {
          const isDone = s.id < activeStep || (activeStep === 5 && status?.is_calibrated);
          const isCurrent = s.id === activeStep;

          return (
            <div
              key={s.id}
              className={`p-3 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-gradient-to-br from-[#FF2D95]/20 via-[#19101D] to-[#FF00A8]/10 border-[#FF2D95] shadow-[0_0_20px_rgba(255,45,149,0.3)]'
                  : isDone
                  ? 'bg-[#19101D] border-emerald-500/40 text-emerald-300'
                  : 'bg-[#19101D]/50 border-[#2D1B36] text-zinc-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold">STEP 0{s.id}</span>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCurrent ? 'bg-[#FF2D95] animate-ping' : 'bg-zinc-700'
                    }`}
                  />
                )}
              </div>
              <h4 className="text-xs font-heading font-black text-white mt-1">{s.title}</h4>
              <p className="text-[10px] text-[#B8A9B8] line-clamp-1 mt-0.5">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Active Step Interactive Guide Card */}
      <div className="p-6 rounded-2xl bg-[#19101D] border border-[#2D1B36] space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Position Hand */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#08060A] border border-[#FF2D95] flex items-center justify-center">
                <Hand className="w-5 h-5 text-[#FF2D95]" />
              </div>
              <div>
                <h3 className="text-base font-heading font-black text-white">
                  Step 1: Position Your Hand
                </h3>
                <p className="text-xs text-[#B8A9B8]">
                  Raise your dominant hand in front of the camera, approximately 1.5 to 2.5 feet away.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#08060A] border border-[#2D1B36] flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400">Hand Detection Sensor:</span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  isHandDetected
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {isHandDetected ? 'HAND LOCKED' : 'SEARCHING FOR HAND...'}
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: Steady Detect */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-heading font-black text-white">
                  Step 2: Tracking Verified
                </h3>
                <p className="text-xs text-[#B8A9B8]">
                  Holding hand steady. Hand presence confidence is {Math.round((primaryHand?.confidence || 0) * 100)}%. Proceeding to corner capture...
                </p>
              </div>
            </div>

            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-[#FF2D95] animate-pulse w-full" />
            </div>
          </div>
        )}

        {/* STEP 3: Four Corners */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#08060A] border border-[#FF2D95] flex items-center justify-center shadow-[0_0_15px_#FF2D95]">
                  <Crosshair className="w-5 h-5 text-[#FF2D95]" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-black text-white">
                    Target {activeCornerIndex + 1} of 4: Reach {currentCorner?.label}
                  </h3>
                  <p className="text-xs text-[#B8A9B8]">
                    Move your index fingertip toward the glowing {currentCorner?.label} corner in the camera preview and click "Capture Point".
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleCapturePoint(currentCorner.id)}
                disabled={isCapturing || !isHandDetected}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white font-subheading font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_#FF2D95] hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Crosshair className="w-4 h-4" />
                <span>{isCapturing ? 'Capturing...' : `Capture ${currentCorner?.label}`}</span>
              </button>
            </div>

            {/* Corner Progress Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {CORNER_ORDER.map((c, i) => {
                const captured = capturedPoints.has(c.id);
                const isCurrent = i === activeCornerIndex;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveCornerIndex(i);
                    }}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      captured
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                        : isCurrent
                        ? 'bg-[#FF2D95]/20 border-[#FF2D95] text-white'
                        : 'bg-[#08060A] border-[#2D1B36] text-zinc-500'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold">{c.label}</div>
                    <div className="text-[9px] mt-0.5">
                      {captured ? 'Captured' : isCurrent ? 'Active Target' : 'Pending'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Center Position */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#08060A] border border-[#FF78BD] flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-[#FF78BD]" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-black text-white">
                    Step 4: Hold Center Rest Position
                  </h3>
                  <p className="text-xs text-[#B8A9B8]">
                    Place your hand in your natural resting center position in the camera view.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleCapturePoint('center')}
                disabled={isCapturing || !isHandDetected}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2D95] to-[#FF00A8] text-white font-subheading font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_#FF2D95] hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Crosshair className="w-4 h-4" />
                <span>{isCapturing ? 'Finalizing...' : 'Capture Center & Complete'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Calibration Complete */}
        {activeStep === 5 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#19101D] to-emerald-950/80 border border-emerald-500/60 text-white space-y-4 shadow-[0_0_35px_rgba(16,185,129,0.3)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-black text-white">
                  Calibration Complete & Verified!
                </h3>
                <p className="text-xs text-emerald-200">
                  Interactive movement boundary locked. Screen coordinates and One Euro smoothing are active.
                </p>
              </div>
            </div>

            {status?.bounds && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-[#08060A]/80 p-3 rounded-xl border border-[#2D1B36]">
                <div>
                  <span className="text-zinc-500 text-[10px]">HORIZONTAL BOUNDS</span>
                  <div className="text-white font-bold">
                    {status.bounds.min_x.toFixed(2)} - {status.bounds.max_x.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">VERTICAL BOUNDS</span>
                  <div className="text-white font-bold">
                    {status.bounds.min_y.toFixed(2)} - {status.bounds.max_y.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">ACTIVE VOLUME</span>
                  <div className="text-emerald-400 font-bold">
                    {(status.bounds.width * 100).toFixed(0)}% x {(status.bounds.height * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">STATUS</span>
                  <div className="text-[#FF2D95] font-bold">ACTIVE & SAVED</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
