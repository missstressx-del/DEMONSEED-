import React, { useState } from 'react';
import { Track, DrumTrackState, GrooveConfig } from '../types';
import { 
  Music, RotateCcw, Sparkles, Copy, ArrowLeft, ArrowRight, 
  Shuffle, Eye, ChevronRight, ChevronLeft, Zap, Check, Target,
  Sliders, Activity, Disc, Info, SlidersHorizontal, Flame
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { GROOVE_PRESETS, getGroovePresetById, GroovePreset } from '../services/groovePresets';
import { DARK_SUB_GENRES, DARK_PRESETS } from '../data/darkSubGenres';

interface DrumSequencerProps {
  track: Track;
  currentStep: number;
  onUpdateDrumState: (drumState: DrumTrackState) => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  tracks?: Track[];
  onSelectTrack?: (trackId: string) => void;
  bpm?: number;
  onUpdateBpm?: (bpm: number) => void;
  onSelectPreset?: (presetName: string) => void;
}

type ViewPage = 'all' | 'bar1' | 'bar2';
type GrooveCategory = 'All' | 'MPC' | 'Hip-Hop' | 'Electronic' | 'Live/Human' | 'Offbeat';
type DrumName = 'kick' | 'snare' | 'hihat' | 'clap';

export function DrumSequencer({ 
  track, 
  currentStep, 
  onUpdateDrumState,
  focusMode,
  onToggleFocusMode,
  tracks,
  onSelectTrack,
  bpm,
  onUpdateBpm,
  onSelectPreset
}: DrumSequencerProps) {
  const [viewPage, setViewPage] = useState<ViewPage>('all');
  const [autoFollowPlayhead, setAutoFollowPlayhead] = useState(true);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [paintTargetValue, setPaintTargetValue] = useState<boolean | null>(null);
  const [mutedDrums, setMutedDrums] = useState<Record<string, boolean>>({});
  const [soloedDrum, setSoloedDrum] = useState<string | null>(null);
  const [activePresetMenu, setActivePresetMenu] = useState(false);
  const [showGroovePanel, setShowGroovePanel] = useState(true);
  const [selectedGrooveCategory, setSelectedGrooveCategory] = useState<GrooveCategory>('All');

  const drumState: DrumTrackState = track.drumState || {
    kick: Array(32).fill(false),
    snare: Array(32).fill(false),
    hihat: Array(32).fill(false),
    clap: Array(32).fill(false),
  };

  const grooveConfig: GrooveConfig = drumState.groove || track.grooveConfig || {
    presetId: 'straight',
    name: 'Straight Grid (0% Swing)',
    swing: 50,
    humanize: 0,
    velocityDrift: 0,
  };

  const activePreset = getGroovePresetById(grooveConfig.presetId);
  const currentSwing = grooveConfig.swing !== undefined ? grooveConfig.swing : activePreset.swing;
  const currentHumanize = grooveConfig.humanize !== undefined ? grooveConfig.humanize : activePreset.humanize;
  const currentVelocityDrift = grooveConfig.velocityDrift !== undefined ? grooveConfig.velocityDrift : activePreset.velocityDrift;

  const drumTypes: { id: DrumName; label: string; short: string; color: string; ringColor: string }[] = [
    { id: 'kick', label: 'Kick Drum', short: 'BD', color: 'bg-pink-500', ringColor: 'ring-pink-500' },
    { id: 'snare', label: 'Snare Drum', short: 'SD', color: 'bg-cyan-500', ringColor: 'ring-cyan-500' },
    { id: 'hihat', label: 'Hi-Hat', short: 'HH', color: 'bg-emerald-500', ringColor: 'ring-emerald-500' },
    { id: 'clap', label: 'Handclap', short: 'CP', color: 'bg-amber-500', ringColor: 'ring-amber-500' },
  ];

  // Auto-switch view page if follow playhead is on and we are in zoomed mode
  const effectiveViewPage = (autoFollowPlayhead && viewPage !== 'all') 
    ? (currentStep < 16 ? 'bar1' : 'bar2')
    : viewPage;

  const startStep = effectiveViewPage === 'bar2' ? 16 : 0;
  const endStep = effectiveViewPage === 'bar1' ? 16 : (effectiveViewPage === 'bar2' ? 32 : 32);
  const visibleStepsCount = endStep - startStep;

  // Step toggle and drag-to-paint handling
  const setStepState = (drum: DrumName, stepIndex: number, value: boolean) => {
    const updated = { ...drumState };
    const arr = [...updated[drum]];
    arr[stepIndex] = value;
    updated[drum] = arr;
    onUpdateDrumState(updated);

    if (value) {
      audioEngine.playDrumLive(drum, track.id);
    }
  };

  const handleMouseDown = (drum: DrumName, stepIndex: number) => {
    setIsMouseDown(true);
    const currentValue = drumState[drum][stepIndex];
    const nextValue = !currentValue;
    setPaintTargetValue(nextValue);
    setStepState(drum, stepIndex, nextValue);
  };

  const handleMouseEnter = (drum: DrumName, stepIndex: number) => {
    if (isMouseDown && paintTargetValue !== null) {
      setStepState(drum, stepIndex, paintTargetValue);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setPaintTargetValue(null);
  };

  // Groove Presets Handlers
  const handleSelectGroovePreset = (preset: GroovePreset) => {
    const updated: DrumTrackState = {
      ...drumState,
      groove: {
        presetId: preset.id,
        name: preset.name,
        swing: preset.swing,
        humanize: preset.humanize,
        velocityDrift: preset.velocityDrift,
      }
    };
    onUpdateDrumState(updated);
  };

  const handleUpdateGrooveParam = (param: 'swing' | 'humanize' | 'velocityDrift', value: number) => {
    const updated: DrumTrackState = {
      ...drumState,
      groove: {
        ...grooveConfig,
        [param]: value,
      }
    };
    onUpdateDrumState(updated);
  };

  const handleResetGroove = () => {
    const straightPreset = getGroovePresetById('straight');
    handleSelectGroovePreset(straightPreset);
  };

  // Quick pattern utilities
  const handleClear = () => {
    onUpdateDrumState({
      kick: Array(32).fill(false),
      snare: Array(32).fill(false),
      hihat: Array(32).fill(false),
      clap: Array(32).fill(false),
      groove: drumState.groove,
    });
  };

  const handleClearRow = (drum: DrumName) => {
    const updated = { ...drumState };
    updated[drum] = Array(32).fill(false);
    onUpdateDrumState(updated);
  };

  const handleFillRow = (drum: DrumName, interval: number) => {
    const updated = { ...drumState };
    const arr = Array(32).fill(false);
    for (let i = 0; i < 32; i += interval) {
      arr[i] = true;
    }
    updated[drum] = arr;
    onUpdateDrumState(updated);
    audioEngine.playDrumLive(drum, track.id);
  };

  const handleDuplicateBar1ToBar2 = () => {
    const updated = { ...drumState };
    drumTypes.forEach(t => {
      const src = updated[t.id] as boolean[];
      for (let i = 0; i < 16; i++) {
        src[i + 16] = src[i];
      }
    });
    onUpdateDrumState(updated);
  };

  const handleShiftPattern = (direction: 'left' | 'right') => {
    const updated = { ...drumState };
    drumTypes.forEach(t => {
      const src = [...(updated[t.id] as boolean[])];
      if (direction === 'left') {
        const first = src.shift() || false;
        src.push(first);
      } else {
        const last = src.pop() || false;
        src.unshift(last);
      }
      updated[t.id] = src as any;
    });
    onUpdateDrumState(updated);
  };

  const handleRandomize = () => {
    const kick = Array(32).fill(false);
    const snare = Array(32).fill(false);
    const hihat = Array(32).fill(false);
    const clap = Array(32).fill(false);

    for (let i = 0; i < 32; i++) {
      if (i % 8 === 0 || (i % 4 === 2 && Math.random() > 0.6)) kick[i] = true;
      if (i % 8 === 4 || (i % 16 === 14 && Math.random() > 0.5)) snare[i] = true;
      if (i % 2 === 0 || Math.random() > 0.4) hihat[i] = true;
      if (i % 16 === 12 || (i === 30 && Math.random() > 0.5)) clap[i] = true;
    }
    onUpdateDrumState({ kick, snare, hihat, clap, groove: drumState.groove });
  };

  const applyBeatPreset = (presetName: string) => {
    const kick = Array(32).fill(false);
    const snare = Array(32).fill(false);
    const hihat = Array(32).fill(false);
    const clap = Array(32).fill(false);

    // 1. Check if presetName matches any dark underground preset or subgenre
    const matchedDarkPreset = DARK_PRESETS.find(p => 
      p.id === presetName || 
      p.id.toLowerCase() === presetName.toLowerCase() ||
      p.genre?.toLowerCase() === presetName.toLowerCase() ||
      p.category?.toLowerCase() === presetName.toLowerCase() ||
      (presetName === 'underground-industrial' && p.id.includes('industrial')) ||
      (presetName === 'horrorcore' && p.id.includes('horrorcore')) ||
      (presetName === 'memphis-phonk' && p.id.includes('phonk')) ||
      (presetName === 'witch-hop' && p.id.includes('witch-hop')) ||
      (presetName === 'dungeon-trap' && p.id.includes('dungeon')) ||
      (presetName === 'dark-sigilcore' && p.id.includes('sigilcore')) ||
      (presetName === 'metalstep' && p.id.includes('metalstep'))
    );

    if (matchedDarkPreset) {
      const drumTrackInPreset = matchedDarkPreset.tracks.find(t => t.type === 'drums');
      if (drumTrackInPreset?.drumState) {
        const nextKick = [...drumTrackInPreset.drumState.kick];
        const nextSnare = [...drumTrackInPreset.drumState.snare];
        const nextHihat = [...drumTrackInPreset.drumState.hihat];
        const nextClap = [...drumTrackInPreset.drumState.clap];

        if (matchedDarkPreset.bpm) {
          if (onUpdateBpm) onUpdateBpm(matchedDarkPreset.bpm);
          audioEngine.setBpm(matchedDarkPreset.bpm);
        }

        if (onSelectPreset) {
          onSelectPreset(matchedDarkPreset.id);
        }

        onUpdateDrumState({
          kick: nextKick,
          snare: nextSnare,
          hihat: nextHihat,
          clap: nextClap,
          groove: drumState.groove
        });
        setActivePresetMenu(false);
        return;
      }
    }

    if (presetName === 'four_floor') {
      for (let i = 0; i < 32; i++) {
        if (i % 4 === 0) kick[i] = true; // Kick on every beat
        if (i % 8 === 4) snare[i] = true; // Snare on 2 and 4
        if (i % 2 === 0) hihat[i] = true; // 8th note hats
        if (i === 12 || i === 28) clap[i] = true;
      }
    } else if (presetName === 'trap_bounce') {
      for (let i = 0; i < 32; i++) {
        if (i === 0 || i === 6 || i === 16 || i === 22 || i === 26) kick[i] = true;
        if (i === 8 || i === 24) snare[i] = true;
        if (i % 2 === 0 || (i >= 12 && i <= 15) || (i >= 28 && i <= 31)) hihat[i] = true; // fast rolls
        if (i === 8 || i === 24) clap[i] = true;
      }
    } else if (presetName === 'boom_bap') {
      for (let i = 0; i < 32; i++) {
        if (i === 0 || i === 7 || i === 9 || i === 16 || i === 23 || i === 26) kick[i] = true;
        if (i === 4 || i === 12 || i === 20 || i === 28) snare[i] = true;
        if (i % 2 === 0 || (i % 4 === 3 && Math.random() > 0.3)) hihat[i] = true;
      }
    } else if (presetName === 'offbeat_skank') {
      for (let i = 0; i < 32; i++) {
        if (i % 8 === 0) kick[i] = true;
        if (i % 8 === 4) snare[i] = true;
        if (i % 4 === 2) hihat[i] = true; // offbeat skank
        if (i % 8 === 4) clap[i] = true;
      }
    } else if (presetName === 'witch_house') {
      // Set project BPM to 66
      if (onUpdateBpm) {
        onUpdateBpm(66);
      }
      audioEngine.setBpm(66);

      // Dragging slow-tempo 808 kick
      kick[0] = true;
      kick[10] = true;
      kick[16] = true;
      kick[26] = true;

      // Heavy backbeats + characteristic ghost snares
      snare[8] = true;  // Main half-time hit
      snare[14] = true; // Ghost snare pickup
      snare[21] = true; // Ghost snare offbeat drag
      snare[24] = true; // Main half-time hit
      snare[27] = true; // Ghost snare syncopation
      snare[30] = true; // Ghost snare turnaround roll

      // Layered occult backbeat claps
      clap[8] = true;
      clap[24] = true;

      // Dragging hats with rapid hi-hat rolls
      for (let i = 0; i < 32; i++) {
        if (i % 2 === 0) hihat[i] = true; // dragging 8th note hats
        if (i >= 12 && i <= 15) hihat[i] = true; // rapid hi-hat roll
        if (i >= 28 && i <= 31) hihat[i] = true; // rapid hi-hat roll
      }

      // Apply Witch House Drag groove preset micro-timing
      const witchGroove = getGroovePresetById('witch_house_drag');
      const groove: GrooveConfig = witchGroove ? {
        presetId: witchGroove.id,
        name: witchGroove.name,
        swing: witchGroove.swing,
        humanize: witchGroove.humanize,
        velocityDrift: witchGroove.velocityDrift,
      } : drumState.groove;

      if (onSelectPreset) {
        onSelectPreset('witchhouse');
      }

      onUpdateDrumState({ kick, snare, hihat, clap, groove });
      setActivePresetMenu(false);
      return;
    }

    if (onSelectPreset) {
      onSelectPreset(presetName);
    }

    onUpdateDrumState({ kick, snare, hihat, clap, groove: drumState.groove });
    setActivePresetMenu(false);
  };

  const toggleMute = (drum: string) => {
    setMutedDrums(prev => ({ ...prev, [drum]: !prev[drum] }));
  };

  const toggleSolo = (drum: string) => {
    setSoloedDrum(prev => prev === drum ? null : drum);
  };

  // Measure and beat calculation for playhead readout
  const currentMeasure = Math.floor(currentStep / 16) + 1;
  const currentBeatInMeasure = Math.floor((currentStep % 16) / 4) + 1;
  const currentSubStep = (currentStep % 4) + 1;

  // Filter groove presets by category
  const filteredGrooves = selectedGrooveCategory === 'All'
    ? GROOVE_PRESETS
    : GROOVE_PRESETS.filter(p => p.category === selectedGrooveCategory);

  const categories: GrooveCategory[] = ['All', 'MPC', 'Hip-Hop', 'Electronic', 'Live/Human', 'Offbeat'];

  return (
    <div 
      className="flex flex-col h-full glass bg-[#121217]/85 border border-white/10 rounded-xl p-4 shadow-2xl select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Header Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent/20 border border-accent/40 flex items-center justify-center">
              <Music className="w-3.5 h-3.5 text-accent" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wider font-mono">
              Step Matrix <span className="text-secondary font-mono text-xs">// {track.name}</span>
            </h3>

            {/* Active Groove Preset Badge */}
            <div 
              onClick={() => setShowGroovePanel(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/60 border border-accent/40 font-mono text-[10px] text-accent cursor-pointer hover:bg-accent/10 transition-colors shadow-sm"
              title="Click to toggle Groove & Swing Presets panel"
            >
              <Disc className="w-3 h-3 text-accent animate-spin-slow" />
              <span className="font-bold">{activePreset.shortName}</span>
              <span className="text-white/60">({currentSwing}% Swing)</span>
            </div>

            {/* Live Playhead Indicator Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/60 border border-white/10 font-mono text-[10px] text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span>BAR {currentMeasure}.{currentBeatInMeasure}.{currentSubStep}</span>
              <span className="text-white/30">|</span>
              <span className="text-secondary font-bold">STEP {currentStep + 1}/32</span>
            </div>
          </div>
          <p className="text-[10px] text-secondary/80 font-mono uppercase tracking-wider mt-1">
            EXPRESSIVE LABORATORY // POCKET GROOVE &amp; STEP MATRIX
          </p>
        </div>

        {/* View Navigation & Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* AI Pattern Preset Trigger */}
          <button
            onClick={() => applyBeatPreset(['four_floor', 'trap_bounce', 'boom_bap', 'offbeat_skank'][Math.floor(Math.random() * 4)])}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded border border-accent/50 text-accent bg-accent/10 hover:bg-accent hover:text-white transition-all cursor-pointer shadow-[0_0_10px_rgba(255,62,130,0.2)] uppercase"
            title="Generate Expressive Beat Pattern"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI_PATTERNS</span>
          </button>

          {/* Groove Toggle Button */}
          <button
            onClick={() => setShowGroovePanel(prev => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold rounded border transition-all cursor-pointer shadow-sm uppercase ${
              showGroovePanel
                ? 'bg-secondary/20 border-secondary text-secondary shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:border-white/30'
            }`}
            title="Toggle Groove & Humanize Presets rack"
          >
            <SlidersHorizontal className="w-3 h-3 text-secondary" />
            <span>GROOVE_PARAMS</span>
          </button>

          {/* Bar / View Selector Pills */}
          <div className="flex bg-black/60 border border-white/10 p-0.5 rounded text-xs font-mono font-bold uppercase">
            <button
              onClick={() => setViewPage('all')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                effectiveViewPage === 'all'
                  ? 'bg-accent text-white shadow-sm font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              BAR_VIEW: ALL
            </button>
            <button
              onClick={() => setViewPage('bar1')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                effectiveViewPage === 'bar1'
                  ? 'bg-accent text-white shadow-sm font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              BAR 1
            </button>
            <button
              onClick={() => setViewPage('bar2')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                effectiveViewPage === 'bar2'
                  ? 'bg-accent text-white shadow-sm font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              BAR 2
            </button>
          </div>

          {/* Follow Playhead Toggle */}
          <button
            onClick={() => setAutoFollowPlayhead(prev => !prev)}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
              autoFollowPlayhead
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400'
            }`}
            title="Auto-switch view between Bar 1 and Bar 2 following playhead"
          >
            <Eye className="w-3 h-3" />
            <span>Follow</span>
          </button>

          {/* Focus Mode Toggle */}
          {onToggleFocusMode && (
            <button
              onClick={onToggleFocusMode}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                focusMode
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.25)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
              title={focusMode ? "Focus Mode active: other tracks are hidden. Click to exit." : "Toggle Focus Mode: Hide other tracks to focus on this sequencer."}
            >
              <Target className={`w-3 h-3 ${focusMode ? 'text-amber-400 animate-pulse' : ''}`} />
              <span>{focusMode ? 'Focus: ON' : 'Focus'}</span>
            </button>
          )}

          {/* Dedicated Witch House Preset Button */}
          <button
            onClick={() => applyBeatPreset('witch_house')}
            className="flex items-center gap-1.5 px-3 py-1 bg-fuchsia-950/80 hover:bg-fuchsia-900 border border-fuchsia-700/60 hover:border-fuchsia-500 text-fuchsia-200 hover:text-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm group"
            title="Load Witch House preset: sets project BPM to 66 and populates dragging slow-tempo trap beat with ghost snares and rapid hi-hat rolls"
          >
            <Flame className="w-3.5 h-3.5 text-fuchsia-400 group-hover:animate-pulse" />
            <span>Witch House</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/60 text-fuchsia-300 font-mono border border-fuchsia-700/40">66 BPM</span>
          </button>

          {/* Preset Beat Menu */}
          <div className="relative">
            <button
              onClick={() => setActivePresetMenu(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Patterns</span>
            </button>

            {activePresetMenu && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-1.5 z-30 flex flex-col gap-1 max-h-80 overflow-y-auto">
                <div className="text-[10px] text-zinc-400 uppercase font-mono px-2 py-1 font-bold flex items-center justify-between border-b border-zinc-800">
                  <span>Step Matrix Presets</span>
                  <span className="text-secondary text-[9px]">8 Underground</span>
                </div>
                {DARK_SUB_GENRES.map(genre => {
                  const darkPreset = DARK_PRESETS.find(p => p.genre === genre.name || p.category === genre.name);
                  return (
                    <button
                      key={genre.id}
                      onClick={() => applyBeatPreset(darkPreset ? darkPreset.id : genre.id)}
                      className="text-left px-2 py-1.5 text-xs rounded transition-colors cursor-pointer flex items-center justify-between hover:bg-zinc-800"
                      style={{ color: genre.color }}
                      title={`${genre.name} (${genre.bpmRange}): ${genre.aesthetic}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span>{genre.icon}</span>
                        <span className="truncate font-bold font-mono">{genre.name}</span>
                      </div>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-black/60 font-mono text-zinc-400 shrink-0 border border-zinc-800">
                        {genre.bpmRange.split('–')[0]} BPM
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={() => applyBeatPreset('witch_house')}
                  className="text-left px-2 py-1.5 text-xs text-fuchsia-300 hover:bg-fuchsia-950/70 hover:text-fuchsia-100 rounded transition-colors cursor-pointer flex items-center justify-between border-t border-zinc-800 pt-1.5"
                  title="† Witch House (66 BPM): Dragging 808 sub, occult ghost snares, and Salem reverb void"
                >
                  <div className="flex items-center gap-1.5">
                    <span>†</span>
                    <span className="font-bold font-mono">Witch House</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-black/60 font-mono text-fuchsia-400 font-bold border border-fuchsia-800/40">
                    66 BPM
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Clear */}
          <button
            onClick={handleClear}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg transition-colors border border-zinc-750 cursor-pointer"
            title="Clear all drum triggers"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Sub-Genre Step Matrix Presets Quick Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3 px-3 py-2 bg-black/70 border border-white/10 rounded-lg text-xs font-mono shadow-inner">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Matrix Presets:</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono hidden sm:inline">
            [Click to load 32-step pattern &amp; tempo]
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {DARK_SUB_GENRES.map((genre) => {
            const darkPreset = DARK_PRESETS.find(p => p.genre === genre.name || p.category === genre.name);
            return (
              <button
                key={genre.id}
                onClick={() => applyBeatPreset(darkPreset ? darkPreset.id : genre.id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border hover:scale-105"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderColor: genre.borderAccent,
                  color: genre.color,
                }}
                title={`${genre.name} (${genre.bpmRange}): ${genre.aesthetic}`}
              >
                <span>{genre.icon}</span>
                <span>{genre.tag}</span>
              </button>
            );
          })}
          {/* Witch House Shortcut */}
          <button
            onClick={() => applyBeatPreset('witch_house')}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border bg-fuchsia-950/60 border-fuchsia-700/50 text-fuchsia-300 hover:text-white hover:bg-fuchsia-900 hover:scale-105"
            title="Witch House (66 BPM): Dragging 808 sub, occult ghost snares, and Salem reverb void"
          >
            <span>†</span>
            <span>WITCH HOUSE</span>
            <span className="text-[8px] opacity-70">66</span>
          </button>
        </div>
      </div>

      {/* SWING & GROOVE PRESETS RACK */}
      {showGroovePanel && (
        <div className="mb-3.5 p-3 rounded-lg bg-zinc-950 border border-pink-500/20 shadow-inner flex flex-col gap-3">
          {/* Header with Title and Category Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-850 pb-2">
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4 text-pink-400 animate-spin-slow" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Groove & Swing Presets
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                [Micro-timing & Humanize Engine]
              </span>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap items-center gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedGrooveCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    selectedGrooveCategory === cat
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <button
                onClick={handleResetGroove}
                className="ml-1 text-[10px] text-zinc-500 hover:text-pink-400 font-mono font-bold transition-colors cursor-pointer"
                title="Reset to 0% Straight Quantization"
              >
                [Reset Straight]
              </button>
            </div>
          </div>

          {/* Presets Horizontal Chips Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
            {filteredGrooves.map((preset) => {
              const isSelected = grooveConfig.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectGroovePreset(preset)}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-pink-950/40 border-pink-500 shadow-[0_0_10px_rgba(244,63,94,0.25)] ring-1 ring-pink-500/50'
                      : 'bg-zinc-900/80 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-[11px] font-mono font-bold truncate ${isSelected ? 'text-pink-300' : 'text-zinc-200'}`}>
                      {preset.name}
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-pink-400 shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                    <span className="text-zinc-500 uppercase">{preset.category}</span>
                    <span className={`font-bold ${preset.swing > 50 ? 'text-pink-400' : 'text-zinc-400'}`}>
                      {preset.swing}% Swing
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Description & Real-time Groove Parameters Sliders */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
            {/* Preset Info description */}
            <div className="lg:col-span-1 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-zinc-800 pr-0 lg:pr-3 pb-2 lg:pb-0">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-pink-300 mb-1">
                <Flame className="w-3.5 h-3.5 text-pink-400" />
                <span>{activePreset.name}</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">
                {activePreset.description}
              </p>
            </div>

            {/* Slider 1: Swing Amount */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                <span className="text-zinc-300 uppercase">Swing Amount:</span>
                <span className="text-pink-400 font-black">{currentSwing}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="75"
                step="1"
                value={currentSwing}
                onChange={(e) => handleUpdateGrooveParam('swing', parseInt(e.target.value, 10))}
                className="w-full accent-pink-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-1">
                <span>50% (Straight)</span>
                <span>60% (MPC)</span>
                <span>75% (Triplet)</span>
              </div>
            </div>

            {/* Slider 2: Humanize Micro-Jitter */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                <span className="text-zinc-300 uppercase">Humanize Timing:</span>
                <span className="text-cyan-400 font-black">{currentHumanize}% (±{(currentHumanize * 0.1).toFixed(1)}ms)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={currentHumanize}
                onChange={(e) => handleUpdateGrooveParam('humanize', parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-1">
                <span>0% (Tight)</span>
                <span>50% (Loose)</span>
                <span>100% (Drifting)</span>
              </div>
            </div>

            {/* Slider 3: Velocity Drift / Dynamics */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                <span className="text-zinc-300 uppercase">Dynamic Velocity:</span>
                <span className="text-amber-400 font-black">{currentVelocityDrift}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={currentVelocityDrift}
                onChange={(e) => handleUpdateGrooveParam('velocityDrift', parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-1">
                <span>0% (Uniform)</span>
                <span>50% (Accents)</span>
                <span>100% (Expressive)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Focus & Track Quick-Switch Navigation Strip */}
      {tracks && tracks.length > 0 && onSelectTrack && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-zinc-950/80 p-2 rounded-lg border border-zinc-800 text-xs font-mono">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider flex items-center gap-1 shrink-0">
              <Target className={`w-3 h-3 ${focusMode ? 'text-amber-400' : 'text-zinc-500'}`} />
              {focusMode ? 'Focus Track:' : 'Tracks:'}
            </span>
            
            {tracks.map((t) => {
              const isCurrent = t.id === track.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTrack(t.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border shrink-0 ${
                    isCurrent
                      ? 'bg-zinc-800 text-white border-pink-500/60 ring-1 ring-pink-500/40 shadow-sm'
                      : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-850'
                  }`}
                  title={`Switch sequencer focus to ${t.name}`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="truncate max-w-[120px]">{t.name}</span>
                  {isCurrent && focusMode && (
                    <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/40 font-mono">
                      FOCUSED
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <button
              onClick={() => {
                const idx = tracks.findIndex(t => t.id === track.id);
                if (idx > 0) onSelectTrack(tracks[idx - 1].id);
                else onSelectTrack(tracks[tracks.length - 1].id);
              }}
              className="px-2 py-1 bg-zinc-850 hover:bg-zinc-750 text-zinc-300 rounded border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
              title="Switch to previous track sequencer"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => {
                const idx = tracks.findIndex(t => t.id === track.id);
                if (idx < tracks.length - 1) onSelectTrack(tracks[idx + 1].id);
                else onSelectTrack(tracks[0].id);
              }}
              className="px-2 py-1 bg-zinc-850 hover:bg-zinc-750 text-zinc-300 rounded border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
              title="Switch to next track sequencer"
            >
              <span>Next</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Quick Tools Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-zinc-950/60 p-2 rounded-lg border border-zinc-850 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Quick Actions:</span>
          <button
            onClick={handleDuplicateBar1ToBar2}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
            title="Duplicate Bar 1 (steps 1-16) to Bar 2 (steps 17-32)"
          >
            <Copy className="w-2.5 h-2.5 text-pink-400" />
            <span>Copy Bar 1 → 2</span>
          </button>

          <button
            onClick={() => handleShiftPattern('left')}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
            title="Shift pattern left by 1 step"
          >
            <ArrowLeft className="w-2.5 h-2.5" />
            <span>Shift ←</span>
          </button>

          <button
            onClick={() => handleShiftPattern('right')}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
            title="Shift pattern right by 1 step"
          >
            <span>Shift →</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>

          <button
            onClick={handleRandomize}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
            title="Randomize ghost notes and variations"
          >
            <Shuffle className="w-2.5 h-2.5 text-cyan-400" />
            <span>Humanize</span>
          </button>
        </div>

        {/* Quick Measure Jump Shortcuts */}
        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
          <span className="text-zinc-600 font-bold mr-1">Jump:</span>
          {([0, 4, 8, 12, 16, 20, 24, 28] as const).map((step, idx) => {
            const barNum = Math.floor(step / 16) + 1;
            const beatInBar = Math.floor((step % 16) / 4) + 1;
            const isPlayingHere = currentStep >= step && currentStep < step + 4;
            return (
              <button
                key={step}
                onClick={() => {
                  if (step >= 16 && effectiveViewPage === 'bar1') setViewPage('bar2');
                  if (step < 16 && effectiveViewPage === 'bar2') setViewPage('bar1');
                }}
                className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                  isPlayingHere
                    ? 'bg-purple-600 text-white ring-1 ring-purple-400'
                    : 'bg-zinc-850 hover:bg-zinc-750 text-zinc-400'
                }`}
                title={`Jump to Bar ${barNum} Beat ${beatInBar}`}
              >
                {barNum}.{beatInBar}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Sequencer Grid */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 flex-1">
        <div className="min-w-[680px] flex flex-col gap-2.5">
          {/* Header Timeline / Beat Numbers with Swing Delay Indicators */}
          <div className="flex items-center gap-3">
            <div className="w-36 text-right pr-2 text-[10px] text-zinc-500 font-mono font-bold tracking-wider uppercase">
              Channels
            </div>

            <div 
              className="flex-1 grid gap-1 font-mono text-[10px]"
              style={{ gridTemplateColumns: `repeat(${visibleStepsCount}, minmax(0, 1fr))` }}
            >
              {Array(visibleStepsCount).fill(0).map((_, idx) => {
                const stepIdx = startStep + idx;
                const isBeatStart = stepIdx % 4 === 0;
                const isMeasureStart = stepIdx % 16 === 0;
                const isPlayhead = currentStep === stepIdx;
                const isSwungStep = stepIdx % 2 === 1 && currentSwing > 50;

                return (
                  <div
                    key={stepIdx}
                    className={`text-center py-1 rounded transition-colors relative flex flex-col items-center justify-center ${
                      isPlayhead
                        ? 'bg-purple-500 text-white font-black shadow-md scale-105 z-10'
                        : isMeasureStart
                          ? 'text-pink-400 bg-pink-500/10 font-black border border-pink-500/20'
                          : isBeatStart
                            ? 'text-zinc-200 bg-zinc-800/80 font-bold'
                            : 'text-zinc-500 bg-zinc-900/40'
                    }`}
                  >
                    <span>{isBeatStart ? `${Math.floor(stepIdx / 4) + 1}` : `.${(stepIdx % 4) + 1}`}</span>
                    {isSwungStep && (
                      <span 
                        className="w-1 h-1 rounded-full bg-pink-400/80 mt-0.5" 
                        title={`Swung 16th (+${((currentSwing - 50) * 1.3).toFixed(0)}% delay)`} 
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drum Rows */}
          {drumTypes.map((type) => {
            const isMuted = !!mutedDrums[type.id];
            const isSoloed = soloedDrum === type.id;
            const isSilent = (soloedDrum && soloedDrum !== type.id) || isMuted;
            const drumRowArray = (drumState[type.id] as boolean[]) || Array(32).fill(false);

            return (
              <div key={type.id} className={`flex items-center gap-3 ${isSilent ? 'opacity-40' : ''}`}>
                {/* Channel Header & Controls */}
                <div className="w-36 flex items-center justify-between gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 shadow-sm shrink-0">
                  {/* Audition Drum trigger */}
                  <button
                    onClick={() => audioEngine.playDrumLive(type.id, track.id)}
                    className="flex items-center gap-1.5 text-left text-xs font-bold text-zinc-200 hover:text-white transition-colors cursor-pointer group truncate"
                    title={`Click to audition ${type.label}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${type.color} shrink-0 group-hover:scale-125 transition-transform`} />
                    <span className="truncate">{type.label}</span>
                  </button>

                  {/* Solo / Mute / Fill options */}
                  <div className="flex items-center gap-0.5">
                    {/* Solo */}
                    <button
                      onClick={() => toggleSolo(type.id)}
                      className={`w-5 h-5 rounded text-[9px] font-mono font-bold flex items-center justify-center transition-colors cursor-pointer ${
                        isSoloed 
                          ? 'bg-amber-500 text-black font-black' 
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                      }`}
                      title="Solo track"
                    >
                      S
                    </button>

                    {/* Mute */}
                    <button
                      onClick={() => toggleMute(type.id)}
                      className={`w-5 h-5 rounded text-[9px] font-mono font-bold flex items-center justify-center transition-colors cursor-pointer ${
                        isMuted 
                          ? 'bg-red-500/80 text-white font-black' 
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                      }`}
                      title="Mute track"
                    >
                      M
                    </button>

                    {/* Fill 4ths Quick button */}
                    <button
                      onClick={() => handleFillRow(type.id, 4)}
                      className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-[8px] font-mono text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
                      title="Fill every 4th step (quarters)"
                    >
                      /4
                    </button>

                    {/* Clear row */}
                    <button
                      onClick={() => handleClearRow(type.id)}
                      className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-[9px] font-mono text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Clear this row"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Visible Steps Grid for this Drum */}
                <div 
                  className="flex-1 grid gap-1 h-11"
                  style={{ gridTemplateColumns: `repeat(${visibleStepsCount}, minmax(0, 1fr))` }}
                >
                  {Array(visibleStepsCount).fill(0).map((_, idx) => {
                    const stepIdx = startStep + idx;
                    const active = drumRowArray[stepIdx];
                    const isBeatStart = stepIdx % 4 === 0;
                    const isMeasureStart = stepIdx % 16 === 0;
                    const isPlayhead = currentStep === stepIdx;

                    let bgClass = 'bg-[#181820] hover:bg-[#22222c] border-white/5';
                    if (active) {
                      if (type.id === 'kick' || type.id === 'clap') {
                        bgClass = 'bg-[#FF3E82] shadow-[0_0_15px_#FF3E82] border-white/40 text-white accent-glow-box';
                      } else {
                        bgClass = 'bg-[#00F0FF] shadow-[0_0_15px_#00F0FF] border-white/40 text-black secondary-glow-box';
                      }
                    } else if (isMeasureStart) {
                      bgClass = 'bg-[#1f1f2a] hover:bg-[#282836] border-white/15';
                    } else if (isBeatStart) {
                      bgClass = 'bg-[#1a1a24] hover:bg-[#242432] border-white/10';
                    }

                    return (
                      <button
                        key={stepIdx}
                        onMouseDown={() => handleMouseDown(type.id, stepIdx)}
                        onMouseEnter={() => handleMouseEnter(type.id, stepIdx)}
                        className={`h-full rounded-sm border transition-all cursor-pointer select-none flex items-center justify-center relative ${
                          active ? 'scale-[0.96] z-10 font-bold' : ''
                        } ${bgClass} ${
                          isPlayhead
                            ? 'ring-2 ring-secondary ring-offset-1 ring-offset-black z-20 scale-105'
                            : ''
                        }`}
                        title={`${type.label} • Step ${stepIdx + 1} (Click or Drag)`}
                      >
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_#fff]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-zinc-800 text-[10px] text-zinc-400 font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
            <span className="text-zinc-300">Kick</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
            <span className="text-zinc-300">Snare</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-zinc-300">Hi-Hat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span className="text-zinc-300">Clap</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <span className="text-pink-400 font-bold">Current Groove: {activePreset.name}</span>
          <span className="text-zinc-600">|</span>
          <span>Shift timing and dynamic accents live in playback.</span>
        </div>
      </div>
    </div>
  );
}
