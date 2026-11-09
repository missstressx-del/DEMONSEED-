import React, { useState, useRef, useEffect } from 'react';
import { Track } from '../types';
import { Volume2, VolumeX, Radio, Music, Disc, Sliders, Activity, Palette } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { MiniPeakMeter } from './MiniPeakMeter';

interface TrackControlProps {
  key?: string;
  track: Track;
  isActive: boolean;
  onSelect: () => void;
  onUpdateTrack: (updated: Track) => void;
  anySoloed: boolean;
}

const TRACK_COLORS = [
  { value: '#f43f5e', label: 'Rose' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#ef4444', label: 'Red' },
  { value: '#84cc16', label: 'Lime' },
  { value: '#eab308', label: 'Yellow' },
];

export function TrackControl({ track, isActive, onSelect, onUpdateTrack, anySoloed }: TrackControlProps) {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleColorChange = (newColor: string) => {
    onUpdateTrack({ ...track, color: newColor });
  };

  const handleVolumeChange = (vol: number) => {
    onUpdateTrack({ ...track, volume: vol });
  };

  const handlePanChange = (pan: number) => {
    onUpdateTrack({ ...track, pan });
  };

  const handleToggleMute = () => {
    onUpdateTrack({ ...track, muted: !track.muted });
  };

  const handleToggleSolo = () => {
    onUpdateTrack({ ...track, soloed: !track.soloed });
  };

  const getTrackIcon = () => {
    switch (track.type) {
      case 'drums': return <Disc className="w-4 h-4 text-pink-500" />;
      case 'synth': return <Music className="w-4 h-4 text-purple-500" />;
      case 'bass': return <Radio className="w-4 h-4 text-cyan-500" />;
      case 'audio': return <Volume2 className="w-4 h-4 text-pink-400" />;
    }
  };

  // Calculate volume bar color or status
  const isSilenced = track.muted || (anySoloed && !track.soloed);

  // Meter DOM element references for direct, ultra-high-performance updates
  const meterBarRef = useRef<HTMLDivElement | null>(null);
  const rmsBarRef = useRef<HTMLDivElement | null>(null);
  const peakLineRef = useRef<HTMLDivElement | null>(null);
  const grBarRef = useRef<HTMLDivElement | null>(null);
  const peakTextRef = useRef<HTMLSpanElement | null>(null);
  const grTextRef = useRef<HTMLSpanElement | null>(null);
  const clipLightRef = useRef<HTMLDivElement | null>(null);

  // Compressor and meter values tracked across animation frames
  const currentLevelRef = useRef<number>(-60);
  const currentRMSRef = useRef<number>(-60);
  const currentGRRef = useRef<number>(0);
  const peakHoldRef = useRef<number>(-60);
  const clipActiveRef = useRef<boolean>(false);
  const lastPeakTimeRef = useRef<number>(0);

  // Default compressor configurations
  const compEnabled = track.compEnabled ?? false;
  const compThreshold = track.compThreshold ?? -18;
  const compRatio = track.compRatio ?? 4;

  // Animation frame loop for metering and level simulation
  useEffect(() => {
    let animId: number;

    const updateMeters = () => {
      const isPlaying = audioEngine.isPlaying;
      const isMutedOrSilenced = track.muted || (anySoloed && !track.soloed);

      let targetDb = -45;
      let targetRMSDb = -45;
      let targetGR = 0;

      if (isPlaying && !isMutedOrSilenced) {
        const bpm = audioEngine.bpm || 120;
        const beatDuration = 60 / bpm;
        const nowSecs = Date.now() / 1000;
        
        let signal = 0.05; // Base signal floor

        // Create highly authentic rhythmic envelopes based on the track type
        if (track.type === 'drums') {
          // Sharp percussive decay synced with the beat clock
          const elapsed = nowSecs % beatDuration;
          const mainHit = Math.exp(-elapsed * 6.0); 
          
          // Introduce double-time rhythmic elements (hi-hats, sub-snare clicks)
          const halfElapsed = nowSecs % (beatDuration / 2);
          const rhythmHit = Math.exp(-halfElapsed * 10.0) * 0.3;
          
          signal = Math.max(0.02, mainHit * 0.85 + rhythmHit + Math.random() * 0.05);
        } else if (track.type === 'synth') {
          // Lush, continuous waving synth line
          const primaryOsc = Math.sin(nowSecs * 2.8) * 0.25 + 0.55;
          const secondaryHarmonic = Math.sin(nowSecs * 7.5) * 0.12;
          signal = Math.max(0.01, primaryOsc + secondaryHarmonic + Math.random() * 0.03);
        } else if (track.type === 'bass') {
          // Thumping basslines with dynamic pulse envelope
          const subPulse = Math.cos(nowSecs * 4.5) * 0.2 + 0.6;
          const subVibrato = Math.sin(nowSecs * 12.0) * 0.08;
          signal = Math.max(0.01, subPulse + subVibrato + Math.random() * 0.02);
        } else {
          // Smooth vocal, loop, or atmospheric audio wave
          const waveLfo = Math.sin(nowSecs * 1.5) * 0.35 + 0.45;
          signal = Math.max(0.01, waveLfo + Math.random() * 0.03);
        }

        // Scale according to volume slider
        signal = signal * track.volume;

        // Convert the relative linear signal amplitude to decibels (dB)
        let db = 20 * Math.log10(signal || 0.001);
        db = Math.max(-45, Math.min(3, db));

        // Apply audio compression reduction
        if (compEnabled) {
          if (db > compThreshold) {
            const excess = db - compThreshold;
            const compressedOutput = compThreshold + (excess / compRatio);
            targetGR = db - compressedOutput;
            db = compressedOutput;
          }
        }

        targetDb = db;

        // Standard dynamic Crest Factor to emulate continuous root mean square (RMS) energy
        let crestFactor = 8;
        if (track.type === 'drums') {
          crestFactor = 12;
        } else if (track.type === 'synth') {
          crestFactor = 5;
        } else if (track.type === 'bass') {
          crestFactor = 4.5;
        } else if (track.type === 'audio') {
          crestFactor = 7;
        }

        targetRMSDb = Math.max(-45, targetDb - crestFactor);
      }

      // Smooth peak & reduction tracking using customized envelope attack/release rates
      const levelDifference = targetDb - currentLevelRef.current;
      const levelSpeed = levelDifference > 0 ? 0.4 : 0.14; // Snappy attack, smooth decay
      currentLevelRef.current += levelDifference * levelSpeed;

      // Slower integration rate (300ms window) for the RMS indicator
      const rmsDifference = targetRMSDb - currentRMSRef.current;
      const rmsSpeed = rmsDifference > 0 ? 0.15 : 0.08;
      currentRMSRef.current += rmsDifference * rmsSpeed;

      const grDifference = targetGR - currentGRRef.current;
      const grSpeed = grDifference > 0 ? 0.45 : 0.12; // Snappy gain reduction, slow release
      currentGRRef.current += grDifference * grSpeed;

      // Ensure lower bounds limits
      if (currentLevelRef.current < -45) currentLevelRef.current = -45;
      if (currentRMSRef.current < -45) currentRMSRef.current = -45;
      if (currentGRRef.current < 0.1) currentGRRef.current = 0;

      // Handle peak-hold indicator values
      const now = Date.now();
      if (currentLevelRef.current > peakHoldRef.current) {
        peakHoldRef.current = currentLevelRef.current;
        lastPeakTimeRef.current = now;
      } else if (now - lastPeakTimeRef.current > 1500) {
        // Natural release of the peak indicator tick after a short holding delay
        peakHoldRef.current = Math.max(-45, peakHoldRef.current - 0.25);
      }

      // Trigger clipping if peak breaches 0 dB
      if (currentLevelRef.current >= 0) {
        clipActiveRef.current = true;
      }

      // DOM Updates - 1. Peak Level indicator bar
      if (meterBarRef.current) {
        const pct = ((currentLevelRef.current - (-45)) / (3 - (-45))) * 100;
        const clampedPct = Math.max(0, Math.min(100, pct));
        meterBarRef.current.style.height = `${clampedPct}%`;
      }

      // DOM Updates - 1.5. RMS Level indicator bar
      if (rmsBarRef.current) {
        const rmsPct = ((currentRMSRef.current - (-45)) / (3 - (-45))) * 100;
        const clampedRmsPct = Math.max(0, Math.min(100, rmsPct));
        rmsBarRef.current.style.height = `${clampedRmsPct}%`;
      }

      // DOM Updates - 2. Peak Hold Tick line
      if (peakLineRef.current) {
        const peakPct = ((peakHoldRef.current - (-45)) / (3 - (-45))) * 100;
        const clampedPeakPct = Math.max(0, Math.min(100, peakPct));
        peakLineRef.current.style.bottom = `${clampedPeakPct}%`;
      }

      // DOM Updates - 3. Gain Reduction bar
      if (grBarRef.current) {
        const grPct = (currentGRRef.current / 12) * 100;
        const clampedGrPct = Math.max(0, Math.min(100, grPct));
        grBarRef.current.style.height = `${clampedGrPct}%`;
      }

      // DOM Updates - 4. Digital Text displays (combines Peak and RMS readings for gain staging)
      if (peakTextRef.current) {
        if (isMutedOrSilenced) {
          peakTextRef.current.textContent = 'MUTED';
        } else if (!isPlaying) {
          peakTextRef.current.textContent = 'P:- R:-';
        } else {
          peakTextRef.current.textContent = `P:${currentLevelRef.current.toFixed(1)} R:${currentRMSRef.current.toFixed(1)}`;
        }
      }

      if (grTextRef.current) {
        if (currentGRRef.current > 0.1) {
          grTextRef.current.textContent = `-${currentGRRef.current.toFixed(1)} dB`;
        } else {
          grTextRef.current.textContent = '0.0 dB';
        }
      }

      // DOM Updates - 5. Red Clip indicator
      if (clipLightRef.current) {
        if (clipActiveRef.current) {
          clipLightRef.current.style.backgroundColor = '#ef4444';
          clipLightRef.current.style.boxShadow = '0 0 6px #ef4444';
        } else {
          clipLightRef.current.style.backgroundColor = '#27272a';
          clipLightRef.current.style.boxShadow = 'none';
        }
      }

      animId = requestAnimationFrame(updateMeters);
    };

    animId = requestAnimationFrame(updateMeters);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [track.type, track.volume, track.muted, anySoloed, track.soloed, compEnabled, compThreshold, compRatio]);

  const handleClearClip = (e: React.MouseEvent) => {
    e.stopPropagation();
    clipActiveRef.current = false;
    peakHoldRef.current = currentLevelRef.current;
    if (clipLightRef.current) {
      clipLightRef.current.style.backgroundColor = '#27272a';
      clipLightRef.current.style.boxShadow = 'none';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    const key = e.key.toLowerCase();
    if (key === 'm') {
      e.preventDefault();
      handleToggleMute();
    } else if (key === 's') {
      e.preventDefault();
      handleToggleSolo();
    } else if (key === 'c') {
      e.preventDefault();
      onUpdateTrack({ ...track, compEnabled: !compEnabled });
    }
  };

  return (
    <div
      id={`track-control-${track.id}`}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={`track-strip p-3 border transition-all duration-150 cursor-pointer flex flex-col gap-2.5 outline-none focus:ring-1 focus:ring-accent rounded-xs relative ${
        isActive
          ? 'active bg-[rgba(255,45,85,0.04)] border-l-4 border-l-accent border-y-border-custom border-r-border-custom shadow-[0_0_15px_rgba(255,45,85,0.15)]'
          : 'bg-panel border-border-custom hover:border-white/20'
      }`}
    >
      {/* Title & Type Icon */}
      <div className="strip-top flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 border border-white/10 rounded-sm ${isActive ? 'bg-accent text-white font-bold shadow-[0_0_8px_rgba(255,62,130,0.5)]' : 'bg-white/5 text-white/80'}`}>
            {getTrackIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5 relative">
              <h4 className="text-xs font-bold text-white tracking-wide uppercase font-mono">{track.name}</h4>
              <button
                id={`track-color-btn-${track.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsColorPickerOpen(!isColorPickerOpen);
                }}
                className="w-3.5 h-3.5 border border-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0 rounded-sm"
                style={{ backgroundColor: track.color }}
                title="Customize Track Color"
              />
              
              {isColorPickerOpen && (
                <div
                  ref={colorPickerRef}
                  id={`track-color-picker-${track.id}`}
                  className="absolute left-0 top-6 p-2 bg-panel border-2 border-ink shadow-[4px_4px_0px_#000] z-50 flex flex-col gap-1.5 w-36"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[8px] text-accent font-bold uppercase tracking-wider font-mono">
                    Select Color
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {TRACK_COLORS.map((col) => (
                      <button
                        key={col.value}
                        id={`color-option-${track.id}-${col.value}`}
                        onClick={() => {
                          handleColorChange(col.value);
                          setIsColorPickerOpen(false);
                        }}
                        className={`w-4 h-4 border-2 transition-all cursor-pointer hover:scale-115 active:scale-90 ${
                          track.color === col.value 
                            ? 'border-ink shadow-[2px_2px_0px_#000] scale-105' 
                            : 'border-ink/50 hover:border-ink'
                        }`}
                        style={{ backgroundColor: col.value }}
                        title={col.label}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-secondary flex items-center gap-1.5 mt-0.5">
              <span>VOL: {Math.round(track.volume * 100)}%</span>
              <span className="text-white/20">//</span>
              <span>PAN: {track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.round(Math.abs(track.pan) * 100)}` : `R${Math.round(track.pan * 100)}`}</span>
            </div>
          </div>
        </div>

        {/* Selected indicator Badge & Header Mini Peak Meter */}
        <div className="flex items-center gap-2">
          {/* Header Mini Peak Meter */}
          <div className="w-20 hidden sm:block">
            <MiniPeakMeter
              track={track}
              anySoloed={anySoloed}
              orientation="horizontal"
              showDbText={false}
              showClipIndicator={true}
              height={10}
            />
          </div>

          {isActive ? (
            <span className="text-[8px] bg-accent text-white px-1.5 py-0.5 font-mono font-bold uppercase tracking-wider rounded-sm shadow-[0_0_6px_rgba(255,62,130,0.6)]">
              ACTIVE
            </span>
          ) : (
            <div className="w-2 h-2 border border-white/20 bg-zinc-800 rounded-sm" />
          )}
        </div>
      </div>

      {isActive && (
        <div className="h-1 w-full bg-accent/80 rounded-full shadow-[0_0_8px_rgba(255,62,130,0.5)]" />
      )}

      {/* Main Strip Columns: Faders/Comps vs Metering Bridge */}
      <div className="flex gap-2.5">
        
        {/* Left Column: Mix faders & compressor toggle */}
        <div className="flex-1 flex flex-col gap-2">
          
          {/* Mute & Solo row with Keyboard Shortcut badges */}
          <div className="flex gap-1.5">
            <button
              id={`track-mute-${track.id}`}
              onClick={(e) => { e.stopPropagation(); handleToggleMute(); }}
              className={`flex-1 py-1 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border flex items-center justify-center gap-1 ${
                track.muted
                  ? 'bg-rose-500 text-black border-rose-500 font-extrabold shadow-inner'
                  : 'bg-surface-raised hover:bg-black text-ink border-border-custom hover:border-rose-400 hover:text-rose-400'
              }`}
              title="Mute Track (Shortcut: M)"
            >
              <span>MUTE</span>
              <span className="text-[8px] opacity-60 font-mono">[M]</span>
            </button>
            <button
              id={`track-solo-${track.id}`}
              onClick={(e) => { e.stopPropagation(); handleToggleSolo(); }}
              className={`flex-1 py-1 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border flex items-center justify-center gap-1 ${
                track.soloed
                  ? 'bg-accent text-black border-accent font-extrabold shadow-inner'
                  : 'bg-surface-raised hover:bg-black text-ink border-border-custom hover:border-accent hover:text-accent'
              }`}
              title="Solo Track (Shortcut: S)"
            >
              <span>SOLO</span>
              <span className="text-[8px] opacity-60 font-mono">[S]</span>
            </button>
          </div>

          {/* Volume Slider & Pan Pot */}
          <div className="flex flex-col gap-2 bg-panel p-2 border-2 border-ink shadow-[2px_2px_0px_#000]">
            {/* Volume */}
            <div>
              <div className="flex justify-between items-center text-[9px] text-ink-dim mb-1 font-mono">
                <span className="flex items-center gap-1 font-bold text-ink">
                  {isSilenced ? <VolumeX className="w-3 h-3 text-rose-500" /> : <Volume2 className="w-3 h-3 text-accent" />}
                  VOL
                </span>
                <span className={isSilenced ? 'text-rose-400 font-bold' : 'text-accent font-bold'}>
                  {isSilenced ? 'Muted' : `${Math.round(track.volume * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={track.volume}
                disabled={track.muted}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-accent bg-border-custom cursor-pointer"
              />

              {/* Real-time Mini Peak Level Meter directly under Volume Slider */}
              <div className="mt-2 pt-1.5 border-t border-white/10 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[7.5px] font-mono text-ink-dim uppercase">
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                    Peak Signal
                  </span>
                  <span className="text-secondary font-bold">R128 / PPM</span>
                </div>
                <MiniPeakMeter
                  track={track}
                  anySoloed={anySoloed}
                  orientation="horizontal"
                  showDbText={true}
                  showClipIndicator={true}
                  height={12}
                />
              </div>
            </div>

            {/* Stereo Pan */}
            <div>
              <div className="flex justify-between items-center text-[9px] text-ink-dim mb-1 font-mono">
                <span className="font-bold text-ink">BAL PAN</span>
                <span className="text-secondary font-bold">
                  {track.pan === 0 ? 'Center' : track.pan < 0 ? `L${Math.round(Math.abs(track.pan) * 100)}` : `R${Math.round(track.pan * 100)}`}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={track.pan}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handlePanChange(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-secondary bg-border-custom cursor-pointer"
              />
            </div>
          </div>

          {/* Collapsible/Interactive Audio Compressor Block */}
          <div className="p-2 bg-panel border-2 border-ink shadow-[2px_2px_0px_#000]">
            <div className="flex items-center justify-between">
              <button
                id={`track-comp-${track.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateTrack({ ...track, compEnabled: !compEnabled });
                }}
                className={`text-[9px] font-bold font-mono px-2 py-0.5 uppercase flex items-center gap-1 cursor-pointer transition-all border ${
                  compEnabled 
                    ? 'bg-accent text-black border-accent font-extrabold shadow-inner' 
                    : 'bg-surface-raised border-border-custom text-ink hover:border-accent hover:text-accent'
                }`}
                title="Toggle Compressor (Shortcut: C)"
              >
                <Activity className="w-2.5 h-2.5" />
                <span>COMP</span>
                <span className="text-[7.5px] opacity-60 font-mono">[C]</span>
              </button>
              <span className={`text-[8px] font-mono font-bold uppercase tracking-wide ${compEnabled ? 'text-secondary' : 'text-ink-dim'}`}>
                {compEnabled ? 'ENGAGED' : 'BYPASS'}
              </span>
            </div>

            {compEnabled && (
              <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-border-custom">
                {/* Threshold slider */}
                <div>
                  <div className="flex justify-between items-center text-[8px] text-ink-dim font-mono mb-0.5">
                    <span>THRESH</span>
                    <span className="text-secondary font-bold">{compThreshold} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="0"
                    step="1"
                    value={compThreshold}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdateTrack({ ...track, compThreshold: parseInt(e.target.value) });
                    }}
                    className="w-full h-1 accent-secondary bg-border-custom cursor-pointer"
                  />
                </div>

                {/* Ratio slider */}
                <div>
                  <div className="flex justify-between items-center text-[8px] text-ink-dim font-mono mb-0.5">
                    <span>RATIO</span>
                    <span className="text-secondary font-bold">{compRatio}:1</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="8"
                    step="0.5"
                    value={compRatio}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdateTrack({ ...track, compRatio: parseFloat(e.target.value) });
                    }}
                    className="w-full h-1 accent-secondary bg-border-custom cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Metering Bridge */}
        <div 
          onClick={handleClearClip}
          className="w-[66px] bg-black border-2 border-ink p-1.5 flex flex-col items-center justify-between relative group hover:border-accent transition-all shadow-[2px_2px_0px_#000]"
          title="Click to reset clipping indicator"
        >
          {/* Header readout */}
          <div className="w-full flex flex-col items-center gap-0.5 mb-1 text-center select-none">
            {/* CLIP light & LABEL */}
            <div className="flex items-center gap-1">
              <div 
                ref={clipLightRef}
                className="w-2 h-2 border border-ink bg-zinc-800 transition-all duration-75" 
              />
              <span className="text-[7px] text-ink-dim font-bold font-mono tracking-tighter uppercase">CLIP</span>
            </div>
            {/* Peak & RMS readout db */}
            <span 
              ref={peakTextRef}
              className="text-[7px] font-mono text-accent font-bold leading-none min-h-[8px] w-full block truncate"
              title="Peak and RMS levels in dB"
            >
              P:- R:-
            </span>
          </div>

          {/* LED Meter displays side by side (VU PK on left, VU RMS in center, GR on right) */}
          <div className="flex-1 w-full flex gap-1 bg-black p-1 border border-ink/50 min-h-[110px] relative">
            
            {/* VU Peak Meter */}
            <div className="flex-1 h-full bg-zinc-950 relative overflow-hidden flex flex-col justify-end" title="Real-time Peak Level (Transient)">
              <div
                ref={meterBarRef}
                className="w-full bg-accent transition-all duration-75 origin-bottom"
                style={{ height: '0%' }}
              />
              {/* Peak line holder */}
              <div
                ref={peakLineRef}
                className="absolute left-0 right-0 h-[2px] bg-secondary transition-all duration-75"
                style={{ bottom: '0%' }}
              />
            </div>

            {/* VU RMS Meter */}
            <div className="flex-1 h-full bg-zinc-950 relative overflow-hidden flex flex-col justify-end" title="Root Mean Square (Average Energy/Loudness)">
              <div
                ref={rmsBarRef}
                className="w-full bg-secondary transition-all duration-75 origin-bottom"
                style={{ height: '0%' }}
              />
            </div>

            {/* GR Meter */}
            <div className="w-[8px] h-full bg-zinc-950 relative overflow-hidden flex flex-col justify-start" title="Compressor Gain Reduction">
              <div
                ref={grBarRef}
                className="w-full bg-accent transition-all duration-75 origin-top"
                style={{ height: '0%' }}
              />
            </div>
            
            {/* Scale overlay notches */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[6px] font-mono text-zinc-500 select-none px-0.5 pt-1.5 pb-1 font-bold">
              <span className="leading-none">0</span>
              <span className="leading-none">-6</span>
              <span className="leading-none">-12</span>
              <span className="leading-none">-24</span>
              <span className="leading-none">-40</span>
            </div>
          </div>

          {/* Subtitle / Labels */}
          <div className="w-full mt-1 flex justify-between items-center text-[6px] font-mono font-black tracking-tight select-none border-t border-ink/40 pt-1">
            <div className="flex flex-col items-start leading-none text-left">
              <span className="text-accent">PK</span>
              <span className="text-secondary">RMS</span>
            </div>
            <div className="flex flex-col items-end leading-none text-right">
              <span className="text-accent">GR</span>
              <span ref={grTextRef} className="text-[6px] text-ink-dim font-normal">0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
