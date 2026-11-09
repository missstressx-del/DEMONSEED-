/**
 * Euclidean rhythm and dark pattern mutation engine for DEMONSEED DAW
 */

export interface EuclideanResult {
  steps: boolean[];
  patternString: string;
}

/**
 * Calculates a Euclidean rhythm using Bjorklund's algorithm.
 * Distributes 'pulses' evenly across 'totalSteps'.
 */
export function generateEuclideanRhythm(pulses: number, totalSteps: number = 32, rotation: number = 0): EuclideanResult {
  const steps = Math.max(1, Math.min(32, totalSteps));
  const validPulses = Math.max(0, Math.min(steps, pulses));

  if (validPulses === 0) {
    return {
      steps: Array(steps).fill(false),
      patternString: '.'.repeat(steps),
    };
  }

  if (validPulses >= steps) {
    return {
      steps: Array(steps).fill(true),
      patternString: 'x'.repeat(steps),
    };
  }

  // Bjorklund's distribution algorithm
  let pattern: number[][] = [];
  for (let i = 0; i < steps; i++) {
    pattern.push([i < validPulses ? 1 : 0]);
  }

  let divisor = steps - validPulses;
  let remainder = validPulses;

  while (remainder > 0) {
    const minLen = Math.min(divisor, remainder);
    for (let i = 0; i < minLen; i++) {
      pattern[i] = pattern[i].concat(pattern[pattern.length - 1 - i]);
    }
    pattern.splice(pattern.length - minLen, minLen);
    const newDivisor = minLen;
    remainder = divisor % remainder;
    divisor = newDivisor;
  }

  const flattened: boolean[] = pattern.flat().map((v) => v === 1);

  // Apply rotation
  const rotated = Array(steps).fill(false);
  const rot = ((rotation % steps) + steps) % steps;
  for (let i = 0; i < steps; i++) {
    rotated[(i + rot) % steps] = flattened[i];
  }

  const patternString = rotated.map((b) => (b ? 'X' : '•')).join(' ');

  return {
    steps: rotated,
    patternString,
  };
}

export const OCCULT_SCALES = [
  { id: 'harmonic_minor', name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'phrygian_dominant', name: 'Phrygian Dominant †', intervals: [0, 1, 4, 5, 7, 8, 10] },
  { id: 'locrian', name: 'Dark Locrian', intervals: [0, 1, 3, 5, 6, 8, 10] },
  { id: 'hirajoshi', name: 'Hirajoshi Occult', intervals: [0, 2, 3, 7, 8] },
  { id: 'hungarian_minor', name: 'Hungarian Minor', intervals: [0, 2, 3, 6, 7, 8, 11] },
  { id: 'witch_pentatonic', name: 'Witch Pentatonic', intervals: [0, 3, 5, 7, 10] },
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Returns pitch list for a root note and scale across octaves
 */
export function getScalePitches(rootNote: string = 'C', scaleId: string = 'harmonic_minor', startOctave: number = 2, octaves: number = 3): string[] {
  const rootIndex = NOTE_NAMES.indexOf(rootNote.toUpperCase()) >= 0 ? NOTE_NAMES.indexOf(rootNote.toUpperCase()) : 0;
  const scale = OCCULT_SCALES.find((s) => s.id === scaleId) || OCCULT_SCALES[0];
  const pitches: string[] = [];

  for (let oct = startOctave; oct < startOctave + octaves; oct++) {
    for (const interval of scale.intervals) {
      const noteIdx = (rootIndex + interval) % 12;
      const actualOctave = oct + Math.floor((rootIndex + interval) / 12);
      if (actualOctave <= 6) {
        pitches.push(`${NOTE_NAMES[noteIdx]}${actualOctave}`);
      }
    }
  }

  return pitches;
}

/**
 * Corrupts/Mutates a drum pattern or MIDI note array with controllable chaos/darkness
 */
export function mutateDrumPattern(pattern: boolean[], chaosAmount: number = 0.35, preserveBeats: boolean = true): boolean[] {
  const mutated = [...pattern];
  const total = mutated.length;

  for (let i = 0; i < total; i++) {
    // If preserveBeats is on, downbeats (every 4 or 8) have lower mutation chance
    const isDownbeat = i % 8 === 0;
    const isQuarter = i % 4 === 0;
    const effectiveChance = isDownbeat && preserveBeats ? chaosAmount * 0.15 : isQuarter && preserveBeats ? chaosAmount * 0.35 : chaosAmount;

    if (Math.random() < effectiveChance) {
      if (mutated[i]) {
        // Drop note or stutter shift it
        if (Math.random() < 0.4) {
          mutated[i] = false;
        } else if (i + 1 < total && !mutated[i + 1]) {
          mutated[i + 1] = true; // ghost syncopation
        }
      } else {
        // Add occult ghost hit
        mutated[i] = true;
      }
    }
  }

  return mutated;
}
