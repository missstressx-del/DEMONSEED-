import React, { useState, useEffect } from 'react';
import { 
  X, Keyboard, Play, Sliders, Navigation, Music, Search, 
  Sparkles, CheckCircle2, Command, Zap, Layers, Activity, Volume2, Shield
} from 'lucide-react';

export type ShortcutCategory = 'all' | 'transport' | 'mixer' | 'navigation';

export interface ShortcutItem {
  id: string;
  category: 'transport' | 'mixer' | 'navigation';
  keys: string[];
  title: string;
  description: string;
  scope: string;
  badge?: string;
}

const SHORTCUTS_DATA: ShortcutItem[] = [
  // Transport Shortcuts
  {
    id: 'play-pause',
    category: 'transport',
    keys: ['SPACE'],
    title: 'Start / Pause Engine',
    description: 'Toggles master audio playback engine and timeline playhead.',
    scope: 'Global Transport',
    badge: 'CORE'
  },
  {
    id: 'stop-halt',
    category: 'transport',
    keys: ['ESC'],
    title: 'Halt / Close Overlays',
    description: 'Dismisses active modals, menus, or closes open dialogs.',
    scope: 'Global'
  },
  {
    id: 'undo',
    category: 'transport',
    keys: ['Ctrl', 'Z'],
    title: 'Undo Edit',
    description: 'Reverts the most recent note, track, or parameter change.',
    scope: 'Global History',
    badge: 'HISTORY'
  },
  {
    id: 'redo',
    category: 'transport',
    keys: ['Ctrl', 'Shift', 'Z'],
    title: 'Redo Action',
    description: 'Reapplies previously undone changes (also supports Ctrl + Y).',
    scope: 'Global History'
  },
  {
    id: 'quick-keymap',
    category: 'transport',
    keys: ['?'],
    title: 'Toggle Quick Key Map',
    description: 'Opens this keyboard shortcuts and learnability reference overlay.',
    scope: 'Global'
  },

  // Mixer Shortcuts
  {
    id: 'mute-track',
    category: 'mixer',
    keys: ['M'],
    title: 'Toggle Track Mute',
    description: 'Mutes or unmutes the currently selected channel in the mixer.',
    scope: 'Selected Channel',
    badge: 'MIXER'
  },
  {
    id: 'solo-track',
    category: 'mixer',
    keys: ['S'],
    title: 'Toggle Track Solo',
    description: 'Solos the selected channel, isolating its audio stream from the master bus.',
    scope: 'Selected Channel',
    badge: 'MIXER'
  },
  {
    id: 'compressor-toggle',
    category: 'mixer',
    keys: ['C'],
    title: 'Toggle Track Compressor',
    description: 'Enables or bypasses the DSP dynamics compressor on the focused track.',
    scope: 'Selected Channel'
  },
  {
    id: 'volume-up',
    category: 'mixer',
    keys: [']'],
    title: 'Increase Volume (+5%)',
    description: 'Nudges focused track fader volume up by 5% (also supports + / =).',
    scope: 'Selected Channel'
  },
  {
    id: 'volume-down',
    category: 'mixer',
    keys: ['['],
    title: 'Decrease Volume (-5%)',
    description: 'Nudges focused track fader volume down by 5% (also supports -).',
    scope: 'Selected Channel'
  },

  // Navigation Shortcuts
  {
    id: 'chord-templates-toggle',
    category: 'navigation',
    keys: ['Shift', 'C'],
    title: 'Open Chord Templates',
    description: 'Launches the Chord Structure Templates, Harmonic Progressions & Voicing Palette.',
    scope: 'Piano Roll / Arranger',
    badge: 'HARMONY'
  },
  {
    id: 'navigate-tracks',
    category: 'navigation',
    keys: ['↑', '↓'],
    title: 'Select Track (Prev / Next)',
    description: 'Steps through audio and MIDI instrument channels in sequential order.',
    scope: 'Arranger / Mixer',
    badge: 'NAV'
  },
  {
    id: 'direct-track-select',
    category: 'navigation',
    keys: ['1', '2', '3', '4'],
    title: 'Direct Track Select (1-4)',
    description: 'Instantly focuses channel 1 (Drums), 2 (Lead Synth), 3 (Bass), or 4 (Vocal / Stem).',
    scope: 'Arranger / Mixer'
  },
  {
    id: 'open-dual-rack',
    category: 'navigation',
    keys: ['Shift', 'W'],
    title: 'Open Dual Workstation',
    description: 'Opens both the Drum Machine and Synthesizer side-by-side / stacked simultaneously.',
    scope: 'Workstation Rack',
    badge: 'DUAL'
  },
  {
    id: 'open-ritual-lab',
    category: 'navigation',
    keys: ['Shift', 'R'],
    title: 'Open The Ritual Lab & Flow State',
    description: 'Launches the Live Glitch Mangler, Neural Flow Generator, Euclidean Polyrhythm Matrix & Lissajous Radar.',
    scope: 'Ritual Lab',
    badge: 'NEW'
  },
  {
    id: 'open-drums-rack',
    category: 'navigation',
    keys: ['Shift', 'D'],
    title: 'Open Drum Machine',
    description: 'Directly opens and focuses the 32-step Drum Sequencer instrument.',
    scope: 'Drum Sequencer',
    badge: 'DRUMS'
  },
  {
    id: 'open-synth-rack',
    category: 'navigation',
    keys: ['Shift', 'S'],
    title: 'Open Synth Designer',
    description: 'Directly opens and focuses the Subtractive Synthesizer & Note Roll.',
    scope: 'Synth Designer',
    badge: 'SYNTH'
  },
  {
    id: 'focus-mode-toggle',
    category: 'navigation',
    keys: ['F'],
    title: 'Toggle Focus Mode',
    description: 'Expands the active channel to maximize vertical screen workspace.',
    scope: 'Arranger'
  },
  {
    id: 'musical-typing',
    category: 'navigation',
    keys: ['A', 'W', 'S', 'E', 'D', 'F', 'T', 'G'],
    title: 'Musical Typing Keys',
    description: 'Play live chromatic notes (C3 to B3) directly on computer keyboard in Synth.',
    scope: 'Synth Designer',
    badge: 'SYNTH'
  },
  {
    id: 'mpc-trigger-pads',
    category: 'navigation',
    keys: ['1', '2', '3', '...', '0', '-', '='],
    title: 'MPC Pad Triggers',
    description: 'Trigger 16 velocity-sensitive audio pads via the top alphanumeric row in Sampler.',
    scope: 'Sampler Looper',
    badge: 'MPC'
  }
];

interface QuickKeyMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickKeyMapModal: React.FC<QuickKeyMapModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);

  // Listen for live key presses while the overlay is open for tactile feedback
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyFeedback = (e: KeyboardEvent) => {
      // Don't intercept if searching in input
      if (document.activeElement?.tagName === 'INPUT') return;

      let keyName = e.key.toUpperCase();
      if (e.code === 'Space') keyName = 'SPACE';
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      setLastKeyPressed(keyName);
      const timer = setTimeout(() => {
        setLastKeyPressed(null);
      }, 1200);
      return () => clearTimeout(timer);
    };

    window.addEventListener('keydown', handleKeyFeedback);
    return () => window.removeEventListener('keydown', handleKeyFeedback);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Shortcuts', icon: Keyboard, count: SHORTCUTS_DATA.length },
    { id: 'transport', label: 'Transport', icon: Play, count: SHORTCUTS_DATA.filter(s => s.category === 'transport').length },
    { id: 'mixer', label: 'Mixer & Faders', icon: Sliders, count: SHORTCUTS_DATA.filter(s => s.category === 'mixer').length },
    { id: 'navigation', label: 'Navigation & Notes', icon: Navigation, count: SHORTCUTS_DATA.filter(s => s.category === 'navigation').length },
  ];

  const filteredShortcuts = SHORTCUTS_DATA.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.scope.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keys.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transport': return 'text-accent border-accent/40 bg-accent/10';
      case 'mixer': return 'text-secondary border-secondary/40 bg-secondary/10';
      case 'navigation': return 'text-purple-400 border-purple-500/40 bg-purple-500/10';
      default: return 'text-ink-dim border-border-custom bg-black/40';
    }
  };

  return (
    <div 
      id="quick-key-map-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 font-mono select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="quick-key-map-modal"
        className="bg-[#0a0a0c] border border-border-custom text-ink w-full max-w-4xl h-[85vh] max-h-[780px] flex flex-col shadow-[0_0_50px_rgba(255,0,85,0.25)] overflow-hidden font-mono"
      >
        
        {/* Header with Title & Quick Search */}
        <div className="p-4 sm:p-5 bg-[#111116] border-b border-border-custom flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-accent bg-accent/10 flex items-center justify-center text-accent shadow-[0_0_12px_var(--accent-glow)] shrink-0">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="brand-syne text-lg sm:text-xl font-extrabold uppercase tracking-wide">
                  QUICK KEY MAP
                </h2>
                <span className="px-2 py-0.5 bg-secondary/10 border border-secondary/40 text-secondary text-[8.5px] font-bold tracking-wider uppercase">
                  ACTIVE HOTKEYS
                </span>
                {lastKeyPressed && (
                  <span className="px-2 py-0.5 bg-amber-400/20 border border-amber-400/60 text-amber-300 text-[8.5px] font-black tracking-wider uppercase animate-pulse">
                    KEY: {lastKeyPressed}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-ink-dim font-mono mt-0.5">
                Instant interactive shortcut map. Press <kbd className="px-1 py-0.2 bg-black border border-border-custom text-accent font-bold">?</kbd> to toggle anytime.
              </p>
            </div>
          </div>

          {/* Search bar & Close */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-ink-dim absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search shortcuts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/60 border border-border-custom pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-dim/50 focus:outline-none focus:border-secondary transition-all font-mono"
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
              id="close-keymap-btn"
              onClick={onClose}
              className="p-1.5 text-ink-dim hover:text-ink hover:bg-white/10 border border-border-custom transition-colors cursor-pointer"
              title="Close Key Map (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs Strip */}
        <div className="bg-[#0e0e12] border-b border-border-custom px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as ShortcutCategory)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'bg-accent text-white border-accent shadow-[0_0_12px_var(--accent-glow)] font-black'
                    : 'text-ink-dim hover:text-ink hover:bg-white/5 border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`text-[8.5px] px-1.5 py-0.2 font-mono ${
                  isSelected ? 'bg-black/50 text-white' : 'bg-black/40 text-ink-dim border border-border-custom'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Shortcuts Grid List */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gradient-to-b from-[#0e0e13] to-[#0a0a0c] space-y-3">
          {filteredShortcuts.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-ink-dim space-y-2">
              <Keyboard className="w-8 h-8 opacity-40" />
              <p className="text-xs">No shortcuts match "{searchQuery}"</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="text-[11px] text-secondary hover:underline cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredShortcuts.map((item) => {
                const isHighlight = lastKeyPressed && item.keys.some(k => k.toUpperCase() === lastKeyPressed);
                return (
                  <div
                    key={item.id}
                    id={`shortcut-card-${item.id}`}
                    className={`bg-[#111116] border p-3.5 flex flex-col justify-between gap-2.5 transition-all duration-200 ${
                      isHighlight
                        ? 'border-secondary bg-secondary/10 shadow-[0_0_20px_rgba(0,242,255,0.3)] scale-[1.01]'
                        : 'border-border-custom hover:border-accent/40 hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Top row: Keys badge & Category Tag */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Key Caps */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.keys.map((k, idx) => (
                          <React.Fragment key={idx}>
                            <kbd className="min-w-[28px] h-7 px-2 bg-black border border-border-custom border-b-2 border-b-black text-xs font-black text-ink flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-mono">
                              {k}
                            </kbd>
                            {idx < item.keys.length - 1 && (
                              <span className="text-[10px] text-ink-dim font-bold">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Scope/Category Badge */}
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-accent/20 border border-accent/40 text-accent font-mono">
                            {item.badge}
                          </span>
                        )}
                        <span className={`text-[8.5px] font-bold px-2 py-0.5 border font-mono uppercase ${getCategoryColor(item.category)}`}>
                          {item.scope}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Title & Description */}
                    <div>
                      <h4 className="text-xs font-bold text-ink tracking-wide">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-ink-dim leading-snug mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer with quick summary & Dismiss */}
        <div className="p-3.5 bg-[#111116] border-t border-border-custom flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-[10px] text-ink-dim">
            <span className="flex items-center gap-1 text-ink font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              HOTKEY TIP:
            </span>
            <span>All single-key mixer commands (M, S, C, 1-4) apply to the currently focused channel.</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-ink-dim hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 bg-black border border-border-custom text-ink">ESC</kbd> to exit
            </span>
            <button
              onClick={onClose}
              className="btn btn-primary px-4 py-1.5 text-xs uppercase tracking-wider"
            >
              CLOSE KEY MAP
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
