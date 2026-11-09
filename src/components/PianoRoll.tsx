import React, { useState, useEffect, useRef } from 'react';
import { Track, MidiNote } from '../types';
import { 
  Music, Eye, Trash2, Wand2, Copy, ArrowLeft, ArrowRight, 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Sparkles, Hash, Layers, Sliders, Check, Target,
  Download, Upload, Radio, RefreshCw
} from 'lucide-react';
import { PITCH_TO_FREQ, PITCHES, audioEngine } from '../services/audioEngine';
import { midiService } from '../services/midiService';
import { ChordTemplatesModal } from './ChordTemplatesModal';

interface PianoRollProps {
  track: Track;
  bpm?: number;
  currentStep: number;
  onUpdateMidiNotes: (notes: MidiNote[]) => void;
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  tracks?: Track[];
  onSelectTrack?: (trackId: string) => void;
}

type ViewPage = 'all' | 'bar1' | 'bar2';

// Scale intervals in semitones relative to root
const SCALES: Record<string, { label: string; intervals: number[] }> = {
  chromatic: { label: 'Chromatic (All)', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  minor_pentatonic: { label: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
  major_pentatonic: { label: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9] },
  natural_minor: { label: 'Natural Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  major: { label: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  dorian: { label: 'Dorian (Synthwave/House)', intervals: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { label: 'Phrygian (Dark/Cyberpunk)', intervals: [0, 1, 3, 5, 7, 8, 10] },
  blues: { label: 'Blues Scale', intervals: [0, 3, 5, 6, 7, 10] },
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function PianoRoll({ 
  track, 
  bpm = 120,
  currentStep, 
  onUpdateMidiNotes,
  onShowNotification,
  focusMode,
  onToggleFocusMode,
  tracks,
  onSelectTrack
}: PianoRollProps) {
  const [selectedOctave, setSelectedOctave] = useState<number>(track.type === 'bass' ? 2 : 4);
  const [viewPage, setViewPage] = useState<ViewPage>('all');
  const [autoFollowPlayhead, setAutoFollowPlayhead] = useState(true);
  const [selectedRootNote, setSelectedRootNote] = useState<string>('C');
  const [selectedScaleKey, setSelectedScaleKey] = useState<string>('minor_pentatonic');
  const [noteDuration, setNoteDuration] = useState<number>(2); // 1, 2, 4, 8 steps
  const [activeGeneratorMenu, setActiveGeneratorMenu] = useState(false);
  const [isChordModalOpen, setIsChordModalOpen] = useState(false);
  const [isGeneratingMelody, setIsGeneratingMelody] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [paintMode, setPaintMode] = useState<'add' | 'remove' | null>(null);
  const [activeMidiKeys, setActiveMidiKeys] = useState<Set<string>>(new Set());

  const midiFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = midiService.onEventLog((evt) => {
      if (evt.type === 'noteon' && evt.note) {
        setActiveMidiKeys(prev => new Set(prev).add(evt.note!));
      } else if (evt.type === 'noteoff' && evt.note) {
        setActiveMidiKeys(prev => {
          const next = new Set(prev);
          next.delete(evt.note!);
          return next;
        });
      }
    });

    return () => {
      unsub();
    };
  }, []);

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onShowNotification) {
      onShowNotification(msg, type);
    }
  };

  const handleExportMidi = () => {
    try {
      const blob = midiService.exportTrackToMidiBlob(track, bpm);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(track.name || 'melody').toLowerCase().replace(/\s+/g, '_')}_piano_roll.mid`;
      a.click();
      URL.revokeObjectURL(url);
      notify(`Exported "${track.name}" as standard MIDI file (.mid)!`, "success");
    } catch (err: any) {
      notify(`MIDI export failed: ${err.message}`, "error");
    }
  };

  const handleImportMidi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await midiService.parseMidiFile(file);
      if (res.notes.length === 0) {
        notify("No notes found in imported MIDI file.", "error");
        return;
      }
      onUpdateMidiNotes(res.notes);
      notify(`Imported ${res.notes.length} notes from "${file.name}"!`, "success");
    } catch (err: any) {
      notify(`Failed to parse MIDI: ${err.message || 'Invalid format'}`, "error");
    }
    e.target.value = '';
  };

  const notes = track.midiNotes || [];

  // Filter pitches for the current octave view
  const visiblePitches = PITCHES.filter(pitch => {
    const oct = parseInt(pitch.slice(-1));
    return oct === selectedOctave;
  }).reverse(); // High notes on top

  // Scale highlighting helper
  const isPitchInScale = (pitch: string): boolean => {
    const pitchNote = pitch.replace(/[0-9]/g, '');
    const rootIndex = NOTE_NAMES.indexOf(selectedRootNote);
    const noteIndex = NOTE_NAMES.indexOf(pitchNote);
    if (rootIndex === -1 || noteIndex === -1) return true;
    
    const semitonesFromRoot = (noteIndex - rootIndex + 12) % 12;
    const scaleIntervals = SCALES[selectedScaleKey]?.intervals || SCALES.chromatic.intervals;
    return scaleIntervals.includes(semitonesFromRoot);
  };

  const isRootPitch = (pitch: string): boolean => {
    const pitchNote = pitch.replace(/[0-9]/g, '');
    return pitchNote === selectedRootNote;
  };

  // View paging
  const effectiveViewPage = (autoFollowPlayhead && viewPage !== 'all') 
    ? (currentStep < 16 ? 'bar1' : 'bar2')
    : viewPage;

  const startStep = effectiveViewPage === 'bar2' ? 16 : 0;
  const endStep = effectiveViewPage === 'bar1' ? 16 : (effectiveViewPage === 'bar2' ? 32 : 32);
  const visibleStepsCount = endStep - startStep;

  // Note toggling & drag painting
  const handleToggleNote = (pitch: string, step: number) => {
    const existingIndex = notes.findIndex(n => n.pitch === pitch && n.step === step);
    
    if (existingIndex !== -1) {
      const updated = notes.filter((_, idx) => idx !== existingIndex);
      onUpdateMidiNotes(updated);
    } else {
      const newNote: MidiNote = {
        id: `${track.id}-${pitch}-${step}-${Date.now()}`,
        pitch,
        step,
        duration: noteDuration,
      };
      
      const updated = [...notes, newNote];
      onUpdateMidiNotes(updated);
      
      if (track.synthConfig) {
        audioEngine.playNoteLive(pitch, track.synthConfig, track.id);
      }
    }
  };

  const handleCellMouseDown = (pitch: string, step: number) => {
    setIsMouseDown(true);
    const existing = notes.some(n => n.pitch === pitch && n.step === step);
    const mode = existing ? 'remove' : 'add';
    setPaintMode(mode);

    if (mode === 'remove') {
      const updated = notes.filter(n => !(n.pitch === pitch && n.step === step));
      onUpdateMidiNotes(updated);
    } else {
      const newNote: MidiNote = {
        id: `${track.id}-${pitch}-${step}-${Date.now()}`,
        pitch,
        step,
        duration: noteDuration,
      };
      onUpdateMidiNotes([...notes, newNote]);
      if (track.synthConfig) {
        audioEngine.playNoteLive(pitch, track.synthConfig, track.id);
      }
    }
  };

  const handleCellMouseEnter = (pitch: string, step: number) => {
    if (!isMouseDown || !paintMode) return;
    const exists = notes.some(n => n.pitch === pitch && n.step === step);

    if (paintMode === 'add' && !exists) {
      const newNote: MidiNote = {
        id: `${track.id}-${pitch}-${step}-${Date.now()}`,
        pitch,
        step,
        duration: noteDuration,
      };
      onUpdateMidiNotes([...notes, newNote]);
      if (track.synthConfig) {
        audioEngine.playNoteLive(pitch, track.synthConfig, track.id);
      }
    } else if (paintMode === 'remove' && exists) {
      const updated = notes.filter(n => !(n.pitch === pitch && n.step === step));
      onUpdateMidiNotes(updated);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setPaintMode(null);
  };

  const handleClear = () => {
    onUpdateMidiNotes([]);
  };

  // Pattern manipulation utilities
  const handleDuplicateBar1ToBar2 = () => {
    const bar1Notes = notes.filter(n => n.step < 16);
    const bar2Clones: MidiNote[] = bar1Notes.map(n => ({
      ...n,
      id: `${n.id}-bar2-${Date.now()}-${Math.random()}`,
      step: n.step + 16,
    }));
    // Remove existing notes in bar 2 and replace with cloned bar 1
    const kept = notes.filter(n => n.step < 16);
    onUpdateMidiNotes([...kept, ...bar2Clones]);
  };

  const handleShiftNotes = (delta: number) => {
    const updated = notes.map(n => {
      let newStep = (n.step + delta + 32) % 32;
      return { ...n, step: newStep };
    });
    onUpdateMidiNotes(updated);
  };

  const handleTranspose = (semitones: number) => {
    const updated = notes.map(n => {
      const currentIdx = PITCHES.indexOf(n.pitch);
      if (currentIdx === -1) return n;
      const targetIdx = Math.max(0, Math.min(PITCHES.length - 1, currentIdx + semitones));
      return { ...n, pitch: PITCHES[targetIdx] };
    });
    onUpdateMidiNotes(updated);
  };

  // AI-powered Random Melody Generator using current scale setting
  const handleGenerateRandomMelody = async () => {
    if (isGeneratingMelody) return;
    setIsGeneratingMelody(true);

    const rootIndex = NOTE_NAMES.indexOf(selectedRootNote);
    const scaleInfo = SCALES[selectedScaleKey] || SCALES.minor_pentatonic;
    const intervals = scaleInfo.intervals;

    // Build pool of valid scale pitches across the selected octave and adjacent octaves
    const scalePitches: string[] = [];
    const targetOctaves = track.type === 'bass'
      ? [Math.max(1, selectedOctave - 1), selectedOctave]
      : [selectedOctave, Math.min(6, selectedOctave + 1)];

    targetOctaves.forEach(oct => {
      intervals.forEach(interval => {
        const noteName = NOTE_NAMES[(rootIndex + interval) % 12];
        const pitchName = `${noteName}${oct}`;
        if (PITCH_TO_FREQ[pitchName] && !scalePitches.includes(pitchName)) {
          scalePitches.push(pitchName);
        }
      });
    });

    if (scalePitches.length === 0) {
      notify('No valid scale pitches found for the selected octave.', 'error');
      setIsGeneratingMelody(false);
      return;
    }

    let generatedNotes: MidiNote[] = [];
    let melodyTitle = '';

    // Attempt AI generation via server Gemini endpoint
    try {
      const response = await fetch('/api/ai/generate-melody', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootNote: selectedRootNote,
          scaleName: scaleInfo.label,
          scalePitches,
          trackName: track.name,
          trackType: track.type,
          bpm,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && Array.isArray(json.data.notes) && json.data.notes.length > 0) {
          melodyTitle = json.data.melodyName || 'Neural Synth Melody';
          generatedNotes = json.data.notes
            .filter((n: any) => PITCH_TO_FREQ[n.pitch] && typeof n.step === 'number' && n.step >= 0 && n.step < 32)
            .map((n: any, idx: number) => ({
              id: `${track.id}-${n.pitch}-${n.step}-${Date.now()}-${idx}`,
              pitch: n.pitch,
              step: Math.min(31, Math.max(0, Math.floor(n.step))),
              duration: Math.min(32 - n.step, Math.max(1, Math.floor(n.duration || 2))),
            }));
        }
      }
    } catch {
      // Endpoint handled gracefully
    }

    // Intelligent harmonic fallback (motif repetition, scale degree weighting, rhythmic syncopation)
    if (generatedNotes.length === 0) {
      melodyTitle = `${selectedRootNote} ${scaleInfo.label} Motif`;

      const rootPitch = scalePitches[0];
      const thirdPitch = scalePitches[Math.min(2, scalePitches.length - 1)];
      const fifthPitch = scalePitches[Math.min(4, scalePitches.length - 1)];
      const octavePitch = scalePitches[Math.min(intervals.length, scalePitches.length - 1)];

      // Construct Bar 1 Motif (Steps 0 - 15)
      const possibleMotifSteps = [0, 2, 4, 6, 8, 10, 12, 14];
      const motifSteps = possibleMotifSteps.filter((st) => st === 0 || Math.random() > 0.35);
      if (!motifSteps.includes(0)) motifSteps.unshift(0);

      const bar1: { pitch: string; step: number; duration: number }[] = [];
      motifSteps.forEach((st, idx) => {
        let pitch = rootPitch;
        if (st === 0) {
          pitch = rootPitch;
        } else if (idx === motifSteps.length - 1) {
          pitch = fifthPitch || rootPitch;
        } else {
          const candidates = [rootPitch, thirdPitch, fifthPitch, octavePitch, ...scalePitches];
          pitch = candidates[Math.floor(Math.random() * candidates.length)];
        }
        const duration = Math.random() > 0.6 ? 2 : 1;
        bar1.push({ pitch, step: st, duration });
      });

      // Construct Bar 2 Variation & Call-and-Response (Steps 16 - 31)
      const bar2: { pitch: string; step: number; duration: number }[] = [];
      bar1.forEach((note) => {
        const step = note.step + 16;
        if (step < 32) {
          let pitch = note.pitch;
          if (Math.random() > 0.4) {
            const currentIdx = scalePitches.indexOf(note.pitch);
            const delta = Math.random() > 0.5 ? 1 : -1;
            const targetIdx = Math.max(0, Math.min(scalePitches.length - 1, currentIdx + delta));
            pitch = scalePitches[targetIdx];
          }
          bar2.push({ pitch, step, duration: note.duration });
        }
      });

      if (!bar2.some(n => n.step >= 28)) {
        bar2.push({ pitch: rootPitch, step: 28, duration: 3 });
      }

      generatedNotes = [...bar1, ...bar2].map((n, idx) => ({
        id: `${track.id}-${n.pitch}-${n.step}-${Date.now()}-${idx}`,
        pitch: n.pitch,
        step: n.step,
        duration: n.duration,
      }));
    }

    onUpdateMidiNotes(generatedNotes);
    notify(`✨ Generated AI Melody: "${melodyTitle}" (${generatedNotes.length} notes in ${selectedRootNote} ${scaleInfo.label})`, 'success');

    // Audition preview of first note through synth engine
    if (track.synthConfig && generatedNotes.length > 0) {
      audioEngine.playNoteLive(generatedNotes[0].pitch, track.synthConfig, track.id);
    }

    setIsGeneratingMelody(false);
  };

  // Preset Generators
  const generatePattern = (type: 'riff' | 'walking_bass' | 'arp' | 'chords' | 'acid_303') => {
    const rootIndex = NOTE_NAMES.indexOf(selectedRootNote);
    const intervals = SCALES[selectedScaleKey]?.intervals || SCALES.minor_pentatonic.intervals;
    
    // Build list of valid pitches in chosen octave
    const scalePitches: string[] = [];
    intervals.forEach(interval => {
      const noteName = NOTE_NAMES[(rootIndex + interval) % 12];
      const pitchName = `${noteName}${selectedOctave}`;
      if (PITCH_TO_FREQ[pitchName]) {
        scalePitches.push(pitchName);
      }
    });

    if (scalePitches.length === 0) return;

    const generated: MidiNote[] = [];

    if (type === 'walking_bass' || track.type === 'bass') {
      // Groove bassline on 8th/16th syncopations
      for (let step = 0; step < 32; step += 4) {
        const pitch = scalePitches[Math.floor(Math.random() * scalePitches.length)];
        generated.push({
          id: `${track.id}-${pitch}-${step}-${Date.now()}`,
          pitch,
          step,
          duration: 3,
        });
        if (Math.random() > 0.4 && step + 2 < 32) {
          const ghostPitch = scalePitches[0];
          generated.push({
            id: `${track.id}-${ghostPitch}-${step + 2}-${Date.now()}`,
            pitch: ghostPitch,
            step: step + 2,
            duration: 1,
          });
        }
      }
    } else if (type === 'arp') {
      // 16th note rolling arpeggio
      let pitchIdx = 0;
      for (let step = 0; step < 32; step += 2) {
        const pitch = scalePitches[pitchIdx % scalePitches.length];
        generated.push({
          id: `${track.id}-${pitch}-${step}-${Date.now()}`,
          pitch,
          step,
          duration: 2,
        });
        pitchIdx++;
      }
    } else if (type === 'chords') {
      // 4-bar sustained chord progression
      for (let bar = 0; bar < 2; bar++) {
        const root = scalePitches[bar % scalePitches.length];
        const third = scalePitches[(bar + 2) % scalePitches.length];
        const fifth = scalePitches[(bar + 4) % scalePitches.length];
        const step = bar * 16;
        [root, third, fifth].forEach((p, idx) => {
          generated.push({
            id: `${track.id}-${p}-${step}-${idx}`,
            pitch: p,
            step,
            duration: 14,
          });
        });
      }
    } else if (type === 'acid_303') {
      // Squelchy rhythmic acid run
      for (let step = 0; step < 32; step += 2) {
        if (Math.random() > 0.3) {
          const p = scalePitches[Math.floor(Math.random() * scalePitches.length)];
          generated.push({
            id: `${track.id}-${p}-${step}`,
            pitch: p,
            step,
            duration: Math.random() > 0.5 ? 2 : 1,
          });
        }
      }
    } else {
      // Melodic riff
      for (let step = 0; step < 32; step += 2) {
        if (Math.random() > 0.35) {
          const pitch = scalePitches[Math.floor(Math.random() * scalePitches.length)];
          generated.push({
            id: `${track.id}-${pitch}-${step}`,
            pitch,
            step,
            duration: 2,
          });
        }
      }
    }

    onUpdateMidiNotes(generated);
    setActiveGeneratorMenu(false);
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#121214] border border-white/10 rounded-xl p-4 shadow-xl select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Header & Navigation */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-3.5 pb-3.5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Music className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Piano Roll MIDI Editor <span className="text-xs text-zinc-400 font-mono font-normal">({track.name})</span>
            </h3>
            {/* Live Playhead Step Badge */}
            <div className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              <span>Step {currentStep + 1}/32</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Paint melodies & basslines. High rows represent higher pitches.
          </p>
        </div>

        {/* View Switchers & Octave Selector */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Bar / View Selector Pills */}
          <div className="flex bg-zinc-900 border border-zinc-750 p-0.5 rounded-lg text-xs font-mono font-semibold">
            <button
              onClick={() => setViewPage('all')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                effectiveViewPage === 'all'
                  ? 'bg-purple-600 text-white shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All 32 Steps
            </button>
            <button
              onClick={() => setViewPage('bar1')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                effectiveViewPage === 'bar1'
                  ? 'bg-purple-600 text-white shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Bar 1 (1–16)
            </button>
            <button
              onClick={() => setViewPage('bar2')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                effectiveViewPage === 'bar2'
                  ? 'bg-purple-600 text-white shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Bar 2 (17–32)
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

          {/* Octave Selector with Up/Down buttons */}
          <div className="flex items-center bg-zinc-900 border border-zinc-750 p-0.5 rounded-lg text-xs font-mono font-medium text-zinc-300">
            <button
              onClick={() => setSelectedOctave(prev => Math.max(1, prev - 1))}
              disabled={selectedOctave <= 1}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Octave Down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <div className="flex gap-0.5 px-1">
              {[1, 2, 3, 4, 5, 6].map(oct => (
                <button
                  key={oct}
                  onClick={() => setSelectedOctave(oct)}
                  className={`w-6 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    selectedOctave === oct
                      ? 'bg-purple-600 text-white font-black'
                      : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  C{oct}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedOctave(prev => Math.min(6, prev + 1))}
              disabled={selectedOctave >= 6}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Octave Up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Random Melody Generator Button */}
          <button
            onClick={handleGenerateRandomMelody}
            disabled={isGeneratingMelody}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-accent via-rose-500 to-purple-600 hover:brightness-110 active:scale-95 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md disabled:opacity-50"
            title={`Generate AI-powered melody in ${selectedRootNote} ${SCALES[selectedScaleKey]?.label || ''}`}
          >
            {isGeneratingMelody ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                <span>Composing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Generate Random Melody</span>
              </>
            )}
          </button>

          {/* Chord Structure Templates Trigger Button */}
          <button
            onClick={() => setIsChordModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-accent/20 to-purple-500/20 hover:from-accent/30 hover:to-purple-500/30 text-accent hover:text-white border border-accent/40 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
            title="Open Chord Structure Templates & Progression Palette"
          >
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>Chord Templates</span>
          </button>

          {/* AI Melody Generator Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveGeneratorMenu(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI Melodies</span>
            </button>

            {activeGeneratorMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-1.5 z-30 flex flex-col gap-1">
                <div className="text-[10px] text-zinc-500 uppercase font-mono px-2 py-1 font-bold">
                  Melodic Styles
                </div>
                <button
                  onClick={() => {
                    setActiveGeneratorMenu(false);
                    handleGenerateRandomMelody();
                  }}
                  className="text-left px-2 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-accent/20 to-purple-600/20 hover:from-accent/30 hover:to-purple-600/30 rounded transition-colors cursor-pointer flex items-center gap-1.5 border border-accent/30"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Random Melody ({selectedRootNote} {SCALES[selectedScaleKey]?.label?.split(' ')[0]})</span>
                </button>
                <button
                  onClick={() => generatePattern('riff')}
                  className="text-left px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer"
                >
                  ✨ Pentatonic Hook Riff
                </button>
                <button
                  onClick={() => generatePattern('walking_bass')}
                  className="text-left px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer"
                >
                  🎸 Groove Walking Bassline
                </button>
                <button
                  onClick={() => generatePattern('arp')}
                  className="text-left px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer"
                >
                  🌊 16th Arpeggiator Wave
                </button>
                <button
                  onClick={() => generatePattern('chords')}
                  className="text-left px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer"
                >
                  🎹 Ambient Chord Swell
                </button>
                <button
                  onClick={() => generatePattern('acid_303')}
                  className="text-left px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer"
                >
                  ⚡ Acid 303 Techno Run
                </button>

                <div className="border-t border-zinc-800 my-1" />
                <div className="text-[10px] text-accent uppercase font-mono px-2 py-0.5 font-bold flex items-center justify-between">
                  <span>Chord Progressions</span>
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
                <button
                  onClick={() => {
                    setActiveGeneratorMenu(false);
                    setIsChordModalOpen(true);
                  }}
                  className="text-left px-2 py-1.5 text-xs text-accent hover:bg-accent/10 rounded transition-colors cursor-pointer flex items-center gap-1.5 font-bold"
                >
                  <Layers className="w-3 h-3 text-accent" />
                  <span>Browse Chord Templates...</span>
                </button>
              </div>
            )}
          </div>

          {/* Export MIDI */}
          <button
            onClick={handleExportMidi}
            className="flex items-center justify-center gap-1 px-2 py-1 bg-zinc-850 hover:bg-zinc-800 text-cyan-400 text-xs font-medium rounded-lg transition-colors border border-zinc-750 cursor-pointer"
            title="Export this track as a standard MIDI file (.mid)"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>.MID</span>
          </button>

          {/* Import MIDI */}
          <button
            onClick={() => midiFileInputRef.current?.click()}
            className="flex items-center justify-center gap-1 px-2 py-1 bg-zinc-850 hover:bg-zinc-800 text-pink-400 text-xs font-medium rounded-lg transition-colors border border-zinc-750 cursor-pointer"
            title="Import notes from a standard MIDI file (.mid)"
          >
            <Upload className="w-3 h-3 text-pink-400" />
            <span>Load .MID</span>
          </button>
          <input
            ref={midiFileInputRef}
            type="file"
            accept=".mid,.midi"
            onChange={handleImportMidi}
            className="hidden"
          />

          {/* Clear */}
          <button
            onClick={handleClear}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg transition-colors border border-zinc-750 cursor-pointer"
            title="Clear all MIDI notes"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

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
                      ? 'bg-zinc-800 text-white border-purple-500/60 ring-1 ring-purple-500/40 shadow-sm'
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

      {/* Scale Helper & Melodic Tools Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 bg-zinc-950/60 p-2 rounded-lg border border-zinc-850 text-xs font-mono">
        {/* Key & Scale Snapping Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Key Guide:</span>
          {/* Root Note */}
          <select
            value={selectedRootNote}
            onChange={(e) => setSelectedRootNote(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-200 rounded px-2 py-1 text-xs font-bold cursor-pointer"
          >
            {NOTE_NAMES.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          {/* Scale Type */}
          <select
            value={selectedScaleKey}
            onChange={(e) => setSelectedScaleKey(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-200 rounded px-2 py-1 text-xs font-bold cursor-pointer"
          >
            {Object.entries(SCALES).map(([key, data]) => (
              <option key={key} value={key}>{data.label}</option>
            ))}
          </select>

          {/* Quick AI Melody Trigger in Scale Bar */}
          <button
            onClick={handleGenerateRandomMelody}
            disabled={isGeneratingMelody}
            className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-white rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title={`Generate AI melody constrained to ${selectedRootNote} ${SCALES[selectedScaleKey]?.label}`}
          >
            {isGeneratingMelody ? (
              <RefreshCw className="w-3 h-3 animate-spin text-amber-300" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-300" />
            )}
            <span>AI Melody</span>
          </button>

          {/* Note Length / Duration Selector */}
          <div className="flex items-center gap-1 ml-2 border-l border-zinc-800 pl-3">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Length:</span>
            {([1, 2, 4, 8] as const).map(len => (
              <button
                key={len}
                onClick={() => setNoteDuration(len)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                  noteDuration === len
                    ? 'bg-purple-600 text-white font-black'
                    : 'bg-zinc-850 text-zinc-400 hover:text-zinc-200'
                }`}
                title={`Note duration: ${len} steps`}
              >
                {len === 1 ? '1/16' : len === 2 ? '1/8' : len === 4 ? '1/4' : '1/2'}
              </button>
            ))}
          </div>
        </div>

        {/* Melodic Transform Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDuplicateBar1ToBar2}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
            title="Duplicate Bar 1 to Bar 2"
          >
            <Copy className="w-2.5 h-2.5 text-purple-400" />
            <span>Copy Bar 1 → 2</span>
          </button>

          {/* Transpose +/- 1 */}
          <button
            onClick={() => handleTranspose(-1)}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors cursor-pointer text-[11px]"
            title="Transpose Down 1 Semitone"
          >
            -1st
          </button>
          <button
            onClick={() => handleTranspose(1)}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors cursor-pointer text-[11px]"
            title="Transpose Up 1 Semitone"
          >
            +1st
          </button>
          <button
            onClick={() => handleTranspose(12)}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors cursor-pointer text-[11px]"
            title="Transpose Up 1 Octave"
          >
            +8va
          </button>

          {/* Shift Left / Right */}
          <button
            onClick={() => handleShiftNotes(-1)}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors cursor-pointer text-[11px]"
            title="Shift Notes Left"
          >
            <ArrowLeft className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={() => handleShiftNotes(1)}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors cursor-pointer text-[11px]"
            title="Shift Notes Right"
          >
            <ArrowRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Piano Roll Grid container */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 flex-1">
        <div className="min-w-[680px] flex flex-col">
          {/* Header Timeline / Beat Numbers */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-20 text-right pr-2 text-[10px] text-zinc-500 font-mono font-bold tracking-wider uppercase">
              Keys
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

                return (
                  <div
                    key={stepIdx}
                    className={`text-center py-1 rounded transition-colors ${
                      isPlayhead
                        ? 'bg-purple-500 text-white font-black shadow-md scale-105 z-10'
                        : isMeasureStart
                          ? 'text-purple-300 bg-purple-500/10 font-black border border-purple-500/20'
                          : isBeatStart
                            ? 'text-zinc-200 bg-zinc-800/80 font-bold'
                            : 'text-zinc-500 bg-zinc-900/40'
                    }`}
                  >
                    {isBeatStart ? `${Math.floor(stepIdx / 4) + 1}` : `.${(stepIdx % 4) + 1}`}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Rows for Each Note in Selected Octave */}
          <div className="flex flex-col gap-1 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
            {visiblePitches.map((pitch) => {
              const isSharp = pitch.includes('#');
              const inScale = isPitchInScale(pitch);
              const isRoot = isRootPitch(pitch);
              const isMidiActive = activeMidiKeys.has(pitch);

              return (
                <div key={pitch} className="flex items-center gap-2 h-7">
                  {/* Piano Key Header */}
                  <button
                    onClick={() => {
                      if (track.synthConfig) {
                        audioEngine.playNoteLive(pitch, track.synthConfig, track.id);
                      }
                    }}
                    className={`w-20 text-left px-2 py-1 rounded font-mono text-[10px] font-bold border flex items-center justify-between transition-colors cursor-pointer shrink-0 ${
                      isMidiActive
                        ? 'bg-cyan-400 text-black border-cyan-300 ring-2 ring-cyan-400 font-black shadow-[0_0_12px_#06b6d4]'
                        : isRoot
                          ? 'bg-purple-600 text-white border-purple-400 font-black ring-1 ring-purple-400'
                          : isSharp
                            ? 'bg-zinc-950 text-purple-300 border-zinc-800 hover:bg-zinc-900'
                            : inScale
                              ? 'bg-zinc-200 text-zinc-950 border-zinc-300 hover:bg-white font-bold'
                              : 'bg-zinc-300/60 text-zinc-700 border-zinc-400 hover:bg-zinc-200'
                    }`}
                    title={`Audition ${pitch} ${isRoot ? '(Root)' : inScale ? '(In Scale)' : ''} ${isMidiActive ? '[MIDI IN]' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      <span>{pitch}</span>
                      {isRoot && <span className="text-[8px] bg-white text-purple-700 px-1 rounded">ROOT</span>}
                    </div>
                    <span className={`text-[8px] ${isMidiActive ? 'text-black font-black' : 'opacity-40'}`}>
                      {isMidiActive ? '●' : '🎹'}
                    </span>
                  </button>

                  {/* 32 Step Slots for this Note */}
                  <div 
                    className="flex-1 grid gap-1 h-full"
                    style={{ gridTemplateColumns: `repeat(${visibleStepsCount}, minmax(0, 1fr))` }}
                  >
                    {Array(visibleStepsCount).fill(0).map((_, idx) => {
                      const stepIdx = startStep + idx;
                      const activeNote = notes.find(n => n.pitch === pitch && n.step === stepIdx);
                      const isCoveredByNote = notes.some(n => n.pitch === pitch && stepIdx > n.step && stepIdx < (n.step + n.duration));
                      const isBeatStart = stepIdx % 4 === 0;
                      const isPlayhead = currentStep === stepIdx;

                      let cellBg = isSharp ? 'bg-zinc-950/70 border-zinc-900' : 'bg-zinc-900/60 border-zinc-850';
                      if (inScale && !isSharp) cellBg = 'bg-zinc-850/50 border-zinc-800';

                      if (activeNote) {
                        cellBg = track.type === 'bass' 
                          ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)] text-white border-cyan-400' 
                          : 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)] text-white border-purple-400';
                      } else if (isCoveredByNote) {
                        cellBg = track.type === 'bass' 
                          ? 'bg-cyan-600/50 border-cyan-500/40 border-dashed' 
                          : 'bg-purple-600/50 border-purple-500/40 border-dashed';
                      } else if (isBeatStart) {
                        cellBg = isSharp ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-850/80 border-zinc-750';
                      }

                      return (
                        <button
                          key={stepIdx}
                          onMouseDown={() => handleCellMouseDown(pitch, stepIdx)}
                          onMouseEnter={() => handleCellMouseEnter(pitch, stepIdx)}
                          className={`h-full rounded transition-all cursor-pointer border select-none relative ${cellBg} ${
                            isPlayhead ? 'ring-2 ring-purple-400 ring-offset-1 ring-offset-zinc-950 z-10' : ''
                          }`}
                          title={`${pitch} • Step ${stepIdx + 1} (${activeNote ? 'Active Note' : 'Click/Drag to Draw'})`}
                        >
                          {activeNote && (
                            <span className="absolute left-1 top-0.5 text-[7px] font-mono font-bold text-white/90">
                              {activeNote.duration}s
                            </span>
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
      </div>

      {/* Bottom Footer Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-zinc-800 text-[10px] text-zinc-400 font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-purple-500 inline-block" />
            <span className="text-zinc-300">Lead Note</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-cyan-500 inline-block" />
            <span className="text-zinc-300">Bass Note</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-purple-600 border border-purple-400 inline-block" />
            <span className="text-zinc-300">Root Key ({selectedRootNote})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-zinc-200 inline-block" />
            <span className="text-zinc-300">Scale Tone</span>
          </div>
        </div>

        <div className="text-zinc-400">
          💡 Scale: <span className="text-purple-400 font-bold">{selectedRootNote} {SCALES[selectedScaleKey]?.label}</span> • Click or drag to paint notes.
        </div>
      </div>

      {/* Chord Structure Templates Modal */}
      <ChordTemplatesModal
        isOpen={isChordModalOpen}
        onClose={() => setIsChordModalOpen(false)}
        activeTrack={track}
        bpm={bpm}
        onUpdateMidiNotes={(newNotes) => onUpdateMidiNotes(newNotes)}
        onShowNotification={(msg, type) => notify(msg, type)}
      />
    </div>
  );
}
