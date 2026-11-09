export interface GroovePreset {
  id: string;
  name: string;
  shortName: string;
  category: 'MPC' | 'Hip-Hop' | 'Electronic' | 'Live/Human' | 'Offbeat';
  description: string;
  swing: number; // 50 = straight 16ths, 54 = subtle MPC, 60 = classic 90s, 66 = triplet shuffle, 75 = full shuffle
  humanize: number; // 0..100 (%) timing micro-jitter in ms
  velocityDrift: number; // 0..100 (%) dynamic velocity variation
  stepTimeOffsets?: number[]; // custom millisecond offsets per step in 16-step bar (-30 to +30 ms)
  stepVelocityWeights?: number[]; // multiplier per step (e.g. 1.15 on accented hits, 0.85 on ghost notes)
}

export const GROOVE_PRESETS: GroovePreset[] = [
  {
    id: 'straight',
    name: 'Straight Grid (0% Swing)',
    shortName: 'STRAIGHT',
    category: 'Electronic',
    description: 'Strict mathematical 16th-note quantization. Zero micro-timing offset.',
    swing: 50,
    humanize: 0,
    velocityDrift: 0,
  },
  {
    id: 'mpc_54',
    name: 'MPC 60 (54% Subtle Swing)',
    shortName: 'MPC 54%',
    category: 'MPC',
    description: 'Roger Linn MPC 60 subtle 16th shuffle. Gives drums a tight, subtle head-nod bounce.',
    swing: 54,
    humanize: 10,
    velocityDrift: 15,
    stepVelocityWeights: [1.05, 0.95, 1.0, 0.9, 1.05, 0.95, 1.0, 0.9, 1.05, 0.95, 1.0, 0.9, 1.05, 0.95, 1.0, 0.9]
  },
  {
    id: 'mpc_60',
    name: 'MPC 3000 (60% Classic Swing)',
    shortName: 'MPC 60%',
    category: 'MPC',
    description: 'The golden standard of 90s Boom Bap and classic House. Distinct syncopated bounce.',
    swing: 60,
    humanize: 18,
    velocityDrift: 25,
    stepVelocityWeights: [1.1, 0.9, 1.02, 0.88, 1.1, 0.9, 1.02, 0.88, 1.1, 0.9, 1.02, 0.88, 1.1, 0.9, 1.02, 0.88]
  },
  {
    id: 'mpc_66',
    name: 'MPC Heavy Swing (66%)',
    shortName: 'MPC 66%',
    category: 'MPC',
    description: 'Heavy syncopation pushing off-beats toward a classic triplet / 12/8 swing pocket.',
    swing: 66,
    humanize: 22,
    velocityDrift: 30,
    stepVelocityWeights: [1.15, 0.85, 1.05, 0.82, 1.15, 0.85, 1.05, 0.82, 1.15, 0.85, 1.05, 0.82, 1.15, 0.85, 1.05, 0.82]
  },
  {
    id: 'dilla_wonky',
    name: 'Dilla Wonky (Laidback Pocket)',
    shortName: 'DILLA',
    category: 'Hip-Hop',
    description: 'Signature un-quantized drunken groove: relaxed micro-delayed snare backbeats (+18ms) and loose hats.',
    swing: 58,
    humanize: 45,
    velocityDrift: 40,
    // Custom milliseconds shift per step in 16-step grid
    stepTimeOffsets: [0, 4, -3, 8, 16, 5, -4, 12, 0, 6, -2, 9, 18, 5, -5, 14],
    stepVelocityWeights: [1.08, 0.88, 0.98, 0.85, 1.18, 0.82, 0.95, 0.86, 1.06, 0.9, 0.96, 0.84, 1.2, 0.85, 0.92, 0.88]
  },
  {
    id: 'uk_garage',
    name: 'UK Garage (62% 2-Step Bounce)',
    shortName: '2-STEP',
    category: 'Electronic',
    description: 'Skippy syncopation designed for 2-step garage, speed garage, and modern breakbeat bounce.',
    swing: 62,
    humanize: 12,
    velocityDrift: 30,
    stepVelocityWeights: [1.12, 0.82, 1.0, 0.92, 1.15, 0.8, 1.02, 0.9, 1.12, 0.82, 1.0, 0.92, 1.15, 0.8, 1.02, 0.9]
  },
  {
    id: 'detroit_techno',
    name: 'Detroit Pulse (57% Tight)',
    shortName: 'DETROIT',
    category: 'Electronic',
    description: 'Tight, driving warehouse rhythm with subtle off-beat delay and accented pulse.',
    swing: 57,
    humanize: 8,
    velocityDrift: 20,
    stepVelocityWeights: [1.1, 0.92, 1.04, 0.9, 1.1, 0.92, 1.04, 0.9, 1.1, 0.92, 1.04, 0.9, 1.1, 0.92, 1.04, 0.9]
  },
  {
    id: 'afrobeats',
    name: 'Afrobeat Log Drum Pocket (64%)',
    shortName: 'AFROBEAT',
    category: 'Offbeat',
    description: 'Rolling polyrhythmic swing with dynamic ghost-note velocity interplay and rolling bounce.',
    swing: 64,
    humanize: 25,
    velocityDrift: 45,
    stepVelocityWeights: [1.14, 0.8, 1.08, 0.84, 1.02, 0.9, 1.12, 0.78, 1.14, 0.8, 1.08, 0.84, 1.02, 0.9, 1.12, 0.78]
  },
  {
    id: 'humanize_loose',
    name: 'Live Drummer (Organic Humanize)',
    shortName: 'HUMANIZE',
    category: 'Live/Human',
    description: 'Analog loose drummer feel with natural microsecond timing drift and rich velocity accents.',
    swing: 52,
    humanize: 55,
    velocityDrift: 50,
  },
  {
    id: 'shuffle_triplet',
    name: 'Hard Triplet Shuffle (72%)',
    shortName: 'SHUFFLE',
    category: 'Offbeat',
    description: 'Pronounced blues, funk, and boogie triplet swing feel.',
    swing: 72,
    humanize: 15,
    velocityDrift: 30,
    stepVelocityWeights: [1.15, 0.85, 1.05, 0.8, 1.15, 0.85, 1.05, 0.8, 1.15, 0.85, 1.05, 0.8, 1.15, 0.85, 1.05, 0.8]
  },
  {
    id: 'witch_house_drag',
    name: 'Witch House Drag (Chopped & Screwed Pocket)',
    shortName: 'WITCH HOUSE',
    category: 'Hip-Hop',
    description: 'Heavily dragged backbeats (+24ms), delayed sluggish snares, and skittering micro-timed hi-hats for authentic occult dark trap.',
    swing: 56,
    humanize: 35,
    velocityDrift: 40,
    stepTimeOffsets: [0, -4, 8, -6, 24, -8, 6, 12, 0, -4, 8, -6, 26, -8, 6, 15],
    stepVelocityWeights: [1.25, 0.7, 0.95, 0.75, 1.3, 0.65, 0.9, 0.8, 1.2, 0.7, 0.95, 0.75, 1.35, 0.65, 0.9, 0.85]
  }
];

export function getGroovePresetById(id: string): GroovePreset {
  return GROOVE_PRESETS.find(p => p.id === id) || GROOVE_PRESETS[0];
}

/**
 * Calculates the exact micro-timing offset (in seconds) and velocity multiplier for a step.
 */
export function calculateStepGroove(
  step: number,
  bpm: number,
  preset: GroovePreset,
  customSwing?: number,
  customHumanize?: number,
  customVelocityDrift?: number
): { timeOffset: number; velocity: number } {
  const stepDuration = 15.0 / bpm; // duration of one 16th note step in seconds
  const swing = customSwing !== undefined ? customSwing : preset.swing;
  const humanize = customHumanize !== undefined ? customHumanize : preset.humanize;
  const velocityDrift = customVelocityDrift !== undefined ? customVelocityDrift : preset.velocityDrift;

  // 1. Swing offset on odd 16th note steps (step 1, 3, 5, 7, etc.)
  let swingOffsetSec = 0;
  if (step % 2 === 1) {
    // 50% = 0 offset, 60% = +0.2 of max swing, 75% = +0.5 of max swing
    const swingFactor = (swing - 50) / 50.0;
    swingOffsetSec = swingFactor * (stepDuration * 0.65);
  }

  // 2. Custom step time offset (if preset defines micro-timing offsets)
  let customOffsetSec = 0;
  if (preset.stepTimeOffsets && preset.stepTimeOffsets.length > 0) {
    const ms = preset.stepTimeOffsets[step % preset.stepTimeOffsets.length] || 0;
    customOffsetSec = ms / 1000.0;
  }

  // 3. Humanize timing jitter
  let jitterSec = 0;
  if (humanize > 0) {
    // Up to ±10ms human jitter based on humanize percentage
    const jitterFactor = (humanize / 100.0) * 0.010;
    jitterSec = (Math.random() - 0.5) * 2 * jitterFactor;
  }

  const totalTimeOffset = swingOffsetSec + customOffsetSec + jitterSec;

  // 4. Step Velocity calculation
  let baseVelocity = 1.0;
  if (preset.stepVelocityWeights && preset.stepVelocityWeights.length > 0) {
    baseVelocity = preset.stepVelocityWeights[step % preset.stepVelocityWeights.length] ?? 1.0;
  }

  // 5. Humanize velocity drift
  if (velocityDrift > 0) {
    const driftFactor = (velocityDrift / 100.0) * 0.25;
    const velJitter = 1.0 + (Math.random() - 0.5) * 2 * driftFactor;
    baseVelocity *= velJitter;
  }

  const clampedVelocity = Math.max(0.25, Math.min(1.4, baseVelocity));

  return {
    timeOffset: totalTimeOffset,
    velocity: clampedVelocity
  };
}
