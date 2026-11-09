import { PresetTemplate } from '../types';

export const TEMPLATE_CATEGORIES = [
  'All',
  'Electronic & Club',
  'Hip Hop & Chill',
  'Bass & Breaks',
  'Organic & World',
  'Witch House & Occult'
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

export const systemTemplates: PresetTemplate[] = [
  // 1. Ambient Deep Space
  {
    id: 'sys-ambient-space',
    name: 'Ambient Deep Space',
    category: 'Hip Hop & Chill',
    genre: 'Ambient / Drone',
    description: 'Slow-attack triangle chords, high delay feedback, and soft sub-bass. Perfect for cinematic atmosphere.',
    createdAt: 'System Built-In',
    bpm: 72,
    isSystem: true,
    eq: { bass: 3.5, mid: -1.0, treble: 1.5 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Ambient Drums',
        type: 'drums',
        volume: 0.6,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false
          ],
          hihat: [
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false
          ],
          clap: Array(32).fill(false)
        }
      },
      {
        id: 'track-synth',
        name: 'Cinematic Ambient Lead',
        type: 'synth',
        volume: 0.85,
        pan: -0.1,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'triangle',
          attack: 1.2,
          decay: 0.8,
          sustain: 0.85,
          release: 1.5,
          cutoff: 950,
          resonance: 2.0,
          delayTime: 0.45,
          delayFeedback: 0.65
        },
        midiNotes: [
          { id: 'amb-1', pitch: 'C4', step: 0, duration: 8 },
          { id: 'amb-2', pitch: 'E4', step: 0, duration: 8 },
          { id: 'amb-3', pitch: 'G4', step: 0, duration: 8 },
          { id: 'amb-4', pitch: 'B4', step: 0, duration: 8 },
          { id: 'amb-5', pitch: 'A4', step: 10, duration: 10 },
          { id: 'amb-6', pitch: 'C5', step: 10, duration: 10 },
          { id: 'amb-7', pitch: 'E5', step: 10, duration: 10 },
          { id: 'amb-8', pitch: 'F4', step: 22, duration: 10 },
          { id: 'amb-9', pitch: 'A4', step: 22, duration: 10 },
          { id: 'amb-10', pitch: 'C5', step: 22, duration: 10 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Ambient Sub-Bass',
        type: 'bass',
        volume: 0.8,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sine',
          attack: 0.4,
          decay: 0.5,
          sustain: 0.9,
          release: 0.8,
          cutoff: 250,
          resonance: 1.2,
          delayTime: 0.2,
          delayFeedback: 0.1
        },
        midiNotes: [
          { id: 'amb-b1', pitch: 'C3', step: 0, duration: 10 },
          { id: 'amb-b2', pitch: 'A2', step: 10, duration: 10 },
          { id: 'amb-b3', pitch: 'F2', step: 22, duration: 10 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Vocals & Atmospheric Fx',
        type: 'audio',
        volume: 0.7,
        pan: 0.2,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 2. Lo-Fi Chill Study Lounge
  {
    id: 'sys-lofi-hiphop',
    name: 'Lo-Fi Chill Study Lounge',
    category: 'Hip Hop & Chill',
    genre: 'Lo-Fi Hip Hop',
    description: 'Dusty 84 BPM tape-saturated beat. Swung boom-bap kick, mellow jazzy Rhodes seventh chords, and warm analog sub-bass.',
    createdAt: 'System Built-In',
    bpm: 84,
    isSystem: true,
    eq: { bass: 3.2, mid: 2.0, treble: -1.5 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Dusty Vinyl Boom-Bap',
        type: 'drums',
        volume: 0.82,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, false, false, true, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, true, false, false, false, false, false
          ],
          snare: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false
          ],
          hihat: [
            true, false, true, true, false, true, true, false,
            true, false, true, true, false, true, true, false,
            true, false, true, true, false, true, true, false,
            true, false, true, true, false, true, true, true
          ],
          clap: [
            false, false, false, false, false, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, false, false, false, false,
            false, false, false, false, true, false, false, false
          ]
        }
      },
      {
        id: 'track-synth',
        name: 'Tape Mellow Rhodes',
        type: 'synth',
        volume: 0.88,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'triangle',
          attack: 0.08,
          decay: 0.45,
          sustain: 0.75,
          release: 0.5,
          cutoff: 1650,
          resonance: 1.8,
          delayTime: 0.36,
          delayFeedback: 0.42
        },
        midiNotes: [
          // Dm9 chord (steps 0-7)
          { id: 'lf-1', pitch: 'D4', step: 0, duration: 6 },
          { id: 'lf-2', pitch: 'F4', step: 0, duration: 6 },
          { id: 'lf-3', pitch: 'A4', step: 0, duration: 6 },
          { id: 'lf-4', pitch: 'C5', step: 0, duration: 6 },
          { id: 'lf-5', pitch: 'E5', step: 0, duration: 6 },
          // G13 chord (steps 8-15)
          { id: 'lf-6', pitch: 'B3', step: 8, duration: 6 },
          { id: 'lf-7', pitch: 'F4', step: 8, duration: 6 },
          { id: 'lf-8', pitch: 'A4', step: 8, duration: 6 },
          { id: 'lf-9', pitch: 'E5', step: 8, duration: 6 },
          // Cmaj9 chord (steps 16-23)
          { id: 'lf-10', pitch: 'C4', step: 16, duration: 6 },
          { id: 'lf-11', pitch: 'E4', step: 16, duration: 6 },
          { id: 'lf-12', pitch: 'G4', step: 16, duration: 6 },
          { id: 'lf-13', pitch: 'B4', step: 16, duration: 6 },
          { id: 'lf-14', pitch: 'D5', step: 16, duration: 6 },
          // Am7 chord (steps 24-31)
          { id: 'lf-15', pitch: 'A3', step: 24, duration: 6 },
          { id: 'lf-16', pitch: 'C4', step: 24, duration: 6 },
          { id: 'lf-17', pitch: 'E4', step: 24, duration: 6 },
          { id: 'lf-18', pitch: 'G4', step: 24, duration: 6 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Warm Upright Sub',
        type: 'bass',
        volume: 0.85,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sine',
          attack: 0.05,
          decay: 0.35,
          sustain: 0.8,
          release: 0.4,
          cutoff: 380,
          resonance: 1.4,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'lfb-1', pitch: 'D2', step: 0, duration: 5 },
          { id: 'lfb-2', pitch: 'A2', step: 6, duration: 2 },
          { id: 'lfb-3', pitch: 'G2', step: 8, duration: 5 },
          { id: 'lfb-4', pitch: 'D2', step: 14, duration: 2 },
          { id: 'lfb-5', pitch: 'C2', step: 16, duration: 5 },
          { id: 'lfb-6', pitch: 'G2', step: 22, duration: 2 },
          { id: 'lfb-7', pitch: 'A2', step: 24, duration: 6 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Vinyl Crackle & Foley',
        type: 'audio',
        volume: 0.55,
        pan: 0.2,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 3. Synthwave Neon Horizon
  {
    id: 'sys-synthwave-horizon',
    name: 'Synthwave Neon Horizon',
    category: 'Organic & World',
    genre: 'Synthwave / Retro',
    description: 'Futuristic 112 BPM retro nostalgia. Rich sawtooth chords, vintage 80s gated snare spacing, and fat bass ticks.',
    createdAt: 'System Built-In',
    bpm: 112,
    isSystem: true,
    eq: { bass: 1.5, mid: 1.2, treble: 1.8 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Retro Linn Drums',
        type: 'drums',
        volume: 0.75,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false
          ],
          snare: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false
          ],
          hihat: [
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false
          ],
          clap: Array(32).fill(false)
        }
      },
      {
        id: 'track-synth',
        name: 'Retro Poly Lead',
        type: 'synth',
        volume: 0.75,
        pan: -0.1,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.2,
          decay: 0.35,
          sustain: 0.6,
          release: 0.45,
          cutoff: 2800,
          resonance: 3.0,
          delayTime: 0.28,
          delayFeedback: 0.35
        },
        midiNotes: [
          { id: 'sw-1', pitch: 'D4', step: 0, duration: 6 },
          { id: 'sw-2', pitch: 'F4', step: 6, duration: 2 },
          { id: 'sw-3', pitch: 'G4', step: 8, duration: 4 },
          { id: 'sw-4', pitch: 'A4', step: 12, duration: 4 },
          { id: 'sw-5', pitch: 'F4', step: 16, duration: 6 },
          { id: 'sw-6', pitch: 'D4', step: 22, duration: 2 },
          { id: 'sw-7', pitch: 'C4', step: 24, duration: 8 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Fat Juno Bassline',
        type: 'bass',
        volume: 0.8,
        pan: 0.05,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'square',
          attack: 0.05,
          decay: 0.15,
          sustain: 0.7,
          release: 0.25,
          cutoff: 800,
          resonance: 3.5,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'swb-1', pitch: 'D3', step: 0, duration: 2 },
          { id: 'swb-2', pitch: 'D3', step: 2, duration: 2 },
          { id: 'swb-3', pitch: 'D3', step: 4, duration: 2 },
          { id: 'swb-4', pitch: 'D3', step: 6, duration: 2 },
          { id: 'swb-5', pitch: 'G2', step: 8, duration: 2 },
          { id: 'swb-6', pitch: 'G2', step: 10, duration: 2 },
          { id: 'swb-7', pitch: 'A2', step: 12, duration: 4 },
          { id: 'swb-8', pitch: 'F2', step: 16, duration: 2 },
          { id: 'swb-9', pitch: 'F2', step: 18, duration: 2 },
          { id: 'swb-10', pitch: 'F2', step: 20, duration: 2 },
          { id: 'swb-11', pitch: 'F2', step: 22, duration: 2 },
          { id: 'swb-12', pitch: 'C2', step: 24, duration: 4 },
          { id: 'swb-13', pitch: 'D2', step: 28, duration: 4 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Cinematic Ambient Sweeps',
        type: 'audio',
        volume: 0.6,
        pan: 0.25,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 4. Deep House Horizon
  {
    id: 'sys-deep-house',
    name: 'Deep House Horizon',
    category: 'Electronic & Club',
    genre: 'Deep House',
    description: 'Loungey 120 BPM club groove. Rich organ chords, deep organic sub-bassline, and steady kick-clap rhythm with open hat shuffles.',
    createdAt: 'System Built-In',
    bpm: 120,
    isSystem: true,
    eq: { bass: 4.0, mid: 1.0, treble: 2.0 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Club House Drums',
        type: 'drums',
        volume: 0.8,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false
          ],
          hihat: [
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, true
          ],
          clap: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false
          ]
        }
      },
      {
        id: 'track-synth',
        name: 'Deep Warm Chords',
        type: 'synth',
        volume: 0.7,
        pan: -0.1,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'triangle',
          attack: 0.15,
          decay: 0.4,
          sustain: 0.6,
          release: 0.3,
          cutoff: 1200,
          resonance: 2.0,
          delayTime: 0.25,
          delayFeedback: 0.35
        },
        midiNotes: [
          { id: 'dh-1', pitch: 'A3', step: 0, duration: 4 },
          { id: 'dh-2', pitch: 'C4', step: 0, duration: 4 },
          { id: 'dh-3', pitch: 'E4', step: 0, duration: 4 },
          { id: 'dh-4', pitch: 'G4', step: 0, duration: 4 },
          { id: 'dh-5', pitch: 'D4', step: 6, duration: 2 },
          { id: 'dh-6', pitch: 'F4', step: 6, duration: 2 },
          { id: 'dh-7', pitch: 'A4', step: 6, duration: 2 },
          { id: 'dh-8', pitch: 'C4', step: 8, duration: 4 },
          { id: 'dh-9', pitch: 'E4', step: 8, duration: 4 },
          { id: 'dh-10', pitch: 'G4', step: 8, duration: 4 },
          { id: 'dh-11', pitch: 'B4', step: 8, duration: 4 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Organic Sub Bass',
        type: 'bass',
        volume: 0.85,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sine',
          attack: 0.08,
          decay: 0.3,
          sustain: 0.9,
          release: 0.2,
          cutoff: 350,
          resonance: 1.0,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'dhb-1', pitch: 'A2', step: 0, duration: 4 },
          { id: 'dhb-2', pitch: 'D2', step: 6, duration: 2 },
          { id: 'dhb-3', pitch: 'C2', step: 8, duration: 4 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Rhodes Chops Stems',
        type: 'audio',
        volume: 0.65,
        pan: 0.15,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 5. Melodic Techno Berlin
  {
    id: 'sys-melodic-techno',
    name: 'Melodic Techno Berlin',
    category: 'Electronic & Club',
    genre: 'Melodic Techno',
    description: 'Hypnotic 128 BPM warehouse energy. Pounding kick, rolling 16th sub-bass, offbeat open hats, and resonant progressive saw plucks.',
    createdAt: 'System Built-In',
    bpm: 128,
    isSystem: true,
    eq: { bass: 4.2, mid: -0.5, treble: 2.5 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Klock Warehouse Kit',
        type: 'drums',
        volume: 0.85,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, true
          ],
          hihat: [
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false
          ],
          clap: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false
          ]
        }
      },
      {
        id: 'track-synth',
        name: 'Progressive Saw Pluck',
        type: 'synth',
        volume: 0.78,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.02,
          decay: 0.22,
          sustain: 0.35,
          release: 0.28,
          cutoff: 3100,
          resonance: 4.0,
          delayTime: 0.375, // Dotted 8th delay
          delayFeedback: 0.52
        },
        midiNotes: [
          { id: 'mt-1', pitch: 'F4', step: 2, duration: 1 },
          { id: 'mt-2', pitch: 'C5', step: 4, duration: 1 },
          { id: 'mt-3', pitch: 'G#4', step: 6, duration: 2 },
          { id: 'mt-4', pitch: 'D#5', step: 10, duration: 1 },
          { id: 'mt-5', pitch: 'C5', step: 12, duration: 1 },
          { id: 'mt-6', pitch: 'A#4', step: 14, duration: 2 },
          { id: 'mt-7', pitch: 'F4', step: 18, duration: 1 },
          { id: 'mt-8', pitch: 'C5', step: 20, duration: 1 },
          { id: 'mt-9', pitch: 'G#4', step: 22, duration: 2 },
          { id: 'mt-10', pitch: 'F5', step: 26, duration: 1 },
          { id: 'mt-11', pitch: 'D#5', step: 28, duration: 1 },
          { id: 'mt-12', pitch: 'C5', step: 30, duration: 2 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Rolling 16th Sub-Bass',
        type: 'bass',
        volume: 0.88,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.01,
          decay: 0.14,
          sustain: 0.45,
          release: 0.15,
          cutoff: 650,
          resonance: 2.8,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'mtb-1', pitch: 'F2', step: 1, duration: 1 },
          { id: 'mtb-2', pitch: 'F2', step: 2, duration: 1 },
          { id: 'mtb-3', pitch: 'F2', step: 3, duration: 1 },
          { id: 'mtb-4', pitch: 'F2', step: 5, duration: 1 },
          { id: 'mtb-5', pitch: 'F2', step: 6, duration: 1 },
          { id: 'mtb-6', pitch: 'G#2', step: 7, duration: 1 },
          { id: 'mtb-7', pitch: 'F2', step: 9, duration: 1 },
          { id: 'mtb-8', pitch: 'F2', step: 10, duration: 1 },
          { id: 'mtb-9', pitch: 'F2', step: 11, duration: 1 },
          { id: 'mtb-10', pitch: 'D#2', step: 13, duration: 1 },
          { id: 'mtb-11', pitch: 'F2', step: 14, duration: 1 },
          { id: 'mtb-12', pitch: 'C3', step: 15, duration: 1 },
          { id: 'mtb-13', pitch: 'F2', step: 17, duration: 1 },
          { id: 'mtb-14', pitch: 'F2', step: 18, duration: 1 },
          { id: 'mtb-15', pitch: 'F2', step: 19, duration: 1 },
          { id: 'mtb-16', pitch: 'C#2', step: 25, duration: 2 },
          { id: 'mtb-17', pitch: 'D#2', step: 29, duration: 2 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Industrial Drone Atmos',
        type: 'audio',
        volume: 0.6,
        pan: 0.2,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 6. UK Garage 2-Step London
  {
    id: 'sys-uk-garage',
    name: 'UK Garage 2-Step London',
    category: 'Electronic & Club',
    genre: 'UK Garage / 2-Step',
    description: 'Iconic 132 BPM London underground groove. Syncopated skipping kick, snappy 2-step ghost snares, classic M1 organ chords, and bouncy donk sub.',
    createdAt: 'System Built-In',
    bpm: 132,
    isSystem: true,
    eq: { bass: 4.5, mid: 1.0, treble: 2.8 },
    tracks: [
      {
        id: 'track-drums',
        name: '2-Step Speed Garage Kit',
        type: 'drums',
        volume: 0.82,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, false, false, false, false,
            false, false, true, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, true, false, false, false, true, false
          ],
          snare: [
            false, false, false, false, true, false, false, true,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, true,
            false, false, false, false, true, false, true, false
          ],
          hihat: [
            true, false, true, true, false, true, true, false,
            true, true, false, true, true, false, true, true,
            true, false, true, true, false, true, true, false,
            true, true, false, true, true, true, true, true
          ],
          clap: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false
          ]
        }
      },
      {
        id: 'track-synth',
        name: '90s M1 House Organ Chops',
        type: 'synth',
        volume: 0.84,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'square',
          attack: 0.01,
          decay: 0.18,
          sustain: 0.35,
          release: 0.18,
          cutoff: 2900,
          resonance: 2.5,
          delayTime: 0.23,
          delayFeedback: 0.3
        },
        midiNotes: [
          // Ebm7 stabs
          { id: 'ukg-1', pitch: 'D#4', step: 2, duration: 1 },
          { id: 'ukg-2', pitch: 'F#4', step: 2, duration: 1 },
          { id: 'ukg-3', pitch: 'A#4', step: 2, duration: 1 },
          { id: 'ukg-4', pitch: 'C#5', step: 2, duration: 1 },

          { id: 'ukg-5', pitch: 'D#4', step: 6, duration: 1 },
          { id: 'ukg-6', pitch: 'F#4', step: 6, duration: 1 },
          { id: 'ukg-7', pitch: 'A#4', step: 6, duration: 1 },

          { id: 'ukg-8', pitch: 'C#4', step: 10, duration: 2 },
          { id: 'ukg-9', pitch: 'F4', step: 10, duration: 2 },
          { id: 'ukg-10', pitch: 'G#4', step: 10, duration: 2 },

          { id: 'ukg-11', pitch: 'D#4', step: 18, duration: 1 },
          { id: 'ukg-12', pitch: 'F#4', step: 18, duration: 1 },
          { id: 'ukg-13', pitch: 'A#4', step: 18, duration: 1 },

          { id: 'ukg-14', pitch: 'B3', step: 22, duration: 2 },
          { id: 'ukg-15', pitch: 'D#4', step: 22, duration: 2 },
          { id: 'ukg-16', pitch: 'F#4', step: 22, duration: 2 },

          { id: 'ukg-17', pitch: 'C#4', step: 26, duration: 2 },
          { id: 'ukg-18', pitch: 'F4', step: 26, duration: 2 },
          { id: 'ukg-19', pitch: 'G#4', step: 26, duration: 2 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Bouncy Reese Donk Bass',
        type: 'bass',
        volume: 0.9,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'triangle',
          attack: 0.02,
          decay: 0.28,
          sustain: 0.65,
          release: 0.2,
          cutoff: 550,
          resonance: 2.2,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'ukb-1', pitch: 'D#2', step: 0, duration: 3 },
          { id: 'ukb-2', pitch: 'D#2', step: 4, duration: 2 },
          { id: 'ukb-3', pitch: 'A#2', step: 8, duration: 2 },
          { id: 'ukb-4', pitch: 'C#2', step: 10, duration: 3 },
          { id: 'ukb-5', pitch: 'D#2', step: 16, duration: 3 },
          { id: 'ukb-6', pitch: 'F#2', step: 20, duration: 2 },
          { id: 'ukb-7', pitch: 'B2', step: 24, duration: 2 },
          { id: 'ukb-8', pitch: 'C#2', step: 28, duration: 3 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Vocal Chops & Gunshot FX',
        type: 'audio',
        volume: 0.7,
        pan: 0.2,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 7. Acid Trance Injector
  {
    id: 'sys-acid-trance',
    name: 'Acid Trance Injector',
    category: 'Electronic & Club',
    genre: 'Acid Trance',
    description: 'High-energy 138 BPM driving four-on-the-floor kick, offbeat open hat, and resonant sawtooth acid basslines.',
    createdAt: 'System Built-In',
    bpm: 138,
    isSystem: true,
    eq: { bass: 2.0, mid: 0.5, treble: 3.0 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Hard Drum Section',
        type: 'drums',
        volume: 0.8,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false
          ],
          hihat: [
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false
          ],
          clap: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false
          ]
        }
      },
      {
        id: 'track-synth',
        name: 'Trance Pluck Lead',
        type: 'synth',
        volume: 0.7,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.02,
          decay: 0.2,
          sustain: 0.4,
          release: 0.3,
          cutoff: 4200,
          resonance: 4.5,
          delayTime: 0.33,
          delayFeedback: 0.45
        },
        midiNotes: [
          { id: 'tr-1', pitch: 'A4', step: 2, duration: 1 },
          { id: 'tr-2', pitch: 'E5', step: 4, duration: 1 },
          { id: 'tr-3', pitch: 'C5', step: 6, duration: 2 },
          { id: 'tr-4', pitch: 'B4', step: 10, duration: 1 },
          { id: 'tr-5', pitch: 'A4', step: 12, duration: 1 },
          { id: 'tr-6', pitch: 'B4', step: 14, duration: 2 },
          { id: 'tr-7', pitch: 'E5', step: 18, duration: 1 },
          { id: 'tr-8', pitch: 'G5', step: 20, duration: 1 },
          { id: 'tr-9', pitch: 'A5', step: 22, duration: 2 },
          { id: 'tr-10', pitch: 'E5', step: 26, duration: 2 },
          { id: 'tr-11', pitch: 'D5', step: 30, duration: 2 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Resonant Acid Bass',
        type: 'bass',
        volume: 0.85,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.05,
          decay: 0.12,
          sustain: 0.5,
          release: 0.2,
          cutoff: 1400,
          resonance: 8.5,
          delayTime: 0.15,
          delayFeedback: 0.25
        },
        midiNotes: [
          { id: 'ac-1', pitch: 'A2', step: 0, duration: 1 },
          { id: 'ac-2', pitch: 'A2', step: 1, duration: 1 },
          { id: 'ac-3', pitch: 'A3', step: 2, duration: 1 },
          { id: 'ac-4', pitch: 'A2', step: 3, duration: 1 },
          { id: 'ac-5', pitch: 'C3', step: 4, duration: 1 },
          { id: 'ac-6', pitch: 'G2', step: 6, duration: 2 },
          { id: 'ac-7', pitch: 'A2', step: 8, duration: 1 },
          { id: 'ac-8', pitch: 'A2', step: 9, duration: 1 },
          { id: 'ac-9', pitch: 'A3', step: 10, duration: 1 },
          { id: 'ac-10', pitch: 'A2', step: 11, duration: 1 },
          { id: 'ac-11', pitch: 'D3', step: 12, duration: 1 },
          { id: 'ac-12', pitch: 'C3', step: 14, duration: 2 }
        ]
      },
      {
        id: 'track-audio',
        name: 'FX Stems',
        type: 'audio',
        volume: 0.6,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 8. Future Chillstep Dream
  {
    id: 'sys-future-chill',
    name: 'Future Chillstep Dream',
    category: 'Hip Hop & Chill',
    genre: 'Chillstep / Future Bass',
    description: 'Lush 140 BPM soundscape. Fast detuned sawtooth chords, heavy sub-bass notes, and snappy drum shuffles with organic foley clips.',
    createdAt: 'System Built-In',
    bpm: 140,
    isSystem: true,
    eq: { bass: 3.5, mid: 0.0, treble: 2.5 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Foley & Step Drums',
        type: 'drums',
        volume: 0.75,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, false, false, true, false,
            false, true, false, false, false, false, false, false,
            true, false, false, false, false, false, true, false,
            false, false, true, false, false, false, false, false
          ],
          snare: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, true, false
          ],
          hihat: [
            true, false, true, false, true, true, true, false,
            true, false, true, false, true, true, true, false,
            true, false, true, false, true, true, true, false,
            true, false, true, true, true, false, true, true
          ],
          clap: Array(32).fill(false)
        }
      },
      {
        id: 'track-synth',
        name: 'Chill Neon Chords',
        type: 'synth',
        volume: 0.75,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.05,
          decay: 0.3,
          sustain: 0.5,
          release: 0.25,
          cutoff: 2800,
          resonance: 4.5,
          delayTime: 0.33,
          delayFeedback: 0.5
        },
        midiNotes: [
          { id: 'fc-1', pitch: 'F4', step: 0, duration: 3 },
          { id: 'fc-2', pitch: 'A4', step: 0, duration: 3 },
          { id: 'fc-3', pitch: 'C5', step: 0, duration: 3 },
          { id: 'fc-4', pitch: 'G4', step: 4, duration: 3 },
          { id: 'fc-5', pitch: 'B4', step: 4, duration: 3 },
          { id: 'fc-6', pitch: 'D5', step: 4, duration: 3 },
          { id: 'fc-7', pitch: 'E4', step: 8, duration: 4 },
          { id: 'fc-8', pitch: 'G4', step: 8, duration: 4 },
          { id: 'fc-9', pitch: 'B4', step: 8, duration: 4 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Fat Reese Drone',
        type: 'bass',
        volume: 0.8,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'square',
          attack: 0.15,
          decay: 0.5,
          sustain: 0.8,
          release: 0.3,
          cutoff: 400,
          resonance: 1.5,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'fcb-1', pitch: 'F2', step: 0, duration: 4 },
          { id: 'fcb-2', pitch: 'G2', step: 4, duration: 4 },
          { id: 'fcb-3', pitch: 'E2', step: 8, duration: 4 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Vocal Atmos Clips',
        type: 'audio',
        volume: 0.7,
        pan: 0.2,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 9. Liquid Drum & Bass Flight
  {
    id: 'sys-liquid-dnb',
    name: 'Liquid Drum & Bass Flight',
    category: 'Bass & Breaks',
    genre: 'Drum & Bass',
    description: 'Blazing 174 BPM roller breakbeat. Soulful lush electric piano chords, rapid ghost-snare rolls, and smooth gliding Reese sub-bass.',
    createdAt: 'System Built-In',
    bpm: 174,
    isSystem: true,
    eq: { bass: 4.2, mid: 0.5, treble: 3.5 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Liquid Roller Break',
        type: 'drums',
        volume: 0.85,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, false, false, false, false,
            false, false, true, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, true, false, false, false, false, false
          ],
          snare: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, true,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, true
          ],
          hihat: [
            true, true, true, true, true, true, true, true,
            true, true, true, true, true, true, true, true,
            true, true, true, true, true, true, true, true,
            true, true, true, true, true, true, true, true
          ],
          clap: Array(32).fill(false)
        }
      },
      {
        id: 'track-synth',
        name: 'Soulful Atmospheric Chords',
        type: 'synth',
        volume: 0.8,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'triangle',
          attack: 0.25,
          decay: 0.4,
          sustain: 0.7,
          release: 0.6,
          cutoff: 2100,
          resonance: 2.2,
          delayTime: 0.35,
          delayFeedback: 0.45
        },
        midiNotes: [
          // EbMaj7
          { id: 'dnb-1', pitch: 'D#4', step: 0, duration: 8 },
          { id: 'dnb-2', pitch: 'G4', step: 0, duration: 8 },
          { id: 'dnb-3', pitch: 'A#4', step: 0, duration: 8 },
          { id: 'dnb-4', pitch: 'D5', step: 0, duration: 8 },
          // Gm7
          { id: 'dnb-5', pitch: 'D4', step: 8, duration: 8 },
          { id: 'dnb-6', pitch: 'F4', step: 8, duration: 8 },
          { id: 'dnb-7', pitch: 'A#4', step: 8, duration: 8 },
          { id: 'dnb-8', pitch: 'D5', step: 8, duration: 8 },
          // Cm7
          { id: 'dnb-9', pitch: 'C4', step: 16, duration: 8 },
          { id: 'dnb-10', pitch: 'D#4', step: 16, duration: 8 },
          { id: 'dnb-11', pitch: 'G4', step: 16, duration: 8 },
          { id: 'dnb-12', pitch: 'A#4', step: 16, duration: 8 },
          // Bb
          { id: 'dnb-13', pitch: 'A#3', step: 24, duration: 8 },
          { id: 'dnb-14', pitch: 'D4', step: 24, duration: 8 },
          { id: 'dnb-15', pitch: 'F4', step: 24, duration: 8 },
          { id: 'dnb-16', pitch: 'A#4', step: 24, duration: 8 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Warm Deep Reese Sub',
        type: 'bass',
        volume: 0.88,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.08,
          decay: 0.35,
          sustain: 0.85,
          release: 0.4,
          cutoff: 420,
          resonance: 1.8,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'dnbb-1', pitch: 'D#2', step: 0, duration: 7 },
          { id: 'dnbb-2', pitch: 'G2', step: 8, duration: 7 },
          { id: 'dnbb-3', pitch: 'C2', step: 16, duration: 7 },
          { id: 'dnbb-4', pitch: 'A#2', step: 24, duration: 7 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Vocal Chop Stems',
        type: 'audio',
        volume: 0.65,
        pan: 0.2,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 10. Cyberpunk Darksynth 2099
  {
    id: 'sys-cyberpunk-darksynth',
    name: 'Cyberpunk Darksynth 2099',
    category: 'Bass & Breaks',
    genre: 'Midtempo / Darksynth',
    description: 'Aggressive 104 BPM industrial dystopian drive. Heavy compressed kicks, metallic claps, distorted sawtooth hooks, and crushing Reese bass.',
    createdAt: 'System Built-In',
    bpm: 104,
    isSystem: true,
    eq: { bass: 4.8, mid: 1.8, treble: 3.2 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Industrial Heavy Beat',
        type: 'drums',
        volume: 0.85,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, false, false, false, false,
            true, false, false, false, false, false, true, false,
            true, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false
          ],
          hihat: [
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false,
            true, false, true, true, true, true, true, false
          ],
          clap: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false
          ]
        }
      },
      {
        id: 'track-synth',
        name: 'Distorted Cyber Saw Lead',
        type: 'synth',
        volume: 0.8,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.01,
          decay: 0.25,
          sustain: 0.45,
          release: 0.2,
          cutoff: 4800,
          resonance: 6.5,
          delayTime: 0.29,
          delayFeedback: 0.38
        },
        midiNotes: [
          { id: 'cp-1', pitch: 'D4', step: 0, duration: 2 },
          { id: 'cp-2', pitch: 'F4', step: 2, duration: 2 },
          { id: 'cp-3', pitch: 'D4', step: 4, duration: 2 },
          { id: 'cp-4', pitch: 'G#4', step: 6, duration: 2 },
          { id: 'cp-5', pitch: 'G4', step: 8, duration: 2 },
          { id: 'cp-6', pitch: 'F4', step: 10, duration: 2 },
          { id: 'cp-7', pitch: 'D4', step: 12, duration: 4 },
          { id: 'cp-8', pitch: 'D5', step: 16, duration: 2 },
          { id: 'cp-9', pitch: 'C5', step: 18, duration: 2 },
          { id: 'cp-10', pitch: 'A#4', step: 20, duration: 2 },
          { id: 'cp-11', pitch: 'G#4', step: 22, duration: 2 },
          { id: 'cp-12', pitch: 'A4', step: 24, duration: 4 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Crushing Darksynth Reese',
        type: 'bass',
        volume: 0.9,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.04,
          decay: 0.3,
          sustain: 0.75,
          release: 0.25,
          cutoff: 920,
          resonance: 4.8,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'cpb-1', pitch: 'D2', step: 0, duration: 3 },
          { id: 'cpb-2', pitch: 'D2', step: 4, duration: 2 },
          { id: 'cpb-3', pitch: 'F2', step: 6, duration: 2 },
          { id: 'cpb-4', pitch: 'D2', step: 8, duration: 3 },
          { id: 'cpb-5', pitch: 'G#2', step: 12, duration: 2 },
          { id: 'cpb-6', pitch: 'G2', step: 14, duration: 2 },
          { id: 'cpb-7', pitch: 'D2', step: 16, duration: 3 },
          { id: 'cpb-8', pitch: 'C2', step: 22, duration: 2 },
          { id: 'cpb-9', pitch: 'D2', step: 24, duration: 4 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Glitch Stabs & Sirens',
        type: 'audio',
        volume: 0.65,
        pan: 0.2,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 11. French Touch Filter House
  {
    id: 'sys-french-touch',
    name: 'French Touch Filter House',
    category: 'Electronic & Club',
    genre: 'Disco House',
    description: 'Upbeat 124 BPM Parisian disco house. Filtered brassy synth stabs, funky slapped bassline, and pumping four-on-the-floor groove.',
    createdAt: 'System Built-In',
    bpm: 124,
    isSystem: true,
    eq: { bass: 3.5, mid: 1.8, treble: 2.8 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Disco 909 Groove',
        type: 'drums',
        volume: 0.82,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false
          ],
          hihat: [
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, true
          ],
          clap: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false
          ]
        }
      },
      {
        id: 'track-synth',
        name: 'Filtered Disco Brass Stabs',
        type: 'synth',
        volume: 0.85,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.03,
          decay: 0.28,
          sustain: 0.5,
          release: 0.3,
          cutoff: 2400,
          resonance: 3.8,
          delayTime: 0.24,
          delayFeedback: 0.3
        },
        midiNotes: [
          // BbMaj7 stabs
          { id: 'ft-1', pitch: 'A#3', step: 0, duration: 2 },
          { id: 'ft-2', pitch: 'D4', step: 0, duration: 2 },
          { id: 'ft-3', pitch: 'F4', step: 0, duration: 2 },
          { id: 'ft-4', pitch: 'A4', step: 0, duration: 2 },

          { id: 'ft-5', pitch: 'A#3', step: 3, duration: 2 },
          { id: 'ft-6', pitch: 'D4', step: 3, duration: 2 },
          { id: 'ft-7', pitch: 'F4', step: 3, duration: 2 },
          { id: 'ft-8', pitch: 'A4', step: 3, duration: 2 },

          // Cm7 stabs
          { id: 'ft-9', pitch: 'C4', step: 8, duration: 2 },
          { id: 'ft-10', pitch: 'D#4', step: 8, duration: 2 },
          { id: 'ft-11', pitch: 'G4', step: 8, duration: 2 },
          { id: 'ft-12', pitch: 'A#4', step: 8, duration: 2 },

          // Dm7 stabs
          { id: 'ft-13', pitch: 'D4', step: 16, duration: 2 },
          { id: 'ft-14', pitch: 'F4', step: 16, duration: 2 },
          { id: 'ft-15', pitch: 'A4', step: 16, duration: 2 },
          { id: 'ft-16', pitch: 'C5', step: 16, duration: 2 },

          // EbMaj7 stabs
          { id: 'ft-17', pitch: 'D#4', step: 24, duration: 3 },
          { id: 'ft-18', pitch: 'G4', step: 24, duration: 3 },
          { id: 'ft-19', pitch: 'A#4', step: 24, duration: 3 },
          { id: 'ft-20', pitch: 'D5', step: 24, duration: 3 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Funky French Slap Bass',
        type: 'bass',
        volume: 0.88,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'square',
          attack: 0.02,
          decay: 0.22,
          sustain: 0.6,
          release: 0.18,
          cutoff: 900,
          resonance: 2.8,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'ftb-1', pitch: 'A#2', step: 0, duration: 2 },
          { id: 'ftb-2', pitch: 'A#3', step: 2, duration: 1 },
          { id: 'ftb-3', pitch: 'A#2', step: 4, duration: 2 },
          { id: 'ftb-4', pitch: 'F2', step: 6, duration: 2 },
          { id: 'ftb-5', pitch: 'C2', step: 8, duration: 2 },
          { id: 'ftb-6', pitch: 'C3', step: 10, duration: 1 },
          { id: 'ftb-7', pitch: 'G2', step: 12, duration: 2 },
          { id: 'ftb-8', pitch: 'D2', step: 16, duration: 2 },
          { id: 'ftb-9', pitch: 'D3', step: 18, duration: 1 },
          { id: 'ftb-10', pitch: 'A2', step: 20, duration: 2 },
          { id: 'ftb-11', pitch: 'D#2', step: 24, duration: 3 },
          { id: 'ftb-12', pitch: 'F2', step: 28, duration: 3 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Disco Vinyl Swells',
        type: 'audio',
        volume: 0.6,
        pan: 0.15,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 12. Afrobeats Lagos Sunset
  {
    id: 'sys-afrobeats-sunset',
    name: 'Afrobeats Lagos Sunset',
    category: 'Organic & World',
    genre: 'Afrobeats / Amapiano',
    description: 'Infectious 108 BPM African polyrhythm. Cross-beat syncopated kicks, wooden rim shots, bright marimba plucks, and warm melodic bass countermelodies.',
    createdAt: 'System Built-In',
    bpm: 108,
    isSystem: true,
    eq: { bass: 3.8, mid: 1.5, treble: 2.2 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Lagos Cross-Rhythm Kit',
        type: 'drums',
        volume: 0.84,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, false, false, true, false,
            false, false, false, false, true, false, false, false,
            true, false, false, false, false, false, true, false,
            false, false, true, false, false, false, false, false
          ],
          snare: [
            false, false, false, false, true, false, false, false,
            false, false, true, false, false, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, true, false
          ],
          hihat: [
            true, false, true, true, false, true, true, false,
            true, false, true, true, false, true, true, false,
            true, false, true, true, false, true, true, false,
            true, false, true, true, false, true, true, false
          ],
          clap: [
            false, false, false, false, false, false, false, false,
            false, false, true, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            false, false, true, false, false, false, false, false
          ]
        }
      },
      {
        id: 'track-synth',
        name: 'Bright Marimba & Brass Plucks',
        type: 'synth',
        volume: 0.82,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'triangle',
          attack: 0.02,
          decay: 0.25,
          sustain: 0.45,
          release: 0.3,
          cutoff: 3200,
          resonance: 2.0,
          delayTime: 0.28,
          delayFeedback: 0.35
        },
        midiNotes: [
          // F# Maj progression
          { id: 'ab-1', pitch: 'F#4', step: 0, duration: 2 },
          { id: 'ab-2', pitch: 'A#4', step: 0, duration: 2 },
          { id: 'ab-3', pitch: 'C#5', step: 2, duration: 2 },
          { id: 'ab-4', pitch: 'F#4', step: 4, duration: 1 },
          { id: 'ab-5', pitch: 'D#5', step: 6, duration: 2 },
          { id: 'ab-6', pitch: 'A#4', step: 8, duration: 2 },
          { id: 'ab-7', pitch: 'C#5', step: 10, duration: 2 },
          { id: 'ab-8', pitch: 'G#4', step: 12, duration: 3 },
          { id: 'ab-9', pitch: 'F#4', step: 16, duration: 2 },
          { id: 'ab-10', pitch: 'A#4', step: 18, duration: 2 },
          { id: 'ab-11', pitch: 'B4', step: 20, duration: 2 },
          { id: 'ab-12', pitch: 'C#5', step: 22, duration: 2 },
          { id: 'ab-13', pitch: 'D#5', step: 26, duration: 3 },
          { id: 'ab-14', pitch: 'C#5', step: 30, duration: 2 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Melodic Afro Electric Bass',
        type: 'bass',
        volume: 0.88,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sine',
          attack: 0.04,
          decay: 0.3,
          sustain: 0.75,
          release: 0.25,
          cutoff: 480,
          resonance: 1.8,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'abb-1', pitch: 'F#2', step: 0, duration: 3 },
          { id: 'abb-2', pitch: 'F#2', step: 6, duration: 2 },
          { id: 'abb-3', pitch: 'C#3', step: 8, duration: 3 },
          { id: 'abb-4', pitch: 'D#2', step: 12, duration: 3 },
          { id: 'abb-5', pitch: 'B2', step: 16, duration: 3 },
          { id: 'abb-6', pitch: 'B2', step: 22, duration: 2 },
          { id: 'abb-7', pitch: 'C#3', step: 24, duration: 3 },
          { id: 'abb-8', pitch: 'G#2', step: 28, duration: 3 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Talking Drum & Shakers',
        type: 'audio',
        volume: 0.65,
        pan: 0.25,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 13. Hyperpop Neon Velocity
  {
    id: 'sys-hyperpop-neon',
    name: 'Hyperpop Neon Velocity',
    category: 'Electronic & Club',
    genre: 'Hyperpop / Glitch',
    description: 'Electric 155 BPM maximalist rush. Distorted punchy kick, rapid hi-hat bursts, bubblegum bright arps, and saturated gliding 808 sub.',
    createdAt: 'System Built-In',
    bpm: 155,
    isSystem: true,
    eq: { bass: 3.8, mid: 2.5, treble: 4.5 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Laser Glitch Drums',
        type: 'drums',
        volume: 0.85,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, false, false, true, false,
            false, false, true, false, false, false, false, false,
            true, false, false, false, false, false, true, false,
            false, false, false, false, true, false, false, false
          ],
          snare: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, true, true
          ],
          hihat: [
            true, true, true, true, true, true, true, true,
            true, true, true, true, true, true, true, true,
            true, true, true, true, true, true, true, true,
            true, true, true, true, true, true, true, true
          ],
          clap: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false
          ]
        }
      },
      {
        id: 'track-synth',
        name: 'Bubblegum Super-Square Lead',
        type: 'synth',
        volume: 0.8,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'square',
          attack: 0.01,
          decay: 0.18,
          sustain: 0.5,
          release: 0.15,
          cutoff: 5500,
          resonance: 4.2,
          delayTime: 0.19,
          delayFeedback: 0.35
        },
        midiNotes: [
          { id: 'hp-1', pitch: 'E5', step: 0, duration: 1 },
          { id: 'hp-2', pitch: 'G#5', step: 1, duration: 1 },
          { id: 'hp-3', pitch: 'B5', step: 2, duration: 1 },
          { id: 'hp-4', pitch: 'E5', step: 3, duration: 1 },
          { id: 'hp-5', pitch: 'D#5', step: 4, duration: 1 },
          { id: 'hp-6', pitch: 'B4', step: 5, duration: 1 },
          { id: 'hp-7', pitch: 'C#5', step: 6, duration: 2 },
          { id: 'hp-8', pitch: 'E5', step: 8, duration: 1 },
          { id: 'hp-9', pitch: 'G#5', step: 9, duration: 1 },
          { id: 'hp-10', pitch: 'B5', step: 10, duration: 1 },
          { id: 'hp-11', pitch: 'C#6', step: 12, duration: 2 },
          { id: 'hp-12', pitch: 'B5', step: 14, duration: 2 },
          { id: 'hp-13', pitch: 'G#5', step: 16, duration: 2 },
          { id: 'hp-14', pitch: 'F#5', step: 18, duration: 2 },
          { id: 'hp-15', pitch: 'E5', step: 20, duration: 4 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Saturated 808 Glide Sub',
        type: 'bass',
        volume: 0.9,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sine',
          attack: 0.01,
          decay: 0.45,
          sustain: 0.85,
          release: 0.35,
          cutoff: 500,
          resonance: 2.0,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'hpb-1', pitch: 'E2', step: 0, duration: 4 },
          { id: 'hpb-2', pitch: 'E2', step: 6, duration: 2 },
          { id: 'hpb-3', pitch: 'C#2', step: 8, duration: 4 },
          { id: 'hpb-4', pitch: 'A2', step: 16, duration: 4 },
          { id: 'hpb-5', pitch: 'B2', step: 24, duration: 4 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Vocal Stutters & Laser Fx',
        type: 'audio',
        volume: 0.7,
        pan: 0.2,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 14. Dub Roots Echo Chamber
  {
    id: 'sys-dub-reggae',
    name: 'Dub Roots Echo Chamber',
    category: 'Organic & World',
    genre: 'Dub Reggae',
    description: 'Heavy 74 BPM Kingston dub space. Heavy one-drop kick & rim on beat 3, offbeat organ skanks with tape feedback delay, and deep walking dub bass.',
    createdAt: 'System Built-In',
    bpm: 74,
    isSystem: true,
    eq: { bass: 5.0, mid: -1.0, treble: 1.0 },
    tracks: [
      {
        id: 'track-drums',
        name: 'One-Drop Kingston Kit',
        type: 'drums',
        volume: 0.82,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false
          ],
          hihat: [
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false
          ],
          clap: Array(32).fill(false)
        }
      },
      {
        id: 'track-synth',
        name: 'Offbeat Tape Skank Organ',
        type: 'synth',
        volume: 0.82,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.02,
          decay: 0.15,
          sustain: 0.35,
          release: 0.18,
          cutoff: 1950,
          resonance: 2.8,
          delayTime: 0.42, // Long dub space delay
          delayFeedback: 0.62 // Heavy tape dub repeats
        },
        midiNotes: [
          // Gm skank stabs on the offbeats
          { id: 'dub-1', pitch: 'G4', step: 2, duration: 1 },
          { id: 'dub-2', pitch: 'A#4', step: 2, duration: 1 },
          { id: 'dub-3', pitch: 'D5', step: 2, duration: 1 },

          { id: 'dub-4', pitch: 'G4', step: 6, duration: 1 },
          { id: 'dub-5', pitch: 'A#4', step: 6, duration: 1 },
          { id: 'dub-6', pitch: 'D5', step: 6, duration: 1 },

          { id: 'dub-7', pitch: 'F4', step: 10, duration: 1 },
          { id: 'dub-8', pitch: 'A4', step: 10, duration: 1 },
          { id: 'dub-9', pitch: 'C5', step: 10, duration: 1 },

          { id: 'dub-10', pitch: 'F4', step: 14, duration: 1 },
          { id: 'dub-11', pitch: 'A4', step: 14, duration: 1 },
          { id: 'dub-12', pitch: 'C5', step: 14, duration: 1 },

          { id: 'dub-13', pitch: 'D#4', step: 18, duration: 1 },
          { id: 'dub-14', pitch: 'G4', step: 18, duration: 1 },
          { id: 'dub-15', pitch: 'A#4', step: 18, duration: 1 },

          { id: 'dub-16', pitch: 'D#4', step: 22, duration: 1 },
          { id: 'dub-17', pitch: 'G4', step: 22, duration: 1 },
          { id: 'dub-18', pitch: 'A#4', step: 22, duration: 1 },

          { id: 'dub-19', pitch: 'D4', step: 26, duration: 1 },
          { id: 'dub-20', pitch: 'F#4', step: 26, duration: 1 },
          { id: 'dub-21', pitch: 'A4', step: 26, duration: 1 },

          { id: 'dub-22', pitch: 'D4', step: 30, duration: 1 },
          { id: 'dub-23', pitch: 'F#4', step: 30, duration: 1 },
          { id: 'dub-24', pitch: 'A4', step: 30, duration: 1 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Deep Walking Dub Bass',
        type: 'bass',
        volume: 0.92,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sine',
          attack: 0.06,
          decay: 0.4,
          sustain: 0.9,
          release: 0.35,
          cutoff: 280,
          resonance: 1.2,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'dubb-1', pitch: 'G2', step: 0, duration: 3 },
          { id: 'dubb-2', pitch: 'A#2', step: 4, duration: 2 },
          { id: 'dubb-3', pitch: 'D3', step: 6, duration: 2 },
          { id: 'dubb-4', pitch: 'F2', step: 8, duration: 3 },
          { id: 'dubb-5', pitch: 'A2', step: 12, duration: 2 },
          { id: 'dubb-6', pitch: 'C3', step: 14, duration: 2 },
          { id: 'dubb-7', pitch: 'D#2', step: 16, duration: 3 },
          { id: 'dubb-8', pitch: 'G2', step: 20, duration: 2 },
          { id: 'dubb-9', pitch: 'D2', step: 24, duration: 4 },
          { id: 'dubb-10', pitch: 'F#2', step: 28, duration: 3 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Spring Reverb Crashes',
        type: 'audio',
        volume: 0.65,
        pan: 0.25,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 15. Indie Dream Pop Shimmer
  {
    id: 'sys-indie-dream-pop',
    name: 'Indie Dream Pop Shimmer',
    category: 'Hip Hop & Chill',
    genre: 'Dream Pop / Indie',
    description: 'Airy 95 BPM shoegaze atmosphere. Shimmering chorus synth arps, warm driving melodic bass, and punchy acoustic-feel drums.',
    createdAt: 'System Built-In',
    bpm: 95,
    isSystem: true,
    eq: { bass: 2.0, mid: 1.2, treble: 3.0 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Punchy Indie Garage Kit',
        type: 'drums',
        volume: 0.8,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, false, false, true, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, true, false,
            false, false, false, false, false, false, false, false
          ],
          snare: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false
          ],
          hihat: [
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, true
          ],
          clap: Array(32).fill(false)
        }
      },
      {
        id: 'track-synth',
        name: 'Shimmer Chorus Pad Lead',
        type: 'synth',
        volume: 0.82,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'triangle',
          attack: 0.18,
          decay: 0.35,
          sustain: 0.7,
          release: 0.45,
          cutoff: 3400,
          resonance: 2.5,
          delayTime: 0.38,
          delayFeedback: 0.48
        },
        midiNotes: [
          // A Maj
          { id: 'dp-1', pitch: 'A4', step: 0, duration: 6 },
          { id: 'dp-2', pitch: 'C#5', step: 0, duration: 6 },
          { id: 'dp-3', pitch: 'E5', step: 0, duration: 6 },
          // F#m
          { id: 'dp-4', pitch: 'F#4', step: 8, duration: 6 },
          { id: 'dp-5', pitch: 'A4', step: 8, duration: 6 },
          { id: 'dp-6', pitch: 'C#5', step: 8, duration: 6 },
          // D Maj
          { id: 'dp-7', pitch: 'D4', step: 16, duration: 6 },
          { id: 'dp-8', pitch: 'F#4', step: 16, duration: 6 },
          { id: 'dp-9', pitch: 'A4', step: 16, duration: 6 },
          // E Maj
          { id: 'dp-10', pitch: 'E4', step: 24, duration: 6 },
          { id: 'dp-11', pitch: 'G#4', step: 24, duration: 6 },
          { id: 'dp-12', pitch: 'B4', step: 24, duration: 6 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Melodic Picked Bass',
        type: 'bass',
        volume: 0.85,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.03,
          decay: 0.28,
          sustain: 0.7,
          release: 0.22,
          cutoff: 750,
          resonance: 2.2,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'dpb-1', pitch: 'A2', step: 0, duration: 2 },
          { id: 'dpb-2', pitch: 'A2', step: 2, duration: 2 },
          { id: 'dpb-3', pitch: 'C#3', step: 4, duration: 2 },
          { id: 'dpb-4', pitch: 'E3', step: 6, duration: 2 },
          { id: 'dpb-5', pitch: 'F#2', step: 8, duration: 2 },
          { id: 'dpb-6', pitch: 'F#2', step: 10, duration: 2 },
          { id: 'dpb-7', pitch: 'A2', step: 12, duration: 2 },
          { id: 'dpb-8', pitch: 'D2', step: 16, duration: 2 },
          { id: 'dpb-9', pitch: 'D2', step: 18, duration: 2 },
          { id: 'dpb-10', pitch: 'F#2', step: 20, duration: 2 },
          { id: 'dpb-11', pitch: 'E2', step: 24, duration: 2 },
          { id: 'dpb-12', pitch: 'E2', step: 26, duration: 2 },
          { id: 'dpb-13', pitch: 'G#2', step: 28, duration: 2 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Reverb Air Ambience',
        type: 'audio',
        volume: 0.6,
        pan: 0.2,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },
  // 16. Witch House Ritual †‡†
  {
    id: 'sys-witch-house-ritual',
    name: 'Witch House Ritual †‡†',
    category: 'Witch House & Occult',
    genre: 'Witch House',
    description: 'Occult chopped & screwed 66 BPM atmosphere. Sluggish 808 sub drops, half-time dragging snare backbeats, detuned gothic supersaw chords, and eerie ghost reverse delays.',
    createdAt: 'System Built-In',
    bpm: 66,
    isSystem: true,
    eq: { bass: 5.2, mid: -2.2, treble: 1.2 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Occult 808 Trap Drag',
        type: 'drums',
        volume: 0.88,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, false, false, false, false,
            false, false, true, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, true, false, false, false, false, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, true, false
          ],
          hihat: [
            true, false, true, false, true, false, true, true,
            true, false, true, false, true, true, true, true,
            true, false, true, false, true, false, true, true,
            true, true, true, true, true, true, true, true
          ],
          clap: [
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false
          ]
        }
      },
      {
        id: 'track-synth',
        name: 'Haunted Choir Supersaw',
        type: 'synth',
        volume: 0.82,
        pan: -0.1,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.12,
          decay: 0.45,
          sustain: 0.65,
          release: 0.55,
          cutoff: 2100,
          resonance: 5.5,
          delayTime: 0.45,
          delayFeedback: 0.55
        },
        midiNotes: [
          { id: 'wh-1', pitch: 'C4', step: 0, duration: 4 },
          { id: 'wh-2', pitch: 'D#4', step: 0, duration: 4 },
          { id: 'wh-3', pitch: 'G4', step: 0, duration: 4 },
          { id: 'wh-4', pitch: 'B3', step: 4, duration: 4 },
          { id: 'wh-5', pitch: 'D4', step: 4, duration: 4 },
          { id: 'wh-6', pitch: 'G4', step: 4, duration: 4 },
          { id: 'wh-7', pitch: 'G#3', step: 8, duration: 4 },
          { id: 'wh-8', pitch: 'C4', step: 8, duration: 4 },
          { id: 'wh-9', pitch: 'D#4', step: 8, duration: 4 },
          { id: 'wh-10', pitch: 'G3', step: 12, duration: 4 },
          { id: 'wh-11', pitch: 'B3', step: 12, duration: 4 },
          { id: 'wh-12', pitch: 'D4', step: 12, duration: 4 },
          { id: 'wh-13', pitch: 'C4', step: 16, duration: 2 },
          { id: 'wh-14', pitch: 'D#4', step: 18, duration: 2 },
          { id: 'wh-15', pitch: 'F4', step: 20, duration: 2 },
          { id: 'wh-16', pitch: 'G4', step: 22, duration: 2 },
          { id: 'wh-17', pitch: 'G#4', step: 24, duration: 4 },
          { id: 'wh-18', pitch: 'G4', step: 28, duration: 4 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Monolithic Reese Sub',
        type: 'bass',
        volume: 0.95,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'square',
          attack: 0.06,
          decay: 0.4,
          sustain: 0.85,
          release: 0.35,
          cutoff: 360,
          resonance: 3.8,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'whb-1', pitch: 'C2', step: 0, duration: 6 },
          { id: 'whb-2', pitch: 'B1', step: 6, duration: 2 },
          { id: 'whb-3', pitch: 'G#1', step: 8, duration: 6 },
          { id: 'whb-4', pitch: 'G1', step: 14, duration: 2 },
          { id: 'whb-5', pitch: 'C2', step: 16, duration: 8 },
          { id: 'whb-6', pitch: 'D#2', step: 24, duration: 4 },
          { id: 'whb-7', pitch: 'D2', step: 28, duration: 4 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Eerie Crypt Vocal & Foley',
        type: 'audio',
        volume: 0.7,
        pan: 0.25,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },
  // 17. Crystal Crypt † Ethereal
  {
    id: 'sys-crystal-crypt',
    name: 'Crystal Crypt † Ethereal',
    category: 'Witch House & Occult',
    genre: 'Witch House',
    description: 'Darkwave gothic synth-punk inspired by Crystal Castles & Sidewalks and Skeletons. High-resonance minor stabs, crushed half-time 808s, and drowning spatial reverb.',
    createdAt: 'System Built-In',
    bpm: 70,
    isSystem: true,
    eq: { bass: 4.6, mid: -1.0, treble: 2.0 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Crypt Beat Machine',
        type: 'drums',
        volume: 0.86,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, false, false, false, false,
            false, false, true, false, false, false, false, false,
            true, false, false, false, false, false, true, false,
            false, false, false, false, false, false, false, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false
          ],
          hihat: [
            true, true, false, true, true, false, true, true,
            true, false, true, true, true, true, true, false,
            true, true, false, true, true, false, true, true,
            true, true, true, true, true, true, true, true
          ],
          clap: [
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, true
          ]
        }
      },
      {
        id: 'track-synth',
        name: 'Dissonant Ethereal Plucks',
        type: 'synth',
        volume: 0.8,
        pan: 0.1,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.02,
          decay: 0.3,
          sustain: 0.4,
          release: 0.35,
          cutoff: 3200,
          resonance: 6.8,
          delayTime: 0.38,
          delayFeedback: 0.48
        },
        midiNotes: [
          { id: 'cc-1', pitch: 'D4', step: 0, duration: 2 },
          { id: 'cc-2', pitch: 'F4', step: 2, duration: 2 },
          { id: 'cc-3', pitch: 'A4', step: 4, duration: 2 },
          { id: 'cc-4', pitch: 'G#4', step: 6, duration: 2 },
          { id: 'cc-5', pitch: 'F4', step: 8, duration: 2 },
          { id: 'cc-6', pitch: 'D4', step: 10, duration: 2 },
          { id: 'cc-7', pitch: 'D#4', step: 12, duration: 2 },
          { id: 'cc-8', pitch: 'C#4', step: 14, duration: 2 },
          { id: 'cc-9', pitch: 'D4', step: 16, duration: 2 },
          { id: 'cc-10', pitch: 'F4', step: 18, duration: 2 },
          { id: 'cc-11', pitch: 'A4', step: 20, duration: 2 },
          { id: 'cc-12', pitch: 'D5', step: 22, duration: 2 },
          { id: 'cc-13', pitch: 'C5', step: 24, duration: 2 },
          { id: 'cc-14', pitch: 'A#4', step: 26, duration: 2 },
          { id: 'cc-15', pitch: 'A4', step: 28, duration: 4 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Distorted 808 Drive',
        type: 'bass',
        volume: 0.92,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.04,
          decay: 0.35,
          sustain: 0.8,
          release: 0.25,
          cutoff: 420,
          resonance: 4.2,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'ccb-1', pitch: 'D2', step: 0, duration: 6 },
          { id: 'ccb-2', pitch: 'D#2', step: 6, duration: 2 },
          { id: 'ccb-3', pitch: 'D2', step: 8, duration: 4 },
          { id: 'ccb-4', pitch: 'G#2', step: 12, duration: 4 },
          { id: 'ccb-5', pitch: 'D2', step: 16, duration: 6 },
          { id: 'ccb-6', pitch: 'F2', step: 22, duration: 2 },
          { id: 'ccb-7', pitch: 'D#2', step: 24, duration: 4 },
          { id: 'ccb-8', pitch: 'C#2', step: 28, duration: 4 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Industrial Reverb Chamber',
        type: 'audio',
        volume: 0.65,
        pan: -0.2,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 18. Industrial Cyber-Grind
  {
    id: 'sys-industrial-cyber-grind',
    name: 'Industrial Cyber-Grind',
    category: 'Bass & Breaks',
    genre: 'Industrial / EBM',
    description: 'Brutal 136 BPM industrial machine. Distorted 4-on-floor kicks, metallic resonant synth leads, abrasive feedback delay, and grinding saw sub-bass.',
    createdAt: 'System Built-In',
    bpm: 136,
    isSystem: true,
    eq: { bass: 4.8, mid: 2.5, treble: 3.0 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Industrial Hammer Kit',
        type: 'drums',
        volume: 0.9,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, true
          ],
          snare: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, true, false
          ],
          hihat: [
            true, true, false, true, true, true, false, true,
            true, true, false, true, true, true, false, true,
            true, true, false, true, true, true, false, true,
            true, true, false, true, true, true, true, true
          ],
          clap: [
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false
          ]
        }
      },
      {
        id: 'track-synth',
        name: 'Metallic Saw Stab',
        type: 'synth',
        volume: 0.85,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.01,
          decay: 0.18,
          sustain: 0.25,
          release: 0.2,
          cutoff: 4200,
          resonance: 5.5,
          delayTime: 0.22,
          delayFeedback: 0.48
        },
        midiNotes: [
          { id: 'ind-1', pitch: 'D4', step: 0, duration: 1 },
          { id: 'ind-2', pitch: 'D4', step: 3, duration: 1 },
          { id: 'ind-3', pitch: 'F4', step: 6, duration: 2 },
          { id: 'ind-4', pitch: 'G#4', step: 8, duration: 2 },
          { id: 'ind-5', pitch: 'D4', step: 12, duration: 1 },
          { id: 'ind-6', pitch: 'D4', step: 14, duration: 1 },
          { id: 'ind-7', pitch: 'D4', step: 16, duration: 1 },
          { id: 'ind-8', pitch: 'D4', step: 19, duration: 1 },
          { id: 'ind-9', pitch: 'A#4', step: 22, duration: 2 },
          { id: 'ind-10', pitch: 'A4', step: 24, duration: 2 },
          { id: 'ind-11', pitch: 'G#4', step: 28, duration: 2 },
          { id: 'ind-12', pitch: 'F4', step: 30, duration: 2 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Grinding Saw Bassline',
        type: 'bass',
        volume: 0.9,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.02,
          decay: 0.25,
          sustain: 0.7,
          release: 0.2,
          cutoff: 950,
          resonance: 6.0,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'indb-1', pitch: 'D2', step: 0, duration: 2 },
          { id: 'indb-2', pitch: 'D2', step: 2, duration: 2 },
          { id: 'indb-3', pitch: 'D2', step: 4, duration: 2 },
          { id: 'indb-4', pitch: 'D2', step: 6, duration: 2 },
          { id: 'indb-5', pitch: 'F2', step: 8, duration: 2 },
          { id: 'indb-6', pitch: 'F2', step: 10, duration: 2 },
          { id: 'indb-7', pitch: 'D2', step: 12, duration: 4 },
          { id: 'indb-8', pitch: 'D2', step: 16, duration: 2 },
          { id: 'indb-9', pitch: 'D2', step: 18, duration: 2 },
          { id: 'indb-10', pitch: 'G#2', step: 20, duration: 2 },
          { id: 'indb-11', pitch: 'G#2', step: 22, duration: 2 },
          { id: 'indb-12', pitch: 'A2', step: 24, duration: 4 },
          { id: 'indb-13', pitch: 'D2', step: 28, duration: 4 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Anvil Stems & Feedback',
        type: 'audio',
        volume: 0.7,
        pan: 0.1,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // 19. Glitch IDM Artifact
  {
    id: 'sys-glitch-idm-artifact',
    name: 'Glitch IDM Artifact',
    category: 'Electronic & Club',
    genre: 'Glitch / IDM',
    description: 'Complex 140 BPM syncopated glitch rhythms, rapid-fire hihat bursts, micro-pitched square blips, and resonant filter modulation.',
    createdAt: 'System Built-In',
    bpm: 140,
    isSystem: true,
    eq: { bass: 3.5, mid: 2.0, treble: 4.0 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Fractal Micro-Glitch Kit',
        type: 'drums',
        volume: 0.85,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, true, false, false, true, false,
            false, true, false, false, true, false, false, false,
            true, false, false, false, false, true, false, false,
            false, false, true, false, false, true, false, true
          ],
          snare: [
            false, false, false, false, true, false, false, true,
            false, false, true, false, false, false, false, true,
            false, false, false, false, true, false, false, false,
            false, true, false, true, false, false, true, false
          ],
          hihat: [
            true, true, true, false, true, true, true, true,
            false, true, true, true, true, false, true, true,
            true, true, false, true, true, true, true, false,
            true, true, true, true, true, true, false, true
          ],
          clap: [
            false, false, false, false, false, false, false, false,
            false, false, false, false, true, false, false, false,
            false, false, false, false, false, false, false, false,
            false, false, false, false, true, false, true, false
          ]
        }
      },
      {
        id: 'track-synth',
        name: 'Granular Square Blip',
        type: 'synth',
        volume: 0.8,
        pan: -0.2,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'square',
          attack: 0.005,
          decay: 0.12,
          sustain: 0.2,
          release: 0.15,
          cutoff: 4800,
          resonance: 6.5,
          delayTime: 0.187,
          delayFeedback: 0.55
        },
        midiNotes: [
          { id: 'gli-1', pitch: 'C5', step: 1, duration: 1 },
          { id: 'gli-2', pitch: 'D#5', step: 3, duration: 1 },
          { id: 'gli-3', pitch: 'G5', step: 5, duration: 1 },
          { id: 'gli-4', pitch: 'A#5', step: 7, duration: 1 },
          { id: 'gli-5', pitch: 'F5', step: 10, duration: 1 },
          { id: 'gli-6', pitch: 'C#5', step: 13, duration: 1 },
          { id: 'gli-7', pitch: 'C5', step: 15, duration: 1 },
          { id: 'gli-8', pitch: 'D#5', step: 18, duration: 1 },
          { id: 'gli-9', pitch: 'G#5', step: 21, duration: 1 },
          { id: 'gli-10', pitch: 'G5', step: 23, duration: 1 },
          { id: 'gli-11', pitch: 'D5', step: 26, duration: 1 },
          { id: 'gli-12', pitch: 'F5', step: 29, duration: 1 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Distorted Neuro Sub',
        type: 'bass',
        volume: 0.88,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.01,
          decay: 0.3,
          sustain: 0.8,
          release: 0.25,
          cutoff: 750,
          resonance: 5.0,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'glib-1', pitch: 'C2', step: 0, duration: 3 },
          { id: 'glib-2', pitch: 'C2', step: 6, duration: 2 },
          { id: 'glib-3', pitch: 'D#2', step: 9, duration: 3 },
          { id: 'glib-4', pitch: 'F2', step: 12, duration: 2 },
          { id: 'glib-5', pitch: 'C2', step: 16, duration: 3 },
          { id: 'glib-6', pitch: 'G#1', step: 21, duration: 3 },
          { id: 'glib-7', pitch: 'A#1', step: 26, duration: 2 },
          { id: 'glib-8', pitch: 'C2', step: 29, duration: 3 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Buffer Glitch Loops',
        type: 'audio',
        volume: 0.65,
        pan: 0.25,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  }
];
