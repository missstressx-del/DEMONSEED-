import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Music, Play, Square, Sparkles, Check, Sliders, Layers, 
  Volume2, Plus, Trash2, ArrowRight, CornerDownRight, RotateCcw,
  Zap, Disc, ChevronRight, Info
} from 'lucide-react';
import { Track, MidiNote } from '../types';
import { audioEngine } from '../services/audioEngine';
import { 
  NOTE_NAMES, 
  CHORD_TYPES, 
  CHORD_PROGRESSION_TEMPLATES, 
  ChordProgressionTemplate, 
  ChordStep,
  VoicingStyle,
  RhythmPattern,
  DestinationBar,
  formatChordName,
  calculateChordPitches,
  generateMidiNotesForProgression,
  generateSingleChordNotes
} from '../utils/chordTemplates';

interface ChordTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrack: Track;
  bpm: number;
  onUpdateMidiNotes: (notes: MidiNote[], mode?: 'replace' | 'merge') => void;
  onShowNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type ModalTab = 'templates' | 'stamper' | 'builder';

export const ChordTemplatesModal: React.FC<ChordTemplatesModalProps> = ({
  isOpen,
  onClose,
  activeTrack,
  bpm,
  onUpdateMidiNotes,
  onShowNotification
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('templates');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedKey, setSelectedKey] = useState<string>('C');
  const [selectedOctave, setSelectedOctave] = useState<number>(activeTrack.type === 'bass' ? 2 : 3);
  const [selectedVoicing, setSelectedVoicing] = useState<VoicingStyle>('root');
  const [selectedRhythm, setSelectedRhythm] = useState<RhythmPattern>('sustained');
  const [destinationBar, setDestinationBar] = useState<DestinationBar>('full');
  const [insertMode, setInsertMode] = useState<'replace' | 'merge'>('replace');

  // Currently auditioning state
  const [auditioningId, setAuditioningId] = useState<string | null>(null);
  const auditionTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Single Chord Stamper state
  const [stampRoot, setStampRoot] = useState<string>('C');
  const [stampQuality, setStampQuality] = useState<string>('min7');
  const [stampOctave, setStampOctave] = useState<number>(3);
  const [stampStep, setStampStep] = useState<number>(0);
  const [stampDuration, setStampDuration] = useState<number>(8);
  const [stampVoicing, setStampVoicing] = useState<VoicingStyle>('root');

  // Custom Progression Builder state
  const [customSteps, setCustomSteps] = useState<ChordStep[]>([
    { rootOffset: 0, quality: 'min7', displayRoman: 'i7' },
    { rootOffset: 5, quality: 'min7', displayRoman: 'iv7' },
    { rootOffset: 10, quality: 'dom7', displayRoman: 'VII7' },
    { rootOffset: 3, quality: 'maj7', displayRoman: 'IIImaj7' }
  ]);
  const [customProgressionName, setCustomProgressionName] = useState<string>('Custom Chord Flow');

  useEffect(() => {
    return () => {
      // Clear all audition timers on unmount
      auditionTimerRef.current.forEach(t => clearTimeout(t));
      auditionTimerRef.current = [];
    };
  }, []);

  if (!isOpen) return null;

  const genres = [
    'All',
    'Synthwave & Cyberpunk',
    'EDM & House',
    'Neo-Soul & R&B',
    'Lo-Fi & Chill',
    'Cinematic & Dramatic',
    'City Pop & J-Pop',
    'Dark & Industrial',
    'Witch House'
  ];

  const filteredTemplates = selectedGenre === 'All'
    ? CHORD_PROGRESSION_TEMPLATES
    : CHORD_PROGRESSION_TEMPLATES.filter(t => t.genre === selectedGenre);

  // Stop any active audition
  const stopAudition = () => {
    auditionTimerRef.current.forEach(t => clearTimeout(t));
    auditionTimerRef.current = [];
    setAuditioningId(null);
  };

  // Audition a progression using active track's synth
  const handleAuditionProgression = (template: ChordProgressionTemplate) => {
    if (auditioningId === template.id) {
      stopAudition();
      return;
    }

    stopAudition();
    setAuditioningId(template.id);

    if (!activeTrack.synthConfig) {
      onShowNotification('Track has no synth configuration for preview.', 'error');
      setAuditioningId(null);
      return;
    }

    const chords = template.chords;
    const stepDurationSec = (60 / bpm) * 1.5; // ~1.5 beats per chord preview

    chords.forEach((chordStep, idx) => {
      const timer = setTimeout(() => {
        const pitches = calculateChordPitches(selectedKey, chordStep, selectedOctave, selectedVoicing);
        if (pitches.length > 0 && activeTrack.synthConfig) {
          audioEngine.playChordLive(pitches, activeTrack.synthConfig, activeTrack.id, stepDurationSec * 0.9, 16);
        }

        if (idx === chords.length - 1) {
          const endTimer = setTimeout(() => {
            setAuditioningId(null);
          }, stepDurationSec * 1000);
          auditionTimerRef.current.push(endTimer);
        }
      }, idx * stepDurationSec * 1000);

      auditionTimerRef.current.push(timer);
    });
  };

  // Audition an individual chord
  const handleAuditionSingleChord = (root: string, quality: string, octave: number, voicing: VoicingStyle) => {
    if (!activeTrack.synthConfig) return;
    const step: ChordStep = { rootOffset: 0, quality, displayRoman: '' };
    const pitches = calculateChordPitches(root, step, octave, voicing);
    if (pitches.length > 0) {
      audioEngine.playChordLive(pitches, activeTrack.synthConfig, activeTrack.id, 0.8, 18);
    }
  };

  // Apply template to active track
  const handleApplyTemplate = (template: ChordProgressionTemplate) => {
    const generated = generateMidiNotesForProgression(
      template,
      selectedKey,
      selectedOctave,
      selectedVoicing,
      selectedRhythm,
      destinationBar,
      activeTrack.id
    );

    if (generated.length === 0) {
      onShowNotification('No notes could be generated for this key and octave.', 'error');
      return;
    }

    let finalNotes: MidiNote[] = [];
    const currentNotes = activeTrack.midiNotes || [];

    if (insertMode === 'replace') {
      if (destinationBar === 'full') {
        finalNotes = generated;
      } else if (destinationBar === 'bar1') {
        finalNotes = [...currentNotes.filter(n => n.step >= 16), ...generated];
      } else if (destinationBar === 'bar2') {
        finalNotes = [...currentNotes.filter(n => n.step < 16), ...generated];
      }
    } else {
      // Merge mode
      finalNotes = [...currentNotes, ...generated];
    }

    onUpdateMidiNotes(finalNotes);
    onShowNotification(`Inserted "${template.name}" in ${selectedKey} (${template.chords.length} chords applied)!`, 'success');
  };

  // Single chord stamp
  const handleStampSingleChord = () => {
    const generated = generateSingleChordNotes(
      stampRoot,
      stampQuality,
      stampOctave,
      stampStep,
      stampDuration,
      stampVoicing,
      activeTrack.id
    );

    const currentNotes = activeTrack.midiNotes || [];
    // Remove existing notes on that exact step if replacing
    const filtered = currentNotes.filter(n => n.step !== stampStep);
    onUpdateMidiNotes([...filtered, ...generated]);
    onShowNotification(`Stamped ${stampRoot}${CHORD_TYPES[stampQuality]?.short || ''} at Step ${stampStep + 1}!`, 'success');
  };

  // Apply custom progression
  const handleApplyCustomProgression = () => {
    const customTemplate: ChordProgressionTemplate = {
      id: 'custom-' + Date.now(),
      name: customProgressionName || 'Custom Progression',
      genre: 'Synthwave & Cyberpunk',
      mood: 'Custom created progression',
      description: 'Custom chord flow constructed in studio',
      scaleType: 'minor',
      defaultKey: selectedKey,
      chords: customSteps
    };

    handleApplyTemplate(customTemplate);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-5">
      <div className="bg-[#101016] border border-white/15 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-zinc-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#14141e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide uppercase font-syne">
                  Chord Structure Templates
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-accent/20 text-accent border border-accent/30">
                  HARMONIC ENGINE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Target Track: <strong className="text-white">{activeTrack.name}</strong> ({activeTrack.type.toUpperCase()}) // Audition with live synthesizer
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopAudition();
              onClose();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Key, Octave, Voicing & Rhythm Configuration Strip */}
        <div className="bg-[#161622] border-b border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Root Key Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Root Key:</span>
            <div className="flex bg-black/40 border border-white/10 p-0.5 rounded-lg">
              {NOTE_NAMES.map(note => (
                <button
                  key={note}
                  onClick={() => setSelectedKey(note)}
                  className={`px-1.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                    selectedKey === note
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* Octave Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Octave:</span>
            <div className="flex bg-black/40 border border-white/10 p-0.5 rounded-lg">
              {[1, 2, 3, 4, 5].map(oct => (
                <button
                  key={oct}
                  onClick={() => setSelectedOctave(oct)}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                    selectedOctave === oct
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  C{oct}
                </button>
              ))}
            </div>
          </div>

          {/* Voicing Style */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Voicing:</span>
            <select
              value={selectedVoicing}
              onChange={(e) => setSelectedVoicing(e.target.value as VoicingStyle)}
              className="bg-black/60 border border-white/10 rounded px-2 py-1 text-[11px] font-bold text-zinc-200 outline-none focus:border-accent"
            >
              <option value="root">Root Position (Close)</option>
              <option value="inv1">1st Inversion</option>
              <option value="inv2">2nd Inversion</option>
              <option value="drop2">Drop 2 (Jazz / Neo-Soul)</option>
              <option value="spread">Wide Spread (+Deep Bass)</option>
              <option value="octave_bass">Octave Bass Doubling</option>
            </select>
          </div>

          {/* Rhythm Style */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Rhythm:</span>
            <select
              value={selectedRhythm}
              onChange={(e) => setSelectedRhythm(e.target.value as RhythmPattern)}
              className="bg-black/60 border border-white/10 rounded px-2 py-1 text-[11px] font-bold text-zinc-200 outline-none focus:border-accent"
            >
              <option value="sustained">Sustained Chords (Pads / Drones)</option>
              <option value="stabs">Syncopated Stabs (House / Funk)</option>
              <option value="pumping">4-on-the-Floor (Trance / EDM)</option>
              <option value="arp_up">16th Arpeggio Up (Rolling Synth)</option>
              <option value="arp_down">16th Arpeggio Down</option>
              <option value="strum">Humanized Strum</option>
            </select>
          </div>

          {/* Destination & Mode */}
          <div className="flex items-center gap-2">
            <div className="flex bg-black/40 border border-white/10 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                onClick={() => setDestinationBar('full')}
                className={`px-2 py-0.5 rounded cursor-pointer ${destinationBar === 'full' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                title="Apply across all 32 steps (4 chords x 8 steps)"
              >
                32 Steps
              </button>
              <button
                onClick={() => setDestinationBar('bar1')}
                className={`px-2 py-0.5 rounded cursor-pointer ${destinationBar === 'bar1' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                title="Apply to Bar 1 (Steps 0–15)"
              >
                Bar 1
              </button>
              <button
                onClick={() => setDestinationBar('bar2')}
                className={`px-2 py-0.5 rounded cursor-pointer ${destinationBar === 'bar2' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                title="Apply to Bar 2 (Steps 16–31)"
              >
                Bar 2
              </button>
            </div>

            <button
              onClick={() => setInsertMode(prev => prev === 'replace' ? 'merge' : 'replace')}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                insertMode === 'replace'
                  ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
              }`}
              title={insertMode === 'replace' ? 'Will overwrite existing notes in targeted bars' : 'Will merge notes with existing sequence'}
            >
              {insertMode === 'replace' ? 'Overwrite' : 'Layer Merge'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#12121c] border-b border-white/10 px-4 py-2 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'templates'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Genre Progression Templates ({filteredTemplates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('stamper')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'stamper'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Chord Palette & Stamper</span>
            </button>

            <button
              onClick={() => setActiveTab('builder')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'builder'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom Progression Builder</span>
            </button>
          </div>

          {activeTab === 'templates' && (
            <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
              {genres.map(genre => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedGenre === genre
                      ? 'bg-white/20 text-white border border-white/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: Genre Progression Templates */}
        {activeTab === 'templates' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map(template => {
              const isAuditioning = auditioningId === template.id;
              
              // Calculate chord names and pitches in current selected key
              const renderedChords = template.chords.map(step => {
                const name = formatChordName(selectedKey, step);
                const pitches = calculateChordPitches(selectedKey, step, selectedOctave, selectedVoicing);
                return {
                  roman: step.displayRoman,
                  name,
                  pitches
                };
              });

              return (
                <div 
                  key={template.id}
                  className={`bg-[#141420] border rounded-xl p-4 flex flex-col justify-between transition-all hover:border-white/25 shadow-lg ${
                    isAuditioning ? 'border-accent ring-1 ring-accent/50 bg-accent/5' : 'border-white/10'
                  }`}
                >
                  <div>
                    {/* Header: Title, Genre badge, Mood */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm sm:text-base font-syne">
                            {template.name}
                          </h4>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {template.genre}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 italic mt-0.5">
                          {template.mood}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-300 mb-3 leading-relaxed">
                      {template.description}
                    </p>

                    {/* Chord Cards Strip */}
                    <div className="grid grid-cols-4 gap-2 mb-3 bg-black/40 p-2 rounded-lg border border-white/5">
                      {renderedChords.map((chord, cIdx) => (
                        <div
                          key={cIdx}
                          onClick={() => {
                            if (activeTrack.synthConfig) {
                              audioEngine.playChordLive(chord.pitches, activeTrack.synthConfig, activeTrack.id, 0.7, 16);
                            }
                          }}
                          className="bg-[#181826] hover:bg-[#202030] p-2 rounded border border-white/10 flex flex-col items-center justify-center cursor-pointer transition-colors group"
                          title={`Click to audition ${chord.name}: ${chord.pitches.join(', ')}`}
                        >
                          <span className="text-[9px] font-bold text-accent group-hover:underline">
                            {chord.roman}
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                            {chord.name}
                          </span>
                          <span className="text-[8px] font-mono text-zinc-400 truncate max-w-full mt-1">
                            {chord.pitches.slice(0, 3).join(' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions: Audition & Apply */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2">
                    <button
                      onClick={() => handleAuditionProgression(template)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        isAuditioning
                          ? 'bg-accent text-white border-accent animate-pulse shadow-md'
                          : 'bg-white/5 hover:bg-white/10 text-zinc-200 border-white/10'
                      }`}
                    >
                      {isAuditioning ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-white" />
                          <span>Stop Preview</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Audition</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleApplyTemplate(template)}
                      className="flex-1 py-1.5 px-3 bg-accent hover:bg-accent/90 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply to Track</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Single Chord Palette & Stamper */}
        {activeTab === 'stamper' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-5">
            {/* Quick explanation */}
            <div className="bg-purple-950/20 border border-purple-500/20 p-3 rounded-xl flex items-start gap-3">
              <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-300">
                The <strong>Chord Palette & Stamper</strong> allows you to audition any single chord voicing (triad, 7th, extended or altered) and stamp it directly onto a specific step in the 32-step sequencer.
              </p>
            </div>

            {/* Selector Grid */}
            <div className="bg-[#141420] border border-white/10 rounded-xl p-4 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Root note */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400">Root Note:</span>
                  <div className="flex bg-black/40 border border-white/10 p-0.5 rounded-lg">
                    {NOTE_NAMES.map(note => (
                      <button
                        key={note}
                        onClick={() => {
                          setStampRoot(note);
                          handleAuditionSingleChord(note, stampQuality, stampOctave, stampVoicing);
                        }}
                        className={`px-2 py-1 text-xs font-bold rounded cursor-pointer ${
                          stampRoot === note ? 'bg-accent text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {note}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Octave */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400">Octave:</span>
                  <div className="flex bg-black/40 border border-white/10 p-0.5 rounded-lg">
                    {[1, 2, 3, 4, 5].map(oct => (
                      <button
                        key={oct}
                        onClick={() => {
                          setStampOctave(oct);
                          handleAuditionSingleChord(stampRoot, stampQuality, oct, stampVoicing);
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                          stampOctave === oct ? 'bg-accent text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        C{oct}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voicing */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400">Voicing:</span>
                  <select
                    value={stampVoicing}
                    onChange={(e) => {
                      const v = e.target.value as VoicingStyle;
                      setStampVoicing(v);
                      handleAuditionSingleChord(stampRoot, stampQuality, stampOctave, v);
                    }}
                    className="bg-black/60 border border-white/10 rounded px-2.5 py-1 text-xs font-bold text-zinc-200"
                  >
                    <option value="root">Root Position (Close)</option>
                    <option value="inv1">1st Inversion</option>
                    <option value="inv2">2nd Inversion</option>
                    <option value="drop2">Drop 2 (Jazz / Neo-Soul)</option>
                    <option value="spread">Wide Spread (+Sub Bass)</option>
                  </select>
                </div>
              </div>

              {/* Chord Type Palette Grid */}
              <div className="mt-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Chord Quality & Extensions
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {Object.values(CHORD_TYPES).map(type => {
                    const isSelected = stampQuality === type.id;
                    const chordStep: ChordStep = { rootOffset: 0, quality: type.id, displayRoman: '' };
                    const pitches = calculateChordPitches(stampRoot, chordStep, stampOctave, stampVoicing);

                    return (
                      <button
                        key={type.id}
                        onClick={() => {
                          setStampQuality(type.id);
                          handleAuditionSingleChord(stampRoot, type.id, stampOctave, stampVoicing);
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-accent/20 border-accent ring-1 ring-accent text-white shadow-md'
                            : 'bg-black/40 border-white/10 text-zinc-300 hover:bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-white">
                            {stampRoot}{type.short}
                          </span>
                          <span className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-zinc-400 font-mono">
                            {type.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1 truncate">
                          {type.name}
                        </span>
                        <span className="text-[8px] font-mono text-accent mt-1.5 truncate">
                          {pitches.join(' ')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Placement settings */}
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Step */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400">Target Step:</span>
                    <select
                      value={stampStep}
                      onChange={(e) => setStampStep(parseInt(e.target.value))}
                      className="bg-black/60 border border-white/10 rounded px-2.5 py-1 text-xs font-bold text-zinc-200"
                    >
                      {Array(32).fill(0).map((_, i) => (
                        <option key={i} value={i}>
                          Step {i + 1} {i % 4 === 0 ? `(Beat ${i / 4 + 1})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400">Duration:</span>
                    <select
                      value={stampDuration}
                      onChange={(e) => setStampDuration(parseInt(e.target.value))}
                      className="bg-black/60 border border-white/10 rounded px-2.5 py-1 text-xs font-bold text-zinc-200"
                    >
                      <option value={2}>2 Steps (16th note)</option>
                      <option value={4}>4 Steps (Quarter note / 1 Beat)</option>
                      <option value={8}>8 Steps (Half Bar / 2 Beats)</option>
                      <option value={16}>16 Steps (Full Bar / 4 Beats)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAuditionSingleChord(stampRoot, stampQuality, stampOctave, stampVoicing)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-white/10"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Audition Chord</span>
                  </button>

                  <button
                    onClick={handleStampSingleChord}
                    className="px-5 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>Stamp Chord to Step {stampStep + 1}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Custom Progression Builder */}
        {activeTab === 'builder' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between bg-[#141420] p-4 rounded-xl border border-white/10">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <span className="text-xs font-bold text-zinc-400 uppercase">Progression Name:</span>
                <input
                  type="text"
                  value={customProgressionName}
                  onChange={(e) => setCustomProgressionName(e.target.value)}
                  className="bg-black/60 border border-white/10 rounded px-3 py-1.5 text-xs font-bold text-white flex-1 outline-none focus:border-accent font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (customSteps.length < 8) {
                      setCustomSteps([...customSteps, { rootOffset: 0, quality: 'min7', displayRoman: 'i7' }]);
                    }
                  }}
                  disabled={customSteps.length >= 8}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Chord ({customSteps.length}/8)</span>
                </button>

                <button
                  onClick={() => setCustomSteps([])}
                  className="px-2.5 py-1.5 bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold cursor-pointer"
                  title="Clear all chords"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chords Sequence Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {customSteps.map((step, idx) => {
                const name = formatChordName(selectedKey, step);
                const pitches = calculateChordPitches(selectedKey, step, selectedOctave, selectedVoicing);

                return (
                  <div 
                    key={idx}
                    className="bg-[#141422] border border-white/10 rounded-xl p-3.5 flex flex-col gap-3 relative shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent font-mono">
                        Slot {idx + 1}
                      </span>
                      <button
                        onClick={() => setCustomSteps(customSteps.filter((_, i) => i !== idx))}
                        className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-base font-extrabold text-white">
                        {name}
                      </div>
                      <button
                        onClick={() => {
                          if (activeTrack.synthConfig) {
                            audioEngine.playChordLive(pitches, activeTrack.synthConfig, activeTrack.id, 0.6, 16);
                          }
                        }}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-zinc-200 cursor-pointer"
                        title="Audition chord"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Scale Degree / Root Offset */}
                    <div className="flex flex-col gap-1 text-[10px]">
                      <span className="text-zinc-400 font-bold uppercase">Root Degree:</span>
                      <select
                        value={step.rootOffset}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const updated = [...customSteps];
                          updated[idx] = { ...step, rootOffset: val };
                          setCustomSteps(updated);
                        }}
                        className="bg-black/60 border border-white/10 rounded px-2 py-1 text-xs font-bold text-zinc-200"
                      >
                        {Array(12).fill(0).map((_, semitone) => {
                          const note = NOTE_NAMES[(NOTE_NAMES.indexOf(selectedKey) + semitone) % 12];
                          return (
                            <option key={semitone} value={semitone}>
                              +{semitone} st ({note})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Chord Quality */}
                    <div className="flex flex-col gap-1 text-[10px]">
                      <span className="text-zinc-400 font-bold uppercase">Quality:</span>
                      <select
                        value={step.quality}
                        onChange={(e) => {
                          const updated = [...customSteps];
                          updated[idx] = { ...step, quality: e.target.value };
                          setCustomSteps(updated);
                        }}
                        className="bg-black/60 border border-white/10 rounded px-2 py-1 text-xs font-bold text-zinc-200"
                      >
                        {Object.values(CHORD_TYPES).map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name} ({type.short})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-[9px] font-mono text-zinc-400 truncate">
                      Pitches: {pitches.join(' ')}
                    </div>
                  </div>
                );
              })}
            </div>

            {customSteps.length === 0 && (
              <div className="text-center py-12 border border-dashed border-white/15 rounded-xl text-zinc-500">
                <p className="text-sm">No chords added yet. Click &quot;Add Chord&quot; to build your progression.</p>
              </div>
            )}

            {/* Apply Bar */}
            {customSteps.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-[#141420] border border-white/10 rounded-xl mt-auto">
                <span className="text-xs text-zinc-400">
                  Total Chords: <strong className="text-white">{customSteps.length}</strong> // Will be mapped across destination steps
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const temp: ChordProgressionTemplate = {
                        id: 'custom-preview',
                        name: customProgressionName,
                        genre: 'Synthwave & Cyberpunk',
                        mood: '',
                        description: '',
                        scaleType: 'minor',
                        defaultKey: selectedKey,
                        chords: customSteps
                      };
                      handleAuditionProgression(temp);
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-white/10"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Audition Progression</span>
                  </button>

                  <button
                    onClick={handleApplyCustomProgression}
                    className="px-5 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply Progression to Track</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#12121c] flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-accent font-bold">PRO-TIP:</span>
            <span>Click any individual chord card to audition its voicing immediately through the active synth filter.</span>
          </div>

          <button
            onClick={() => {
              stopAudition();
              onClose();
            }}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
