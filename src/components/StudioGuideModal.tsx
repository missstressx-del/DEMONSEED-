import React, { useState, useMemo } from 'react';
import { 
  X, BookOpen, Music, Sliders, Cpu, Radio, Sparkles, Zap, 
  Keyboard, Activity, Play, CheckCircle2, ChevronRight, Target, 
  Settings2, Disc, FileAudio, Layers, Volume2, ShieldCheck, Flame, 
  Wand2, Search, ArrowRight, CornerDownRight, HelpCircle, ExternalLink,
  Mic, SlidersHorizontal, RefreshCw
} from 'lucide-react';

interface StudioGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView?: (view: 'arranger' | 'piano-roll' | 'synth' | 'drums' | 'sampler' | 'effects') => void;
  onLoadPreset?: (preset: string) => void;
  onOpenTemplates?: () => void;
  onOpenSamples?: () => void;
  onOpenVstLinks?: () => void;
}

export type GuideSection = 
  | 'quickstart' 
  | 'midi' 
  | 'synth' 
  | 'layering'
  | 'drums' 
  | 'sampler' 
  | 'mastering' 
  | 'recipes'
  | 'shortcuts';

export const StudioGuideModal: React.FC<StudioGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectView,
  onLoadPreset,
  onOpenTemplates,
  onOpenSamples,
  onOpenVstLinks
}) => {
  const [activeSection, setActiveSection] = useState<GuideSection>('quickstart');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sections: { id: GuideSection; label: string; icon: any; badge?: string }[] = [
    { id: 'quickstart', label: 'Quick Start', icon: Zap },
    { id: 'midi', label: 'Hardware MIDI & Learn', icon: Radio, badge: 'PRO' },
    { id: 'synth', label: 'Synth & Sound Design', icon: Cpu },
    { id: 'layering', label: 'Sound Layering & Arp', icon: Layers, badge: 'NEW' },
    { id: 'recipes', label: 'Sound Recipes', icon: Flame, badge: '6 PRESETS' },
    { id: 'drums', label: 'Drums & Groove Engine', icon: Disc },
    { id: 'sampler', label: 'AI Stems & MPC Sampler', icon: Sparkles },
    { id: 'mastering', label: 'Mastering & DSP Bus', icon: Activity },
    { id: 'shortcuts', label: 'Hotkeys & Shortcuts', icon: Keyboard }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0a0a0c] border border-border-custom text-ink w-full max-w-5xl h-[90vh] max-h-[880px] flex flex-col shadow-[0_0_50px_rgba(255,0,85,0.25)] overflow-hidden font-mono select-none">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#111116] border-b border-border-custom flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 border border-accent bg-accent/10 flex items-center justify-center text-accent shadow-[0_0_12px_var(--accent-glow)] shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="brand-syne text-xl sm:text-2xl font-extrabold tracking-[-0.04em] leading-none uppercase">
                  DEMONSEED STUDIO MANUAL
                </h2>
                <span className="px-2 py-0.5 bg-secondary/10 border border-secondary/40 text-secondary text-[8.5px] font-bold tracking-widest uppercase">
                  V2.04 // DSP MANUAL
                </span>
              </div>
              <p className="text-[10px] text-ink-dim font-mono mt-1">
                Comprehensive guide to subtractive synthesis, hardware MIDI mapping, groove quantization, mastering & workflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Live Search Input */}
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-ink-dim absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guide & recipes..."
                className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-border-custom text-ink placeholder:text-ink-dim/50 text-[11px] font-mono focus:border-accent outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-ink-dim hover:text-ink hover:bg-white/10 border border-border-custom transition-colors cursor-pointer"
              title="Close Guide (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body with Sidebar Navigation */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0a0a0c]">
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 bg-[#0e0e12] border-b md:border-b-0 md:border-r border-border-custom p-3 flex md:flex-col gap-1 overflow-x-auto shrink-0">
            <div className="hidden md:block text-[8.5px] font-bold text-ink-dim uppercase px-2 py-1 mb-1 tracking-[0.15em]">
              GUIDE MODULES
            </div>
            
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center justify-between px-3 py-2.5 text-xs font-bold transition-all cursor-pointer text-left shrink-0 border ${
                    isActive
                      ? 'bg-accent text-white border-accent shadow-[0_0_12px_var(--accent-glow)]'
                      : 'text-ink-dim hover:text-ink hover:bg-white/5 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{sec.label}</span>
                  </div>
                  {sec.badge && (
                    <span className={`text-[7.5px] font-black px-1.5 py-0.5 ${
                      isActive ? 'bg-black text-accent' : 'bg-secondary/15 text-secondary border border-secondary/30'
                    }`}>
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Jumps Panel */}
            <div className="hidden md:flex flex-col gap-2 mt-auto pt-3 border-t border-border-custom">
              <span className="text-[8px] font-bold text-ink-dim uppercase tracking-wider px-1">
                QUICK ACTIONS
              </span>
              
              {onLoadPreset && (
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => onLoadPreset('sys-industrial-cyber-grind')}
                    className="px-1.5 py-1 text-[8px] font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-800/50 uppercase text-center"
                    title="Load Underground Industrial preset (136 BPM)"
                  >
                    ⚡ Industrial
                  </button>
                  <button
                    onClick={() => onLoadPreset('sys-horrorcore-crypt-666')}
                    className="px-1.5 py-1 text-[8px] font-bold text-rose-300 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 uppercase text-center"
                    title="Load Horrorcore preset (130 BPM)"
                  >
                    💀 Horrorcore
                  </button>
                  <button
                    onClick={() => onLoadPreset('sys-memphis-phonk-drift')}
                    className="px-1.5 py-1 text-[8px] font-bold text-fuchsia-300 hover:text-fuchsia-200 bg-fuchsia-950/30 hover:bg-fuchsia-900/40 border border-fuchsia-800/50 uppercase text-center"
                    title="Load Memphis Phonk preset (144 BPM)"
                  >
                    🏎️ Phonk
                  </button>
                  <button
                    onClick={() => onLoadPreset('sys-witch-hop-ritual')}
                    className="px-1.5 py-1 text-[8px] font-bold text-purple-300 hover:text-purple-200 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/50 uppercase text-center"
                    title="Load Witch Hop preset (114 BPM)"
                  >
                    † Witch Hop
                  </button>
                  <button
                    onClick={() => onLoadPreset('sys-dungeon-trap-crypt')}
                    className="px-1.5 py-1 text-[8px] font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/50 uppercase text-center"
                    title="Load Dungeon Trap preset (126 BPM)"
                  >
                    🏰 Dungeon
                  </button>
                  <button
                    onClick={() => onLoadPreset('sys-dark-sigilcore-accelerant')}
                    className="px-1.5 py-1 text-[8px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/50 uppercase text-center"
                    title="Load Dark Sigilcore preset (164 BPM)"
                  >
                    🩸 Sigilcore
                  </button>
                  <button
                    onClick={() => onLoadPreset('sys-metalstep-breakdown')}
                    className="px-1.5 py-1 text-[8px] font-bold text-red-300 hover:text-red-200 bg-red-950/30 hover:bg-red-900/40 border border-red-800/50 uppercase text-center"
                    title="Load Metalstep preset (140 BPM)"
                  >
                    🎸 Metalstep
                  </button>
                  <button
                    onClick={() => onLoadPreset('witchhouse')}
                    className="px-1.5 py-1 text-[8px] font-bold text-fuchsia-400 hover:text-fuchsia-300 bg-fuchsia-950/30 hover:bg-fuchsia-900/40 border border-fuchsia-800/50 uppercase text-center"
                    title="Load Witch House preset (66 BPM)"
                  >
                    † Witch House
                  </button>
                </div>
              )}

              {onOpenTemplates && (
                <button
                  onClick={onOpenTemplates}
                  className="w-full px-2.5 py-1.5 text-[9px] font-bold text-secondary bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 flex items-center justify-between"
                >
                  <span>BROWSE TEMPLATES</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Main Scrollable Content */}
          <div className="flex-1 p-5 sm:p-7 overflow-y-auto bg-gradient-to-b from-[#0e0e13] to-[#0a0a0c] text-ink text-xs leading-relaxed space-y-6">

            {/* 1. QUICK START WORKFLOW */}
            {activeSection === 'quickstart' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-border-custom pb-4">
                  <h3 className="brand-syne text-xl font-extrabold uppercase tracking-wide flex items-center gap-2 text-ink">
                    <Zap className="w-5 h-5 text-secondary" />
                    Fast-Track Production Workflow
                  </h3>
                  <p className="text-ink-dim text-xs mt-1">
                    Master DEMONSEED's end-to-end studio workflow in 6 systematic steps.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Step 1 */}
                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2 relative group hover:border-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-ink">
                        <span className="w-6 h-6 bg-secondary/20 border border-secondary text-secondary flex items-center justify-center text-xs font-mono font-bold">1</span>
                        <span>Load an Underground Project</span>
                      </div>
                      {onLoadPreset && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onLoadPreset('sys-industrial-cyber-grind')}
                            className="text-[9px] text-accent hover:underline flex items-center gap-1 font-bold"
                          >
                            Industrial <ChevronRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onLoadPreset('witchhouse')}
                            className="text-[9px] text-fuchsia-400 hover:underline flex items-center gap-1 font-bold"
                          >
                            † Witch House <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-ink-dim text-[11px]">
                      Click <strong className="text-ink">PROJECT</strong> in the top header or pick quick underground presets (<strong className="text-accent">INDUSTRIAL</strong>, <strong className="text-rose-400">HORRORCORE</strong>, <strong className="text-secondary">PHONK</strong>, <strong className="text-purple-400">WITCH HOP</strong>, <strong className="text-emerald-400">DUNGEON TRAP</strong>, <strong className="text-amber-400">SIGILCORE</strong>, <strong className="text-red-400">METALSTEP</strong>, <strong className="text-fuchsia-400">WITCH HOUSE</strong>) to load calibrated drum patterns, synth chords, basslines, and master EQ profiles.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2 hover:border-accent/50 transition-colors">
                    <div className="flex items-center gap-2 font-bold text-ink">
                      <span className="w-6 h-6 bg-secondary/20 border border-secondary text-secondary flex items-center justify-center text-xs font-mono font-bold">2</span>
                      <span>Calibrate Tempo & TAP</span>
                    </div>
                    <p className="text-ink-dim text-[11px]">
                      Type your exact BPM in the top clock speed readout, or rhythmically click the <strong className="text-secondary">TAP</strong> button 4 times to calculate your desired tempo with a smooth rolling 4-tap average.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2 hover:border-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-ink">
                        <span className="w-6 h-6 bg-secondary/20 border border-secondary text-secondary flex items-center justify-center text-xs font-mono font-bold">3</span>
                        <span>Sequence Drums & Grooves</span>
                      </div>
                      {onSelectView && (
                        <button
                          onClick={() => onSelectView('drums')}
                          className="text-[9px] text-secondary hover:underline flex items-center gap-1 font-bold"
                        >
                          Open Drums <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-ink-dim text-[11px]">
                      Switch to the 32-step Drum Sequencer. Paint Kick, Snare, Hi-Hat, and Percussion triggers. Apply authentic <strong className="text-ink">Akai MPC 60</strong> or <strong className="text-ink">SP-1200</strong> swing models, micro-timing humanization, and velocity drift.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2 hover:border-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-ink">
                        <span className="w-6 h-6 bg-secondary/20 border border-secondary text-secondary flex items-center justify-center text-xs font-mono font-bold">4</span>
                        <span>Design Melodies & Synths</span>
                      </div>
                      {onSelectView && (
                        <button
                          onClick={() => onSelectView('synth')}
                          className="text-[9px] text-accent hover:underline flex items-center gap-1 font-bold"
                        >
                          Open Synth <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-ink-dim text-[11px]">
                      Open the Piano Roll to draw melodies, chords, and bass riffs across 5 octaves. Tweak the 24dB Resonant Filter, ADSR envelope generators, multi-mode Arpeggiator, and insert modular VST effects (Chorus, Bitcrusher, Distortion, Reverb).
                    </p>
                  </div>

                  {/* Step 5 */}
                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2 hover:border-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-ink">
                        <span className="w-6 h-6 bg-secondary/20 border border-secondary text-secondary flex items-center justify-center text-xs font-mono font-bold">5</span>
                        <span>Master the Mix Bus</span>
                      </div>
                      {onSelectView && (
                        <button
                          onClick={() => onSelectView('arranger')}
                          className="text-[9px] text-secondary hover:underline flex items-center gap-1 font-bold"
                        >
                          View Mixer <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-ink-dim text-[11px]">
                      Balance track volumes and pans in the Mixer. Polish the master output with the 3-Band Parametric EQ, engage the Glue Bus Compressor for punchy cohesion, and engage the Safety Limiter to avoid clipping.
                    </p>
                  </div>

                  {/* Step 6 */}
                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2 hover:border-accent/50 transition-colors">
                    <div className="flex items-center gap-2 font-bold text-ink">
                      <span className="w-6 h-6 bg-secondary/20 border border-secondary text-secondary flex items-center justify-center text-xs font-mono font-bold">6</span>
                      <span>Export Master WAV & Projects</span>
                    </div>
                    <p className="text-ink-dim text-[11px]">
                      Hit <strong className="text-accent font-bold">RENDER WAV</strong> in the upper right header to bounce down an uncompressed 32-bit floating point .wav file. Click <strong className="text-ink">EXPORT</strong> to save your entire session as portable JSON.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* 2. HARDWARE MIDI & LEARN */}
            {activeSection === 'midi' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-border-custom pb-4">
                  <h3 className="brand-syne text-xl font-extrabold uppercase tracking-wide flex items-center gap-2 text-ink">
                    <Radio className="w-5 h-5 text-accent" />
                    Hardware MIDI & Real-Time MIDI Learn
                  </h3>
                  <p className="text-ink-dim text-xs mt-1">
                    Connect external USB MIDI keyboards, pad controllers, and fader boxes with zero drivers required.
                  </p>
                </div>

                <div className="space-y-4">
                  
                  {/* Step 1: Automatic Detection */}
                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2">
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      1. Automatic Controller Detection
                    </h4>
                    <p className="text-ink-dim text-[11px] leading-relaxed">
                      Connect any standard class-compliant USB MIDI keyboard or controller (Arturia, Novation, Akai, Korg, Roland, Native Instruments). DEMONSEED connects via the Web MIDI API automatically. The live telemetry in the Synth view flashes active note events, velocity, and CC values in real-time.
                    </p>
                  </div>

                  {/* Step 2: MIDI Learn */}
                  <div className="bg-[#111116] border border-accent/40 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      2. MIDI Learn: How to Map Physical Knobs
                    </h4>
                    <ul className="space-y-2 text-[11px] text-ink-dim pl-2">
                      <li className="flex items-start gap-2">
                        <span className="text-accent font-bold">▶</span>
                        <span><strong>Per-Parameter Mapping:</strong> Click the small <span className="px-1.5 py-0.5 bg-white/10 text-ink border border-border-custom font-mono text-[9px]">LEARN</span> badge next to any slider (Filter Cutoff, Resonance, Attack, Delay Time). The badge pulses magenta: <em>WAITING CC...</em></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent font-bold">▶</span>
                        <span><strong>Turn a Hardware Knob:</strong> The instant you twist a physical knob or fader on your controller, DEMONSEED locks that CC channel to the slider (e.g. <span className="px-1.5 py-0.5 bg-secondary/15 text-secondary border border-secondary/30 font-mono text-[9px]">CC 74</span>).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent font-bold">▶</span>
                        <span><strong>Global Learn Mode:</strong> Toggle <span className="px-2 py-0.5 bg-accent text-white font-mono text-[9px] font-bold">MIDI LEARN</span> in the Synth toolbar to click any UI control and twist a hardware knob.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Step 3: CC Mappings Manager */}
                  <div className="bg-[#111116] border border-border-custom p-4 space-y-3">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      3. CC Mappings Manager Modal
                    </h4>
                    <p className="text-ink-dim text-[11px]">
                      Open the CC Mappings window from the Synth view to customize your hardware profile:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[10.5px]">
                      <div className="p-2.5 bg-black/40 border border-border-custom">
                        <strong className="text-ink block mb-1">Custom Min/Max Range:</strong>
                        Clamp modulation ranges so sweeping a knob doesn't distort or silence the sound.
                      </div>
                      <div className="p-2.5 bg-black/40 border border-border-custom">
                        <strong className="text-ink block mb-1">Invert Polarity:</strong>
                        Flip CC direction so turning clockwise decreases value.
                      </div>
                      <div className="p-2.5 bg-black/40 border border-border-custom">
                        <strong className="text-ink block mb-1">Factory Reset:</strong>
                        Restore standard GM CC assignments (CC 74 Cutoff, CC 71 Resonance, CC 91 Reverb).
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Step Recording & Standard MIDI Files */}
                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      4. MIDI Step-Recording & Standard .MID Export
                    </h4>
                    <p className="text-ink-dim text-[11px]">
                      Click <strong className="text-amber-400">STEP REC</strong> in the Synth toolbar. Press notes on your MIDI keyboard to advance and record melodies step-by-step into the active Piano Roll. Click <strong className="text-ink">EXPORT MIDI</strong> to download industry-standard multi-track .mid files compatible with Ableton Live, FL Studio, Logic Pro, and Reaper.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* 3. SYNTH & SOUND DESIGN */}
            {activeSection === 'synth' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-border-custom pb-4">
                  <h3 className="brand-syne text-xl font-extrabold uppercase tracking-wide flex items-center gap-2 text-ink">
                    <Cpu className="w-5 h-5 text-secondary" />
                    Subtractive Synthesis Architecture
                  </h3>
                  <p className="text-ink-dim text-xs mt-1">
                    Master oscillator waveforms, envelope shaping, resonant 24dB VCF filters, and arpeggiation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2">
                    <h4 className="text-xs font-bold text-secondary uppercase flex items-center gap-1.5">
                      <Sliders className="w-4 h-4" />
                      Oscillators & Waveforms
                    </h4>
                    <p className="text-ink-dim text-[11px]">
                      • <strong>Sawtooth:</strong> Rich in all harmonics; ideal for cutting leads, acid lines, and massive supersaws.<br/>
                      • <strong>Square:</strong> Odd harmonics only; produces hollow, woody bass, reedy clarinets, and classic chiptune leads.<br/>
                      • <strong>Triangle:</strong> Mellow, soft harmonics; great for warm vintage pads, flutes, and deep electric piano chords.<br/>
                      • <strong>Sine:</strong> Pure fundamental; the ultimate foundation for clean 808 sub basslines.
                    </p>
                  </div>

                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2">
                    <h4 className="text-xs font-bold text-accent uppercase flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4" />
                      24dB Resonant VCF Filter
                    </h4>
                    <p className="text-ink-dim text-[11px]">
                      • <strong>Cutoff Frequency:</strong> Sweeps from 20 Hz to 20,000 Hz.<br/>
                      • <strong>Resonance (Q):</strong> Boosts the frequencies right around the cutoff point. Values above 8.0 create characteristic screaming acid resonance.<br/>
                      • <strong>Env Modulation:</strong> Shapes how aggressively the filter opens and closes with each triggered note.
                    </p>
                  </div>

                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2">
                    <h4 className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                      <Activity className="w-4 h-4" />
                      ADSR Amplitude Envelope
                    </h4>
                    <p className="text-ink-dim text-[11px]">
                      • <strong>Attack (A):</strong> 0.01s for instant percussive plucks; 0.8s+ for slowly blooming ambient pads.<br/>
                      • <strong>Decay (D):</strong> Time taken to drop from peak volume to sustain level.<br/>
                      • <strong>Sustain (S):</strong> Held volume level while key is pressed.<br/>
                      • <strong>Release (R):</strong> Ring-out tail after note key is released.
                    </p>
                  </div>

                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      BPM Stereo Delay & VST Rack
                    </h4>
                    <p className="text-ink-dim text-[11px]">
                      • <strong>BPM Sync Delay:</strong> Stereo feedback recirculation from tight slapback (50ms) to cavernous dub echoes.<br/>
                      • <strong>Modular VST Rack:</strong> Insert analog Chorus, 8-bit Bitcrusher, Overdrive Distortion, and Hall Reverb in serial or parallel.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* SOUND LAYERING & HARDWARE ARPEGGIATOR */}
            {activeSection === 'layering' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-border-custom pb-4">
                  <h3 className="brand-syne text-xl font-extrabold uppercase tracking-wide flex items-center gap-2 text-ink">
                    <Layers className="w-5 h-5 text-accent" />
                    Sound Layering &amp; Arpeggiator Engine
                  </h3>
                  <p className="text-ink-dim text-xs mt-1">
                    Build massive production-ready textures using multi-voice stacking, sub-bass anchoring, transient noise layers, drum layering, and step arpeggiation.
                  </p>
                </div>

                <div className="space-y-4">
                  
                  {/* Voice Stacking & Multi-Osc */}
                  <div className="bg-[#111116] border border-accent/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        1. Multi-Oscillator Voice Stacking
                      </h4>
                      <span className="text-[8.5px] font-mono font-bold px-2 py-0.5 bg-accent/15 text-accent border border-accent/30">
                        SYNTH RACK
                      </span>
                    </div>
                    <p className="text-ink-dim text-[11px] leading-relaxed">
                      Professional synth patches rarely rely on a single oscillator. DEMONSEED features an integrated multi-voice stacking engine:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10.5px]">
                      <div className="p-3 bg-black/40 border border-border-custom space-y-1">
                        <strong className="text-secondary block font-mono uppercase">Layer 2 (Companion Osc):</strong>
                        <span className="text-ink-dim leading-relaxed">
                          Add a second oscillator with independent waveform (Saw, Square, Triangle, Sine), octave transposition (±2 octaves), stereo pan, and fine detuning (±50 cents) to create lush analog chorus phasing.
                        </span>
                      </div>
                      <div className="p-3 bg-black/40 border border-border-custom space-y-1">
                        <strong className="text-amber-400 block font-mono uppercase">Sub-Bass Underlay:</strong>
                        <span className="text-ink-dim leading-relaxed">
                          Injects a clean Sine, Triangle, or Square fundamental 1 or 2 octaves below your primary lead. Ensures your basslines shake club sound systems without muddying high-frequency filter modulation.
                        </span>
                      </div>
                      <div className="p-3 bg-black/40 border border-border-custom space-y-1">
                        <strong className="text-purple-400 block font-mono uppercase">Noise &amp; Transient Layer:</strong>
                        <span className="text-ink-dim leading-relaxed">
                          Inject White Noise (for bright percussive bite on plucks) or Pink Noise (for vintage analog tape saturation and vinyl hiss).
                        </span>
                      </div>
                      <div className="p-3 bg-black/40 border border-border-custom space-y-1">
                        <strong className="text-accent block font-mono uppercase">7-Voice Unison Supersaw:</strong>
                        <span className="text-ink-dim leading-relaxed">
                          Stack 3, 5, or 7 detuned voices with binaural stereo spread across the soundstage for stadium trance and cyberpunk wall-of-sound leads.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Drum Layering System */}
                  <div className="bg-[#111116] border border-secondary/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                        <Disc className="w-4 h-4" />
                        2. Drum Transient &amp; Harmonic Layering
                      </h4>
                      <span className="text-[8.5px] font-mono font-bold px-2 py-0.5 bg-secondary/15 text-secondary border border-secondary/30">
                        DRUM ENGINE
                      </span>
                    </div>
                    <p className="text-ink-dim text-[11px] leading-relaxed">
                      Transform flat drum samples into punchy, radio-ready drum kits using harmonic underlays and transient reinforcement:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10px]">
                      <div className="p-2.5 bg-black/40 border border-border-custom">
                        <strong className="text-ink block font-mono mb-1">Kick Sub Layer:</strong>
                        <span className="text-ink-dim">Generates a 55Hz sine sub-drop on kick hits for chest-thumping bass response.</span>
                      </div>
                      <div className="p-2.5 bg-black/40 border border-border-custom">
                        <strong className="text-ink block font-mono mb-1">Snare Crack Layer:</strong>
                        <span className="text-ink-dim">Layers an acoustic rimshot transient at 4kHz to cut through dense synth mixes.</span>
                      </div>
                      <div className="p-2.5 bg-black/40 border border-border-custom">
                        <strong className="text-ink block font-mono mb-1">Hi-Hat Spread:</strong>
                        <span className="text-ink-dim">Micro-delays Left and Right hat channels by 12ms for ultra-wide binaural stereo.</span>
                      </div>
                      <div className="p-2.5 bg-black/40 border border-border-custom">
                        <strong className="text-ink block font-mono mb-1">Clap Transient Stack:</strong>
                        <span className="text-ink-dim">Simulates multiple people clapping simultaneously with 15ms staggered onset times.</span>
                      </div>
                    </div>
                  </div>

                  {/* Hardware Arpeggiator Section */}
                  <div className="bg-[#111116] border border-amber-400/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <Wand2 className="w-4 h-4" />
                        3. Hardware Arpeggiator Rack
                      </h4>
                      <span className="text-[8.5px] font-mono font-bold px-2 py-0.5 bg-amber-400/15 text-amber-400 border border-amber-400/30">
                        CLOCK SYNC
                      </span>
                    </div>
                    <p className="text-ink-dim text-[11px] leading-relaxed">
                      Located in the Synth Designer, the Arpeggiator automatically turns held chords into rapid melodic sequences locked to the global studio BPM:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10.5px]">
                      <div className="p-2.5 bg-black/40 border border-border-custom space-y-1">
                        <strong className="text-ink block font-mono uppercase">Pattern Algorithms:</strong>
                        <span className="text-ink-dim">
                          Choose from <strong>UP</strong>, <strong>DOWN</strong>, <strong>UP/DOWN</strong> ping-pong, <strong>RANDOM</strong> generative melodies, or <strong>CHORD CHOP</strong> rhythmic gating.
                        </span>
                      </div>
                      <div className="p-2.5 bg-black/40 border border-border-custom space-y-1">
                        <strong className="text-ink block font-mono uppercase">Clock Division Rates:</strong>
                        <span className="text-ink-dim">
                          Switch between <strong>1/4</strong> (quarter note beats), <strong>1/8</strong> (eighth note grooves), <strong>1/16</strong> (classic dance leads), and <strong>1/32</strong> (rapid rolls).
                        </span>
                      </div>
                      <div className="p-2.5 bg-black/40 border border-border-custom space-y-1">
                        <strong className="text-ink block font-mono uppercase">Octave Expansion &amp; Latch:</strong>
                        <span className="text-ink-dim">
                          Expand patterns across 1, 2, or 3 octaves. Activate <strong>HOLD / LATCH</strong> to keep arpeggio cycles playing while you tweak filter cutoffs and delay feedback hands-free.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Companion Track Linking */}
                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2">
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      4. Parallel Companion Track Routing
                    </h4>
                    <p className="text-ink-dim text-[11px] leading-relaxed">
                      Link any synth track to another track in your project. Every note triggered by the piano roll, MIDI controller, or arpeggiator will fire on both tracks simultaneously. This allows orchestrating massive dual-instrument layers — for example, pairing an analog sawtooth lead on Track 1 with a glass Rhodes electric piano on Track 2.
                    </p>
                  </div>

                  {/* Free VST Links Directory Helper */}
                  {onOpenVstLinks && (
                    <div className="bg-[#111116] border border-[#d946ef]/40 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#d946ef] uppercase tracking-wider flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          5. Free VST Plugins & Web Audio DSP
                        </h4>
                        <span className="text-[8.5px] font-mono font-bold px-2 py-0.5 bg-[#d946ef]/15 text-[#d946ef] border border-[#d946ef]/30">
                          VST DIRECTORY
                        </span>
                      </div>
                      <p className="text-ink-dim text-[11px] leading-relaxed">
                        Need heavy wavetable synthesis (Vital, Surge XT), vintage DX7 FM emulation (Dexed), or space reverbs (Valhalla Supermassive)? Explore our curated directory of verified free VST3/AU plugins and Web Audio DSP links.
                      </p>
                      <button
                        onClick={onOpenVstLinks}
                        className="mt-1 text-[10px] text-[#d946ef] hover:underline flex items-center gap-1 font-bold font-mono uppercase cursor-pointer"
                      >
                        Browse Curated Free VST Links Directory <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* 4. SOUND RECIPES */}
            {activeSection === 'recipes' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-border-custom pb-4">
                  <h3 className="brand-syne text-xl font-extrabold uppercase tracking-wide flex items-center gap-2 text-ink">
                    <Flame className="w-5 h-5 text-accent" />
                    Tested Sound Design Recipes
                  </h3>
                  <p className="text-ink-dim text-xs mt-1">
                    Dial these exact parameter configurations into the Synth view to produce iconic electronic tones.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Recipe 1 */}
                  <div className="bg-[#111116] border border-accent/40 p-4 space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <strong className="text-accent text-sm font-bold flex items-center gap-1.5">
                        <Flame className="w-4 h-4" /> 1. Acid 303 Bassline
                      </strong>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-accent/10 border border-accent/30 text-accent">ACID / TECHNO</span>
                    </div>
                    <div className="text-[11px] text-ink-dim space-y-1 font-mono bg-black/40 p-2.5 border border-border-custom">
                      <div>Waveform: <strong className="text-ink">Sawtooth or Square</strong></div>
                      <div>Filter Cutoff: <strong className="text-secondary">650 Hz</strong> | Res (Q): <strong className="text-accent">9.5</strong></div>
                      <div>Attack: <strong className="text-ink">0.01s</strong> | Decay: <strong className="text-ink">0.18s</strong></div>
                      <div>Sustain: <strong className="text-ink">0%</strong> | Release: <strong className="text-ink">0.05s</strong></div>
                      <div>Delay Time: <strong className="text-ink">0.25s</strong> | Delay Feedback: <strong className="text-ink">35%</strong></div>
                    </div>
                  </div>

                  {/* Recipe 2 */}
                  <div className="bg-[#111116] border border-secondary/40 p-4 space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <strong className="text-secondary text-sm font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> 2. Cyberpunk Synth Pad
                      </strong>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-secondary/10 border border-secondary/30 text-secondary">CYBERPUNK</span>
                    </div>
                    <div className="text-[11px] text-ink-dim space-y-1 font-mono bg-black/40 p-2.5 border border-border-custom">
                      <div>Waveform: <strong className="text-ink">Sawtooth</strong></div>
                      <div>Filter Cutoff: <strong className="text-secondary">2200 Hz</strong> | Res (Q): <strong className="text-ink">2.2</strong></div>
                      <div>Attack: <strong className="text-ink">0.75s</strong> | Decay: <strong className="text-ink">1.20s</strong></div>
                      <div>Sustain: <strong className="text-ink">80%</strong> | Release: <strong className="text-ink">1.60s</strong></div>
                      <div>Delay Time: <strong className="text-ink">0.38s</strong> | Delay Feedback: <strong className="text-ink">55%</strong></div>
                    </div>
                  </div>

                  {/* Recipe 3 */}
                  <div className="bg-[#111116] border border-amber-400/40 p-4 space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <strong className="text-amber-400 text-sm font-bold flex items-center gap-1.5">
                        <Zap className="w-4 h-4" /> 3. EDM Pluck & Arp Lead
                      </strong>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-400">HOUSE / TRANCE</span>
                    </div>
                    <div className="text-[11px] text-ink-dim space-y-1 font-mono bg-black/40 p-2.5 border border-border-custom">
                      <div>Waveform: <strong className="text-ink">Square</strong></div>
                      <div>Filter Cutoff: <strong className="text-secondary">3600 Hz</strong> | Res (Q): <strong className="text-ink">3.5</strong></div>
                      <div>Attack: <strong className="text-ink">0.01s</strong> | Decay: <strong className="text-ink">0.24s</strong></div>
                      <div>Sustain: <strong className="text-ink">15%</strong> | Release: <strong className="text-ink">0.12s</strong></div>
                      <div>Arpeggiator: <strong className="text-amber-400">Up/Down (1/16th note)</strong></div>
                    </div>
                  </div>

                  {/* Recipe 4 */}
                  <div className="bg-[#111116] border border-purple-400/40 p-4 space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <strong className="text-purple-400 text-sm font-bold flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4" /> 4. Deep Sub 808 Bass
                      </strong>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-purple-400/10 border border-purple-400/30 text-purple-400">HIP-HOP / DRILL</span>
                    </div>
                    <div className="text-[11px] text-ink-dim space-y-1 font-mono bg-black/40 p-2.5 border border-border-custom">
                      <div>Waveform: <strong className="text-ink">Sine</strong></div>
                      <div>Filter Cutoff: <strong className="text-secondary">280 Hz</strong> | Res (Q): <strong className="text-ink">1.0</strong></div>
                      <div>Attack: <strong className="text-ink">0.01s</strong> | Decay: <strong className="text-ink">0.65s</strong></div>
                      <div>Sustain: <strong className="text-ink">50%</strong> | Release: <strong className="text-ink">0.40s</strong></div>
                      <div>Delay Time: <strong className="text-ink">0.00s (Bypass Delay)</strong></div>
                    </div>
                  </div>

                  {/* Recipe 5 */}
                  <div className="bg-[#111116] border border-emerald-400/40 p-4 space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <strong className="text-emerald-400 text-sm font-bold flex items-center gap-1.5">
                        <Radio className="w-4 h-4" /> 5. Lo-Fi Chillhop Electric Keys
                      </strong>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-400/10 border border-emerald-400/30 text-emerald-400">LO-FI CHILL</span>
                    </div>
                    <div className="text-[11px] text-ink-dim space-y-1 font-mono bg-black/40 p-2.5 border border-border-custom">
                      <div>Waveform: <strong className="text-ink">Triangle</strong></div>
                      <div>Filter Cutoff: <strong className="text-secondary">1400 Hz</strong> | Res (Q): <strong className="text-ink">1.8</strong></div>
                      <div>Attack: <strong className="text-ink">0.05s</strong> | Decay: <strong className="text-ink">0.80s</strong></div>
                      <div>Sustain: <strong className="text-ink">30%</strong> | Release: <strong className="text-ink">0.60s</strong></div>
                      <div>Delay Time: <strong className="text-ink">0.32s</strong> | Delay Feedback: <strong className="text-ink">40%</strong></div>
                    </div>
                  </div>

                  {/* Recipe 6 */}
                  <div className="bg-[#111116] border border-rose-400/40 p-4 space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <strong className="text-rose-400 text-sm font-bold flex items-center gap-1.5">
                        <Zap className="w-4 h-4" /> 6. Industrial Hardstyle Stab
                      </strong>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-rose-400/10 border border-rose-400/30 text-rose-400">HARDSTYLE</span>
                    </div>
                    <div className="text-[11px] text-ink-dim space-y-1 font-mono bg-black/40 p-2.5 border border-border-custom">
                      <div>Waveform: <strong className="text-ink">Sawtooth</strong></div>
                      <div>Filter Cutoff: <strong className="text-secondary">5500 Hz</strong> | Res (Q): <strong className="text-accent">6.0</strong></div>
                      <div>Attack: <strong className="text-ink">0.01s</strong> | Decay: <strong className="text-ink">0.12s</strong></div>
                      <div>Sustain: <strong className="text-ink">0%</strong> | Release: <strong className="text-ink">0.08s</strong></div>
                      <div>VST Rack: <strong className="text-rose-400">Overdrive Distortion (Drive 65%)</strong></div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 5. DRUMS & GROOVE ENGINE */}
            {activeSection === 'drums' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-border-custom pb-4">
                  <h3 className="brand-syne text-xl font-extrabold uppercase tracking-wide flex items-center gap-2 text-ink">
                    <Disc className="w-5 h-5 text-secondary" />
                    32-Step Drum Matrix & Groove Engine
                  </h3>
                  <p className="text-ink-dim text-xs mt-1">
                    Program intricate rhythm beds with hardware swing models, micro-timing humanization, and velocity curves.
                  </p>
                </div>

                <div className="space-y-4">
                  
                  <div className="bg-[#111116] border border-border-custom p-4 space-y-3">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                      Authentic Hardware Swing Models
                    </h4>
                    <p className="text-ink-dim text-[11px]">
                      Choose from calibrated swing algorithms to inject human groove into static 16th-note quantizations:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[10.5px]">
                      <div className="p-3 bg-black/40 border border-border-custom">
                        <strong className="text-accent block mb-1">Akai MPC 60:</strong>
                        Legendary Roger Linn 58%–66% swing shuffle. Tight, aggressive, and punchy.
                      </div>
                      <div className="p-3 bg-black/40 border border-border-custom">
                        <strong className="text-amber-400 block mb-1">E-mu SP-1200:</strong>
                        Gritty 12-bit swing with slight micro-delays on alternate 16th notes.
                      </div>
                      <div className="p-3 bg-black/40 border border-border-custom">
                        <strong className="text-secondary block mb-1">J Dilla Loose:</strong>
                        Unquantized lazy pocket with human micro-timing drift.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#111116] border border-border-custom p-4 space-y-2">
                      <h4 className="text-xs font-bold text-secondary uppercase">
                        Micro-Timing Humanize
                      </h4>
                      <p className="text-ink-dim text-[11px]">
                        Adds subtle millisecond randomization to hit triggers, avoiding mechanical "machine-gun" playback and recreating live acoustic feel.
                      </p>
                    </div>

                    <div className="bg-[#111116] border border-border-custom p-4 space-y-2">
                      <h4 className="text-xs font-bold text-accent uppercase">
                        Velocity Drift & Ghost Notes
                      </h4>
                      <p className="text-ink-dim text-[11px]">
                        Modulates individual hit velocities across bars. Right-click or shift-click steps to program softer ghost hits on snares and hi-hats.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 6. AI STEMS & MPC SAMPLER */}
            {activeSection === 'sampler' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-border-custom pb-4">
                  <h3 className="brand-syne text-xl font-extrabold uppercase tracking-wide flex items-center gap-2 text-ink">
                    <Sparkles className="w-5 h-5 text-accent" />
                    AI Audio Generator & 16-Pad MPC Sampler
                  </h3>
                  <p className="text-ink-dim text-xs mt-1">
                    Synthesize synchronous loops with Gemini AI and trigger custom recorded samples.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2.5">
                    <h4 className="text-xs font-bold text-accent uppercase flex items-center gap-1.5">
                      <Wand2 className="w-4 h-4" />
                      Gemini AI Stem Prompting
                    </h4>
                    <p className="text-ink-dim text-[11px]">
                      Describe any instrumental loop in natural language:
                    </p>
                    <div className="p-2.5 bg-black/40 border border-border-custom text-[10.5px] text-ink space-y-1">
                      <div className="text-ink-dim">Examples:</div>
                      <div>• <em>"Dark dystopian synthwave bassline in F# minor at 128 BPM"</em></div>
                      <div>• <em>"Atmospheric ambient female vocal chop with cavernous reverb"</em></div>
                      <div>• <em>"Punchy 90s boom-bap drum break with vinyl crackle"</em></div>
                    </div>
                  </div>

                  <div className="bg-[#111116] border border-border-custom p-4 space-y-2.5">
                    <h4 className="text-xs font-bold text-secondary uppercase flex items-center gap-1.5">
                      <Mic className="w-4 h-4" />
                      16-Pad Touch Sampler & Audio Input
                    </h4>
                    <p className="text-ink-dim text-[11px]">
                      Trigger one-shot drum hits, vocal drops, and custom sound effects across 16 velocity-sensitive pads. Click <strong className="text-ink">RECORD AUDIO</strong> to capture live microphone takes, trim start/end points, tune pitch ±12 semitones, or engage reverse playback.
                    </p>
                    {onOpenSamples && (
                      <button
                        onClick={onOpenSamples}
                        className="mt-2 text-[10px] text-secondary hover:underline flex items-center gap-1 font-bold"
                      >
                        Browse Built-In Sample Library <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* 7. MASTERING & DSP BUS */}
            {activeSection === 'mastering' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-border-custom pb-4">
                  <h3 className="brand-syne text-xl font-extrabold uppercase tracking-wide flex items-center gap-2 text-ink">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    Master Channel DSP & Broadcast Dynamics
                  </h3>
                  <p className="text-ink-dim text-xs mt-1">
                    Polish your mix with parametric EQ, bus glue compression, and lookahead limiting.
                  </p>
                </div>

                <div className="space-y-4">
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    
                    <div className="bg-[#111116] border border-border-custom p-4 space-y-2">
                      <h4 className="text-xs font-bold text-accent uppercase">3-Band Master EQ</h4>
                      <p className="text-ink-dim text-[11px]">
                        • <strong>Bass:</strong> 100 Hz low-shelf (±12 dB)<br/>
                        • <strong>Mid:</strong> 1,000 Hz parametric bell (±12 dB)<br/>
                        • <strong>Treble:</strong> 8,000 Hz high-shelf (±12 dB)
                      </p>
                    </div>

                    <div className="bg-[#111116] border border-border-custom p-4 space-y-2">
                      <h4 className="text-xs font-bold text-secondary uppercase">Glue Compressor</h4>
                      <p className="text-ink-dim text-[11px]">
                        Ties drum hits and lead synths together. Features adjustable threshold, 2:1 to 8:1 ratio, attack/release times, and real-time gain reduction meters.
                      </p>
                    </div>

                    <div className="bg-[#111116] border border-border-custom p-4 space-y-2">
                      <h4 className="text-xs font-bold text-pink-400 uppercase">Master Output Gain (Trim)</h4>
                      <p className="text-ink-dim text-[11px]">
                        Pre-limiter gain stage (-24 dB to +12 dB) to trim the final sum level entering the Limiter, letting you push into gentle limiting or attenuate hot mixes.
                      </p>
                    </div>

                    <div className="bg-[#111116] border border-border-custom p-4 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase">Lookahead Limiter</h4>
                      <p className="text-ink-dim text-[11px]">
                        Ceiling limiter (-0.5 dB) prevents digital clipping distortion and ensures compliance with commercial streaming loudness levels (-14 LUFS).
                      </p>
                    </div>

                  </div>

                  <div className="bg-[#111116] border border-border-custom p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-ink uppercase">
                        Real-Time FFT Spectrum & Peak VU Meters
                      </h4>
                      <p className="text-ink-dim text-[11px] mt-0.5">
                        Embedded in the bottom status bar: 64-band fast Fourier transform visualizer with Left/Right peak level meters and clip indicators.
                      </p>
                    </div>
                    <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                  </div>

                </div>
              </div>
            )}

            {/* 8. HOTKEYS & SHORTCUTS */}
            {activeSection === 'shortcuts' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-border-custom pb-4">
                  <h3 className="brand-syne text-xl font-extrabold uppercase tracking-wide flex items-center gap-2 text-ink">
                    <Keyboard className="w-5 h-5 text-amber-400" />
                    Keyboard Shortcuts Reference
                  </h3>
                  <p className="text-ink-dim text-xs mt-1">
                    Accelerate every workflow with direct single-key commands.
                  </p>
                </div>

                <div className="bg-[#111116] border border-border-custom overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-border-custom bg-white/5 text-ink-dim font-bold uppercase text-[9.5px]">
                        <th className="p-3">Shortcut Key</th>
                        <th className="p-3">Action Description</th>
                        <th className="p-3">Scope</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom text-[11px]">
                      <tr>
                        <td className="p-3"><kbd className="px-2 py-1 bg-black border border-border-custom text-amber-400 font-bold">SPACE</kbd></td>
                        <td className="p-3 text-ink font-bold">Start / Pause Engine Playback</td>
                        <td className="p-3 text-ink-dim">Global Transport</td>
                      </tr>
                      <tr>
                        <td className="p-3"><kbd className="px-2 py-1 bg-black border border-border-custom text-ink font-bold">ESC</kbd></td>
                        <td className="p-3 text-ink font-bold">Halt Engine / Dismiss Open Modals</td>
                        <td className="p-3 text-ink-dim">Global</td>
                      </tr>
                      <tr>
                        <td className="p-3"><kbd className="px-2 py-1 bg-black border border-border-custom text-secondary font-bold">M</kbd></td>
                        <td className="p-3 text-ink font-bold">Toggle Channel Mute</td>
                        <td className="p-3 text-ink-dim">Focused Track</td>
                      </tr>
                      <tr>
                        <td className="p-3"><kbd className="px-2 py-1 bg-black border border-border-custom text-secondary font-bold">S</kbd></td>
                        <td className="p-3 text-ink font-bold">Toggle Channel Solo</td>
                        <td className="p-3 text-ink-dim">Focused Track</td>
                      </tr>
                      <tr>
                        <td className="p-3"><kbd className="px-2 py-1 bg-black border border-border-custom text-secondary font-bold">C</kbd></td>
                        <td className="p-3 text-ink font-bold">Toggle Track Compressor Bypass</td>
                        <td className="p-3 text-ink-dim">Focused Track</td>
                      </tr>
                      <tr>
                        <td className="p-3"><kbd className="px-2 py-1 bg-black border border-border-custom text-accent font-bold">↑ / ↓</kbd></td>
                        <td className="p-3 text-ink font-bold">Navigate Channels (Prev / Next)</td>
                        <td className="p-3 text-ink-dim">Mixer</td>
                      </tr>
                      <tr>
                        <td className="p-3"><kbd className="px-2 py-1 bg-black border border-border-custom text-purple-400 font-bold">1 / 2 / 3 / 4</kbd></td>
                        <td className="p-3 text-ink font-bold">Switch Main Workspace View</td>
                        <td className="p-3 text-ink-dim">Navigation</td>
                      </tr>
                      <tr>
                        <td className="p-3"><kbd className="px-2 py-1 bg-black border border-border-custom text-emerald-400 font-bold">Ctrl / Cmd + Z</kbd></td>
                        <td className="p-3 text-ink font-bold">Undo Last Action</td>
                        <td className="p-3 text-ink-dim">History</td>
                      </tr>
                      <tr>
                        <td className="p-3"><kbd className="px-2 py-1 bg-black border border-border-custom text-emerald-400 font-bold">Ctrl + Shift + Z / Ctrl + Y</kbd></td>
                        <td className="p-3 text-ink font-bold">Redo Action</td>
                        <td className="p-3 text-ink-dim">History</td>
                      </tr>
                      <tr>
                        <td className="p-3"><kbd className="px-2 py-1 bg-black border border-border-custom text-accent font-bold">?</kbd></td>
                        <td className="p-3 text-ink font-bold">Toggle Quick Key Map Overlay</td>
                        <td className="p-3 text-ink-dim">Global</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-[#111116] border-t border-border-custom flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[9.5px] text-ink-dim font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span>DEMONSEED V2.04 // REAL-TIME WEB AUDIO WORKSTATION MANUAL</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn btn-primary px-6 py-2 text-xs uppercase tracking-wider"
            >
              CLOSE MANUAL
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
