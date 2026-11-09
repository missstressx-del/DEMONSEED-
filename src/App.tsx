import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, Square, Music, Sparkles, Sliders, Volume2, HelpCircle, 
  RefreshCw, Disc, Radio, LayoutGrid, Palette, Plus, Trash2, Wand2,
  Download, Upload, FileAudio, Save, Layers, Activity, Undo, Redo, Sun, Moon,
  Target, ChevronLeft, ChevronRight, Keyboard, ExternalLink, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { Track, DrumTrackState, MidiNote, SynthConfig, DAWTheme, AudioClip, PresetTemplate, VstPlugin, TrackAutomation } from './types';
import { TrackControl } from './components/TrackControl';
import { DrumSequencer } from './components/DrumSequencer';
import { PianoRoll } from './components/PianoRoll';
import { SynthDesigner } from './components/SynthDesigner';
import { AiGenerator } from './components/AiGenerator';
import { SamplerLooper } from './components/SamplerLooper';
import { TemplatesModal } from './components/TemplatesModal';
import { ChordTemplatesModal } from './components/ChordTemplatesModal';
import { OpenSourceMaterialModal } from './components/OpenSourceMaterialModal';
import { VstPresetManager } from './components/VstPresetManager';
import { AutomationLane } from './components/AutomationLane';
import { StudioGuideModal } from './components/StudioGuideModal';
import { QuickKeyMapModal } from './components/QuickKeyMapModal';
import { MiniPeakMeter } from './components/MiniPeakMeter';
import { WitchHouseBadge } from './components/WitchHouseBadge';
import { HardwareRackPresetSelector } from './components/HardwareRackPresetSelector';
import { RitualLab } from './components/RitualLab';
import { DARK_SUB_GENRES, DARK_PRESETS } from './data/darkSubGenres';
import { audioEngine } from './services/audioEngine';

// Visual themes for customization
const THEMES: DAWTheme[] = [
  {
    id: 'tech',
    name: 'Variation 3 - Cyber-Acoustic Terminal',
    bgClass: 'bg-[#050505] text-[#e2e2ec]',
    panelClass: 'bg-[#111111] border-[rgba(50,255,126,0.25)]',
    borderClass: 'border-[rgba(50,255,126,0.25)]',
    accentColor: 'text-[#ff0055] bg-[#ff0055]/10 border-[#ff0055]/30',
    textMuted: 'text-[rgba(226,226,236,0.6)]'
  },
  {
    id: 'light',
    name: 'High Contrast Light',
    bgClass: 'bg-[#f5f5f7] text-[#0a0a0e]',
    panelClass: 'bg-white border-zinc-300',
    borderClass: 'border-zinc-300',
    accentColor: 'text-[#e6004c] bg-[#e6004c]/10 border-[#e6004c]/20',
    textMuted: 'text-zinc-600'
  }
];

// Initial default configuration
const defaultSynthConfig: SynthConfig = {
  oscillator: 'sawtooth',
  attack: 0.05,
  decay: 0.25,
  sustain: 0.6,
  release: 0.3,
  cutoff: 2500,
  resonance: 2.0,
  delayTime: 0.25,
  delayFeedback: 0.3,
};

const defaultBassConfig: SynthConfig = {
  oscillator: 'square',
  attack: 0.02,
  decay: 0.15,
  sustain: 0.4,
  release: 0.15,
  cutoff: 800,
  resonance: 6.0,
  delayTime: 0.2,
  delayFeedback: 0.1,
};

interface HistoryState {
  tracks: Track[];
  bpm: number;
  eqBass: number;
  eqMid: number;
  eqTreble: number;
  compEnabled: boolean;
  compThreshold: number;
  compRatio: number;
  compAttack: number;
  compRelease: number;
  limiterEnabled: boolean;
  limiterThreshold: number;
  limiterCeiling: number;
  masterOutputGain: number;
}

function cloneTracks(tracks: Track[]): Track[] {
  return tracks.map(t => {
    const cloned: Track = {
      ...t,
      synthConfig: t.synthConfig ? { ...t.synthConfig } : undefined,
      midiNotes: t.midiNotes ? t.midiNotes.map(n => ({ ...n })) : undefined,
      drumState: t.drumState ? {
        kick: [...t.drumState.kick],
        snare: [...t.drumState.snare],
        hihat: [...t.drumState.hihat],
        clap: [...t.drumState.clap],
        groove: t.drumState.groove ? { ...t.drumState.groove } : undefined,
      } : undefined,
      grooveConfig: t.grooveConfig ? { ...t.grooveConfig } : undefined,
      clips: t.clips ? t.clips.map(c => ({ ...c })) : undefined,
      vsts: t.vsts ? t.vsts.map(v => ({
        ...v,
        parameters: v.parameters.map(p => ({ ...p }))
      })) : undefined,
      automation: t.automation ? {
        volume: t.automation.volume ? [...t.automation.volume] : undefined,
        pan: t.automation.pan ? [...t.automation.pan] : undefined,
        cutoff: t.automation.cutoff ? [...t.automation.cutoff] : undefined,
        activeParam: t.automation.activeParam
      } : undefined
    };
    return cloned;
  });
}

function cloneHistoryState(state: HistoryState): HistoryState {
  return {
    tracks: cloneTracks(state.tracks),
    bpm: state.bpm,
    eqBass: state.eqBass,
    eqMid: state.eqMid,
    eqTreble: state.eqTreble,
    compEnabled: state.compEnabled,
    compThreshold: state.compThreshold,
    compRatio: state.compRatio,
    compAttack: state.compAttack,
    compRelease: state.compRelease,
    limiterEnabled: state.limiterEnabled,
    limiterThreshold: state.limiterThreshold,
    limiterCeiling: state.limiterCeiling,
    masterOutputGain: state.masterOutputGain ?? 0.0,
  };
}

function didStateChange(a: HistoryState, b: HistoryState): boolean {
  if (a.bpm !== b.bpm) return true;
  if (a.eqBass !== b.eqBass) return true;
  if (a.eqMid !== b.eqMid) return true;
  if (a.eqTreble !== b.eqTreble) return true;
  if (a.compEnabled !== b.compEnabled) return true;
  if (a.compThreshold !== b.compThreshold) return true;
  if (a.compRatio !== b.compRatio) return true;
  if (a.compAttack !== b.compAttack) return true;
  if (a.compRelease !== b.compRelease) return true;
  if (a.limiterEnabled !== b.limiterEnabled) return true;
  if (a.limiterThreshold !== b.limiterThreshold) return true;
  if (a.limiterCeiling !== b.limiterCeiling) return true;
  if (a.masterOutputGain !== b.masterOutputGain) return true;

  if (a.tracks.length !== b.tracks.length) return true;

  for (let i = 0; i < a.tracks.length; i++) {
    const ta = a.tracks[i];
    const tb = b.tracks[i];

    if (ta.id !== tb.id) return true;
    if (ta.name !== tb.name) return true;
    if (ta.volume !== tb.volume) return true;
    if (ta.pan !== tb.pan) return true;
    if (ta.muted !== tb.muted) return true;
    if (ta.soloed !== tb.soloed) return true;
    if (ta.layerTargetTrackId !== tb.layerTargetTrackId) return true;

    // drumLayerConfig
    if (!!ta.drumLayerConfig !== !!tb.drumLayerConfig) return true;
    if (ta.drumLayerConfig && tb.drumLayerConfig) {
      if (ta.drumLayerConfig.kickSubLayer !== tb.drumLayerConfig.kickSubLayer) return true;
      if (ta.drumLayerConfig.snareCrackLayer !== tb.drumLayerConfig.snareCrackLayer) return true;
      if (ta.drumLayerConfig.hihatSpread !== tb.drumLayerConfig.hihatSpread) return true;
      if (ta.drumLayerConfig.clapStack !== tb.drumLayerConfig.clapStack) return true;
    }

    // synthConfig
    if (!!ta.synthConfig !== !!tb.synthConfig) return true;
    if (ta.synthConfig && tb.synthConfig) {
      if (ta.synthConfig.oscillator !== tb.synthConfig.oscillator) return true;
      if (ta.synthConfig.attack !== tb.synthConfig.attack) return true;
      if (ta.synthConfig.decay !== tb.synthConfig.decay) return true;
      if (ta.synthConfig.sustain !== tb.synthConfig.sustain) return true;
      if (ta.synthConfig.release !== tb.synthConfig.release) return true;
      if (ta.synthConfig.cutoff !== tb.synthConfig.cutoff) return true;
      if (ta.synthConfig.resonance !== tb.synthConfig.resonance) return true;
      if (ta.synthConfig.delayTime !== tb.synthConfig.delayTime) return true;
      if (ta.synthConfig.delayFeedback !== tb.synthConfig.delayFeedback) return true;
      // Layering parameters
      if (ta.synthConfig.layer2Enabled !== tb.synthConfig.layer2Enabled) return true;
      if (ta.synthConfig.layer2Oscillator !== tb.synthConfig.layer2Oscillator) return true;
      if (ta.synthConfig.layer2Octave !== tb.synthConfig.layer2Octave) return true;
      if (ta.synthConfig.layer2Detune !== tb.synthConfig.layer2Detune) return true;
      if (ta.synthConfig.layer2Level !== tb.synthConfig.layer2Level) return true;
      if (ta.synthConfig.layer2Pan !== tb.synthConfig.layer2Pan) return true;
      if (ta.synthConfig.subEnabled !== tb.synthConfig.subEnabled) return true;
      if (ta.synthConfig.subOscillator !== tb.synthConfig.subOscillator) return true;
      if (ta.synthConfig.subOctave !== tb.synthConfig.subOctave) return true;
      if (ta.synthConfig.subLevel !== tb.synthConfig.subLevel) return true;
      if (ta.synthConfig.noiseLayerEnabled !== tb.synthConfig.noiseLayerEnabled) return true;
      if (ta.synthConfig.noiseType !== tb.synthConfig.noiseType) return true;
      if (ta.synthConfig.noiseLevel !== tb.synthConfig.noiseLevel) return true;
      if (ta.synthConfig.unisonVoices !== tb.synthConfig.unisonVoices) return true;
      if (ta.synthConfig.unisonDetune !== tb.synthConfig.unisonDetune) return true;
      if (ta.synthConfig.unisonSpread !== tb.synthConfig.unisonSpread) return true;
    }

    // drumState
    if (!!ta.drumState !== !!tb.drumState) return true;
    if (ta.drumState && tb.drumState) {
      const keys: ('kick'|'snare'|'hihat'|'clap')[] = ['kick', 'snare', 'hihat', 'clap'];
      for (const k of keys) {
        if (ta.drumState[k].length !== tb.drumState[k].length) return true;
        for (let step = 0; step < ta.drumState[k].length; step++) {
          if (ta.drumState[k][step] !== tb.drumState[k][step]) return true;
        }
      }
      if (!!ta.drumState.groove !== !!tb.drumState.groove) return true;
      if (ta.drumState.groove && tb.drumState.groove) {
        if (ta.drumState.groove.presetId !== tb.drumState.groove.presetId) return true;
        if (ta.drumState.groove.swing !== tb.drumState.groove.swing) return true;
        if (ta.drumState.groove.humanize !== tb.drumState.groove.humanize) return true;
        if (ta.drumState.groove.velocityDrift !== tb.drumState.groove.velocityDrift) return true;
      }
    }

    // midiNotes
    if (!!ta.midiNotes !== !!tb.midiNotes) return true;
    if (ta.midiNotes && tb.midiNotes) {
      if (ta.midiNotes.length !== tb.midiNotes.length) return true;
      for (let j = 0; j < ta.midiNotes.length; j++) {
        const na = ta.midiNotes[j];
        const nb = tb.midiNotes[j];
        if (na.id !== nb.id || na.pitch !== nb.pitch || na.step !== nb.step || na.duration !== nb.duration) {
          return true;
        }
      }
    }

    // clips
    if (!!ta.clips !== !!tb.clips) return true;
    if (ta.clips && tb.clips) {
      if (ta.clips.length !== tb.clips.length) return true;
      for (let j = 0; j < ta.clips.length; j++) {
        const ca = ta.clips[j];
        const cb = tb.clips[j];
        if (ca.id !== cb.id || ca.startStep !== cb.startStep || ca.durationSteps !== cb.durationSteps || ca.url !== cb.url) {
          return true;
        }
      }
    }

    // vsts
    if (!!ta.vsts !== !!tb.vsts) return true;
    if (ta.vsts && tb.vsts) {
      if (ta.vsts.length !== tb.vsts.length) return true;
      for (let j = 0; j < ta.vsts.length; j++) {
        const va = ta.vsts[j];
        const vb = tb.vsts[j];
        if (va.id !== vb.id || va.isEnabled !== vb.isEnabled) return true;
        if (va.parameters.length !== vb.parameters.length) return true;
        for (let p = 0; p < va.parameters.length; p++) {
          if (va.parameters[p].id !== vb.parameters[p].id || va.parameters[p].value !== vb.parameters[p].value) {
            return true;
          }
        }
      }
    }

    // automation
    if (!!ta.automation !== !!tb.automation) return true;
    if (ta.automation && tb.automation) {
      if (ta.automation.activeParam !== tb.automation.activeParam) return true;
      
      const checkAutomationArray = (arrA?: number[], arrB?: number[]) => {
        if (!!arrA !== !!arrB) return true;
        if (arrA && arrB) {
          if (arrA.length !== arrB.length) return true;
          for (let step = 0; step < arrA.length; step++) {
            if (arrA[step] !== arrB[step]) return true;
          }
        }
        return false;
      };

      if (checkAutomationArray(ta.automation.volume, tb.automation.volume)) return true;
      if (checkAutomationArray(ta.automation.pan, tb.automation.pan)) return true;
      if (checkAutomationArray(ta.automation.cutoff, tb.automation.cutoff)) return true;
    }
  }

  return false;
}

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && Array.isArray(parsed.tracks) && parsed.tracks.length > 0) {
          return parsed.tracks;
        }
      } catch (e) {
        console.error("Failed to load auto-saved tracks", e);
      }
    }
    // Initial 4 tracks
    return [
      {
        id: 'track-drums',
        name: 'Drums Sequencer',
        type: 'drums',
        volume: 0.8,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#f43f5e',
        drumState: {
          kick: Array(32).fill(false),
          snare: Array(32).fill(false),
          hihat: Array(32).fill(false),
          clap: Array(32).fill(false),
        }
      },
      {
        id: 'track-synth',
        name: 'Poly Lead Synth',
        type: 'synth',
        volume: 0.6,
        pan: -0.2,
        muted: false,
        soloed: false,
        color: '#a855f7',
        synthConfig: defaultSynthConfig,
        midiNotes: []
      },
      {
        id: 'track-bass',
        name: 'Acid Sub Bass',
        type: 'bass',
        volume: 0.7,
        pan: 0.2,
        muted: false,
        soloed: false,
        color: '#06b6d4',
        synthConfig: defaultBassConfig,
        midiNotes: []
      },
      {
        id: 'track-audio',
        name: 'AI Vocal & Audio Stem',
        type: 'audio',
        volume: 0.75,
        pan: 0,
        muted: false,
        soloed: false,
        color: '#ec4899',
        clips: []
      }
    ];
  });

  const [activeTrackId, setActiveTrackId] = useState<string>('track-drums');
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'mixer' | 'drums' | 'synth' | 'dual' | 'editor' | 'vst' | 'sampler'>('dual');
  const [dualSynthTrackId, setDualSynthTrackId] = useState<string>('track-synth');
  const [dualDrumsExpanded, setDualDrumsExpanded] = useState<boolean>(true);
  const [dualSynthExpanded, setDualSynthExpanded] = useState<boolean>(true);
  const [dualPianoRollExpanded, setDualPianoRollExpanded] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && typeof parsed.bpm === 'number') {
          return parsed.bpm;
        }
      } catch (e) {}
    }
    return 120;
  });
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    return localStorage.getItem('activeThemeId') || 'tech';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (activeThemeId === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('activeThemeId', activeThemeId);
  }, [activeThemeId]);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showKeyMap, setShowKeyMap] = useState<boolean>(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isChordTemplatesOpen, setIsChordTemplatesOpen] = useState<boolean>(false);
  const [isOpenSourceMaterialOpen, setIsOpenSourceMaterialOpen] = useState<boolean>(false);
  const [openSourceInitialCategory, setOpenSourceInitialCategory] = useState<'all' | 'drums' | 'synths' | 'fx' | 'loops' | 'vocals'>('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleOpenVstLinks = () => {
    setOpenSourceInitialCategory('synths');
    setIsOpenSourceMaterialOpen(true);
  };

  // Tap Tempo Handler (Calculates average timing across four clicks to set project BPM)
  const tapTimestampsRef = useRef<number[]>([]);
  const [tapCount, setTapCount] = useState<number>(0);
  const [isTapActive, setIsTapActive] = useState<boolean>(false);
  const tapResetTimeoutRef = useRef<any>(null);

  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimestampsRef.current;

    if (tapResetTimeoutRef.current) {
      clearTimeout(tapResetTimeoutRef.current);
    }

    // Reset if last tap was more than 2.5 seconds ago
    if (taps.length > 0 && (now - taps[taps.length - 1]) > 2500) {
      taps.length = 0;
    }

    taps.push(now);
    // Keep up to the 4 most recent clicks for a rolling 4-click average
    if (taps.length > 4) {
      taps.shift();
    }

    const currentTaps = taps.length;
    setTapCount(currentTaps);
    setIsTapActive(true);
    setTimeout(() => setIsTapActive(false), 120);

    // Calculate BPM if we have at least 2 clicks
    if (taps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      if (avgInterval > 0) {
        const calculatedBpm = Math.min(220, Math.max(50, Math.round(60000 / avgInterval)));
        setBpm(calculatedBpm);
        audioEngine.bpm = calculatedBpm;

        if (taps.length === 4) {
          showNotification(`Tap Tempo: ${calculatedBpm} BPM (4-click average)`, "success");
        }
      }
    }

    // Reset after 2.5 seconds of inactivity
    tapResetTimeoutRef.current = setTimeout(() => {
      taps.length = 0;
      setTapCount(0);
    }, 2500);
  };

  // Playback timer states & helper refs
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  useEffect(() => {
    let animationFrameId: number;
    
    if (isPlaying) {
      startTimeRef.current = performance.now() - (accumulatedTimeRef.current * 1000);
      
      const updateTimer = () => {
        const now = performance.now();
        const elapsed = (now - startTimeRef.current) / 1000;
        setElapsedSeconds(elapsed);
        animationFrameId = requestAnimationFrame(updateTimer);
      };
      
      animationFrameId = requestAnimationFrame(updateTimer);
    } else {
      accumulatedTimeRef.current = elapsedSeconds;
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying]);

  const formatPlaybackTime = (timeInSecs: number) => {
    const minutes = Math.floor(timeInSecs / 60);
    const seconds = Math.floor(timeInSecs % 60);
    const centiseconds = Math.floor((timeInSecs % 1) * 100);
    
    const pad = (num: number, size: number = 2) => num.toString().padStart(size, '0');
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  };

  const [activeDetailTab, setActiveDetailTab] = useState<'dual' | 'drums' | 'synth' | 'editor' | 'sampler' | 'vst' | 'automation' | 'ritual'>('dual');
  const [expandedAutomationTracks, setExpandedAutomationTracks] = useState<Record<string, boolean>>({});
  const analyserCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const masterGrBarRef = useRef<HTMLDivElement | null>(null);
  const masterGrTextRef = useRef<HTMLSpanElement | null>(null);
  const masterPeakLeftBarRef = useRef<HTMLDivElement | null>(null);
  const masterPeakRightBarRef = useRef<HTMLDivElement | null>(null);
  const masterPeakLeftClipRef = useRef<HTMLDivElement | null>(null);
  const masterPeakRightClipRef = useRef<HTMLDivElement | null>(null);
  const masterPeakDbTextRef = useRef<HTMLSpanElement | null>(null);

  // Equalizer states (Master parametric EQ)
  const [eqBass, setEqBass] = useState<number>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && parsed.eq && typeof parsed.eq.bass === 'number') {
          return parsed.eq.bass;
        }
      } catch (e) {}
    }
    return 0;
  });
  const [eqMid, setEqMid] = useState<number>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && parsed.eq && typeof parsed.eq.mid === 'number') {
          return parsed.eq.mid;
        }
      } catch (e) {}
    }
    return 0;
  });
  const [eqTreble, setEqTreble] = useState<number>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && parsed.eq && typeof parsed.eq.treble === 'number') {
          return parsed.eq.treble;
        }
      } catch (e) {}
    }
    return 0;
  });

  // Master Bus Compressor states
  const [compEnabled, setCompEnabled] = useState<boolean>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && parsed.compressor && typeof parsed.compressor.enabled === 'boolean') {
          return parsed.compressor.enabled;
        }
      } catch (e) {}
    }
    return true;
  });
  const [compThreshold, setCompThreshold] = useState<number>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && parsed.compressor && typeof parsed.compressor.threshold === 'number') {
          return parsed.compressor.threshold;
        }
      } catch (e) {}
    }
    return -12;
  });
  const [compRatio, setCompRatio] = useState<number>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && parsed.compressor && typeof parsed.compressor.ratio === 'number') {
          return parsed.compressor.ratio;
        }
      } catch (e) {}
    }
    return 3.0;
  });
  const [compAttack, setCompAttack] = useState<number>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && parsed.compressor && typeof parsed.compressor.attack === 'number') {
          return parsed.compressor.attack;
        }
      } catch (e) {}
    }
    return 0.012;
  });
  const [compRelease, setCompRelease] = useState<number>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && parsed.compressor && typeof parsed.compressor.release === 'number') {
          return parsed.compressor.release;
        }
      } catch (e) {}
    }
    return 0.15;
  });
 
  // Master Limiter states
  const [limiterEnabled, setLimiterEnabled] = useState<boolean>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && parsed.limiter && typeof parsed.limiter.enabled === 'boolean') {
          return parsed.limiter.enabled;
        }
      } catch (e) {}
    }
    return true;
  });
  const [limiterThreshold, setLimiterThreshold] = useState<number>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && parsed.limiter && typeof parsed.limiter.threshold === 'number') {
          return parsed.limiter.threshold;
        }
      } catch (e) {}
    }
    return -1.0;
  });
  const [limiterCeiling, setLimiterCeiling] = useState<number>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && parsed.limiter && typeof parsed.limiter.ceiling === 'number') {
          return parsed.limiter.ceiling;
        }
      } catch (e) {}
    }
    return -0.5;
  });

  // Master Output Gain state (trim before limiter)
  const [masterOutputGain, setMasterOutputGain] = useState<number>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && typeof parsed.masterOutputGain === 'number') {
          return parsed.masterOutputGain;
        }
      } catch (e) {}
    }
    return 0.0;
  });

  const [projectTitle, setProjectTitle] = useState<string>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && typeof parsed.title === 'string' && parsed.title.trim() !== '') {
          return parsed.title;
        }
      } catch (e) {}
    }
    return "DEMONSEED Track 01";
  });

  // Track active genre preset (e.g. underground dark subgenres, witchhouse)
  const [activePreset, setActivePreset] = useState<string | null>(() => {
    const savedProjectStr = localStorage.getItem('lyria_autosaved_project');
    if (savedProjectStr) {
      try {
        const parsed = JSON.parse(savedProjectStr);
        if (parsed && typeof parsed.activePreset === 'string') {
          return parsed.activePreset;
        }
      } catch (e) {}
    }
    return null;
  });

  // Visual indicator condition for Witch House preset
  const isWitchHouseActive = useMemo(() => {
    if (
      activePreset === 'witchhouse' || 
      activePreset === 'witch_house' || 
      activePreset === 'sys-witch-hop-ritual' ||
      activePreset === 'witch-hop'
    ) return true;
    // Check if project settings match Witch House criteria (66 BPM + dragging ghost snares or groove or title)
    if (bpm === 66) {
      const drumTrack = tracks.find(t => t.type === 'drums');
      if (drumTrack?.drumState) {
        const { kick, snare, groove } = drumTrack.drumState;
        if (groove?.presetId === 'witch_house_drag') return true;
        if (kick && snare && kick[10] && snare[8] && snare[24]) return true;
      }
      if (projectTitle.toLowerCase().includes('witch')) return true;
    }
    return false;
  }, [activePreset, bpm, tracks, projectTitle]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Tracks history state
  const [history, setHistory] = useState<{
    past: HistoryState[];
    future: HistoryState[];
  }>({ past: [], future: [] });

  // A ref to store the "last committed state" to compare against
  const lastCommittedStateRef = useRef<HistoryState | null>(null);

  // A ref to know if the state change was triggered by an Undo or Redo action
  const isApplyingHistoryRef = useRef<boolean>(false);

  const getCurrentHistoryState = (): HistoryState => {
    return {
      tracks: cloneTracks(tracks),
      bpm,
      eqBass,
      eqMid,
      eqTreble,
      compEnabled,
      compThreshold,
      compRatio,
      compAttack,
      compRelease,
      limiterEnabled,
      limiterThreshold,
      limiterCeiling,
      masterOutputGain,
    };
  };

  // Initial history state populate once tracks are loaded
  useEffect(() => {
    if (!lastCommittedStateRef.current && tracks && tracks.length > 0) {
      lastCommittedStateRef.current = getCurrentHistoryState();
    }
  }, [tracks, bpm, eqBass, eqMid, eqTreble, compEnabled, compThreshold, compRatio, compAttack, compRelease, limiterEnabled, limiterThreshold, limiterCeiling, masterOutputGain]);

  // Track state changes dynamically with a debounce of 800ms
  useEffect(() => {
    if (isApplyingHistoryRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      const currentState = getCurrentHistoryState();
      
      if (lastCommittedStateRef.current) {
        const hasChanged = didStateChange(lastCommittedStateRef.current, currentState);
        if (hasChanged) {
          setHistory(prev => ({
            past: [...prev.past, cloneHistoryState(lastCommittedStateRef.current!)].slice(-50), // keep last 50 steps
            future: []
          }));
          lastCommittedStateRef.current = currentState;
        }
      } else {
        lastCommittedStateRef.current = currentState;
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    tracks, bpm, 
    eqBass, eqMid, eqTreble, 
    compEnabled, compThreshold, compRatio, compAttack, compRelease, 
    limiterEnabled, limiterThreshold, limiterCeiling, masterOutputGain
  ]);

  const handleUndo = () => {
    if (history.past.length === 0) return;

    isApplyingHistoryRef.current = true;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);
    const current = getCurrentHistoryState();

    // Set the states
    setTracks(previous.tracks);
    setBpm(previous.bpm);
    setEqBass(previous.eqBass);
    setEqMid(previous.eqMid);
    setEqTreble(previous.eqTreble);
    setCompEnabled(previous.compEnabled);
    setCompThreshold(previous.compThreshold);
    setCompRatio(previous.compRatio);
    setCompAttack(previous.compAttack);
    setCompRelease(previous.compRelease);
    setLimiterEnabled(previous.limiterEnabled);
    setLimiterThreshold(previous.limiterThreshold);
    setLimiterCeiling(previous.limiterCeiling);
    setMasterOutputGain(previous.masterOutputGain ?? 0.0);

    setHistory({
      past: newPast,
      future: [current, ...history.future]
    });
    lastCommittedStateRef.current = cloneHistoryState(previous);

    // Release the lock
    setTimeout(() => {
      isApplyingHistoryRef.current = false;
    }, 100);
    
    showNotification("Action Undone", "info");
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;

    isApplyingHistoryRef.current = true;
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    const current = getCurrentHistoryState();

    // Set the states
    setTracks(next.tracks);
    setBpm(next.bpm);
    setEqBass(next.eqBass);
    setEqMid(next.eqMid);
    setEqTreble(next.eqTreble);
    setCompEnabled(next.compEnabled);
    setCompThreshold(next.compThreshold);
    setCompRatio(next.compRatio);
    setCompAttack(next.compAttack);
    setCompRelease(next.compRelease);
    setLimiterEnabled(next.limiterEnabled);
    setLimiterThreshold(next.limiterThreshold);
    setLimiterCeiling(next.limiterCeiling);
    setMasterOutputGain(next.masterOutputGain ?? 0.0);

    setHistory({
      past: [...history.past, current],
      future: newFuture
    });
    lastCommittedStateRef.current = cloneHistoryState(next);

    // Release the lock
    setTimeout(() => {
      isApplyingHistoryRef.current = false;
    }, 100);

    showNotification("Action Redone", "info");
  };

  // Global Keyboard Shortcuts (Space to Play/Pause, M for Mute, S for Solo, C for Compressor, Arrows/Numbers for Navigation, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Spacebar: Play/Pause
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          handlePause();
        } else {
          handlePlay();
        }
        return;
      }

      // Ctrl + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl + Shift + Z or Ctrl + Y: Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Escape: Close open modals
      if (e.key === 'Escape') {
        if (isTemplatesOpen) setIsTemplatesOpen(false);
        if (isChordTemplatesOpen) setIsChordTemplatesOpen(false);
        if (isOpenSourceMaterialOpen) setIsOpenSourceMaterialOpen(false);
        if (showHelp) setShowHelp(false);
        if (showKeyMap) setShowKeyMap(false);
        return;
      }

      // Shift + C: Open Chord Templates
      if (e.shiftKey && e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const targetTrack = tracks.find(t => t.id === activeTrackId && (t.type === 'synth' || t.type === 'bass'))
          || tracks.find(t => t.type === 'synth')
          || tracks[0];
        if (targetTrack && targetTrack.id !== activeTrackId) {
          setActiveTrackId(targetTrack.id);
        }
        setIsChordTemplatesOpen(prev => !prev);
        return;
      }

      // Ignore if standard modifiers (Ctrl, Meta, Alt) are held for single-character shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();

      // '?' / '/': Toggle Quick Key Map overlay
      if (key === '?' || (key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowKeyMap(prev => !prev);
        return;
      }

      // 'H' / 'h': Toggle Studio Manual Guide overlay
      if (key === 'h') {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      // 'M' / 'm': Toggle Mute on focused/active track in Mixer panel
      if (key === 'm') {
        e.preventDefault();
        const currentActive = tracks.find(t => t.id === activeTrackId);
        if (currentActive) {
          const newMuted = !currentActive.muted;
          handleUpdateTrack({ ...currentActive, muted: newMuted });
          showNotification(`[M] ${currentActive.name}: ${newMuted ? 'MUTED' : 'UNMUTED'}`, newMuted ? 'error' : 'success');
        }
        return;
      }

      // 'S' / 's': Toggle Solo on focused/active track in Mixer panel
      if (key === 's') {
        e.preventDefault();
        const currentActive = tracks.find(t => t.id === activeTrackId);
        if (currentActive) {
          const newSoloed = !currentActive.soloed;
          handleUpdateTrack({ ...currentActive, soloed: newSoloed });
          showNotification(`[S] ${currentActive.name}: ${newSoloed ? 'SOLO ACTIVE' : 'SOLO OFF'}`, newSoloed ? 'success' : 'info');
        }
        return;
      }

      // 'C' / 'c': Toggle Track Compressor on focused track
      if (key === 'c') {
        e.preventDefault();
        const currentActive = tracks.find(t => t.id === activeTrackId);
        if (currentActive) {
          const newComp = !(currentActive.compEnabled ?? false);
          handleUpdateTrack({ ...currentActive, compEnabled: newComp });
          showNotification(`[C] ${currentActive.name} Compressor: ${newComp ? 'ON' : 'OFF'}`, 'info');
        }
        return;
      }

      // 'F' / 'f': Toggle Focus Mode
      if (key === 'f') {
        e.preventDefault();
        setFocusMode(prev => {
          const next = !prev;
          showNotification(`[F] Focus Mode: ${next ? 'ENABLED' : 'DISABLED'}`, 'info');
          return next;
        });
        return;
      }

      // Arrow Up / Arrow Down: Navigate track selection in Mixer
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || key === 'j') {
        e.preventDefault();
        const currentIndex = tracks.findIndex(t => t.id === activeTrackId);
        if (currentIndex !== -1) {
          let nextIndex = currentIndex;
          if (e.key === 'ArrowUp') {
            nextIndex = (currentIndex - 1 + tracks.length) % tracks.length;
          } else {
            nextIndex = (currentIndex + 1) % tracks.length;
          }
          const nextTrack = tracks[nextIndex];
          if (nextTrack) {
            setActiveTrackId(nextTrack.id);
            showNotification(`Selected Track [${nextIndex + 1}]: ${nextTrack.name}`, 'info');
          }
        }
        return;
      }

      // Number keys 1-4: Select Track directly
      if (['1', '2', '3', '4'].includes(e.key)) {
        const trackIdx = parseInt(e.key, 10) - 1;
        if (tracks[trackIdx]) {
          const selectedTrack = tracks[trackIdx];
          setActiveTrackId(selectedTrack.id);
          if (selectedTrack.type === 'synth' || selectedTrack.type === 'bass') {
            setDualSynthTrackId(selectedTrack.id);
          }
          showNotification(`Selected Track [${e.key}]: ${selectedTrack.name}`, 'info');
        }
        return;
      }

      // Shift + D: Open Drum Machine
      if (e.shiftKey && (key === 'd' || key === 'D')) {
        e.preventDefault();
        const dt = tracks.find(t => t.type === 'drums');
        if (dt) setActiveTrackId(dt.id);
        setActiveSidebarTab('drums');
        setActiveDetailTab('drums');
        showNotification('Opened Drum Machine Sequencer [Shift+D]', 'success');
        return;
      }

      // Shift + S: Open Synth Designer
      if (e.shiftKey && (key === 's' || key === 'S')) {
        e.preventDefault();
        const st = tracks.find(t => t.type === 'synth') || tracks.find(t => t.type === 'bass');
        if (st) {
          setActiveTrackId(st.id);
          setDualSynthTrackId(st.id);
        }
        setActiveSidebarTab('synth');
        setActiveDetailTab('synth');
        showNotification('Opened Synth Designer [Shift+S]', 'success');
        return;
      }

      // Shift + W: Open Dual Workstation (Drums & Synth)
      if (e.shiftKey && (key === 'w' || key === 'W')) {
        e.preventDefault();
        setActiveSidebarTab('dual');
        setActiveDetailTab('dual');
        showNotification('Opened Dual Workstation: Drums & Synth [Shift+W]', 'success');
        return;
      }

      // Shift + R: Open The Ritual Lab & Flow Generator
      if (e.shiftKey && (key === 'r' || key === 'R')) {
        e.preventDefault();
        setActiveDetailTab('ritual');
        showNotification('Opened The Ritual Lab & Flow Chamber [Shift+R]', 'success');
        return;
      }

      // '[' / ']': Volume Adjustments
      if (e.key === '[' || e.key === ']' || e.key === '-' || e.key === '=' || e.key === '+') {
        e.preventDefault();
        const currentActive = tracks.find(t => t.id === activeTrackId);
        if (currentActive) {
          const delta = (e.key === ']' || e.key === '=' || e.key === '+') ? 0.05 : -0.05;
          const newVol = Math.max(0, Math.min(1, Math.round((currentActive.volume + delta) * 100) / 100));
          handleUpdateTrack({ ...currentActive, volume: newVol });
          showNotification(`[${currentActive.name}] Vol: ${Math.round(newVol * 100)}%`, 'info');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, history, tracks, activeTrackId, focusMode, isTemplatesOpen, isChordTemplatesOpen, isOpenSourceMaterialOpen, showHelp, showKeyMap]);

  // Synchronize Master EQ values to audioEngine
  useEffect(() => {
    audioEngine.setEQ(eqBass, eqMid, eqTreble);
  }, [eqBass, eqMid, eqTreble]);

  // Synchronize Master Compressor values to audioEngine
  useEffect(() => {
    audioEngine.setMasterCompressor(compEnabled, compThreshold, compRatio, compAttack, compRelease);
  }, [compEnabled, compThreshold, compRatio, compAttack, compRelease]);

  // Synchronize Master Limiter values to audioEngine
  useEffect(() => {
    audioEngine.setMasterLimiter(limiterEnabled, limiterThreshold, limiterCeiling);
  }, [limiterEnabled, limiterThreshold, limiterCeiling]);

  // Synchronize Master Output Gain (trim before limiter) to audioEngine
  useEffect(() => {
    audioEngine.setMasterOutputGain(masterOutputGain);
  }, [masterOutputGain]);

  // Auto-Save state and periodic storage effect
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('lyria_autosave_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('lyria_autosave_enabled', JSON.stringify(autoSaveEnabled));
  }, [autoSaveEnabled]);

  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(() => {
      try {
        const projectData = {
          title: projectTitle,
          bpm,
          tracks,
          eq: {
            bass: eqBass,
            mid: eqMid,
            treble: eqTreble
          },
          compressor: {
            enabled: compEnabled,
            threshold: compThreshold,
            ratio: compRatio,
            attack: compAttack,
            release: compRelease
          },
          limiter: {
            enabled: limiterEnabled,
            threshold: limiterThreshold,
            ceiling: limiterCeiling
          },
          masterOutputGain,
          activePreset: isWitchHouseActive ? 'witchhouse' : activePreset,
          savedAt: Date.now()
        };
        localStorage.setItem('lyria_autosaved_project', JSON.stringify(projectData));
      } catch (error) {
        console.error("Auto-Save failed:", error);
      }
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(interval);
  }, [autoSaveEnabled, projectTitle, bpm, tracks, eqBass, eqMid, eqTreble, compEnabled, compThreshold, compRatio, compAttack, compRelease, limiterEnabled, limiterThreshold, limiterCeiling, masterOutputGain]);

  // Real-time frequency spectrum analyzer animation loop
  useEffect(() => {
    let animationFrameId: number;
    let leftClipHoldTime = 0;
    let rightClipHoldTime = 0;

    const drawSpectrum = () => {
      animationFrameId = requestAnimationFrame(drawSpectrum);

      const canvas = analyserCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const analyser = audioEngine.analyser;
      if (!analyser) {
        // Flatline / silent visual state
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#1f1f2e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 2);
        ctx.lineTo(canvas.width, canvas.height - 2);
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      // We only care about the audible spectrum's bass/mid/treble, which lives in the first 75% of bins
      const binsToRender = Math.floor(bufferLength * 0.75);
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      // Dark background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle decorative gridlines
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 0.5;
      for (let y = 10; y < height; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const barWidth = width / binsToRender;
      let x = 0;

      for (let i = 0; i < binsToRender; i++) {
        const val = dataArray[i];
        // Scale to canvas height
        const barHeight = (val / 255) * (height - 2);

        if (barHeight > 0) {
          // Magenta/purple neon spectrum visual gradient
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#c084fc'); // Light Purple
          gradient.addColorStop(0.6, '#d946ef'); // Magenta Accent
          gradient.addColorStop(1, '#ff8bf5'); // High Bright Pink

          ctx.fillStyle = gradient;
          // Draw neat spectral bar with a tiny 1px spacing gap
          ctx.fillRect(x, height - barHeight, barWidth - 0.75, barHeight);
        }

        x += barWidth;
      }

      // Update Master Compressor Live Metering
      let reductionDb = 0;
      if (audioEngine.isPlaying && audioEngine.compEnabled && audioEngine.masterCompressor) {
        const reductionNode = audioEngine.masterCompressor.reduction;
        if (reductionNode !== undefined) {
          if (typeof reductionNode === 'number') {
            reductionDb = reductionNode;
          } else if (reductionNode && typeof (reductionNode as any).value === 'number') {
            reductionDb = (reductionNode as any).value;
          }
        }
      }

      // Update DOM nodes directly for ultra-performance
      if (masterGrTextRef.current) {
        masterGrTextRef.current.textContent = `${Math.abs(reductionDb).toFixed(1)} dB`;
      }

      if (masterGrBarRef.current) {
        // Scale 0dB to -24dB as percentage (0% to 100% width)
        const maxDb = -24;
        const ratio = Math.max(0, Math.min(1, reductionDb / maxDb));
        masterGrBarRef.current.style.width = `${ratio * 100}%`;
      }

      // Update Master Peak Level Meter
      let peakDb = -99;
      let percentL = 0;
      let percentR = 0;

      if (audioEngine.isPlaying && analyser) {
        const timeData = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(timeData);

        let maxVal = 0;
        for (let i = 0; i < timeData.length; i++) {
          const sample = Math.abs(timeData[i] - 128);
          if (sample > maxVal) {
            maxVal = sample;
          }
        }

        const rawPeak = maxVal / 128;
        peakDb = rawPeak > 0 ? 20 * Math.log10(rawPeak) : -99;

        // Peak Meter scale mapping: -40 dB is 0%, 0 dB is 95%, +3 dB is 100%.
        const minDb = -40;
        const maxDb = 3;
        if (peakDb > minDb) {
          percentL = ((peakDb - minDb) / (maxDb - minDb)) * 100;
        }
        percentL = Math.max(0, Math.min(100, percentL));

        // Create independent organic L/R dancing variation
        const nowMs = Date.now() * 0.005;
        const variation = (Math.sin(nowMs) * 3) + (Math.cos(nowMs * 1.6) * 1.5);
        percentR = percentL > 0 ? percentL + variation : 0;
        percentR = Math.max(0, Math.min(100, percentR));

        // Clip lights (hold for 1.5 seconds)
        const now = Date.now();
        if (peakDb >= 0) {
          leftClipHoldTime = now + 1500;
          rightClipHoldTime = now + 1500;
        }

        if (now < leftClipHoldTime) {
          if (masterPeakLeftClipRef.current) {
            masterPeakLeftClipRef.current.style.backgroundColor = '#ef4444';
            masterPeakLeftClipRef.current.style.borderColor = '#fecdd3';
            masterPeakLeftClipRef.current.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.9)';
          }
        } else {
          if (masterPeakLeftClipRef.current) {
            masterPeakLeftClipRef.current.style.backgroundColor = '#18181b';
            masterPeakLeftClipRef.current.style.borderColor = '#27272a';
            masterPeakLeftClipRef.current.style.boxShadow = 'none';
          }
        }

        if (now < rightClipHoldTime) {
          if (masterPeakRightClipRef.current) {
            masterPeakRightClipRef.current.style.backgroundColor = '#ef4444';
            masterPeakRightClipRef.current.style.borderColor = '#fecdd3';
            masterPeakRightClipRef.current.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.9)';
          }
        } else {
          if (masterPeakRightClipRef.current) {
            masterPeakRightClipRef.current.style.backgroundColor = '#18181b';
            masterPeakRightClipRef.current.style.borderColor = '#27272a';
            masterPeakRightClipRef.current.style.boxShadow = 'none';
          }
        }
      } else {
        // Flatline silent state
        if (masterPeakLeftClipRef.current) {
          masterPeakLeftClipRef.current.style.backgroundColor = '#18181b';
          masterPeakLeftClipRef.current.style.borderColor = '#27272a';
          masterPeakLeftClipRef.current.style.boxShadow = 'none';
        }
        if (masterPeakRightClipRef.current) {
          masterPeakRightClipRef.current.style.backgroundColor = '#18181b';
          masterPeakRightClipRef.current.style.borderColor = '#27272a';
          masterPeakRightClipRef.current.style.boxShadow = 'none';
        }
      }

      // Update Meter Bars
      if (masterPeakLeftBarRef.current) {
        masterPeakLeftBarRef.current.style.width = `${percentL}%`;
      }
      if (masterPeakRightBarRef.current) {
        masterPeakRightBarRef.current.style.width = `${percentR}%`;
      }
      if (masterPeakDbTextRef.current) {
        if (peakDb <= -90) {
          masterPeakDbTextRef.current.textContent = '-INF dB';
        } else {
          masterPeakDbTextRef.current.textContent = `${peakDb.toFixed(1)} dB`;
        }
      }
    };

    drawSpectrum();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Export current DAW project state as a JSON file
  const handleExportProject = () => {
    try {
      const projectData = {
        name: "Lyria Studio Project",
        version: "1.0",
        title: projectTitle,
        bpm,
        tracks,
        eq: {
          bass: eqBass,
          mid: eqMid,
          treble: eqTreble
        },
        compressor: {
          enabled: compEnabled,
          threshold: compThreshold,
          ratio: compRatio,
          attack: compAttack,
          release: compRelease
        },
        limiter: {
          enabled: limiterEnabled,
          threshold: limiterThreshold,
          ceiling: limiterCeiling
        },
        masterOutputGain
      };
      const jsonString = JSON.stringify(projectData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const sanitizedTitle = projectTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const filename = `${sanitizedTitle || 'lyria-project'}-${bpm}bpm.json`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification("Project exported successfully as JSON file!", "success");
    } catch (error) {
      console.error("Export failed:", error);
      showNotification("Failed to export DAW project.", "error");
    }
  };

  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Mixes down all active tracks into a single downloadable .wav file
  const handleRenderWav = async () => {
    if (isRendering) return;
    setIsRendering(true);
    showNotification("Rendering high-quality 16-bit WAV mixdown...", "info");

    try {
      // Pause active playback so it doesn't clash with the render
      handlePause();

      const wavBlob = await audioEngine.renderToWav();
      const url = URL.createObjectURL(wavBlob);

      const sanitizedTitle = projectTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const filename = `${sanitizedTitle || 'lyria-studio-mixdown'}-${bpm}bpm.wav`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification("WAV rendering complete! Download started.", "success");
    } catch (error) {
      console.error("WAV render failed:", error);
      showNotification("Failed to render project to WAV.", "error");
    } finally {
      setIsRendering(false);
    }
  };

  // Import a previously exported DAW project JSON file
  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        let importedTracks: Track[] = [];
        let importedBpm = bpm;
        let importedEq = { bass: 0, mid: 0, treble: 0 };
        let importedCompressor = { enabled: true, threshold: -12, ratio: 3.0, attack: 0.012, release: 0.15 };
        let importedLimiter = { enabled: true, threshold: -1.0, ceiling: -0.5 };
        let importedMasterOutputGain = 0.0;
        let importedTitle = "Imported Project";

        if (Array.isArray(parsed)) {
          importedTracks = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.tracks)) {
            importedTracks = parsed.tracks;
          } else {
            throw new Error("Invalid project structure. Missing tracks array.");
          }
          if (typeof parsed.bpm === 'number') {
            importedBpm = parsed.bpm;
          }
          if (typeof parsed.title === 'string' && parsed.title.trim() !== '') {
            importedTitle = parsed.title;
          }
          if (typeof parsed.masterOutputGain === 'number') {
            importedMasterOutputGain = parsed.masterOutputGain;
          }
          if (parsed.eq && typeof parsed.eq === 'object') {
            importedEq = {
              bass: typeof parsed.eq.bass === 'number' ? parsed.eq.bass : 0,
              mid: typeof parsed.eq.mid === 'number' ? parsed.eq.mid : 0,
              treble: typeof parsed.eq.treble === 'number' ? parsed.eq.treble : 0,
            };
          }
          if (parsed.compressor && typeof parsed.compressor === 'object') {
            importedCompressor = {
              enabled: typeof parsed.compressor.enabled === 'boolean' ? parsed.compressor.enabled : true,
              threshold: typeof parsed.compressor.threshold === 'number' ? parsed.compressor.threshold : -12,
              ratio: typeof parsed.compressor.ratio === 'number' ? parsed.compressor.ratio : 3.0,
              attack: typeof parsed.compressor.attack === 'number' ? parsed.compressor.attack : 0.012,
              release: typeof parsed.compressor.release === 'number' ? parsed.compressor.release : 0.15,
            };
          }
          if (parsed.limiter && typeof parsed.limiter === 'object') {
            importedLimiter = {
              enabled: typeof parsed.limiter.enabled === 'boolean' ? parsed.limiter.enabled : true,
              threshold: typeof parsed.limiter.threshold === 'number' ? parsed.limiter.threshold : -1.0,
              ceiling: typeof parsed.limiter.ceiling === 'number' ? parsed.limiter.ceiling : -0.5,
            };
          }
        } else {
          throw new Error("Invalid JSON structure.");
        }

        if (importedTracks.length === 0) {
          throw new Error("Project contains zero tracks.");
        }

        // Set state
        setTracks(importedTracks);
        setBpm(importedBpm);
        setProjectTitle(importedTitle);
        setEqBass(importedEq.bass);
        setEqMid(importedEq.mid);
        setEqTreble(importedEq.treble);
        
        setCompEnabled(importedCompressor.enabled);
        setCompThreshold(importedCompressor.threshold);
        setCompRatio(importedCompressor.ratio);
        setCompAttack(importedCompressor.attack);
        setCompRelease(importedCompressor.release);

        setLimiterEnabled(importedLimiter.enabled);
        setLimiterThreshold(importedLimiter.threshold);
        setLimiterCeiling(importedLimiter.ceiling);
        setMasterOutputGain(importedMasterOutputGain);
        
        audioEngine.setTracks(importedTracks);
        audioEngine.bpm = importedBpm;
        audioEngine.setEQ(importedEq.bass, importedEq.mid, importedEq.treble);
        audioEngine.setMasterCompressor(
          importedCompressor.enabled,
          importedCompressor.threshold,
          importedCompressor.ratio,
          importedCompressor.attack,
          importedCompressor.release
        );
        audioEngine.setMasterLimiter(
          importedLimiter.enabled,
          importedLimiter.threshold,
          importedLimiter.ceiling
        );
        audioEngine.setMasterOutputGain(importedMasterOutputGain);

        // Reset active track if not present in imported tracks
        if (!importedTracks.some(t => t.id === activeTrackId)) {
          setActiveTrackId(importedTracks[0].id);
        }

        showNotification("Project imported successfully!", "success");
      } catch (err: any) {
        console.error("Error importing project file:", err);
        showNotification(err.message || "Failed to parse project JSON file.", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Active theme object
  const currentTheme = THEMES.find(t => t.id === activeThemeId) || THEMES[0];

  // Sync state to AudioEngine
  useEffect(() => {
    audioEngine.setTracks(tracks);
  }, [tracks]);

  useEffect(() => {
    audioEngine.bpm = bpm;
  }, [bpm]);

  // Handle Playhead stepping
  useEffect(() => {
    audioEngine.onStepChange = (step) => {
      setCurrentStep(step);
    };
  }, []);

  const activeTrack = tracks.find(t => t.id === activeTrackId) || tracks[0];
  const drumTrack = tracks.find(t => t.type === 'drums') || tracks[0];
  const activeSynthTrack = tracks.find(t => t.id === dualSynthTrackId && (t.type === 'synth' || t.type === 'bass')) 
    || (activeTrack.type === 'synth' || activeTrack.type === 'bass' ? activeTrack : null)
    || tracks.find(t => t.type === 'synth') 
    || tracks.find(t => t.type === 'bass') 
    || tracks[1] || tracks[0];

  // Transport Control handlers
  const handlePlay = () => {
    audioEngine.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    audioEngine.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentStep(0);
    setElapsedSeconds(0);
    accumulatedTimeRef.current = 0;
  };

  // Channel strip update handler
  const handleUpdateTrack = (updatedTrack: Track) => {
    setTracks(prev => prev.map(t => t.id === updatedTrack.id ? updatedTrack : t));
  };

  // Drum step update handler
  const handleUpdateDrumState = (drumState: DrumTrackState, targetTrackId?: string) => {
    const drumTrackId = targetTrackId || (activeTrack?.type === 'drums' ? activeTrack.id : (tracks.find(t => t.type === 'drums')?.id || 'track-drums'));
    setTracks(prev => prev.map(t => (t.id === drumTrackId) ? { ...t, drumState, grooveConfig: drumState.groove } : t));
  };

  // MIDI Note update handler
  const handleUpdateMidiNotes = (trackId: string, midiNotes: MidiNote[]) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, midiNotes } : t));
  };

  // Synth voice config update handler
  const handleUpdateSynthConfig = (trackId: string, synthConfig: SynthConfig) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, synthConfig } : t));
  };

  // Track VSTs update handler
  const handleUpdateTrackVsts = (trackId: string, vsts: VstPlugin[]) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, vsts } : t));
  };

  // Track automation update handler
  const handleUpdateTrackAutomation = (trackId: string, automation: TrackAutomation) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, automation } : t));
  };

  // AI Clip adder
  const handleAddAudioClip = (clip: AudioClip) => {
    setTracks(prev => prev.map(t => {
      if (t.id === 'track-audio') {
        return {
          ...t,
          clips: [...(t.clips || []), clip]
        };
      }
      return t;
    }));
  };

  const handleRemoveClip = (clipId: string) => {
    setTracks(prev => prev.map(t => {
      if (t.id === 'track-audio') {
        return {
          ...t,
          clips: (t.clips || []).filter(c => c.id !== clipId)
        };
      }
      return t;
    }));
  };

  // Load a named preset template
  const handleLoadTemplate = (template: PresetTemplate) => {
    handleStop();

    // Deep clone the tracks to avoid state reference pollution
    const newTracks: Track[] = JSON.parse(JSON.stringify(template.tracks));
    
    setBpm(template.bpm);
    setTracks(newTracks);
    audioEngine.setTracks(newTracks);
    audioEngine.bpm = template.bpm;

    if (template.eq) {
      setEqBass(template.eq.bass);
      setEqMid(template.eq.mid);
      setEqTreble(template.eq.treble);
      audioEngine.setEQ(template.eq.bass, template.eq.mid, template.eq.treble);
    }

    // Default active track to first one or stay on current if valid
    if (newTracks.length > 0) {
      if (!newTracks.some(t => t.id === activeTrackId)) {
        setActiveTrackId(newTracks[0].id);
      }
    }

    if (template.name.toLowerCase().includes('witch') || template.id.toLowerCase().includes('witch') || template.genre?.toLowerCase().includes('witch')) {
      setActivePreset('witchhouse');
    } else {
      setActivePreset(template.id);
    }

    showNotification(`Template "${template.name}" loaded!`, "success");
  };

  // Load preset projects to make it customizable and instant-play
  const loadPreset = (presetType: string) => {
    handleStop();

    // 1. Check if presetType matches any dark underground preset
    const darkMatch = DARK_PRESETS.find(p => 
      p.id === presetType || 
      p.genre?.toLowerCase() === presetType.toLowerCase() ||
      p.category?.toLowerCase() === presetType.toLowerCase() ||
      p.id.toLowerCase().includes(presetType.toLowerCase()) ||
      (presetType === 'industrial' && p.id.includes('industrial')) ||
      (presetType === 'horrorcore' && p.id.includes('horrorcore')) ||
      (presetType === 'phonk' && p.id.includes('phonk')) ||
      (presetType === 'witch-hop' && p.id.includes('witch-hop')) ||
      (presetType === 'dungeon' && p.id.includes('dungeon')) ||
      (presetType === 'sigilcore' && p.id.includes('sigilcore')) ||
      (presetType === 'metalstep' && p.id.includes('metalstep'))
    );

    if (darkMatch && presetType !== 'witchhouse') {
      handleLoadTemplate(darkMatch);
      setActivePreset(darkMatch.id);
      return;
    }

    let newBpm = 120;
    let newTracks: Track[] = [...tracks];

    if (presetType === 'techno') {
      newBpm = 128;
      // Kick: simple driving 4-on-floor
      const kick = Array(32).fill(false);
      const snare = Array(32).fill(false);
      const hihat = Array(32).fill(false);
      const clap = Array(32).fill(false);
      for (let i = 0; i < 32; i++) {
        if (i % 4 === 0) kick[i] = true;
        if (i % 8 === 4) snare[i] = true;
        if (i % 2 === 1) hihat[i] = true; // rapid off-beat hat
        if (i === 12 || i === 28) clap[i] = true;
      }

      // Synth: minor chords riff
      const midiNotes: MidiNote[] = [
        { id: '1', pitch: 'C4', step: 0, duration: 2 },
        { id: '2', pitch: 'E4', step: 4, duration: 2 },
        { id: '3', pitch: 'G4', step: 8, duration: 4 },
        { id: '4', pitch: 'C4', step: 16, duration: 2 },
        { id: '5', pitch: 'D#4', step: 20, duration: 2 },
        { id: '6', pitch: 'G4', step: 24, duration: 4 },
      ];

      // Bass sub-groove
      const bassNotes: MidiNote[] = [];
      for (let s = 0; s < 32; s += 2) {
        if (s % 8 !== 0) { // skip exact kick hits for bass side-chain effect
          const pitch = s % 16 < 8 ? 'C3' : 'D#3';
          bassNotes.push({ id: `b-${s}`, pitch, step: s, duration: 1 });
        }
      }

      newTracks = [
        { ...tracks[0], drumState: { kick, snare, hihat, clap } },
        { ...tracks[1], midiNotes, synthConfig: { ...defaultSynthConfig, cutoff: 3500, decay: 0.15, delayFeedback: 0.45 } },
        { ...tracks[2], midiNotes: bassNotes, synthConfig: { ...defaultBassConfig, cutoff: 450, resonance: 8.0 } },
        { ...tracks[3], clips: [] }
      ];
    } 
    else if (presetType === 'lofi') {
      newBpm = 80;
      // Soft relaxed hip-hop beat
      const kick = Array(32).fill(false);
      const snare = Array(32).fill(false);
      const hihat = Array(32).fill(false);
      const clap = Array(32).fill(false);
      
      kick[0] = true; kick[10] = true; kick[16] = true; kick[26] = true;
      snare[8] = true; snare[24] = true;
      for (let i = 0; i < 32; i += 4) {
        hihat[i] = true;
        if (i % 8 === 2) hihat[i + 2] = true;
      }

      // Mellow synth chords (Rhodes vibe)
      const midiNotes: MidiNote[] = [
        { id: 'l1', pitch: 'F4', step: 0, duration: 8 },
        { id: 'l2', pitch: 'A4', step: 0, duration: 8 },
        { id: 'l3', pitch: 'C5', step: 0, duration: 8 },
        { id: 'l4', pitch: 'G4', step: 16, duration: 8 },
        { id: 'l5', pitch: 'B4', step: 16, duration: 8 },
        { id: 'l6', pitch: 'D5', step: 16, duration: 8 },
      ];

      const bassNotes: MidiNote[] = [
        { id: 'lb1', pitch: 'F3', step: 0, duration: 12 },
        { id: 'lb2', pitch: 'G3', step: 16, duration: 12 },
      ];

      newTracks = [
        { ...tracks[0], drumState: { kick, snare, hihat, clap } },
        { ...tracks[1], midiNotes, synthConfig: { ...defaultSynthConfig, oscillator: 'triangle', attack: 0.6, cutoff: 1200, delayFeedback: 0.6, delayTime: 0.4 } },
        { ...tracks[2], midiNotes: bassNotes, synthConfig: { ...defaultBassConfig, oscillator: 'sine', cutoff: 200, resonance: 1.0 } },
        { ...tracks[3], clips: [] }
      ];
    }
    else if (presetType === 'house') {
      newBpm = 120;
      const kick = Array(32).fill(false);
      const snare = Array(32).fill(false);
      const hihat = Array(32).fill(false);
      const clap = Array(32).fill(false);
      for (let i = 0; i < 32; i++) {
        if (i % 4 === 0) kick[i] = true;
        if (i % 8 === 4) clap[i] = true;
        if (i % 4 === 2) hihat[i] = true; // standard off-beat house hihat
      }

      const midiNotes: MidiNote[] = [
        { id: 'h1', pitch: 'A4', step: 2, duration: 2 },
        { id: 'h2', pitch: 'C5', step: 6, duration: 2 },
        { id: 'h3', pitch: 'E5', step: 10, duration: 2 },
        { id: 'h4', pitch: 'D5', step: 14, duration: 4 },
        { id: 'h5', pitch: 'A4', step: 18, duration: 2 },
        { id: 'h6', pitch: 'C5', step: 22, duration: 2 },
        { id: 'h7', pitch: 'E5', step: 26, duration: 2 },
        { id: 'h8', pitch: 'G5', step: 30, duration: 2 },
      ];

      const bassNotes: MidiNote[] = [];
      for (let s = 0; s < 32; s += 4) {
        bassNotes.push({ id: `hb-${s}`, pitch: 'A3', step: s + 2, duration: 2 });
      }

      newTracks = [
        { ...tracks[0], drumState: { kick, snare, hihat, clap } },
        { ...tracks[1], midiNotes, synthConfig: { ...defaultSynthConfig, oscillator: 'sawtooth', attack: 0.05, decay: 0.1, sustain: 0.5, cutoff: 4000 } },
        { ...tracks[2], midiNotes: bassNotes, synthConfig: { ...defaultBassConfig, oscillator: 'sawtooth', cutoff: 600, resonance: 4.0 } },
        { ...tracks[3], clips: [] }
      ];
    }
    else if (presetType === 'witchhouse') {
      newBpm = 66;
      // Dragging 808 beats with sluggish snare and fast skittering rolls
      const kick = Array(32).fill(false);
      const snare = Array(32).fill(false);
      const hihat = Array(32).fill(false);
      const clap = Array(32).fill(false);

      kick[0] = true;
      kick[10] = true;
      kick[16] = true;
      kick[26] = true;

      snare[8] = true;
      snare[24] = true;
      snare[30] = true; // ghost snare

      clap[8] = true;
      clap[24] = true;

      // Trap rolls and dragged hats
      for (let i = 0; i < 32; i++) {
        if (i % 2 === 0) hihat[i] = true;
        if (i >= 12 && i <= 15) hihat[i] = true; // rapid triplet roll
        if (i >= 28 && i <= 31) hihat[i] = true; // rapid roll
      }

      // Haunted C Harmonic Minor chord progression
      const midiNotes: MidiNote[] = [
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
      ];

      const bassNotes: MidiNote[] = [
        { id: 'whb-1', pitch: 'C2', step: 0, duration: 6 },
        { id: 'whb-2', pitch: 'B1', step: 6, duration: 2 },
        { id: 'whb-3', pitch: 'G#1', step: 8, duration: 6 },
        { id: 'whb-4', pitch: 'G1', step: 14, duration: 2 },
        { id: 'whb-5', pitch: 'C2', step: 16, duration: 8 },
        { id: 'whb-6', pitch: 'D#2', step: 24, duration: 4 },
        { id: 'whb-7', pitch: 'D2', step: 28, duration: 4 }
      ];

      newTracks = [
        { ...tracks[0], drumState: { kick, snare, hihat, clap } },
        { ...tracks[1], midiNotes, synthConfig: { ...defaultSynthConfig, oscillator: 'sawtooth', attack: 0.12, decay: 0.45, sustain: 0.65, release: 0.55, cutoff: 2100, resonance: 5.5, delayTime: 0.45, delayFeedback: 0.55 } },
        { ...tracks[2], midiNotes: bassNotes, synthConfig: { ...defaultBassConfig, oscillator: 'square', attack: 0.06, decay: 0.4, sustain: 0.85, release: 0.35, cutoff: 360, resonance: 3.8 } },
        { ...tracks[3], clips: [] }
      ];
    }

    setBpm(newBpm);
    setTracks(newTracks);
    audioEngine.setTracks(newTracks);
    audioEngine.bpm = newBpm;
    setActivePreset(presetType);
    if (presetType === 'witchhouse') {
      showNotification("† Witch House Preset Activated: 66 BPM, 808 Drag, Ghost Snares & Occult Atmosphere †", "success");
    } else {
      showNotification(`Loaded ${presetType.toUpperCase()} preset (${newBpm} BPM)`, "info");
    }
    console.info(`Loaded preset: ${presetType}`);
  };

  const handlePresetSelectFromSequencer = (p: string) => {
    if (p === 'witchhouse' || p === 'witch_house') {
      setActivePreset('witchhouse');
      showNotification("† Witch House Beat Profile Activated: 66 BPM, Ghost Snares & Occult Drag †", "success");
    } else {
      const darkMatch = DARK_PRESETS.find(dp => 
        dp.id === p || 
        dp.genre?.toLowerCase() === p.toLowerCase() || 
        dp.category?.toLowerCase() === p.toLowerCase()
      );
      if (darkMatch) {
        setActivePreset(darkMatch.id);
        showNotification(`⚡ ${darkMatch.name} (${darkMatch.bpm} BPM) Activated on Step Matrix`, "success");
      } else {
        setActivePreset(p);
      }
    }
  };

  const displayBar = Math.floor(currentStep / 16) + 1;
  const displayBeat = Math.floor((currentStep % 16) / 4) + 1;
  const displayStepInBeat = (currentStep % 4) + 1;
  const formattedBarPosition = `${displayBar.toString().padStart(2, '0')}.${displayBeat.toString().padStart(2, '0')}.${displayStepInBeat.toString().padStart(2, '0')}`;

  const anySoloed = tracks.some(t => t.soloed);

  // Scroll position state for scroll-to-top indicators
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  useEffect(() => {
    const handleScrollCheck = () => {
      const winY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      let maxInnerY = 0;
      const scrollableElements = document.querySelectorAll('main, section.overflow-y-auto, .timeline-hatch');
      scrollableElements.forEach(el => {
        if (el.scrollTop > maxInnerY) maxInnerY = el.scrollTop;
      });
      setIsScrolledDown(winY > 60 || maxInnerY > 60);
    };

    window.addEventListener('scroll', handleScrollCheck, { passive: true });
    document.addEventListener('scroll', handleScrollCheck, { passive: true });
    const scrollableElements = document.querySelectorAll('main, section.overflow-y-auto, .timeline-hatch');
    scrollableElements.forEach(el => el.addEventListener('scroll', handleScrollCheck, { passive: true }));

    return () => {
      window.removeEventListener('scroll', handleScrollCheck);
      document.removeEventListener('scroll', handleScrollCheck);
      scrollableElements.forEach(el => el.removeEventListener('scroll', handleScrollCheck));
    };
  }, []);

  const handleScrollToTop = () => {
    // Smoothly scroll window and root elements to top
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    // Smoothly scroll any scrollable sub-panels (arranger timeline, mixer, synth/drum racks) to top
    const internalContainers = document.querySelectorAll('main, main section, .overflow-y-auto, .timeline-hatch, [data-scroll-container]');
    internalContainers.forEach(container => {
      container.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });

    showNotification('Scrolled to Top', 'info');
  };

  return (
    <div className="min-h-screen bg-bg grid-bg flex flex-col font-mono relative select-none text-ink">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : notification.type === 'error'
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            : 'bg-zinc-800/80 border-zinc-700 text-zinc-300'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            notification.type === 'success' ? 'bg-emerald-400' : notification.type === 'error' ? 'bg-rose-400' : 'bg-zinc-400'
          }`} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Upper control bar & branding - DEMONSEED | Variation 15 Cyber-Acoustic Terminal */}
      {/* Upper control bar & branding - DEMONSEED | Variation 8 Cyber-Acoustic Terminal */}
      <header className="top-bar select-none shrink-0">
        <div className="logo-area">
          <div
            className="logo-txt cursor-pointer select-none"
            style={{
              backgroundColor: '#171716',
              color: '#11eaf2',
              fontFamily: 'Arial',
            }}
            onClick={() => setActiveDetailTab('dual')}
            title="DEMONSEED Cyber-Acoustic Terminal"
          >
            DEMONSEED_TERMINAL
          </div>
          <div className="system-tags hidden md:flex">
            <span>OS: <b>{isPlaying ? 'STREAMING' : 'STABLE'}</b></span>
            <span>DSP: <b>64-BIT</b></span>
            <span>NET: <b>LOCAL</b></span>
          </div>
        </div>

        {/* Right Header Stats & Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            className={`btn px-3 py-1.5 text-xs font-mono font-bold rounded uppercase transition-all cursor-pointer border ${
              isWitchHouseActive ? 'btn-active shadow-[0_0_15px_var(--accent-glow)]' : ''
            }`}
            style={{
              borderColor: isWitchHouseActive ? 'var(--accent)' : 'var(--border)',
              color: isWitchHouseActive ? '#ffffff' : 'var(--accent)',
              background: isWitchHouseActive ? 'var(--accent)' : 'transparent',
            }}
            onClick={() => loadPreset('witchhouse')}
            title="Toggle Witch House profile: 66 BPM, dark synth, 808"
          >
            † Witch House Profile
          </button>

          <button
            onClick={() => setIsTemplatesOpen(true)}
            className="btn px-3 py-1.5 text-xs font-mono font-bold rounded uppercase"
            style={{ border: '1px solid var(--border)', color: 'var(--ink)' }}
            title="Project templates & presets"
          >
            Templates
          </button>

          <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

          <button
            onClick={handleUndo}
            disabled={history.past.length === 0}
            className="btn p-1.5 text-xs font-mono rounded disabled:opacity-30"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={history.future.length === 0}
            className="btn p-1.5 text-xs font-mono rounded disabled:opacity-30"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRenderWav}
            disabled={isRendering}
            className="btn px-2.5 py-1 text-xs font-mono font-bold rounded"
            title="Render to WAV"
          >
            {isRendering ? '...' : 'WAV'}
          </button>
          <button
            id="top-guide-btn"
            onClick={() => setShowHelp(prev => !prev)}
            className={`btn px-2.5 py-1 text-xs font-mono font-bold rounded ${showHelp ? 'btn-active' : ''}`}
            title="Toggle Studio Guide & Reference Manual"
          >
            GUIDE
          </button>
          <button
            id="top-keymap-btn"
            onClick={() => setShowKeyMap(prev => !prev)}
            className={`btn px-2.5 py-1 text-xs font-mono font-bold rounded ${showKeyMap ? 'btn-active' : ''}`}
            title="Keyboard Shortcuts [?]"
          >
            KEYS
          </button>
        </div>
      </header>

      {/* Main Container - Variation 8 Cyber-Acoustic Terminal Layout */}
      <section className="main-stage select-none">
        {/* Navigation Sidebar (Variation 8: 100px width) */}
        <aside className="sidebar select-none">
          <div
            className={`pane-link ${activeDetailTab === 'dual' ? 'active' : ''}`}
            onClick={() => {
              setActiveDetailTab('dual');
              setActiveSidebarTab('dual');
            }}
            title="OSC: Oscillators, Synthesizers & Drum Core"
          >
            OSC
          </div>
          <div
            className={`pane-link ${activeDetailTab === 'sampler' ? 'active' : ''}`}
            onClick={() => {
              setActiveDetailTab('sampler');
              setActiveSidebarTab('sampler');
            }}
            title="SMP: Sampler & AI Stem Generation"
          >
            SMP
          </div>
          <div
            className={`pane-link ${activeDetailTab === 'synth' && activeSidebarTab !== 'mixer' ? 'active' : ''}`}
            onClick={() => {
              setActiveDetailTab('synth');
              setActiveSidebarTab('synth');
            }}
            title="FX: Synthesizer Designer & Effects Rack"
          >
            FX
          </div>
          <div
            className={`pane-link ${activeSidebarTab === 'mixer' && activeDetailTab !== 'dual' ? 'active' : ''}`}
            onClick={() => {
              setActiveSidebarTab('mixer');
            }}
            title="MIX: Multi-channel Mixer Console"
          >
            MIX
          </div>
          <div
            className={`pane-link ${activeDetailTab === 'vst' ? 'active' : ''}`}
            onClick={() => {
              setActiveDetailTab('vst');
              setActiveSidebarTab('vst');
            }}
            title="VST: Plugin Bridge & DSP"
          >
            VST
          </div>
          <div
            className={`pane-link ${activeDetailTab === 'ritual' ? 'active !border-[#FF0055] !text-[#FF0055]' : ''}`}
            onClick={() => {
              setActiveDetailTab('ritual');
            }}
            title="RTL: The Ritual Lab & Flow State Generator"
          >
            RTL
          </div>
          <div
            className="pane-link mt-auto"
            onClick={() => {
              setIsChordTemplatesOpen(true);
            }}
            title="MID: MIDI Scale & Progression Palette"
          >
            MID
          </div>
        </aside>

        {/* Column 2 (Conditional): Channels Mixer Strips (Variation 4) */}
        {activeSidebarTab === 'mixer' && (
          <section className="mixer-pane w-full lg:w-[320px] shrink-0 bg-[#0A0A0A] overflow-y-auto h-full border-r border-border flex flex-col select-none">
            <div className="pane-header sticky top-0 z-10 flex items-center justify-between text-accent bg-[#0A0A0A] border-b border-border p-3">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase text-xs">Mixer Channels</span>
                <span className="text-[9px] opacity-60">CH: {tracks.length}</span>
              </div>
              <button
                onClick={() => setFocusMode(prev => !prev)}
                className={`btn py-1 px-2 text-[9px] ${focusMode ? 'btn-active' : ''}`}
                title={focusMode ? "Focus Mode active: other tracks hidden in sequencer & matrix. Click to show all." : "Toggle Focus Mode: Hide other tracks when selecting a track"}
              >
                <Target className="w-3 h-3" />
                <span>{focusMode ? 'FOCUS: ON' : 'FOCUS'}</span>
              </button>
            </div>

            {/* Mixer Keyboard Shortcuts Quick Guide */}
            <div className="px-3 py-1 bg-black border-b border-border flex items-center justify-between text-[9px] font-mono opacity-60 shrink-0">
              <span className="text-accent font-bold tracking-wider">KEYS:</span>
              <div className="flex items-center gap-2">
                <span><span className="text-ink font-bold">[M]</span> Mute</span>
                <span><span className="text-ink font-bold">[S]</span> Solo</span>
                <span><span className="text-ink font-bold">[C]</span> Comp</span>
                <span><span className="text-ink font-bold">[↑↓]</span> Sel</span>
              </div>
            </div>

          <div className="p-3 flex flex-col gap-3">
            {tracks.map((track) => (
              <TrackControl
                key={track.id}
                track={track}
                isActive={activeTrackId === track.id}
                onSelect={() => {
                  setActiveTrackId(track.id);
                  if (track.type === 'synth' || track.type === 'bass') {
                    setDualSynthTrackId(track.id);
                  }
                  if (activeSidebarTab === 'mixer') {
                    // Stay in mixer, but highlight track
                  } else if (activeSidebarTab === 'dual') {
                    // Stay in dual view
                  } else if (track.type === 'drums') {
                    setActiveSidebarTab('drums');
                    setActiveDetailTab('drums');
                  } else if (track.type === 'synth' || track.type === 'bass') {
                    setActiveSidebarTab('synth');
                    setActiveDetailTab('synth');
                  } else {
                    setActiveSidebarTab('editor');
                    setActiveDetailTab('editor');
                  }
                }}
                onUpdateTrack={handleUpdateTrack}
                anySoloed={anySoloed}
              />
            ))}

            {/* Master FX section divider */}
            <div className="border-t-2 border-ink my-2 pb-1" />
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] text-accent font-mono font-bold uppercase tracking-wider">[02] MASTER BUS</span>
              <span className="text-[8px] text-ink-dim font-mono uppercase">DSP RACK</span>
            </div>

            {/* Master Global Equalizer Console */}
            <div className="bg-panel border-2 border-ink p-3 shadow-[3px_3px_0px_#000]">
              <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-border-custom">
                <span className="text-[10px] text-ink font-bold uppercase font-syne tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3 h-3 text-accent" />
                  Master Equalizer
                </span>
                <button 
                  onClick={() => {
                    setEqBass(0);
                    setEqMid(0);
                    setEqTreble(0);
                  }}
                  className="text-[9px] text-accent hover:underline font-bold font-mono tracking-normal cursor-pointer transition-colors uppercase"
                  title="Reset EQ bands to flat (0 dB)"
                >
                  [Reset]
                </button>
              </div>
                
              <div className="grid grid-cols-3 gap-2">
                {/* Bass Band */}
                <div className="flex flex-col items-center bg-black p-2 border border-ink/40 shadow-inner">
                  <span className="text-[8px] text-accent font-bold font-mono uppercase">Bass</span>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={eqBass}
                    onChange={(e) => setEqBass(parseFloat(e.target.value))}
                    className="w-full accent-accent bg-border-custom h-[3px] my-2 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-ink font-bold">
                    {eqBass > 0 ? `+${eqBass.toFixed(1)}` : eqBass.toFixed(1)}
                  </span>
                </div>

                {/* Mid Band */}
                <div className="flex flex-col items-center bg-black p-2 border border-ink/40 shadow-inner">
                  <span className="text-[8px] text-accent font-bold font-mono uppercase">Mid</span>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={eqMid}
                    onChange={(e) => setEqMid(parseFloat(e.target.value))}
                    className="w-full accent-accent bg-border-custom h-[3px] my-2 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-ink font-bold">
                    {eqMid > 0 ? `+${eqMid.toFixed(1)}` : eqMid.toFixed(1)}
                  </span>
                </div>

                {/* Treble Band */}
                <div className="flex flex-col items-center bg-black p-2 border border-ink/40 shadow-inner">
                  <span className="text-[8px] text-accent font-bold font-mono uppercase">Treb</span>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={eqTreble}
                    onChange={(e) => setEqTreble(parseFloat(e.target.value))}
                    className="w-full accent-accent bg-border-custom h-[3px] my-2 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-ink font-bold">
                    {eqTreble > 0 ? `+${eqTreble.toFixed(1)}` : eqTreble.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Master Bus Compressor Console */}
            <div className="bg-panel border-2 border-ink p-3 shadow-[3px_3px_0px_#000]">
              <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-border-custom">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCompEnabled(prev => !prev)}
                    className={`w-3.5 h-3.5 border-2 transition-all flex items-center justify-center cursor-pointer ${
                      compEnabled 
                        ? 'bg-secondary border-black shadow-[1px_1px_0px_#000]' 
                        : 'bg-black border-ink'
                    }`}
                    title={compEnabled ? "Bypass Compressor" : "Enable Compressor"}
                  >
                    <div className={`w-1.5 h-1.5 ${compEnabled ? 'bg-black' : 'bg-ink/30'}`} />
                  </button>
                  <span className="text-[10px] text-ink font-bold uppercase font-syne tracking-wider flex items-center gap-1 select-none">
                    Glue Comp
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setCompEnabled(true);
                    setCompThreshold(-12);
                    setCompRatio(3.0);
                    setCompAttack(0.012);
                    setCompRelease(0.15);
                  }}
                  className="text-[9px] text-accent hover:underline font-bold font-mono tracking-normal cursor-pointer transition-colors uppercase"
                  title="Reset compressor parameters to standard master defaults"
                >
                  [Reset]
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Threshold */}
                  <div className="flex flex-col items-center bg-black p-1.5 border border-ink/40">
                    <div className="w-full flex justify-between text-[8px] text-ink-dim font-bold font-mono uppercase px-0.5">
                      <span>Thresh</span>
                      <span className="text-accent">{compThreshold.toFixed(0)} dB</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="0"
                      step="1"
                      value={compThreshold}
                      onChange={(e) => setCompThreshold(parseFloat(e.target.value))}
                      className="w-full accent-secondary bg-border-custom h-[2px] my-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Ratio */}
                  <div className="flex flex-col items-center bg-black p-1.5 border border-ink/40">
                    <div className="w-full flex justify-between text-[8px] text-ink-dim font-bold font-mono uppercase px-0.5">
                      <span>Ratio</span>
                      <span className="text-secondary">{compRatio.toFixed(1)}:1</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={compRatio}
                      onChange={(e) => setCompRatio(parseFloat(e.target.value))}
                      className="w-full accent-secondary bg-border-custom h-[2px] my-1.5 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {/* Attack */}
                  <div className="flex flex-col items-center bg-black p-1.5 border border-ink/40">
                    <div className="w-full flex justify-between text-[8px] text-ink-dim font-bold font-mono uppercase px-0.5">
                      <span>Attack</span>
                      <span className="text-ink">{(compAttack * 1000).toFixed(0)} ms</span>
                    </div>
                    <input
                      type="range"
                      min="0.001"
                      max="0.1"
                      step="0.001"
                      value={compAttack}
                      onChange={(e) => setCompAttack(parseFloat(e.target.value))}
                      className="w-full accent-accent bg-border-custom h-[2px] my-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Release */}
                  <div className="flex flex-col items-center bg-black p-1.5 border border-ink/40">
                    <div className="w-full flex justify-between text-[8px] text-ink-dim font-bold font-mono uppercase px-0.5">
                      <span>Release</span>
                      <span className="text-ink">{(compRelease * 1000).toFixed(0)} ms</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="1.0"
                      step="0.01"
                      value={compRelease}
                      onChange={(e) => setCompRelease(parseFloat(e.target.value))}
                      className="w-full accent-accent bg-border-custom h-[2px] my-1.5 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Real-time Compressor Gain Reduction Meter */}
                <div className="flex flex-col gap-1.5 bg-black p-2 border border-ink/40">
                  <div className="flex justify-between items-center text-[8px] text-ink-dim font-mono font-bold uppercase select-none">
                    <span>Gain reduction</span>
                    <span ref={masterGrTextRef} className="text-secondary font-bold">0.0 dB</span>
                  </div>
                  <div className="h-2 bg-zinc-950 border border-ink/40 relative overflow-hidden flex items-center justify-end">
                    <div className="absolute inset-0 flex justify-between px-1 text-[6px] text-zinc-500 font-mono font-bold z-10 pointer-events-none items-center leading-none">
                      <span>-24</span>
                      <span>-18</span>
                      <span>-12</span>
                      <span>-6</span>
                      <span>0</span>
                    </div>
                    <div 
                      ref={masterGrBarRef}
                      className="h-full bg-secondary transition-all duration-75 origin-right"
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Master Output Gain Console (Pre-Limiter Trim) */}
            <div id="master-output-gain-console" className="bg-panel border-2 border-ink p-3 shadow-[3px_3px_0px_#000] mt-1">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-border-custom">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] text-ink font-bold uppercase font-syne tracking-wider flex items-center gap-1.5 select-none">
                    Master Output Gain
                  </span>
                  <span className="text-[7.5px] px-1 py-0.5 bg-black text-ink-dim font-mono border border-ink/40 uppercase tracking-tight">
                    Pre-Limiter
                  </span>
                </div>
                <button 
                  id="reset-master-output-gain-btn"
                  onClick={() => {
                    setMasterOutputGain(0.0);
                    showNotification('Master Output Gain reset to 0.0 dB (Unity)', 'info');
                  }}
                  className="text-[9px] text-accent hover:underline font-bold font-mono tracking-normal cursor-pointer transition-colors uppercase"
                  title="Reset master output trim to 0.0 dB (unity gain)"
                >
                  [0.0 dB]
                </button>
              </div>

              <div className="flex flex-col gap-2 bg-black p-2 border border-ink/40">
                <div className="w-full flex justify-between items-center text-[8px] font-mono uppercase px-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-ink-dim font-bold">Output Trim</span>
                    <span className={`text-[7px] font-bold px-1 py-0.5 border ${
                      masterOutputGain === 0 
                        ? 'bg-ink/10 text-ink-dim border-ink/30' 
                        : masterOutputGain > 0 
                          ? 'bg-secondary/15 text-secondary border-secondary/40' 
                          : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40'
                    }`}>
                      {masterOutputGain === 0 ? 'UNITY' : masterOutputGain > 0 ? 'BOOST' : 'ATTEN'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${
                    masterOutputGain > 0 
                      ? 'text-secondary' 
                      : masterOutputGain < 0 
                        ? 'text-cyan-400' 
                        : 'text-accent'
                  }`}>
                    {masterOutputGain > 0 ? `+${masterOutputGain.toFixed(1)}` : masterOutputGain.toFixed(1)} dB
                  </span>
                </div>

                <div className="relative py-0.5">
                  <input
                    id="master-output-gain-slider"
                    type="range"
                    min="-24"
                    max="12"
                    step="0.5"
                    value={masterOutputGain}
                    onChange={(e) => setMasterOutputGain(parseFloat(e.target.value))}
                    className="w-full accent-accent bg-border-custom h-[3px] my-1 cursor-pointer"
                    title={`Master Output Gain: ${masterOutputGain > 0 ? '+' : ''}${masterOutputGain.toFixed(1)} dB`}
                  />
                </div>

                {/* Common Gain Stages Preset Buttons */}
                <div id="master-gain-stages-section" className="flex flex-col gap-1.5 pt-1 border-t border-ink/30">
                  <div className="flex items-center justify-between text-[7px] font-mono uppercase text-ink-dim font-bold px-0.5">
                    <span className="tracking-wider text-ink">Gain Staging Presets</span>
                    <span className="text-[6.5px] text-zinc-500">Quick Stages</span>
                  </div>

                  {/* Common Stages: -12dB, -6dB, -3dB, 0dB, +3dB, +6dB */}
                  <div className="grid grid-cols-6 gap-1 select-none">
                    {[
                      { label: '-12dB', val: -12, desc: 'Pre-Master Headroom', id: 'gain-preset-m12', type: 'atten' },
                      { label: '-6dB', val: -6, desc: 'Mix Bus Headroom (-6dBFS Target)', id: 'gain-preset-m6', type: 'atten' },
                      { label: '-3dB', val: -3, desc: 'Pre-Limiter Level Staging', id: 'gain-preset-m3', type: 'atten' },
                      { label: '0dB', val: 0, desc: 'Unity Gain (0.0 dBFS)', id: 'gain-preset-0', type: 'unity' },
                      { label: '+3dB', val: 3, desc: 'Dynamic Warm Boost (+3dB)', id: 'gain-preset-p3', type: 'boost' },
                      { label: '+6dB', val: 6, desc: 'Hot Drive / Broadcast (+6dB)', id: 'gain-preset-p6', type: 'boost' },
                    ].map((preset) => {
                      const isActive = Math.abs(masterOutputGain - preset.val) < 0.1;
                      return (
                        <button
                          key={preset.id}
                          id={preset.id}
                          onClick={() => {
                            setMasterOutputGain(preset.val);
                            showNotification(`Master Gain staged to ${preset.val > 0 ? '+' : ''}${preset.val} dB (${preset.desc})`, 'info');
                          }}
                          className={`py-1 px-0.5 text-[8px] font-mono font-bold uppercase transition-all border cursor-pointer flex flex-col items-center justify-center rounded-none ${
                            isActive
                              ? 'bg-accent text-black border-accent font-black shadow-[1px_1px_0px_#000]'
                              : preset.type === 'unity'
                                ? 'bg-panel text-accent hover:bg-zinc-800 hover:text-white border-border-custom hover:border-accent/60'
                                : preset.type === 'boost'
                                  ? 'bg-panel text-zinc-300 hover:text-secondary hover:bg-zinc-800 border-border-custom hover:border-secondary/60'
                                  : 'bg-panel text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 border-border-custom hover:border-cyan-500/60'
                          }`}
                          title={`${preset.label}: ${preset.desc}`}
                        >
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Micro Nudges / Fine Stepping */}
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <div className="flex items-center gap-1">
                      <button
                        id="gain-nudge-down-1"
                        onClick={() => {
                          const nextVal = Math.max(-24, Math.round((masterOutputGain - 1) * 2) / 2);
                          setMasterOutputGain(nextVal);
                        }}
                        className="px-1.5 py-0.5 text-[7px] font-mono font-bold bg-panel hover:bg-zinc-800 text-ink-dim hover:text-ink border border-border-custom hover:border-ink/50 cursor-pointer transition-colors"
                        title="Nudge gain down by -1.0 dB"
                      >
                        -1dB
                      </button>
                      <button
                        id="gain-nudge-down-half"
                        onClick={() => {
                          const nextVal = Math.max(-24, Math.round((masterOutputGain - 0.5) * 2) / 2);
                          setMasterOutputGain(nextVal);
                        }}
                        className="px-1.5 py-0.5 text-[7px] font-mono font-bold bg-panel hover:bg-zinc-800 text-ink-dim hover:text-ink border border-border-custom hover:border-ink/50 cursor-pointer transition-colors"
                        title="Nudge gain down by -0.5 dB"
                      >
                        -0.5dB
                      </button>
                    </div>

                    <span className="text-[6.5px] font-mono uppercase text-zinc-500 select-none">Fine Nudge</span>

                    <div className="flex items-center gap-1">
                      <button
                        id="gain-nudge-up-half"
                        onClick={() => {
                          const nextVal = Math.min(12, Math.round((masterOutputGain + 0.5) * 2) / 2);
                          setMasterOutputGain(nextVal);
                        }}
                        className="px-1.5 py-0.5 text-[7px] font-mono font-bold bg-panel hover:bg-zinc-800 text-ink-dim hover:text-ink border border-border-custom hover:border-ink/50 cursor-pointer transition-colors"
                        title="Nudge gain up by +0.5 dB"
                      >
                        +0.5dB
                      </button>
                      <button
                        id="gain-nudge-up-1"
                        onClick={() => {
                          const nextVal = Math.min(12, Math.round((masterOutputGain + 1) * 2) / 2);
                          setMasterOutputGain(nextVal);
                        }}
                        className="px-1.5 py-0.5 text-[7px] font-mono font-bold bg-panel hover:bg-zinc-800 text-ink-dim hover:text-ink border border-border-custom hover:border-ink/50 cursor-pointer transition-colors"
                        title="Nudge gain up by +1.0 dB"
                      >
                        +1dB
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Master Limiter Console */}
            <div className="bg-panel border-2 border-ink p-3 shadow-[3px_3px_0px_#000] mt-1">
              <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-border-custom">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLimiterEnabled(prev => !prev)}
                    className={`w-3.5 h-3.5 border-2 transition-all flex items-center justify-center cursor-pointer ${
                      limiterEnabled 
                        ? 'bg-accent border-black shadow-[1px_1px_0px_#000]' 
                        : 'bg-black border-ink'
                    }`}
                    title={limiterEnabled ? "Bypass Limiter" : "Enable Limiter"}
                  >
                    <div className={`w-1.5 h-1.5 ${limiterEnabled ? 'bg-black' : 'bg-ink/30'}`} />
                  </button>
                  <span className="text-[10px] text-ink font-bold uppercase font-syne tracking-wider flex items-center gap-1.5 select-none">
                    Master Limiter
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setLimiterEnabled(true);
                    setLimiterThreshold(-1.0);
                    setLimiterCeiling(-0.5);
                  }}
                  className="text-[9px] text-accent hover:underline font-bold font-mono tracking-normal cursor-pointer transition-colors uppercase"
                  title="Reset limiter parameters to standard safety levels"
                >
                  [Reset]
                </button>
              </div>

              {/* Limiter Controls in Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                {/* Limiter Threshold */}
                <div className="flex flex-col items-center bg-black p-1.5 border border-ink/40">
                  <div className="w-full flex justify-between text-[8px] text-ink-dim font-bold font-mono uppercase px-0.5">
                    <span>Thresh</span>
                    <span className="text-accent">{limiterThreshold.toFixed(1)} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="0"
                    step="0.1"
                    value={limiterThreshold}
                    onChange={(e) => setLimiterThreshold(parseFloat(e.target.value))}
                    className="w-full accent-accent bg-border-custom h-[2px] my-1.5 cursor-pointer"
                  />
                </div>

                {/* Output Ceiling */}
                <div className="flex flex-col items-center bg-black p-1.5 border border-ink/40">
                  <div className="w-full flex justify-between text-[8px] text-ink-dim font-bold font-mono uppercase px-0.5">
                    <span>Ceiling</span>
                    <span className="text-accent">{limiterCeiling.toFixed(1)} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-3"
                    max="0"
                    step="0.1"
                    value={limiterCeiling}
                    onChange={(e) => setLimiterCeiling(parseFloat(e.target.value))}
                    className="w-full accent-accent bg-border-custom h-[2px] my-1.5 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Master Peak Level Meter Console */}
            <div className="bg-panel border-2 border-ink p-3 shadow-[3px_3px_0px_#000] mt-1">
              <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-border-custom">
                <span className="text-[10px] text-ink font-bold uppercase font-syne tracking-wider flex items-center gap-1.5 select-none">
                  <Activity className="w-3 h-3 text-accent" />
                  Output Peak
                </span>
                <span ref={masterPeakDbTextRef} className="text-[10px] font-mono font-bold text-accent">
                  -INF dB
                </span>
              </div>

              {/* Twin Horizontal Meter Bars (L & R) */}
              <div className="flex flex-col gap-2">
                {/* Left Channel */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono font-black text-ink w-2 select-none">L</span>
                  <div className="flex-1 h-3.5 bg-black border-2 border-ink overflow-hidden relative flex items-center">
                    <div
                      ref={masterPeakLeftBarRef}
                      className="h-full bg-accent transition-all duration-75 origin-left"
                      style={{ width: '0%' }}
                    />
                  </div>
                  <div
                    ref={masterPeakLeftClipRef}
                    className="w-2.5 h-2.5 bg-zinc-900 border border-ink transition-all duration-200 shrink-0"
                    title="Left Channel Peak Clip Overload"
                  />
                </div>

                {/* Right Channel */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono font-black text-ink w-2 select-none">R</span>
                  <div className="flex-1 h-3.5 bg-black border-2 border-ink overflow-hidden relative flex items-center">
                    <div
                      ref={masterPeakRightBarRef}
                      className="h-full bg-accent transition-all duration-75 origin-left"
                      style={{ width: '0%' }}
                    />
                  </div>
                  <div
                    ref={masterPeakRightClipRef}
                    className="w-2.5 h-2.5 bg-zinc-900 border border-ink transition-all duration-200 shrink-0"
                    title="Right Channel Peak Clip Overload"
                  />
                </div>
              </div>
            </div>

            {/* Neobrutalist Terminal Status Block */}
            <div className="bg-black border-2 border-ink p-3 font-mono text-[10px] text-secondary shadow-[3px_3px_0px_#000] flex flex-col gap-1">
              <div className="text-accent font-bold">&gt; SYSTEM_READY // V2.0</div>
              <div className="text-ink-dim">&gt; MASTER_BUS: 44.1kHz 32bit</div>
              <div className="text-secondary font-bold">&gt; DSP_STATUS: OPTIMAL</div>
            </div>
          </div>
        </section>
        )}

        {/* Center Content Area - Variation 8 Cyber-Acoustic Terminal */}
        <main className="center-content">
          {/* Panel 1: Drum Grid Sequencer */}
          <div className="content-panel">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <span className="panel-label" style={{ marginBottom: 0 }}>
                LOOP / STEP SEQUENCER GRID // {activePreset ? activePreset.toUpperCase().replace(/[-_]/g, ' ') : 'WITCH_HOUSE'}
              </span>

              {/* Sub-Genre Step Matrix Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-ink-dim uppercase mr-1">
                  PRESETS:
                </span>
                {DARK_SUB_GENRES.map((genre) => {
                  const template = DARK_PRESETS.find(p => p.genre === genre.name || p.category === genre.name);
                  const isCurrentActive = activePreset === template?.id || activePreset === genre.id;
                  return (
                    <button
                      key={genre.id}
                      onClick={() => {
                        if (template) {
                          loadPreset(template.id);
                        }
                      }}
                      title={`${genre.name} (${genre.bpmRange}) - ${genre.aesthetic}`}
                      className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer border ${
                        isCurrentActive
                          ? 'border-accent text-white shadow-[0_0_10px_var(--accent-glow)]'
                          : 'border-border text-ink-dim hover:border-accent hover:text-white'
                      }`}
                      style={{
                        background: isCurrentActive ? 'var(--accent)' : 'var(--bg)',
                      }}
                    >
                      <span>{genre.icon}</span>
                      <span>{genre.tag}</span>
                    </button>
                  );
                })}
                {/* Dedicated Witch House Preset */}
                <button
                  onClick={() => loadPreset('witchhouse')}
                  title="Witch House (66 BPM) - Dragging slow-tempo 808 trap, ghost snares"
                  className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer border ${
                    isWitchHouseActive
                      ? 'border-accent text-white shadow-[0_0_10px_var(--accent-glow)]'
                      : 'border-border text-ink-dim hover:border-accent hover:text-white'
                  }`}
                  style={{
                    background: isWitchHouseActive ? 'var(--accent)' : 'var(--bg)',
                  }}
                >
                  <span>†</span>
                  <span>WITCH HOUSE</span>
                  <span className="opacity-70 text-[8px]">66</span>
                </button>
              </div>
            </div>

            {/* Drum Grid Container */}
            <div className="drum-grid">
              {/* Step indicator header */}
              <div className="drum-row">
                <span className="track-name font-mono text-[10px] text-zinc-500">BEATS // STEPS</span>
                <div className="steps">
                  {Array.from({ length: 32 }).map((_, stepIdx) => {
                    const isQuarter = stepIdx % 4 === 0;
                    const isCurrent = isPlaying && currentStep === stepIdx;
                    return (
                      <div
                        key={stepIdx}
                        className={`text-center text-[8px] font-mono ${
                          isCurrent ? 'text-accent font-bold' : isQuarter ? 'text-white font-bold' : 'text-zinc-600'
                        }`}
                      >
                        {isQuarter ? (stepIdx / 4) + 1 : '•'}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KICK 808 Row */}
              <div className="drum-row">
                <span className="track-name">KICK_808</span>
                <div className="steps">
                  {Array.from({ length: 32 }).map((_, stepIdx) => {
                    const isOn = drumTrack.drumState?.kick ? drumTrack.drumState.kick[stepIdx] : (stepIdx % 8 === 0 || stepIdx === 10 || stepIdx === 26);
                    const isCurrent = isPlaying && currentStep === stepIdx;
                    const isQuarter = stepIdx % 4 === 0;
                    return (
                      <div
                        key={stepIdx}
                        onClick={() => {
                          const currentDrums = drumTrack.drumState || {
                            kick: Array(32).fill(false),
                            snare: Array(32).fill(false),
                            hihat: Array(32).fill(false),
                            clap: Array(32).fill(false),
                          };
                          const nextKick = [...currentDrums.kick];
                          nextKick[stepIdx] = !nextKick[stepIdx];
                          handleUpdateDrumState({ ...currentDrums, kick: nextKick }, drumTrack.id);
                        }}
                        className={`step-trigger ${isOn ? 'on' : ''} ${isQuarter ? 'quarter' : ''}`}
                        style={{
                          outline: isCurrent ? '1.5px solid #FFFFFF' : undefined,
                        }}
                        title={`Kick Step ${stepIdx + 1} (${isOn ? 'ON' : 'OFF'})`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* SNARE GHOST Row */}
              <div className="drum-row">
                <span className="track-name">SNARE_GHOST</span>
                <div className="steps">
                  {Array.from({ length: 32 }).map((_, stepIdx) => {
                    const isOn = drumTrack.drumState?.snare ? drumTrack.drumState.snare[stepIdx] : (stepIdx === 4 || stepIdx === 12 || stepIdx === 20 || stepIdx === 28 || stepIdx === 14 || stepIdx === 30);
                    const isCurrent = isPlaying && currentStep === stepIdx;
                    const isQuarter = stepIdx % 4 === 0;
                    return (
                      <div
                        key={stepIdx}
                        onClick={() => {
                          const currentDrums = drumTrack.drumState || {
                            kick: Array(32).fill(false),
                            snare: Array(32).fill(false),
                            hihat: Array(32).fill(false),
                            clap: Array(32).fill(false),
                          };
                          const nextSnare = [...currentDrums.snare];
                          nextSnare[stepIdx] = !nextSnare[stepIdx];
                          handleUpdateDrumState({ ...currentDrums, snare: nextSnare }, drumTrack.id);
                        }}
                        className={`step-trigger ${isOn ? 'on-secondary' : ''} ${isQuarter ? 'quarter' : ''}`}
                        style={{
                          outline: isCurrent ? '1.5px solid #FFFFFF' : undefined,
                        }}
                        title={`Snare Step ${stepIdx + 1} (${isOn ? 'ON' : 'OFF'})`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* TRAP HAT Row */}
              <div className="drum-row">
                <span className="track-name">TRAP_HAT</span>
                <div className="steps">
                  {Array.from({ length: 32 }).map((_, stepIdx) => {
                    const isOn = drumTrack.drumState?.hihat ? drumTrack.drumState.hihat[stepIdx] : (stepIdx % 2 === 0);
                    const isCurrent = isPlaying && currentStep === stepIdx;
                    const isQuarter = stepIdx % 4 === 0;
                    return (
                      <div
                        key={stepIdx}
                        onClick={() => {
                          const currentDrums = drumTrack.drumState || {
                            kick: Array(32).fill(false),
                            snare: Array(32).fill(false),
                            hihat: Array(32).fill(false),
                            clap: Array(32).fill(false),
                          };
                          const nextHihat = [...currentDrums.hihat];
                          nextHihat[stepIdx] = !nextHihat[stepIdx];
                          handleUpdateDrumState({ ...currentDrums, hihat: nextHihat }, drumTrack.id);
                        }}
                        className={`step-trigger ${isOn ? 'on' : ''} ${isQuarter ? 'quarter' : ''}`}
                        style={{
                          outline: isCurrent ? '1.5px solid #FFFFFF' : undefined,
                        }}
                        title={`Hi-hat Step ${stepIdx + 1} (${isOn ? 'ON' : 'OFF'})`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* CLAP PERC Row */}
              <div className="drum-row">
                <span className="track-name">CLAP_PERC</span>
                <div className="steps">
                  {Array.from({ length: 32 }).map((_, stepIdx) => {
                    const isOn = drumTrack.drumState?.clap ? drumTrack.drumState.clap[stepIdx] : (stepIdx === 12 || stepIdx === 28);
                    const isCurrent = isPlaying && currentStep === stepIdx;
                    const isQuarter = stepIdx % 4 === 0;
                    return (
                      <div
                        key={stepIdx}
                        onClick={() => {
                          const currentDrums = drumTrack.drumState || {
                            kick: Array(32).fill(false),
                            snare: Array(32).fill(false),
                            hihat: Array(32).fill(false),
                            clap: Array(32).fill(false),
                          };
                          const nextClap = [...currentDrums.clap];
                          nextClap[stepIdx] = !nextClap[stepIdx];
                          handleUpdateDrumState({ ...currentDrums, clap: nextClap }, drumTrack.id);
                        }}
                        className={`step-trigger ${isOn ? 'on-secondary' : ''} ${isQuarter ? 'quarter' : ''}`}
                        style={{
                          outline: isCurrent ? '1.5px solid #FFFFFF' : undefined,
                        }}
                        title={`Clap Step ${stepIdx + 1} (${isOn ? 'ON' : 'OFF'})`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Piano Roll & Synth Voice Telemetry */}
          <div className="content-panel">
            <span className="panel-label">POLY LEAD // PIANO ROLL MIDI EDITOR</span>
            <div className="piano-roll">
              <div className="key-rail">
                <span className="key-label">C4 Lead</span>
                <span className="key-label">A3 Pad</span>
                <span className="key-label">F3 Sub</span>
                <span className="key-label">D3 Root</span>
              </div>
              <div className="roll-grid">
                <div style={{ position: 'absolute', left: '10%', top: '25px', width: '90px', height: '18px', background: 'var(--ui-green)', borderRadius: '4px', boxShadow: '0 0 12px rgba(50, 255, 126, 0.4)' }} />
                <div style={{ position: 'absolute', left: '32%', top: '75px', width: '130px', height: '18px', background: 'var(--accent)', borderRadius: '4px', boxShadow: '0 0 12px var(--accent-glow)' }} />
                <div style={{ position: 'absolute', left: '60%', top: '125px', width: '80px', height: '18px', background: 'var(--ui-green)', borderRadius: '4px', boxShadow: '0 0 12px rgba(50, 255, 126, 0.4)' }} />
                <div style={{ position: 'absolute', left: '78%', top: '175px', width: '110px', height: '18px', background: 'var(--tertiary)', borderRadius: '4px', boxShadow: '0 0 12px rgba(0, 242, 255, 0.4)' }} />
              </div>
            </div>

            {/* Quick DSP Voice Telemetry */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border">
              <div className="p-2.5 rounded bg-bg border border-border">
                <span className="text-[10px] font-mono text-ink-dim uppercase block mb-1">OSC_VOICE</span>
                <span className="font-mono font-bold text-sm text-accent">
                  {activeTrack.synthConfig?.oscillatorType?.toUpperCase() || 'SAW_LEAD'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-bg border border-border">
                <span className="text-[10px] font-mono text-ink-dim uppercase block mb-1">FILTER_MODE</span>
                <span className="font-mono font-bold text-sm text-ui-green">
                  {activeTrack.synthConfig?.filterType?.toUpperCase() || 'LP_RES_24'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-bg border border-border">
                <span className="text-[10px] font-mono text-ink-dim uppercase block mb-1">FX_SLOT</span>
                <span className="font-mono font-bold text-sm text-tertiary">
                  DIFFUSE_DELAY
                </span>
              </div>
            </div>
          </div>

          {/* Focus Mode Navigation Banner */}
              {focusMode && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-panel p-2.5 border-2 border-ink text-xs font-mono shadow-[3px_3px_0px_#000]">
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
                    <span className="text-[10px] text-accent uppercase font-bold tracking-wider flex items-center gap-1 shrink-0">
                      <Target className="w-3.5 h-3.5 text-accent" />
                      FOCUS TRACK:
                    </span>
                    {tracks.map((t) => {
                      const isCurrent = t.id === activeTrackId;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setActiveTrackId(t.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase transition-all cursor-pointer border-2 shrink-0 ${
                            isCurrent
                              ? 'bg-secondary text-black border-black shadow-[2px_2px_0px_#000]'
                              : 'bg-black text-ink border-ink/40 hover:border-ink hover:text-accent'
                          }`}
                        >
                          <span className="w-2 h-2 shrink-0" style={{ backgroundColor: t.color }} />
                          <span className="truncate max-w-[110px] font-mono">{t.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    <button
                      onClick={() => {
                        const idx = tracks.findIndex(t => t.id === activeTrackId);
                        if (idx > 0) setActiveTrackId(tracks[idx - 1].id);
                        else setActiveTrackId(tracks[tracks.length - 1].id);
                      }}
                      className="px-2 py-1 bg-surface-raised hover:bg-ink hover:text-black text-ink border-2 border-ink transition-colors flex items-center gap-1 cursor-pointer text-[11px] font-bold shadow-[2px_2px_0px_#000]"
                      title="Focus previous track"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>Prev</span>
                    </button>
                    <button
                      onClick={() => {
                        const idx = tracks.findIndex(t => t.id === activeTrackId);
                        if (idx < tracks.length - 1) setActiveTrackId(tracks[idx + 1].id);
                        else setActiveTrackId(tracks[0].id);
                      }}
                      className="px-2 py-1 bg-surface-raised hover:bg-ink hover:text-black text-ink border-2 border-ink transition-colors flex items-center gap-1 cursor-pointer text-[11px] font-bold shadow-[2px_2px_0px_#000]"
                      title="Focus next track"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setFocusMode(false)}
                      className="px-2.5 py-1 bg-panel hover:bg-accent hover:text-black text-ink border-2 border-ink transition-colors text-[11px] font-bold cursor-pointer shadow-[2px_2px_0px_#000]"
                      title="Exit focus mode and show all tracks"
                    >
                      SHOW ALL
                    </button>
                  </div>
                </div>
              )}

              {/* Vertical Playhead sync bar */}
              {isPlaying && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] z-10 transition-all duration-75"
                  style={{
                    left: `${((currentStep / 32) * 80) + 16}%`, // Calculate percentage width matching columns
                  }}
                />
              )}

              {/* Timeline markers */}
              <div className="flex items-center border-b border-zinc-900 pb-2">
                <div className="w-20 text-[10px] font-bold text-zinc-600 font-mono uppercase">
                  Playhead
                </div>
                <div className="flex-1 grid grid-cols-32 gap-0.5 font-mono text-[9px] text-zinc-500 font-bold">
                  {Array(32).fill(0).map((_, i) => {
                    const isBeat = i % 4 === 0;
                    return (
                      <div
                        key={i}
                        className={`text-center rounded py-0.5 ${
                          currentStep === i ? 'bg-purple-500/20 text-purple-300' : isBeat ? 'text-zinc-400 font-black' : 'text-zinc-600'
                        }`}
                      >
                        {isBeat ? `${(i / 4) + 1}` : ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual track strips on the matrix (Filtered when in Focus Mode) */}
              {(focusMode ? tracks.filter(t => t.id === activeTrackId) : tracks).map((track) => {
                const isFocused = activeTrackId === track.id;
                const isExpanded = !!expandedAutomationTracks[track.id];
                return (
                  <div key={track.id} className="flex flex-col gap-1">
                    <div
                      onClick={() => setActiveTrackId(track.id)}
                      className={`flex items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
                        isFocused 
                          ? 'bg-zinc-900/60 border-purple-500/20 shadow-inner' 
                          : 'bg-zinc-900/20 border-transparent hover:bg-zinc-900/30'
                      }`}
                    >
                      {/* Track icon/label, mini peak meter and expand button */}
                      <div className="w-36 pr-2 flex items-center justify-between gap-1 select-none">
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
                            <span className="text-[10px] font-bold text-zinc-300 truncate font-mono">
                              {track.type === 'drums' ? 'Drums' : track.type === 'synth' ? 'Synth' : track.type === 'bass' ? 'Bass' : 'AI Audio'}
                            </span>
                          </div>
                          <div className="w-full pr-1">
                            <MiniPeakMeter
                              track={track}
                              anySoloed={anySoloed}
                              orientation="horizontal"
                              showDbText={false}
                              showClipIndicator={false}
                              height={6}
                            />
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedAutomationTracks(prev => ({
                              ...prev,
                              [track.id]: !prev[track.id]
                            }));
                          }}
                          className={`p-1 rounded hover:bg-zinc-800 transition-all cursor-pointer shrink-0 ${
                            isExpanded ? 'text-[#d946ef] bg-[#d946ef]/10' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                          title="Toggle Track Automation Lane"
                        >
                          <Sliders className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Timeline representation cells */}
                      <div className="flex-1 grid grid-cols-32 gap-0.5 h-6">
                        {Array(32).fill(0).map((_, stepIdx) => {
                          let active = false;
                          let cellColor = 'bg-zinc-900/40 border-zinc-850';

                          if (track.type === 'drums' && track.drumState) {
                            const state = track.drumState;
                            active = state.kick[stepIdx] || state.snare[stepIdx] || state.hihat[stepIdx] || state.clap[stepIdx];
                            if (active) cellColor = 'bg-pink-500/60 shadow-[0_0_4px_rgba(244,63,94,0.2)]';
                          } 
                          else if ((track.type === 'synth' || track.type === 'bass') && track.midiNotes) {
                            active = track.midiNotes.some(n => n.step === stepIdx);
                            if (active) cellColor = track.type === 'bass' ? 'bg-cyan-500/70' : 'bg-purple-500/70';
                          }
                          else if (track.type === 'audio' && track.clips) {
                            // Is there any audio clip that covers this step index?
                            const coveringClip = track.clips.find(c => stepIdx >= c.startStep && stepIdx < (c.startStep + c.durationSteps));
                            if (coveringClip) {
                              active = true;
                              cellColor = 'bg-pink-500/80 hover:bg-pink-400 border-pink-400/20 rounded';
                            }
                          }

                          const isPlayhead = currentStep === stepIdx;

                          return (
                            <div
                              key={stepIdx}
                              className={`rounded h-full border ${cellColor} ${
                                isPlayhead ? 'ring-1 ring-purple-400/50' : ''
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Automation Lane Section */}
                    {isExpanded && (
                      <AutomationLane
                        track={track}
                        onUpdateAutomation={handleUpdateTrackAutomation}
                        currentStep={currentStep}
                        isPlaying={isPlaying}
                      />
                    )}
                  </div>
                );
              })}

              {/* Help tip */}
              <div className="text-[10px] opacity-60 italic mt-auto flex justify-between items-center panel p-2">
                <span>💡 Click on any matrix lane to configure or select it. Active triggers show color blocks.</span>
                <span className="font-mono text-[9px] opacity-60">32-Step Loop Sequence</span>
              </div>

            {/* Instrument Workstation Panel */}
            <div className="panel mt-2 flex flex-col gap-3">
              <div className="flex gap-1 p-1 bg-black rounded-xs border border-border flex-wrap">
              <button
                onClick={() => {
                  setActiveDetailTab('dual');
                  setActiveSidebarTab('dual');
                }}
                className={`flex-1 min-w-[75px] py-1.5 px-2 text-[9.5px] font-bold rounded font-mono uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeDetailTab === 'dual'
                    ? 'bg-accent/20 text-accent border border-accent/40 font-black shadow-inner'
                    : 'bg-transparent text-ink-dim hover:text-ink hover:bg-surface-raised border border-transparent'
                }`}
                title="Open Drum Machine and Synth simultaneously in Dual Workstation"
              >
                <Zap className="w-3 h-3 text-accent" />
                <span>⚡ Dual Rack</span>
              </button>

              <button
                onClick={() => {
                  const dt = tracks.find(t => t.type === 'drums');
                  if (dt) setActiveTrackId(dt.id);
                  setActiveDetailTab('drums');
                  setActiveSidebarTab('drums');
                }}
                className={`flex-1 min-w-[60px] py-1.5 px-2 text-[9.5px] font-bold rounded font-mono uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeDetailTab === 'drums' || (activeDetailTab === 'editor' && activeTrack.type === 'drums')
                    ? 'bg-accent/20 text-accent border border-accent/40 font-black shadow-inner'
                    : 'bg-transparent text-ink-dim hover:text-ink hover:bg-surface-raised border border-transparent'
                }`}
                title="Open Drum Machine Sequencer"
              >
                <span>🥁 Drums</span>
              </button>

              <button
                onClick={() => {
                  const st = tracks.find(t => t.type === 'synth') || tracks.find(t => t.type === 'bass');
                  if (st) {
                    setActiveTrackId(st.id);
                    setDualSynthTrackId(st.id);
                  }
                  setActiveDetailTab('synth');
                  setActiveSidebarTab('synth');
                }}
                className={`flex-1 min-w-[60px] py-1.5 px-2 text-[9.5px] font-bold rounded font-mono uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeDetailTab === 'synth' || (activeDetailTab === 'editor' && (activeTrack.type === 'synth' || activeTrack.type === 'bass'))
                    ? 'bg-accent/20 text-accent border border-accent/40 font-black shadow-inner'
                    : 'bg-transparent text-ink-dim hover:text-ink hover:bg-surface-raised border border-transparent'
                }`}
                title="Open Synthesizer & Note Roll"
              >
                <span>🎹 Synth</span>
              </button>

              <button
                onClick={() => {
                  setActiveDetailTab('sampler');
                  setActiveSidebarTab('sampler');
                }}
                className={`py-1.5 px-2 text-[9.5px] font-bold rounded font-mono uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeDetailTab === 'sampler'
                    ? 'bg-accent/20 text-accent border border-accent/40 font-black shadow-inner'
                    : 'bg-transparent text-ink-dim hover:text-ink hover:bg-surface-raised border border-transparent'
                }`}
                title="Open MPC Sampler"
              >
                <span>Sampler</span>
              </button>

              <button
                onClick={() => {
                  setActiveDetailTab('vst');
                  setActiveSidebarTab('vst');
                }}
                className={`py-1.5 px-2 text-[9.5px] font-bold rounded font-mono uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeDetailTab === 'vst'
                    ? 'bg-accent/20 text-accent border border-accent/40 font-black shadow-inner'
                    : 'bg-transparent text-ink-dim hover:text-ink hover:bg-surface-raised border border-transparent'
                }`}
                title="Open VST Plugins & DSP Rack"
              >
                <span>VST Rack</span>
              </button>

              <button
                onClick={() => {
                  setActiveDetailTab('automation');
                }}
                className={`py-1.5 px-2 text-[9.5px] font-bold rounded font-mono uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeDetailTab === 'automation'
                    ? 'bg-secondary/20 text-secondary border border-secondary/40 font-black shadow-inner'
                    : 'bg-transparent text-ink-dim hover:text-ink hover:bg-surface-raised border border-transparent'
                }`}
                title="Open Curve Automation"
              >
                <span>Curves</span>
              </button>

              <button
                onClick={() => {
                  setActiveDetailTab('ritual');
                }}
                className={`py-1.5 px-2.5 text-[9.5px] font-bold rounded font-mono uppercase transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                  activeDetailTab === 'ritual'
                    ? 'bg-[#FF0055] text-black border-[#FF0055] font-black shadow-[0_0_12px_rgba(255,0,85,0.4)]'
                    : 'bg-[#FF0055]/10 text-[#FF0055] hover:bg-[#FF0055]/20 border-[#FF0055]/30'
                }`}
                title="Open The Ritual Lab & Flow State Generator"
              >
                <span>⚡ Ritual Lab</span>
              </button>
            </div>

          {activeDetailTab === 'ritual' ? (
            <RitualLab
              tracks={tracks}
              activeTrackId={activeTrack.id}
              bpm={bpm}
              onUpdateTrackDrumState={(trackId, drumState) => handleUpdateDrumState(drumState, trackId)}
              onUpdateTrackMidiNotes={(trackId, notes) => handleUpdateMidiNotes(trackId, notes)}
              onShowNotification={showNotification}
            />
          ) : activeDetailTab === 'sampler' ? (
            <SamplerLooper onShowNotification={showNotification} />
          ) : activeDetailTab === 'vst' ? (
            <VstPresetManager
              activeTrack={activeTrack}
              tracks={tracks}
              onUpdateTrackVsts={handleUpdateTrackVsts}
              onUpdateSynthConfig={handleUpdateSynthConfig}
              onUpdateMidiNotes={handleUpdateMidiNotes}
              onUpdateDrumState={(trackId, drumState) => handleUpdateDrumState(drumState, trackId)}
              onShowNotification={showNotification}
              onOpenVstLinks={handleOpenVstLinks}
            />
          ) : activeDetailTab === 'automation' ? (
            <div className="flex flex-col gap-3">
              <div className="p-2.5 bg-black border-2 border-ink text-xs font-mono font-bold flex items-center justify-between shadow-[2px_2px_0px_#000]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 border border-black" style={{ backgroundColor: activeTrack.color }} />
                  <span className="text-ink uppercase font-black">{activeTrack.name} Automation</span>
                </div>
                <span className="text-[9px] text-accent uppercase font-mono">Live Curve Editor</span>
              </div>
              <AutomationLane
                track={activeTrack}
                onUpdateAutomation={handleUpdateTrackAutomation}
                currentStep={currentStep}
                isPlaying={isPlaying}
              />
            </div>
          ) : activeDetailTab === 'dual' ? (
            /* DUAL WORKSTATION: BOTH DRUM MACHINE AND SYNTH DESIGNER OPEN SIMULTANEOUSLY */
            <div className="flex flex-col gap-4">
              {/* Dual View Quick Toolbar */}
              <div className="flex items-center justify-between p-2 bg-black border-2 border-ink shadow-[2px_2px_0px_#000] text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-accent font-black">⚡ DUAL RACK:</span>
                  <span className="text-ink font-bold uppercase">Drums &amp; Synths Live</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setDualDrumsExpanded(prev => !prev)}
                    className={`px-2 py-0.5 text-[8.5px] uppercase font-bold border transition-all cursor-pointer ${
                      dualDrumsExpanded ? 'bg-accent/20 text-accent border-accent/40' : 'bg-panel text-ink-dim border-border-custom'
                    }`}
                    title="Toggle Drum Machine Visibility"
                  >
                    🥁 Drums {dualDrumsExpanded ? '▼' : '▶'}
                  </button>
                  <button
                    onClick={() => setDualSynthExpanded(prev => !prev)}
                    className={`px-2 py-0.5 text-[8.5px] uppercase font-bold border transition-all cursor-pointer ${
                      dualSynthExpanded ? 'bg-accent/20 text-accent border-accent/40' : 'bg-panel text-ink-dim border-border-custom'
                    }`}
                    title="Toggle Synth Designer Visibility"
                  >
                    🎹 Synth {dualSynthExpanded ? '▼' : '▶'}
                  </button>
                  <button
                    onClick={() => setDualPianoRollExpanded(prev => !prev)}
                    className={`px-2 py-0.5 text-[8.5px] uppercase font-bold border transition-all cursor-pointer ${
                      dualPianoRollExpanded ? 'bg-accent/20 text-accent border-accent/40' : 'bg-panel text-ink-dim border-border-custom'
                    }`}
                    title="Toggle Piano Roll Visibility"
                  >
                    🎵 Roll {dualPianoRollExpanded ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {/* Section 1: Drum Machine Sequencer */}
              {dualDrumsExpanded && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between p-2 bg-black border-2 border-ink text-xs font-mono font-bold shadow-[2px_2px_0px_#000]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 border border-black" style={{ backgroundColor: drumTrack.color }} />
                      <span className="text-ink uppercase font-black">🥁 Drum Machine Sequencer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-accent uppercase font-mono font-bold">32-Step Grid</span>
                      <button
                        onClick={() => {
                          setActiveTrackId(drumTrack.id);
                          setActiveDetailTab('drums');
                        }}
                        className="text-[8.5px] font-mono text-ink-dim hover:text-accent font-bold uppercase transition-colors"
                        title="Focus Drums only"
                      >
                        [Solo View]
                      </button>
                    </div>
                  </div>
                  <DrumSequencer
                    track={drumTrack}
                    currentStep={currentStep}
                    onUpdateDrumState={(drumState) => handleUpdateDrumState(drumState, drumTrack.id)}
                    focusMode={focusMode}
                    onToggleFocusMode={() => setFocusMode(prev => !prev)}
                    tracks={tracks}
                    onSelectTrack={(trackId) => setActiveTrackId(trackId)}
                    bpm={bpm}
                    onUpdateBpm={setBpm}
                    onSelectPreset={handlePresetSelectFromSequencer}
                  />
                </div>
              )}

              {/* Visual Neobrutalist Separation Bar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-black border-y-2 border-border-custom my-1">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-accent flex items-center gap-1.5">
                  <Sliders className="w-3 h-3" />
                  SYNTHESIZER WORKSTATION &amp; NOTE ROLL
                </span>
                {/* Switcher between synth tracks */}
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-mono text-ink-dim mr-1">ACTIVE SYNTH:</span>
                  {tracks.filter(t => t.type === 'synth' || t.type === 'bass').map(st => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setDualSynthTrackId(st.id);
                        setActiveTrackId(st.id);
                      }}
                      className={`px-2 py-0.5 text-[8.5px] font-mono uppercase font-bold border transition-all cursor-pointer ${
                        activeSynthTrack.id === st.id
                          ? 'bg-accent text-black border-accent font-black shadow-[1px_1px_0px_#000]'
                          : 'bg-panel text-ink-dim hover:text-ink border-border-custom'
                      }`}
                    >
                      {st.name.replace(' Synth', '').replace(' Bass', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Synth Designer & Piano Roll */}
              <div className="flex flex-col gap-4">
                {dualPianoRollExpanded && (
                  <PianoRoll
                    track={activeSynthTrack}
                    bpm={bpm}
                    currentStep={currentStep}
                    onUpdateMidiNotes={(notes) => handleUpdateMidiNotes(activeSynthTrack.id, notes)}
                    onShowNotification={showNotification}
                    focusMode={focusMode}
                    onToggleFocusMode={() => setFocusMode(prev => !prev)}
                    tracks={tracks}
                    onSelectTrack={(trackId) => {
                      setActiveTrackId(trackId);
                      setDualSynthTrackId(trackId);
                    }}
                  />
                )}

                {dualSynthExpanded && (
                  <SynthDesigner
                    track={activeSynthTrack}
                    bpm={bpm}
                    onUpdateSynthConfig={(cfg) => handleUpdateSynthConfig(activeSynthTrack.id, cfg)}
                    onUpdateMidiNotes={(notes) => handleUpdateMidiNotes(activeSynthTrack.id, notes)}
                    onShowNotification={showNotification}
                    tracks={tracks}
                    onUpdateTrack={handleUpdateTrack}
                  />
                )}
              </div>
            </div>
          ) : activeDetailTab === 'drums' ? (
            /* DRUMS DEDICATED VIEW */
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-2.5 bg-black border-2 border-ink text-xs font-mono font-bold shadow-[2px_2px_0px_#000]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 border border-black" style={{ backgroundColor: drumTrack.color }} />
                  <span className="text-ink uppercase font-black">🥁 Drum Machine Sequencer</span>
                </div>
                <button
                  onClick={() => {
                    setActiveDetailTab('dual');
                  }}
                  className="text-[9px] font-mono text-accent hover:underline font-bold uppercase transition-colors"
                >
                  ⚡ Open Dual (Drums + Synth)
                </button>
              </div>
              <DrumSequencer
                track={drumTrack}
                currentStep={currentStep}
                onUpdateDrumState={(drumState) => handleUpdateDrumState(drumState, drumTrack.id)}
                focusMode={focusMode}
                onToggleFocusMode={() => setFocusMode(prev => !prev)}
                tracks={tracks}
                onSelectTrack={(trackId) => setActiveTrackId(trackId)}
                bpm={bpm}
                onUpdateBpm={setBpm}
                onSelectPreset={handlePresetSelectFromSequencer}
              />
            </div>
          ) : activeDetailTab === 'synth' ? (
            /* SYNTH DEDICATED VIEW */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-2.5 bg-black border-2 border-ink text-xs font-mono font-bold shadow-[2px_2px_0px_#000]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 border border-black" style={{ backgroundColor: activeSynthTrack.color }} />
                  <span className="text-ink uppercase font-black">🎹 {activeSynthTrack.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {tracks.filter(t => t.type === 'synth' || t.type === 'bass').map(st => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setDualSynthTrackId(st.id);
                        setActiveTrackId(st.id);
                      }}
                      className={`px-2 py-0.5 text-[8.5px] font-mono uppercase font-bold border transition-all cursor-pointer ${
                        activeSynthTrack.id === st.id
                          ? 'bg-accent text-black border-accent font-black shadow-[1px_1px_0px_#000]'
                          : 'bg-panel text-ink-dim hover:text-ink border-border-custom'
                      }`}
                    >
                      {st.name.replace(' Synth', '').replace(' Bass', '')}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setActiveDetailTab('dual');
                    }}
                    className="text-[9px] font-mono text-accent hover:underline font-bold uppercase transition-colors ml-1"
                  >
                    ⚡ Dual
                  </button>
                </div>
              </div>
              <PianoRoll
                track={activeSynthTrack}
                bpm={bpm}
                currentStep={currentStep}
                onUpdateMidiNotes={(notes) => handleUpdateMidiNotes(activeSynthTrack.id, notes)}
                onShowNotification={showNotification}
                focusMode={focusMode}
                onToggleFocusMode={() => setFocusMode(prev => !prev)}
                tracks={tracks}
                onSelectTrack={(trackId) => {
                  setActiveTrackId(trackId);
                  setDualSynthTrackId(trackId);
                }}
              />
              <SynthDesigner
                track={activeSynthTrack}
                bpm={bpm}
                onUpdateSynthConfig={(cfg) => handleUpdateSynthConfig(activeSynthTrack.id, cfg)}
                onUpdateMidiNotes={(notes) => handleUpdateMidiNotes(activeSynthTrack.id, notes)}
                onShowNotification={showNotification}
                tracks={tracks}
                onUpdateTrack={handleUpdateTrack}
              />
            </div>
          ) : (
            <>
              {/* Render the specific editor based on track type */}
              {activeTrack.type === 'drums' && (
                <DrumSequencer
                  track={activeTrack}
                  currentStep={currentStep}
                  onUpdateDrumState={handleUpdateDrumState}
                  focusMode={focusMode}
                  onToggleFocusMode={() => setFocusMode(prev => !prev)}
                  tracks={tracks}
                  onSelectTrack={(trackId) => setActiveTrackId(trackId)}
                  bpm={bpm}
                  onUpdateBpm={setBpm}
                  onSelectPreset={handlePresetSelectFromSequencer}
                />
              )}

              {(activeTrack.type === 'synth' || activeTrack.type === 'bass') && (
                <div className="flex flex-col gap-6">
                  <PianoRoll
                    track={activeTrack}
                    bpm={bpm}
                    currentStep={currentStep}
                    onUpdateMidiNotes={(notes) => handleUpdateMidiNotes(activeTrack.id, notes)}
                    onShowNotification={showNotification}
                    focusMode={focusMode}
                    onToggleFocusMode={() => setFocusMode(prev => !prev)}
                    tracks={tracks}
                    onSelectTrack={(trackId) => setActiveTrackId(trackId)}
                  />
                  <SynthDesigner
                    track={activeTrack}
                    bpm={bpm}
                    onUpdateSynthConfig={(cfg) => handleUpdateSynthConfig(activeTrack.id, cfg)}
                    onUpdateMidiNotes={(notes) => handleUpdateMidiNotes(activeTrack.id, notes)}
                    onShowNotification={showNotification}
                    tracks={tracks}
                    onUpdateTrack={handleUpdateTrack}
                  />
                </div>
              )}

              {activeTrack.type === 'audio' && (
                <div className="flex flex-col gap-6">
                  <AiGenerator
                    onAddAudioClip={handleAddAudioClip}
                    audioTrack={activeTrack}
                  />

                  {/* Display currently arranged audio clips */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 block flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-pink-400" />
                      Currently Arranged AI Audio Clips
                    </h4>
                    {activeTrack.clips && activeTrack.clips.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activeTrack.clips.map((clip) => (
                          <div key={clip.id} className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className="w-8 h-8 rounded bg-pink-500/15 border border-pink-400/25 flex items-center justify-center text-pink-400 flex-shrink-0">
                                <Music className="w-4 h-4" />
                              </div>
                              <div className="overflow-hidden">
                                <h5 className="text-xs font-bold text-white truncate" title={clip.name}>{clip.name}</h5>
                                <span className="text-[9px] text-zinc-500 font-mono block">
                                  Start: Step {clip.startStep + 1} | Length: {clip.durationSteps} steps
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const audio = new Audio(clip.url);
                                  audio.volume = 0.8;
                                  audio.play();
                                }}
                                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                                title="Audition"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveClip(clip.id)}
                                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg text-zinc-600 text-xs italic">
                        No active audio loops generated or arranged yet. Go to the AI generator above to compose one!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </main>

        {/* Column 3: Synthesizer Core & Hardware Console Log (Variation 8 Right Pane: 400px) */}
        {activeSidebarTab !== 'mixer' && (
          <aside className="right-pane select-none">
            {/* Synthesizer Core Module */}
            <div className="content-panel">
              <span className="panel-label">Synthesizer Core</span>
              
              {/* Dark Sub-Genres Preset Selector with Ritualistic, Industrial, Glitch groups */}
              <div className="mb-4">
                <HardwareRackPresetSelector
                  onLoadTemplate={handleLoadTemplate}
                  showNotification={showNotification}
                  currentBpm={bpm}
                />
              </div>

              {/* Rotary Knobs */}
              <div className="grid grid-cols-2 gap-4 my-2">
                {/* Cutoff Knob */}
                <div className="flex flex-col items-center">
                  <div
                    className="v8-rotary-knob group"
                    onClick={() => {
                      const fallbackConfig = {
                        oscillatorType: 'sawtooth' as const,
                        attack: 0.01,
                        decay: 0.2,
                        sustain: 0.5,
                        release: 0.5,
                        cutoff: 2500,
                        resonance: 2,
                        filterType: 'lowpass' as const,
                        distortion: 0,
                        reverb: 0.2,
                        delay: 0.25,
                        pan: 0,
                        glide: 0
                      };
                      const currentConfig = activeTrack.synthConfig || fallbackConfig;
                      const nextCutoff = (currentConfig.cutoff || 2500) > 7000 ? 800 : (currentConfig.cutoff || 2500) + 1500;
                      handleUpdateSynthConfig(activeTrack.id, { ...currentConfig, cutoff: nextCutoff });
                      showNotification(`Cutoff: ${nextCutoff} Hz`, 'info');
                    }}
                    title="Click to cycle CUTOFF frequency"
                  >
                    <div
                      className="v8-knob-indicator"
                      style={{
                        transform: `rotate(${Math.min(135, Math.max(-135, (((activeTrack.synthConfig?.cutoff || 2500) / 8000) * 270) - 135))}deg)`
                      }}
                    />
                    <span className="text-[10px] font-mono font-bold text-ink-dim group-hover:text-ink">
                      {Math.round(activeTrack.synthConfig?.cutoff || 2500)}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-ink-dim uppercase mt-2 tracking-wider">CUTOFF</span>
                </div>

                {/* Resonance Knob */}
                <div className="flex flex-col items-center">
                  <div
                    className="v8-rotary-knob group"
                    onClick={() => {
                      const fallbackConfig = {
                        oscillatorType: 'sawtooth' as const,
                        attack: 0.01,
                        decay: 0.2,
                        sustain: 0.5,
                        release: 0.5,
                        cutoff: 2500,
                        resonance: 2,
                        filterType: 'lowpass' as const,
                        distortion: 0,
                        reverb: 0.2,
                        delay: 0.25,
                        pan: 0,
                        glide: 0
                      };
                      const currentConfig = activeTrack.synthConfig || fallbackConfig;
                      const nextReso = (currentConfig.resonance || 2) > 9 ? 1 : (currentConfig.resonance || 2) + 2.5;
                      handleUpdateSynthConfig(activeTrack.id, { ...currentConfig, resonance: nextReso });
                      showNotification(`Resonance: Q ${nextReso.toFixed(1)}`, 'info');
                    }}
                    title="Click to cycle RESONANCE"
                  >
                    <div
                      className="v8-knob-indicator"
                      style={{
                        background: 'var(--ui-green)',
                        transform: `rotate(${Math.min(135, Math.max(-135, (((activeTrack.synthConfig?.resonance || 2) / 10) * 270) - 135))}deg)`
                      }}
                    />
                    <span className="text-[10px] font-mono font-bold text-ink-dim group-hover:text-ink">
                      Q {(activeTrack.synthConfig?.resonance || 2).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-ink-dim uppercase mt-2 tracking-wider">RESONANCE</span>
                </div>
              </div>

              {/* Oscillator selector buttons */}
              <div className="mt-4 pt-3 border-t border-border">
                <span className="text-[9px] font-mono text-ink-dim uppercase tracking-wider block mb-2">Oscillator Waveform</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['sawtooth', 'square', 'triangle', 'sine'] as const).map((type) => {
                    const label = type === 'sawtooth' ? 'SAW' : type === 'square' ? 'SQR' : type === 'triangle' ? 'TRI' : 'SIN';
                    const isSelected = (activeTrack.synthConfig?.oscillatorType || 'sawtooth') === type;
                    return (
                      <button
                        key={type}
                        className={`py-1.5 text-[10px] font-mono font-bold uppercase rounded border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent text-white border-accent shadow-[0_0_10px_var(--accent-glow)]'
                            : 'bg-black/40 text-ink-dim border-border hover:text-ink hover:border-zinc-700'
                        }`}
                        onClick={() => {
                          const fallbackConfig = {
                            oscillatorType: type,
                            attack: 0.01,
                            decay: 0.2,
                            sustain: 0.5,
                            release: 0.5,
                            cutoff: 2500,
                            resonance: 2,
                            filterType: 'lowpass' as const,
                            distortion: 0,
                            reverb: 0.2,
                            delay: 0.25,
                            pan: 0,
                            glide: 0
                          };
                          const currentConfig = activeTrack.synthConfig || fallbackConfig;
                          handleUpdateSynthConfig(activeTrack.id, { ...currentConfig, oscillatorType: type });
                          showNotification(`Oscillator: ${label}`, 'info');
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hardware Console Log */}
            <div className="content-panel">
              <span className="panel-label">Hardware Console Log</span>
              <div className="v8-console-log">
                <div className="font-bold text-white mb-1">&gt; SYSTEM RUNTIME TELEMETRY</div>
                <div>&gt; ENGINE: INITIALIZED (44.1kHz / 64-BIT DSP)</div>
                <div>&gt; PROFILE: <span className="text-accent uppercase font-bold">{activePreset ? activePreset.replace(/[-_]/g, ' ') : 'WITCH HOUSE'}</span></div>
                <div>&gt; THREAD: <span className="text-ui-green font-bold">{isPlaying ? 'STREAMING ACTIVE' : 'STANDBY IDLE'}</span></div>
                <div>&gt; BUFFER: 512 SAMPLES // ZERO LATENCY</div>
                <div>&gt; CHANNELS: {tracks.length} DSP TRACKS MOUNTED</div>
              </div>
            </div>
          </aside>
        )}
      </section>

      {/* Master Bus Bar - Variation 8 Cyber-Acoustic Terminal */}
      <footer className="master-bus select-none text-ink font-mono">
        {/* Left: BPM & Transport Timing */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-ink-dim uppercase tracking-widest">TEMPO</span>
            <div
              className="bpm-display-v8"
              onClick={() => {
                const newBpm = bpm >= 160 ? 66 : bpm + 10;
                setBpm(newBpm);
                audioEngine.bpm = newBpm;
                showNotification(`Tempo set to ${newBpm} BPM`, 'info');
              }}
              title="Click to cycle tempo"
            >
              {bpm}
            </div>
          </div>

          <div className="flex flex-col gap-1 font-mono text-xs text-ink-dim border-l border-border pl-6">
            <div>POS: <b className="text-ink">{formattedBarPosition}</b></div>
            <div>STATUS: <b className="text-ui-green">{isPlaying ? 'AUDIO STREAMING' : 'ENGINE READY'}</b></div>
            <div>PROFILE: <b className="text-accent uppercase">{activePreset ? activePreset.replace(/[-_]/g, ' ') : 'WITCH HOUSE'}</b></div>
          </div>
        </div>

        {/* Center: Master Out Fader & Spectral Monitor */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:block w-[180px]">
            <span className="text-[9px] font-mono text-ink-dim uppercase tracking-wider block mb-1">
              SPECTRAL_MONITOR
            </span>
            <canvas
              ref={analyserCanvasRef}
              width={180}
              height={34}
              className="w-full h-[34px] rounded border border-border bg-black/60"
            />
          </div>

          <div className="master-fader-group">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-ink-dim uppercase tracking-wider text-[10px] font-bold">MASTER OUT</span>
              <span className="text-accent font-bold">
                {masterOutputGain >= 0 ? `+${masterOutputGain.toFixed(1)}` : masterOutputGain.toFixed(1)} dB
              </span>
            </div>
            <input
              type="range"
              min="-24"
              max="6"
              step="0.5"
              value={masterOutputGain}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setMasterOutputGain(val);
                audioEngine.setMasterOutputGain(val);
              }}
              className="w-full accent-[#FF0055] cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Master Transport Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="btn-transport-start"
            title="Start / Pause Engine (Spacebar)"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-black" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-black" />
                <span>START</span>
              </>
            )}
          </button>
          <button
            onClick={handleStop}
            className="btn-transport-halt"
            title="Halt & Reset Playhead (ESC)"
          >
            HALT
          </button>

          <button
            id="bottom-scroll-to-top-btn"
            onClick={handleScrollToTop}
            className="p-2.5 rounded border border-border hover:border-accent text-accent transition-colors cursor-pointer"
            title="Scroll to Top"
          >
            <ChevronUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </footer>

      {/* Named Presets Templates Manager Overlay */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        currentBpm={bpm}
        currentTracks={tracks}
        currentEq={{ bass: eqBass, mid: eqMid, treble: eqTreble }}
        onLoadTemplate={handleLoadTemplate}
        showNotification={showNotification}
      />

      {/* Chord Structure Templates & Progression Palette Modal */}
      {activeTrack && (
        <ChordTemplatesModal
          isOpen={isChordTemplatesOpen}
          onClose={() => setIsChordTemplatesOpen(false)}
          activeTrack={
            (activeTrack.type === 'synth' || activeTrack.type === 'bass')
              ? activeTrack
              : (tracks.find(t => t.type === 'synth') || activeTrack)
          }
          bpm={bpm}
          onUpdateMidiNotes={(notes) => {
            const targetTrackId = (activeTrack.type === 'synth' || activeTrack.type === 'bass')
              ? activeTrack.id
              : (tracks.find(t => t.type === 'synth')?.id || activeTrack.id);
            handleUpdateMidiNotes(targetTrackId, notes);
          }}
          onShowNotification={showNotification}
        />
      )}

      {/* Open Source Materials Explorer Overlay */}
      <OpenSourceMaterialModal
        isOpen={isOpenSourceMaterialOpen}
        onClose={() => setIsOpenSourceMaterialOpen(false)}
        showNotification={showNotification}
        initialCategory={openSourceInitialCategory}
      />

      {/* Studio Guide & Reference Manual Modal */}
      <StudioGuideModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        onSelectView={(v) => {
          if (v === 'drums') {
            setActiveSidebarTab('drums');
            setActiveDetailTab('drums');
            setActiveTrackId('track-drums');
          } else if (v === 'synth' || v === 'piano-roll') {
            setActiveSidebarTab('synth');
            setActiveDetailTab('synth');
            setActiveTrackId('track-synth');
            setDualSynthTrackId('track-synth');
          } else if (v === 'sampler') {
            setActiveSidebarTab('sampler');
            setActiveDetailTab('sampler');
          } else if (v === 'effects') {
            setActiveSidebarTab('vst');
            setActiveDetailTab('vst');
          } else {
            setActiveSidebarTab('mixer');
          }
          setShowHelp(false);
        }}
        onLoadPreset={(preset) => {
          loadPreset(preset);
          setShowHelp(false);
        }}
        onOpenTemplates={() => {
          setShowHelp(false);
          setIsTemplatesOpen(true);
        }}
        onOpenSamples={() => {
          setShowHelp(false);
          setOpenSourceInitialCategory('all');
          setIsOpenSourceMaterialOpen(true);
        }}
        onOpenVstLinks={handleOpenVstLinks}
      />

      {/* Quick Key Map & Shortcuts Overlay */}
      <QuickKeyMapModal
        isOpen={showKeyMap}
        onClose={() => setShowKeyMap(false)}
      />

      {/* Hovering Scroll to Top Button (Stationed Halfway Down Viewport) */}
      <aside
        id="hovering-scroll-to-top-container"
        className="fixed right-2 sm:right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-auto select-none"
      >
        <button
          id="hovering-scroll-to-top-btn"
          onClick={handleScrollToTop}
          className={`flex flex-col items-center justify-center px-2 py-2.5 sm:px-2.5 sm:py-3 bg-[#0d0d12]/95 hover:bg-[#181824] backdrop-blur-md border-2 ${
            isScrolledDown
              ? 'border-accent text-accent shadow-[0_0_20px_var(--accent-glow)]'
              : 'border-border-custom text-ink-dim hover:border-accent hover:text-accent shadow-xl'
          } rounded-lg transition-all duration-200 cursor-pointer group active:scale-90 hover:scale-105`}
          title="Scroll to Top (Halfway Down Hover Control)"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5 text-accent group-hover:-translate-y-1 transition-transform stroke-[2.5]" />
          <span className="text-[8.5px] font-mono font-black tracking-wider uppercase text-ink group-hover:text-accent mt-0.5">
            TOP
          </span>
          <div className="flex items-center gap-0.5 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
            <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
            <span className="text-[6.5px] font-mono font-bold text-accent">00.01</span>
          </div>
        </button>
      </aside>
    </div>
  );
}
