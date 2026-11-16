/** Central Game Registry for HANDVERSE (Module 06).
 *
 * Registers all 10 planned games with metadata, supported gestures, and status.
 * Unimplemented games strictly remain marked as 'Coming Soon'.
 */

import { Difficulty } from './types';

export interface GameRegistryEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  controlType: string;
  supportedGestures: string[];
  minRequirements: string;
  isPlayable: boolean;
  status: string;
  color: string;
  plannedModule: string;
}

export const GAME_REGISTRY: GameRegistryEntry[] = [
  {
    id: 'fruit-slice',
    title: 'Fruit Slice',
    description: 'Slice flying tropical fruits with high-speed virtual blade hand slashes while dodging hazard bombs.',
    category: 'Action',
    difficulty: 'Medium',
    controlType: 'Index Finger Slash',
    supportedGestures: ['INDEX_POINTING', 'SWIPE_LEFT', 'SWIPE_RIGHT', 'SWIPE_UP', 'SWIPE_DOWN'],
    minRequirements: 'Webcam 30+ FPS, 1 hand, low-latency motion smoothing',
    isPlayable: false,
    status: 'Coming Soon',
    color: '#FF2D95',
    plannedModule: 'Module 07',
  },
  {
    id: 'neon-dodge',
    title: 'Neon Dodge',
    description: 'Guide your energy core through intense waves of neon lasers and kinetic obstacles.',
    category: 'Arcade',
    difficulty: 'Hard',
    controlType: 'Open Palm Steering',
    supportedGestures: ['OPEN_PALM', 'CLOSED_FIST'],
    minRequirements: 'Webcam 30+ FPS, 1 hand, high sensitivity cursor',
    isPlayable: false,
    status: 'Coming Soon',
    color: '#FF00A8',
    plannedModule: 'Module 07',
  },
  {
    id: 'gem-catcher',
    title: 'Gem Catcher',
    description: 'Catch falling crystalline gems into your magnetic basket before they hit the abyss.',
    category: 'Casual',
    difficulty: 'Easy',
    controlType: 'Palm Horizontal Glide',
    supportedGestures: ['OPEN_PALM'],
    minRequirements: 'Webcam, 1 hand, horizontal axis calibration',
    isPlayable: false,
    status: 'Coming Soon',
    color: '#FF78BD',
    plannedModule: 'Module 08',
  },
  {
    id: 'pinch-pop',
    title: 'Pinch Pop',
    description: 'Pinch thumb and index finger precisely to pop floating reactive neon bubbles.',
    category: 'Precision',
    difficulty: 'Easy',
    controlType: 'Thumb & Index Pinch',
    supportedGestures: ['PINCH', 'OPEN_PALM'],
    minRequirements: 'Webcam, 1 hand, pinch threshold calibration',
    isPlayable: false,
    status: 'Coming Soon',
    color: '#FF2D95',
    plannedModule: 'Module 08',
  },
  {
    id: 'hand-archery',
    title: 'Hand Archery',
    description: 'Draw back your virtual bowstring with one hand, aim with the other, and release to strike bullseyes.',
    category: 'Simulation',
    difficulty: 'Hard',
    controlType: 'Two-Hand Bow Draw',
    supportedGestures: ['PINCH', 'OPEN_PALM', 'TWO_HAND_PINCH'],
    minRequirements: 'Webcam, 2 hands tracked simultaneously',
    isPlayable: false,
    status: 'Coming Soon',
    color: '#FF00A8',
    plannedModule: 'Module 09',
  },
  {
    id: 'air-paint-challenge',
    title: 'Air Paint Challenge',
    description: 'Draw glowing neon shapes and trace arcade symbols mid-air using your fingertip brush.',
    category: 'Creative',
    difficulty: 'Medium',
    controlType: 'Index Point & Draw',
    supportedGestures: ['INDEX_POINTING', 'PINCH', 'CLOSED_FIST'],
    minRequirements: 'Webcam, 1 hand, high precision cursor smoothing',
    isPlayable: false,
    status: 'Coming Soon',
    color: '#FF78BD',
    plannedModule: 'Module 09',
  },
  {
    id: 'gesture-memory-master',
    title: 'Gesture Memory Master',
    description: 'Repeat increasingly complex sequence of hand gestures under time pressure.',
    category: 'Puzzle',
    difficulty: 'Medium',
    controlType: 'Multi-Gesture Sequencer',
    supportedGestures: ['CLOSED_FIST', 'OPEN_PALM', 'THUMBS_UP', 'INDEX_POINTING', 'VICTORY'],
    minRequirements: 'Webcam, 1 hand, rapid multi-gesture classification',
    isPlayable: false,
    status: 'Coming Soon',
    color: '#FF2D95',
    plannedModule: 'Module 10',
  },
  {
    id: 'hand-tennis',
    title: 'Hand Tennis',
    description: 'Use your open palm as a reactive cyber paddle to rally high-velocity plasma balls.',
    category: 'Sports',
    difficulty: 'Medium',
    controlType: 'Open Palm Paddle',
    supportedGestures: ['OPEN_PALM'],
    minRequirements: 'Webcam, 1 hand, high velocity tracking',
    isPlayable: false,
    status: 'Coming Soon',
    color: '#FF00A8',
    plannedModule: 'Module 10',
  },
  {
    id: 'space-blaster',
    title: 'Space Blaster',
    description: 'Pilot a starfighter with hand tilt coordinates and fire laser blasts by forming a fist.',
    category: 'Action',
    difficulty: 'Hard',
    controlType: 'Hand Tilt & Fist Trigger',
    supportedGestures: ['OPEN_PALM', 'CLOSED_FIST', 'INDEX_POINTING'],
    minRequirements: 'Webcam, 1 hand, roll/tilt calculation',
    isPlayable: false,
    status: 'Coming Soon',
    color: '#FF78BD',
    plannedModule: 'Module 11',
  },
  {
    id: 'hand-maze-escape',
    title: 'Hand Maze Escape',
    description: 'Navigate a delicate spark through perilous electrified mazes without grazing the walls.',
    category: 'Precision',
    difficulty: 'Hard',
    controlType: 'Continuous Point Follower',
    supportedGestures: ['INDEX_POINTING', 'PINCH'],
    minRequirements: 'Webcam, 1 hand, 1€ filter tremor reduction',
    isPlayable: false,
    status: 'Coming Soon',
    color: '#FF2D95',
    plannedModule: 'Module 11',
  },
  {
    id: 'engine-sandbox',
    title: 'Game Engine Motion Arena',
    description: 'Interactive test arena demonstrating real-time hand-motion control, targets, pinch-popping, combos, and game state lifecycle.',
    category: 'Engine Demo',
    difficulty: 'Normal',
    controlType: 'Cursor + Pinch + Gestures',
    supportedGestures: ['OPEN_PALM', 'CLOSED_FIST', 'PINCH', 'INDEX_POINTING'],
    minRequirements: 'Webcam with active hand detection',
    isPlayable: true,
    status: 'Active Engine Demo',
    color: '#FF00A8',
    plannedModule: 'Module 06',
  },
];
