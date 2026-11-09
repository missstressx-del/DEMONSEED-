import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Track, SynthConfig, MidiNote } from '../types';
import { 
  Sliders, Activity, Zap, Volume2, HelpCircle, Radio, Disc, 
  Download, Upload, Sparkles, Wand2, RefreshCw, Layers, Check, 
  Play, Square, ChevronUp, ChevronDown, RotateCcw, SlidersHorizontal,
  Keyboard, Music, Cpu, Flame, Target, Settings2, AlertCircle
} from 'lucide-react';
import { audioEngine, PITCH_TO_FREQ, PITCHES } from '../services/audioEngine';
import { midiService, MidiDevice, MidiCcMapping, MidiEventLog, MidiLearnTarget, midiNumberToPitch, pitchToMidiNumber } from '../services/midiService';
import { MidiMappingsModal } from './MidiMappingsModal';

interface SynthDesignerProps {
  track: Track;
  bpm?: number;
  onUpdateSynthConfig: (config: SynthConfig) => void;
  onUpdateMidiNotes?: (notes: MidiNote[]) => void;
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  tracks?: Track[];
  onUpdateTrack?: (track: Track) => void;
}

type ChordMode = 'single' | 'major_triad' | 'minor_triad' | 'maj7' | 'min7' | 'sus4' | 'octave_stack';
type ArpMode = 'off' | 'up' | 'down' | 'up_down' | 'random' | 'chord_chop';
type ArpRate = '1/4' | '1/8' | '1/16' | '1/32';

const CHORD_INTERVALS: Record<ChordMode, { label: string; intervals: number[] }> = {
  single: { label: 'Single Note', intervals: [0] },
  major_triad: { label: 'Major Triad (+4, +7)', intervals: [0, 4, 7] },
  minor_triad: { label: 'Minor Triad (+3, +7)', intervals: [0, 3, 7] },
  maj7: { label: 'Major 7th (+4, +7, +11)', intervals: [0, 4, 7, 11] },
  min7: { label: 'Minor 7th (+3, +7, +10)', intervals: [0, 3, 7, 10] },
  sus4: { label: 'Sus4 Synth (+5, +7)', intervals: [0, 5, 7] },
  octave_stack: { label: 'Octave Stack (+12, +24)', intervals: [0, 12, 24] },
};

export function SynthDesigner({ 
  track, 
  bpm = 120, 
  onUpdateSynthConfig, 
  onUpdateMidiNotes, 
  onShowNotification,
  tracks = [],
  onUpdateTrack
}: SynthDesignerProps) {
  const config: SynthConfig = useMemo(() => ({
    oscillator: 'sawtooth',
    attack: 0.05,
    decay: 0.2,
    sustain: 0.6,
    release: 0.3,
    cutoff: 2000,
    resonance: 1,
    delayTime: 0.25,
    delayFeedback: 0.3,
    layer2Enabled: false,
    layer2Oscillator: 'sawtooth',
    layer2Octave: 0,
    layer2Detune: 7,
    layer2Level: 0.75,
    layer2Pan: 0,
    subEnabled: false,
    subOscillator: 'sine',
    subOctave: -1,
    subLevel: 0.65,
    noiseLayerEnabled: false,
    noiseType: 'white',
    noiseLevel: 0.25,
    unisonVoices: 1,
    unisonDetune: 14,
    unisonSpread: 0.6,
    ...track.synthConfig,
  }), [track.synthConfig]);

  // MIDI Hardware & Controller States
  const [midiDevices, setMidiDevices] = useState<MidiDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<number>(0); // 0 = Omni
  const [midiStatusMessage, setMidiStatusMessage] = useState<string>('');
  const [isMidiRxActive, setIsMidiRxActive] = useState<boolean>(false);
  const [lastMidiEvent, setLastMidiEvent] = useState<MidiEventLog | null>(null);
  const [learningParam, setLearningParam] = useState<keyof SynthConfig | 'volume' | 'pan' | null>(null);
  const [armedTarget, setArmedTarget] = useState<MidiLearnTarget | null>(null);
  const [isGlobalLearnMode, setIsGlobalLearnMode] = useState<boolean>(false);
  const [showCcMappingModal, setShowCcMappingModal] = useState<boolean>(false);
  const [ccMappings, setCcMappings] = useState<MidiCcMapping[]>(midiService.getCcMappings());
  const [isStepRecordActive, setIsStepRecordActive] = useState<boolean>(false);
  const [stepRecordCursor, setStepRecordCursor] = useState<number>(0);

  // Live Performance & Keyboard States
  const [octaveShift, setOctaveShift] = useState<number>(0); // -2..+2
  const [chordMode, setChordMode] = useState<ChordMode>('single');
  const [arpMode, setArpMode] = useState<ArpMode>('off');
  const [arpRate, setArpRate] = useState<ArpRate>('1/16');
  const [arpOctaves, setArpOctaves] = useState<number>(1);
  const [arpGate, setArpGate] = useState<number>(0.8);
  const [currentArpStep, setCurrentArpStep] = useState<number>(0);
  const [currentArpPitch, setCurrentArpPitch] = useState<string | null>(null);
  const [isHoldActive, setIsHoldActive] = useState<boolean>(false);
  const [activeHeldPitches, setActiveHeldPitches] = useState<Set<string>>(new Set());
  const [velocitySensitivity, setVelocitySensitivity] = useState<number>(100); // 0..127
  const [activeLayerTab, setActiveLayerTab] = useState<'layer2' | 'sub' | 'noise' | 'unison' | 'companion'>('layer2');

  // Active pressed keys for visual feedback
  const [activeVisualKeys, setActiveVisualKeys] = useState<Set<string>>(new Set());

  // Arp interval timer ref
  const arpIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mutable refs to prevent re-subscribing and infinite loops in useEffect
  const configRef = useRef(config);
  configRef.current = config;

  const trackRef = useRef(track);
  trackRef.current = track;

  const isStepRecordActiveRef = useRef(isStepRecordActive);
  isStepRecordActiveRef.current = isStepRecordActive;

  const stepRecordCursorRef = useRef(stepRecordCursor);
  stepRecordCursorRef.current = stepRecordCursor;

  const onUpdateSynthConfigRef = useRef(onUpdateSynthConfig);
  onUpdateSynthConfigRef.current = onUpdateSynthConfig;

  const onUpdateMidiNotesRef = useRef(onUpdateMidiNotes);
  onUpdateMidiNotesRef.current = onUpdateMidiNotes;

  const onShowNotificationRef = useRef(onShowNotification);
  onShowNotificationRef.current = onShowNotification;

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onShowNotificationRef.current) {
      onShowNotificationRef.current(msg, type);
    }
  };

  // Keep midiService updated with active track
  useEffect(() => {
    midiService.activeTrack = track;
    midiService.isStepRecordActive = isStepRecordActive;
  }, [track.id, isStepRecordActive]);

  // Initialize Web MIDI on mount
  useEffect(() => {
    let unsubscribeDevices: (() => void) | null = null;
    let unsubscribeEvents: (() => void) | null = null;
    let unsubscribeActivity: (() => void) | null = null;
    let unsubscribeParams: (() => void) | null = null;
    let unsubscribeSynthParams: (() => void) | null = null;
    let unsubscribeStepRecord: (() => void) | null = null;
    let unsubscribeMappings: (() => void) | null = null;
    let unsubscribeLearn: (() => void) | null = null;
    let unsubscribeLearned: (() => void) | null = null;

    const setupMidi = async () => {
      const res = await midiService.init();
      setMidiStatusMessage(res.message);
      setMidiDevices(res.devices);

      unsubscribeDevices = midiService.onDevicesChange((devs) => {
        setMidiDevices(devs);
      });

      unsubscribeEvents = midiService.onEventLog((evt) => {
        setLastMidiEvent(evt);
        if (evt.type === 'noteon' && evt.note) {
          setActiveVisualKeys(prev => new Set(prev).add(evt.note!));
        } else if (evt.type === 'noteoff' && evt.note) {
          setActiveVisualKeys(prev => {
            const next = new Set(prev);
            next.delete(evt.note!);
            return next;
          });
        }
      });

      unsubscribeActivity = midiService.onActivity((active) => {
        setIsMidiRxActive(active);
      });

      unsubscribeParams = midiService.onParamChange((param, val) => {
        if (param === 'volume' || param === 'pan') {
          // handled at track level
        } else {
          onUpdateSynthConfigRef.current({ ...configRef.current, [param]: val });
        }
      });

      unsubscribeSynthParams = midiService.onSynthParamChange((targetTrackId, paramKey, val) => {
        if (!targetTrackId || targetTrackId === 'active' || targetTrackId === trackRef.current.id) {
          onUpdateSynthConfigRef.current({ ...configRef.current, [paramKey]: val });
        }
      });

      unsubscribeMappings = midiService.onMappingsChange((maps) => {
        setCcMappings(maps);
      });

      unsubscribeLearn = midiService.onLearnStatusChange((status) => {
        setIsGlobalLearnMode(status.isLearning);
        setArmedTarget(status.armedTarget);
        setLearningParam((status.armedTarget?.paramKey as any) || null);
      });

      unsubscribeLearned = midiService.onMappingLearned(({ mapping, ccNumber }) => {
        notify(`Mapped CC #${ccNumber} ➔ ${mapping.label}`, 'success');
      });

      unsubscribeStepRecord = midiService.onStepRecord((noteData) => {
        if (!isStepRecordActiveRef.current || !onUpdateMidiNotesRef.current) return;
        
        const targetStep = stepRecordCursorRef.current;
        const currentNotes = trackRef.current.midiNotes || [];
        // Remove existing at same step & pitch
        const filtered = currentNotes.filter(n => !(n.step === targetStep && n.pitch === noteData.pitch));
        const newNote: MidiNote = {
          id: `${trackRef.current.id}-${noteData.pitch}-${targetStep}-${Date.now()}`,
          pitch: noteData.pitch,
          step: targetStep,
          duration: 2
        };
        onUpdateMidiNotesRef.current([...filtered, newNote]);
        setStepRecordCursor(prev => (prev + 2) % 32);
        notify(`Step-recorded ${noteData.pitch} at Step ${targetStep + 1}`, 'info');
      });
    };

    setupMidi();

    return () => {
      if (unsubscribeDevices) unsubscribeDevices();
      if (unsubscribeEvents) unsubscribeEvents();
      if (unsubscribeActivity) unsubscribeActivity();
      if (unsubscribeParams) unsubscribeParams();
      if (unsubscribeSynthParams) unsubscribeSynthParams();
      if (unsubscribeMappings) unsubscribeMappings();
      if (unsubscribeLearn) unsubscribeLearn();
      if (unsubscribeLearned) unsubscribeLearned();
      if (unsubscribeStepRecord) unsubscribeStepRecord();
      if (arpIntervalRef.current) clearInterval(arpIntervalRef.current);
      midiService.stopAllVoices();
    };
  }, []);

  // Re-scan for MIDI Devices
  const handleScanMidi = async () => {
    const res = await midiService.init();
    setMidiDevices(res.devices);
    setMidiStatusMessage(res.message);
    notify(res.message, res.success ? 'success' : 'error');
  };

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    midiService.setSelectedDevice(deviceId);
    const dev = midiDevices.find(d => d.id === deviceId);
    notify(`MIDI Input set to: ${dev ? dev.name : 'All MIDI Devices'}`, 'info');
  };

  const handleChannelSelect = (channel: number) => {
    setSelectedChannel(channel);
    midiService.setSelectedChannel(channel);
    notify(`MIDI Channel set to: ${channel === 0 ? 'Omni (All Channels)' : `Channel ${channel}`}`, 'info');
  };

  const handleParamChange = (key: keyof SynthConfig, value: any) => {
    const updated = { ...config, [key]: value };
    onUpdateSynthConfig(updated);
  };

  // Helper to find mapped CC number for any synth param
  const getMappedCcForParam = (paramKey: string): number | null => {
    const mapping = ccMappings.find(m => m.paramKey === paramKey && (m.targetType === 'synth' || !m.targetType));
    return mapping ? mapping.ccNumber : null;
  };

  // MIDI Learn Handler for any synth parameter
  const handleToggleMidiLearn = (paramKey: keyof SynthConfig | 'volume' | 'pan', customMin?: number, customMax?: number, isFloat?: boolean) => {
    if (armedTarget?.paramKey === paramKey) {
      midiService.cancelArmedTarget();
      notify("MIDI Learn cancelled for " + String(paramKey), "info");
    } else {
      const defaultRanges: Record<string, { label: string; min: number; max: number; isFloat?: boolean }> = {
        cutoff: { label: 'Synth Filter Cutoff', min: 200, max: 12000 },
        resonance: { label: 'Synth Filter Resonance (Q)', min: 0.1, max: 15.0, isFloat: true },
        attack: { label: 'Synth Attack Time', min: 0.01, max: 1.5, isFloat: true },
        decay: { label: 'Synth Decay Time', min: 0.05, max: 1.5, isFloat: true },
        sustain: { label: 'Synth Sustain Level', min: 0.0, max: 1.0, isFloat: true },
        release: { label: 'Synth Release Time', min: 0.05, max: 2.0, isFloat: true },
        delayTime: { label: 'Synth Delay Time', min: 0.05, max: 1.0, isFloat: true },
        delayFeedback: { label: 'Synth Delay Feedback', min: 0.0, max: 0.9, isFloat: true },
      };
      const def = defaultRanges[String(paramKey)] || { label: String(paramKey), min: customMin ?? 0, max: customMax ?? 127, isFloat };
      midiService.armTargetForLearn({
        targetType: 'synth',
        trackId: track.id,
        paramKey: String(paramKey),
        label: def.label,
        min: customMin ?? def.min,
        max: customMax ?? def.max,
        isFloat: isFloat ?? def.isFloat
      });
      notify(`Armed [${def.label}]: Twist any physical knob/fader on your MIDI controller to bind now...`, "info");
    }
  };

  // Quick Sound Layering Preset Loader
  const applyLayeringPreset = (presetKey: string) => {
    let updated: SynthConfig = { ...config };
    switch (presetKey) {
      case 'supersaw_wall':
        updated = {
          ...config,
          oscillator: 'sawtooth',
          cutoff: 6500,
          resonance: 2.5,
          layer2Enabled: true,
          layer2Oscillator: 'sawtooth',
          layer2Octave: 0,
          layer2Detune: 14,
          layer2Level: 0.85,
          layer2Pan: 0.35,
          subEnabled: true,
          subOscillator: 'sine',
          subOctave: -1,
          subLevel: 0.5,
          unisonVoices: 7,
          unisonDetune: 24,
          unisonSpread: 0.85,
          noiseLayerEnabled: false,
        };
        break;
      case 'sub_reinforced_bass':
        updated = {
          ...config,
          oscillator: 'sawtooth',
          cutoff: 950,
          resonance: 6.5,
          decay: 0.35,
          sustain: 0.4,
          layer2Enabled: true,
          layer2Oscillator: 'square',
          layer2Octave: 0,
          layer2Detune: 0,
          layer2Level: 0.6,
          layer2Pan: 0,
          subEnabled: true,
          subOscillator: 'sine',
          subOctave: -1,
          subLevel: 0.9,
          unisonVoices: 1,
          noiseLayerEnabled: false,
        };
        break;
      case 'lofi_grit':
        updated = {
          ...config,
          oscillator: 'triangle',
          cutoff: 1800,
          resonance: 2.0,
          attack: 0.08,
          release: 0.5,
          layer2Enabled: true,
          layer2Oscillator: 'sine',
          layer2Octave: 1,
          layer2Detune: -6,
          layer2Level: 0.5,
          subEnabled: false,
          noiseLayerEnabled: true,
          noiseType: 'pink',
          noiseLevel: 0.28,
          unisonVoices: 3,
          unisonDetune: 10,
          unisonSpread: 0.4,
        };
        break;
      case 'dual_octave_lead':
        updated = {
          ...config,
          oscillator: 'square',
          cutoff: 4200,
          resonance: 3.5,
          layer2Enabled: true,
          layer2Oscillator: 'sawtooth',
          layer2Octave: 1,
          layer2Detune: 8,
          layer2Level: 0.8,
          layer2Pan: 0.2,
          subEnabled: false,
          unisonVoices: 3,
          unisonDetune: 15,
          unisonSpread: 0.7,
          noiseLayerEnabled: false,
        };
        break;
      case 'cyberpunk_stack':
        updated = {
          ...config,
          oscillator: 'sawtooth',
          cutoff: 3200,
          resonance: 8.0,
          layer2Enabled: true,
          layer2Oscillator: 'square',
          layer2Octave: -1,
          layer2Detune: 14,
          layer2Level: 0.75,
          layer2Pan: -0.3,
          subEnabled: true,
          subOscillator: 'triangle',
          subOctave: -2,
          subLevel: 0.7,
          noiseLayerEnabled: true,
          noiseType: 'white',
          noiseLevel: 0.18,
          unisonVoices: 5,
          unisonDetune: 20,
          unisonSpread: 0.75,
        };
        break;
      case 'reset_single':
        updated = {
          ...config,
          layer2Enabled: false,
          subEnabled: false,
          noiseLayerEnabled: false,
          unisonVoices: 1,
          unisonDetune: 14,
          unisonSpread: 0.6,
        };
        break;
    }
    onUpdateSynthConfig(updated);
    notify(`Loaded Layering Preset: ${presetKey.replace(/_/g, ' ').toUpperCase()}`, "success");
  };

  // Calculate note pitches taking Octave shift and Chord modes into account
  const triggerNoteWithModifiers = (basePitch: string, velocity = 0.8) => {
    const baseNoteNum = pitchToMidiNumber(basePitch);
    const shiftedNoteNum = baseNoteNum + (octaveShift * 12);
    const intervals = CHORD_INTERVALS[chordMode].intervals;

    intervals.forEach((interval) => {
      const finalNoteNum = shiftedNoteNum + interval;
      const finalPitch = midiNumberToPitch(finalNoteNum);

      if (isHoldActive) {
        setActiveHeldPitches(prev => {
          const next = new Set(prev);
          if (next.has(finalPitch)) {
            next.delete(finalPitch);
          } else {
            next.add(finalPitch);
          }
          return next;
        });
      }

      audioEngine.playNoteLive(finalPitch, configRef.current, track.id);

      // Layering: Companion track simultaneous trigger
      if (track.layerTargetTrackId && tracks && tracks.length > 0) {
        const companion = tracks.find(t => t.id === track.layerTargetTrackId);
        if (companion && companion.synthConfig) {
          audioEngine.playNoteLive(finalPitch, companion.synthConfig, companion.id);
        }
      }
      
      setActiveVisualKeys(prev => new Set(prev).add(finalPitch));
      setTimeout(() => {
        setActiveVisualKeys(prev => {
          const next = new Set(prev);
          next.delete(finalPitch);
          return next;
        });
      }, 350);

      // If Step Record is active
      if (isStepRecordActive && onUpdateMidiNotes) {
        const targetStep = stepRecordCursor;
        const currentNotes = track.midiNotes || [];
        const filtered = currentNotes.filter(n => !(n.step === targetStep && n.pitch === finalPitch));
        const newNote: MidiNote = {
          id: `${track.id}-${finalPitch}-${targetStep}-${Date.now()}`,
          pitch: finalPitch,
          step: targetStep,
          duration: 2
        };
        onUpdateMidiNotes([...filtered, newNote]);
      }
    });

    if (isStepRecordActive) {
      setStepRecordCursor(prev => (prev + 2) % 32);
    }
  };

  // Arpeggiator Engine
  useEffect(() => {
    if (arpMode === 'off' || activeHeldPitches.size === 0) {
      if (arpIntervalRef.current) {
        clearInterval(arpIntervalRef.current);
        arpIntervalRef.current = null;
      }
      setCurrentArpPitch(null);
      return;
    }

    const ratesMs: Record<ArpRate, number> = {
      '1/4': (60000 / bpm),
      '1/8': (60000 / bpm) / 2,
      '1/16': (60000 / bpm) / 4,
      '1/32': (60000 / bpm) / 8,
    };

    const intervalMs = ratesMs[arpRate] || 125;
    const sortedHeld: string[] = (Array.from(activeHeldPitches) as string[]).sort((a: string, b: string) => pitchToMidiNumber(a) - pitchToMidiNumber(b));
    if (sortedHeld.length === 0) return;

    // Expand across octaves
    const expandedNotes: string[] = [];
    for (let oct = 0; oct < arpOctaves; oct++) {
      sortedHeld.forEach((pitch: string) => {
        const num = pitchToMidiNumber(pitch) + (oct * 12);
        expandedNotes.push(midiNumberToPitch(num));
      });
    }

    let arpIndex = 0;
    let arpDirection = 1;

    if (arpIntervalRef.current) clearInterval(arpIntervalRef.current);

    arpIntervalRef.current = setInterval(() => {
      if (expandedNotes.length === 0) return;

      let currentPitch = expandedNotes[0];

      if (arpMode === 'up') {
        currentPitch = expandedNotes[arpIndex % expandedNotes.length];
        arpIndex = (arpIndex + 1) % expandedNotes.length;
      } else if (arpMode === 'down') {
        currentPitch = expandedNotes[(expandedNotes.length - 1 - (arpIndex % expandedNotes.length))];
        arpIndex = (arpIndex + 1) % expandedNotes.length;
      } else if (arpMode === 'up_down') {
        currentPitch = expandedNotes[arpIndex];
        arpIndex += arpDirection;
        if (arpIndex >= expandedNotes.length - 1) {
          arpDirection = -1;
          arpIndex = expandedNotes.length - 1;
        } else if (arpIndex <= 0) {
          arpDirection = 1;
          arpIndex = 0;
        }
      } else if (arpMode === 'random') {
        currentPitch = expandedNotes[Math.floor(Math.random() * expandedNotes.length)];
      } else if (arpMode === 'chord_chop') {
        sortedHeld.forEach(p => {
          audioEngine.playNoteLive(p, configRef.current, trackRef.current.id);
          if (trackRef.current.layerTargetTrackId && tracks && tracks.length > 0) {
            const companion = tracks.find(t => t.id === trackRef.current.layerTargetTrackId);
            if (companion && companion.synthConfig) {
              audioEngine.playNoteLive(p, companion.synthConfig, companion.id);
            }
          }
        });
        setCurrentArpStep((prev) => (prev + 1) % 8);
        setCurrentArpPitch('CHORD');
        return;
      }

      audioEngine.playNoteLive(currentPitch, configRef.current, trackRef.current.id);
      
      // Layering: Companion track simultaneous trigger in arpeggiator
      if (trackRef.current.layerTargetTrackId && tracks && tracks.length > 0) {
        const companion = tracks.find(t => t.id === trackRef.current.layerTargetTrackId);
        if (companion && companion.synthConfig) {
          audioEngine.playNoteLive(currentPitch, companion.synthConfig, companion.id);
        }
      }

      setCurrentArpStep(arpIndex % 8);
      setCurrentArpPitch(currentPitch);
    }, intervalMs);

    return () => {
      if (arpIntervalRef.current) clearInterval(arpIntervalRef.current);
      setCurrentArpPitch(null);
    };
  }, [arpMode, arpRate, arpOctaves, activeHeldPitches, bpm, track.id, track.layerTargetTrackId, tracks]);

  // Standard MIDI (.mid) Export
  const handleExportMidiFile = () => {
    try {
      const blob = midiService.exportTrackToMidiBlob(track, bpm);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(track.name || 'synth').toLowerCase().replace(/\s+/g, '_')}_midi.mid`;
      a.click();
      URL.revokeObjectURL(url);
      notify(`Exported "${track.name}" as standard MIDI file (.mid)!`, "success");
    } catch (err: any) {
      console.error("MIDI Export failed:", err);
      notify(`MIDI export failed: ${err.message}`, "error");
    }
  };

  // Standard MIDI (.mid) Import
  const handleImportMidiFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await midiService.parseMidiFile(file);
      if (result.notes.length === 0) {
        notify("No notes found in imported MIDI file.", "error");
        return;
      }

      if (onUpdateMidiNotes) {
        onUpdateMidiNotes(result.notes);
      }
      notify(`Imported ${result.notes.length} MIDI notes from "${file.name}"!`, "success");
    } catch (err: any) {
      console.error("MIDI Import error:", err);
      notify(`Failed to parse MIDI file: ${err.message || 'Invalid format'}`, "error");
    }

    e.target.value = '';
  };

  // Base Keyboard mapping
  const keyboardKeys = [
    { pitch: 'C4', key: 'A', label: 'C4' },
    { pitch: 'C#4', key: 'W', label: 'C#4', isSharp: true },
    { pitch: 'D4', key: 'S', label: 'D4' },
    { pitch: 'D#4', key: 'E', label: 'D#4', isSharp: true },
    { pitch: 'E4', key: 'D', label: 'E4' },
    { pitch: 'F4', key: 'F', label: 'F4' },
    { pitch: 'F#4', key: 'T', label: 'F#4', isSharp: true },
    { pitch: 'G4', key: 'G', label: 'G4' },
    { pitch: 'G#4', key: 'Y', label: 'G#4', isSharp: true },
    { pitch: 'A4', key: 'H', label: 'A4' },
    { pitch: 'A#4', key: 'U', label: 'A#4', isSharp: true },
    { pitch: 'B4', key: 'J', label: 'B4' },
    { pitch: 'C5', key: 'K', label: 'C5' },
  ];

  // Global Keydown listener for QWERTY keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        e.repeat
      ) {
        return;
      }

      const target = keyboardKeys.find(k => k.key.toLowerCase() === e.key.toLowerCase());
      if (target) {
        e.preventDefault();
        triggerNoteWithModifiers(target.pitch);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [track.id, octaveShift, chordMode, isHoldActive, isStepRecordActive, stepRecordCursor]);

  return (
    <div className="bg-[#121217] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-6 text-white font-mono select-none">
      
      {/* 1. Header Banner & Web MIDI Hardware Controller Status Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#00F0FF] uppercase tracking-wider flex items-center gap-2 font-dotgothic text-base">
              <Cpu className="w-4.5 h-4.5 text-[#00F0FF]" />
              DEMONSEED HARDWARE MIDI &amp; SYNTH MATRIX
            </h3>
            <span className="text-[9px] font-bold text-[#FF3E82] px-2 py-0.5 bg-black/60 border border-[#FF3E82]/30 rounded">
              WEB_MIDI V3.0
            </span>
          </div>
          <p className="text-[11px] text-white/60 font-mono mt-0.5">
            Connect USB/Bluetooth MIDI keyboards &amp; controllers, bind CC knobs with MIDI Learn, or import/export standard <span className="text-[#00F0FF]">.mid</span> files!
          </p>
        </div>

        {/* Hardware MIDI Status, Device Select, and Channel Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* MIDI Activity RX LED */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 border border-white/15 rounded text-[10px]">
            <div className={`w-2 h-2 rounded-full transition-all duration-75 ${
              isMidiRxActive 
                ? 'bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]' 
                : 'bg-zinc-700'
            }`} />
            <span className="text-[9px] text-white/70 font-bold">RX IN</span>
          </div>

          {/* MIDI Input Device Selector */}
          <div className="flex items-center gap-1 bg-black/80 border border-white/15 rounded px-2 py-1 text-[10px]">
            <Radio className="w-3.5 h-3.5 text-[#00F0FF]" />
            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceSelect(e.target.value)}
              className="bg-transparent text-white font-mono text-[10px] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-900 text-white">All MIDI Devices ({midiDevices.length})</option>
              {midiDevices.map(dev => (
                <option key={dev.id} value={dev.id} className="bg-zinc-900 text-white">
                  🎹 {dev.name}
                </option>
              ))}
            </select>
          </div>

          {/* MIDI Channel Filter */}
          <div className="flex items-center gap-1 bg-black/80 border border-white/15 rounded px-2 py-1 text-[10px]">
            <span className="text-[9px] text-white/50 font-bold">CH:</span>
            <select
              value={selectedChannel}
              onChange={(e) => handleChannelSelect(parseInt(e.target.value))}
              className="bg-transparent text-white font-mono text-[10px] focus:outline-none cursor-pointer"
            >
              <option value={0} className="bg-zinc-900 text-white">Omni (All)</option>
              {Array.from({ length: 16 }, (_, i) => i + 1).map(ch => (
                <option key={ch} value={ch} className="bg-zinc-900 text-white">Ch {ch}</option>
              ))}
            </select>
          </div>

          {/* Scan/Refresh MIDI */}
          <button
            onClick={handleScanMidi}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/15 rounded text-[10px] text-white transition-all cursor-pointer"
            title="Scan for connected USB/Bluetooth MIDI controllers"
          >
            <RefreshCw className="w-3 h-3 text-[#00F0FF]" />
            <span>Scan MIDI</span>
          </button>
        </div>
      </div>

      {/* 2. Live MIDI Telemetry Bar & Step Record / MIDI File Import-Export Actions */}
      <div className="bg-black/60 border border-white/10 rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[11px]">
        {/* Left: Last received event & Armed indicator */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-white/40 uppercase">LIVE MIDI:</span>
            {lastMidiEvent ? (
              <span className="font-mono text-xs font-bold text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/30">
                {lastMidiEvent.type === 'noteon' && `Note On: ${lastMidiEvent.note} (Vel: ${lastMidiEvent.velocity}, Ch: ${lastMidiEvent.channel})`}
                {lastMidiEvent.type === 'noteoff' && `Note Off: ${lastMidiEvent.note} (Ch: ${lastMidiEvent.channel})`}
                {lastMidiEvent.type === 'cc' && `CC #${lastMidiEvent.ccNumber} -> Val: ${lastMidiEvent.ccValue}`}
                {lastMidiEvent.type === 'pitchbend' && `Pitch Bend: ${(lastMidiEvent.pitchBend! * 100).toFixed(0)}%`}
              </span>
            ) : (
              <span className="text-[10px] text-white/40 italic">
                {midiDevices.length > 0 ? `Ready. Playing on ${midiDevices[0]?.name}` : 'Awaiting MIDI input (or press QWERTY keys)...'}
              </span>
            )}
          </div>

          {/* Armed Parameter Banner */}
          {armedTarget && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#FF3E82]/20 border border-[#FF3E82] text-[#FF3E82] text-[10px] rounded animate-pulse">
              <Target className="w-3 h-3 text-[#FF3E82]" />
              <span>ARMED: Twist CC knob/fader for <strong>{armedTarget.label}</strong></span>
              <button 
                onClick={() => midiService.cancelArmedTarget()}
                className="ml-1 text-[9px] underline hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Right: MIDI Learn Toggle, CC Mappings Modal, Step Recording & MIDI File Import / Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Global MIDI Learn Mode Button */}
          <button
            onClick={() => {
              const next = !isGlobalLearnMode;
              midiService.setMidiLearnMode(next);
              if (next) {
                notify("MIDI Learn Mode active: Click any synth slider, then twist a hardware knob to bind!", "info");
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
              isGlobalLearnMode
                ? 'bg-[#FF3E82] text-white border-[#FF3E82] shadow-[0_0_12px_rgba(255,62,130,0.6)] animate-pulse'
                : 'bg-white/5 text-[#00F0FF] border-[#00F0FF]/30 hover:bg-[#00F0FF]/15'
            }`}
            title="Toggle MIDI Learn Mode across all UI controls"
          >
            <Target className="w-3.5 h-3.5" />
            <span>{isGlobalLearnMode ? 'LEARN ACTIVE (CLICK PARAM)' : 'MIDI LEARN'}</span>
          </button>

          {/* CC Mappings Modal Trigger */}
          <button
            onClick={() => setShowCcMappingModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/15 rounded text-[10px] text-white transition-all cursor-pointer font-mono"
            title="Open MIDI Controller Mapping Manager"
          >
            <Settings2 className="w-3 h-3 text-amber-400" />
            <span>CC MAPS ({ccMappings.length})</span>
          </button>

          {/* Step Record from MIDI Toggle */}
          <button
            onClick={() => setIsStepRecordActive(prev => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
              isStepRecordActive 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse' 
                : 'bg-white/5 text-white/70 border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title="Step-record incoming MIDI notes into Piano Roll sequence"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>STEP REC {isStepRecordActive ? `[STEP ${stepRecordCursor + 1}]` : ''}</span>
          </button>

          {/* Export Standard MIDI File */}
          <button
            onClick={handleExportMidiFile}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/15 rounded text-[10px] text-white transition-all cursor-pointer"
            title="Export this Synth track's melody as a .mid standard MIDI file"
          >
            <Download className="w-3 h-3 text-[#00F0FF]" />
            <span>Export .MID</span>
          </button>

          {/* Import Standard MIDI File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/15 rounded text-[10px] text-white transition-all cursor-pointer"
            title="Import a .mid file into this synth track"
          >
            <Upload className="w-3 h-3 text-[#FF3E82]" />
            <span>Import .MID</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mid,.midi"
            onChange={handleImportMidiFile}
            className="hidden"
          />

          {/* Panic / Kill All Notes */}
          <button
            onClick={() => {
              midiService.stopAllVoices();
              notify("All synth voices released.", "info");
            }}
            className="px-2 py-1 bg-black border border-white/15 hover:border-rose-500/60 text-[9px] text-white/60 hover:text-rose-400 rounded transition-all cursor-pointer"
            title="Panic: Stop all sounding synth notes immediately"
          >
            PANIC (KILL)
          </button>
        </div>
      </div>

      {/* 3. Main Synth Parameters Grid with MIDI Learn Knobs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Module 1: Oscillator & ADSR Amp Envelope */}
        <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex flex-col gap-3.5 relative">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-400" />
              Oscillator &amp; ADSR Amp
            </span>
            <span className="text-[9px] text-amber-400/80 font-mono">ANALOG_VOICE</span>
          </div>

          {/* Waveform Selector */}
          <div>
            <label className="text-[9px] text-white/50 font-bold block mb-1 uppercase">Oscillator Waveform</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['sine', 'square', 'triangle', 'sawtooth'] as const).map((osc) => (
                <button
                  key={osc}
                  onClick={() => handleParamChange('oscillator', osc)}
                  className={`py-1.5 rounded text-[11px] font-mono capitalize border transition-all cursor-pointer font-bold ${
                    config.oscillator === osc
                      ? 'bg-[#00F0FF] text-black border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                      : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {osc.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Attack Slider + MIDI Learn */}
          <div>
            <div className="flex justify-between items-center text-[10px] text-white/60 font-bold mb-1 uppercase">
              <span className="flex items-center gap-1.5">
                <span>Attack Time</span>
                <button 
                  onClick={() => handleToggleMidiLearn('attack', 0.01, 1.5, true)}
                  className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                    armedTarget?.paramKey === 'attack'
                      ? 'bg-[#FF3E82] text-white border-[#FF3E82] shadow-[0_0_8px_#FF3E82] animate-pulse'
                      : getMappedCcForParam('attack') !== null
                        ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40'
                        : 'bg-white/5 text-white/40 hover:text-[#00F0FF] border-white/10'
                  }`}
                  title="Click to map hardware MIDI CC to Attack Time"
                >
                  {armedTarget?.paramKey === 'attack' ? 'WAITING CC...' : getMappedCcForParam('attack') !== null ? `CC ${getMappedCcForParam('attack')}` : 'LEARN'}
                </button>
              </span>
              <span className="font-mono text-[#00F0FF]">{config.attack.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.00"
              max="1.50"
              step="0.05"
              value={config.attack}
              onClick={() => isGlobalLearnMode && handleToggleMidiLearn('attack', 0.01, 1.5, true)}
              onChange={(e) => handleParamChange('attack', parseFloat(e.target.value))}
              className={`w-full accent-[#00F0FF] h-1.5 bg-zinc-800 rounded-lg cursor-pointer ${
                armedTarget?.paramKey === 'attack' ? 'ring-2 ring-[#FF3E82]' : ''
              }`}
            />
          </div>

          {/* Decay Slider + MIDI Learn */}
          <div>
            <div className="flex justify-between items-center text-[10px] text-white/60 font-bold mb-1 uppercase">
              <span className="flex items-center gap-1.5">
                <span>Decay Time</span>
                <button 
                  onClick={() => handleToggleMidiLearn('decay', 0.05, 1.5, true)}
                  className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                    armedTarget?.paramKey === 'decay'
                      ? 'bg-[#FF3E82] text-white border-[#FF3E82] shadow-[0_0_8px_#FF3E82] animate-pulse'
                      : getMappedCcForParam('decay') !== null
                        ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40'
                        : 'bg-white/5 text-white/40 hover:text-[#00F0FF] border-white/10'
                  }`}
                  title="Click to map hardware MIDI CC to Decay Time"
                >
                  {armedTarget?.paramKey === 'decay' ? 'WAITING CC...' : getMappedCcForParam('decay') !== null ? `CC ${getMappedCcForParam('decay')}` : 'LEARN'}
                </button>
              </span>
              <span className="font-mono text-[#00F0FF]">{config.decay.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.50"
              step="0.05"
              value={config.decay}
              onClick={() => isGlobalLearnMode && handleToggleMidiLearn('decay', 0.05, 1.5, true)}
              onChange={(e) => handleParamChange('decay', parseFloat(e.target.value))}
              className={`w-full accent-[#00F0FF] h-1.5 bg-zinc-800 rounded-lg cursor-pointer ${
                armedTarget?.paramKey === 'decay' ? 'ring-2 ring-[#FF3E82]' : ''
              }`}
            />
          </div>

          {/* Sustain Slider + MIDI Learn */}
          <div>
            <div className="flex justify-between items-center text-[10px] text-white/60 font-bold mb-1 uppercase">
              <span className="flex items-center gap-1.5">
                <span>Sustain Level</span>
                <button 
                  onClick={() => handleToggleMidiLearn('sustain', 0.0, 1.0, true)}
                  className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                    armedTarget?.paramKey === 'sustain'
                      ? 'bg-[#FF3E82] text-white border-[#FF3E82] shadow-[0_0_8px_#FF3E82] animate-pulse'
                      : getMappedCcForParam('sustain') !== null
                        ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40'
                        : 'bg-white/5 text-white/40 hover:text-[#00F0FF] border-white/10'
                  }`}
                  title="Click to map hardware MIDI CC to Sustain Level"
                >
                  {armedTarget?.paramKey === 'sustain' ? 'WAITING CC...' : getMappedCcForParam('sustain') !== null ? `CC ${getMappedCcForParam('sustain')}` : 'LEARN'}
                </button>
              </span>
              <span className="font-mono text-[#00F0FF]">{(config.sustain * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.00"
              max="1.00"
              step="0.05"
              value={config.sustain}
              onClick={() => isGlobalLearnMode && handleToggleMidiLearn('sustain', 0.0, 1.0, true)}
              onChange={(e) => handleParamChange('sustain', parseFloat(e.target.value))}
              className={`w-full accent-[#00F0FF] h-1.5 bg-zinc-800 rounded-lg cursor-pointer ${
                armedTarget?.paramKey === 'sustain' ? 'ring-2 ring-[#FF3E82]' : ''
              }`}
            />
          </div>

          {/* Release Slider + MIDI Learn */}
          <div>
            <div className="flex justify-between items-center text-[10px] text-white/60 font-bold mb-1 uppercase">
              <span className="flex items-center gap-1.5">
                <span>Release Time</span>
                <button 
                  onClick={() => handleToggleMidiLearn('release', 0.05, 2.0, true)}
                  className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                    armedTarget?.paramKey === 'release'
                      ? 'bg-[#FF3E82] text-white border-[#FF3E82] shadow-[0_0_8px_#FF3E82] animate-pulse'
                      : getMappedCcForParam('release') !== null
                        ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40'
                        : 'bg-white/5 text-white/40 hover:text-[#00F0FF] border-white/10'
                  }`}
                  title="Click to map hardware MIDI CC to Release Time"
                >
                  {armedTarget?.paramKey === 'release' ? 'WAITING CC...' : getMappedCcForParam('release') !== null ? `CC ${getMappedCcForParam('release')}` : 'LEARN'}
                </button>
              </span>
              <span className="font-mono text-[#00F0FF]">{config.release.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="2.00"
              step="0.05"
              value={config.release}
              onClick={() => isGlobalLearnMode && handleToggleMidiLearn('release', 0.05, 2.0, true)}
              onChange={(e) => handleParamChange('release', parseFloat(e.target.value))}
              className={`w-full accent-[#00F0FF] h-1.5 bg-zinc-800 rounded-lg cursor-pointer ${
                armedTarget?.paramKey === 'release' ? 'ring-2 ring-[#FF3E82]' : ''
              }`}
            />
          </div>
        </div>

        {/* Module 2: Resonant Lowpass Filter */}
        <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex flex-col gap-4 relative">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-[#00F0FF]" />
              Resonant Lowpass VCF
            </span>
            <span className="text-[9px] text-[#00F0FF]/80 font-mono">
              {getMappedCcForParam('cutoff') ? `CC #${getMappedCcForParam('cutoff')}` : 'CC #74'} / {getMappedCcForParam('resonance') ? `CC #${getMappedCcForParam('resonance')}` : 'CC #71'}
            </span>
          </div>

          {/* Cutoff Frequency */}
          <div>
            <div className="flex justify-between items-center text-[10px] text-white/60 font-bold mb-1 uppercase">
              <span className="flex items-center gap-1.5">
                <span>Cutoff Frequency</span>
                <button 
                  onClick={() => handleToggleMidiLearn('cutoff', 200, 12000, false)}
                  className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                    armedTarget?.paramKey === 'cutoff'
                      ? 'bg-[#FF3E82] text-white border-[#FF3E82] shadow-[0_0_8px_#FF3E82] animate-pulse'
                      : getMappedCcForParam('cutoff') !== null
                        ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40'
                        : 'bg-white/5 text-white/40 hover:text-[#00F0FF] border-white/10'
                  }`}
                  title="Click to map hardware MIDI CC to Filter Cutoff (Default CC 74)"
                >
                  {armedTarget?.paramKey === 'cutoff' ? 'WAITING CC...' : getMappedCcForParam('cutoff') !== null ? `CC ${getMappedCcForParam('cutoff')}` : 'LEARN CC 74'}
                </button>
              </span>
              <span className="font-mono text-[#00F0FF]">{config.cutoff} Hz</span>
            </div>
            <input
              type="range"
              min="200"
              max="12000"
              step="100"
              value={config.cutoff}
              onClick={() => isGlobalLearnMode && handleToggleMidiLearn('cutoff', 200, 12000, false)}
              onChange={(e) => handleParamChange('cutoff', parseInt(e.target.value))}
              className={`w-full accent-[#00F0FF] h-1.5 bg-zinc-800 rounded-lg cursor-pointer ${
                armedTarget?.paramKey === 'cutoff' ? 'ring-2 ring-[#FF3E82]' : ''
              }`}
            />
            <div className="flex justify-between text-[8px] text-white/30 mt-1 font-mono">
              <span>200Hz Sub</span>
              <span>1kHz Mid</span>
              <span>5kHz Bright</span>
              <span>12kHz Open</span>
            </div>
          </div>

          {/* Resonance Q Factor */}
          <div>
            <div className="flex justify-between items-center text-[10px] text-white/60 font-bold mb-1 uppercase">
              <span className="flex items-center gap-1.5">
                <span>Resonance (Q)</span>
                <button 
                  onClick={() => handleToggleMidiLearn('resonance', 0.1, 15.0, true)}
                  className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                    armedTarget?.paramKey === 'resonance'
                      ? 'bg-[#FF3E82] text-white border-[#FF3E82] shadow-[0_0_8px_#FF3E82] animate-pulse'
                      : getMappedCcForParam('resonance') !== null
                        ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40'
                        : 'bg-white/5 text-white/40 hover:text-[#00F0FF] border-white/10'
                  }`}
                  title="Click to map hardware MIDI CC to Filter Resonance (Default CC 71)"
                >
                  {armedTarget?.paramKey === 'resonance' ? 'WAITING CC...' : getMappedCcForParam('resonance') !== null ? `CC ${getMappedCcForParam('resonance')}` : 'LEARN CC 71'}
                </button>
              </span>
              <span className="font-mono text-[#00F0FF]">{config.resonance.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="15.0"
              step="0.2"
              value={config.resonance}
              onClick={() => isGlobalLearnMode && handleToggleMidiLearn('resonance', 0.1, 15.0, true)}
              onChange={(e) => handleParamChange('resonance', parseFloat(e.target.value))}
              className={`w-full accent-[#00F0FF] h-1.5 bg-zinc-800 rounded-lg cursor-pointer ${
                armedTarget?.paramKey === 'resonance' ? 'ring-2 ring-[#FF3E82]' : ''
              }`}
            />
          </div>

          {/* Quick CC Filter Macro Tooltip */}
          <div className="mt-auto border border-white/10 p-2.5 rounded-lg bg-black/40 text-[10px] text-white/60 flex items-start gap-2 leading-relaxed">
            <SlidersHorizontal className="w-4 h-4 text-[#00F0FF] flex-shrink-0 mt-0.5" />
            <span>
              Hardware Mod Wheel (<span className="text-[#00F0FF]">CC 1</span>) and Brightness (<span className="text-[#00F0FF]">CC 74</span>) automate filter sweeps live during performance.
            </span>
          </div>
        </div>

        {/* Module 3: Tempo-Synced Stereo Delay & FX */}
        <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex flex-col gap-4 relative">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Volume2 className="w-4 h-4 text-[#FF3E82]" />
              Stereo Space Delay
            </span>
            <span className="text-[9px] text-[#FF3E82]/80 font-mono">ECHO_FX</span>
          </div>

          {/* Delay Time */}
          <div>
            <div className="flex justify-between items-center text-[10px] text-white/60 font-bold mb-1 uppercase">
              <span className="flex items-center gap-1.5">
                <span>Delay Time</span>
                <button 
                  onClick={() => handleToggleMidiLearn('delayTime', 0.05, 1.5, true)}
                  className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                    armedTarget?.paramKey === 'delayTime'
                      ? 'bg-[#FF3E82] text-white border-[#FF3E82] shadow-[0_0_8px_#FF3E82] animate-pulse'
                      : getMappedCcForParam('delayTime') !== null
                        ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40'
                        : 'bg-white/5 text-white/40 hover:text-[#00F0FF] border-white/10'
                  }`}
                  title="Click to map hardware MIDI CC to Delay Time"
                >
                  {armedTarget?.paramKey === 'delayTime' ? 'WAITING CC...' : getMappedCcForParam('delayTime') !== null ? `CC ${getMappedCcForParam('delayTime')}` : 'LEARN'}
                </button>
              </span>
              <span className="font-mono text-[#00F0FF]">{config.delayTime.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.50"
              step="0.05"
              value={config.delayTime}
              onClick={() => isGlobalLearnMode && handleToggleMidiLearn('delayTime', 0.05, 1.5, true)}
              onChange={(e) => handleParamChange('delayTime', parseFloat(e.target.value))}
              className={`w-full accent-[#00F0FF] h-1.5 bg-zinc-800 rounded-lg cursor-pointer ${
                armedTarget?.paramKey === 'delayTime' ? 'ring-2 ring-[#FF3E82]' : ''
              }`}
            />
            <div className="flex justify-between text-[8px] text-white/30 mt-1 font-mono">
              <span>Slap (50ms)</span>
              <span>1/8 Note</span>
              <span>1/4 Note</span>
              <span>Ambient</span>
            </div>
          </div>

          {/* Feedback Gain */}
          <div>
            <div className="flex justify-between items-center text-[10px] text-white/60 font-bold mb-1 uppercase">
              <span className="flex items-center gap-1.5">
                <span>Feedback Echo</span>
                <button 
                  onClick={() => handleToggleMidiLearn('delayFeedback', 0.0, 0.9, true)}
                  className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                    armedTarget?.paramKey === 'delayFeedback'
                      ? 'bg-[#FF3E82] text-white border-[#FF3E82] shadow-[0_0_8px_#FF3E82] animate-pulse'
                      : getMappedCcForParam('delayFeedback') !== null
                        ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40'
                        : 'bg-white/5 text-white/40 hover:text-[#00F0FF] border-white/10'
                  }`}
                  title="Click to map hardware MIDI CC to Delay Feedback"
                >
                  {armedTarget?.paramKey === 'delayFeedback' ? 'WAITING CC...' : getMappedCcForParam('delayFeedback') !== null ? `CC ${getMappedCcForParam('delayFeedback')}` : 'LEARN'}
                </button>
              </span>
              <span className="font-mono text-[#00F0FF]">{(config.delayFeedback * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.00"
              max="0.90"
              step="0.05"
              value={config.delayFeedback}
              onClick={() => isGlobalLearnMode && handleToggleMidiLearn('delayFeedback', 0.0, 0.9, true)}
              onChange={(e) => handleParamChange('delayFeedback', parseFloat(e.target.value))}
              className={`w-full accent-[#00F0FF] h-1.5 bg-zinc-800 rounded-lg cursor-pointer ${
                armedTarget?.paramKey === 'delayFeedback' ? 'ring-2 ring-[#FF3E82]' : ''
              }`}
            />
          </div>

          <div className="warning-box rounded-lg mt-auto flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <strong>Critical Warning:</strong> Infinite feedback loops may occur when delay feedback exceeds 75%. High amplitude signals detected.
            </div>
          </div>
        </div>

      </div>

      {/* 4. SOUND LAYERING & VOICE STACKING RACK */}
      <div className="bg-black/60 border border-border-custom rounded-xl p-4 flex flex-col gap-4">
        {/* Layering Header & Active Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="brand-syne text-sm font-extrabold text-ink uppercase tracking-wider">
                  Sound Layering &amp; Voice Stacking Rack
                </h3>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
                  MULTI-VOICE
                </span>
              </div>
              <p className="text-[10px] text-ink-dim mt-0.5">
                Stack companion oscillators, sub-bass harmonics, noise textures, multi-voice supersaw unison, and companion tracks.
              </p>
            </div>
          </div>

          {/* Active Layer Status Indicators */}
          <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono font-bold">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/80">
              OSC 1: <strong className="text-[#00F0FF]">{config.oscillator.toUpperCase().slice(0, 3)}</strong>
            </span>
            <span className={`px-2 py-0.5 rounded border transition-all ${
              config.layer2Enabled 
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                : 'bg-white/5 border-white/10 text-white/30'
            }`}>
              OSC 2: {config.layer2Enabled ? `${config.layer2Oscillator?.toUpperCase().slice(0, 3)} (${config.layer2Detune! > 0 ? '+' : ''}${config.layer2Detune}c)` : 'OFF'}
            </span>
            <span className={`px-2 py-0.5 rounded border transition-all ${
              config.subEnabled 
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' 
                : 'bg-white/5 border-white/10 text-white/30'
            }`}>
              SUB: {config.subEnabled ? `${config.subOctave} OCT` : 'OFF'}
            </span>
            <span className={`px-2 py-0.5 rounded border transition-all ${
              config.noiseLayerEnabled 
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-400' 
                : 'bg-white/5 border-white/10 text-white/30'
            }`}>
              NOISE: {config.noiseLayerEnabled ? config.noiseType?.toUpperCase() : 'OFF'}
            </span>
            <span className={`px-2 py-0.5 rounded border transition-all ${
              config.unisonVoices && config.unisonVoices > 1 
                ? 'bg-accent/20 border-accent/40 text-accent font-extrabold' 
                : 'bg-white/5 border-white/10 text-white/30'
            }`}>
              UNISON: {config.unisonVoices && config.unisonVoices > 1 ? `${config.unisonVoices}V` : '1V'}
            </span>
            {track.layerTargetTrackId && (
              <span className="px-2 py-0.5 rounded bg-secondary/15 border border-secondary/40 text-secondary">
                LINK: {tracks.find(t => t.id === track.layerTargetTrackId)?.name || 'TRACK'}
              </span>
            )}
          </div>
        </div>

        {/* Quick Layering Presets Bar */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-black/40 border border-white/5 rounded-lg">
          <span className="text-[9px] font-bold text-accent font-mono uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> PRESETS:
          </span>
          <button
            onClick={() => applyLayeringPreset('supersaw_wall')}
            className="px-2 py-1 bg-white/5 hover:bg-accent/20 border border-white/10 hover:border-accent text-[9.5px] font-mono font-bold text-white rounded transition-all cursor-pointer"
          >
            Supersaw Wall (7v)
          </button>
          <button
            onClick={() => applyLayeringPreset('sub_reinforced_bass')}
            className="px-2 py-1 bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400 text-[9.5px] font-mono font-bold text-white rounded transition-all cursor-pointer"
          >
            Sub 808 Bass
          </button>
          <button
            onClick={() => applyLayeringPreset('lofi_grit')}
            className="px-2 py-1 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400 text-[9.5px] font-mono font-bold text-white rounded transition-all cursor-pointer"
          >
            Lo-Fi Grit
          </button>
          <button
            onClick={() => applyLayeringPreset('dual_octave_lead')}
            className="px-2 py-1 bg-white/5 hover:bg-secondary/20 border border-white/10 hover:border-secondary text-[9.5px] font-mono font-bold text-white rounded transition-all cursor-pointer"
          >
            Dual Octave Lead
          </button>
          <button
            onClick={() => applyLayeringPreset('cyberpunk_stack')}
            className="px-2 py-1 bg-white/5 hover:bg-accent/20 border border-white/10 hover:border-accent text-[9.5px] font-mono font-bold text-white rounded transition-all cursor-pointer"
          >
            Cyberpunk Stack
          </button>
          <button
            onClick={() => applyLayeringPreset('reset_single')}
            className="px-2 py-1 bg-white/5 hover:bg-white/15 border border-white/10 text-[9.5px] font-mono font-bold text-white/50 hover:text-white rounded transition-all cursor-pointer ml-auto"
          >
            [Reset to Core Voice]
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 border-b border-white/10 pb-2">
          {[
            { id: 'layer2', label: 'Layer 2 (Companion Osc)', active: config.layer2Enabled },
            { id: 'sub', label: 'Sub-Bass Underlay', active: config.subEnabled },
            { id: 'noise', label: 'Noise & Transient', active: config.noiseLayerEnabled },
            { id: 'unison', label: 'Unison Multi-Voice', active: (config.unisonVoices || 1) > 1 },
            { id: 'companion', label: 'Companion Track Link', active: !!track.layerTargetTrackId },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveLayerTab(tab.id as any)}
              className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                activeLayerTab === tab.id
                  ? 'bg-accent text-white border-accent shadow-[0_0_10px_rgba(255,0,85,0.3)]'
                  : 'bg-white/5 text-ink-dim border-transparent hover:text-ink hover:bg-white/10'
              }`}
            >
              <span>{tab.label}</span>
              {tab.active && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Tab 1: Layer 2 Oscillator */}
        {activeLayerTab === 'layer2' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-black/40 border border-white/5 rounded-lg animate-in fade-in">
            {/* Enable Toggle & Waveform */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white uppercase">Oscillator 2 State</span>
                <button
                  onClick={() => handleParamChange('layer2Enabled', !config.layer2Enabled)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border transition-all cursor-pointer ${
                    config.layer2Enabled
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}
                >
                  {config.layer2Enabled ? 'ENABLED' : 'BYPASS'}
                </button>
              </div>

              <div>
                <label className="text-[9px] text-white/50 font-bold block mb-1 uppercase">Osc 2 Waveform</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['sawtooth', 'square', 'triangle', 'sine'] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => handleParamChange('layer2Oscillator', w)}
                      disabled={!config.layer2Enabled}
                      className={`py-1 rounded text-[10px] font-mono capitalize border transition-all cursor-pointer font-bold ${
                        config.layer2Oscillator === w
                          ? 'bg-[#00F0FF] text-black border-[#00F0FF]'
                          : 'bg-white/5 text-white/50 border-white/10 hover:text-white disabled:opacity-30'
                      }`}
                    >
                      {w.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Octave Shift */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/60 uppercase block">Octave Offset</label>
              <div className="grid grid-cols-5 gap-1">
                {([-2, -1, 0, 1, 2] as const).map((oct) => (
                  <button
                    key={oct}
                    onClick={() => handleParamChange('layer2Octave', oct)}
                    disabled={!config.layer2Enabled}
                    className={`py-1.5 rounded text-[10px] font-mono border transition-all cursor-pointer font-bold ${
                      config.layer2Octave === oct
                        ? 'bg-accent text-white border-accent'
                        : 'bg-white/5 text-white/50 border-white/10 hover:text-white disabled:opacity-30'
                    }`}
                  >
                    {oct > 0 ? `+${oct}` : oct}
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-ink-dim block">Interval shift relative to primary osc.</span>
            </div>

            {/* Fine Detune (-50 .. +50 cents) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Fine Detune</span>
                <span className="text-[#00F0FF] font-mono font-bold">
                  {config.layer2Detune! > 0 ? `+${config.layer2Detune}` : config.layer2Detune} cents
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={config.layer2Detune ?? 7}
                disabled={!config.layer2Enabled}
                onChange={(e) => handleParamChange('layer2Detune', parseInt(e.target.value))}
                className="w-full accent-secondary h-1.5 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-30"
              />
              <div className="flex justify-between text-[8px] text-white/30 font-mono">
                <span>-50c</span>
                <span>0c (In-Tune)</span>
                <span>+50c</span>
              </div>
            </div>

            {/* Mix Level & Stereo Pan */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-white/60 uppercase">Mix Ratio</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {Math.round((config.layer2Level ?? 0.75) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.layer2Level ?? 0.75}
                  disabled={!config.layer2Enabled}
                  onChange={(e) => handleParamChange('layer2Level', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-30"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-white/60 uppercase">Stereo Pan</span>
                  <span className="text-white/80 font-mono font-bold">
                    {(config.layer2Pan ?? 0) === 0 ? 'C' : (config.layer2Pan! < 0 ? `L ${Math.abs(Math.round(config.layer2Pan! * 100))}%` : `R ${Math.round(config.layer2Pan! * 100)}%`)}
                  </span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={config.layer2Pan ?? 0}
                  disabled={!config.layer2Enabled}
                  onChange={(e) => handleParamChange('layer2Pan', parseFloat(e.target.value))}
                  className="w-full accent-purple-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-30"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sub-Bass Underlay */}
        {activeLayerTab === 'sub' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-black/40 border border-white/5 rounded-lg animate-in fade-in">
            {/* Enable Toggle & Waveform */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white uppercase">Sub-Bass Generator</span>
                <button
                  onClick={() => handleParamChange('subEnabled', !config.subEnabled)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border transition-all cursor-pointer ${
                    config.subEnabled
                      ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}
                >
                  {config.subEnabled ? 'ENABLED' : 'BYPASS'}
                </button>
              </div>

              <div>
                <label className="text-[9px] text-white/50 font-bold block mb-1 uppercase">Sub Waveform</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['sine', 'triangle', 'square'] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => handleParamChange('subOscillator', w)}
                      disabled={!config.subEnabled}
                      className={`py-1 rounded text-[10px] font-mono capitalize border transition-all cursor-pointer font-bold ${
                        config.subOscillator === w
                          ? 'bg-amber-400 text-black border-amber-400'
                          : 'bg-white/5 text-white/50 border-white/10 hover:text-white disabled:opacity-30'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub Octave Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/60 uppercase block">Sub Octave Depth</label>
              <div className="grid grid-cols-2 gap-2">
                {([-1, -2] as const).map((oct) => (
                  <button
                    key={oct}
                    onClick={() => handleParamChange('subOctave', oct)}
                    disabled={!config.subEnabled}
                    className={`py-2 rounded text-[10px] font-mono border transition-all cursor-pointer font-bold ${
                      config.subOctave === oct
                        ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        : 'bg-white/5 text-white/50 border-white/10 hover:text-white disabled:opacity-30'
                    }`}
                  >
                    {oct} OCTAVE ({oct === -1 ? 'Deep Sub' : 'Sub-Bass 40Hz'})
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-ink-dim block">Anchors the low-end fundamental frequency under rich leads.</span>
            </div>

            {/* Sub Mix Level */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Sub Amplitude</span>
                <span className="text-amber-400 font-mono font-bold">
                  {Math.round((config.subLevel ?? 0.65) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.subLevel ?? 0.65}
                disabled={!config.subEnabled}
                onChange={(e) => handleParamChange('subLevel', parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-30"
              />
              <div className="flex justify-between text-[8px] text-white/30 font-mono">
                <span>0% (Silent)</span>
                <span>50%</span>
                <span>100% (Full Boom)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Noise & Transient Layer */}
        {activeLayerTab === 'noise' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-black/40 border border-white/5 rounded-lg animate-in fade-in">
            {/* Enable Toggle & Color */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white uppercase">Noise Layer State</span>
                <button
                  onClick={() => handleParamChange('noiseLayerEnabled', !config.noiseLayerEnabled)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border transition-all cursor-pointer ${
                    config.noiseLayerEnabled
                      ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}
                >
                  {config.noiseLayerEnabled ? 'ENABLED' : 'BYPASS'}
                </button>
              </div>

              <div>
                <label className="text-[9px] text-white/50 font-bold block mb-1 uppercase">Noise Spectral Color</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['white', 'pink'] as const).map((color) => (
                    <button
                      key={color}
                      onClick={() => handleParamChange('noiseType', color)}
                      disabled={!config.noiseLayerEnabled}
                      className={`py-1.5 rounded text-[10px] font-mono capitalize border transition-all cursor-pointer font-bold ${
                        config.noiseType === color
                          ? 'bg-purple-500 text-white border-purple-400'
                          : 'bg-white/5 text-white/50 border-white/10 hover:text-white disabled:opacity-30'
                      }`}
                    >
                      {color === 'white' ? 'White (Air / Crisp)' : 'Pink (Tape / Warm)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Noise Mix Level */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Noise Level</span>
                <span className="text-purple-400 font-mono font-bold">
                  {Math.round((config.noiseLevel ?? 0.25) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={config.noiseLevel ?? 0.25}
                disabled={!config.noiseLayerEnabled}
                onChange={(e) => handleParamChange('noiseLevel', parseFloat(e.target.value))}
                className="w-full accent-purple-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-30"
              />
              <div className="flex justify-between text-[8px] text-white/30 font-mono">
                <span>0% (Clean)</span>
                <span>25% (Lo-Fi)</span>
                <span>100% (Full Grit)</span>
              </div>
            </div>

            {/* Description Info */}
            <div className="p-2.5 bg-black/50 border border-white/10 rounded text-[10px] text-white/70 space-y-1">
              <strong className="text-purple-400 block uppercase">Analog Grit Injection:</strong>
              <p className="text-[9.5px] leading-relaxed">
                Generates a subtle high-frequency transient layer on every keystroke, delivering authentic vintage vinyl or cassette tape character to synth plucks and pads.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Unison Multi-Voice Stacking */}
        {activeLayerTab === 'unison' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-black/40 border border-white/5 rounded-lg animate-in fade-in">
            {/* Voice Count Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white uppercase block">Active Unison Voice Count</label>
              <div className="grid grid-cols-4 gap-1.5">
                {([1, 3, 5, 7] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => handleParamChange('unisonVoices', v)}
                    className={`py-2 rounded text-[10px] font-mono border transition-all cursor-pointer font-bold ${
                      (config.unisonVoices || 1) === v
                        ? 'bg-accent text-white border-accent shadow-[0_0_10px_rgba(255,0,85,0.4)]'
                        : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
                    }`}
                  >
                    {v === 1 ? '1v (Mono)' : `${v} Voices`}
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-ink-dim block">
                {(config.unisonVoices || 1) > 1 
                  ? `${config.unisonVoices} parallel voices stacked with stereo binaural dispersion` 
                  : 'Single voice mode (low CPU, centered)'}
              </span>
            </div>

            {/* Unison Detune Spread */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Detune Spread</span>
                <span className="text-accent font-mono font-bold">
                  {config.unisonDetune ?? 14} cents
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="50"
                step="1"
                value={config.unisonDetune ?? 14}
                disabled={(config.unisonVoices || 1) <= 1}
                onChange={(e) => handleParamChange('unisonDetune', parseInt(e.target.value))}
                className="w-full accent-accent h-1.5 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-30"
              />
              <div className="flex justify-between text-[8px] text-white/30 font-mono">
                <span>Tight (5c)</span>
                <span>Supersaw (15c)</span>
                <span>Massive (40c+)</span>
              </div>
            </div>

            {/* Stereo Pan Spread */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Stereo Field Spread</span>
                <span className="text-secondary font-mono font-bold">
                  {Math.round((config.unisonSpread ?? 0.6) * 100)}% Width
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.unisonSpread ?? 0.6}
                disabled={(config.unisonVoices || 1) <= 1}
                onChange={(e) => handleParamChange('unisonSpread', parseFloat(e.target.value))}
                className="w-full accent-secondary h-1.5 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-30"
              />
              <div className="flex justify-between text-[8px] text-white/30 font-mono">
                <span>0% (Center Mono)</span>
                <span>50%</span>
                <span>100% (Ultra-Wide)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Companion Track Link */}
        {activeLayerTab === 'companion' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-black/40 border border-white/5 rounded-lg animate-in fade-in">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white uppercase block">
                Link to Companion Session Track
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={track.layerTargetTrackId || ''}
                  onChange={(e) => {
                    const targetId = e.target.value || undefined;
                    if (onUpdateTrack) {
                      onUpdateTrack({ ...track, layerTargetTrackId: targetId });
                      notify(targetId ? `Linked with companion track!` : 'Removed companion track link', 'info');
                    }
                  }}
                  className="bg-zinc-900 text-white font-mono text-xs border border-white/20 rounded p-2 focus:border-secondary focus:outline-none cursor-pointer flex-1"
                >
                  <option value="">None (Isolated Track Playback)</option>
                  {tracks
                    .filter(t => t.id !== track.id && t.type === 'synth')
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        🎹 {t.name} (Simultaneous Layering)
                      </option>
                    ))}
                </select>

                {track.layerTargetTrackId && (
                  <button
                    onClick={() => {
                      if (onUpdateTrack) {
                        onUpdateTrack({ ...track, layerTargetTrackId: undefined });
                        notify('Unlinked companion track.', 'info');
                      }
                    }}
                    className="px-2.5 py-2 bg-white/5 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs font-mono font-bold cursor-pointer"
                  >
                    Clear Link
                  </button>
                )}
              </div>
              <p className="text-[10px] text-ink-dim">
                When linked, any note triggered by piano roll, MIDI keyboard, QWERTY keys, or the arpeggiator will sound on both tracks in parallel.
              </p>
            </div>

            <div className="p-3 bg-black/50 border border-white/10 rounded flex items-start gap-2.5 text-[11px] text-white/70">
              <Layers className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <strong className="text-secondary block font-mono uppercase mb-1">Dual-Instrument Architecture:</strong>
                Layer a bright sawtooth lead with a deep sub-bass or Rhodes electric piano on Track 2 to produce rich, symphonic arrangements with independent filter automation.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. HARDWARE ARPEGGIATOR RACK MODULE */}
      <div className="bg-black/80 border border-white/10 rounded-xl p-4 flex flex-col gap-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
              arpMode !== 'off' 
                ? 'bg-accent/20 border-accent text-accent shadow-[0_0_12px_rgba(255,0,85,0.4)] animate-pulse' 
                : 'bg-white/5 border-white/10 text-white/40'
            }`}>
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="brand-syne text-sm font-extrabold text-white uppercase tracking-wider">
                  Hardware Arpeggiator Rack
                </h3>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border transition-all ${
                  arpMode !== 'off'
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40 animate-pulse'
                    : 'bg-white/5 text-white/30 border-white/10'
                }`}>
                  {arpMode !== 'off' ? `ACTIVE [${arpRate}]` : 'BYPASSED'}
                </span>
              </div>
              <p className="text-[10px] text-white/50 mt-0.5">
                Dynamic polyphonic step-sequenced arpeggiation with variable clock rates, octave expansion, and direction algorithms.
              </p>
            </div>
          </div>

          {/* Master Arp Power Switch */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = arpMode === 'off' ? 'up' : 'off';
                setArpMode(next);
                notify(next === 'off' ? 'Arpeggiator bypassed.' : 'Arpeggiator active!', 'info');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                arpMode !== 'off'
                  ? 'bg-accent text-white border-accent shadow-[0_0_15px_rgba(255,0,85,0.5)]'
                  : 'bg-white/5 text-white/60 border-white/15 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${arpMode !== 'off' ? 'bg-white animate-ping' : 'bg-white/30'}`} />
              <span>{arpMode !== 'off' ? 'ARP ACTIVE' : 'ENABLE ARP'}</span>
            </button>

            {/* Latch / Hold Mode */}
            <button
              onClick={() => {
                setIsHoldActive(prev => !prev);
                if (isHoldActive) setActiveHeldPitches(new Set());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                isHoldActive 
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.4)]' 
                  : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
              }`}
            >
              LATCH: {isHoldActive ? 'HELD' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Pattern Direction, Clock Rate, and Octaves */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pattern Direction Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/60 uppercase block">Pattern Direction</label>
            <div className="grid grid-cols-5 gap-1">
              {[
                { id: 'up', label: 'UP ▲' },
                { id: 'down', label: 'DOWN ▼' },
                { id: 'up_down', label: 'UP/DN ▲▼' },
                { id: 'random', label: 'RND 🎲' },
                { id: 'chord_chop', label: 'CHOP ⚡' },
              ].map((pat) => (
                <button
                  key={pat.id}
                  onClick={() => {
                    setArpMode(pat.id as ArpMode);
                  }}
                  className={`py-1.5 px-1 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer truncate text-center ${
                    arpMode === pat.id
                      ? 'bg-accent text-white border-accent shadow-[0_0_8px_rgba(255,0,85,0.4)]'
                      : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                  title={`Select ${pat.label} arpeggiator sequence direction`}
                >
                  {pat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clock Rate Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/60 uppercase block">Clock Division Rate</label>
            <div className="grid grid-cols-4 gap-1">
              {(['1/4', '1/8', '1/16', '1/32'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setArpRate(r)}
                  className={`py-1.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer text-center ${
                    arpRate === r
                      ? 'bg-[#00F0FF] text-black border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {r} Note
                </button>
              ))}
            </div>
          </div>

          {/* Octave Range Expansion */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/60 uppercase block">Octave Span</label>
            <div className="grid grid-cols-3 gap-1">
              {([1, 2, 3] as const).map((oct) => (
                <button
                  key={oct}
                  onClick={() => setArpOctaves(oct)}
                  className={`py-1.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer text-center ${
                    arpOctaves === oct
                      ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {oct} {oct === 1 ? 'Octave' : 'Octaves'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Step Activity Monitor & Pitch Readout */}
        <div className="flex items-center justify-between p-2.5 bg-black/60 border border-white/10 rounded-lg text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/40 uppercase font-bold">ACTIVE STEP:</span>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((stepIdx) => (
                <div
                  key={stepIdx}
                  className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                    arpMode !== 'off' && currentArpStep === stepIdx
                      ? 'bg-accent text-white shadow-[0_0_10px_#ff0055] scale-110'
                      : 'bg-white/10 text-white/30'
                  }`}
                >
                  {stepIdx + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/40 uppercase font-bold">CURRENT NOTE:</span>
            <span className={`px-2 py-0.5 rounded font-bold ${
              currentArpPitch ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40' : 'text-white/30'
            }`}>
              {currentArpPitch || (activeHeldPitches.size > 0 ? Array.from(activeHeldPitches).join(', ') : 'HOLD KEYS')}
            </span>
          </div>
        </div>
      </div>

      {/* 6. LIVE AUDITION KEYBOARD & PERFORMANCE BAR */}
      <div className="bg-black/70 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
        
        {/* Performance Header Controls: Octaves & Chord Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          
          {/* Octave Shift */}
          <div className="flex items-center gap-1.5 bg-black/80 border border-white/10 rounded px-2 py-1 text-[10px]">
            <span className="text-[9px] text-white/50 font-bold uppercase">Octave:</span>
            <button
              onClick={() => setOctaveShift(prev => Math.max(-2, prev - 1))}
              className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 text-white rounded font-bold cursor-pointer"
            >
              -1
            </button>
            <span className="font-mono font-bold text-[#00F0FF] px-1">
              {octaveShift >= 0 ? `+${octaveShift}` : octaveShift}
            </span>
            <button
              onClick={() => setOctaveShift(prev => Math.min(2, prev + 1))}
              className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 text-white rounded font-bold cursor-pointer"
            >
              +1
            </button>
          </div>

          {/* Chord Stacking Mode */}
          <div className="flex items-center gap-1.5 bg-black/80 border border-white/10 rounded px-2 py-1 text-[10px]">
            <Layers className="w-3.5 h-3.5 text-[#FF3E82]" />
            <span className="text-[9px] text-white/50 font-bold uppercase">Chord Mode:</span>
            <select
              value={chordMode}
              onChange={(e) => setChordMode(e.target.value as ChordMode)}
              className="bg-transparent text-white font-mono text-[10px] focus:outline-none cursor-pointer"
            >
              {Object.entries(CHORD_INTERVALS).map(([key, info]) => (
                <option key={key} value={key} className="bg-zinc-900 text-white">
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[10px] text-white/40 font-mono">
            {activeHeldPitches.size > 0 ? `${activeHeldPitches.size} notes held in memory` : 'Play keys or MIDI'}
          </div>
        </div>

        {/* Playable Graphical Keyboard display */}
        <div className="flex items-end justify-center relative bg-black/60 p-4 rounded-xl h-40 border border-white/10 overflow-x-auto">
          {keyboardKeys.map((k) => {
            const isPressed = activeVisualKeys.has(k.pitch) || activeHeldPitches.has(k.pitch);

            return (
              <button
                key={k.pitch}
                onClick={() => triggerNoteWithModifiers(k.pitch)}
                className={`transition-all duration-75 rounded-b-md cursor-pointer flex flex-col items-center justify-end pb-2 ${
                  k.isSharp
                    ? `w-6 h-24 -mx-3 z-20 shadow-lg border ${
                        isPressed 
                          ? 'bg-[#FF3E82] text-white border-[#FF3E82] shadow-[0_0_15px_#FF3E82]' 
                          : 'bg-[#18181f] hover:bg-[#252530] text-purple-300 border-black/80'
                      }`
                    : `w-10 h-32 z-10 border ${
                        isPressed 
                          ? 'bg-[#00F0FF] text-black border-[#00F0FF] shadow-[0_0_15px_#00F0FF]' 
                          : 'bg-white hover:bg-zinc-100 text-zinc-900 border-zinc-300'
                      }`
                }`}
              >
                <span className={`font-mono text-[8px] font-bold ${k.isSharp ? 'text-purple-300' : 'text-zinc-500'}`}>
                  [{k.key}]
                </span>
                <span className="font-mono text-[10px] font-black leading-none mt-1">
                  {k.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Bar Info */}
        <div className="flex items-center justify-between text-[10px] text-white/50">
          <span>🎮 Tip: Play keys live via external USB MIDI Keyboard or QWERTY keyboard (<span className="text-[#00F0FF] font-bold">[A]</span> through <span className="text-[#00F0FF] font-bold">[K]</span>)</span>
          <span className="text-[#00F0FF] font-bold">{track.name}</span>
        </div>
      </div>

      {/* MIDI CC Mappings Manager Modal */}
      <MidiMappingsModal 
        isOpen={showCcMappingModal} 
        onClose={() => setShowCcMappingModal(false)} 
      />

    </div>
  );
}
