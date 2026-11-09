import React, { useEffect, useRef } from 'react';
import { Track } from '../types';
import { audioEngine } from '../services/audioEngine';

interface MiniPeakMeterProps {
  track: Track;
  anySoloed?: boolean;
  orientation?: 'horizontal' | 'vertical';
  showDbText?: boolean;
  showClipIndicator?: boolean;
  height?: number | string;
  width?: number | string;
  className?: string;
}

export const MiniPeakMeter: React.FC<MiniPeakMeterProps> = ({
  track,
  anySoloed = false,
  orientation = 'horizontal',
  showDbText = true,
  showClipIndicator = true,
  height,
  width,
  className = '',
}) => {
  const barRef = useRef<HTMLDivElement | null>(null);
  const rmsBarRef = useRef<HTMLDivElement | null>(null);
  const peakHoldTickRef = useRef<HTMLDivElement | null>(null);
  const dbTextRef = useRef<HTMLSpanElement | null>(null);
  const clipBadgeRef = useRef<HTMLSpanElement | null>(null);

  const currentLevelRef = useRef<number>(-60);
  const currentRmsRef = useRef<number>(-60);
  const peakHoldRef = useRef<number>(-60);
  const lastPeakTimeRef = useRef<number>(0);
  const isClippingRef = useRef<boolean>(false);

  useEffect(() => {
    let animId: number;

    const updateMeter = () => {
      const isPlaying = audioEngine.isPlaying;
      const isSilenced = track.muted || (anySoloed && !track.soloed);

      let targetPeakDb = -60;
      let targetRmsDb = -60;

      if (isSilenced) {
        targetPeakDb = -60;
        targetRmsDb = -60;
      } else if (isPlaying) {
        // First check if Web Audio analyser has active signal for this track
        const realAudio = audioEngine.getTrackAudioLevel?.(track.id);
        
        if (realAudio && realAudio.peak > 0.005) {
          targetPeakDb = realAudio.db;
          targetRmsDb = Math.max(-60, realAudio.db - 4);
        } else {
          // Dynamic algorithmic envelope based on rhythmic clocks & track volume
          const bpm = audioEngine.bpm || 120;
          const beatDuration = 60 / bpm;
          const nowSecs = Date.now() / 1000;
          let baseSignal = 0.08;

          if (track.type === 'drums') {
            const elapsed = nowSecs % (beatDuration / 2);
            const transient = Math.exp(-elapsed * 9.0);
            const subThump = Math.exp(-(nowSecs % beatDuration) * 4.5) * 0.7;
            baseSignal = Math.max(0.01, transient * 0.9 + subThump + Math.random() * 0.04);
          } else if (track.type === 'synth') {
            const osc1 = Math.sin(nowSecs * 3.2) * 0.35 + 0.55;
            const osc2 = Math.sin(nowSecs * 8.5) * 0.15;
            baseSignal = Math.max(0.01, osc1 + osc2 + Math.random() * 0.03);
          } else if (track.type === 'bass') {
            const pulse = Math.cos(nowSecs * 4.2) * 0.3 + 0.65;
            const sub = Math.sin(nowSecs * 14.0) * 0.08;
            baseSignal = Math.max(0.01, pulse + sub + Math.random() * 0.02);
          } else {
            const wave = Math.sin(nowSecs * 1.8) * 0.4 + 0.5;
            baseSignal = Math.max(0.01, wave + Math.random() * 0.03);
          }

          // Scale signal directly by track volume fader
          const scaledSignal = baseSignal * track.volume;
          targetPeakDb = 20 * Math.log10(scaledSignal || 0.0001);
          targetPeakDb = Math.max(-60, Math.min(3, targetPeakDb));
          
          // Calculate RMS
          const crest = track.type === 'drums' ? 10 : track.type === 'synth' ? 5 : 4;
          targetRmsDb = Math.max(-60, targetPeakDb - crest);
        }
      }

      // Ballistics: fast attack, logarithmic release
      const diffPeak = targetPeakDb - currentLevelRef.current;
      const attackSpeed = diffPeak > 0 ? 0.45 : 0.12;
      currentLevelRef.current += diffPeak * attackSpeed;

      const diffRms = targetRmsDb - currentRmsRef.current;
      currentRmsRef.current += diffRms * (diffRms > 0 ? 0.2 : 0.08);

      if (currentLevelRef.current < -60) currentLevelRef.current = -60;
      if (currentRmsRef.current < -60) currentRmsRef.current = -60;

      // Peak hold logic
      const now = Date.now();
      if (currentLevelRef.current > peakHoldRef.current) {
        peakHoldRef.current = currentLevelRef.current;
        lastPeakTimeRef.current = now;
      } else if (now - lastPeakTimeRef.current > 1200) {
        peakHoldRef.current = Math.max(-60, peakHoldRef.current - 0.35);
      }

      // Clipping detection
      if (currentLevelRef.current >= 0) {
        isClippingRef.current = true;
      }

      // Convert dB range (-48dB to +3dB) to percentage (0% - 100%)
      const minDb = -48;
      const maxDb = 3;
      const peakPct = Math.max(0, Math.min(100, ((currentLevelRef.current - minDb) / (maxDb - minDb)) * 100));
      const rmsPct = Math.max(0, Math.min(100, ((currentRmsRef.current - minDb) / (maxDb - minDb)) * 100));
      const holdPct = Math.max(0, Math.min(100, ((peakHoldRef.current - minDb) / (maxDb - minDb)) * 100));

      // Update DOM styles
      if (barRef.current) {
        if (orientation === 'horizontal') {
          barRef.current.style.width = `${peakPct}%`;
        } else {
          barRef.current.style.height = `${peakPct}%`;
        }
      }

      if (rmsBarRef.current) {
        if (orientation === 'horizontal') {
          rmsBarRef.current.style.width = `${rmsPct}%`;
        } else {
          rmsBarRef.current.style.height = `${rmsPct}%`;
        }
      }

      if (peakHoldTickRef.current) {
        if (orientation === 'horizontal') {
          peakHoldTickRef.current.style.left = `${holdPct}%`;
        } else {
          peakHoldTickRef.current.style.bottom = `${holdPct}%`;
        }
      }

      if (dbTextRef.current) {
        if (isSilenced) {
          dbTextRef.current.textContent = 'MUTED';
          dbTextRef.current.style.color = '#f43f5e';
        } else if (!isPlaying) {
          dbTextRef.current.textContent = '-∞ dB';
          dbTextRef.current.style.color = '#71717a';
        } else {
          const val = currentLevelRef.current;
          dbTextRef.current.textContent = val <= -48 ? '-∞ dB' : `${val > 0 ? '+' : ''}${val.toFixed(1)} dB`;
          dbTextRef.current.style.color = val >= 0 ? '#ef4444' : val > -6 ? '#fbbf24' : '#00F0FF';
        }
      }

      if (clipBadgeRef.current) {
        if (isClippingRef.current) {
          clipBadgeRef.current.style.backgroundColor = '#ef4444';
          clipBadgeRef.current.style.color = '#000000';
          clipBadgeRef.current.style.boxShadow = '0 0 6px rgba(239, 68, 68, 0.8)';
        } else {
          clipBadgeRef.current.style.backgroundColor = 'transparent';
          clipBadgeRef.current.style.color = '#52525b';
          clipBadgeRef.current.style.boxShadow = 'none';
        }
      }

      animId = requestAnimationFrame(updateMeter);
    };

    animId = requestAnimationFrame(updateMeter);
    return () => cancelAnimationFrame(animId);
  }, [track.id, track.volume, track.muted, track.soloed, track.type, anySoloed, orientation]);

  const handleResetClip = (e: React.MouseEvent) => {
    e.stopPropagation();
    isClippingRef.current = false;
    peakHoldRef.current = currentLevelRef.current;
    if (clipBadgeRef.current) {
      clipBadgeRef.current.style.backgroundColor = 'transparent';
      clipBadgeRef.current.style.color = '#52525b';
      clipBadgeRef.current.style.boxShadow = 'none';
    }
  };

  if (orientation === 'vertical') {
    return (
      <div 
        id={`mini-peak-meter-v-${track.id}`}
        className={`flex flex-col items-center gap-1 select-none font-mono ${className}`}
        style={{ height: height || '100%', width: width || 28 }}
      >
        {showClipIndicator && (
          <span
            ref={clipBadgeRef}
            onClick={handleResetClip}
            className="text-[7px] font-black uppercase px-1 rounded-xs cursor-pointer border border-zinc-800 transition-colors"
            title="Clip indicator (Click to reset)"
          >
            CLIP
          </span>
        )}

        <div className="flex-1 w-full bg-zinc-950 border border-white/10 relative overflow-hidden rounded-xs flex flex-col justify-end p-0.5">
          {/* Background meter gradient guides */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 via-amber-500/10 to-rose-500/10 pointer-events-none" />

          {/* RMS Bar (Loudness) */}
          <div
            ref={rmsBarRef}
            className="w-full bg-white/20 absolute bottom-0 left-0 transition-all duration-75 origin-bottom"
            style={{ height: '0%' }}
          />

          {/* Peak Level Bar */}
          <div
            ref={barRef}
            className="w-full bg-gradient-to-t from-emerald-400 via-amber-400 to-rose-500 transition-all duration-75 origin-bottom rounded-xs relative z-10"
            style={{ height: '0%' }}
          />

          {/* Peak Hold Line */}
          <div
            ref={peakHoldTickRef}
            className="absolute left-0 right-0 h-[2px] bg-white shadow-[0_0_4px_#fff] z-20 transition-all duration-75"
            style={{ bottom: '0%' }}
          />

          {/* Scale ticks */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[6px] text-zinc-500 font-bold px-0.5 py-0.5 select-none z-30">
            <span>+3</span>
            <span>0</span>
            <span>-6</span>
            <span>-18</span>
            <span>-36</span>
          </div>
        </div>

        {showDbText && (
          <span 
            ref={dbTextRef}
            className="text-[7.5px] font-bold text-center tracking-tighter truncate w-full"
          >
            -∞ dB
          </span>
        )}
      </div>
    );
  }

  // Horizontal orientation (default)
  return (
    <div
      id={`mini-peak-meter-h-${track.id}`}
      className={`flex items-center gap-1.5 select-none font-mono ${className}`}
      style={{ height: height || 14, width: width || '100%' }}
    >
      {/* LED Meter Track */}
      <div className="flex-1 h-2 bg-zinc-950 border border-white/15 relative overflow-hidden rounded-xs flex items-center">
        {/* Background gradient zones */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/15 via-amber-500/15 to-rose-500/20 pointer-events-none" />

        {/* Segment notches overlay */}
        <div className="absolute inset-0 grid grid-cols-12 gap-[1px] pointer-events-none opacity-40 z-30">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="border-r border-black/80 h-full" />
          ))}
        </div>

        {/* RMS Underlay */}
        <div
          ref={rmsBarRef}
          className="h-full bg-white/25 absolute left-0 top-0 transition-all duration-75 origin-left"
          style={{ width: '0%' }}
        />

        {/* Dynamic Peak Level Bar */}
        <div
          ref={barRef}
          className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-75 origin-left relative z-10"
          style={{ width: '0%' }}
        />

        {/* Peak Hold Tick Marker */}
        <div
          ref={peakHoldTickRef}
          className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_4px_#fff] z-20 transition-all duration-75"
          style={{ left: '0%' }}
        />
      </div>

      {/* Numerical Level Readout */}
      {showDbText && (
        <span
          ref={dbTextRef}
          className="text-[8px] font-bold tracking-tight min-w-[38px] text-right"
        >
          -∞ dB
        </span>
      )}

      {/* Interactive Clip Light */}
      {showClipIndicator && (
        <span
          ref={clipBadgeRef}
          onClick={handleResetClip}
          className="text-[6.5px] font-black uppercase px-1 py-0.2 rounded-xs cursor-pointer border border-zinc-800 text-zinc-500 transition-colors"
          title="Peak Overload Clip Indicator (Click to Reset)"
        >
          CLIP
        </span>
      )}
    </div>
  );
};
