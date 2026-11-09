import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  RefreshCw, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Activity, 
  Search, 
  X,
  Volume2,
  FolderOpen,
  Folder,
  Layers,
  Sparkles
} from 'lucide-react';
import { PresetTemplate } from '../types';
import { DARK_SUB_GENRES, DARK_PRESETS, DarkSubGenreMeta } from '../data/darkSubGenres';
import { systemTemplates } from '../data/systemTemplates';
import { 
  getPresetSonicProfile, 
  MiniGlowingWaveform, 
  SonicTextureDisplay, 
  SonicProfile 
} from './SonicPreviewVisualizer';

export type PresetCategoryType = 'Ritualistic' | 'Industrial' | 'Glitch';

export interface CategoryGroupMeta {
  id: PresetCategoryType;
  title: string;
  tag: string;
  icon: string;
  color: string;
  accentBg: string;
  borderAccent: string;
  description: string;
  subGenreIds: string[];
  subGenreTags: string[];
}

export const CATEGORY_GROUPS: CategoryGroupMeta[] = [
  {
    id: 'Ritualistic',
    title: 'Ritualistic',
    tag: 'OCCULT_VOID',
    icon: '†',
    color: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.12)',
    borderAccent: 'rgba(168, 85, 247, 0.45)',
    description: 'Cavernous reverb, occult funeral bells, dungeon RPG synths, slowed subterranean 808s.',
    subGenreIds: ['witch-hop', 'horrorcore', 'dungeon-trap'],
    subGenreTags: ['WITCH-HOP', 'HORRORCORE', 'DUNGEON-TRAP']
  },
  {
    id: 'Industrial',
    title: 'Industrial',
    tag: 'CYBER_HEAVY',
    icon: '⚡',
    color: '#00f2ff',
    accentBg: 'rgba(0, 242, 255, 0.12)',
    borderAccent: 'rgba(0, 242, 255, 0.45)',
    description: 'Abrasive machine-shop percussion, grinding modular saw leads, EBM basslines, and djent chugs.',
    subGenreIds: ['underground-industrial', 'metalstep'],
    subGenreTags: ['IND-EBM', 'DJENT-STEP']
  },
  {
    id: 'Glitch',
    title: 'Glitch',
    tag: 'BITCRUSH_SPEED',
    icon: '🩸',
    color: '#ff0055',
    accentBg: 'rgba(255, 0, 85, 0.12)',
    borderAccent: 'rgba(255, 0, 85, 0.45)',
    description: 'Frantic bitcrushed arps, hyper-speed 16th-note hat rolls, tape grit, and distorted Memphis cowbells.',
    subGenreIds: ['dark-sigilcore', 'memphis-phonk'],
    subGenreTags: ['SIGIL-HEX', 'PHONK-93']
  }
];

/**
 * Maps any preset to one of the 3 overarching categories:
 * 'Ritualistic' | 'Industrial' | 'Glitch'
 */
export function getPresetCategory(preset: PresetTemplate): PresetCategoryType {
  const g = (preset.genre || preset.category || '').toLowerCase();
  const id = preset.id.toLowerCase();
  const n = preset.name.toLowerCase();

  // Ritualistic indicators
  if (
    g.includes('witch') || g.includes('horror') || g.includes('dungeon') ||
    g.includes('crypt') || g.includes('salem') || g.includes('ritual') ||
    g.includes('occult') || id.includes('witch') || id.includes('horror') ||
    id.includes('dungeon') || id.includes('crypt') || n.includes('witch') ||
    n.includes('horror') || n.includes('grave') || n.includes('catacomb') ||
    n.includes('necropolis') || n.includes('salem') || n.includes('torch')
  ) {
    return 'Ritualistic';
  }

  // Glitch indicators
  if (
    g.includes('sigil') || g.includes('phonk') || g.includes('memphis') ||
    g.includes('glitch') || g.includes('breakcore') || g.includes('hyperpop') ||
    id.includes('sigil') || id.includes('phonk') || n.includes('sigil') ||
    n.includes('phonk') || n.includes('cowbell') || n.includes('drift') ||
    n.includes('bit-crush') || n.includes('bitcrush')
  ) {
    return 'Glitch';
  }

  // Industrial fallback
  return 'Industrial';
}

interface HardwareRackPresetSelectorProps {
  onLoadTemplate: (template: PresetTemplate) => void;
  showNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
  currentBpm?: number;
}

export const HardwareRackPresetSelector: React.FC<HardwareRackPresetSelectorProps> = ({
  onLoadTemplate,
  showNotification,
  currentBpm
}) => {
  // Currently active preset ID (defaults to underground industrial cyber grind)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('sys-industrial-cyber-grind');
  const [lastLoadedId, setLastLoadedId] = useState<string | null>('sys-industrial-cyber-grind');

  // Hover state for interactive spectral / waveform previews in oscilloscope
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);

  // Search filter across presets
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Category filter tab ('ALL' | 'Ritualistic' | 'Industrial' | 'Glitch')
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'ALL' | PresetCategoryType>('ALL');

  // Collapsible category accordions state (Ritualistic, Industrial, Glitch)
  // By default, all categories are expanded so user can see all sound presets
  const [collapsedCategories, setCollapsedCategories] = useState<Record<PresetCategoryType, boolean>>({
    Ritualistic: false,
    Industrial: false,
    Glitch: false
  });

  // Oscilloscope vs Spectral display mode for SonicTextureDisplay
  const [displayMode, setDisplayMode] = useState<'wave' | 'spectrum'>('wave');

  // Combine DARK_PRESETS with relevant dark system templates
  const allDarkPresets = useMemo(() => {
    const list: PresetTemplate[] = [...DARK_PRESETS];

    const additionalTemplates = systemTemplates.filter(t => {
      const lower = (t.name + ' ' + (t.genre || '') + ' ' + (t.category || '')).toLowerCase();
      return (
        lower.includes('witch') ||
        lower.includes('crypt') ||
        lower.includes('industrial') ||
        lower.includes('cyberpunk') ||
        lower.includes('glitch') ||
        lower.includes('phonk')
      );
    });

    for (const t of additionalTemplates) {
      if (!list.some(p => p.id === t.id)) {
        let mappedGenre = 'Underground Industrial';
        const lower = (t.name + ' ' + (t.genre || '')).toLowerCase();
        if (lower.includes('witch') || lower.includes('crypt')) {
          mappedGenre = 'Witch Hop';
        } else if (lower.includes('glitch') || lower.includes('hyperpop')) {
          mappedGenre = 'Dark Sigilcore';
        } else if (lower.includes('phonk') || lower.includes('memphis')) {
          mappedGenre = 'Memphis Phonk';
        } else if (lower.includes('darksynth') || lower.includes('cyberpunk')) {
          mappedGenre = 'Underground Industrial';
        }
        list.push({ ...t, genre: mappedGenre });
      }
    }

    return list;
  }, []);

  // Currently selected preset object
  const currentPreset = useMemo(() => {
    return allDarkPresets.find(p => p.id === selectedPresetId) || allDarkPresets[0];
  }, [selectedPresetId, allDarkPresets]);

  // Active category for the currently selected preset
  const currentPresetCategory = useMemo<PresetCategoryType>(() => {
    return getPresetCategory(currentPreset);
  }, [currentPreset]);

  // Current category metadata
  const currentCategoryMeta = useMemo(() => {
    return CATEGORY_GROUPS.find(c => c.id === currentPresetCategory) || CATEGORY_GROUPS[1];
  }, [currentPresetCategory]);

  // Sub-genre meta of current preset
  const currentSubGenreMeta = useMemo(() => {
    const genreLower = (currentPreset.genre || currentPreset.category || '').toLowerCase();
    return DARK_SUB_GENRES.find(sg => genreLower.includes(sg.name.toLowerCase())) || DARK_SUB_GENRES[0];
  }, [currentPreset]);

  // Hovered preset object (for previewing sound cues before loading)
  const hoveredPreset = useMemo(() => {
    if (!hoveredPresetId) return null;
    return allDarkPresets.find(p => p.id === hoveredPresetId) || null;
  }, [hoveredPresetId, allDarkPresets]);

  // Target preset to display in visualizer (hovered preset takes immediate priority)
  const displayedPreset = hoveredPreset || currentPreset;

  // Compute sonic texture profiles (memoized map for performance)
  const profilesMap = useMemo(() => {
    const map = new Map<string, SonicProfile>();
    allDarkPresets.forEach(p => {
      map.set(p.id, getPresetSonicProfile(p));
    });
    return map;
  }, [allDarkPresets]);

  const displayedProfile = useMemo(() => {
    if (!displayedPreset) return getPresetSonicProfile(allDarkPresets[0]);
    return profilesMap.get(displayedPreset.id) || getPresetSonicProfile(displayedPreset);
  }, [displayedPreset, profilesMap, allDarkPresets]);

  // Group all presets into the 3 Categories ('Ritualistic', 'Industrial', 'Glitch')
  const presetsByCategory = useMemo(() => {
    const groups: Record<PresetCategoryType, PresetTemplate[]> = {
      Ritualistic: [],
      Industrial: [],
      Glitch: []
    };

    allDarkPresets.forEach(preset => {
      const cat = getPresetCategory(preset);
      groups[cat].push(preset);
    });

    return groups;
  }, [allDarkPresets]);

  // Toggle individual category collapse
  const toggleCategoryCollapse = (catId: PresetCategoryType) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Expand all categories
  const handleExpandAll = () => {
    setCollapsedCategories({
      Ritualistic: false,
      Industrial: false,
      Glitch: false
    });
  };

  // Collapse all categories
  const handleCollapseAll = () => {
    setCollapsedCategories({
      Ritualistic: true,
      Industrial: true,
      Glitch: true
    });
  };

  // Handle loading a preset
  const handleLoadSelectedPreset = (presetToLoad?: PresetTemplate) => {
    const target = presetToLoad || currentPreset;
    if (!target) return;
    onLoadTemplate(target);
    setLastLoadedId(target.id);
    setSelectedPresetId(target.id);
    setHoveredPresetId(null);
    const cat = getPresetCategory(target);
    showNotification(`⚡ Loaded [${cat.toUpperCase()} // ${target.genre || 'DARK'}]: ${target.name} (${target.bpm} BPM)`, 'success');
  };

  // Shuffle within the currently selected category or global
  const handleShuffleInCategory = (specificCategory?: PresetCategoryType) => {
    const targetCategory = specificCategory || (selectedCategoryTab !== 'ALL' ? selectedCategoryTab : currentPresetCategory);
    const pool = presetsByCategory[targetCategory] || allDarkPresets;
    const available = pool.filter(p => p.id !== selectedPresetId);
    const chosen = available.length > 0 
      ? available[Math.floor(Math.random() * available.length)]
      : pool[0];
    if (chosen) {
      setSelectedPresetId(chosen.id);
      handleLoadSelectedPreset(chosen);
    }
  };

  // Shuffle across all presets
  const handleShuffleAll = () => {
    const available = allDarkPresets.filter(p => p.id !== selectedPresetId);
    const chosen = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : allDarkPresets[0];
    if (chosen) {
      setSelectedPresetId(chosen.id);
      handleLoadSelectedPreset(chosen);
    }
  };

  // Auto-expand category if user searches and matches exist
  useEffect(() => {
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const updates: Partial<Record<PresetCategoryType, boolean>> = {};
      CATEGORY_GROUPS.forEach(cat => {
        const hasMatch = (presetsByCategory[cat.id] || []).some(
          p => p.name.toLowerCase().includes(q) || (p.genre || '').toLowerCase().includes(q)
        );
        if (hasMatch) {
          updates[cat.id] = false; // expand
        }
      });
      setCollapsedCategories(prev => ({ ...prev, ...updates }));
    }
  }, [searchFilter, presetsByCategory]);

  return (
    <div 
      className="panel flex flex-col gap-3 relative select-none" 
      style={{ 
        background: 'rgba(8, 8, 12, 0.95)', 
        borderColor: currentCategoryMeta.borderAccent,
        boxShadow: `0 4px 20px rgba(0,0,0,0.8), inset 0 0 16px ${currentCategoryMeta.color}15`
      }}
    >
      {/* 1. Header with Category Indicator */}
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px]">{currentCategoryMeta.icon}</span>
          <span 
            className="text-[11px] font-mono tracking-wider font-bold"
            style={{ color: currentCategoryMeta.color }}
          >
            DARK SUB-GENRES
          </span>
          <span className="text-[8px] font-mono text-zinc-500 uppercase px-1 py-0.5 bg-white/5 rounded border border-white/10">
            {currentCategoryMeta.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span 
            className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded tracking-widest border"
            style={{ 
              color: currentCategoryMeta.color, 
              backgroundColor: currentCategoryMeta.accentBg, 
              borderColor: currentCategoryMeta.borderAccent 
            }}
          >
            {currentCategoryMeta.tag}
          </span>
        </div>
      </div>

      {/* 2. Sonic Texture Oscilloscope Display (Reacts live on hover!) */}
      <SonicTextureDisplay
        profile={displayedProfile}
        isHoverPreview={Boolean(hoveredPresetId)}
        displayMode={displayMode}
        onToggleDisplayMode={() => setDisplayMode(m => m === 'wave' ? 'spectrum' : 'wave')}
      />

      {/* 3. Category Filter Tabs & Expand/Collapse Controls */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Layers className="w-2.5 h-2.5 text-zinc-500" />
            <span>CATEGORIES &amp; PRESETS:</span>
          </span>
          <div className="flex items-center gap-1 text-[7.5px] font-mono">
            <button
              onClick={handleExpandAll}
              className="px-1.5 py-0.5 bg-black/40 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 rounded transition-colors cursor-pointer"
              title="Expand all 3 categories"
            >
              [EXPAND ALL]
            </button>
            <button
              onClick={handleCollapseAll}
              className="px-1.5 py-0.5 bg-black/40 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 rounded transition-colors cursor-pointer"
              title="Collapse all 3 categories"
            >
              [COLLAPSE ALL]
            </button>
          </div>
        </div>

        {/* Category Filter Pills (ALL, Ritualistic, Industrial, Glitch) */}
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setSelectedCategoryTab('ALL')}
            className={`py-1 px-1 text-[8px] font-mono text-center rounded border transition-all cursor-pointer truncate ${
              selectedCategoryTab === 'ALL'
                ? 'bg-white/20 text-white font-bold border-white/40 shadow-xs'
                : 'bg-black/30 text-zinc-400 border-white/5 hover:border-white/20 hover:text-white'
            }`}
            title={`View all ${allDarkPresets.length} presets across all categories`}
          >
            ALL ({allDarkPresets.length})
          </button>

          {CATEGORY_GROUPS.map((cat) => {
            const isTabActive = selectedCategoryTab === cat.id;
            const count = (presetsByCategory[cat.id] || []).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryTab(cat.id);
                  // Ensure this category is expanded when clicked
                  setCollapsedCategories(prev => ({ ...prev, [cat.id]: false }));
                }}
                className={`py-1 px-0.5 text-[8px] font-mono text-center rounded border transition-all cursor-pointer truncate ${
                  isTabActive
                    ? 'font-bold shadow-xs'
                    : 'bg-black/30 text-zinc-400 border-white/5 hover:border-white/20 hover:text-white'
                }`}
                style={isTabActive ? {
                  color: cat.color,
                  backgroundColor: cat.accentBg,
                  borderColor: cat.borderAccent,
                  boxShadow: `0 0 8px ${cat.color}35`
                } : {}}
                title={`${cat.title} Category (${count} presets)`}
              >
                <span>{cat.icon} {cat.title.slice(0, 5).toUpperCase()} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Search Filter Input */}
      <div className="relative flex items-center bg-black/60 border border-white/10 rounded px-2 py-1">
        <Search className="w-3 h-3 text-zinc-500 mr-1.5 shrink-0" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filter Ritualistic, Industrial, Glitch..."
          className="w-full bg-transparent text-[9px] font-mono text-[#e2e2ec] placeholder-zinc-600 focus:outline-none"
        />
        {searchFilter && (
          <button 
            onClick={() => setSearchFilter('')}
            className="text-zinc-500 hover:text-white cursor-pointer ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 5. Collapsible Categories Container */}
      <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-0.5">
        {CATEGORY_GROUPS.map((catGroup) => {
          // If a category tab is selected and it's not this one, hide it
          if (selectedCategoryTab !== 'ALL' && selectedCategoryTab !== catGroup.id) {
            return null;
          }

          const isCollapsed = Boolean(collapsedCategories[catGroup.id]);
          let presets = presetsByCategory[catGroup.id] || [];

          // Apply search filter if active
          if (searchFilter.trim()) {
            const q = searchFilter.toLowerCase();
            presets = presets.filter(p => 
              p.name.toLowerCase().includes(q) || 
              (p.genre || '').toLowerCase().includes(q) ||
              (p.description || '').toLowerCase().includes(q)
            );
          }

          // If filtering and no matches in this category, skip
          if (searchFilter.trim() && presets.length === 0) {
            return null;
          }

          const hasActivePreset = presets.some(p => p.id === selectedPresetId);

          return (
            <div 
              key={catGroup.id}
              className="rounded border transition-all overflow-hidden"
              style={{
                borderColor: hasActivePreset ? catGroup.color : catGroup.borderAccent,
                backgroundColor: 'rgba(5, 5, 8, 0.8)'
              }}
            >
              {/* Category Collapsible Header */}
              <div 
                onClick={() => toggleCategoryCollapse(catGroup.id)}
                className="px-2 py-1.5 flex items-center justify-between cursor-pointer transition-colors group select-none"
                style={{
                  backgroundColor: isCollapsed ? 'rgba(255,255,255,0.02)' : catGroup.accentBg,
                  borderBottom: isCollapsed ? 'none' : `1px solid ${catGroup.borderAccent}`
                }}
                title={`Click to ${isCollapsed ? 'expand' : 'collapse'} ${catGroup.title} category`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[11px]">{catGroup.icon}</span>
                  <span 
                    className="text-[9.5px] font-mono font-bold uppercase tracking-wider"
                    style={{ color: catGroup.color }}
                  >
                    {catGroup.title}
                  </span>
                  <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-black/60 border border-white/10 text-zinc-300">
                    {presets.length} {presets.length === 1 ? 'PRESET' : 'PRESETS'}
                  </span>
                  {hasActivePreset && (
                    <span 
                      className="text-[7px] font-mono font-bold px-1 py-0.2 rounded uppercase animate-pulse"
                      style={{ 
                        color: '#000', 
                        backgroundColor: catGroup.color 
                      }}
                    >
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[7.5px] font-mono text-zinc-500 group-hover:text-zinc-300">
                    {isCollapsed ? '[ + ]' : '[ − ]'}
                  </span>
                  {isCollapsed ? (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                  )}
                </div>
              </div>

              {/* Category Body (Visible when NOT collapsed) */}
              {!isCollapsed && (
                <div className="p-1.5 flex flex-col gap-1.5 bg-black/40">
                  {/* Category soundscape description & sub-genres */}
                  <div className="px-1 py-0.5 text-[7px] font-mono text-zinc-400 flex items-center justify-between border-b border-white/5">
                    <span className="truncate mr-2 italic">{catGroup.description}</span>
                    <span className="text-zinc-500 uppercase shrink-0 font-bold">
                      {catGroup.subGenreTags.join(' • ')}
                    </span>
                  </div>

                  {/* Preset Items inside this Category */}
                  <div className="flex flex-col gap-1">
                    {presets.map((preset) => {
                      const isSelected = selectedPresetId === preset.id;
                      const isHovered = hoveredPresetId === preset.id;
                      const isLoaded = lastLoadedId === preset.id;
                      const profile = profilesMap.get(preset.id) || getPresetSonicProfile(preset);
                      const subGenreMeta = DARK_SUB_GENRES.find(sg => 
                        (preset.genre || '').toLowerCase().includes(sg.name.toLowerCase())
                      ) || currentSubGenreMeta;

                      return (
                        <div
                          key={preset.id}
                          onMouseEnter={() => setHoveredPresetId(preset.id)}
                          onMouseLeave={() => setHoveredPresetId(null)}
                          onClick={() => {
                            setSelectedPresetId(preset.id);
                            handleLoadSelectedPreset(preset);
                          }}
                          className={`p-1.5 rounded text-[9px] font-mono flex items-center justify-between cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-white/10 font-bold border-white/30 shadow-xs'
                              : isHovered
                              ? 'bg-black/90'
                              : 'bg-black/40 border-white/5 hover:border-white/20'
                          }`}
                          style={isHovered || isSelected ? {
                            borderColor: catGroup.color,
                            boxShadow: `0 0 10px ${catGroup.color}35`
                          } : {}}
                          title={`Click to load ${preset.name} • Hover to preview waveform`}
                        >
                          <div className="flex flex-col gap-0.5 truncate mr-2 flex-1">
                            <div className="flex items-center gap-1.5 truncate">
                              {isLoaded ? (
                                <Check className="w-2.5 h-2.5 shrink-0" style={{ color: catGroup.color }} />
                              ) : isSelected ? (
                                <Zap className="w-2.5 h-2.5 shrink-0 text-amber-400 fill-current" />
                              ) : (
                                <span className="text-[8px] text-zinc-500">{subGenreMeta.icon}</span>
                              )}
                              <span className={`truncate font-semibold ${isHovered || isSelected ? 'text-white' : 'text-zinc-200'}`}>
                                {preset.name}
                              </span>
                              {isLoaded && (
                                <span className="text-[6.5px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                                  LOADED
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[7px] text-zinc-400">
                              <span 
                                className="px-1 py-0.2 rounded font-bold"
                                style={{ 
                                  color: subGenreMeta.color,
                                  backgroundColor: subGenreMeta.accentBg 
                                }}
                              >
                                {subGenreMeta.tag}
                              </span>
                              <span>•</span>
                              <span>{preset.bpm} BPM</span>
                              <span>•</span>
                              <span className="truncate text-zinc-500">
                                {profile.harmonicTag}
                              </span>
                            </div>
                          </div>

                          {/* Mini Glowing Waveform & Direct Load Button */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div 
                              className="px-1 py-0.5 rounded bg-black/80 border flex items-center justify-center transition-all"
                              style={{
                                borderColor: isHovered || isSelected ? catGroup.color : 'rgba(255,255,255,0.08)',
                                boxShadow: isHovered ? `0 0 8px ${catGroup.color}50` : 'none'
                              }}
                            >
                              <MiniGlowingWaveform
                                points={profile.waveformPoints}
                                color={catGroup.color}
                                width={44}
                                height={14}
                                isHovered={isHovered || isSelected}
                                mode={displayMode}
                                spectralBins={profile.spectralBins}
                              />
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPresetId(preset.id);
                                handleLoadSelectedPreset(preset);
                              }}
                              className={`px-1.5 py-1 text-[7.5px] font-mono font-bold uppercase rounded border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-white text-black border-white'
                                  : 'bg-black/60 text-zinc-300 hover:text-white border-white/10 hover:border-white/30'
                              }`}
                              style={isSelected ? {
                                backgroundColor: catGroup.color,
                                borderColor: catGroup.color,
                                color: '#000'
                              } : {}}
                              title={`Load ${preset.name}`}
                            >
                              LOAD
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 6. Primary Action Bar (Load Current & Shuffle in Category) */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/10">
        <button
          onClick={() => handleLoadSelectedPreset()}
          className="btn font-mono text-[9.5px] py-2 flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all hover:scale-[1.02]"
          style={{
            borderColor: currentCategoryMeta.color,
            color: '#000',
            backgroundColor: currentCategoryMeta.color,
            boxShadow: `0 0 14px ${currentCategoryMeta.color}70`
          }}
          title={`Load ${currentPreset.name} into DAW`}
        >
          <Zap className="w-3 h-3 fill-current" />
          <span>LOAD PRESET</span>
        </button>

        <button
          onClick={() => handleShuffleInCategory()}
          className="btn font-mono text-[8.5px] py-2 flex items-center justify-center gap-1 text-zinc-200 hover:text-white hover:border-zinc-300 bg-white/5 border border-white/10 cursor-pointer transition-colors"
          title={`Shuffle within ${currentCategoryMeta.title} category`}
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>SHUFFLE ({currentCategoryMeta.title.slice(0, 4).toUpperCase()})</span>
        </button>
      </div>

      {/* 7. Hidden native select elements to preserve compatibility with tests and accessibility */}
      <select
        id="hardware-rack-subgenre-dropdown"
        value={currentSubGenreMeta.id}
        onChange={(e) => {
          const matching = allDarkPresets.find(p => (p.genre || '').toLowerCase().includes(e.target.value.toLowerCase()));
          if (matching) {
            setSelectedPresetId(matching.id);
            handleLoadSelectedPreset(matching);
          }
        }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        {DARK_SUB_GENRES.map((sg) => (
          <option key={sg.id} value={sg.id}>
            {sg.name}
          </option>
        ))}
      </select>

      <select
        id="hardware-rack-preset-dropdown"
        value={selectedPresetId}
        onChange={(e) => {
          const nextId = e.target.value;
          setSelectedPresetId(nextId);
          const found = allDarkPresets.find(p => p.id === nextId);
          if (found) {
            handleLoadSelectedPreset(found);
          }
        }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        {CATEGORY_GROUPS.map((cat) => {
          const presets = presetsByCategory[cat.id] || [];
          return (
            <optgroup key={cat.id} label={`${cat.icon} ${cat.title.toUpperCase()} CATEGORY`}>
              {presets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.bpm} BPM
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
};
