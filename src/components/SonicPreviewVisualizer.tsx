import React, { useMemo } from 'react';
import { PresetTemplate } from '../types';

export interface SonicProfile {
  presetId: string;
  presetName: string;
  genre: string;
  textureTag: string;
  textureDesc: string;
  harmonicTag: string;
  glowColor: string;
  accentBg: string;
  borderAccent: string;
  waveformPoints: number[]; // 64 points in [-1, 1]
  spectralBins: number[];   // 16 frequency bands [0, 1]
  transientSharpness: number; // 0..100
  distortionLevel: string; // e.g. "HEAVY CLIPPED", "SATURATED TAPE", "BITCRUSH 12-BIT"
  frequencyHighlight: string; // e.g. "45Hz Sub Peak • 2.4kHz Metal Stab"
}

/**
 * Computes a distinct, believable, high-fidelity sonic texture profile
 * for any preset based on its sub-genre, tracks, synth configuration, drum patterns, and EQ.
 */
export function getPresetSonicProfile(preset: PresetTemplate): SonicProfile {
  const genreLower = (preset.genre || preset.category || '').toLowerCase();
  const nameLower = preset.name.toLowerCase();
  const descLower = (preset.description || '').toLowerCase();

  // Find synth and bass tracks
  const synthTrack = preset.tracks?.find(t => t.type === 'synth');
  const osc = synthTrack?.synthConfig?.oscillator || 'sawtooth';
  const cutoff = synthTrack?.synthConfig?.cutoff || 2500;
  const bassBoost = (preset.eq?.bass || 0) > 3;

  // 1. Underground Industrial
  if (genreLower.includes('industrial') || genreLower.includes('ebm') || nameLower.includes('grind') || nameLower.includes('scrap')) {
    const points: number[] = [];
    for (let i = 0; i < 64; i++) {
      const phase = i / 64;
      // High-frequency harsh clipped saw with metallic ringing
      const saw = 2 * ((phase * 4) % 1) - 1;
      const ringing = Math.sin(phase * 32 * Math.PI) * 0.35;
      const kickImpulse = (i < 14) ? Math.sin((i / 14) * Math.PI) * 1.4 : 0;
      const raw = saw * 1.6 + ringing + kickImpulse;
      // Hard clipping saturation
      const clipped = Math.max(-0.85, Math.min(0.85, raw * 1.5));
      points.push(clipped);
    }
    const spectralBins = [0.82, 0.90, 0.74, 0.65, 0.60, 0.75, 0.88, 0.92, 0.85, 0.80, 0.72, 0.68, 0.60, 0.52, 0.45, 0.38];
    return {
      presetId: preset.id,
      presetName: preset.name,
      genre: 'Underground Industrial',
      textureTag: 'CLIPPED SAW / INDUSTRIAL HAMMER',
      textureDesc: 'Distorted 4/4 warehouse kick, jagged sawtooth clipping, and harsh resonant modular feedback.',
      harmonicTag: 'ODD HARMONICS • CLIPPED',
      glowColor: '#00f0ff',
      accentBg: 'rgba(0, 240, 255, 0.12)',
      borderAccent: 'rgba(0, 240, 255, 0.45)',
      waveformPoints: points,
      spectralBins,
      transientSharpness: 94,
      distortionLevel: 'HARSH DIODE CLIP',
      frequencyHighlight: '50Hz Overdriven Kick • 3.2kHz Resonant Anvil'
    };
  }

  // 2. Horrorcore
  if (genreLower.includes('horror') || nameLower.includes('crypt') || nameLower.includes('ritual') || descLower.includes('tritone')) {
    const points: number[] = [];
    for (let i = 0; i < 64; i++) {
      const phase = i / 64;
      // Low sub sine + dissonant tritone harmonic ringing
      const sub = Math.sin(phase * 2 * Math.PI) * 0.9;
      const tritoneBell = Math.sin(phase * 2 * Math.sqrt(2) * 6 * Math.PI) * 0.4 * Math.exp(-phase * 1.8);
      const eerieDecay = (sub + tritoneBell) * (1 - phase * 0.3);
      points.push(Math.max(-0.9, Math.min(0.9, eerieDecay)));
    }
    const spectralBins = [0.95, 0.88, 0.45, 0.28, 0.20, 0.25, 0.68, 0.82, 0.75, 0.40, 0.30, 0.22, 0.18, 0.15, 0.12, 0.08];
    return {
      presetId: preset.id,
      presetName: preset.name,
      genre: 'Horrorcore',
      textureTag: 'TRITONE BELL / SUBVOID RUMBLE',
      textureDesc: 'Subterranean 35Hz sub-bass drone, detuned gothic tritone bells, and eerie tape decay.',
      harmonicTag: 'TRITONE DISSONANCE',
      glowColor: '#ff0055',
      accentBg: 'rgba(255, 0, 85, 0.14)',
      borderAccent: 'rgba(255, 0, 85, 0.5)',
      waveformPoints: points,
      spectralBins,
      transientSharpness: 72,
      distortionLevel: 'TAPE SATURATION 666',
      frequencyHighlight: '35Hz Deep Sub • 1.8kHz & 3.6kHz Dissonant Peaks'
    };
  }

  // 3. Memphis Phonk
  if (genreLower.includes('phonk') || genreLower.includes('memphis') || nameLower.includes('cowbell') || descLower.includes('phonk')) {
    const points: number[] = [];
    for (let i = 0; i < 64; i++) {
      const phase = i / 64;
      // Heavy 808 sub sweep + distinct pitched cowbell square/pulse ringing
      const sub808 = Math.sin(phase * 3 * Math.PI) * 0.85;
      const cowbell = (Math.sin(phase * 16 * Math.PI) > 0 ? 0.35 : -0.35) * Math.exp(-phase * 3.5);
      const tapeWarmth = Math.tanh((sub808 + cowbell) * 1.5);
      points.push(tapeWarmth);
    }
    const spectralBins = [0.98, 0.92, 0.65, 0.35, 0.22, 0.30, 0.72, 0.86, 0.78, 0.48, 0.38, 0.28, 0.20, 0.15, 0.10, 0.06];
    return {
      presetId: preset.id,
      presetName: preset.name,
      genre: 'Memphis Phonk',
      textureTag: 'TAPE-SATURATED 808 / COWBELL',
      textureDesc: 'Classic 1993 cassette grit, resonant pitched cowbell harmonics, and warm sliding 808 sub punch.',
      harmonicTag: 'WARM ANALOG SATURATION',
      glowColor: '#d946ef',
      accentBg: 'rgba(217, 70, 239, 0.14)',
      borderAccent: 'rgba(217, 70, 239, 0.5)',
      waveformPoints: points,
      spectralBins,
      transientSharpness: 86,
      distortionLevel: '1993 CASSETTE HEAT',
      frequencyHighlight: '45Hz 808 Boom • 1.1kHz Tuned Cowbell'
    };
  }

  // 4. Witch Hop
  if (genreLower.includes('witch') || nameLower.includes('salem') || descLower.includes('witch') || nameLower.includes('void')) {
    const points: number[] = [];
    for (let i = 0; i < 64; i++) {
      const phase = i / 64;
      // Slow sidechain pumping low-freq drone + diffuse washed reverb tail
      const pump = (1 - Math.cos(phase * 4 * Math.PI)) * 0.5;
      const drone = Math.sin(phase * 2.5 * Math.PI) * pump * 0.8;
      const reverbWash = (Math.sin(phase * 7 * Math.PI) + Math.sin(phase * 13 * Math.PI)) * 0.2;
      points.push(Math.max(-0.85, Math.min(0.85, drone + reverbWash)));
    }
    const spectralBins = [0.94, 0.85, 0.70, 0.62, 0.55, 0.50, 0.45, 0.40, 0.35, 0.30, 0.25, 0.20, 0.16, 0.12, 0.08, 0.05];
    return {
      presetId: preset.id,
      presetName: preset.name,
      genre: 'Witch Hop',
      textureTag: 'PUMPING REVERB VOID / GHOST DRONE',
      textureDesc: 'Dragging 112 BPM darkwave rhythm, cavernous Salem reverb wash, and subterranean sub swell.',
      harmonicTag: 'DIFFUSE OCCULT REVERB',
      glowColor: '#a855f7',
      accentBg: 'rgba(168, 85, 247, 0.16)',
      borderAccent: 'rgba(168, 85, 247, 0.5)',
      waveformPoints: points,
      spectralBins,
      transientSharpness: 60,
      distortionLevel: 'DIFFUSE OCCULT VOID',
      frequencyHighlight: '40Hz Sub Octave • 400-800Hz Reverb Tail'
    };
  }

  // 5. Dungeon Trap
  if (genreLower.includes('dungeon') || nameLower.includes('crawler') || nameLower.includes('medieval') || descLower.includes('dungeon')) {
    const points: number[] = [];
    for (let i = 0; i < 64; i++) {
      const phase = i / 64;
      // 12-bit quantized staircase wave + modal fantasy flute/bell overtone
      const flute = Math.sin(phase * 5 * Math.PI) + 0.4 * Math.sin(phase * 10 * Math.PI);
      const subThud = (i < 16) ? Math.sin((i / 16) * Math.PI) * 0.6 : 0;
      const continuous = flute + subThud;
      // 12-bit stepping effect (quantization)
      const quantized = Math.round(continuous * 6) / 6;
      points.push(Math.max(-0.9, Math.min(0.9, quantized)));
    }
    const spectralBins = [0.90, 0.82, 0.55, 0.40, 0.58, 0.74, 0.65, 0.50, 0.42, 0.35, 0.28, 0.22, 0.18, 0.14, 0.10, 0.08];
    return {
      presetId: preset.id,
      presetName: preset.name,
      genre: 'Dungeon Trap',
      textureTag: '12-BIT QUANTIZED FLUTE / 808',
      textureDesc: '90s RPG fantasy synth flutes quantized to 12-bit grit, coupled with rolling crypt 808 bass.',
      harmonicTag: '12-BIT STEPPED MODAL',
      glowColor: '#32ff7e',
      accentBg: 'rgba(50, 255, 126, 0.12)',
      borderAccent: 'rgba(50, 255, 126, 0.45)',
      waveformPoints: points,
      spectralBins,
      transientSharpness: 78,
      distortionLevel: '12-BIT DAC CRUSH',
      frequencyHighlight: '42Hz Trap Sub • 750Hz Modal Flute Resonance'
    };
  }

  // 6. Dark Sigilcore
  if (genreLower.includes('sigil') || genreLower.includes('glitch') || nameLower.includes('sigil') || nameLower.includes('hyper')) {
    const points: number[] = [];
    for (let i = 0; i < 64; i++) {
      const phase = i / 64;
      // Hyperspeed micro-stutter bursts + bitcrushed high-frequency fizz
      const stutterBurst = (i % 8 < 3 ? 1 : -0.7) * Math.sin(phase * 16 * Math.PI);
      const highFizz = (i % 4 === 0 ? 0.3 : -0.3) * (Math.random() * 0.3 + 0.7);
      const raw = stutterBurst + highFizz;
      const crushed = Math.floor(raw * 5) / 5;
      points.push(Math.max(-0.9, Math.min(0.9, crushed)));
    }
    const spectralBins = [0.75, 0.70, 0.60, 0.55, 0.68, 0.82, 0.90, 0.95, 0.98, 0.94, 0.90, 0.85, 0.78, 0.70, 0.62, 0.55];
    return {
      presetId: preset.id,
      presetName: preset.name,
      genre: 'Dark Sigilcore',
      textureTag: 'BITCRUSHED MICRO-BURST / HIGH FIZZ',
      textureDesc: 'Frantic 164 BPM hyper-arpeggios, extreme high-frequency bitcrush fizz, and rapid 808 clips.',
      harmonicTag: 'HYPER-SPEED TRANSIENTS',
      glowColor: '#f59e0b',
      accentBg: 'rgba(245, 158, 11, 0.14)',
      borderAccent: 'rgba(245, 158, 11, 0.5)',
      waveformPoints: points,
      spectralBins,
      transientSharpness: 98,
      distortionLevel: 'BITCRUSH CHOPPER',
      frequencyHighlight: '80Hz Snappy Sub • 12kHz-16kHz Hyper-Fizz'
    };
  }

  // 7. Metalstep
  if (genreLower.includes('metal') || genreLower.includes('djent') || nameLower.includes('djent') || nameLower.includes('chug')) {
    const points: number[] = [];
    for (let i = 0; i < 64; i++) {
      const phase = i / 64;
      // Heavy dual saw chug with scooped mids and seismic low-end drop
      const saw1 = 2 * ((phase * 3.5) % 1) - 1;
      const saw2 = 2 * ((phase * 3.52) % 1) - 1;
      const chugGating = (phase % 0.25 < 0.14) ? 1.4 : 0.2;
      const subDrop = Math.sin(phase * 2 * Math.PI) * 0.7;
      const raw = (saw1 + saw2) * chugGating + subDrop;
      points.push(Math.tanh(raw * 1.8));
    }
    const spectralBins = [0.98, 0.94, 0.88, 0.42, 0.25, 0.35, 0.70, 0.88, 0.95, 0.92, 0.85, 0.78, 0.65, 0.50, 0.40, 0.30];
    return {
      presetId: preset.id,
      presetName: preset.name,
      genre: 'Metalstep',
      textureTag: 'DJENT CHUG SAW / SEISMIC SUB',
      textureDesc: 'Brutal dual sawtooth guitar-emulation chugs, asymmetric overdrive, scooped mids, and half-time drops.',
      harmonicTag: 'WALL-OF-SOUND GAIN',
      glowColor: '#ef4444',
      accentBg: 'rgba(239, 68, 68, 0.16)',
      borderAccent: 'rgba(239, 68, 68, 0.55)',
      waveformPoints: points,
      spectralBins,
      transientSharpness: 96,
      distortionLevel: 'HIGH-GAIN DJENT STACK',
      frequencyHighlight: '32Hz Seismic Sub • 2.8kHz Guitar Bite'
    };
  }

  // Fallback procedural profile based on tracks & config
  const points: number[] = [];
  for (let i = 0; i < 64; i++) {
    const phase = i / 64;
    let wave = 0;
    if (osc === 'sawtooth') {
      wave = 2 * ((phase * 3) % 1) - 1;
    } else if (osc === 'square') {
      wave = ((phase * 3) % 1) < 0.5 ? 0.7 : -0.7;
    } else if (osc === 'triangle') {
      wave = 2 * Math.abs(2 * ((phase * 3) % 1) - 1) - 1;
    } else {
      wave = Math.sin(phase * 3 * 2 * Math.PI);
    }
    if (bassBoost) wave += Math.sin(phase * 1.5 * Math.PI) * 0.4;
    points.push(Math.max(-0.9, Math.min(0.9, wave)));
  }

  const spectralBins = [0.80, 0.75, 0.65, 0.50, 0.45, 0.52, 0.60, 0.65, 0.58, 0.50, 0.42, 0.35, 0.28, 0.22, 0.18, 0.12];
  return {
    presetId: preset.id,
    presetName: preset.name,
    genre: preset.genre || 'Dark Electronic',
    textureTag: `${osc.toUpperCase()} CORE / ${preset.bpm} BPM`,
    textureDesc: preset.description || `Synthesized ${osc} engine with dynamic filter resonance at ${cutoff}Hz.`,
    harmonicTag: 'ANALOG HARMONICS',
    glowColor: '#00f0ff',
    accentBg: 'rgba(0, 240, 255, 0.1)',
    borderAccent: 'rgba(0, 240, 255, 0.4)',
    waveformPoints: points,
    spectralBins,
    transientSharpness: 80,
    distortionLevel: 'OVERDRIVE DRIVE',
    frequencyHighlight: `${preset.bpm} BPM • ${cutoff}Hz Cutoff`
  };
}

/**
 * Small inline glowing waveform component (used inside dropdown rows, preset cards, or quick audition rows)
 */
export const MiniGlowingWaveform: React.FC<{
  points: number[];
  color: string;
  width?: number;
  height?: number;
  isHovered?: boolean;
  mode?: 'wave' | 'spectrum';
  spectralBins?: number[];
}> = ({ points, color, width = 64, height = 20, isHovered = false, mode = 'wave', spectralBins }) => {
  const pathD = useMemo(() => {
    if (mode === 'spectrum' || !points || points.length === 0) return '';
    const w = width;
    const h = height;
    const midY = h / 2;
    const step = w / (points.length - 1);

    return points
      .map((y, idx) => {
        const px = (idx * step).toFixed(1);
        const py = (midY - y * (h * 0.42)).toFixed(1);
        return `${idx === 0 ? 'M' : 'L'} ${px} ${py}`;
      })
      .join(' ');
  }, [points, width, height, mode]);

  if (mode === 'spectrum' && spectralBins && spectralBins.length > 0) {
    const barCount = Math.min(12, spectralBins.length);
    const barWidth = Math.max(2, (width / barCount) - 1.5);
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="shrink-0 overflow-visible transition-transform duration-150"
        style={{
          filter: isHovered 
            ? `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 8px ${color})` 
            : `drop-shadow(0 0 2px ${color})`
        }}
      >
        {spectralBins.slice(0, barCount).map((val, i) => {
          const barH = Math.max(2, val * (height - 3));
          const x = i * (barWidth + 1.5);
          const y = height - barH;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={1}
              fill={color}
              opacity={isHovered ? 1 : 0.8}
            />
          );
        })}
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible transition-transform duration-150"
      style={{
        filter: isHovered 
          ? `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 9px ${color})` 
          : `drop-shadow(0 0 2px ${color})`
      }}
    >
      {/* Background centerline guide */}
      <line
        x1={0}
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      {/* Glowing Polyline Waveform */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={isHovered ? '2' : '1.5'}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isHovered ? 1 : 0.85}
      />
    </svg>
  );
};

/**
 * Full Interactive Sonic Texture & Glowing Oscilloscope / Spectral Screen
 * Shown prominently in the preset selector, reactive to hover and current selection.
 */
export const SonicTextureDisplay: React.FC<{
  profile: SonicProfile;
  isHoverPreview: boolean;
  displayMode: 'wave' | 'spectrum';
  onToggleDisplayMode: () => void;
}> = ({ profile, isHoverPreview, displayMode, onToggleDisplayMode }) => {
  const width = 236;
  const height = 56;

  // Build SVG path for oscilloscope
  const wavePath = useMemo(() => {
    const pts = profile.waveformPoints;
    const midY = height / 2;
    const step = width / (pts.length - 1);
    return pts
      .map((y, idx) => {
        const px = (idx * step).toFixed(1);
        const py = (midY - y * (height * 0.42)).toFixed(1);
        return `${idx === 0 ? 'M' : 'L'} ${px} ${py}`;
      })
      .join(' ');
  }, [profile.waveformPoints, width, height]);

  // Under-glow area path
  const areaPath = useMemo(() => {
    const pts = profile.waveformPoints;
    const midY = height / 2;
    const step = width / (pts.length - 1);
    let str = `M 0 ${midY} `;
    pts.forEach((y, idx) => {
      const px = (idx * step).toFixed(1);
      const py = (midY - y * (height * 0.42)).toFixed(1);
      str += `L ${px} ${py} `;
    });
    str += `L ${width} ${midY} Z`;
    return str;
  }, [profile.waveformPoints, width, height]);

  return (
    <div
      className="relative rounded border flex flex-col overflow-hidden transition-all duration-200 select-none"
      style={{
        backgroundColor: profile.accentBg,
        borderColor: isHoverPreview ? profile.glowColor : profile.borderAccent,
        boxShadow: isHoverPreview ? `0 0 14px ${profile.glowColor}40` : 'none'
      }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-black/60 border-b border-white/10 text-[8.5px] font-mono">
        <div className="flex items-center gap-1.5 truncate">
          {isHoverPreview ? (
            <span className="flex items-center gap-1 font-bold text-amber-300 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
              <span>HOVER PREVIEW</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 font-bold" style={{ color: profile.glowColor }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: profile.glowColor }} />
              <span>SONIC TEXTURE CUE</span>
            </span>
          )}
          <span className="text-zinc-400 opacity-60">|</span>
          <span className="truncate text-white font-semibold">{profile.presetName}</span>
        </div>

        {/* Waveform / Spectrum Toggle */}
        <button
          onClick={onToggleDisplayMode}
          className="text-[7.5px] font-mono uppercase px-1.5 py-0.5 rounded border border-white/20 hover:border-white/40 text-zinc-300 hover:text-white bg-black/40 cursor-pointer transition-colors"
          title="Toggle between Waveform Oscilloscope and Spectral FFT"
        >
          {displayMode === 'wave' ? '⚡ WAVE' : '📊 SPECTRUM'}
        </button>
      </div>

      {/* Main Screen (CRT Oscilloscope / Spectrum Area) */}
      <div className="relative px-2 py-1.5 bg-[#050508] flex items-center justify-center overflow-hidden">
        {/* CRT Phosphor Scanline Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
            backgroundSize: '16px 8px'
          }}
        />

        {displayMode === 'wave' ? (
          <div className="relative w-full flex items-center justify-center">
            <svg
              width="100%"
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              className="overflow-visible"
              style={{
                filter: `drop-shadow(0 0 5px ${profile.glowColor}) drop-shadow(0 0 10px ${profile.glowColor}60)`
              }}
            >
              <defs>
                <linearGradient id={`grad-area-${profile.presetId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={profile.glowColor} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={profile.glowColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid markings */}
              <line x1={0} y1={height * 0.25} x2={width} y2={height * 0.25} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1={0} y1={height * 0.5} x2={width} y2={height * 0.5} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1={0} y1={height * 0.75} x2={width} y2={height * 0.75} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1={width * 0.25} y1={0} x2={width * 0.25} y2={height} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1={width * 0.5} y1={0} x2={width * 0.5} y2={height} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1={width * 0.75} y1={0} x2={width * 0.75} y2={height} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

              {/* Area fill */}
              <path d={areaPath} fill={`url(#grad-area-${profile.presetId})`} />

              {/* Core Waveform Path */}
              <path
                d={wavePath}
                fill="none"
                stroke={profile.glowColor}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Glowing sweep cursor */}
            <div 
              className="absolute top-0 bottom-0 w-[2px] pointer-events-none opacity-80"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: `0 0 8px #fff, 0 0 16px ${profile.glowColor}`
              }}
            />
          </div>
        ) : (
          /* Spectrum Mode */
          <div className="relative w-full h-[56px] flex items-end justify-between gap-1 px-1 pt-2">
            {profile.spectralBins.map((binVal, idx) => {
              const hPercent = Math.max(8, Math.round(binVal * 100));
              const isPeak = binVal > 0.85;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                  {/* Peak dot */}
                  <div 
                    className="w-full h-[1.5px] rounded-full mb-0.5 transition-all duration-150"
                    style={{
                      backgroundColor: isPeak ? '#ffffff' : profile.glowColor,
                      boxShadow: isPeak ? `0 0 4px #ffffff` : `0 0 3px ${profile.glowColor}`
                    }}
                  />
                  {/* Glowing Bar */}
                  <div
                    className="w-full rounded-xs transition-all duration-150"
                    style={{
                      height: `${hPercent}%`,
                      backgroundColor: profile.glowColor,
                      opacity: 0.85,
                      boxShadow: `0 0 6px ${profile.glowColor}`
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Corner Decibel / Frequency Scale Markers */}
        <div className="absolute bottom-0.5 left-1 text-[7px] font-mono text-zinc-500 pointer-events-none">
          {displayMode === 'wave' ? '±1.0 FS' : '20Hz'}
        </div>
        <div className="absolute bottom-0.5 right-1 text-[7px] font-mono text-zinc-500 pointer-events-none">
          {displayMode === 'wave' ? 'TIME DOMAIN' : '20kHz AIR'}
        </div>
      </div>

      {/* Sonic Texture Metadata Footer */}
      <div className="px-2 py-1 bg-black/75 border-t border-white/5 flex flex-col gap-0.5">
        <div className="flex items-center justify-between text-[8px] font-mono">
          <span className="font-bold tracking-wider" style={{ color: profile.glowColor }}>
            {profile.textureTag}
          </span>
          <span className="text-[7.5px] px-1 py-0.2 rounded bg-white/10 text-zinc-300 font-mono">
            {profile.distortionLevel}
          </span>
        </div>

        <div className="text-[7.5px] font-mono text-zinc-400 flex items-center justify-between truncate">
          <span className="truncate opacity-80">{profile.frequencyHighlight}</span>
          <span className="text-[7px] text-zinc-500 font-mono shrink-0 ml-1">
            SNAP: {profile.transientSharpness}%
          </span>
        </div>
      </div>
    </div>
  );
};
