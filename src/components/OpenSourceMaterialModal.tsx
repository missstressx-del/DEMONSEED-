import React, { useState } from 'react';
import { 
  X, Music, Search, ExternalLink, Copy, Check, BookOpen, Sparkles, Cpu, History, Info
} from 'lucide-react';

interface OpenSourceMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  showNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
  initialCategory?: 'all' | 'samples' | 'synths' | 'archives' | 'tools';
}

interface MaterialResource {
  id: string;
  name: string;
  url: string;
  category: 'samples' | 'synths' | 'archives' | 'tools';
  description: string;
  license: string;
  bestFor: string;
}

export const OpenSourceMaterialModal: React.FC<OpenSourceMaterialModalProps> = ({
  isOpen,
  onClose,
  showNotification,
  initialCategory = 'all'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'samples' | 'synths' | 'archives' | 'tools'>(initialCategory);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync category with initialCategory whenever opened
  React.useEffect(() => {
    if (isOpen && initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [isOpen, initialCategory]);

  const resources: MaterialResource[] = [
    {
      id: 'surge-xt',
      name: 'Surge XT (Free VST Synth)',
      url: 'https://surge-synth-team.org',
      category: 'synths',
      description: 'Industry-defining, award-winning open source hybrid synthesizer (VST3, AU, CLAP). Deep modulation matrix, wavetables, physical modeling, and pristine audio filters.',
      license: 'GPL v3 (100% Free & Open Source)',
      bestFor: 'Sound design, EDM leads, analog pads, wavetables, and physical string textures.'
    },
    {
      id: 'vital-synth',
      name: 'Vital (Free Spectral Wavetable VST)',
      url: 'https://vital.audio',
      category: 'synths',
      description: 'Elite visual spectral warping wavetable synthesizer plugin. Features animated modulation drag-and-drop, custom wavetable generator, and high-fidelity stereo unison engines.',
      license: 'Free Tier with Open Source Core',
      bestFor: 'Modern dubstep growls, future bass supersaws, custom wavetables, and lush pads.'
    },
    {
      id: 'dexed-synth',
      name: 'Dexed (Classic Yamaha DX7 FM VST)',
      url: 'https://asb2m10.github.io/dexed/',
      category: 'synths',
      description: 'Acclaimed multi-platform open-source FM synthesizer modeled closely on the iconic Yamaha DX7. Capable of loading and exporting real DX7 SysEx cartridge banks.',
      license: 'GPL v3 (Open Source VST)',
      bestFor: 'Authentic 80s FM electric pianos, crisp metallic bells, synthwave brass, and retro bass.'
    },
    {
      id: 'valhalla-supermassive',
      name: 'Valhalla Supermassive (Free Reverb/Delay VST)',
      url: 'https://valhalladsp.com/shop/reverb/valhalla-supermassive/',
      category: 'synths',
      description: 'Legendary freeware spatial delay and reverb plugin used by top producers worldwide. Contains 18 luscious celestial delay and reverb algorithms.',
      license: '100% Free Plugin (VST3, AU, AAX)',
      bestFor: 'Massive atmospheric swells, endless ambient reverbs, harmonic echoes, and space echoes.'
    },
    {
      id: 'spitfire-labs',
      name: 'Spitfire Audio LABS (Free VST Instruments)',
      url: 'https://labs.spitfireaudio.com',
      category: 'synths',
      description: 'An infinite series of free virtual instruments recorded by world-renowned sound engineers in London. From soft felt pianos and strings to rare modular synths.',
      license: '100% Free Proprietary VST Player',
      bestFor: 'Emotional cinematic strings, intimate felt pianos, guitar textures, and orchestral pads.'
    },
    {
      id: 'chow-dsp',
      name: 'Chowdhury DSP (ChowDSP Open Source VSTs)',
      url: 'https://chowdsp.com',
      category: 'synths',
      description: 'Award-winning open source physical and analog modeling audio plugins (Chow Tape Model, Chow Distortion, Chow Centaur, Chow Phaser).',
      license: 'GPL v3 (Open Source VST3/AU/CLAP)',
      bestFor: 'Warm vintage analog tape saturation, guitar overdrive pedals, and classic filter modeling.'
    },
    {
      id: 'kvr-audio-vsts',
      name: 'KVR Audio Free VST Plugin Database',
      url: 'https://www.kvraudio.com/plugins/free/newest',
      category: 'synths',
      description: 'The world\'s largest, continuously updated index of free VST, VST3, AU, and CLAP plugins, synthesizers, effect racks, and virtual studio instruments.',
      license: 'Varies / Free Downloads',
      bestFor: 'Discovering newly released free plugins, user reviews, and specialized music tools.'
    },
    {
      id: 'plugin-boutique-free',
      name: 'Plugin Boutique Free VST Hub',
      url: 'https://www.pluginboutique.com/categories/free',
      category: 'synths',
      description: 'A curated hub of premier commercial-grade freeware plugins, free synth instruments, mix utilities, and limited-time developer offerings.',
      license: '100% Free Downloads',
      bestFor: 'Professional mix utilities, compressors, free instruments, and high-end freebies.'
    },
    {
      id: 'airwindows-vsts',
      name: 'Airwindows (300+ Free Open-Source VSTs)',
      url: 'https://www.airwindows.com',
      category: 'synths',
      description: 'Pioneering developer Chris Johnson\'s archive of over 300 minimalist, zero-latency, high-precision open-source audio DSP plugins and console emulators.',
      license: 'MIT (Open Source VST)',
      bestFor: 'Mastering console emulation, tape saturation, dither algorithms, and surgical audio tools.'
    },
    {
      id: 'pianobook',
      name: 'Pianobook / Decent Sampler',
      url: 'https://www.pianobook.co.uk',
      category: 'synths',
      description: 'A global community of sample creators sharing thousands of beautifully recorded multi-sample virtual instruments. Plays directly in the free Decent Sampler VST plugin.',
      license: 'CC0 / Free Use',
      bestFor: 'Acoustic pianos, vintage toy synths, felt pads, and organic orchestral textures.'
    },
    {
      id: 'open-soundfonts',
      name: 'Polyphone & SoundFonts',
      url: 'https://www.polyphone-soundfonts.com',
      category: 'synths',
      description: 'Open-source editor and soundfont community sharing vintage video game sound banks, retro sound card wave tables, and classic General MIDI soundfonts.',
      license: 'Varies (Mostly CC / Free Domain)',
      bestFor: '8-bit & 16-bit retro game chiptunes, retro orchestra, and low-fidelity general midi.'
    },
    {
      id: 'helm-synth',
      name: 'Helm Synthesizer (Open Source VST)',
      url: 'https://tytel.org/helm',
      category: 'synths',
      description: 'A fully open-source subtractive synthesizer by Matt Tytel. Features a visual modulation routing grid, dual oscillators with cross-modulation, and 32-step arpeggiator.',
      license: 'GPL v3 (Open Source VST3/AU)',
      bestFor: 'Learning subtractive synthesis, bright leads, retro basslines, and simple arpeggios.'
    },
    {
      id: 'freesound',
      name: 'Freesound.org',
      url: 'https://freesound.org',
      category: 'samples',
      description: 'An immense collaborative database of audio snippets, samples, field recordings, and sound effects. Users upload recordings under various Creative Commons licenses.',
      license: 'CC0, CC-BY, CC-NC',
      bestFor: 'Ambient textures, found-sound percussion, sound design, and atmospheric foley.'
    },
    {
      id: 'looperman',
      name: 'Looperman',
      url: 'https://www.looperman.com',
      category: 'samples',
      description: 'A massive community-driven hub featuring thousands of royalty-free loops, acapellas, beats, and instrumental stems uploaded directly by musicians and producers.',
      license: 'Royalty-Free (Personal & Commercial)',
      bestFor: 'Hip-hop drum loops, vocal hooks, guitar riffs, and synth progression stems.'
    },
    {
      id: 'musicradar',
      name: 'SampleRadar (MusicRadar)',
      url: 'https://www.musicradar.com/news/tech/free-music-samples-royalty-free-loops-hits-and-multis-to-download',
      category: 'samples',
      description: 'Over 80,000 professional-grade, high-quality loops, instrument hits, and multis, carefully categorized by genre and pack. Completely royalty-free downloads.',
      license: 'Royalty-Free (Commercial OK)',
      bestFor: 'Curated genre kits (Techno, House, Lo-Fi, D&B), drum breaks, and acoustic hits.'
    },
    {
      id: 'cymatics-free',
      name: 'Cymatics Free Vault',
      url: 'https://cymatics.fm/pages/free-download-vault',
      category: 'samples',
      description: 'A premium repository of hand-crafted electronic loops, professional synth presets, MIDI progressions, and vocal stems downloaded by millions of modern producers.',
      license: 'Royalty-Free (Commercial OK)',
      bestFor: 'Modern drill/trap hats, future bass chord progressions, and professional vocal chops.'
    },
    {
      id: 'nasa-sounds',
      name: 'NASA Audio Archive',
      url: 'https://archive.org/details/nasaaudiocollection',
      category: 'archives',
      description: 'Historic space flight audio, telemetry beep frequencies, control room communications, rocket launch rumbles, and astronaut radio transmissions.',
      license: 'Public Domain / Free Use',
      bestFor: 'Sci-fi atmospheric soundscapes, countdown sequences, and cosmic lo-fi noise.'
    },
    {
      id: 'open-music-archive',
      name: 'Open Music Archive',
      url: 'http://www.openmusicarchive.org',
      category: 'archives',
      description: 'A platform dedicated to digitizing and distributing out-of-copyright vintage sound recordings. Perfect for finding retro speech clips, classical strings, and acoustic jazz.',
      license: 'Public Domain',
      bestFor: 'Dusty vinyl vocals, retro acoustic samples, jazz horns, and vintage background crackle.'
    },
    {
      id: 'tonejs',
      name: 'Tone.js Web Audio FX Engine',
      url: 'https://tonejs.github.io',
      category: 'tools',
      description: 'The spectacular open-source Web Audio framework used to build browser synthesizers, sequencers, and effect nodes. Perfect for audio scripts and custom VST nodes.',
      license: 'MIT (Open Source Software)',
      bestFor: 'Building custom synth designs, programming step sequencers, and web audio coding.'
    }
  ];

  if (!isOpen) return null;

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showNotification(`Copied URL: ${url}`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.bestFor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || res.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-[#0c0c0e]/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[#141417] border-2 border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-[#0c0c0e]/90 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#d946ef]/10 border border-[#d946ef]/30 flex items-center justify-center text-[#d946ef]">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider font-syne uppercase flex items-center gap-2">
                <span>Free VSTs, Synths & Open Source Materials</span>
                <span className="text-[9px] bg-[#d946ef]/20 border border-[#d946ef]/40 text-[#d946ef] font-mono px-2 py-0.5 rounded-full font-bold">
                  VST DIRECTORY
                </span>
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono uppercase mt-0.5">
                Direct links to award-winning free VST plugins, open-source synthesizers & royalty-free sound banks
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close Pop Up"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter bar and search */}
        <div className="p-5 border-b border-zinc-900 bg-zinc-900/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Categories Tab selector */}
          <div className="flex flex-wrap gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-850 w-full sm:w-auto">
            {(['all', 'synths', 'samples', 'archives', 'tools'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 font-mono text-[9px] font-bold rounded-md uppercase tracking-wider transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#d946ef] text-[#0c0c0e] font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-900/60'
                }`}
              >
                {cat === 'all' && 'All Resources'}
                {cat === 'synths' && '🎹 VSTs & Synths (Free Plugins)'}
                {cat === 'samples' && '🥁 Samples & Loops'}
                {cat === 'archives' && '📻 Historic Archives'}
                {cat === 'tools' && '⚙️ Audio DSP & Web Tools'}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search VSTs, plugins, samples..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-850 hover:border-zinc-700 focus:border-[#d946ef] text-xs font-mono text-zinc-200 pl-9 pr-4 py-2 rounded-lg outline-none transition-colors"
            />
          </div>
        </div>

        {/* Resources list container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#141417]">
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map((res) => {
                const isCopied = copiedId === res.id;
                return (
                  <div 
                    key={res.id} 
                    className="bg-[#0c0c0e]/30 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700/80 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-[#d946ef] font-mono tracking-wide uppercase">
                            {res.name}
                          </span>
                        </div>
                        <span className="text-[8px] border border-zinc-800 text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                          {res.category === 'samples' && 'Samples'}
                          {res.category === 'synths' && '🎹 Free VST / Synth'}
                          {res.category === 'archives' && 'Archive'}
                          {res.category === 'tools' && 'DSP & Web Audio'}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-zinc-400 font-mono leading-relaxed uppercase mb-3 min-h-[36px]">
                        {res.description}
                      </p>

                      <div className="space-y-1.5 pb-4 border-b border-zinc-900/60 text-[9px] font-mono">
                        <div className="flex items-start gap-1">
                          <span className="text-zinc-500 uppercase font-bold min-w-[65px] shrink-0">Best For:</span>
                          <span className="text-zinc-300 uppercase">{res.bestFor}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-500 uppercase font-bold min-w-[65px]">License:</span>
                          <span className="text-emerald-400 font-bold uppercase">{res.license}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-4">
                      {/* Copy link button */}
                      <button
                        onClick={() => handleCopy(res.url, res.id)}
                        className="flex items-center gap-1.5 py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-mono text-[9px] font-bold rounded uppercase transition-all cursor-pointer shrink-0"
                        title="Copy direct website address"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-extrabold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      {/* Go to source button */}
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 py-1 px-3 bg-[#d946ef] hover:bg-[#d946ef]/90 text-[#0c0c0e] font-mono text-[9px] font-extrabold rounded uppercase transition-all"
                        title={`Open ${res.name} in a new browser tab`}
                      >
                        <span>{res.category === 'synths' ? 'Get VST / Visit' : 'Visit Source'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-zinc-850 rounded-xl text-zinc-600 text-xs italic">
              No material resources match your current filter or search query.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0c0c0e]/90 px-6 py-3 border-t border-zinc-800 flex items-center justify-between text-[9px] text-zinc-500 font-mono uppercase">
          <span>Creative Commons & Royalty-Free Directory</span>
          <span className="flex items-center gap-1 text-zinc-400">
            <Info className="w-3 h-3 text-[#d946ef]" />
            Always verify the exact license before commercial use
          </span>
        </div>

      </div>
    </div>
  );
};
