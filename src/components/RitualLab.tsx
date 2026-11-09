import React, { useState, useEffect, useRef } from 'react';
import { Track, RitualState, FlowStateSettings, BrainwaveBand, DrumTrackState, MidiNote } from '../types';
import { audioEngine } from '../services/audioEngine';
import { generateEuclideanRhythm, OCCULT_SCALES, getScalePitches, mutateDrumPattern } from '../utils/euclideanGenerator';
import { 
  Flame, Radio, Waves, Activity, Cpu, Sparkles, Sliders, Volume2, 
  RotateCcw, Disc, Zap, Headphones, Eye, RefreshCw, Compass, AlertCircle,
  Power, Check
} from 'lucide-react';

interface RitualLabProps {
  tracks: Track[];
  activeTrackId: string;
  bpm: number;
  onUpdateTrackDrumState: (trackId: string, drumState: DrumTrackState) => void;
  onUpdateTrackMidiNotes: (trackId: string, notes: MidiNote[]) => void;
  onShowNotification?: (msg: string) => void;
}

type RitualTab = 'mangler' | 'flow' | 'euclidean' | 'scope' | 'formant';

export interface BinauralBandOption {
  id: 'theta' | 'alpha' | 'beta' | 'gamma';
  label: string;
  range: string;
  defaultBeat: number;
  subFrequencies: number[];
  stateTitle: string;
  desc: string;
  color: string;
  glowColor: string;
  badge?: string;
}

export const BINAURAL_BAND_OPTIONS: BinauralBandOption[] = [
  {
    id: 'theta',
    label: 'THETA',
    range: '4 – 8 Hz',
    defaultBeat: 6.0,
    subFrequencies: [4.5, 6.0, 7.5],
    stateTitle: 'Hypnagogic Reverie & Ambient Trance',
    desc: 'Deep subconscious dreaming, spatial intuition & mystical soundscapes.',
    color: '#00F2FF',
    glowColor: 'rgba(0, 242, 255, 0.4)',
  },
  {
    id: 'alpha',
    label: 'ALPHA',
    range: '8 – 14 Hz',
    defaultBeat: 10.0,
    subFrequencies: [8.5, 10.0, 12.0],
    stateTitle: 'Peak Creative Flow & Rapid Sequencing',
    desc: 'Effortless focus, fluid arrangement generation & relaxed vigilance.',
    color: '#32FF7E',
    glowColor: 'rgba(50, 255, 126, 0.4)',
    badge: 'FLOW OPTIMAL',
  },
  {
    id: 'beta',
    label: 'BETA',
    range: '14 – 30 Hz',
    defaultBeat: 18.0,
    subFrequencies: [15.0, 18.0, 24.0],
    stateTitle: 'Laser Concentration & Analytical Clarity',
    desc: 'Critical mastering analysis, surgical EQ carving & precise track editing.',
    color: '#FFB800',
    glowColor: 'rgba(255, 184, 0, 0.4)',
  },
  {
    id: 'gamma',
    label: 'GAMMA',
    range: '30 – 50 Hz',
    defaultBeat: 40.0,
    subFrequencies: [35.0, 40.0, 48.0],
    stateTitle: 'Hyper-Cognition & Neural Synchronization',
    desc: 'High-frequency brain synchrony, peak mental acuity & cybernetic drive.',
    color: '#FF0055',
    glowColor: 'rgba(255, 0, 85, 0.4)',
    badge: 'HYPER-DRIVE',
  },
];

export type BinauralPresetCategory = 'Focus' | 'Relax' | 'Energize' | 'Deep Sleep';

export interface BinauralPreset {
  id: string;
  name: string;
  category: BinauralPresetCategory;
  band: BrainwaveBand;
  carrier: number;
  beat: number;
  desc: string;
  badge?: string;
}

// Categorized Flow State Presets (Focus, Relax, Energize, Deep Sleep)
export const FLOW_PRESETS: BinauralPreset[] = [
  // Focus Presets (Alpha & Beta • Deep Work & Flow)
  { id: 'flow_alpha_432', name: '432Hz Alpha Flow', category: 'Focus', band: 'alpha', carrier: 432, beat: 10.0, desc: 'Peak creative focus, effortless songwriting & fluid arrangement', badge: 'FLOW OPTIMAL' },
  { id: 'flow_beta_laser', name: '18Hz Laser Precision', category: 'Focus', band: 'beta', carrier: 440, beat: 18.0, desc: 'Critical EQ carving, technical mix mastering & razor analytical focus' },
  { id: 'flow_alpha_528', name: '528Hz Miracle Focus', category: 'Focus', band: 'alpha', carrier: 528, beat: 12.0, desc: 'Clarity, cognitive intuition & harmonious synthesis' },
  { id: 'flow_beta_rapid', name: '300Hz Cyber Focus', category: 'Focus', band: 'beta', carrier: 300, beat: 14.5, desc: 'Fast polyrhythmic sequencing & high cognitive bandwidth' },

  // Relax Presets (Alpha & Theta • Meditation & Calm)
  { id: 'flow_earth_136', name: '136.1Hz Cosmic OM', category: 'Relax', band: 'alpha', carrier: 136.1, beat: 8.0, desc: 'Planetary Schumann harmonic for deep meditation & grounding' },
  { id: 'flow_theta_528', name: '528Hz Solfeggio Trance', category: 'Relax', band: 'theta', carrier: 528, beat: 6.0, desc: 'Hypnagogic calm, subconscious visualization & ethereal sound design' },
  { id: 'flow_drone_108', name: '108Hz Sacred Dark Drone', category: 'Relax', band: 'theta', carrier: 108, beat: 5.5, desc: 'Low-frequency occult drone for mental decompression & quiet resonance' },
  { id: 'flow_sub_216', name: '216Hz Subharmonic Peace', category: 'Relax', band: 'theta', carrier: 216, beat: 7.0, desc: 'Acoustic warmth, anti-anxiety tension release & gentle drifting' },

  // Energize Presets (Beta & Gamma • Peak Alertness & Hyper-Drive)
  { id: 'flow_gamma_963', name: '963Hz Cyber Cognition', category: 'Energize', band: 'gamma', carrier: 963, beat: 40.0, desc: 'Laser hyper-focus, peak mental acuity & high-speed pattern synthesis', badge: 'HYPER-DRIVE' },
  { id: 'flow_gamma_surge', name: '40Hz Gamma Surge', category: 'Energize', band: 'gamma', carrier: 528, beat: 40.0, desc: 'Maximum cortical firing rate, transcendent alertness & intense drive' },
  { id: 'flow_beta_kinetic', name: '24Hz High Beta Drive', category: 'Energize', band: 'beta', carrier: 360, beat: 24.0, desc: 'Kinetic energy boost for high-tempo beatmaking & energetic inspiration' },
  { id: 'flow_gamma_quantum', name: '48Hz Quantum Spark', category: 'Energize', band: 'gamma', carrier: 741, beat: 48.0, desc: 'Pineal stimulation, rapid insight & high-voltage cognitive clarity' },

  // Deep Sleep Presets (Delta • Somatic Reset & Dream Stasis)
  { id: 'flow_ground_174', name: '174Hz Somatic Reset', category: 'Deep Sleep', band: 'delta', carrier: 174, beat: 3.0, desc: 'Full physical relaxation, tension dissipation & somatic stillness' },
  { id: 'flow_delta_trance', name: '2.5Hz Delta Trance', category: 'Deep Sleep', band: 'delta', carrier: 108, beat: 2.5, desc: 'Subconscious dream stasis, restorative delta rest & acoustic cocoon' },
  { id: 'flow_void_sleep', name: '1.5Hz Void Sleep', category: 'Deep Sleep', band: 'delta', carrier: 96, beat: 1.5, desc: 'Ultra-slow brainwave immersion for deep restorative delta slumber' },
  { id: 'flow_cell_111', name: '111Hz Cell Regeneration', category: 'Deep Sleep', band: 'delta', carrier: 111, beat: 2.0, desc: 'Holy cellular regeneration frequency for deep nightly recovery' },
];

export function RitualLab({
  tracks,
  activeTrackId,
  bpm,
  onUpdateTrackDrumState,
  onUpdateTrackMidiNotes,
  onShowNotification
}: RitualLabProps) {
  const [activeTab, setActiveTab] = useState<RitualTab>('mangler');
  
  // Audio Engine Ritual & Flow States
  const [ritualState, setRitualState] = useState<RitualState>(audioEngine.ritualState);
  const [flowState, setFlowState] = useState<FlowStateSettings>(audioEngine.flowState);
  const [presetCategory, setPresetCategory] = useState<'All' | BinauralPresetCategory>('All');
  const filteredPresets = presetCategory === 'All' ? FLOW_PRESETS : FLOW_PRESETS.filter((p) => p.category === presetCategory);

  // Euclidean & Mutation Matrix states
  const [targetTrackId, setTargetTrackId] = useState<string>(activeTrackId || (tracks[0]?.id ?? ''));
  const [euclidPulses, setEuclidPulses] = useState<number>(9);
  const [euclidSteps, setEuclidSteps] = useState<number>(16);
  const [euclidRotation, setEuclidRotation] = useState<number>(0);
  const [mutationChaos, setMutationChaos] = useState<number>(0.35);
  const [preserveDownbeats, setPreserveDownbeats] = useState<boolean>(true);
  const [selectedOccultScale, setSelectedOccultScale] = useState<string>('harmonic_minor');
  const [rootNote, setRootNote] = useState<string>('C');

  // Vector Scope Telemetry State
  const [scopeMode, setScopeMode] = useState<'lissajous' | 'oscilloscope' | 'radar'>('lissajous');
  const [phaseCorrelation, setPhaseCorrelation] = useState<number>(0.92);
  const [stereoWidth, setStereoWidth] = useState<number>(45);

  // Formant Synth State
  const [formantDronePitch, setFormantDronePitch] = useState<number>(65.41); // C2
  const [isDroneHolding, setIsDroneHolding] = useState<boolean>(false);
  const [activeVowel, setActiveVowel] = useState<string | null>(null);

  // References
  const scopeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const brainwaveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const xyPadRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingXY, setIsDraggingXY] = useState<boolean>(false);

  // Sync with audio engine callbacks
  useEffect(() => {
    audioEngine.onRitualStateChange = (state) => {
      setRitualState({ ...state });
    };
    audioEngine.onFlowStateChange = (settings) => {
      setFlowState({ ...settings });
    };

    return () => {
      audioEngine.onRitualStateChange = null;
      audioEngine.onFlowStateChange = null;
    };
  }, []);

  // Update target track if activeTrackId changes
  useEffect(() => {
    if (activeTrackId) {
      setTargetTrackId(activeTrackId);
    }
  }, [activeTrackId]);

  // ==========================================
  // REAL-TIME VECTOR SCOPE CANVAS ANIMATION
  // ==========================================
  useEffect(() => {
    if (activeTab !== 'scope') return;

    let animFrame: number;
    const canvas = scopeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataL = new Float32Array(512);
    const dataR = new Float32Array(512);

    const render = () => {
      animFrame = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      const halfW = width / 2;
      const halfH = height / 2;

      // Dark fade trail for phosphor persistence
      ctx.fillStyle = 'rgba(11, 11, 12, 0.22)';
      ctx.fillRect(0, 0, width, height);

      // Grid reticle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(halfW, 0); ctx.lineTo(halfW, height);
      ctx.moveTo(0, halfH); ctx.lineTo(width, halfH);
      ctx.stroke();

      // Circular range rings
      ctx.beginPath();
      ctx.arc(halfW, halfH, halfW * 0.4, 0, Math.PI * 2);
      ctx.arc(halfW, halfH, halfW * 0.8, 0, Math.PI * 2);
      ctx.stroke();

      if (!audioEngine.analyserLeft || !audioEngine.analyserRight) {
        // Standby test pattern
        ctx.strokeStyle = '#00F2FF';
        ctx.beginPath();
        const t = Date.now() * 0.002;
        for (let i = 0; i < 100; i++) {
          const a = (i / 100) * Math.PI * 2;
          const r = 40 + Math.sin(a * 4 + t) * 15;
          const x = halfW + Math.cos(a) * r;
          const y = halfH + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        return;
      }

      audioEngine.analyserLeft.getFloatTimeDomainData(dataL);
      audioEngine.analyserRight.getFloatTimeDomainData(dataR);

      // Calculate Phase Correlation (sum(L*R) / sqrt(sum(L^2) * sum(R^2)))
      let sumLR = 0, sumL2 = 0, sumR2 = 0;
      for (let i = 0; i < dataL.length; i++) {
        sumLR += dataL[i] * dataR[i];
        sumL2 += dataL[i] * dataL[i];
        sumR2 += dataR[i] * dataR[i];
      }
      const denom = Math.sqrt(sumL2 * sumR2);
      const corr = denom > 0.0001 ? Math.max(-1, Math.min(1, sumLR / denom)) : 1.0;
      setPhaseCorrelation(parseFloat(corr.toFixed(2)));
      setStereoWidth(Math.round((1 - Math.max(0, corr)) * 100));

      if (scopeMode === 'lissajous') {
        // Lissajous 45-degree rotated stereo field (M/S)
        ctx.strokeStyle = '#FF0055';
        ctx.lineWidth = 1.6;
        ctx.shadowColor = '#FF0055';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        for (let i = 0; i < dataL.length; i += 2) {
          const l = dataL[i];
          const r = dataR[i];
          // 45 degree rotation: x = (L - R) / sqrt(2), y = (L + R) / sqrt(2)
          const rotX = (l - r) * 0.7071;
          const rotY = (l + r) * 0.7071;

          const px = halfW + rotX * (halfW * 0.85);
          const py = halfH - rotY * (halfH * 0.85);

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (scopeMode === 'oscilloscope') {
        // Dual phosphor beam
        // Left (Cyan)
        ctx.strokeStyle = '#00F2FF';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00F2FF';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let i = 0; i < dataL.length; i++) {
          const x = (i / dataL.length) * width;
          const y = halfH - dataL[i] * (halfH * 0.7);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Right (Red/Pink)
        ctx.strokeStyle = '#FF0055';
        ctx.shadowColor = '#FF0055';
        ctx.beginPath();
        for (let i = 0; i < dataR.length; i++) {
          const x = (i / dataR.length) * width;
          const y = halfH - dataR[i] * (halfH * 0.7);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Polar Phase Radar
        ctx.strokeStyle = '#32FF7E';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#32FF7E';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i < dataL.length; i += 4) {
          const angle = (i / dataL.length) * Math.PI * 2;
          const amp = (Math.abs(dataL[i]) + Math.abs(dataR[i])) * 0.5;
          const r = amp * halfW * 0.9;
          const x = halfW + Math.cos(angle) * r;
          const y = halfH + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [activeTab, scopeMode]);

  // ==========================================
  // REAL-TIME BINAURAL INTERFEROMETRY CANVAS
  // ==========================================
  useEffect(() => {
    if (activeTab !== 'flow') return;

    let animId: number;
    const canvas = brainwaveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      animId = requestAnimationFrame(render);
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0B0B0C';
      ctx.fillRect(0, 0, w, h);

      const time = Date.now() * 0.003;
      const beatFreq = flowState.beatFreq;
      const isEnabled = flowState.isEnabled;

      // Draw horizontal reference lines
      ctx.strokeStyle = '#1F1F24';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(w, h * 0.5);
      ctx.stroke();

      // Left Channel Sine Wave (Cyan)
      ctx.strokeStyle = isEnabled ? 'rgba(0, 242, 255, 0.7)' : '#333';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const y = h * 0.5 + Math.sin(x * 0.05 + time * 2) * (h * 0.22);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Right Channel Sine Wave (Pink)
      ctx.strokeStyle = isEnabled ? 'rgba(255, 0, 85, 0.7)' : '#222';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        // Phase-offset by beat frequency
        const y = h * 0.5 + Math.sin(x * 0.05 + time * 2 + (x / w) * (beatFreq * 0.8)) * (h * 0.22);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Resulting Binaural Envelope (Green phosphor beat)
      ctx.strokeStyle = isEnabled ? '#32FF7E' : '#444';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = isEnabled ? '#32FF7E' : 'transparent';
      ctx.shadowBlur = isEnabled ? 10 : 0;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const envelope = Math.cos((x / w) * beatFreq * 0.5 + time * (beatFreq * 0.1));
        const carrier = Math.sin(x * 0.05 + time * 2);
        const y = h * 0.5 + (carrier * envelope) * (h * 0.38);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeTab, flowState.beatFreq, flowState.isEnabled]);

  // ==========================================
  // XY TOUCHPAD VECTOR CONTROL
  // ==========================================
  const handleXYMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!xyPadRef.current) return;
    const rect = xyPadRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    audioEngine.setRitualXY(x, y, true);
  };

  const handleXYDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingXY(true);
    handleXYMove(e);
  };

  const handleXYUp = () => {
    setIsDraggingXY(false);
    audioEngine.setRitualXY(ritualState.xyPad.x, ritualState.xyPad.y, false);
  };

  // ==========================================
  // EUCLIDEAN & MUTATION DISPATCH
  // ==========================================
  const currentEuclidean = generateEuclideanRhythm(euclidPulses, euclidSteps, euclidRotation);

  const handleApplyEuclideanToTrack = () => {
    const target = tracks.find((t) => t.id === targetTrackId);
    if (!target) return;

    if (target.type === 'drums' && target.drumState) {
      // Apply to first available active drum row or primary kick
      const newDrumState: DrumTrackState = JSON.parse(JSON.stringify(target.drumState));
      const drumKeys = Object.keys(newDrumState);
      const keyToApply = drumKeys.includes('kick') ? 'kick' : drumKeys[0];

      if (keyToApply && Array.isArray(newDrumState[keyToApply])) {
        // Expand or fit steps to 32
        const updatedSteps = [...newDrumState[keyToApply]];
        for (let i = 0; i < 32; i++) {
          updatedSteps[i] = currentEuclidean.steps[i % euclidSteps];
        }
        newDrumState[keyToApply] = updatedSteps;
        onUpdateTrackDrumState(target.id, newDrumState);
        onShowNotification?.(`† Euclidean [${euclidPulses}/${euclidSteps}] applied to ${target.name} (${keyToApply})`);
      }
    } else {
      // Apply to synth or bass lead
      const scalePitches = getScalePitches(rootNote, selectedOccultScale, 3, 2);
      const generatedNotes: MidiNote[] = [];

      for (let i = 0; i < 32; i++) {
        if (currentEuclidean.steps[i % euclidSteps]) {
          const pitch = scalePitches[i % scalePitches.length];
          generatedNotes.push({
            id: `euc_${Date.now()}_${i}`,
            pitch,
            step: i,
            duration: 1,
            velocity: 0.85 + (i % 4 === 0 ? 0.15 : 0),
          });
        }
      }
      onUpdateTrackMidiNotes(target.id, generatedNotes);
      onShowNotification?.(`† Occult Euclidean sequence injected into ${target.name} (${selectedOccultScale})`);
    }
  };

  const handleMutateTargetTrack = () => {
    const target = tracks.find((t) => t.id === targetTrackId);
    if (!target) return;

    if (target.type === 'drums' && target.drumState) {
      const newDrumState: DrumTrackState = JSON.parse(JSON.stringify(target.drumState));
      Object.keys(newDrumState).forEach((key) => {
        if (Array.isArray(newDrumState[key])) {
          newDrumState[key] = mutateDrumPattern(newDrumState[key], mutationChaos, preserveDownbeats);
        }
      });
      onUpdateTrackDrumState(target.id, newDrumState);
      onShowNotification?.(`🩸 Pattern Corrupted with ${(mutationChaos * 100).toFixed(0)}% Chaos on ${target.name}`);
    } else if (target.midiNotes) {
      // Mutate MIDI steps
      const mutatedNotes = target.midiNotes
        .map((note) => {
          if (Math.random() < mutationChaos) {
            // Drop or shift note step
            if (Math.random() < 0.3) return null;
            return {
              ...note,
              step: (note.step + (Math.random() < 0.5 ? 1 : -1) + 32) % 32,
            };
          }
          return note;
        })
        .filter(Boolean) as MidiNote[];

      onUpdateTrackMidiNotes(target.id, mutatedNotes);
      onShowNotification?.(`⚡ Lead Corrupted with ${(mutationChaos * 100).toFixed(0)}% Dark Glitch`);
    }
  };

  // Formant Trigger
  const handleTriggerFormant = (vowel: string) => {
    setActiveVowel(vowel);
    audioEngine.triggerFormantVowel(vowel, formantDronePitch, isDroneHolding ? 3.0 : 0.85);
    setTimeout(() => {
      if (!isDroneHolding) setActiveVowel(null);
    }, 400);
  };

  // Handler for Binaural Beat Frequency Toggles (Theta, Alpha, Beta, Gamma)
  const handleToggleBinauralBeat = (bandOption: BinauralBandOption) => {
    if (flowState.isEnabled && flowState.band === bandOption.id) {
      // Toggle off if already active
      audioEngine.setFlowState({ isEnabled: false });
      onShowNotification?.(`Binaural Flow State generator disengaged`);
    } else {
      // Toggle on with target band frequency
      audioEngine.setFlowState({
        isEnabled: true,
        band: bandOption.id as BrainwaveBand,
        beatFreq: bandOption.defaultBeat,
      });
      onShowNotification?.(`⚡ ${bandOption.label} Flow State Engaged (${bandOption.defaultBeat}Hz binaural beat)`);
    }
  };

  const handleSelectSubFreq = (bandId: BrainwaveBand, freq: number) => {
    audioEngine.setFlowState({
      isEnabled: true,
      band: bandId,
      beatFreq: freq,
    });
    onShowNotification?.(`Flow State: ${bandId.toUpperCase()} tuned to ${freq.toFixed(1)} Hz`);
  };

  return (
    <div className="flex flex-col gap-4 text-ink select-none">
      {/* SECTION HEADER & QUICK TELEMETRY */}
      <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FF0055]/20 border border-[#FF0055] flex items-center justify-center text-[#FF0055] shadow-[0_0_15px_rgba(255,0,85,0.4)]">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black tracking-wider uppercase text-white">THE RITUAL LAB</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF0055]/20 text-[#FF0055] border border-[#FF0055]/30">V8 TERMINAL</span>
            </div>
            <p className="text-xs text-[#94949E] font-mono">
              Live Glitch Mangler • Neural Flow Generator • Euclidean Mutation • Lissajous Radar • Formant Choir
            </p>
          </div>
        </div>

        {/* Global Live Indicators */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-[#0B0B0C] border border-[#232326] flex items-center gap-2">
            <span className="text-[#94949E]">TAPE:</span>
            <span className={`font-bold ${ritualState.isTapeStopping ? 'text-[#FF0055] animate-ping' : 'text-[#32FF7E]'}`}>
              {ritualState.isTapeStopping ? 'BRAKING' : ritualState.isHalftime ? 'HALFTIME (50%)' : 'NORMAL'}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#0B0B0C] border border-[#232326] flex items-center gap-2">
            <span className="text-[#94949E]">FLOW STATE:</span>
            <span className={`font-bold ${flowState.isEnabled ? 'text-[#00F2FF] shadow-[0_0_8px_#00F2FF]' : 'text-[#666]'}`}>
              {flowState.isEnabled ? `${flowState.band.toUpperCase()} (${flowState.beatFreq}Hz)` : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BINAURAL BEAT FREQUENCY CONTROLLER (FLOW STATE GENERATOR) */}
      {/* ========================================================= */}
      <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-3 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232326] pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
              flowState.isEnabled
                ? 'bg-[#00F2FF]/20 border-[#00F2FF] text-[#00F2FF] shadow-[0_0_12px_rgba(0,242,255,0.4)]'
                : 'bg-[#0B0B0C] border-[#232326] text-[#666]'
            }`}>
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-white tracking-wider">
                  BINAURAL FLOW FREQUENCY SELECTOR
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border transition-all ${
                  flowState.isEnabled
                    ? 'bg-[#32FF7E]/20 text-[#32FF7E] border-[#32FF7E]/40 animate-pulse'
                    : 'bg-[#232326] text-[#94949E] border-[#333]'
                }`}>
                  {flowState.isEnabled ? 'FLOW ENGINE ACTIVE' : 'ENGINE OFFLINE'}
                </span>
              </div>
              <p className="text-[10px] text-[#94949E] font-normal">
                Enable target binaural beat frequencies (Theta, Alpha, Beta, Gamma) to modulate cognitive flow state in the Web Audio Engine.
              </p>
            </div>
          </div>

          {/* Quick Engine Telemetry & Master Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {flowState.isEnabled && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0B0B0C] border border-[#232326] text-[10px]">
                <span className="text-[#94949E]">EAR FREQS:</span>
                <span className="text-[#00F2FF] font-bold">L: {Math.max(20, Math.round(flowState.carrierFreq - flowState.beatFreq / 2))}Hz</span>
                <span className="text-[#94949E]">/</span>
                <span className="text-[#FF0055] font-bold">R: {Math.max(20, Math.round(flowState.carrierFreq + flowState.beatFreq / 2))}Hz</span>
                <span className="text-[#32FF7E] font-bold ml-1">(+{flowState.beatFreq.toFixed(1)}Hz {flowState.band.toUpperCase()})</span>
              </div>
            )}

            {/* Binaural Preset Category Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#0B0B0C] border border-[#232326] px-2 py-1 rounded-lg">
              <span className="text-[10px] text-[#94949E] uppercase font-bold hidden sm:inline">CATEGORY:</span>
              <select
                value={presetCategory}
                onChange={(e) => {
                  const cat = e.target.value as 'All' | BinauralPresetCategory;
                  setPresetCategory(cat);
                  const firstOfCat = cat === 'All' ? FLOW_PRESETS[0] : FLOW_PRESETS.find((p) => p.category === cat);
                  if (firstOfCat) {
                    audioEngine.setFlowState({
                      carrierFreq: firstOfCat.carrier,
                      beatFreq: firstOfCat.beat,
                      band: firstOfCat.band,
                      isEnabled: true,
                    });
                    onShowNotification?.(`⚡ [${cat}] Loaded: ${firstOfCat.name} (${firstOfCat.beat}Hz ${firstOfCat.band.toUpperCase()})`);
                  }
                }}
                className="bg-transparent text-[#00F2FF] font-mono text-[11px] font-bold focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-[#141416] text-white">⚡ All Categories ({FLOW_PRESETS.length})</option>
                <option value="Focus" className="bg-[#141416] text-[#32FF7E]">🎯 Focus (Alpha &amp; Beta)</option>
                <option value="Relax" className="bg-[#141416] text-[#00F2FF]">🌙 Relax (Alpha &amp; Theta)</option>
                <option value="Energize" className="bg-[#141416] text-[#FF0055]">🔥 Energize (Beta &amp; Gamma)</option>
                <option value="Deep Sleep" className="bg-[#141416] text-[#A855F7]">🌌 Deep Sleep (Delta)</option>
              </select>
            </div>

            {/* Quick Carrier Tuning Selector */}
            <div className="hidden md:flex items-center gap-1 text-[10px]">
              <span className="text-[#94949E] mr-1">CARRIER:</span>
              {[
                { label: '432Hz', freq: 432 },
                { label: '528Hz', freq: 528 },
                { label: '108Hz', freq: 108 },
              ].map((c) => (
                <button
                  key={c.label}
                  onClick={() => {
                    audioEngine.setFlowState({ carrierFreq: c.freq });
                    onShowNotification?.(`Flow State Carrier tuned to ${c.freq} Hz`);
                  }}
                  className={`px-2 py-0.5 rounded text-[9.5px] border transition-all cursor-pointer ${
                    Math.abs(flowState.carrierFreq - c.freq) < 1
                      ? 'bg-white text-black font-bold border-white'
                      : 'bg-[#0B0B0C] text-[#94949E] border-[#232326] hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => audioEngine.setFlowState({ isEnabled: !flowState.isEnabled })}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
                flowState.isEnabled
                  ? 'bg-[#00F2FF] text-black border-[#00F2FF] shadow-[0_0_15px_#00F2FF]'
                  : 'bg-[#0B0B0C] text-[#94949E] hover:text-white border-[#232326]'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{flowState.isEnabled ? 'POWER: ON' : 'POWER: OFF'}</span>
            </button>
          </div>
        </div>

        {/* 4 BINAURAL FREQUENCY TOGGLE BUTTONS: THETA, ALPHA, BETA, GAMMA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BINAURAL_BAND_OPTIONS.map((band) => {
            const isBandActive = flowState.isEnabled && flowState.band === band.id;
            return (
              <div
                key={band.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                  isBandActive
                    ? 'bg-[#0B0B0C]'
                    : 'bg-[#0B0B0C] border-[#232326] hover:border-white/30'
                }`}
                style={{
                  borderColor: isBandActive ? band.color : undefined,
                  boxShadow: isBandActive ? `0 0 16px ${band.glowColor}` : undefined,
                }}
              >
                {/* Button Header & Toggle Switch */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black tracking-wider" style={{ color: band.color }}>
                      {band.label}
                    </span>
                    <span className="text-[10px] text-[#94949E] font-bold">{band.range}</span>
                  </div>

                  <button
                    onClick={() => handleToggleBinauralBeat(band)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer border flex items-center gap-1 ${
                      isBandActive
                        ? 'text-black font-black'
                        : 'bg-transparent text-[#94949E] border-[#232326] hover:text-white'
                    }`}
                    style={{
                      backgroundColor: isBandActive ? band.color : undefined,
                      borderColor: isBandActive ? band.color : undefined,
                      boxShadow: isBandActive ? `0 0 10px ${band.glowColor}` : undefined,
                    }}
                  >
                    {isBandActive ? <Check className="w-3 h-3" /> : null}
                    <span>{isBandActive ? 'ENGAGED' : 'ENABLE'}</span>
                  </button>
                </div>

                {/* Subtitle / Psychological State */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white block">{band.stateTitle}</span>
                    {band.badge && (
                      <span className="text-[8px] px-1 py-0.2 rounded bg-[#32FF7E]/20 text-[#32FF7E] border border-[#32FF7E]/40 font-bold">
                        {band.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#94949E] leading-relaxed mt-0.5">{band.desc}</p>
                </div>

                {/* Sub-frequencies selector buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1F1F24]">
                  <span className="text-[9px] text-[#94949E] uppercase">TUNING:</span>
                  <div className="flex items-center gap-1">
                    {band.subFrequencies.map((subFreq) => {
                      const isSubSelected = isBandActive && Math.abs(flowState.beatFreq - subFreq) < 0.2;
                      return (
                        <button
                          key={subFreq}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSubFreq(band.id as BrainwaveBand, subFreq);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border transition-all cursor-pointer ${
                            isSubSelected
                              ? 'text-black'
                              : 'bg-[#141416] text-[#94949E] border-[#232326] hover:text-white hover:border-white/30'
                          }`}
                          style={{
                            backgroundColor: isSubSelected ? band.color : undefined,
                            borderColor: isSubSelected ? band.color : undefined,
                          }}
                        >
                          {subFreq.toFixed(1)}Hz
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Categorized Quick Presets Bar */}
        <div className="pt-2.5 border-t border-[#232326] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-[#94949E] font-bold uppercase mr-1">PRESET CATEGORIES:</span>
            {(['All', 'Focus', 'Relax', 'Energize', 'Deep Sleep'] as const).map((cat) => {
              const isSelected = presetCategory === cat;
              const count = cat === 'All' ? FLOW_PRESETS.length : FLOW_PRESETS.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setPresetCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                      : 'bg-[#0B0B0C] text-[#94949E] border-[#232326] hover:text-white hover:border-white/30'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[8.5px] px-1 py-0.2 rounded font-black ${isSelected ? 'bg-black/20 text-black' : 'bg-[#1F1F24] text-[#94949E]'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-[10px] text-[#94949E]">
            {filteredPresets.length} presets filtered by <b className="text-white">{presetCategory}</b>
          </span>
        </div>

        {/* Horizontal Quick Preset Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filteredPresets.slice(0, 6).map((preset) => {
            const isLoaded = flowState.isEnabled && Math.abs(flowState.carrierFreq - preset.carrier) < 1 && Math.abs(flowState.beatFreq - preset.beat) < 0.2;
            const catColors: Record<BinauralPresetCategory, string> = {
              'Focus': '#32FF7E',
              'Relax': '#00F2FF',
              'Energize': '#FF0055',
              'Deep Sleep': '#A855F7',
            };
            const col = catColors[preset.category];

            return (
              <button
                key={preset.id}
                onClick={() => {
                  audioEngine.setFlowState({
                    carrierFreq: preset.carrier,
                    beatFreq: preset.beat,
                    band: preset.band,
                    isEnabled: true,
                  });
                  onShowNotification?.(`⚡ Loaded ${preset.name} [${preset.category}]`);
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-left shrink-0 font-mono transition-all cursor-pointer flex items-center gap-2 ${
                  isLoaded
                    ? 'bg-[#0B0B0C] border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                    : 'bg-[#0B0B0C] border-[#232326] hover:border-white/30'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col }} />
                <span className="text-[11px] font-bold text-white whitespace-nowrap">{preset.name}</span>
                <span className="text-[9px] text-[#94949E] whitespace-nowrap">({preset.beat}Hz)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-MODULE NAVIGATION TABS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <button
          onClick={() => setActiveTab('mangler')}
          className={`px-3 py-2.5 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'mangler'
              ? 'bg-[#FF0055] text-black shadow-[0_0_15px_rgba(255,0,85,0.4)]'
              : 'bg-[#141416] text-[#94949E] hover:text-white border border-[#232326]'
          }`}
        >
          <Disc className="w-4 h-4" />
          <span>TAPE & GLITCH</span>
        </button>

        <button
          onClick={() => setActiveTab('flow')}
          className={`px-3 py-2.5 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'flow'
              ? 'bg-[#00F2FF] text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]'
              : 'bg-[#141416] text-[#94949E] hover:text-white border border-[#232326]'
          }`}
        >
          <Waves className="w-4 h-4" />
          <span>FLOW STATE (BINAURAL)</span>
        </button>

        <button
          onClick={() => setActiveTab('euclidean')}
          className={`px-3 py-2.5 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'euclidean'
              ? 'bg-[#32FF7E] text-black shadow-[0_0_15px_rgba(50,255,126,0.4)]'
              : 'bg-[#141416] text-[#94949E] hover:text-white border border-[#232326]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>EUCLIDEAN MATRIX</span>
        </button>

        <button
          onClick={() => setActiveTab('scope')}
          className={`px-3 py-2.5 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'scope'
              ? 'bg-[#FF0055] text-white shadow-[0_0_15px_rgba(255,0,85,0.4)]'
              : 'bg-[#141416] text-[#94949E] hover:text-white border border-[#232326]'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>LISSAJOUS RADAR</span>
        </button>

        <button
          onClick={() => setActiveTab('formant')}
          className={`px-3 py-2.5 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'formant'
              ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
              : 'bg-[#141416] text-[#94949E] hover:text-white border border-[#232326]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>OCCULT FORMANT VOX</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* MODULE 1: LIVE GLITCH & TAPE MANGLER */}
      {/* ========================================================= */}
      {activeTab === 'mangler' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Performance Triggers Left Column */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Tape Brake & Halftime */}
            <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-3">
              <span className="text-[10px] font-mono tracking-wider text-[#94949E] uppercase">Tape Braking & Pitch Drag</span>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onMouseDown={() => audioEngine.triggerTapeStop(1.6, false)}
                  onMouseUp={() => audioEngine.spoolUpTape(bpm, 0.7)}
                  className={`p-4 rounded-lg font-mono text-xs font-black uppercase flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    ritualState.isTapeStopping
                      ? 'bg-[#FF0055] text-black border-[#FF0055] shadow-[0_0_20px_#FF0055]'
                      : 'bg-[#0B0B0C] text-[#FF0055] border-[#FF0055]/50 hover:bg-[#FF0055]/10'
                  }`}
                >
                  <Disc className={`w-6 h-6 ${ritualState.isTapeStopping ? 'animate-spin' : ''}`} />
                  <span>VINYL TAPE STOP</span>
                  <span className="text-[9px] font-normal text-white/70">Hold to drag to halt</span>
                </button>

                <button
                  onClick={() => audioEngine.toggleHalftime()}
                  className={`p-4 rounded-lg font-mono text-xs font-black uppercase flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    ritualState.isHalftime
                      ? 'bg-[#00F2FF] text-black border-[#00F2FF] shadow-[0_0_20px_#00F2FF]'
                      : 'bg-[#0B0B0C] text-[#00F2FF] border-[#00F2FF]/50 hover:bg-[#00F2FF]/10'
                  }`}
                >
                  <RotateCcw className="w-6 h-6" />
                  <span>CHOPPED HALFTIME</span>
                  <span className="text-[9px] font-normal text-white/70">50% Speed + Tape Filter</span>
                </button>
              </div>

              {/* Momentary Glitch Stutter Repeater Pads */}
              <div className="mt-2 flex flex-col gap-2">
                <span className="text-[10px] font-mono tracking-wider text-[#94949E] uppercase">Live Stutter Repeater Pads (Momentary)</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['1/16', '1/32', '1/8T'] as const).map((div) => {
                    const isStutteringThis = ritualState.stutterActive && ritualState.stutterDivision === div;
                    return (
                      <button
                        key={div}
                        onMouseDown={() => audioEngine.setStutter(true, div)}
                        onMouseUp={() => audioEngine.setStutter(false, div)}
                        onMouseLeave={() => {
                          if (ritualState.stutterActive) audioEngine.setStutter(false, div);
                        }}
                        className={`py-3 px-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border ${
                          isStutteringThis
                            ? 'bg-[#32FF7E] text-black border-[#32FF7E] shadow-[0_0_15px_#32FF7E] animate-pulse'
                            : 'bg-[#0B0B0C] text-white border-[#232326] hover:border-[#32FF7E]'
                        }`}
                      >
                        ⚡ {div} LOOP
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Salem Void Reverb & Tape Ruin Sliders */}
            <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-4">
              <span className="text-[10px] font-mono tracking-wider text-[#94949E] uppercase">Salem Void Reverb & Tape Cassette Ruin</span>

              {/* Void Reverb */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white">Salem Void (Cathedral Impulse):</span>
                  <span className="text-[#FF0055] font-bold">{(ritualState.voidReverbWet * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={ritualState.voidReverbWet}
                  onChange={(e) => audioEngine.setVoidReverb(parseFloat(e.target.value))}
                  className="w-full accent-[#FF0055] cursor-pointer"
                />
              </div>

              {/* Tape Drive */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white">Tape Saturation Drive:</span>
                  <span className="text-[#32FF7E] font-bold">{(ritualState.tapeRuinDrive * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={ritualState.tapeRuinDrive}
                  onChange={(e) => audioEngine.setTapeRuin(parseFloat(e.target.value), ritualState.tapeFlutter)}
                  className="w-full accent-[#32FF7E] cursor-pointer"
                />
              </div>

              {/* Tape Wow & Flutter */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white">Cassette Wow & Pitch Flutter:</span>
                  <span className="text-[#00F2FF] font-bold">{(ritualState.tapeFlutter * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={ritualState.tapeFlutter}
                  onChange={(e) => audioEngine.setTapeRuin(ritualState.tapeRuinDrive, parseFloat(e.target.value))}
                  className="w-full accent-[#00F2FF] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Tactical XY Vector Touchpad Right Column */}
          <div className="lg:col-span-6 bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-[#94949E] uppercase">Tactile XY Vector Filter</span>
                <p className="text-xs text-white font-mono">X = Cutoff (120Hz-18kHz) | Y = Resonance Q &amp; Drive</p>
              </div>
              <button
                onClick={() => audioEngine.setRitualXY(0.5, 0.5, false)}
                className="px-2 py-1 text-[10px] font-mono bg-[#0B0B0C] border border-[#232326] text-[#94949E] hover:text-white rounded"
              >
                RESET
              </button>
            </div>

            {/* The Touchpad Surface */}
            <div
              ref={xyPadRef}
              onMouseDown={handleXYDown}
              onMouseMove={(e) => isDraggingXY && handleXYMove(e)}
              onMouseUp={handleXYUp}
              onMouseLeave={handleXYUp}
              className="relative w-full h-[280px] bg-[#0B0B0C] border-2 border-[#232326] rounded-xl overflow-hidden cursor-crosshair select-none flex items-center justify-center"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px',
              }}
            >
              {/* Center Cross Reticle */}
              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/10" />
              <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-white/10" />

              {/* Glowing Vector Puck */}
              <div
                className={`absolute w-7 h-7 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white pointer-events-none transition-transform flex items-center justify-center ${
                  ritualState.xyPad.active
                    ? 'bg-[#FF0055] shadow-[0_0_20px_#FF0055] scale-125'
                    : 'bg-[#FF0055]/50 scale-100'
                }`}
                style={{
                  left: `${ritualState.xyPad.x * 100}%`,
                  bottom: `${ritualState.xyPad.y * 100}%`,
                }}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>

              {/* Coordinates Overlay */}
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded font-mono text-[10px] text-[#00F2FF] border border-[#232326]">
                X: {(ritualState.xyPad.x * 100).toFixed(0)}% | Y: {(ritualState.xyPad.y * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODULE 2: FLOW STATE NEURAL & BINAURAL BEAT GENERATOR */}
      {/* ========================================================= */}
      {activeTab === 'flow' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Controls Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Master Flow Switch */}
            <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                  flowState.isEnabled 
                    ? 'bg-[#00F2FF]/20 border-[#00F2FF] text-[#00F2FF] shadow-[0_0_15px_#00F2FF]' 
                    : 'bg-[#0B0B0C] border-[#232326] text-[#666]'
                }`}>
                  <Waves className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-white uppercase">NEURAL BINAURAL ENGINE</h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#94949E]">
                    <Headphones className="w-3.5 h-3.5 text-[#00F2FF]" />
                    <span>Stereo Headphones Required • Runs in Background</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => audioEngine.setFlowState({ isEnabled: !flowState.isEnabled })}
                className={`px-5 py-2.5 rounded-lg font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                  flowState.isEnabled
                    ? 'bg-[#00F2FF] text-black border-[#00F2FF] shadow-[0_0_20px_#00F2FF]'
                    : 'bg-[#0B0B0C] text-white border-[#232326] hover:border-[#00F2FF]'
                }`}
              >
                {flowState.isEnabled ? 'FLOW ACTIVE' : 'ENGAGE FLOW'}
              </button>
            </div>

            {/* Brainwave Bands Selection */}
            <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-3">
              <span className="text-[10px] font-mono tracking-wider text-[#94949E] uppercase">Brainwave Frequency Target Band</span>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { id: 'theta', label: 'THETA', range: '4-8Hz', desc: 'Hypnagogic Reverie', defaultBeat: 6.0, color: '#00F2FF' },
                  { id: 'alpha', label: 'ALPHA', range: '8-14Hz', desc: 'Flow State & Focus', defaultBeat: 10.0, color: '#32FF7E', rec: true },
                  { id: 'beta', label: 'BETA', range: '14-30Hz', desc: 'Laser Concentration', defaultBeat: 18.0, color: '#FFB800' },
                  { id: 'gamma', label: 'GAMMA', range: '30-50Hz', desc: 'Hyper Drive & Acuity', defaultBeat: 40.0, color: '#FF0055' },
                  { id: 'delta', label: 'DELTA', range: '0.5-4Hz', desc: 'Trance Reset', defaultBeat: 2.5, color: '#A855F7' },
                ].map((band) => {
                  const isBandActive = flowState.isEnabled && flowState.band === band.id;
                  return (
                    <button
                      key={band.id}
                      onClick={() => {
                        if (isBandActive) {
                          audioEngine.setFlowState({ isEnabled: false });
                          onShowNotification?.(`Binaural Flow State disengaged`);
                        } else {
                          audioEngine.setFlowState({ isEnabled: true, band: band.id as BrainwaveBand, beatFreq: band.defaultBeat });
                          onShowNotification?.(`⚡ ${band.label} Flow State Engaged (${band.defaultBeat}Hz)`);
                        }
                      }}
                      className={`p-3 rounded-lg font-mono flex flex-col items-center justify-center text-center border transition-all cursor-pointer ${
                        isBandActive
                          ? 'text-white'
                          : 'bg-[#0B0B0C] border-[#232326] text-[#94949E] hover:border-white/30'
                      }`}
                      style={{
                        backgroundColor: isBandActive ? 'rgba(11, 11, 12, 0.95)' : undefined,
                        borderColor: isBandActive ? band.color : undefined,
                        boxShadow: isBandActive ? `0 0 14px ${band.color}55` : undefined,
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black" style={{ color: isBandActive ? band.color : 'white' }}>{band.label}</span>
                        {isBandActive && <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: band.color }} />}
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: isBandActive ? band.color : '#00F2FF' }}>{band.range}</span>
                      <span className="text-[9px] text-[#94949E] mt-1">{band.desc}</span>
                      <span className={`mt-1.5 text-[8.5px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                        isBandActive ? 'text-black' : 'text-[#666] border-[#232326]'
                      }`}
                      style={{
                        backgroundColor: isBandActive ? band.color : undefined,
                        borderColor: isBandActive ? band.color : undefined,
                      }}>
                        {isBandActive ? 'ACTIVE' : 'ENABLE'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categorized Flow State & Solfeggio Presets */}
            <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-3 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232326] pb-3">
                <div>
                  <span className="text-[10px] tracking-wider text-[#94949E] uppercase block">
                    BINAURAL PRESETS &amp; FREQUENCY PROFILES
                  </span>
                  <span className="text-xs text-white font-bold">
                    {presetCategory === 'All' ? 'All Presets' : `${presetCategory} Mode`} ({filteredPresets.length} available)
                  </span>
                </div>

                {/* Dropdown Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#94949E] uppercase font-bold">CATEGORY:</span>
                  <select
                    value={presetCategory}
                    onChange={(e) => setPresetCategory(e.target.value as any)}
                    className="p-1.5 px-3 rounded-lg bg-[#0B0B0C] border border-[#232326] text-white font-mono text-xs focus:border-[#00F2FF] outline-none cursor-pointer"
                  >
                    <option value="All">All Categories ({FLOW_PRESETS.length})</option>
                    <option value="Focus">Focus (Alpha &amp; Beta • Deep Work &amp; Flow)</option>
                    <option value="Relax">Relax (Alpha &amp; Theta • Meditation &amp; Calm)</option>
                    <option value="Energize">Energize (Beta &amp; Gamma • Peak Alertness &amp; Hyper-Drive)</option>
                    <option value="Deep Sleep">Deep Sleep (Delta • Somatic Reset &amp; Dream Stasis)</option>
                  </select>
                </div>
              </div>

              {/* Category Quick Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['All', 'Focus', 'Relax', 'Energize', 'Deep Sleep'] as const).map((cat) => {
                  const isSelected = presetCategory === cat;
                  const count = cat === 'All' ? FLOW_PRESETS.length : FLOW_PRESETS.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setPresetCategory(cat)}
                      className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-white text-black border-white shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                          : 'bg-[#0B0B0C] text-[#94949E] border-[#232326] hover:text-white hover:border-white/30'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[8.5px] px-1 py-0.2 rounded font-black ${isSelected ? 'bg-black/20 text-black' : 'bg-[#1F1F24] text-[#94949E]'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-1">
                {filteredPresets.map((preset) => {
                  const isLoaded = flowState.isEnabled && Math.abs(flowState.carrierFreq - preset.carrier) < 1 && Math.abs(flowState.beatFreq - preset.beat) < 0.2;
                  const catColors: Record<BinauralPresetCategory, string> = {
                    'Focus': '#32FF7E',
                    'Relax': '#00F2FF',
                    'Energize': '#FF0055',
                    'Deep Sleep': '#A855F7',
                  };
                  const col = catColors[preset.category];

                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        audioEngine.setFlowState({
                          carrierFreq: preset.carrier,
                          beatFreq: preset.beat,
                          band: preset.band,
                          isEnabled: true,
                        });
                        onShowNotification?.(`⚡ Activated ${preset.name} [${preset.category}]`);
                      }}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isLoaded
                          ? 'bg-[#0B0B0C] border-white shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                          : 'bg-[#0B0B0C] border-[#232326] hover:border-white/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-black text-white">{preset.name}</span>
                          <span
                            className="text-[8.5px] px-1.5 py-0.2 rounded font-black uppercase border"
                            style={{
                              color: col,
                              borderColor: `${col}55`,
                              backgroundColor: `${col}15`,
                            }}
                          >
                            {preset.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-[#00F2FF] font-bold">{preset.carrier}Hz Carrier</span>
                          <span className="text-[#94949E]">+</span>
                          <span className="text-[#32FF7E] font-bold">{preset.beat}Hz {preset.band.toUpperCase()}</span>
                        </div>
                        <p className="text-[9.5px] text-[#94949E] line-clamp-2 mt-1 leading-relaxed">
                          {preset.desc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#1F1F24] flex items-center justify-between text-[9px]">
                        <span className="text-[#94949E]">{isLoaded ? 'CURRENTLY ACTIVE' : 'CLICK TO LOAD'}</span>
                        {isLoaded && <Check className="w-3 h-3 text-[#32FF7E]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Visualizer & Fine Sliders */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Real-time Oscilloscope / Interferometry Canvas */}
            <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#94949E] uppercase">Binaural Wave Interferometry</span>
                <span className="text-[#00F2FF] font-bold">L: {Math.round(flowState.carrierFreq - flowState.beatFreq / 2)}Hz | R: {Math.round(flowState.carrierFreq + flowState.beatFreq / 2)}Hz</span>
              </div>
              
              <canvas
                ref={brainwaveCanvasRef}
                width={400}
                height={160}
                className="w-full h-[140px] bg-[#0B0B0C] border border-[#232326] rounded-lg"
              />
              <span className="text-[9px] font-mono text-center text-[#94949E]">
                Green phosphor line shows the brain entrainment envelope perceived by your auditory cortex.
              </span>
            </div>

            {/* Fine Tuning Controls */}
            <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-3 font-mono text-xs">
              {/* Carrier Frequency Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-white">Carrier Frequency:</span>
                  <span className="text-[#00F2FF] font-bold">{flowState.carrierFreq.toFixed(1)} Hz</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="0.5"
                  value={flowState.carrierFreq}
                  onChange={(e) => audioEngine.setFlowState({ carrierFreq: parseFloat(e.target.value) })}
                  className="w-full accent-[#00F2FF] cursor-pointer"
                />
              </div>

              {/* Beat Frequency Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-white">Binaural Beat Difference:</span>
                  <span className="text-[#32FF7E] font-bold">{flowState.beatFreq.toFixed(1)} Hz ({flowState.band.toUpperCase()})</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="50"
                  step="0.1"
                  value={flowState.beatFreq}
                  onChange={(e) => audioEngine.setFlowState({ beatFreq: parseFloat(e.target.value) })}
                  className="w-full accent-[#32FF7E] cursor-pointer"
                />
              </div>

              {/* Master Flow Volume Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-white">Tone Volume:</span>
                  <span className="text-[#FF0055] font-bold">{(flowState.volume * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={flowState.volume}
                  onChange={(e) => audioEngine.setFlowState({ volume: parseFloat(e.target.value) })}
                  className="w-full accent-[#FF0055] cursor-pointer"
                />
              </div>

              {/* Isochronic Pulse Modulation Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-[#232326]">
                <div>
                  <span className="text-white font-bold block">Isochronic Amplitude Pulse</span>
                  <span className="text-[10px] text-[#94949E]">Rhythmic pulse for speakers or deeper focus</span>
                </div>
                <input
                  type="checkbox"
                  checked={flowState.isochronic}
                  onChange={(e) => audioEngine.setFlowState({ isochronic: e.target.checked })}
                  className="w-4 h-4 accent-[#00F2FF] cursor-pointer"
                />
              </div>

              {/* Ambient Noise Bed Selector */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#232326]">
                <div className="flex justify-between">
                  <span className="text-white">Noise Masking Bed:</span>
                  <span className="text-[#00F2FF] uppercase">{flowState.noiseType} ({(flowState.noiseVolume * 100).toFixed(0)}%)</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['none', 'pink', 'brown', 'void'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => audioEngine.setFlowState({ noiseType: type })}
                      className={`py-1 rounded font-mono text-[10px] uppercase border transition-all cursor-pointer ${
                        flowState.noiseType === type
                          ? 'bg-[#00F2FF] text-black border-[#00F2FF] font-bold'
                          : 'bg-[#0B0B0C] text-[#94949E] border-[#232326]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {flowState.noiseType !== 'none' && (
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={flowState.noiseVolume}
                    onChange={(e) => audioEngine.setFlowState({ noiseVolume: parseFloat(e.target.value) })}
                    className="w-full accent-[#00F2FF] cursor-pointer"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODULE 3: EUCLIDEAN POLYRHYTHM & DARK MUTATION MATRIX */}
      {/* ========================================================= */}
      {activeTab === 'euclidean' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Target Track & Mathematical Parameters */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-3">
              <span className="text-[10px] font-mono tracking-wider text-[#94949E] uppercase">Target Track Destination</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {tracks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTargetTrackId(t.id)}
                    className={`p-2.5 rounded-lg border text-left font-mono transition-all cursor-pointer ${
                      targetTrackId === t.id
                        ? 'bg-[#32FF7E]/15 border-[#32FF7E] text-white shadow-[0_0_10px_rgba(50,255,126,0.2)]'
                        : 'bg-[#0B0B0C] border-[#232326] text-[#94949E] hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="text-xs font-bold truncate">{t.name}</span>
                    </div>
                    <span className="text-[10px] text-[#94949E] uppercase">{t.type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bjorklund Euclidean Sliders */}
            <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-3 font-mono text-xs">
              <span className="text-[10px] tracking-wider text-[#94949E] uppercase">Bjorklund Euclidean Algorithm</span>
              
              {/* Pulses */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-white">Active Pulses:</span>
                  <span className="text-[#32FF7E] font-bold">{euclidPulses} Hits</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={euclidSteps}
                  value={euclidPulses}
                  onChange={(e) => setEuclidPulses(parseInt(e.target.value))}
                  className="w-full accent-[#32FF7E] cursor-pointer"
                />
              </div>

              {/* Total Steps */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-white">Total Steps:</span>
                  <span className="text-[#00F2FF] font-bold">{euclidSteps} Steps</span>
                </div>
                <div className="flex gap-2">
                  {[8, 12, 16, 24, 32].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setEuclidSteps(st);
                        if (euclidPulses > st) setEuclidPulses(st);
                      }}
                      className={`flex-1 py-1 rounded text-xs border cursor-pointer ${
                        euclidSteps === st
                          ? 'bg-[#00F2FF] text-black border-[#00F2FF] font-bold'
                          : 'bg-[#0B0B0C] text-[#94949E] border-[#232326]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase Rotation */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-white">Phase Rotation Offset:</span>
                  <span className="text-[#FF0055] font-bold">{euclidRotation}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={euclidSteps - 1}
                  value={euclidRotation}
                  onChange={(e) => setEuclidRotation(parseInt(e.target.value))}
                  className="w-full accent-[#FF0055] cursor-pointer"
                />
              </div>

              {/* Apply Button */}
              <button
                onClick={handleApplyEuclideanToTrack}
                className="mt-2 py-3 rounded-lg bg-[#32FF7E] text-black font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_#32FF7E] hover:bg-[#32FF7E]/90 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>INJECT EUCLIDEAN PATTERN TO TRACK</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visualizer & Pattern Corruption */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Step Grid Display */}
            <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-3 font-mono">
              <div className="flex justify-between text-xs">
                <span className="text-[#94949E] uppercase">Euclidean Step Matrix Preview</span>
                <span className="text-[#32FF7E] font-bold">E({euclidPulses}, {euclidSteps}, {euclidRotation})</span>
              </div>

              {/* 32 Step Visual Indicator */}
              <div className="grid grid-cols-8 md:grid-cols-16 gap-1.5 p-3 bg-[#0B0B0C] border border-[#232326] rounded-lg">
                {currentEuclidean.steps.map((isActive, idx) => (
                  <div
                    key={idx}
                    className={`h-9 rounded flex items-center justify-center text-[10px] font-bold border transition-all ${
                      isActive
                        ? 'bg-[#32FF7E] text-black border-[#32FF7E] shadow-[0_0_8px_#32FF7E]'
                        : 'bg-[#141416] text-[#444] border-[#232326]'
                    }`}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Dark Pattern Mutation / "Corrupt †" Engine */}
            <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#FF0055]" />
                <span className="font-bold text-white uppercase">DARK PATTERN MUTATION (CORRUPT †)</span>
              </div>
              <p className="text-[11px] text-[#94949E]">
                Injects dark syncopations, ghost hits, stutters, and occult timing corruption into active tracks.
              </p>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-white">Corruption Chaos Amount:</span>
                  <span className="text-[#FF0055] font-bold">{(mutationChaos * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.9"
                  step="0.05"
                  value={mutationChaos}
                  onChange={(e) => setMutationChaos(parseFloat(e.target.value))}
                  className="w-full accent-[#FF0055] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white">Preserve Fundamental Downbeats:</span>
                <input
                  type="checkbox"
                  checked={preserveDownbeats}
                  onChange={(e) => setPreserveDownbeats(e.target.checked)}
                  className="w-4 h-4 accent-[#FF0055] cursor-pointer"
                />
              </div>

              <button
                onClick={handleMutateTargetTrack}
                className="py-3 rounded-lg bg-[#FF0055] text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_#FF0055] hover:bg-[#FF0055]/90 cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>CORRUPT PATTERN †</span>
              </button>
            </div>

            {/* Occult Scale Melodic Generator */}
            <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-3 font-mono text-xs">
              <span className="text-[10px] tracking-wider text-[#94949E] uppercase">Occult Scale Quantizer</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#94949E] text-[10px] block mb-1">Scale Mode</span>
                  <select
                    value={selectedOccultScale}
                    onChange={(e) => setSelectedOccultScale(e.target.value)}
                    className="w-full p-2 bg-[#0B0B0C] border border-[#232326] text-white rounded text-xs"
                  >
                    {OCCULT_SCALES.map((sc) => (
                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[#94949E] text-[10px] block mb-1">Root Key</span>
                  <select
                    value={rootNote}
                    onChange={(e) => setRootNote(e.target.value)}
                    className="w-full p-2 bg-[#0B0B0C] border border-[#232326] text-white rounded text-xs"
                  >
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODULE 4: HOLOGRAPHIC VECTOR SCOPE & LISSAJOUS RADAR */}
      {/* ========================================================= */}
      {activeTab === 'scope' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Visualizer Canvas */}
          <div className="lg:col-span-8 bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#FF0055]" />
                <span className="font-mono text-xs font-bold text-white uppercase">60FPS STEREO LISSAJOUS VECTOR RADAR</span>
              </div>

              {/* Mode Selector */}
              <div className="flex gap-1.5 font-mono text-[10px]">
                {(['lissajous', 'oscilloscope', 'radar'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setScopeMode(m)}
                    className={`px-3 py-1 rounded uppercase border cursor-pointer ${
                      scopeMode === m
                        ? 'bg-[#FF0055] text-black border-[#FF0055] font-bold'
                        : 'bg-[#0B0B0C] text-[#94949E] border-[#232326]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full h-[360px] bg-[#0B0B0C] border-2 border-[#232326] rounded-xl overflow-hidden flex items-center justify-center">
              <canvas
                ref={scopeCanvasRef}
                width={560}
                height={360}
                className="w-full h-full block"
              />
            </div>
          </div>

          {/* Telemetry & Phase Analysis Right Column */}
          <div className="lg:col-span-4 flex flex-col gap-4 font-mono text-xs">
            <div className="bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-3">
              <span className="text-[10px] tracking-wider text-[#94949E] uppercase">Stereo Phase Correlation Index</span>
              
              <div className="p-3 bg-[#0B0B0C] border border-[#232326] rounded-lg flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-white">Correlation:</span>
                  <span className={`font-bold ${phaseCorrelation > 0.6 ? 'text-[#32FF7E]' : phaseCorrelation > 0 ? 'text-[#00F2FF]' : 'text-[#FF0055]'}`}>
                    {phaseCorrelation > 0 ? `+${phaseCorrelation}` : phaseCorrelation}
                  </span>
                </div>

                {/* Meter Bar (-1 to +1) */}
                <div className="relative w-full h-3 bg-[#1F1F24] rounded overflow-hidden">
                  <div
                    className={`absolute top-0 bottom-0 w-2 rounded ${
                      phaseCorrelation < 0 ? 'bg-[#FF0055]' : 'bg-[#32FF7E]'
                    }`}
                    style={{
                      left: `${((phaseCorrelation + 1) / 2) * 100}%`,
                    }}
                  />
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30" />
                </div>
                <div className="flex justify-between text-[9px] text-[#94949E]">
                  <span>-1.0 (Out of Phase)</span>
                  <span>0 (Wide)</span>
                  <span>+1.0 (Mono)</span>
                </div>
              </div>

              {/* Stereo Width */}
              <div className="p-3 bg-[#0B0B0C] border border-[#232326] rounded-lg flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-white">Estimated Stereo Spread:</span>
                  <span className="text-[#00F2FF] font-bold">{stereoWidth}%</span>
                </div>
                <div className="w-full h-2 bg-[#1F1F24] rounded overflow-hidden">
                  <div className="h-full bg-[#00F2FF]" style={{ width: `${stereoWidth}%` }} />
                </div>
              </div>

              <div className="text-[10px] text-[#94949E] leading-relaxed">
                The vector scope plots the discrete left channel against the right channel at 60 fps to identify phase cancelation, mono compatibility, and dynamic spatial width.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODULE 5: OCCULT FORMANT VOX & RITUAL DRONE */}
      {/* ========================================================= */}
      {activeTab === 'formant' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Formant Vocal Choir Pads */}
          <div className="lg:col-span-8 bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-[#94949E] uppercase">Real-Time Formant Choir Pads</span>
                <p className="text-xs text-white font-mono">Synthesizes dual-saw formant resonance filters (F1/F2 acoustic human formants)</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#94949E]">DRONE SUSTAIN:</span>
                <input
                  type="checkbox"
                  checked={isDroneHolding}
                  onChange={(e) => setIsDroneHolding(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { vowel: 'A', name: 'Cathedral Choir', desc: 'F1: 800Hz / F2: 1200Hz' },
                { vowel: 'E', name: 'Cyber Shriek', desc: 'F1: 400Hz / F2: 2200Hz' },
                { vowel: 'I', name: 'Hypnotic Siren', desc: 'F1: 280Hz / F2: 2600Hz' },
                { vowel: 'O', name: 'Deep Incantation', desc: 'F1: 500Hz / F2: 900Hz' },
                { vowel: 'U', name: 'Occult Resonance', desc: 'F1: 320Hz / F2: 700Hz' },
                { vowel: 'AUM', name: 'Sacred Sub OM †', desc: 'Sub-octave drone + 600Hz' },
                { vowel: 'MORTIS', name: 'Vox Mortis Low', desc: 'Deep crushed witch chant' },
                { vowel: 'WITCH', name: 'Cyber Witch Shimmer', desc: 'High resonant shimmer' },
              ].map((item) => {
                const isActive = activeVowel === item.vowel;
                return (
                  <button
                    key={item.vowel}
                    onMouseDown={() => handleTriggerFormant(item.vowel)}
                    className={`p-4 rounded-xl font-mono text-left transition-all cursor-pointer border flex flex-col gap-1 ${
                      isActive
                        ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.6)] scale-95'
                        : 'bg-[#0B0B0C] border-[#232326] text-white hover:border-purple-500/60'
                    }`}
                  >
                    <span className="text-lg font-black text-purple-400">{item.vowel}</span>
                    <span className="text-xs font-bold">{item.name}</span>
                    <span className="text-[9px] text-[#94949E]">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drone Frequency & Pitch Controls */}
          <div className="lg:col-span-4 bg-[#141416] border border-[#232326] p-4 rounded-xl flex flex-col gap-4 font-mono text-xs">
            <span className="text-[10px] tracking-wider text-[#94949E] uppercase">Drone Fundamental Pitch</span>

            <div className="p-3 bg-[#0B0B0C] border border-[#232326] rounded-lg flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-white">Drone Carrier Frequency:</span>
                <span className="text-purple-400 font-bold">{formantDronePitch.toFixed(1)} Hz</span>
              </div>
              <input
                type="range"
                min="32.7"
                max="261.6"
                step="0.5"
                value={formantDronePitch}
                onChange={(e) => setFormantDronePitch(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { note: 'C1', freq: 32.7 },
                { note: 'F1', freq: 43.65 },
                { note: 'A1', freq: 55.0 },
                { note: 'C2', freq: 65.41 },
                { note: 'E2', freq: 82.41 },
                { note: 'G2', freq: 98.0 },
                { note: 'A2', freq: 110.0 },
                { note: 'C3', freq: 130.81 },
              ].map((p) => (
                <button
                  key={p.note}
                  onClick={() => setFormantDronePitch(p.freq)}
                  className={`py-1.5 rounded text-[10px] border cursor-pointer ${
                    Math.abs(formantDronePitch - p.freq) < 0.5
                      ? 'bg-purple-600 text-white border-purple-400 font-bold'
                      : 'bg-[#0B0B0C] text-[#94949E] border-[#232326]'
                  }`}
                >
                  {p.note}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                const target = tracks.find((t) => t.id === targetTrackId);
                if (!target) return;
                // Generate 8-step formant chant pattern into target synth lead
                const notes: MidiNote[] = [
                  { id: `vox_1`, pitch: 'C2', step: 0, duration: 4, velocity: 0.9 },
                  { id: `vox_2`, pitch: 'D#2', step: 8, duration: 4, velocity: 0.85 },
                  { id: `vox_3`, pitch: 'F2', step: 16, duration: 4, velocity: 0.9 },
                  { id: `vox_4`, pitch: 'G#2', step: 24, duration: 4, velocity: 0.95 },
                ];
                onUpdateTrackMidiNotes(target.id, notes);
                onShowNotification?.(`† Occult Formant Chant sequence exported to ${target.name}`);
              }}
              className="py-3 rounded-lg bg-purple-600 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:bg-purple-500 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>EXPORT CHANT PATTERN TO SYNTH</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
