import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, Sliders, Clock, Activity, 
  ChevronDown, X, RefreshCw, Zap, ShieldCheck, Music
} from 'lucide-react';

interface WitchHouseBadgeProps {
  bpm: number;
  onReapplySettings?: () => void;
  onOpenDrums?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export const WitchHouseBadge: React.FC<WitchHouseBadgeProps> = ({
  bpm,
  onReapplySettings,
  onOpenDrums,
  onDismiss,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      {/* Main Badge Trigger Button */}
      <button
        id="witch-house-active-badge"
        onClick={() => setIsOpen(prev => !prev)}
        className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-sm border transition-all duration-200 cursor-pointer select-none font-mono ${
          isOpen
            ? 'bg-fuchsia-950 text-fuchsia-200 border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.5)]'
            : 'bg-gradient-to-r from-[#180826] to-[#250b38] hover:from-[#220c35] hover:to-[#320f4c] text-fuchsia-300 hover:text-fuchsia-100 border-fuchsia-500/60 hover:border-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.3)]'
        }`}
        title="Witch House Preset Active - Click to view confirmed project settings"
        aria-expanded={isOpen}
      >
        {/* Pulsing Occult Indicator Beacon */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500 shadow-[0_0_6px_#d946ef]" />
        </span>

        {/* Title with Gothic Crosses */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-fuchsia-300 group-hover:text-fuchsia-100 font-syne uppercase">
            † WITCH HOUSE †
          </span>
          <span className="hidden sm:inline-block text-[8px] font-bold uppercase px-1 py-0.2 bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 rounded-xs">
            ACTIVE
          </span>
        </div>

        {/* Key Settings Tags */}
        {!compact && (
          <div className="hidden md:flex items-center gap-1 border-l border-fuchsia-500/30 pl-1.5 text-[8.5px] font-mono">
            <span className="text-fuchsia-200 font-bold bg-black/40 px-1 py-0.5 rounded-xs border border-fuchsia-500/20">
              {bpm} BPM
            </span>
            <span className="text-fuchsia-300/80 hidden xl:inline">
              • DRAG 808
            </span>
            <span className="text-fuchsia-300/80 hidden xl:inline">
              • GHOST SNARES
            </span>
          </div>
        )}

        <ChevronDown className={`w-3 h-3 text-fuchsia-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Interactive Settings Confirmation Popover */}
      {isOpen && (
        <div
          id="witch-house-settings-popover"
          className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-[340px] sm:w-[380px] bg-[#0d0714]/98 border-2 border-fuchsia-500/70 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(217,70,239,0.35)] rounded-md backdrop-blur-xl z-50 text-ink font-mono select-none animate-in fade-in zoom-in-95 duration-150 p-3.5"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-2.5 mb-2.5 border-b border-fuchsia-500/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-sm bg-fuchsia-950/80 border border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_8px_rgba(217,70,239,0.4)]">
                <Sparkles className="w-4 h-4 text-fuchsia-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-fuchsia-200 tracking-wider font-syne uppercase">
                    † WITCH HOUSE PRESET †
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[8.5px] text-emerald-400 font-bold mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>PROJECT SETTINGS CONFIRMED &amp; VERIFIED</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-fuchsia-400 hover:text-white hover:bg-fuchsia-900/50 rounded-xs transition-colors cursor-pointer"
              title="Close Settings Details"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Confirmed Parameters Grid */}
          <div className="flex flex-col gap-2 text-[10px]">
            {/* Clock Speed & Tempo */}
            <div className="flex items-center justify-between p-2 bg-black/60 border border-fuchsia-500/20 rounded-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-fuchsia-400" />
                <span className="text-zinc-300 font-bold">Clock Speed / Tempo</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-fuchsia-300 bg-fuchsia-950/80 border border-fuchsia-500/40 px-1.5 py-0.5 rounded-xs">
                  {bpm}.0 BPM
                </span>
                <span className="text-[8px] text-fuchsia-400/80 uppercase">Half-Time</span>
              </div>
            </div>

            {/* Micro-Timing & Groove Profile */}
            <div className="flex items-center justify-between p-2 bg-black/60 border border-fuchsia-500/20 rounded-xs">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-fuchsia-400" />
                <span className="text-zinc-300 font-bold">Groove Profile</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-fuchsia-200 font-bold">Witch House Drag</span>
                <span className="text-[8px] bg-fuchsia-900/40 text-fuchsia-300 px-1 py-0.5 border border-fuchsia-500/30 rounded-xs">
                  +24ms drift
                </span>
              </div>
            </div>

            {/* 808 Sub Kick Cadence */}
            <div className="flex items-center justify-between p-2 bg-black/60 border border-fuchsia-500/20 rounded-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
                <span className="text-zinc-300 font-bold">808 Sub-Bass Kicks</span>
              </div>
              <span className="text-fuchsia-300 font-mono text-[9px] font-bold">
                Steps 0, 10, 16, 26 (Syncopated)
              </span>
            </div>

            {/* Ghost Snares & Backbeats */}
            <div className="flex items-center justify-between p-2 bg-black/60 border border-fuchsia-500/20 rounded-xs">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-fuchsia-400" />
                <span className="text-zinc-300 font-bold">Backbeats &amp; Ghost Snares</span>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-fuchsia-200 font-bold text-[9.5px]">Hits 8 &amp; 24</span>
                <span className="text-[7.5px] text-fuchsia-400 font-semibold">Ghosts: 14, 21, 27, 30</span>
              </div>
            </div>

            {/* Skittering Hi-Hat Trap Rolls */}
            <div className="flex items-center justify-between p-2 bg-black/60 border border-fuchsia-500/20 rounded-xs">
              <div className="flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-fuchsia-400" />
                <span className="text-zinc-300 font-bold">Hi-Hat Articulation</span>
              </div>
              <span className="text-fuchsia-300 text-[9px] font-bold">
                Dragging 8ths + 32nd Rolls (12-15, 28-31)
              </span>
            </div>

            {/* Occult Harmonic Palette */}
            <div className="flex items-center justify-between p-2 bg-black/60 border border-fuchsia-500/20 rounded-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-zinc-300 font-bold">Atmospheric Space</span>
              </div>
              <span className="text-emerald-300 font-bold text-[9px]">
                Low-Pass Dark Pad &amp; Cavernous Delay
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-fuchsia-500/30">
            {onReapplySettings && (
              <button
                onClick={() => {
                  onReapplySettings();
                  setIsOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-fuchsia-900/60 hover:bg-fuchsia-800 text-fuchsia-200 hover:text-white border border-fuchsia-500/50 hover:border-fuchsia-400 text-[9px] font-bold uppercase transition-all rounded-xs cursor-pointer active:scale-95"
                title="Re-apply 66 BPM and Witch House configuration to engine"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-Sync 66 BPM</span>
              </button>
            )}

            {onOpenDrums && (
              <button
                onClick={() => {
                  onOpenDrums();
                  setIsOpen(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white border border-fuchsia-400 text-[9px] font-bold uppercase transition-all rounded-xs cursor-pointer shadow-[0_0_10px_rgba(217,70,239,0.4)] active:scale-95"
                title="Jump to Drum Sequencer to inspect pattern"
              >
                <span>Inspect Drums</span>
              </button>
            )}

            {onDismiss && (
              <button
                onClick={() => {
                  onDismiss();
                  setIsOpen(false);
                }}
                className="px-2 py-1.5 text-zinc-400 hover:text-white text-[9px] transition-colors cursor-pointer ml-auto"
                title="Dismiss preset tag"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
