import React, { useState, useEffect } from 'react';
import { 
  Sliders, Plus, Trash2, Power, Download, Upload, Link2, HelpCircle, 
  Sparkles, Code, Music, Play, Layers, Check, RefreshCw, Bookmark,
  BookmarkPlus, Save, Volume2, ArrowDownToLine, Tag, Clock, ChevronRight, X,
  ExternalLink, Search, Copy, Zap
} from 'lucide-react';
import { VstPlugin, VstParameter, Track, SynthConfig, MidiNote, DrumTrackState, UserSynthPreset } from '../types';
import { audioEngine } from '../services/audioEngine';

interface VstPresetManagerProps {
  activeTrack: Track;
  tracks: Track[];
  onUpdateTrackVsts: (trackId: string, vsts: VstPlugin[]) => void;
  onUpdateSynthConfig: (trackId: string, config: SynthConfig) => void;
  onUpdateMidiNotes: (trackId: string, notes: MidiNote[]) => void;
  onUpdateDrumState: (trackId: string, drumState: DrumTrackState) => void;
  onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  onOpenVstLinks?: () => void;
}

const LOCAL_STORAGE_USER_SYNTH_PRESETS = 'lyria_user_synth_presets';

export interface VstDirectoryItem {
  id: string;
  name: string;
  developer: string;
  category: 'synth' | 'effect' | 'sampler' | 'database' | 'webaudio';
  format: string;
  license: string;
  url: string;
  description: string;
  bestFor: string;
  injectable?: {
    name: string;
    paramName: string;
    paramVal: string;
    code: string;
  };
}

export const VST_DIRECTORY: VstDirectoryItem[] = [
  {
    id: 'surge-xt',
    name: 'Surge XT',
    developer: 'Surge Synth Team',
    category: 'synth',
    format: 'VST3 / AU / CLAP (Win/Mac/Linux)',
    license: 'GPL v3 Open Source',
    url: 'https://surge-synth-team.org',
    description: 'Award-winning open source hybrid synthesizer with 3 oscillator scenes, wavetable synthesis, FM, physical modeling, and deep modulation matrices.',
    bestFor: 'Deep sound design, wavetables, expressive MPE leads, and evolving ambient pads.'
  },
  {
    id: 'vital-synth',
    name: 'Vital',
    developer: 'Matt Tytel',
    category: 'synth',
    format: 'VST3 / AU / CLAP (Win/Mac/Linux)',
    license: 'Free Tier with Open Source Core',
    url: 'https://vital.audio',
    description: 'Premier visual spectral warping wavetable synthesizer plugin. High frame-rate animated displays, custom text-to-wavetable, and rich onboard stereo effects.',
    bestFor: 'Modern dubstep growls, future bass supersaws, custom wavetables, and lush chord stacks.'
  },
  {
    id: 'dexed',
    name: 'Dexed (Yamaha DX7 Clone)',
    developer: 'Digital Suburban / asb2m10',
    category: 'synth',
    format: 'VST3 / AU / LV2 (Win/Mac/Linux)',
    license: 'GPL v3 Open Source',
    url: 'https://asb2m10.github.io/dexed/',
    description: 'Multi-platform FM synthesizer plugin modeled directly on the iconic Yamaha DX7. Capable of reading and writing authentic DX7 SysEx patch cartridges.',
    bestFor: 'Authentic 80s FM electric pianos, crystalline bells, retro brass, and punchy synthwave bass.'
  },
  {
    id: 'valhalla-supermassive',
    name: 'Valhalla Supermassive',
    developer: 'Valhalla DSP',
    category: 'effect',
    format: 'VST3 / AU / AAX (Win/Mac)',
    license: '100% Free Plugin',
    url: 'https://valhalladsp.com/shop/reverb/valhalla-supermassive/',
    description: 'Industry-standard free spatial reverb and delay plugin featuring 18 celestial algorithms designed for massive swells and endless harmonic decays.',
    bestFor: 'Massive atmospheric swells, endless ambient reverbs, harmonic echoes, and space washes.'
  },
  {
    id: 'chow-dsp',
    name: 'Chow Tape & ChowDSP Suite',
    developer: 'Jatin Chowdhury (ChowDSP)',
    category: 'effect',
    format: 'VST3 / AU / CLAP / LV2 (Win/Mac/Linux)',
    license: 'GPL v3 Open Source',
    url: 'https://chowdsp.com',
    description: 'Cutting-edge physical modeling and circuit emulation of reel-to-reel analog tape machines, tube distortion units, phasers, and guitar overdrive pedals.',
    bestFor: 'Warm analog tape saturation, tape compression, cassette wow & flutter, and vintage color.'
  },
  {
    id: 'airwindows',
    name: 'Airwindows Free DSP Plugins',
    developer: 'Chris Johnson (Airwindows)',
    category: 'effect',
    format: 'VST3 / AU (Win/Mac/Linux)',
    license: 'MIT Open Source',
    url: 'https://www.airwindows.com',
    description: 'Archive of over 300 free, zero-latency, high-precision mixing, mastering, console emulation, and dynamic processors coded directly in C++.',
    bestFor: 'Mastering punch, analog console summing, tape saturation, and transparent limiting.'
  },
  {
    id: 'spitfire-labs',
    name: 'Spitfire Audio LABS',
    developer: 'Spitfire Audio',
    category: 'sampler',
    format: 'VST3 / AU (Win/Mac)',
    license: '100% Free Dedicated VST',
    url: 'https://labs.spitfireaudio.com',
    description: 'Endless series of boutique, beautifully recorded virtual acoustic instruments made by London\'s premier audio engineers and composers.',
    bestFor: 'Intimate felt pianos, lush strings, vintage tape keys, guitar textures, and choral pads.'
  },
  {
    id: 'decent-sampler',
    name: 'Decent Sampler & Pianobook',
    developer: 'David Hilowitz / Community',
    category: 'sampler',
    format: 'VST3 / AU / AAX / Standalone',
    license: '100% Free Player / CC0 Packs',
    url: 'https://www.decentsamples.com/product/decent-sampler-plugin/',
    description: 'Lightweight sample player running thousands of acoustic, vintage, and organic instruments recorded and shared freely by the worldwide Pianobook community.',
    bestFor: 'Acoustic pianos, music boxes, felt keyboards, kalimbas, and vintage organs.'
  },
  {
    id: 'helm-synth',
    name: 'Helm Synthesizer',
    developer: 'Matt Tytel',
    category: 'synth',
    format: 'VST3 / AU / LV2 (Win/Mac/Linux)',
    license: 'GPL v3 Open Source',
    url: 'https://tytel.org/helm',
    description: 'Subtractive synthesizer plugin with live visual feedback, dual cross-modulating oscillators, multi-mode filter, and 32-step arpeggiator.',
    bestFor: 'Learning subtractive sound design, punchy leads, retro basslines, and sequenced arps.'
  },
  {
    id: 'kvr-audio',
    name: 'KVR Audio Free VST Directory',
    developer: 'KVR Community',
    category: 'database',
    format: 'Web Index & Community',
    license: 'Free Global Database',
    url: 'https://www.kvraudio.com/plugins/free/newest',
    description: 'The world\'s largest and oldest searchable database of free audio plugins, VST instruments, effects, host utilities, and community ratings.',
    bestFor: 'Discovering newly released freeware VST plugins, user ratings, and developer links.'
  },
  {
    id: 'plugin-boutique-free',
    name: 'Plugin Boutique Free VSTs',
    developer: 'Plugin Boutique',
    category: 'database',
    format: 'Web Marketplace Directory',
    license: '100% Free Commercial Downloads',
    url: 'https://www.pluginboutique.com/categories/free',
    description: 'Hand-picked curation of free commercial-grade plugins, introductory instruments, mastering tools, and promotional giveaways.',
    bestFor: 'Commercial freebies, studio mixing tools, vocal effects, and utility plugins.'
  },
  {
    id: 'tonejs-formant',
    name: 'Tone.js Formant Vocal VST',
    developer: 'Web Audio DSP Labs',
    category: 'webaudio',
    format: 'In-Browser Web Audio Node',
    license: 'MIT Open Source',
    url: 'https://tonejs.github.io',
    description: 'Dual-resonance formant peak filter modeling human vowel frequencies. Direct one-click injection into this track\'s Web Audio VST Rack!',
    bestFor: 'Throat vocals, talkbox sweeps, robotic filter sweeps, and formant shifting.',
    injectable: {
      name: 'Formant Vocal Filter',
      paramName: 'frequency',
      paramVal: '750',
      code: `const filter = ctx.createBiquadFilter();\nfilter.type = 'bandpass';\nfilter.Q.setValueAtTime(8.0, ctx.currentTime);\nfilter.frequency.setValueAtTime(params.frequency || 750, ctx.currentTime);\nreturn filter;`
    }
  },
  {
    id: 'tape-saturation-dsp',
    name: 'Analog Tape Drive Saturator',
    developer: 'ChowDSP Tape Algorithm',
    category: 'webaudio',
    format: 'In-Browser Web Audio Node',
    license: 'GPL Open Source Core',
    url: 'https://chowdsp.com',
    description: 'Soft-clipping polynomial waveshaper providing warm analog tape saturation and dynamic tube compression.',
    bestFor: 'Warming digital synths, analog bass grit, drum glue, and master saturation.',
    injectable: {
      name: 'Tape Drive Saturator',
      paramName: 'drive',
      paramVal: '4',
      code: `const shaper = ctx.createWaveShaper();\nconst k = (params.drive || 4) * 6;\nconst n_samples = 44100;\nconst curve = new Float32Array(n_samples);\nconst deg = Math.PI / 180;\nfor (let i = 0; i < n_samples; ++i) {\n  const x = (i * 2) / n_samples - 1;\n  curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));\n}\nshaper.curve = curve;\nshaper.oversample = '4x';\nreturn shaper;`
    }
  }
];

const VST_TEMPLATES = [
  {
    name: "Stereo Formant Vocal Filter",
    paramName: "frequency",
    paramVal: "850",
    url: "https://tonejs.github.io",
    code: `// Dual formant peak filter\nconst filter = ctx.createBiquadFilter();\nfilter.type = 'bandpass';\nfilter.Q.setValueAtTime(6.0, ctx.currentTime);\nfilter.frequency.setValueAtTime(params.frequency || 850, ctx.currentTime);\nreturn filter;`
  },
  {
    name: "Analog Tape Saturation Driver",
    paramName: "drive",
    paramVal: "4",
    url: "https://chowdsp.com",
    code: `// Soft-clipping waveshaper for tape warmth\nconst shaper = ctx.createWaveShaper();\nconst k = (params.drive || 4) * 5;\nconst n_samples = 44100;\nconst curve = new Float32Array(n_samples);\nconst deg = Math.PI / 180;\nfor (let i = 0; i < n_samples; ++i) {\n  const x = (i * 2) / n_samples - 1;\n  curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));\n}\nshaper.curve = curve;\nshaper.oversample = '4x';\nreturn shaper;`
  },
  {
    name: "Acid 24dB Diode Ladder Resonator",
    paramName: "cutoff",
    paramVal: "1200",
    url: "https://asb2m10.github.io/dexed/",
    code: `// Steep lowpass filter with high resonance\nconst lp = ctx.createBiquadFilter();\nlp.type = 'lowpass';\nlp.frequency.setValueAtTime(params.cutoff || 1200, ctx.currentTime);\nlp.Q.setValueAtTime(10.0, ctx.currentTime);\nreturn lp;`
  },
  {
    name: "Lo-Fi 8-Bit Sample Reducer",
    paramName: "bits",
    paramVal: "8",
    url: "https://www.airwindows.com",
    code: `// Bitcrusher waveshaper\nconst shaper = ctx.createWaveShaper();\nconst step = Math.pow(0.5, params.bits || 8);\nconst n = 1024;\nconst curve = new Float32Array(n);\nfor (let i = 0; i < n; i++) {\n  const x = (i * 2) / n - 1;\n  curve[i] = step * Math.floor(x / step + 0.5);\n}\nshaper.curve = curve;\nreturn shaper;`
  }
];

// Default fallback synth configuration if track lacks one
const DEFAULT_SYNTH_CONFIG: SynthConfig = {
  oscillator: 'sawtooth',
  attack: 0.05,
  decay: 0.2,
  sustain: 0.6,
  release: 0.3,
  cutoff: 2000,
  resonance: 1.5,
  delayTime: 0.25,
  delayFeedback: 0.3,
};

// Curated Open Source Presets
const PRESET_LIBRARY = [
  {
    id: 'acid_303',
    name: 'TB-303 Acid Bassline',
    category: 'bass' as const,
    description: 'Resonant classic TB-303 square wave squelch with dynamic MIDI sequence.',
    config: {
      oscillator: 'square' as const,
      attack: 0.01,
      decay: 0.15,
      sustain: 0.3,
      release: 0.12,
      cutoff: 750,
      resonance: 12.0,
      delayTime: 0.18,
      delayFeedback: 0.25,
    },
    notes: [
      { id: 'n1', pitch: 'C3', step: 0, duration: 1 },
      { id: 'n2', pitch: 'C3', step: 2, duration: 1 },
      { id: 'n3', pitch: 'C4', step: 4, duration: 1 },
      { id: 'n4', pitch: 'C3', step: 5, duration: 1 },
      { id: 'n5', pitch: 'D#3', step: 8, duration: 1 },
      { id: 'n6', pitch: 'F3', step: 10, duration: 1 },
      { id: 'n7', pitch: 'A#3', step: 12, duration: 2 },
      { id: 'n8', pitch: 'G#3', step: 14, duration: 2 },
      { id: 'n9', pitch: 'C3', step: 16, duration: 1 },
      { id: 'n10', pitch: 'C4', step: 20, duration: 1 },
      { id: 'n11', pitch: 'D#4', step: 24, duration: 2 },
      { id: 'n12', pitch: 'A#2', step: 28, duration: 2 },
    ]
  },
  {
    id: 'ambient_cloud',
    name: 'Ambient Cloud Pad',
    category: 'synth' as const,
    description: 'Slow attack, warm sine wave chords with deep spatial feedback echoes.',
    config: {
      oscillator: 'sine' as const,
      attack: 0.75,
      decay: 1.5,
      sustain: 0.8,
      release: 1.6,
      cutoff: 1900,
      resonance: 1.2,
      delayTime: 0.45,
      delayFeedback: 0.65,
    },
    notes: [
      { id: 's1', pitch: 'C4', step: 0, duration: 8 },
      { id: 's2', pitch: 'E4', step: 0, duration: 8 },
      { id: 's3', pitch: 'G4', step: 0, duration: 8 },
      { id: 's4', pitch: 'F4', step: 8, duration: 8 },
      { id: 's5', pitch: 'A4', step: 8, duration: 8 },
      { id: 's6', pitch: 'C5', step: 8, duration: 8 },
      { id: 's7', pitch: 'G3', step: 16, duration: 8 },
      { id: 's8', pitch: 'B3', step: 16, duration: 8 },
      { id: 's9', pitch: 'D4', step: 16, duration: 8 },
      { id: 's10', pitch: 'A3', step: 24, duration: 8 },
      { id: 's11', pitch: 'C4', step: 24, duration: 8 },
      { id: 's12', pitch: 'E4', step: 24, duration: 8 },
    ]
  },
  {
    id: 'cyberpunk_lead',
    name: 'Cyberpunk Saw Lead',
    category: 'synth' as const,
    description: 'Aggressive sawtooth wave with a gritty lowpass filter sweep and fast delay.',
    config: {
      oscillator: 'sawtooth' as const,
      attack: 0.05,
      decay: 0.3,
      sustain: 0.7,
      release: 0.25,
      cutoff: 2800,
      resonance: 4.5,
      delayTime: 0.24,
      delayFeedback: 0.35,
    },
    notes: [
      { id: 'cl1', pitch: 'A3', step: 0, duration: 1 },
      { id: 'cl2', pitch: 'A3', step: 1, duration: 1 },
      { id: 'cl3', pitch: 'C4', step: 4, duration: 1 },
      { id: 'cl4', pitch: 'A3', step: 6, duration: 1 },
      { id: 'cl5', pitch: 'D4', step: 8, duration: 2 },
      { id: 'cl6', pitch: 'C4', step: 10, duration: 2 },
      { id: 'cl7', pitch: 'E4', step: 12, duration: 4 },
      { id: 'cl8', pitch: 'A3', step: 16, duration: 1 },
      { id: 'cl9', pitch: 'A3', step: 17, duration: 1 },
      { id: 'cl10', pitch: 'G4', step: 20, duration: 2 },
      { id: 'cl11', pitch: 'F4', step: 24, duration: 4 },
    ]
  },
  {
    id: 'growlbox_monster',
    name: 'Growlbox Throat Monster',
    category: 'synth' as const,
    description: 'Menacing vocal throat growl with guttural subharmonics, aggressive vowel sweeps, and snarling distortion.',
    config: {
      oscillator: 'sawtooth' as const,
      attack: 0.08,
      decay: 0.4,
      sustain: 0.75,
      release: 0.35,
      cutoff: 1800,
      resonance: 8.5,
      delayTime: 0.22,
      delayFeedback: 0.4,
    },
    notes: [
      { id: 'gb1', pitch: 'E3', step: 0, duration: 2 },
      { id: 'gb2', pitch: 'E3', step: 2, duration: 2 },
      { id: 'gb3', pitch: 'G3', step: 4, duration: 2 },
      { id: 'gb4', pitch: 'A3', step: 6, duration: 2 },
      { id: 'gb5', pitch: 'A#3', step: 8, duration: 4 },
      { id: 'gb6', pitch: 'A3', step: 12, duration: 2 },
      { id: 'gb7', pitch: 'G3', step: 14, duration: 2 },
      { id: 'gb8', pitch: 'E3', step: 16, duration: 4 },
      { id: 'gb9', pitch: 'D3', step: 20, duration: 2 },
      { id: 'gb10', pitch: 'E3', step: 22, duration: 2 },
      { id: 'gb11', pitch: 'G3', step: 24, duration: 4 },
      { id: 'gb12', pitch: 'E3', step: 28, duration: 4 },
    ]
  },
  {
    id: 'detroit_drums',
    name: 'Detroit Techno Beat',
    category: 'drums' as const,
    description: 'Classic four-on-the-floor kick, rolling snare accents, and off-beat hats.',
    drumState: {
      kick: [
        true, false, false, false, true, false, false, false,
        true, false, false, false, true, false, false, false,
        true, false, false, false, true, false, false, false,
        true, false, false, false, true, false, false, false
      ],
      snare: [
        false, false, false, false, true, false, false, false,
        false, false, false, false, true, false, false, true,
        false, false, false, false, true, false, false, false,
        false, false, true, false, true, false, false, false
      ],
      hihat: [
        false, false, true, false, false, false, true, false,
        false, false, true, false, false, false, true, false,
        false, false, true, false, false, false, true, false,
        false, false, true, false, false, false, true, true
      ],
      clap: [
        false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false,
        true, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false
      ]
    }
  },
  {
    id: 'lofi_chill',
    name: 'Lo-Fi Chill Hop Kit',
    category: 'drums' as const,
    description: 'Cozy laid-back swing drum kit with offbeat ghost notes and warm claps.',
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
      clap: [
        false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false
      ]
    }
  },
  {
    id: 'house_chords',
    name: 'Deep House Warm Chords',
    category: 'synth' as const,
    description: 'Classic lush analog chord organ feel with moderate release, medium filter decay, and light delay.',
    config: {
      oscillator: 'triangle' as const,
      attack: 0.12,
      decay: 0.45,
      sustain: 0.65,
      release: 0.35,
      cutoff: 1400,
      resonance: 2.5,
      delayTime: 0.25,
      delayFeedback: 0.3,
    },
    notes: [
      { id: 'hc1', pitch: 'A3', step: 0, duration: 4 },
      { id: 'hc2', pitch: 'C4', step: 0, duration: 4 },
      { id: 'hc3', pitch: 'E4', step: 0, duration: 4 },
      { id: 'hc4', pitch: 'G4', step: 0, duration: 4 },
      { id: 'hc5', pitch: 'D4', step: 6, duration: 2 },
      { id: 'hc6', pitch: 'F4', step: 6, duration: 2 },
      { id: 'hc7', pitch: 'A4', step: 6, duration: 2 },
      { id: 'hc8', pitch: 'C4', step: 8, duration: 4 },
      { id: 'hc9', pitch: 'E4', step: 8, duration: 4 },
      { id: 'hc10', pitch: 'G4', step: 8, duration: 4 },
      { id: 'hc11', pitch: 'B4', step: 8, duration: 4 },
      { id: 'hc12', pitch: 'E3', step: 14, duration: 2 },
      { id: 'hc13', pitch: 'G3', step: 14, duration: 2 },
      { id: 'hc14', pitch: 'B3', step: 14, duration: 2 },
      { id: 'hc15', pitch: 'A3', step: 16, duration: 4 },
      { id: 'hc16', pitch: 'C4', step: 16, duration: 4 },
      { id: 'hc17', pitch: 'E4', step: 16, duration: 4 },
      { id: 'hc18', pitch: 'G4', step: 16, duration: 4 },
    ]
  },
  {
    id: 'future_glow',
    name: 'Future Bass Glow Pluck',
    category: 'synth' as const,
    description: 'Bright sawtooth chord swell with high cutoff resonance and fast, ping-pong delay lines.',
    config: {
      oscillator: 'sawtooth' as const,
      attack: 0.04,
      decay: 0.28,
      sustain: 0.45,
      release: 0.25,
      cutoff: 3500,
      resonance: 5.5,
      delayTime: 0.33,
      delayFeedback: 0.55,
    },
    notes: [
      { id: 'fg1', pitch: 'F4', step: 0, duration: 3 },
      { id: 'fg2', pitch: 'A4', step: 0, duration: 3 },
      { id: 'fg3', pitch: 'C5', step: 0, duration: 3 },
      { id: 'fg4', pitch: 'G4', step: 4, duration: 3 },
      { id: 'fg5', pitch: 'B4', step: 4, duration: 3 },
      { id: 'fg6', pitch: 'D5', step: 4, duration: 3 },
      { id: 'fg7', pitch: 'E4', step: 8, duration: 4 },
      { id: 'fg8', pitch: 'G4', step: 8, duration: 4 },
      { id: 'fg9', pitch: 'B4', step: 8, duration: 4 },
      { id: 'fg10', pitch: 'A4', step: 14, duration: 2 },
      { id: 'fg11', pitch: 'C5', step: 14, duration: 2 },
      { id: 'fg12', pitch: 'E5', step: 14, duration: 2 },
    ]
  },
  {
    id: 'reese_bass',
    name: 'Fat Reese Bass',
    category: 'bass' as const,
    description: 'Warm thick lowpass filtered detuned-style square wave for modern drum & bass, garage, and deep house.',
    config: {
      oscillator: 'square' as const,
      attack: 0.15,
      decay: 0.4,
      sustain: 0.85,
      release: 0.3,
      cutoff: 450,
      resonance: 1.5,
      delayTime: 0.0,
      delayFeedback: 0.0,
    },
    notes: [
      { id: 'rb1', pitch: 'E2', step: 0, duration: 6 },
      { id: 'rb2', pitch: 'G2', step: 6, duration: 2 },
      { id: 'rb3', pitch: 'A2', step: 8, duration: 6 },
      { id: 'rb4', pitch: 'B2', step: 14, duration: 2 },
      { id: 'rb5', pitch: 'C2', step: 16, duration: 8 },
      { id: 'rb6', pitch: 'D2', step: 24, duration: 8 },
    ]
  },
  {
    id: 'organic_sub',
    name: 'Pure Sub Bass',
    category: 'bass' as const,
    description: 'Clean pure low-frequency sine sub-bass to anchor your dance-floor beats.',
    config: {
      oscillator: 'sine' as const,
      attack: 0.05,
      decay: 0.2,
      sustain: 1.0,
      release: 0.15,
      cutoff: 200,
      resonance: 1.0,
      delayTime: 0.0,
      delayFeedback: 0.0,
    },
    notes: [
      { id: 'sb1', pitch: 'C2', step: 0, duration: 4 },
      { id: 'sb2', pitch: 'C2', step: 4, duration: 4 },
      { id: 'sb3', pitch: 'F2', step: 8, duration: 4 },
      { id: 'sb4', pitch: 'G2', step: 12, duration: 4 },
      { id: 'sb5', pitch: 'A2', step: 16, duration: 8 },
      { id: 'sb6', pitch: 'D2', step: 24, duration: 8 },
    ]
  },
  {
    id: 'boombap_groove',
    name: 'Boom Bap Golden Era Beat',
    category: 'drums' as const,
    description: 'Heavy kick pocket with offbeat shuffles and dusty acoustic snare cracks.',
    drumState: {
      kick: [
        true, false, false, false, false, false, false, true,
        false, true, false, false, false, false, false, false,
        true, false, false, false, false, false, false, true,
        false, false, true, false, false, false, false, false
      ],
      snare: [
        false, false, false, false, true, false, false, false,
        false, false, false, false, true, false, false, false,
        false, false, false, false, true, false, false, false,
        false, false, false, false, true, false, false, true
      ],
      hihat: [
        true, false, true, false, true, false, true, true,
        true, false, true, false, true, false, true, true,
        true, false, true, false, true, false, true, true,
        true, false, true, false, true, true, true, true
      ],
      clap: [
        false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false
      ]
    }
  },
  {
    id: 'electro_clash',
    name: '80s Electro Clash Punch',
    category: 'drums' as const,
    description: 'Punchy robotic four-on-the-floor kick, retro clap accent rhythms, and steady tight open hi-hat patterns.',
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
        false, false, true, false, true, false, false, true,
        false, false, false, false, true, false, false, false,
        false, false, true, false, true, false, true, false
      ]
    }
  },
  {
    id: 'witch_house_drag',
    name: 'Occult 808 Drag Kit †‡†',
    category: 'drums' as const,
    description: 'Dragging half-time 808 sub drops, sluggish occult claps, and skittering 32nd-note trap hi-hat bursts.',
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
    id: 'witch_house_supersaw',
    name: 'Haunted Gothic Supersaw †',
    category: 'synth' as const,
    description: 'Detuned cathedral choir sawtooth lead with long ghostly delay feedback and dark lowpass filtering.',
    config: {
      oscillator: 'sawtooth' as const,
      attack: 0.12,
      decay: 0.45,
      sustain: 0.65,
      release: 0.55,
      cutoff: 2100,
      resonance: 5.5,
      delayTime: 0.45,
      delayFeedback: 0.55,
    },
    notes: [
      { id: 'whs-1', pitch: 'C4', step: 0, duration: 4 },
      { id: 'whs-2', pitch: 'D#4', step: 0, duration: 4 },
      { id: 'whs-3', pitch: 'G4', step: 0, duration: 4 },
      { id: 'whs-4', pitch: 'B3', step: 4, duration: 4 },
      { id: 'whs-5', pitch: 'D4', step: 4, duration: 4 },
      { id: 'whs-6', pitch: 'G#3', step: 8, duration: 4 },
      { id: 'whs-7', pitch: 'C4', step: 8, duration: 4 },
      { id: 'whs-8', pitch: 'G3', step: 12, duration: 4 },
      { id: 'whs-9', pitch: 'C4', step: 16, duration: 2 },
      { id: 'whs-10', pitch: 'D#4', step: 18, duration: 2 },
      { id: 'whs-11', pitch: 'F4', step: 20, duration: 2 },
      { id: 'whs-12', pitch: 'G4', step: 22, duration: 2 },
      { id: 'whs-13', pitch: 'G#4', step: 24, duration: 4 },
      { id: 'whs-14', pitch: 'G4', step: 28, duration: 4 }
    ]
  },
  {
    id: 'witch_house_reese',
    name: 'Monolithic Occult Sub-Bass',
    category: 'bass' as const,
    description: 'Crushing saturated sub-bass drone with resonant low harmonic depth and sluggish drag attack.',
    config: {
      oscillator: 'square' as const,
      attack: 0.06,
      decay: 0.4,
      sustain: 0.85,
      release: 0.35,
      cutoff: 360,
      resonance: 3.8,
      delayTime: 0.0,
      delayFeedback: 0.0,
    },
    notes: [
      { id: 'whb-1', pitch: 'C2', step: 0, duration: 6 },
      { id: 'whb-2', pitch: 'B1', step: 6, duration: 2 },
      { id: 'whb-3', pitch: 'G#1', step: 8, duration: 6 },
      { id: 'whb-4', pitch: 'G1', step: 14, duration: 2 },
      { id: 'whb-5', pitch: 'C2', step: 16, duration: 8 },
      { id: 'whb-6', pitch: 'D#2', step: 24, duration: 4 },
      { id: 'whb-7', pitch: 'D2', step: 28, duration: 4 }
    ]
  }
];

// Curated Open Source VST Plugins
const CURATED_VSTS: VstPlugin[] = [
  {
    id: 'bitcrusher',
    name: 'Bitcrusher-9000',
    developer: 'Open Source Community',
    category: 'Effect',
    description: 'Decimates amplitude resolution to simulate 8-bit vintage chipsets.',
    isEnabled: false,
    parameters: [
      { id: 'amount', name: 'Decimation Rate', min: 0, max: 98, value: 65, unit: '%' }
    ]
  },
  {
    id: 'saturator',
    name: 'Saturator Shaper',
    developer: 'Analog Audio Labs',
    category: 'Effect',
    description: 'Applies smooth wave-shaping soft-clipping to simulate glowing vacuum tube warmth.',
    isEnabled: false,
    parameters: [
      { id: 'drive', name: 'Tube Drive', min: 1, max: 20, value: 5, unit: 'x' }
    ]
  },
  {
    id: 'ringmod',
    name: 'Ring Modulator',
    developer: 'Retro Sci-Fi Labs',
    category: 'Effect',
    description: 'Multiplies input with a high-frequency carrier sine wave to create metallic, robotic tones.',
    isEnabled: false,
    parameters: [
      { id: 'frequency', name: 'Carrier Freq', min: 100, max: 1200, value: 440, unit: 'Hz' },
      { id: 'depth', name: 'Mod Depth', min: 0, max: 100, value: 80, unit: '%' }
    ]
  },
  {
    id: 'autowah',
    name: 'Auto-Wah Follower',
    developer: 'Funk-O-Matic Corp',
    category: 'Effect',
    description: 'Sweeps filter peaking frequency automatically using a dynamic Low-Frequency Oscillator (LFO).',
    isEnabled: false,
    parameters: [
      { id: 'speed', name: 'LFO Speed', min: 0.5, max: 15, value: 4, unit: 'Hz' },
      { id: 'depth', name: 'Sweep Depth', min: 100, max: 3000, value: 1500, unit: 'Hz' },
      { id: 'resonance', name: 'Q Resonance', min: 1, max: 15, value: 5, unit: 'Q' },
      { id: 'baseFreq', name: 'Base Cutoff', min: 200, max: 2000, value: 1000, unit: 'Hz' }
    ]
  },
  {
    id: 'chorusdelay',
    name: 'Llama Chorus Echo',
    developer: 'Andes Open Audio',
    category: 'Effect',
    description: 'Lush stereo delay line with high-feedback echo parameters.',
    isEnabled: false,
    parameters: [
      { id: 'delayTime', name: 'Echo Time', min: 0.05, max: 1.0, value: 0.35, unit: 's' },
      { id: 'feedback', name: 'Feedback', min: 0, max: 0.95, value: 0.45, unit: 'lvl' },
      { id: 'mix', name: 'Wet/Dry Mix', min: 0.1, max: 0.9, value: 0.5, unit: '%' }
    ]
  },
  {
    id: 'phaser',
    name: 'Space Dust Phaser',
    developer: 'Cosmic Soundworks',
    category: 'Effect',
    description: 'Multi-stage allpass filter cascade sweeping with LFO for spatial swirl.',
    isEnabled: false,
    parameters: [
      { id: 'rate', name: 'LFO Rate', min: 0.1, max: 10, value: 1.5, unit: 'Hz' },
      { id: 'depth', name: 'Sweep Depth', min: 10, max: 100, value: 70, unit: '%' },
      { id: 'feedback', name: 'Feedback', min: 0, max: 95, value: 50, unit: '%' },
      { id: 'baseFreq', name: 'Center Freq', min: 100, max: 4000, value: 800, unit: 'Hz' }
    ]
  },
  {
    id: 'tremolo',
    name: 'Nebula Tremolo Panner',
    developer: 'Pulsar FX Lab',
    category: 'Effect',
    description: 'Rhythmic amplitude volume modulation and auto-stereo panning.',
    isEnabled: false,
    parameters: [
      { id: 'rate', name: 'Pulsing Rate', min: 0.5, max: 20, value: 3.0, unit: 'Hz' },
      { id: 'depth', name: 'Mod Depth', min: 0, max: 100, value: 80, unit: '%' }
    ]
  },
  {
    id: 'exciter',
    name: 'Exciter Tape Warmth',
    developer: 'Vintage Audio Corp',
    category: 'Effect',
    description: 'Injects dynamic high frequency harmonic distortion to model tape decks.',
    isEnabled: false,
    parameters: [
      { id: 'freq', name: 'High Cutoff', min: 2000, max: 12000, value: 6000, unit: 'Hz' },
      { id: 'mix', name: 'Exciter Blend', min: 0, max: 100, value: 40, unit: '%' },
      { id: 'drive', name: 'Tube Drive', min: 1, max: 10, value: 3, unit: 'x' }
    ]
  },
  {
    id: 'vocalfilter',
    name: 'A-E-O Vocal Talkbox',
    developer: 'Funk-O-Matic Corp',
    category: 'Effect',
    description: 'Dual-peak bandpass formant filter sweeping between human vowel sounds.',
    isEnabled: false,
    parameters: [
      { id: 'vowel', name: 'Vowel (A-E-O)', min: 0, max: 100, value: 50, unit: '%' },
      { id: 'resonance', name: 'Formant Q', min: 1, max: 20, value: 8, unit: 'Q' },
      { id: 'lfoRate', name: 'Auto-Talk Rate', min: 0, max: 8, value: 0, unit: 'Hz' }
    ]
  },
  {
    id: 'growlbox',
    name: 'Growlbox Vocal FX',
    developer: 'Monster Voice & Formant Labs',
    category: 'Effect',
    description: 'Aggressive formant-shifting throat growl, subharmonic distortion, and dynamic vowel modulation for vocal and synth grit.',
    isEnabled: false,
    parameters: [
      { id: 'throat', name: 'Throat Formant', min: 150, max: 2000, value: 450, unit: 'Hz' },
      { id: 'sub', name: 'Sub-Growl Octave', min: 0, max: 100, value: 60, unit: '%' },
      { id: 'drive', name: 'Growl Grit / Drive', min: 1, max: 25, value: 8, unit: 'x' },
      { id: 'modRate', name: 'Vowel Mod LFO', min: 0, max: 12, value: 3.5, unit: 'Hz' },
      { id: 'resonance', name: 'Throat Q / Peak', min: 1, max: 16, value: 7.5, unit: 'Q' },
      { id: 'mix', name: 'Wet / Dry Mix', min: 0, max: 100, value: 80, unit: '%' }
    ]
  },
  {
    id: 'detuner',
    name: 'Micro-Widener Detune',
    developer: 'Stereo Dimension Labs',
    category: 'Effect',
    description: 'Dual chorused micro delay lines to produce thick, lush wide vocals and synths.',
    isEnabled: false,
    parameters: [
      { id: 'detune', name: 'Detune Cents', min: -50, max: 50, value: 15, unit: '¢' },
      { id: 'delay', name: 'Time Offset', min: 1, max: 50, value: 10, unit: 'ms' },
      { id: 'width', name: 'Stereo Width', min: 0, max: 100, value: 100, unit: '%' }
    ]
  }
];

export function VstPresetManager({
  activeTrack,
  tracks,
  onUpdateTrackVsts,
  onUpdateSynthConfig,
  onUpdateMidiNotes,
  onUpdateDrumState,
  onShowNotification,
  onOpenVstLinks
}: VstPresetManagerProps) {
  // --- Persistent User Synth Presets in Local Storage ---
  const [userPresets, setUserPresets] = useState<UserSynthPreset[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_USER_SYNTH_PRESETS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse user synth presets from localStorage:', e);
    }
    return [];
  });

  // Track VSTs
  const [vsts, setVsts] = useState<VstPlugin[]>(() => {
    const saved = localStorage.getItem(`vsts_track_${activeTrack.id}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return CURATED_VSTS.map(v => ({ ...v }));
  });

  // Main Tab Navigation: Presets, Virtual VST Rack, or Free VST Links
  const [activeTab, setActiveTab] = useState<'presets' | 'vst_rack' | 'vst_links'>('presets');
  
  // Preset Sub-filter: all, user, curated
  const [presetFilter, setPresetFilter] = useState<'all' | 'user' | 'curated'>('all');

  // Free VST Links Directory Filter & Search States
  const [vstSearchQuery, setVstSearchQuery] = useState('');
  const [vstCategoryFilter, setVstCategoryFilter] = useState<'all' | 'synth' | 'effect' | 'sampler' | 'database' | 'webaudio'>('all');
  const [copiedVstId, setCopiedVstId] = useState<string | null>(null);

  // "Save Current Synth as Preset" Form State
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState<'synth' | 'bass'>(
    activeTrack.type === 'bass' ? 'bass' : 'synth'
  );
  const [newPresetDescription, setNewPresetDescription] = useState('');

  // Custom VST Link Form State
  const [isLinkingVst, setIsLinkingVst] = useState(false);
  const [customVstName, setCustomVstName] = useState('');
  const [customVstUrl, setCustomVstUrl] = useState('');
  const [customVstCode, setCustomVstCode] = useState(`// Custom Web Audio Node Builder
// Must return a valid Web Audio Node object
const filter = ctx.createBiquadFilter();
filter.type = 'highpass';
filter.frequency.setValueAtTime(params.frequency || 800, ctx.currentTime);
return filter;`);
  
  const [customVstParamName, setCustomVstParamName] = useState('frequency');
  const [customVstParamVal, setCustomVstParamVal] = useState('800');

  // Copy VST URL to clipboard
  const handleCopyVstUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedVstId(id);
    onShowNotification(`Copied VST Link: ${url}`, 'success');
    setTimeout(() => setCopiedVstId(null), 2000);
  };

  // Inject Web Audio VST directly into track rack
  const handleInjectDirectVst = (item: VstDirectoryItem) => {
    if (!item.injectable) return;
    const newVstId = 'custom_' + Date.now();
    const newVst: VstPlugin = {
      id: newVstId,
      name: item.injectable.name,
      developer: item.developer,
      category: 'Effect',
      description: item.description,
      isEnabled: true,
      code: item.injectable.code,
      parameters: [
        { 
          id: item.injectable.paramName.toLowerCase().replace(/\s+/g, '_') || 'param', 
          name: item.injectable.paramName, 
          min: 0, 
          max: parseFloat(item.injectable.paramVal) * 2 || 1000, 
          value: parseFloat(item.injectable.paramVal) || 500,
          unit: 'val' 
        }
      ],
      linkedUrl: item.url
    };

    const updated = [...vsts, newVst];
    setVsts(updated);
    localStorage.setItem(`vsts_track_${activeTrack.id}`, JSON.stringify(updated));
    onUpdateTrackVsts(activeTrack.id, updated);
    audioEngine.applyTrackVsts(activeTrack.id, updated);
    setActiveTab('vst_rack');
    onShowNotification(`Injected "${item.injectable.name}" into ${activeTrack.name} VST Rack!`, 'success');
  };

  // Pre-fill custom VST link builder for desktop plugins
  const handlePrepareLinkVst = (item: VstDirectoryItem) => {
    setCustomVstName(item.name);
    setCustomVstUrl(item.url);
    setIsLinkingVst(true);
    setActiveTab('vst_rack');
    onShowNotification(`Loaded "${item.name}" link into Custom VST Editor.`, 'info');
  };

  // Synchronize VST list state when switching target tracks
  useEffect(() => {
    const saved = localStorage.getItem(`vsts_track_${activeTrack.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = CURATED_VSTS.map(curated => {
          const found = parsed.find((p: any) => p.id === curated.id);
          return found ? { 
            ...curated, 
            isEnabled: found.isEnabled, 
            parameters: curated.parameters.map((cp: any) => {
              const foundParam = found.parameters?.find((fp: any) => fp.id === cp.id);
              return foundParam ? { ...cp, value: foundParam.value } : cp;
            }) 
          } : { ...curated };
        });
        const customVsts = parsed.filter((p: any) => p.id.startsWith('custom_'));
        setVsts([...merged, ...customVsts]);
        return;
      } catch (e) {}
    }
    setVsts(CURATED_VSTS.map(v => ({ ...v })));
  }, [activeTrack.id]);

  // Update default category when track changes
  useEffect(() => {
    setNewPresetCategory(activeTrack.type === 'bass' ? 'bass' : 'synth');
  }, [activeTrack.id, activeTrack.type]);

  // Helper to persist user presets to local storage
  const persistUserPresets = (updatedPresets: UserSynthPreset[]) => {
    setUserPresets(updatedPresets);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_SYNTH_PRESETS, JSON.stringify(updatedPresets));
    } catch (err) {
      console.error('Failed to save user presets to localStorage:', err);
      onShowNotification('Warning: LocalStorage limit reached. Preset may not persist.', 'error');
    }
  };

  // Save current active track's synth config as named preset in local storage
  const handleSaveCurrentSynthPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) {
      onShowNotification('Please enter a valid name for your synth preset.', 'error');
      return;
    }

    const currentConfig: SynthConfig = activeTrack.synthConfig 
      ? { ...activeTrack.synthConfig } 
      : { ...DEFAULT_SYNTH_CONFIG };

    const newPreset: UserSynthPreset = {
      id: `user_synth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newPresetName.trim(),
      category: newPresetCategory,
      description: newPresetDescription.trim() || undefined,
      config: currentConfig,
      createdAt: new Date().toISOString(),
    };

    const updated = [newPreset, ...userPresets];
    persistUserPresets(updated);

    // Reset form
    setNewPresetName('');
    setNewPresetDescription('');
    setIsSavingPreset(false);
    onShowNotification(`Saved preset "${newPreset.name}" to Local Storage!`, 'success');
  };

  // Delete a user preset from local storage
  const handleDeleteUserPreset = (presetId: string, presetName: string) => {
    const updated = userPresets.filter(p => p.id !== presetId);
    persistUserPresets(updated);
    onShowNotification(`Deleted custom preset "${presetName}".`, 'info');
  };

  // Load a user-saved synth preset onto the active track
  const handleLoadUserPreset = (preset: UserSynthPreset) => {
    onUpdateSynthConfig(activeTrack.id, { ...preset.config });
    onShowNotification(`Loaded user preset "${preset.name}" onto ${activeTrack.name}!`, 'success');
  };

  // Audition / test note playback of any synth configuration
  const handleAuditionPreset = (config: SynthConfig, category: 'synth' | 'bass' | string) => {
    const pitch = category === 'bass' ? 'C2' : 'C4';
    audioEngine.playNoteLive(pitch, config, activeTrack.id);
  };

  // Export single user preset as JSON file
  const handleExportSingleUserPreset = (preset: UserSynthPreset) => {
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_synth_preset.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowNotification(`Exported "${preset.name}" JSON file.`, 'success');
  };

  // Export all user presets from local storage
  const handleExportAllUserPresets = () => {
    if (userPresets.length === 0) {
      onShowNotification('No user-saved presets to export.', 'info');
      return;
    }
    const data = {
      type: 'lyria_user_synth_presets_collection',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      presets: userPresets
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_synth_presets_${userPresets.length}_items.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowNotification(`Exported ${userPresets.length} user synth presets!`, 'success');
  };

  // Load a curated open-source preset onto the active track
  const handleLoadPreset = (preset: typeof PRESET_LIBRARY[0]) => {
    if (preset.category !== activeTrack.type) {
      onShowNotification(`This preset is for ${preset.category} tracks! The current active track is a ${activeTrack.type} track.`, 'error');
      return;
    }

    if (preset.config && activeTrack.synthConfig) {
      onUpdateSynthConfig(activeTrack.id, { ...preset.config });
    }

    if (preset.notes) {
      onUpdateMidiNotes(activeTrack.id, [...preset.notes]);
    }

    if (preset.drumState) {
      onUpdateDrumState(activeTrack.id, { ...preset.drumState });
    }

    onShowNotification(`Successfully loaded open-source preset "${preset.name}"!`, 'success');
  };

  // Import custom JSON preset or user preset collection
  const handleImportJsonPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Check if importing a collection of user presets
        if (parsed.type === 'lyria_user_synth_presets_collection' && Array.isArray(parsed.presets)) {
          const newItems: UserSynthPreset[] = [];
          for (const item of parsed.presets) {
            if (item.name && item.config) {
              newItems.push({
                id: item.id || `imported_synth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name: item.name,
                category: item.category === 'bass' ? 'bass' : 'synth',
                description: item.description,
                config: item.config,
                createdAt: item.createdAt || new Date().toISOString()
              });
            }
          }
          if (newItems.length > 0) {
            const combined = [...newItems, ...userPresets];
            // Deduplicate by ID
            const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
            persistUserPresets(unique);
            onShowNotification(`Imported ${newItems.length} user synth presets into Local Storage!`, 'success');
            return;
          }
        }

        // Check if single UserSynthPreset
        if (parsed.config && parsed.name && (parsed.category === 'synth' || parsed.category === 'bass')) {
          const importedUserPreset: UserSynthPreset = {
            id: parsed.id || `imported_synth_${Date.now()}`,
            name: parsed.name,
            category: parsed.category,
            description: parsed.description,
            config: parsed.config,
            createdAt: parsed.createdAt || new Date().toISOString()
          };
          const updated = [importedUserPreset, ...userPresets.filter(p => p.id !== importedUserPreset.id)];
          persistUserPresets(updated);
          onShowNotification(`Imported synth preset "${importedUserPreset.name}" into Local Storage!`, 'success');
          return;
        }

        // General track preset
        if (parsed.type && parsed.type !== activeTrack.type) {
          onShowNotification(`Preset type mismatch! File contains a "${parsed.type}" preset but the active track is a "${activeTrack.type}".`, 'error');
          return;
        }

        if (parsed.synthConfig && activeTrack.synthConfig) {
          onUpdateSynthConfig(activeTrack.id, parsed.synthConfig);
        }

        if (parsed.midiNotes) {
          onUpdateMidiNotes(activeTrack.id, parsed.midiNotes);
        }

        if (parsed.drumState) {
          onUpdateDrumState(activeTrack.id, parsed.drumState);
        }

        onShowNotification(`Imported custom preset "${parsed.name || 'Custom Upload'}" successfully!`, 'success');
      } catch (err) {
        onShowNotification('Failed to parse preset JSON file. Please ensure it is a valid format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Export current track settings as JSON
  const handleExportTrackPreset = () => {
    const presetData = {
      name: `${activeTrack.name} Preset`,
      type: activeTrack.type,
      exportedAt: new Date().toISOString(),
      synthConfig: activeTrack.synthConfig,
      midiNotes: activeTrack.midiNotes,
      drumState: activeTrack.drumState
    };

    const blob = new Blob([JSON.stringify(presetData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTrack.name.toLowerCase().replace(/\s+/g, '_')}_preset.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowNotification('Track preset exported successfully.', 'success');
  };

  // Toggle state of VST
  const handleToggleVst = (vstId: string) => {
    const updated = vsts.map(v => {
      if (v.id === vstId) {
        const isNowEnabled = !v.isEnabled;
        return { ...v, isEnabled: isNowEnabled };
      }
      return v;
    });
    setVsts(updated);
    localStorage.setItem(`vsts_track_${activeTrack.id}`, JSON.stringify(updated));
    
    // Apply changes in Web Audio Engine immediately
    onUpdateTrackVsts(activeTrack.id, updated);
    audioEngine.applyTrackVsts(activeTrack.id, updated);
    onShowNotification(`VST effect ${updated.find(v => v.id === vstId)?.isEnabled ? 'Enabled' : 'Bypassed'}.`, 'info');
  };

  // Adjust parameter slider
  const handleParamChange = (vstId: string, paramId: string, newValue: number) => {
    const updated = vsts.map(v => {
      if (v.id === vstId) {
        const params = v.parameters.map(p => {
          if (p.id === paramId) {
            return { ...p, value: newValue };
          }
          return p;
        });
        return { ...v, parameters: params };
      }
      return v;
    });
    setVsts(updated);
    localStorage.setItem(`vsts_track_${activeTrack.id}`, JSON.stringify(updated));
    audioEngine.applyTrackVsts(activeTrack.id, updated);
  };

  // Create custom linked/uploaded VST
  const handleLinkCustomVst = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customVstName.trim()) {
      onShowNotification('Please enter a valid VST plugin name.', 'error');
      return;
    }

    const newVstId = 'custom_' + Date.now();
    const newVst: VstPlugin = {
      id: newVstId,
      name: customVstName,
      developer: customVstUrl ? 'External Developer' : 'User Uploaded',
      category: 'Effect',
      description: customVstUrl 
        ? `Linked open-source VST module located at: ${customVstUrl}` 
        : 'User-defined dynamic Web Audio algorithm.',
      isEnabled: true,
      code: customVstCode,
      parameters: [
        { 
          id: customVstParamName.toLowerCase().replace(/\s+/g, '_') || 'param', 
          name: customVstParamName, 
          min: 0, 
          max: parseFloat(customVstParamVal) * 2 || 1000, 
          value: parseFloat(customVstParamVal) || 500,
          unit: 'val' 
        }
      ],
      linkedUrl: customVstUrl || undefined
    };

    const updated = [...vsts, newVst];
    setVsts(updated);
    localStorage.setItem(`vsts_track_${activeTrack.id}`, JSON.stringify(updated));
    
    // Sync to audioEngine immediately
    onUpdateTrackVsts(activeTrack.id, updated);
    audioEngine.applyTrackVsts(activeTrack.id, updated);

    // Reset Form
    setCustomVstName('');
    setCustomVstUrl('');
    setIsLinkingVst(false);
    onShowNotification(`Successfully uploaded & linked VST Plugin "${customVstName}"!`, 'success');
  };

  // Remove custom VST
  const handleRemoveVst = (vstId: string) => {
    const updated = vsts.filter(v => v.id !== vstId);
    setVsts(updated);
    localStorage.setItem(`vsts_track_${activeTrack.id}`, JSON.stringify(updated));
    
    // Update Web Audio
    onUpdateTrackVsts(activeTrack.id, updated);
    audioEngine.applyTrackVsts(activeTrack.id, updated);
    onShowNotification('Custom VST plugin removed.', 'info');
  };

  const isSynthTrack = activeTrack.type === 'synth' || activeTrack.type === 'bass';
  const currentTrackSynth = activeTrack.synthConfig || DEFAULT_SYNTH_CONFIG;

  // Filter curated presets
  const filteredCuratedPresets = PRESET_LIBRARY.filter(p => p.category === activeTrack.type);
  
  // Filter user presets based on current track category or display all
  const filteredUserPresets = userPresets.filter(p => {
    if (activeTrack.type === 'synth' || activeTrack.type === 'bass') {
      return p.category === activeTrack.type || p.category === 'synth' || p.category === 'bass';
    }
    return true;
  });

  return (
    <div id="vst-preset-manager" className="bg-panel border border-border-custom rounded-xl p-4 sm:p-5 shadow-lg flex flex-col gap-4">
      {/* Top Header & Tab Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-custom pb-3">
        <div className="flex gap-1.5 bg-bg p-1 rounded-lg border border-border-custom">
          <button
            id="tab-presets-library"
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-accent/15 text-accent border border-accent/25 shadow-sm'
                : 'text-ink-dim hover:text-ink border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Synth Presets</span>
            {userPresets.length > 0 && (
              <span className="bg-accent text-bg text-[9px] font-black px-1.5 py-0.2 rounded-full font-mono">
                {userPresets.length}
              </span>
            )}
          </button>

          <button
            id="tab-vst-rack"
            onClick={() => setActiveTab('vst_rack')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'vst_rack'
                ? 'bg-accent/15 text-accent border border-accent/25 shadow-sm'
                : 'text-ink-dim hover:text-ink border border-transparent'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Virtual VST Rack</span>
            {vsts.filter(v => v.isEnabled).length > 0 && (
              <span className="bg-rose-500 text-white font-mono text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">
                {vsts.filter(v => v.isEnabled).length}
              </span>
            )}
          </button>

          <button
            id="tab-vst-links"
            onClick={() => setActiveTab('vst_links')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'vst_links'
                ? 'bg-accent/15 text-accent border border-accent/25 shadow-sm'
                : 'text-ink-dim hover:text-ink border border-transparent'
            }`}
            title="Browse directory of free VST synths, effects, and Web Audio inserts"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#d946ef]" />
            <span>Free VST Links</span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-black px-1 py-0.2 rounded font-mono">
              DIRECTORY
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenVstLinks && (
            <button
              id="btn-open-vst-hub-modal"
              onClick={onOpenVstLinks}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 hover:bg-accent hover:text-black border border-accent/30 text-accent font-mono text-[10px] font-bold rounded uppercase transition-all cursor-pointer"
              title="Open full-screen VST, Synth & Materials Directory modal"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Full VST Hub</span>
            </button>
          )}
          <span className="text-[10px] text-ink-dim font-mono uppercase hidden sm:inline">
            Track: <strong className="text-accent">{activeTrack.name}</strong> ({activeTrack.type})
          </span>
        </div>
      </div>

      {/* Tab: Presets Library & User Local Storage Presets */}
      {activeTab === 'presets' && (
        <div className="flex flex-col gap-4">
          {/* Action Ribbon & Storage Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-bg border border-border-custom p-3.5 rounded-xl">
            <div className="flex gap-2.5 items-start">
              <div className="p-2 bg-accent/10 border border-accent/20 text-accent rounded-lg shrink-0">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-mono flex items-center gap-2">
                  Synth Presets & Local Library
                </h4>
                <p className="text-[11px] text-ink-dim leading-relaxed mt-0.5">
                  Save custom synth voice configurations directly into browser Local Storage or load curated open-source sounds.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
              {/* Save Current Synth Button (visible for synth/bass tracks) */}
              {isSynthTrack && (
                <button
                  id="btn-open-save-preset"
                  onClick={() => setIsSavingPreset(!isSavingPreset)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                    isSavingPreset 
                      ? 'bg-zinc-800 text-ink border border-border-custom' 
                      : 'bg-accent text-bg hover:brightness-110 shadow-sm'
                  }`}
                  title="Save current synth parameters as a named preset"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingPreset ? 'Close Form' : 'Save Current Synth'}</span>
                </button>
              )}

              {/* Import Custom / User Preset JSON */}
              <label
                id="btn-upload-preset"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-panel border border-border-custom hover:bg-surface-raised hover:text-accent text-ink font-mono text-[10px] font-bold rounded uppercase tracking-wider transition-colors cursor-pointer"
                title="Upload/Import custom preset JSON or user collection"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJsonPreset}
                  className="hidden"
                />
              </label>

              {/* Export All User Presets or Active Track */}
              {userPresets.length > 0 ? (
                <button
                  id="btn-export-all-user-presets"
                  onClick={handleExportAllUserPresets}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-panel border border-border-custom hover:bg-surface-raised hover:text-accent text-ink font-mono text-[10px] font-bold rounded uppercase tracking-wider transition-colors cursor-pointer"
                  title="Download all your saved presets as a single JSON backup"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Backup All ({userPresets.length})</span>
                </button>
              ) : (
                <button
                  id="btn-export-track-preset"
                  onClick={handleExportTrackPreset}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-panel border border-border-custom hover:bg-surface-raised hover:text-accent text-ink font-mono text-[10px] font-bold rounded uppercase tracking-wider transition-colors cursor-pointer"
                  title="Download active track configurations"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Track</span>
                </button>
              )}
            </div>
          </div>

          {/* Inline Form: Save User-Created Synth Configuration to Local Storage */}
          {isSavingPreset && isSynthTrack && (
            <form 
              id="form-save-synth-preset"
              onSubmit={handleSaveCurrentSynthPreset}
              className="bg-bg border border-accent/30 p-4 rounded-xl flex flex-col gap-3 shadow-inner"
            >
              <div className="flex items-center justify-between border-b border-border-custom pb-2">
                <div className="flex items-center gap-2">
                  <BookmarkPlus className="w-4 h-4 text-accent" />
                  <span className="text-xs font-bold text-ink uppercase tracking-wider font-mono">
                    Save Synth Voice to Local Storage
                  </span>
                </div>
                <span className="text-[9px] text-ink-dim font-mono">
                  Stored persistently in browser
                </span>
              </div>

              {/* Active Synth Parameter Snapshot Summary */}
              <div className="bg-panel border border-border-custom p-2.5 rounded-lg flex flex-wrap gap-2 text-[10px] font-mono items-center">
                <span className="text-ink-dim uppercase font-bold text-[9px]">Captured Voice:</span>
                <span className="bg-bg px-2 py-0.5 rounded border border-border-custom text-accent font-bold uppercase">
                  Wave: {currentTrackSynth.oscillator}
                </span>
                <span className="bg-bg px-2 py-0.5 rounded border border-border-custom text-ink">
                  Cutoff: {currentTrackSynth.cutoff}Hz
                </span>
                <span className="bg-bg px-2 py-0.5 rounded border border-border-custom text-ink">
                  Q: {currentTrackSynth.resonance}
                </span>
                <span className="bg-bg px-2 py-0.5 rounded border border-border-custom text-ink">
                  ADSR: {currentTrackSynth.attack.toFixed(2)}s / {currentTrackSynth.decay.toFixed(2)}s / {(currentTrackSynth.sustain * 100).toFixed(0)}% / {currentTrackSynth.release.toFixed(2)}s
                </span>
                {currentTrackSynth.delayFeedback > 0 && (
                  <span className="bg-bg px-2 py-0.5 rounded border border-border-custom text-ink">
                    Echo: {(currentTrackSynth.delayFeedback * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] text-ink-dim font-mono font-bold uppercase">
                    Preset Name <span className="text-accent">*</span>
                  </label>
                  <input
                    id="input-preset-name"
                    type="text"
                    required
                    placeholder="e.g. Neon Cyber Lead, Warm Reese Bass, Glass Pluck"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="bg-panel text-ink text-xs font-mono border border-border-custom focus:border-accent focus:outline-none p-2 rounded-lg"
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-ink-dim font-mono font-bold uppercase">
                    Category
                  </label>
                  <select
                    id="select-preset-category"
                    value={newPresetCategory}
                    onChange={(e) => setNewPresetCategory(e.target.value as 'synth' | 'bass')}
                    className="bg-panel text-ink text-xs font-mono border border-border-custom focus:border-accent focus:outline-none p-2 rounded-lg cursor-pointer"
                  >
                    <option value="synth">Synth / Lead / Pad</option>
                    <option value="bass">Bass / Sub</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-ink-dim font-mono font-bold uppercase">
                  Description / Sonic Character (Optional):
                </label>
                <input
                  id="input-preset-description"
                  type="text"
                  placeholder="e.g. Fast punchy attack with resonant squelch and wide stereo feedback"
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  className="bg-panel text-ink text-xs font-mono border border-border-custom focus:border-accent focus:outline-none p-2 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleAuditionPreset(currentTrackSynth, newPresetCategory)}
                  className="flex items-center gap-1.5 text-[10px] text-ink-dim hover:text-accent font-mono transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Audition Voice</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSavingPreset(false)}
                    className="px-3 py-1.5 text-[10px] font-mono font-bold text-ink-dim hover:text-ink bg-transparent rounded uppercase transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-submit-save-preset"
                    type="submit"
                    className="px-4 py-1.5 text-[10px] font-mono font-bold text-bg bg-accent hover:brightness-110 rounded uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Local Storage</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Preset Filter Navigation Bar */}
          <div className="flex items-center justify-between border-b border-border-custom pb-2">
            <div className="flex items-center gap-1.5">
              <button
                id="filter-all-presets"
                onClick={() => setPresetFilter('all')}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                  presetFilter === 'all'
                    ? 'bg-surface-raised text-ink border border-border-custom'
                    : 'text-ink-dim hover:text-ink'
                }`}
              >
                <span>All Presets</span>
                <span className="text-[9px] opacity-70">({userPresets.length + filteredCuratedPresets.length})</span>
              </button>

              <button
                id="filter-user-presets"
                onClick={() => setPresetFilter('user')}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                  presetFilter === 'user'
                    ? 'bg-accent/15 text-accent border border-accent/25'
                    : 'text-ink-dim hover:text-ink'
                }`}
              >
                <Bookmark className="w-3 h-3" />
                <span>My Saved Presets</span>
                <span className="text-[9px] bg-accent/20 px-1 rounded-full font-bold">
                  {userPresets.length}
                </span>
              </button>

              <button
                id="filter-curated-presets"
                onClick={() => setPresetFilter('curated')}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                  presetFilter === 'curated'
                    ? 'bg-surface-raised text-ink border border-border-custom'
                    : 'text-ink-dim hover:text-ink'
                }`}
              >
                <span>Curated Library</span>
                <span className="text-[9px] opacity-70">({filteredCuratedPresets.length})</span>
              </button>
            </div>

            <span className="text-[9px] font-mono text-ink-dim hidden sm:inline">
              Storage: <strong>{userPresets.length} custom presets</strong>
            </span>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 1. User-Saved Presets (Local Storage) */}
            {(presetFilter === 'all' || presetFilter === 'user') && filteredUserPresets.map((preset) => (
              <div 
                key={preset.id}
                id={`preset-card-${preset.id}`}
                className="bg-bg border border-accent/25 rounded-xl p-3.5 flex flex-col justify-between hover:border-accent/50 transition-all shadow-sm group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-ink uppercase tracking-tight font-mono">
                          {preset.name}
                        </span>
                        <span className="text-[8px] bg-accent/15 text-accent border border-accent/25 font-mono px-1.5 py-0.2 rounded font-extrabold uppercase">
                          LOCAL PRESET
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-ink-dim font-mono mt-0.5">
                        <span className="uppercase text-accent/80 font-bold">{preset.category}</span>
                        <span>•</span>
                        <span>{new Date(preset.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleExportSingleUserPreset(preset)}
                        className="p-1 text-ink-dim hover:text-accent bg-panel border border-border-custom rounded transition-colors cursor-pointer"
                        title="Export this preset as JSON"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteUserPreset(preset.id, preset.name)}
                        className="p-1 text-ink-dim hover:text-rose-400 bg-panel border border-border-custom rounded transition-colors cursor-pointer"
                        title="Delete from local storage"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {preset.description && (
                    <p className="text-[10px] text-ink-dim leading-normal mb-2.5 line-clamp-2">
                      {preset.description}
                    </p>
                  )}

                  {/* Synth Specs Pills */}
                  <div className="flex flex-wrap gap-1 mb-3 text-[8.5px] font-mono">
                    <span className="bg-panel px-1.5 py-0.5 rounded border border-border-custom text-accent">
                      {preset.config.oscillator}
                    </span>
                    <span className="bg-panel px-1.5 py-0.5 rounded border border-border-custom text-ink-dim">
                      {preset.config.cutoff}Hz
                    </span>
                    <span className="bg-panel px-1.5 py-0.5 rounded border border-border-custom text-ink-dim">
                      A: {preset.config.attack.toFixed(2)}s
                    </span>
                    <span className="bg-panel px-1.5 py-0.5 rounded border border-border-custom text-ink-dim">
                      R: {preset.config.release.toFixed(2)}s
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border-custom">
                  <button
                    onClick={() => handleAuditionPreset(preset.config, preset.category)}
                    className="p-1.5 bg-panel hover:bg-surface-raised text-ink-dim hover:text-accent border border-border-custom rounded font-mono text-[10px] transition-colors cursor-pointer flex items-center justify-center"
                    title="Audition sound preview"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleLoadUserPreset(preset)}
                    className="flex-1 bg-accent/10 hover:bg-accent hover:text-bg text-accent border border-accent/20 text-[10px] font-bold py-1.5 px-3 rounded uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Load Synth Preset</span>
                  </button>
                </div>
              </div>
            ))}

            {/* 2. Curated Open Source Presets */}
            {(presetFilter === 'all' || presetFilter === 'curated') && filteredCuratedPresets.map((preset) => (
              <div 
                key={preset.id}
                id={`curated-preset-${preset.id}`}
                className="bg-bg border border-border-custom rounded-xl p-3.5 flex flex-col justify-between hover:border-border-custom/80 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-ink uppercase tracking-tight font-mono">
                      {preset.name}
                    </span>
                    <span className="text-[8px] bg-panel border border-border-custom text-ink-dim font-mono px-1.5 py-0.2 rounded font-bold uppercase">
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-dim leading-normal mb-3">
                    {preset.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border-custom">
                  {preset.config && (
                    <button
                      onClick={() => handleAuditionPreset(preset.config!, preset.category)}
                      className="p-1.5 bg-panel hover:bg-surface-raised text-ink-dim hover:text-accent border border-border-custom rounded font-mono text-[10px] transition-colors cursor-pointer flex items-center justify-center"
                      title="Audition sound preview"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleLoadPreset(preset)}
                    className="flex-1 bg-surface-raised hover:bg-ink hover:text-bg text-ink border border-border-custom text-[10px] font-bold py-1.5 px-3 rounded uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Load Preset</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Empty State when User Presets filter is selected and list is empty */}
            {presetFilter === 'user' && userPresets.length === 0 && (
              <div className="col-span-full py-10 text-center bg-bg border border-dashed border-border-custom rounded-xl p-6 flex flex-col items-center gap-2">
                <BookmarkPlus className="w-8 h-8 text-accent/50" />
                <span className="text-xs font-mono font-bold text-ink uppercase">
                  No Saved User Synth Presets Found
                </span>
                <p className="text-[11px] text-ink-dim max-w-sm">
                  Click the <strong>"Save Current Synth"</strong> button above while on a Synth or Bass track to save your custom sound designs directly into local storage!
                </p>
              </div>
            )}

            {/* Empty State when track type has no presets */}
            {presetFilter === 'curated' && filteredCuratedPresets.length === 0 && (
              <div className="col-span-full py-8 text-center bg-bg border border-dashed border-border-custom rounded-xl text-ink-dim text-xs italic">
                No curated system presets available for track type ({activeTrack.type}). You can import JSON presets using the upload button!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Virtual VST Rack */}
      {activeTab === 'vst_rack' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg border border-border-custom p-3.5 rounded-xl">
            <div>
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-accent" />
                Web Audio VST rack inserts
              </h4>
              <p className="text-[11px] text-ink-dim leading-relaxed mt-0.5">
                Insert open-source real-time DSP effects directly into the active audio pipeline of this channel.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-quick-browse-vst-links"
                onClick={() => setActiveTab('vst_links')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-panel hover:bg-surface-raised text-accent border border-accent/30 font-mono text-[10px] font-bold rounded uppercase tracking-wider transition-colors cursor-pointer"
                title="Browse directory of free VST plugins and download links"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#d946ef]" />
                <span>Browse VST Links</span>
              </button>

              <button
                id="btn-toggle-custom-vst-form"
                onClick={() => setIsLinkingVst(!isLinkingVst)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-bg font-mono text-[10px] font-extrabold rounded uppercase tracking-wider transition-colors cursor-pointer self-start sm:self-center hover:brightness-110"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isLinkingVst ? "Close Editor" : "Upload / Link VST"}</span>
              </button>
            </div>
          </div>

          {/* VST Linking / Writing Form */}
          {isLinkingVst && (
            <form id="form-link-custom-vst" onSubmit={handleLinkCustomVst} className="bg-bg border border-accent/25 p-4 rounded-xl flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-border-custom pb-2">
                <span className="text-xs font-bold text-accent uppercase tracking-wider font-mono flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Configure Open Source Custom VST
                </span>
                <span className="text-[9px] text-ink-dim font-mono">Dynamic Web Audio Node Compilation</span>
              </div>

              {/* Quick Template Selector */}
              <div className="flex flex-col gap-1.5 bg-panel border border-border-custom p-2.5 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-accent font-mono font-bold uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Quick Load VST DSP Template:
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('vst_links')}
                    className="text-[9px] text-[#d946ef] hover:underline font-mono uppercase flex items-center gap-1 font-bold"
                  >
                    <span>Need VST links? Browse Directory</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
                <select
                  onChange={(e) => {
                    const selected = VST_TEMPLATES.find(t => t.name === e.target.value);
                    if (selected) {
                      setCustomVstName(selected.name);
                      setCustomVstParamName(selected.paramName);
                      setCustomVstParamVal(selected.paramVal);
                      setCustomVstUrl(selected.url);
                      setCustomVstCode(selected.code);
                      onShowNotification(`Loaded template: ${selected.name}`, 'info');
                    }
                  }}
                  defaultValue=""
                  className="bg-bg text-ink text-xs font-mono border border-border-custom p-1.5 rounded focus:border-accent outline-none"
                >
                  <option value="" disabled>-- Select a pre-configured VST template --</option>
                  {VST_TEMPLATES.map(tmpl => (
                    <option key={tmpl.name} value={tmpl.name}>{tmpl.name} ({tmpl.paramName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-ink-dim font-mono font-bold uppercase">VST Plugin Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acid Filter Squelch, Phaser-X"
                    value={customVstName}
                    onChange={(e) => setCustomVstName(e.target.value)}
                    className="bg-panel text-ink text-xs font-mono border border-border-custom focus:border-accent focus:outline-none p-2 rounded-lg"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-ink-dim font-mono font-bold uppercase">External Script/Module URL (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. https://cdnjs.cloudflare.com/ajax/libs/audio/vst.js"
                    value={customVstUrl}
                    onChange={(e) => setCustomVstUrl(e.target.value)}
                    className="bg-panel text-ink text-xs font-mono border border-border-custom focus:border-accent focus:outline-none p-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-ink-dim font-mono font-bold uppercase">Insert Parameter Identifier:</label>
                  <input
                    type="text"
                    placeholder="e.g. frequency, feedback"
                    value={customVstParamName}
                    onChange={(e) => setCustomVstParamName(e.target.value)}
                    className="bg-panel text-ink text-xs font-mono border border-border-custom focus:border-accent focus:outline-none p-2 rounded-lg"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-ink-dim font-mono font-bold uppercase">Default Value:</label>
                  <input
                    type="text"
                    placeholder="e.g. 800"
                    value={customVstParamVal}
                    onChange={(e) => setCustomVstParamVal(e.target.value)}
                    className="bg-panel text-ink text-xs font-mono border border-border-custom focus:border-accent focus:outline-none p-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-ink-dim font-mono font-bold uppercase">Web Audio Builder Code (evaluated in secure sandbox):</label>
                  <span className="text-[8px] text-ink-dim font-mono">Accepts: `ctx`, `params` | Returns: `AudioNode`</span>
                </div>
                <textarea
                  rows={4}
                  value={customVstCode}
                  onChange={(e) => setCustomVstCode(e.target.value)}
                  className="w-full bg-panel text-ink text-[11px] font-mono border border-border-custom focus:border-accent focus:outline-none p-2 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="bg-accent hover:brightness-110 text-bg font-mono text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-lg self-end cursor-pointer"
              >
                Compile and Inject VST
              </button>
            </form>
          )}

          {/* VST Grid Racks */}
          <div className="flex flex-col gap-3">
            {vsts.map((vst) => {
              const isCustom = vst.id.startsWith('custom_');
              return (
                <div 
                  key={vst.id}
                  id={`vst-card-${vst.id}`}
                  className={`bg-bg border rounded-xl p-3.5 transition-all duration-200 ${
                    vst.isEnabled 
                      ? 'border-accent/30 shadow-sm' 
                      : 'border-border-custom opacity-60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-custom pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleToggleVst(vst.id)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border cursor-pointer ${
                          vst.isEnabled 
                            ? 'bg-accent/15 border-accent text-accent' 
                            : 'bg-panel border-border-custom text-ink-dim'
                        }`}
                        title={vst.isEnabled ? "Bypass Effect Plugin" : "Power Active Plugin"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-ink uppercase tracking-wider font-mono">
                            {vst.name}
                          </span>
                          {isCustom && (
                            <span className="text-[8px] bg-accent/20 text-accent font-mono border border-accent/30 px-1 py-0.2 rounded font-extrabold uppercase">
                              Custom DSP
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-ink-dim font-mono block">
                          Developer: {vst.developer} | Insert Slot
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-ink-dim font-mono max-w-[250px] leading-tight truncate hidden sm:inline" title={vst.description}>
                        {vst.description}
                      </span>
                      {isCustom && (
                        <button
                          onClick={() => handleRemoveVst(vst.id)}
                          className="p-1.5 text-ink-dim hover:text-rose-400 bg-panel hover:bg-surface-raised border border-border-custom rounded-lg transition-colors cursor-pointer"
                          title="Uninstall plugin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* VST Sliders Parameter Board */}
                  {vst.isEnabled ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {vst.parameters.map((param) => (
                        <div key={param.id} className="bg-panel border border-border-custom p-2 rounded-lg flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase text-ink-dim">
                            <span>{param.name}</span>
                            <span className="text-accent">
                              {param.value.toFixed(param.max < 5 ? 2 : 0)}{param.unit ? ` ${param.unit}` : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={param.min}
                              max={param.max}
                              step={(param.max - param.min) / 100}
                              value={param.value}
                              onChange={(e) => handleParamChange(vst.id, param.id, parseFloat(e.target.value))}
                              className="flex-1 accent-accent bg-surface-raised h-1 rounded cursor-pointer"
                            />
                            <button
                              onClick={() => handleParamChange(vst.id, param.id, (param.min + param.max) / 2)}
                              className="text-[8px] text-ink-dim font-bold uppercase font-mono hover:text-ink transition-colors cursor-pointer"
                              title="Reset Parameter to center scale value"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-1.5 font-mono text-[10px] text-ink-dim">
                      Plugin bypassed. Enable power switch above to insert into signal path.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Free VST Links Directory */}
      {activeTab === 'vst_links' && (
        <div id="vst-links-directory-tab" className="flex flex-col gap-4">
          {/* Top Banner & Quick Explanation */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-bg border border-border-custom p-4 rounded-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-[#d946ef]/10 text-[#d946ef] rounded border border-[#d946ef]/30">
                  <ExternalLink className="w-4 h-4" />
                </span>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-mono">
                  Curated Free VST Plugins & Web Audio DSP Directory
                </h4>
                <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                  VERIFIED FREE / OPEN SOURCE
                </span>
              </div>
              <p className="text-[11px] text-ink-dim leading-relaxed max-w-3xl">
                Browse official websites and downloads for premier free VST3/AU synthesizers, studio effects, sample players, and Web Audio DSP algorithms. You can copy links directly, visit official developer download pages, or inject Web Audio DSP effects right into this track’s VST rack!
              </p>
            </div>

            {onOpenVstLinks && (
              <button
                id="btn-open-modal-from-vst-links"
                onClick={onOpenVstLinks}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#d946ef] hover:bg-[#d946ef]/90 text-[#0c0c0e] font-mono text-xs font-extrabold rounded-lg uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
                title="Open full-screen modal view of all materials & VSTs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full-Screen Hub</span>
              </button>
            )}
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-panel border border-border-custom p-3 rounded-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-dim" />
              <input
                type="text"
                value={vstSearchQuery}
                onChange={(e) => setVstSearchQuery(e.target.value)}
                placeholder="Search VSTs by name, developer, format (Surge, Vital, Dexed, Tape, Reverb)..."
                className="w-full bg-bg text-ink text-xs font-mono pl-9 pr-8 py-2 rounded-lg border border-border-custom focus:border-accent focus:outline-none placeholder:text-ink-dim/60"
              />
              {vstSearchQuery && (
                <button
                  onClick={() => setVstSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
              {[
                { id: 'all', label: 'All VSTs' },
                { id: 'synth', label: '🎹 Synths' },
                { id: 'effect', label: '🎛️ Effects' },
                { id: 'sampler', label: '📦 Samplers' },
                { id: 'database', label: '🌐 Databases' },
                { id: 'webaudio', label: '⚡ Web Audio DSP' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setVstCategoryFilter(cat.id as any)}
                  className={`px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-lg uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    vstCategoryFilter === cat.id
                      ? 'bg-accent text-bg shadow-sm'
                      : 'bg-bg text-ink-dim hover:text-ink border border-border-custom'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* VST Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {VST_DIRECTORY.filter((item) => {
              const matchesCat = vstCategoryFilter === 'all' || item.category === vstCategoryFilter;
              const q = vstSearchQuery.toLowerCase().trim();
              const matchesSearch = !q || (
                item.name.toLowerCase().includes(q) ||
                item.developer.toLowerCase().includes(q) ||
                item.format.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                item.bestFor.toLowerCase().includes(q) ||
                item.license.toLowerCase().includes(q)
              );
              return matchesCat && matchesSearch;
            }).map((item) => {
              const isCopied = copiedVstId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-bg border border-border-custom hover:border-accent/40 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all hover:shadow-md group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-ink group-hover:text-accent transition-colors font-mono">
                          {item.name}
                        </h5>
                        <p className="text-[10px] text-ink-dim font-mono">{item.developer}</p>
                      </div>
                      <span className="text-[8px] border border-border-custom text-ink-dim bg-panel px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                        {item.category === 'synth' && 'VST Synth'}
                        {item.category === 'effect' && 'VST Effect'}
                        {item.category === 'sampler' && 'Sampler'}
                        {item.category === 'database' && 'Directory'}
                        {item.category === 'webaudio' && 'Web Audio DSP'}
                      </span>
                    </div>

                    <p className="text-[10px] text-ink-dim font-mono leading-relaxed line-clamp-3">
                      {item.description}
                    </p>

                    <div className="space-y-1 pt-2 border-t border-border-custom/50 text-[9px] font-mono">
                      <div className="flex items-start gap-1">
                        <span className="text-ink-dim font-bold uppercase shrink-0">Best For:</span>
                        <span className="text-ink uppercase">{item.bestFor}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-ink-dim font-bold uppercase">Format:</span>
                        <span className="text-accent font-medium">{item.format}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-ink-dim font-bold uppercase">License:</span>
                        <span className="text-emerald-400 font-bold">{item.license}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this VST item */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-border-custom/40">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyVstUrl(item.url, item.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-panel hover:bg-surface-raised border border-border-custom hover:border-border-custom text-ink font-mono text-[9px] font-bold rounded uppercase transition-all cursor-pointer"
                        title="Copy direct official URL"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied URL</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-[#d946ef] hover:bg-[#d946ef]/90 text-[#0c0c0e] font-mono text-[9px] font-extrabold rounded uppercase transition-all cursor-pointer shadow-sm"
                        title="Visit official website & download page"
                      >
                        <span>Visit Website</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    {item.injectable ? (
                      <button
                        onClick={() => handleInjectDirectVst(item)}
                        className="w-full flex items-center justify-center gap-1 py-1 px-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold rounded uppercase transition-all cursor-pointer"
                        title="Inject directly into this track's Web Audio VST Rack"
                      >
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>⚡ Inject into Track Rack</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePrepareLinkVst(item)}
                        className="w-full flex items-center justify-center gap-1 py-1 px-2 bg-panel hover:bg-surface-raised border border-border-custom text-ink-dim hover:text-accent font-mono text-[9px] font-bold rounded uppercase transition-all cursor-pointer"
                        title="Load this VST's details into the Custom VST Link form"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Link to this Track</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
