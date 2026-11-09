import { PresetTemplate } from '../types';

export interface DarkSubGenreMeta {
  id: string;
  name: string;
  tag: string;
  icon: string;
  bpmRange: string;
  aesthetic: string;
  color: string;
  accentBg: string;
  borderAccent: string;
  description: string;
}

export const DARK_SUB_GENRES: DarkSubGenreMeta[] = [
  {
    id: 'underground-industrial',
    name: 'Underground Industrial',
    tag: 'IND-EBM',
    icon: '⚡',
    bpmRange: '134–140 BPM',
    aesthetic: 'Metallic Anvil Percussion • Grinding Sawtooth • Overdriven 4/4 Kick',
    color: '#00f0ff',
    accentBg: 'rgba(0, 240, 255, 0.1)',
    borderAccent: 'rgba(0, 240, 255, 0.35)',
    description: 'Abrasive machine-shop aesthetics, distorted concrete warehouse kicks, 16th-note industrial basslines, and harsh resonant modular stabs.'
  },
  {
    id: 'horrorcore',
    name: 'Horrorcore',
    tag: 'CRYPT-666',
    icon: '💀',
    bpmRange: '128–132 BPM',
    aesthetic: 'Tritone Bells • Saturated Tape Sub • Ominous Horror Chants',
    color: '#ff0055',
    accentBg: 'rgba(255, 0, 85, 0.12)',
    borderAccent: 'rgba(255, 0, 85, 0.4)',
    description: 'Morbid, cinematic horror atmosphere with detuned music-box tones, dissonant minor chords, crushing low-end bass, and eerie tape decay.'
  },
  {
    id: 'memphis-phonk',
    name: 'Memphis Phonk',
    tag: 'PHONK-93',
    icon: '🏎️',
    bpmRange: '142–146 BPM',
    aesthetic: 'Distorted 808 Cowbell • Slithering 808 Glide • Dusty Cassette Stems',
    color: '#d946ef',
    accentBg: 'rgba(217, 70, 239, 0.12)',
    borderAccent: 'rgba(217, 70, 239, 0.4)',
    description: 'Classic 1993 Memphis cassette tape grit with unmistakable pitched cowbell stabs, hard-hitting syncopated hi-hats, and blown-out 808 sub drops.'
  },
  {
    id: 'witch-hop',
    name: 'Witch Hop',
    tag: '† WITCH-HOP †',
    icon: '†',
    bpmRange: '110–118 BPM',
    aesthetic: 'Chopped Occult Vocal Stabs • Subterranean Sub • Salem Reverb Void',
    color: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.15)',
    borderAccent: 'rgba(168, 85, 247, 0.45)',
    description: 'Slowed, demonic hip-hop mutation steeped in occult ritualism, cavernous reverb, pitched-down snare snaps, and dragging darkwave rhythms.'
  },
  {
    id: 'dungeon-trap',
    name: 'Dungeon Trap',
    tag: 'DNGN-SYNTH',
    icon: '🏰',
    bpmRange: '122–128 BPM',
    aesthetic: '90s RPG Flutes • Lo-Fi Medieval Bells • Rumbling Dungeon 808',
    color: '#32ff7e',
    accentBg: 'rgba(50, 255, 126, 0.1)',
    borderAccent: 'rgba(50, 255, 126, 0.35)',
    description: 'Old-school fantasy dungeon synth keyboards fused with aggressive modern 808 trap sequencing, torches in the dark, and crypt ambience.'
  },
  {
    id: 'dark-sigilcore',
    name: 'Dark Sigilcore',
    tag: 'SIGIL-HEX',
    icon: '🩸',
    bpmRange: '158–168 BPM',
    aesthetic: 'Bitcrushed Fast Arps • Hyper-Speed Hihats • Distorted Void 808',
    color: '#f59e0b',
    accentBg: 'rgba(245, 158, 11, 0.12)',
    borderAccent: 'rgba(245, 158, 11, 0.4)',
    description: 'Frantic online vampire aesthetic, hyperspeed 16th-note hat rolls, squealing high-resonance synth plucks, and clipped cyber-demonic textures.'
  },
  {
    id: 'metalstep',
    name: 'Metalstep',
    tag: 'DJENT-STEP',
    icon: '🎸',
    bpmRange: '140 BPM',
    aesthetic: 'Chug Saw Breakdown • Half-Time Half-Step Drop • Seismic Sub Earthquake',
    color: '#ef4444',
    accentBg: 'rgba(239, 68, 68, 0.15)',
    borderAccent: 'rgba(239, 68, 68, 0.45)',
    description: 'Bone-snapping fusion of heavy metal djent guitar chugs via brutalized sawtooth filters, industrial percussion, and monstrous sub-bass breakdowns.'
  }
];

export const DARK_PRESETS: PresetTemplate[] = [
  // ==========================================
  // 1. UNDERGROUND INDUSTRIAL PRESETS
  // ==========================================
  {
    id: 'sys-industrial-cyber-grind',
    name: 'Cyber-Grind Factory 808',
    category: 'Underground Industrial',
    genre: 'Underground Industrial',
    description: '136 BPM brutal machine rhythm. Distorted 4-on-floor kicks, metallic resonant synth leads, abrasive feedback delay, and grinding saw sub-bass.',
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
        color: '#00f0ff',
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
        color: '#00f0ff',
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
  {
    id: 'sys-industrial-darkwave-concrete',
    name: 'Concrete Bunker EBM',
    category: 'Underground Industrial',
    genre: 'Underground Industrial',
    description: '138 BPM high-voltage EBM march. Pounding syncopated kick/clap, analog filter sweeps, and cold industrial rhythm.',
    createdAt: 'System Built-In',
    bpm: 138,
    isSystem: true,
    eq: { bass: 5.0, mid: 1.5, treble: 3.5 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Klang Concrete Kit',
        type: 'drums',
        volume: 0.88,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#00f0ff',
        drumState: {
          kick: [
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, true, false
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
        name: 'Cold Industrial Lead',
        type: 'synth',
        volume: 0.8,
        pan: 0.1,
        muted: false,
        soloed: false,
        color: '#00f0ff',
        synthConfig: {
          oscillator: 'square',
          attack: 0.02,
          decay: 0.22,
          sustain: 0.3,
          release: 0.15,
          cutoff: 3200,
          resonance: 4.8,
          delayTime: 0.3,
          delayFeedback: 0.4
        },
        midiNotes: [
          { id: 'ind2-1', pitch: 'E4', step: 2, duration: 2 },
          { id: 'ind2-2', pitch: 'G4', step: 6, duration: 2 },
          { id: 'ind2-3', pitch: 'B4', step: 10, duration: 2 },
          { id: 'ind2-4', pitch: 'A#4', step: 14, duration: 2 },
          { id: 'ind2-5', pitch: 'E4', step: 18, duration: 2 },
          { id: 'ind2-6', pitch: 'G4', step: 22, duration: 2 },
          { id: 'ind2-7', pitch: 'F#4', step: 26, duration: 4 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Rolling EBM Bass',
        type: 'bass',
        volume: 0.92,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.01,
          decay: 0.15,
          sustain: 0.5,
          release: 0.1,
          cutoff: 1100,
          resonance: 5.0,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'ind2b-1', pitch: 'E2', step: 0, duration: 1 },
          { id: 'ind2b-2', pitch: 'E2', step: 2, duration: 1 },
          { id: 'ind2b-3', pitch: 'E2', step: 4, duration: 1 },
          { id: 'ind2b-4', pitch: 'E2', step: 6, duration: 1 },
          { id: 'ind2b-5', pitch: 'G2', step: 8, duration: 1 },
          { id: 'ind2b-6', pitch: 'G2', step: 10, duration: 1 },
          { id: 'ind2b-7', pitch: 'E2', step: 12, duration: 2 },
          { id: 'ind2b-8', pitch: 'E2', step: 16, duration: 1 },
          { id: 'ind2b-9', pitch: 'E2', step: 18, duration: 1 },
          { id: 'ind2b-10', pitch: 'A#1', step: 20, duration: 2 },
          { id: 'ind2b-11', pitch: 'B1', step: 24, duration: 2 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Factory Drone',
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

  // ==========================================
  // 2. HORRORCORE PRESETS
  // ==========================================
  {
    id: 'sys-horrorcore-crypt-666',
    name: 'Necropolis 666 Tape',
    category: 'Horrorcore',
    genre: 'Horrorcore',
    description: '130 BPM ominous horrorcore beat. Tritone bells, saturated tape 808 sub, eerie minor progressions, and slithering hi-hats.',
    createdAt: 'System Built-In',
    bpm: 130,
    isSystem: true,
    eq: { bass: 5.2, mid: -0.5, treble: 2.2 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Graveyard 808 Kit',
        type: 'drums',
        volume: 0.88,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#ff0055',
        drumState: {
          kick: [
            true, false, false, false, false, false, false, false,
            false, false, true, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, true, false, false, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false
          ],
          hihat: [
            true, false, true, false, true, false, true, true,
            true, false, true, false, true, true, true, false,
            true, false, true, false, true, false, true, true,
            true, true, true, false, true, false, true, true
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
        name: 'Tritone Funeral Bells',
        type: 'synth',
        volume: 0.82,
        pan: -0.2,
        muted: false,
        soloed: false,
        color: '#ff0055',
        synthConfig: {
          oscillator: 'triangle',
          attack: 0.01,
          decay: 0.6,
          sustain: 0.1,
          release: 0.8,
          cutoff: 2100,
          resonance: 3.5,
          delayTime: 0.46,
          delayFeedback: 0.55
        },
        midiNotes: [
          { id: 'hor-1', pitch: 'C5', step: 0, duration: 4 },
          { id: 'hor-2', pitch: 'F#4', step: 4, duration: 4 },
          { id: 'hor-3', pitch: 'C5', step: 8, duration: 4 },
          { id: 'hor-4', pitch: 'F#4', step: 12, duration: 4 },
          { id: 'hor-5', pitch: 'D#5', step: 16, duration: 4 },
          { id: 'hor-6', pitch: 'A4', step: 20, duration: 4 },
          { id: 'hor-7', pitch: 'D5', step: 24, duration: 4 },
          { id: 'hor-8', pitch: 'G#4', step: 28, duration: 4 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Distorted 808 Crypt Sub',
        type: 'bass',
        volume: 0.95,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sine',
          attack: 0.01,
          decay: 0.5,
          sustain: 0.9,
          release: 0.4,
          cutoff: 400,
          resonance: 2.5,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'horb-1', pitch: 'C2', step: 0, duration: 8 },
          { id: 'horb-2', pitch: 'C2', step: 10, duration: 6 },
          { id: 'horb-3', pitch: 'F#1', step: 16, duration: 8 },
          { id: 'horb-4', pitch: 'G#1', step: 24, duration: 4 },
          { id: 'horb-5', pitch: 'C2', step: 28, duration: 4 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Horror Ambiance FX',
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

  // ==========================================
  // 3. MEMPHIS PHONK PRESETS
  // ==========================================
  {
    id: 'sys-memphis-phonk-drift',
    name: 'Devil Shyt 1993 Cowbell',
    category: 'Memphis Phonk',
    genre: 'Memphis Phonk',
    description: '144 BPM hard drift phonk. Piercing 808 cowbell leads, heavily saturated sub glide, swung cassette hats, and classic Memphis bounce.',
    createdAt: 'System Built-In',
    bpm: 144,
    isSystem: true,
    eq: { bass: 5.5, mid: 2.0, treble: 1.5 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Tape 808 Memphis Kit',
        type: 'drums',
        volume: 0.9,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#d946ef',
        drumState: {
          kick: [
            true, false, false, false, false, false, true, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, true, false,
            false, false, true, false, false, false, false, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false
          ],
          hihat: [
            true, false, true, true, false, true, true, false,
            true, false, true, true, true, true, false, true,
            true, false, true, true, false, true, true, false,
            true, true, true, true, true, false, true, true
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
        name: 'Memphis 808 Cowbell',
        type: 'synth',
        volume: 0.88,
        pan: -0.1,
        muted: false,
        soloed: false,
        color: '#d946ef',
        synthConfig: {
          oscillator: 'square',
          attack: 0.005,
          decay: 0.25,
          sustain: 0.15,
          release: 0.18,
          cutoff: 3800,
          resonance: 4.5,
          delayTime: 0.208,
          delayFeedback: 0.42
        },
        midiNotes: [
          { id: 'phk-1', pitch: 'F#4', step: 0, duration: 2 },
          { id: 'phk-2', pitch: 'A4', step: 3, duration: 2 },
          { id: 'phk-3', pitch: 'B4', step: 6, duration: 2 },
          { id: 'phk-4', pitch: 'C#5', step: 8, duration: 3 },
          { id: 'phk-5', pitch: 'B4', step: 12, duration: 2 },
          { id: 'phk-6', pitch: 'A4', step: 14, duration: 2 },
          { id: 'phk-7', pitch: 'F#4', step: 16, duration: 2 },
          { id: 'phk-8', pitch: 'A4', step: 19, duration: 2 },
          { id: 'phk-9', pitch: 'D5', step: 22, duration: 2 },
          { id: 'phk-10', pitch: 'C#5', step: 24, duration: 3 },
          { id: 'phk-11', pitch: 'B4', step: 28, duration: 2 },
          { id: 'phk-12', pitch: 'A4', step: 30, duration: 2 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Saturated Memphis 808',
        type: 'bass',
        volume: 0.94,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sine',
          attack: 0.01,
          decay: 0.6,
          sustain: 0.85,
          release: 0.3,
          cutoff: 480,
          resonance: 3.2,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'phkb-1', pitch: 'F#1', step: 0, duration: 6 },
          { id: 'phkb-2', pitch: 'F#1', step: 6, duration: 8 },
          { id: 'phkb-3', pitch: 'F#1', step: 16, duration: 6 },
          { id: 'phkb-4', pitch: 'A1', step: 22, duration: 4 },
          { id: 'phkb-5', pitch: 'E1', step: 26, duration: 6 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Tape Vocals Chops',
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

  // ==========================================
  // 4. WITCH HOP PRESETS
  // ==========================================
  {
    id: 'sys-witch-hop-ritual',
    name: 'Grave Digger † Salem Hop',
    category: 'Witch Hop',
    genre: 'Witch Hop',
    description: '112 BPM occult subterranean hop. Dragging hi-hats, pitched-down snare crack, dark detuned synth pads, and crushing 808 depths.',
    createdAt: 'System Built-In',
    bpm: 112,
    isSystem: true,
    eq: { bass: 5.0, mid: -1.0, treble: 1.8 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Salem Drag Kit',
        type: 'drums',
        volume: 0.86,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#a855f7',
        drumState: {
          kick: [
            true, false, false, false, false, false, false, false,
            false, false, true, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, true, false, false, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false
          ],
          hihat: [
            true, false, true, false, true, false, true, true,
            false, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, true,
            false, true, true, false, true, false, true, true
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
        name: 'Detuned Salem Lead',
        type: 'synth',
        volume: 0.8,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.08,
          decay: 0.45,
          sustain: 0.5,
          release: 0.6,
          cutoff: 1800,
          resonance: 3.8,
          delayTime: 0.4,
          delayFeedback: 0.55
        },
        midiNotes: [
          { id: 'wth-1', pitch: 'D4', step: 0, duration: 6 },
          { id: 'wth-2', pitch: 'F4', step: 6, duration: 2 },
          { id: 'wth-3', pitch: 'G#4', step: 8, duration: 4 },
          { id: 'wth-4', pitch: 'A4', step: 12, duration: 4 },
          { id: 'wth-5', pitch: 'F4', step: 16, duration: 6 },
          { id: 'wth-6', pitch: 'D#4', step: 22, duration: 2 },
          { id: 'wth-7', pitch: 'D4', step: 24, duration: 8 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Underground Occult Sub',
        type: 'bass',
        volume: 0.92,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sine',
          attack: 0.03,
          decay: 0.5,
          sustain: 0.85,
          release: 0.4,
          cutoff: 350,
          resonance: 2.0,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'wthb-1', pitch: 'D2', step: 0, duration: 8 },
          { id: 'wthb-2', pitch: 'D2', step: 10, duration: 6 },
          { id: 'wthb-3', pitch: 'G#1', step: 16, duration: 8 },
          { id: 'wthb-4', pitch: 'A#1', step: 24, duration: 4 },
          { id: 'wthb-5', pitch: 'D2', step: 28, duration: 4 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Occult Crypt Choir',
        type: 'audio',
        volume: 0.65,
        pan: 0.3,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  },

  // ==========================================
  // 5. DUNGEON TRAP PRESETS
  // ==========================================
  {
    id: 'sys-dungeon-trap-crypt',
    name: 'Catacomb Torch 808',
    category: 'Dungeon Trap',
    genre: 'Dungeon Trap',
    description: '124 BPM fantasy dungeon trap. 90s RPG square-lead melodies, torchlit reverb, snappy hard trap claps, and cavernous 808s.',
    createdAt: 'System Built-In',
    bpm: 124,
    isSystem: true,
    eq: { bass: 4.5, mid: 1.0, treble: 2.0 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Catacomb Trap Kit',
        type: 'drums',
        volume: 0.88,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#32ff7e',
        drumState: {
          kick: [
            true, false, false, false, false, false, false, false,
            false, false, true, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, true, false, false, true
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false
          ],
          hihat: [
            true, false, true, false, true, false, true, true,
            true, false, true, false, true, false, true, false,
            true, false, true, false, true, false, true, true,
            true, false, true, true, true, false, true, false
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
        name: 'Dungeon 16-Bit Flute',
        type: 'synth',
        volume: 0.82,
        pan: -0.1,
        muted: false,
        soloed: false,
        color: '#32ff7e',
        synthConfig: {
          oscillator: 'square',
          attack: 0.05,
          decay: 0.35,
          sustain: 0.4,
          release: 0.35,
          cutoff: 2400,
          resonance: 4.0,
          delayTime: 0.36,
          delayFeedback: 0.45
        },
        midiNotes: [
          { id: 'dng-1', pitch: 'A4', step: 0, duration: 4 },
          { id: 'dng-2', pitch: 'C5', step: 4, duration: 2 },
          { id: 'dng-3', pitch: 'E5', step: 6, duration: 2 },
          { id: 'dng-4', pitch: 'D5', step: 8, duration: 4 },
          { id: 'dng-5', pitch: 'C5', step: 12, duration: 2 },
          { id: 'dng-6', pitch: 'B4', step: 14, duration: 2 },
          { id: 'dng-7', pitch: 'A4', step: 16, duration: 4 },
          { id: 'dng-8', pitch: 'G#4', step: 20, duration: 4 },
          { id: 'dng-9', pitch: 'A4', step: 24, duration: 8 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Cavernous Trap 808',
        type: 'bass',
        volume: 0.92,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sine',
          attack: 0.01,
          decay: 0.55,
          sustain: 0.8,
          release: 0.3,
          cutoff: 420,
          resonance: 2.2,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'dngb-1', pitch: 'A1', step: 0, duration: 8 },
          { id: 'dngb-2', pitch: 'A1', step: 10, duration: 6 },
          { id: 'dngb-3', pitch: 'F1', step: 16, duration: 8 },
          { id: 'dngb-4', pitch: 'E1', step: 24, duration: 8 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Torchlight Ambience',
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

  // ==========================================
  // 6. DARK SIGILCORE PRESETS
  // ==========================================
  {
    id: 'sys-dark-sigilcore-accelerant',
    name: 'Vampiric Bit-Crush Sigil',
    category: 'Dark Sigilcore',
    genre: 'Dark Sigilcore',
    description: '162 BPM cyber-vampire frenzy. Frantic 16th-note hat bursts, screaming resonant arpeggios, and blown-out clipping 808 sub.',
    createdAt: 'System Built-In',
    bpm: 162,
    isSystem: true,
    eq: { bass: 4.2, mid: 2.8, treble: 4.5 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Sigilcore Rapid Kit',
        type: 'drums',
        volume: 0.85,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#f59e0b',
        drumState: {
          kick: [
            true, false, false, false, false, false, true, false,
            false, true, false, false, false, false, false, false,
            true, false, false, false, false, false, true, false,
            false, false, true, false, false, true, false, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false
          ],
          hihat: [
            true, true, true, true, true, true, true, true,
            true, true, true, true, true, true, true, true,
            true, true, true, true, true, true, true, true,
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
        name: 'Bitcrush Sigil Pluck',
        type: 'synth',
        volume: 0.82,
        pan: -0.15,
        muted: false,
        soloed: false,
        color: '#f59e0b',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.005,
          decay: 0.15,
          sustain: 0.2,
          release: 0.1,
          cutoff: 5200,
          resonance: 6.8,
          delayTime: 0.185,
          delayFeedback: 0.52
        },
        midiNotes: [
          { id: 'sig-1', pitch: 'C#5', step: 0, duration: 1 },
          { id: 'sig-2', pitch: 'E5', step: 2, duration: 1 },
          { id: 'sig-3', pitch: 'G#5', step: 4, duration: 1 },
          { id: 'sig-4', pitch: 'C#6', step: 6, duration: 1 },
          { id: 'sig-5', pitch: 'B5', step: 8, duration: 1 },
          { id: 'sig-6', pitch: 'G#5', step: 10, duration: 1 },
          { id: 'sig-7', pitch: 'E5', step: 12, duration: 1 },
          { id: 'sig-8', pitch: 'C#5', step: 14, duration: 1 },
          { id: 'sig-9', pitch: 'D5', step: 16, duration: 1 },
          { id: 'sig-10', pitch: 'F#5', step: 18, duration: 1 },
          { id: 'sig-11', pitch: 'A5', step: 20, duration: 1 },
          { id: 'sig-12', pitch: 'D6', step: 22, duration: 1 },
          { id: 'sig-13', pitch: 'C#6', step: 24, duration: 2 },
          { id: 'sig-14', pitch: 'A5', step: 28, duration: 2 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Blown-Out 808 Sigil Sub',
        type: 'bass',
        volume: 0.92,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sine',
          attack: 0.01,
          decay: 0.45,
          sustain: 0.8,
          release: 0.25,
          cutoff: 600,
          resonance: 4.0,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'sigb-1', pitch: 'C#2', step: 0, duration: 6 },
          { id: 'sigb-2', pitch: 'C#2', step: 6, duration: 8 },
          { id: 'sigb-3', pitch: 'D2', step: 16, duration: 6 },
          { id: 'sigb-4', pitch: 'D2', step: 22, duration: 6 },
          { id: 'sigb-5', pitch: 'B1', step: 28, duration: 4 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Bitcrush Glitch Stems',
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

  // ==========================================
  // 7. METALSTEP PRESETS
  // ==========================================
  {
    id: 'sys-metalstep-breakdown',
    name: 'Djent Core 808 Breakdown',
    category: 'Metalstep',
    genre: 'Metalstep',
    description: '140 BPM bone-crushing half-time breakdown. Djent guitar-style saw chugs, anvil drop snare on beat 3, and seismic sub bass earthquake.',
    createdAt: 'System Built-In',
    bpm: 140,
    isSystem: true,
    eq: { bass: 5.6, mid: 2.2, treble: 3.2 },
    tracks: [
      {
        id: 'track-drums',
        name: 'Heavy Metalstep Kit',
        type: 'drums',
        volume: 0.92,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#ef4444',
        drumState: {
          kick: [
            true, false, false, true, false, false, true, false,
            false, false, false, false, false, false, false, false,
            true, false, true, false, false, false, false, true,
            false, false, true, false, false, false, true, false
          ],
          snare: [
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false, false,
            true, false, false, false, false, false, false, false
          ],
          hihat: [
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, false,
            false, false, true, false, false, false, true, true
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
        name: 'Djent Guitar Chug Synth',
        type: 'synth',
        volume: 0.88,
        pan: -0.1,
        muted: false,
        soloed: false,
        color: '#ef4444',
        synthConfig: {
          oscillator: 'sawtooth',
          attack: 0.005,
          decay: 0.14,
          sustain: 0.2,
          release: 0.12,
          cutoff: 3900,
          resonance: 6.0,
          delayTime: 0.25,
          delayFeedback: 0.38
        },
        midiNotes: [
          // Polyrhythmic metal breakdown chugs (Drop D / low D)
          { id: 'met-1', pitch: 'D3', step: 0, duration: 1 },
          { id: 'met-2', pitch: 'D3', step: 3, duration: 1 },
          { id: 'met-3', pitch: 'D3', step: 6, duration: 1 },
          { id: 'met-4', pitch: 'D#3', step: 10, duration: 2 },
          { id: 'met-5', pitch: 'D3', step: 16, duration: 1 },
          { id: 'met-6', pitch: 'D3', step: 18, duration: 1 },
          { id: 'met-7', pitch: 'D3', step: 23, duration: 1 },
          { id: 'met-8', pitch: 'F3', step: 26, duration: 2 },
          { id: 'met-9', pitch: 'G#3', step: 30, duration: 2 }
        ]
      },
      {
        id: 'track-bass',
        name: 'Earthquake Drop Sub',
        type: 'bass',
        volume: 0.96,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: {
          oscillator: 'sine',
          attack: 0.01,
          decay: 0.6,
          sustain: 0.9,
          release: 0.35,
          cutoff: 450,
          resonance: 3.5,
          delayTime: 0.0,
          delayFeedback: 0.0
        },
        midiNotes: [
          { id: 'metb-1', pitch: 'D1', step: 0, duration: 8 },
          { id: 'metb-2', pitch: 'D#1', step: 10, duration: 6 },
          { id: 'metb-3', pitch: 'D1', step: 16, duration: 10 },
          { id: 'metb-4', pitch: 'F1', step: 26, duration: 4 },
          { id: 'metb-5', pitch: 'G#1', step: 30, duration: 2 }
        ]
      },
      {
        id: 'track-audio',
        name: 'Industrial Metal Noise FX',
        type: 'audio',
        volume: 0.7,
        pan: 0.2,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ]
  }
];
