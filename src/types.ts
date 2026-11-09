export type TrackType = 'synth' | 'drums' | 'bass' | 'audio';
export type DurationMode = 'quick' | 'full';

export interface SynthConfig {
  oscillator: 'sine' | 'square' | 'triangle' | 'sawtooth';
  attack: number;  // seconds
  decay: number;   // seconds
  sustain: number; // level 0..1
  release: number; // seconds
  cutoff: number;  // Hz
  resonance: number; // Q factor
  delayTime: number; // seconds
  delayFeedback: number; // 0..1

  // Multi-Oscillator & Sound Layering Engine
  layer2Enabled?: boolean;
  layer2Oscillator?: 'sine' | 'square' | 'triangle' | 'sawtooth';
  layer2Octave?: number;    // -2..+2
  layer2Detune?: number;    // -50..+50 cents
  layer2Level?: number;     // 0..1 (mix ratio)
  layer2Pan?: number;       // -1..+1

  // Sub-Bass Underlay
  subEnabled?: boolean;
  subOscillator?: 'sine' | 'square' | 'triangle';
  subOctave?: number;       // -1 or -2 octaves
  subLevel?: number;        // 0..1

  // Noise / Transient Grit Layer
  noiseLayerEnabled?: boolean;
  noiseType?: 'white' | 'pink';
  noiseLevel?: number;      // 0..1

  // Unison Multi-Voice Layering Stack
  unisonVoices?: number;    // 1, 3, 5, 7 voices
  unisonDetune?: number;    // 0..50 cents
  unisonSpread?: number;    // 0..1 stereo width
}

export interface MidiNote {
  id: string;
  pitch: string; // e.g. "C4", "E4", "G4"
  step: number;  // 0..31 (or 0..15)
  duration: number; // in steps
  velocity?: number; // 0..1
}

export interface GrooveConfig {
  presetId: string; // e.g. 'straight', 'mpc_54', 'mpc_60', 'mpc_66', 'dilla_wonky', 'uk_garage', etc.
  name?: string;
  swing?: number; // 50..75%
  humanize?: number; // 0..100%
  velocityDrift?: number; // 0..100%
}

export interface DrumTrackState {
  kick: boolean[];  // length 16 or 32
  snare: boolean[];
  hihat: boolean[];
  clap: boolean[];
  groove?: GrooveConfig;
}

export interface AudioClip {
  id: string;
  name: string;
  url: string;
  blob?: Blob;
  prompt?: string;
  startStep: number;
  durationSteps: number;
}

export interface TrackAutomation {
  volume?: number[]; // 32 values, 0..1
  pan?: number[];    // 32 values, -1..1
  cutoff?: number[]; // 32 values, 0..1 (represents 100Hz to 15000Hz)
  activeParam: 'none' | 'volume' | 'pan' | 'cutoff';
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  volume: number; // 0..1
  pan: number;    // -1..1
  muted: boolean;
  soloed: boolean;
  color: string;
  synthConfig?: SynthConfig;
  midiNotes?: MidiNote[];
  drumState?: DrumTrackState;
  grooveConfig?: GrooveConfig;
  clips?: AudioClip[];
  compEnabled?: boolean;
  compThreshold?: number;
  compRatio?: number;
  vsts?: VstPlugin[];
  automation?: TrackAutomation;
  layerTargetTrackId?: string; // Companion track to layer notes with
  drumLayerConfig?: {
    kickSubLayer?: boolean;    // Sub-bass layer under kick (45Hz boom)
    snareCrackLayer?: boolean; // White noise crack/snap transient under snare
    hihatSpread?: boolean;     // Stereo width & micro-delay layer for hats
    clapStack?: boolean;       // Multi-hit humanized clap layer
  };
}

export interface DAWTheme {
  id: string;
  name: string;
  bgClass: string;
  panelClass: string;
  borderClass: string;
  accentColor: string;
  textMuted: string;
}

export interface PresetTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  bpm: number;
  tracks: Track[];
  eq: {
    bass: number;
    mid: number;
    treble: number;
  };
  isSystem?: boolean; // Pre-installed system templates
  category?: string;
  genre?: string;
}

export interface VstParameter {
  id: string;
  name: string;
  min: number;
  max: number;
  value: number;
  unit?: string;
}

export interface UserSynthPreset {
  id: string;
  name: string;
  category: 'synth' | 'bass';
  description?: string;
  config: SynthConfig;
  createdAt: string;
}

export interface VstPlugin {
  id: string;
  name: string;
  developer: string;
  category: 'Effect' | 'Instrument';
  description: string;
  isEnabled: boolean;
  code?: string; // custom javascript Web Audio node builder or script
  parameters: VstParameter[];
  linkedUrl?: string; // external linked open source module URL
}

export interface RitualState {
  isTapeStopping: boolean;
  isHalftime: boolean;
  stutterActive: boolean;
  stutterDivision: '1/16' | '1/32' | '1/8T';
  voidReverbWet: number; // 0..1
  tapeRuinDrive: number; // 0..1
  tapeFlutter: number; // 0..1
  xyPad: {
    x: number; // 0..1, maps to filter cutoff (100Hz .. 14000Hz)
    y: number; // 0..1, maps to resonance + tape drive
    active: boolean;
  };
}

export type BrainwaveBand = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export interface FlowStateSettings {
  isEnabled: boolean;
  band: BrainwaveBand;
  carrierFreq: number; // Hz, e.g. 432
  beatFreq: number; // Hz, e.g. 10.0
  waveType: 'sine' | 'triangle';
  volume: number; // 0..1
  noiseType: 'none' | 'pink' | 'brown' | 'void';
  noiseVolume: number; // 0..1
  isochronic: boolean; // rhythmic pulse modulation
  pulseDepth: number; // 0..1
  presetId?: string;
}

