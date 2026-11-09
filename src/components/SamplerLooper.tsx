import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, Play, Square, Mic, MicOff, RotateCcw, Sliders, Upload, 
  RefreshCw, Music, Check, Settings, Trash2, ArrowRight, HelpCircle,
  Plus, Download, Sparkles, Radio, Wand2, Activity, Keyboard, FastForward,
  Scissors, Crop, ZoomIn, ZoomOut, MoveHorizontal, Disc, VolumeX
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

export interface SamplerPad {
  id: string;
  name: string;
  key: string; // Key shortcut '1', '2', '3', '4', '5', etc.
  color: string;
  bgColor: string;
  borderColor: string;
  buffer: AudioBuffer | null;
  volume: number; // 0..1.5
  pitch: number; // -12..12 semitones
  loop: boolean;
  reversed: boolean;
  trimStart: number; // 0..1 percentage
  trimEnd: number; // 0..1 percentage
  fadeInMs?: number; // 0..100 ms
  fadeOutMs?: number; // 0..100 ms
  filterCutoff: number; // 200..20000 Hz
  isCustomMic?: boolean;
}

interface SamplerLooperProps {
  onShowNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Function to generate high-fidelity default samples using oscillator math
function generateSynthesizedBuffer(ctx: AudioContext, type: 'sub' | 'snare' | 'pluck' | 'chop'): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  
  if (type === 'sub') {
    const duration = 1.2;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const freq = 40 + (110 * Math.exp(-t * 5.0));
      const phase = 2 * Math.PI * freq * t;
      const amp = Math.exp(-t * 2.0);
      data[i] = Math.tanh(Math.sin(phase) * 1.6) * amp;
    }
    return buffer;
  }
  
  if (type === 'snare') {
    const duration = 0.4;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const noise = Math.random() * 2 - 1;
      const amp = Math.exp(-t * 7.5);
      const snareTone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 15.0) * 0.45;
      data[i] = (noise * 0.5 + snareTone) * amp;
    }
    return buffer;
  }
  
  if (type === 'pluck') {
    const duration = 1.0;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);
    const freqs = [196.00, 246.94, 293.66, 392.00]; // G Major chord
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let val = 0;
      freqs.forEach((freq) => {
        val += Math.sin(2 * Math.PI * freq * t) * 0.25;
      });
      const amp = Math.exp(-t * 4.5);
      data[i] = val * amp;
    }
    return buffer;
  }
  
  // Synthesize a vocal vowel chop-like synth pluck
  const duration = 0.55;
  const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const vibrato = Math.sin(2 * Math.PI * 6.5 * t) * 12.0;
    const baseFreq = 330.0; // E4
    const freq = baseFreq + vibrato;
    const wave = Math.sin(2 * Math.PI * freq * t);
    const wave2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.15;
    const amp = Math.exp(-t * 6.0);
    data[i] = Math.tanh((wave + wave2) * 1.3) * amp * 0.7;
  }
  return buffer;
}

// Function to reverse AudioBuffer data
function cloneAndReverseBuffer(ctx: AudioContext, buffer: AudioBuffer): AudioBuffer {
  const numChannels = buffer.numberOfChannels;
  const reversed = ctx.createBuffer(numChannels, buffer.length, buffer.sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    const reversedData = reversed.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      reversedData[i] = channelData[buffer.length - 1 - i];
    }
  }
  return reversed;
}

// Function to crop an AudioBuffer between trim points
function cropAudioBuffer(ctx: AudioContext, buffer: AudioBuffer, trimStart: number, trimEnd: number): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const totalLength = buffer.length;
  
  const startSample = Math.max(0, Math.floor(trimStart * totalLength));
  const endSample = Math.min(totalLength, Math.ceil(trimEnd * totalLength));
  const newLength = Math.max(1, endSample - startSample);
  
  const newBuffer = ctx.createBuffer(numChannels, newLength, sampleRate);
  for (let c = 0; c < numChannels; c++) {
    const src = buffer.getChannelData(c);
    const dst = newBuffer.getChannelData(c);
    for (let i = 0; i < newLength; i++) {
      dst[i] = src[startSample + i];
    }
  }
  return newBuffer;
}

// Snap a normalized position to the closest zero-crossing
function snapToZeroCrossing(buffer: AudioBuffer, ratio: number, searchRangeSamples = 600): number {
  const data = buffer.getChannelData(0);
  const total = data.length;
  const targetIndex = Math.floor(ratio * total);
  
  let bestIndex = targetIndex;
  let minDiff = Infinity;
  
  const startSearch = Math.max(0, targetIndex - searchRangeSamples);
  const endSearch = Math.min(total - 2, targetIndex + searchRangeSamples);
  
  for (let i = startSearch; i <= endSearch; i++) {
    const curr = data[i];
    const next = data[i + 1];
    if ((curr <= 0 && next >= 0) || (curr >= 0 && next <= 0)) {
      const diff = Math.abs(i - targetIndex);
      if (diff < minDiff) {
        minDiff = diff;
        bestIndex = Math.abs(curr) < Math.abs(next) ? i : i + 1;
      }
    }
  }
  
  return Math.max(0, Math.min(1, bestIndex / total));
}

// Function to normalize peak volume of an AudioBuffer
function normalizeAudioBuffer(ctx: AudioContext, buffer: AudioBuffer): AudioBuffer {
  const numChannels = buffer.numberOfChannels;
  let maxPeak = 0;
  for (let c = 0; c < numChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > maxPeak) maxPeak = abs;
    }
  }
  if (maxPeak === 0 || maxPeak >= 0.98) return buffer;
  const factor = 0.95 / maxPeak;
  const newBuffer = ctx.createBuffer(numChannels, buffer.length, buffer.sampleRate);
  for (let c = 0; c < numChannels; c++) {
    const src = buffer.getChannelData(c);
    const dst = newBuffer.getChannelData(c);
    for (let i = 0; i < src.length; i++) {
      dst[i] = src[i] * factor;
    }
  }
  return newBuffer;
}

// Function to auto-detect audio start and end silence
function detectTransientBounds(buffer: AudioBuffer, threshold = 0.02): { start: number; end: number } {
  const data = buffer.getChannelData(0);
  const total = data.length;
  let startIndex = 0;
  let endIndex = total - 1;

  for (let i = 0; i < total; i++) {
    if (Math.abs(data[i]) > threshold) {
      startIndex = Math.max(0, i - 100);
      break;
    }
  }

  for (let i = total - 1; i >= 0; i--) {
    if (Math.abs(data[i]) > threshold) {
      endIndex = Math.min(total - 1, i + 100);
      break;
    }
  }

  const trimStart = Math.max(0, Math.min(0.9, startIndex / total));
  const trimEnd = Math.max(trimStart + 0.05, Math.min(1.0, endIndex / total));

  return { start: trimStart, end: trimEnd };
}

// Export AudioBuffer to WAV format
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const length = buffer.length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  const writeString = (v: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      v.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export function SamplerLooper({ onShowNotification }: SamplerLooperProps) {
  const [pads, setPads] = useState<SamplerPad[]>([
    {
      id: 'pad-1',
      name: '808 Sub Kick',
      key: '1',
      color: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]',
      bgColor: 'bg-purple-950/20',
      borderColor: 'border-purple-500/20',
      buffer: null,
      volume: 1.0,
      pitch: 0,
      loop: false,
      reversed: false,
      trimStart: 0,
      trimEnd: 1,
      filterCutoff: 20000,
    },
    {
      id: 'pad-2',
      name: 'Lofi Snare',
      key: '2',
      color: 'bg-pink-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]',
      bgColor: 'bg-pink-950/20',
      borderColor: 'border-pink-500/20',
      buffer: null,
      volume: 1.0,
      pitch: 0,
      loop: false,
      reversed: false,
      trimStart: 0,
      trimEnd: 1,
      filterCutoff: 20000,
    },
    {
      id: 'pad-3',
      name: 'Ambient G-Chord',
      key: '3',
      color: 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]',
      bgColor: 'bg-cyan-950/20',
      borderColor: 'border-cyan-500/20',
      buffer: null,
      volume: 1.0,
      pitch: 0,
      loop: false,
      reversed: false,
      trimStart: 0,
      trimEnd: 1,
      filterCutoff: 20000,
    },
    {
      id: 'pad-4',
      name: 'Synth Vocal Chop',
      key: '4',
      color: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
      bgColor: 'bg-amber-950/20',
      borderColor: 'border-amber-500/20',
      buffer: null,
      volume: 1.0,
      pitch: 0,
      loop: false,
      reversed: false,
      trimStart: 0,
      trimEnd: 1,
      filterCutoff: 20000,
    }
  ]);

  const [selectedPadId, setSelectedPadId] = useState<string>('pad-1');
  const [playingPads, setPlayingPads] = useState<{ [key: string]: boolean }>({});
  
  // Microphone & Recording Suite States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordingTargetPadId, setRecordingTargetPadId] = useState<string>('pad-1');
  const [recordMode, setRecordMode] = useState<'replace' | 'new'>('replace');
  const [maxRecordDuration, setMaxRecordDuration] = useState<number>(2.0); // 1s, 2s, 3s, 5s
  const [countInSeconds, setCountInSeconds] = useState<number | null>(null);
  const [isMonitoringMic, setIsMonitoringMic] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [autoNormalize, setAutoNormalize] = useState<boolean>(true);
  const [autoTrimSilence, setAutoTrimSilence] = useState<boolean>(true);

  // Waveform Interactive Trim State
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x, 2x, 4x
  const [scrollOffset, setScrollOffset] = useState<number>(0); // 0..1 view pan
  const [hoverPositionRatio, setHoverPositionRatio] = useState<number | null>(null);
  const [isHoveringHandle, setIsHoveringHandle] = useState<'start' | 'end' | 'body' | null>(null);
  const [dragMode, setDragMode] = useState<'start' | 'end' | 'region' | 'create' | null>(null);
  const [dragStartMouseX, setDragStartMouseX] = useState<number>(0);
  const [dragInitialTrimStart, setDragInitialTrimStart] = useState<number>(0);
  const [dragInitialTrimEnd, setDragInitialTrimEnd] = useState<number>(1);
  const [playheadRatio, setPlayheadRatio] = useState<number | null>(null);
  const [snapZeroCrossing, setSnapZeroCrossing] = useState<boolean>(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAnimFrameRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const activeSourcesRef = useRef<Map<string, AudioBufferSourceNode[]>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const micMeterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const playheadAnimRef = useRef<number | null>(null);

  const selectedPad = pads.find(p => p.id === selectedPadId) || pads[0];

  // Initialize Default Synthesized Samples on first mount
  useEffect(() => {
    const initDefaultSamples = () => {
      audioEngine.init();
      if (!audioEngine.ctx) return;
      const ctx = audioEngine.ctx;
      
      setPads(prev => prev.map((pad, idx) => {
        if (pad.buffer) return pad;
        let type: 'sub' | 'snare' | 'pluck' | 'chop' = 'sub';
        if (idx === 1) type = 'snare';
        if (idx === 2) type = 'pluck';
        if (idx === 3) type = 'chop';
        
        try {
          const buffer = generateSynthesizedBuffer(ctx, type);
          return { ...pad, buffer };
        } catch (err) {
          console.error("Synthesizing failed:", err);
          return pad;
        }
      }));
    };

    const timer = setTimeout(() => {
      initDefaultSamples();
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // Listen to keyboard shortcuts '1', '2', '3', '4', '5' etc. for instant triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const key = e.key;
      const pad = pads.find(p => p.key === key);
      if (pad) {
        e.preventDefault();
        triggerPad(pad.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pads, playingPads]);

  // Clean up mic streams and animations on unmount
  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (micAnimFrameRef.current) {
        cancelAnimationFrame(micAnimFrameRef.current);
      }
      if (playheadAnimRef.current) {
        cancelAnimationFrame(playheadAnimRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Real-time Mic Meter visualizer
  const updateMicMeter = () => {
    if (!micAnalyserRef.current) return;
    const analyser = micAnalyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    const levelPercent = Math.min(100, Math.round((avg / 128) * 100));
    setMicLevel(levelPercent);

    const canvas = micMeterCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = 3;
        const gap = 1;
        const totalBars = Math.floor(canvas.width / (barWidth + gap));
        const step = Math.floor(dataArray.length / totalBars);

        for (let i = 0; i < totalBars; i++) {
          const val = dataArray[i * step] || 0;
          const barHeight = (val / 255) * canvas.height;
          const x = i * (barWidth + gap);
          const y = canvas.height - barHeight;

          if (val > 200) {
            ctx.fillStyle = '#FF3E82';
          } else if (val > 100) {
            ctx.fillStyle = '#00F0FF';
          } else {
            ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
          }
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }
    }

    micAnimFrameRef.current = requestAnimationFrame(updateMicMeter);
  };

  // Toggle Live Mic Monitoring
  const toggleMicMonitoring = async () => {
    if (isMonitoringMic) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      if (micAnimFrameRef.current) {
        cancelAnimationFrame(micAnimFrameRef.current);
      }
      setIsMonitoringMic(false);
      setMicLevel(0);
      onShowNotification("Microphone monitor stopped.", "info");
    } else {
      if (!navigator?.mediaDevices?.getUserMedia) {
        onShowNotification("Microphone input is not supported in this browser environment.", "info");
        return;
      }
      try {
        audioEngine.init();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const ctx = audioEngine.ctx || new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        micAnalyserRef.current = analyser;

        setIsMonitoringMic(true);
        updateMicMeter();
        onShowNotification("Microphone monitor active! Speak or make a sound to test level.", "success");
      } catch (err: any) {
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach(t => t.stop());
          micStreamRef.current = null;
        }
        if (micAnimFrameRef.current) {
          cancelAnimationFrame(micAnimFrameRef.current);
        }
        setIsMonitoringMic(false);
        setMicLevel(0);

        const isPermissionError = 
          err?.name === 'NotAllowedError' || 
          err?.name === 'SecurityError' ||
          err?.name === 'PermissionDeniedError' ||
          (typeof err?.message === 'string' && (
            err.message.toLowerCase().includes('permission') || 
            err.message.toLowerCase().includes('dismissed') || 
            err.message.toLowerCase().includes('denied') ||
            err.message.toLowerCase().includes('blocked')
          ));

        if (isPermissionError) {
          console.warn("Microphone access prompt dismissed or denied:", err?.message || err);
          onShowNotification("Microphone permission was dismissed or blocked. If inside a preview iframe, open in a new tab or allow microphone in browser settings.", "info");
        } else {
          console.warn("Microphone access unavailable:", err?.message || err);
          onShowNotification("Could not access microphone. Ensure permissions are granted and an audio input device is connected.", "info");
        }
      }
    }
  };

  // Live microphone capture & recording engine
  const startRecordingProcess = (targetPadId: string, asNew: boolean) => {
    if (isRecording) {
      stopRecordingImmediately();
      return;
    }

    setCountInSeconds(3);
    const countInterval = setInterval(() => {
      setCountInSeconds(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countInterval);
          setCountInSeconds(null);
          executeActualRecording(targetPadId, asNew);
          return null;
        }
        return prev - 1;
      });
    }, 600);
  };

  const executeActualRecording = async (targetPadId: string, asNew: boolean) => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      onShowNotification("Microphone input is not supported in this browser environment.", "info");
      setIsRecording(false);
      setCountInSeconds(null);
      return;
    }
    try {
      audioEngine.init();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();

        audioEngine.init();
        if (!audioEngine.ctx) return;
        const ctx = audioEngine.ctx;

        try {
          let decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

          if (autoNormalize) {
            decodedBuffer = normalizeAudioBuffer(ctx, decodedBuffer);
          }

          let trimStart = 0;
          let trimEnd = 1;
          if (autoTrimSilence) {
            const bounds = detectTransientBounds(decodedBuffer);
            trimStart = bounds.start;
            trimEnd = bounds.end;
          }

          if (asNew) {
            const newKey = (pads.length + 1).toString();
            const colors = [
              'bg-[#FF3E82] shadow-[0_0_12px_rgba(255,62,130,0.4)]',
              'bg-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.4)]',
              'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]',
              'bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.4)]'
            ];
            const chosenColor = colors[pads.length % colors.length];
            const newPadId = `pad-${Date.now()}`;
            const newName = `Mic Snippet ${pads.length + 1}`;

            const newPad: SamplerPad = {
              id: newPadId,
              name: newName,
              key: newKey,
              color: chosenColor,
              bgColor: 'bg-black/40',
              borderColor: 'border-white/20',
              buffer: decodedBuffer,
              volume: 1.0,
              pitch: 0,
              loop: false,
              reversed: false,
              trimStart,
              trimEnd,
              filterCutoff: 20000,
              isCustomMic: true,
            };

            setPads(prev => [...prev, newPad]);
            setSelectedPadId(newPadId);
            onShowNotification(`Recorded snippet added as "${newName}"! Drag trim handles to sculpt boundaries.`, "success");
          } else {
            setPads(prev => prev.map(p => p.id === targetPadId ? {
              ...p,
              name: `Mic Snippet #${Math.floor(Math.random() * 900) + 100}`,
              buffer: decodedBuffer,
              trimStart,
              trimEnd,
              isCustomMic: true,
            } : p));
            setSelectedPadId(targetPadId);
            onShowNotification(`Recorded snippet loaded into Pad 0${pads.findIndex(p => p.id === targetPadId) + 1}!`, "success");
          }

        } catch (err) {
          console.warn("Mic decode skipped or failed:", err);
          onShowNotification("Could not decode recorded mic audio.", "info");
        }

        stream.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      };

      mediaRecorderRef.current = mediaRecorder;
      setRecordingTargetPadId(targetPadId);
      setRecordingSeconds(0);
      setIsRecording(true);

      mediaRecorder.start();

      const durationLimit = maxRecordDuration > 0 ? maxRecordDuration : 5.0;
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= durationLimit - 0.1) {
            mediaRecorder.stop();
            clearInterval(recordingIntervalRef.current);
            setIsRecording(false);
            return durationLimit;
          }
          return prev + 0.1;
        });
      }, 100);

      onShowNotification(`Recording microphone audio snippet... (${durationLimit}s limit)`, "info");
    } catch (err: any) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setIsRecording(false);
      setCountInSeconds(null);

      const isPermissionError = 
        err?.name === 'NotAllowedError' || 
        err?.name === 'SecurityError' ||
        err?.name === 'PermissionDeniedError' ||
        (typeof err?.message === 'string' && (
          err.message.toLowerCase().includes('permission') || 
          err.message.toLowerCase().includes('dismissed') || 
          err.message.toLowerCase().includes('denied') ||
          err.message.toLowerCase().includes('blocked')
        ));

      if (isPermissionError) {
        console.warn("Microphone access permission was dismissed or blocked:", err?.message || err);
        onShowNotification("Microphone access dismissed or denied. Allow permissions in your browser or open app in a new tab.", "info");
      } else {
        console.warn("Microphone access unavailable:", err?.message || err);
        onShowNotification("Could not access microphone. Ensure permissions are allowed.", "info");
      }
    }
  };

  const stopRecordingImmediately = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(recordingIntervalRef.current);
  };

  // Convert canvas X coordinate to waveform buffer ratio (0..1) taking zoom and scroll into account
  const canvasXToRatio = useCallback((clientX: number, rect: DOMRect): number => {
    const rawX = clientX - rect.left;
    const normX = Math.max(0, Math.min(1, rawX / rect.width));
    const visibleRange = 1 / zoomLevel;
    const startRange = scrollOffset * (1 - visibleRange);
    const actualRatio = startRange + normX * visibleRange;
    return Math.max(0, Math.min(1, actualRatio));
  }, [zoomLevel, scrollOffset]);

  // Convert buffer ratio (0..1) to canvas X pixel coordinate
  const ratioToCanvasX = useCallback((ratio: number, width: number): number => {
    const visibleRange = 1 / zoomLevel;
    const startRange = scrollOffset * (1 - visibleRange);
    const normX = (ratio - startRange) / visibleRange;
    return normX * width;
  }, [zoomLevel, scrollOffset]);

  // Render high-precision waveform canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const buffer = selectedPad.buffer;
    if (!buffer) {
      ctx.fillStyle = '#0a0a0d';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '11px Space Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO AUDIO LOADED // RECORD VIA MIC OR IMPORT AUDIO FILE', width / 2, height / 2);
      return;
    }

    const data = buffer.getChannelData(0);
    const totalSamples = data.length;

    // Background & Technical Matrix Grid
    ctx.fillStyle = '#08080c';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Center 0-amplitude guideline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Visible audio slice according to zoom & scroll
    const visibleRange = 1 / zoomLevel;
    const startRatio = scrollOffset * (1 - visibleRange);
    const endRatio = startRatio + visibleRange;

    const startSampleIndex = Math.floor(startRatio * totalSamples);
    const endSampleIndex = Math.min(totalSamples, Math.ceil(endRatio * totalSamples));
    const visibleSampleCount = endSampleIndex - startSampleIndex;
    const samplesPerPixel = Math.max(1, Math.floor(visibleSampleCount / width));

    const amp = height / 2;

    // Determine colors
    const activeColor = '#FF3E82'; // Hot pink accent
    const trimMarkerColor = '#00F0FF'; // Cyan secondary

    // Draw RMS / Peak Waveform
    for (let i = 0; i < width; i++) {
      const sampleOffset = startSampleIndex + (i * samplesPerPixel);
      if (sampleOffset >= totalSamples) break;

      let min = 1.0;
      let max = -1.0;
      let sumSq = 0;
      const count = Math.min(samplesPerPixel, totalSamples - sampleOffset);

      for (let j = 0; j < count; j++) {
        const val = data[sampleOffset + j];
        if (val < min) min = val;
        if (val > max) max = val;
        sumSq += val * val;
      }

      const rms = Math.sqrt(sumSq / count);
      const x = i;
      const pixelRatio = startRatio + (i / width) * visibleRange;
      const isInsideTrim = pixelRatio >= selectedPad.trimStart && pixelRatio <= selectedPad.trimEnd;

      // Draw RMS fill (soft core)
      ctx.fillStyle = isInsideTrim 
        ? 'rgba(255, 62, 130, 0.25)' 
        : 'rgba(255, 255, 255, 0.05)';
      const rmsY1 = (1 - rms) * amp;
      const rmsHeight = Math.max(1, rms * 2 * amp);
      ctx.fillRect(x, rmsY1, 1, rmsHeight);

      // Draw Peak Waveform Spikes
      ctx.strokeStyle = isInsideTrim 
        ? activeColor 
        : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, (1 + min) * amp);
      ctx.lineTo(x, (1 + max) * amp);
      ctx.stroke();
    }

    // Draw Dimmed Outside Trimming Overlays
    const startPixelX = ratioToCanvasX(selectedPad.trimStart, width);
    const endPixelX = ratioToCanvasX(selectedPad.trimEnd, width);

    // Left Excluded Shadow
    if (startPixelX > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, Math.min(width, startPixelX), height);
      // Stripe hatch on excluded audio
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = -height; x < startPixelX; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(x + height, 0);
        ctx.stroke();
      }
    }

    // Right Excluded Shadow
    if (endPixelX < width) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(Math.max(0, endPixelX), 0, width - Math.max(0, endPixelX), height);
      // Stripe hatch on excluded audio
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = endPixelX - height; x < width; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(x + height, 0);
        ctx.stroke();
      }
    }

    // Draw Left Trim Handle (Start)
    if (startPixelX >= 0 && startPixelX <= width) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = trimMarkerColor;
      ctx.strokeStyle = trimMarkerColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startPixelX, 0);
      ctx.lineTo(startPixelX, height);
      ctx.stroke();

      // Top & Bottom Flag Handles
      ctx.fillStyle = trimMarkerColor;
      ctx.fillRect(startPixelX, 0, 10, 14);
      ctx.fillRect(startPixelX, height - 14, 10, 14);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 9px Space Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('S', startPixelX + 2, 10);
      ctx.fillText('▶', startPixelX + 1, height - 4);
    }

    // Draw Right Trim Handle (End)
    if (endPixelX >= 0 && endPixelX <= width) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = activeColor;
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(endPixelX, 0);
      ctx.lineTo(endPixelX, height);
      ctx.stroke();

      // Top & Bottom Flag Handles
      ctx.fillStyle = activeColor;
      ctx.fillRect(endPixelX - 10, 0, 10, 14);
      ctx.fillRect(endPixelX - 10, height - 14, 10, 14);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Space Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('E', endPixelX - 2, 10);
      ctx.fillText('◀', endPixelX - 1, height - 4);
    }
    ctx.shadowBlur = 0;

    // Draw Hover Cursor Guideline
    if (hoverPositionRatio !== null && isHoveringHandle === null && dragMode === null) {
      const hoverX = ratioToCanvasX(hoverPositionRatio, width);
      if (hoverX >= 0 && hoverX <= width) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hoverX, 0);
        ctx.lineTo(hoverX, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Hover Time Tag
        const hoverSec = (hoverPositionRatio * buffer.duration).toFixed(3);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(hoverX + 4, 4, 52, 14);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeRect(hoverX + 4, 4, 52, 14);
        ctx.fillStyle = '#00F0FF';
        ctx.font = '8px Space Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${hoverSec}s`, hoverX + 7, 14);
      }
    }

    // Draw Live Playhead
    if (playheadRatio !== null) {
      const playheadX = ratioToCanvasX(playheadRatio, width);
      if (playheadX >= 0 && playheadX <= width) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#fff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

  }, [selectedPad, selectedPadId, zoomLevel, scrollOffset, hoverPositionRatio, isHoveringHandle, dragMode, playheadRatio, ratioToCanvasX]);

  // Handle Canvas Mouse Interaction for Trimming
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedPad.buffer) return;
    const rect = canvas.getBoundingClientRect();
    const currentRatio = canvasXToRatio(e.clientX, rect);
    setHoverPositionRatio(currentRatio);

    const startPixelX = ratioToCanvasX(selectedPad.trimStart, canvas.width);
    const endPixelX = ratioToCanvasX(selectedPad.trimEnd, canvas.width);
    const mouseX = e.clientX - rect.left;

    // Detect if hovering over Start handle, End handle, or Body region
    const handleHitThreshold = 12;
    if (Math.abs(mouseX - startPixelX) <= handleHitThreshold) {
      setIsHoveringHandle('start');
    } else if (Math.abs(mouseX - endPixelX) <= handleHitThreshold) {
      setIsHoveringHandle('end');
    } else if (mouseX > startPixelX && mouseX < endPixelX) {
      setIsHoveringHandle('body');
    } else {
      setIsHoveringHandle(null);
    }

    // Process active dragging
    if (dragMode) {
      if (dragMode === 'start') {
        let newStart = Math.min(selectedPad.trimEnd - 0.01, Math.max(0, currentRatio));
        if (snapZeroCrossing && selectedPad.buffer) {
          newStart = snapToZeroCrossing(selectedPad.buffer, newStart);
        }
        updatePadParameter(selectedPad.id, 'trimStart', newStart);
      } else if (dragMode === 'end') {
        let newEnd = Math.max(selectedPad.trimStart + 0.01, Math.min(1.0, currentRatio));
        if (snapZeroCrossing && selectedPad.buffer) {
          newEnd = snapToZeroCrossing(selectedPad.buffer, newEnd);
        }
        updatePadParameter(selectedPad.id, 'trimEnd', newEnd);
      } else if (dragMode === 'region') {
        const deltaX = e.clientX - dragStartMouseX;
        const visibleRange = 1 / zoomLevel;
        const deltaRatio = (deltaX / rect.width) * visibleRange;
        const regionDuration = dragInitialTrimEnd - dragInitialTrimStart;

        let newStart = dragInitialTrimStart + deltaRatio;
        let newEnd = dragInitialTrimEnd + deltaRatio;

        if (newStart < 0) {
          newStart = 0;
          newEnd = regionDuration;
        }
        if (newEnd > 1) {
          newEnd = 1;
          newStart = 1 - regionDuration;
        }

        if (snapZeroCrossing && selectedPad.buffer) {
          newStart = snapToZeroCrossing(selectedPad.buffer, newStart);
          newEnd = snapToZeroCrossing(selectedPad.buffer, newEnd);
        }

        updatePadParameter(selectedPad.id, 'trimStart', newStart);
        updatePadParameter(selectedPad.id, 'trimEnd', newEnd);
      } else if (dragMode === 'create') {
        const initialRatio = canvasXToRatio(dragStartMouseX, rect);
        let start = Math.min(initialRatio, currentRatio);
        let end = Math.max(initialRatio, currentRatio);
        if (end - start > 0.01) {
          if (snapZeroCrossing && selectedPad.buffer) {
            start = snapToZeroCrossing(selectedPad.buffer, start);
            end = snapToZeroCrossing(selectedPad.buffer, end);
          }
          updatePadParameter(selectedPad.id, 'trimStart', start);
          updatePadParameter(selectedPad.id, 'trimEnd', end);
        }
      }
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedPad.buffer) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const startPixelX = ratioToCanvasX(selectedPad.trimStart, canvas.width);
    const endPixelX = ratioToCanvasX(selectedPad.trimEnd, canvas.width);

    const handleHitThreshold = 12;
    setDragStartMouseX(e.clientX);
    setDragInitialTrimStart(selectedPad.trimStart);
    setDragInitialTrimEnd(selectedPad.trimEnd);

    if (Math.abs(mouseX - startPixelX) <= handleHitThreshold) {
      setDragMode('start');
    } else if (Math.abs(mouseX - endPixelX) <= handleHitThreshold) {
      setDragMode('end');
    } else if (mouseX > startPixelX && mouseX < endPixelX) {
      setDragMode('region');
    } else {
      setDragMode('create');
      const clickRatio = canvasXToRatio(e.clientX, rect);
      updatePadParameter(selectedPad.id, 'trimStart', clickRatio);
      updatePadParameter(selectedPad.id, 'trimEnd', Math.min(1, clickRatio + 0.05));
    }
  };

  const handleCanvasMouseUp = () => {
    setDragMode(null);
  };

  const handleCanvasMouseLeave = () => {
    setDragMode(null);
    setHoverPositionRatio(null);
    setIsHoveringHandle(null);
  };

  // Crop / Slices the sample buffer directly to trimmed points
  const handleCropToTrim = () => {
    if (!selectedPad.buffer || !audioEngine.ctx) return;
    try {
      const cropped = cropAudioBuffer(
        audioEngine.ctx, 
        selectedPad.buffer, 
        selectedPad.trimStart, 
        selectedPad.trimEnd
      );
      setPads(prev => prev.map(p => p.id === selectedPad.id ? {
        ...p,
        buffer: cropped,
        trimStart: 0,
        trimEnd: 1
      } : p));
      onShowNotification(`Sample cropped to ${(cropped.duration).toFixed(2)}s!`, "success");
    } catch (err) {
      console.error("Crop error:", err);
      onShowNotification("Could not crop sample.", "error");
    }
  };

  // Auto-Snap start and end to zero crossings
  const handleSnapBothToZeroCrossing = () => {
    if (!selectedPad.buffer) return;
    const snappedStart = snapToZeroCrossing(selectedPad.buffer, selectedPad.trimStart);
    const snappedEnd = snapToZeroCrossing(selectedPad.buffer, selectedPad.trimEnd);
    updatePadParameter(selectedPad.id, 'trimStart', snappedStart);
    updatePadParameter(selectedPad.id, 'trimEnd', snappedEnd);
    onShowNotification("Snapped trim points to zero crossings for click-free playback!", "info");
  };

  // Reset Trim Boundaries
  const handleResetTrim = () => {
    updatePadParameter(selectedPad.id, 'trimStart', 0);
    updatePadParameter(selectedPad.id, 'trimEnd', 1);
    onShowNotification("Trim points reset to full duration (0% - 100%).", "info");
  };

  // Nudge trim boundary by milliseconds
  const nudgeTrimPoint = (point: 'start' | 'end', deltaMs: number) => {
    if (!selectedPad.buffer) return;
    const totalDurationMs = selectedPad.buffer.duration * 1000;
    const deltaRatio = deltaMs / totalDurationMs;

    if (point === 'start') {
      const next = Math.max(0, Math.min(selectedPad.trimEnd - 0.005, selectedPad.trimStart + deltaRatio));
      updatePadParameter(selectedPad.id, 'trimStart', next);
    } else {
      const next = Math.min(1.0, Math.max(selectedPad.trimStart + 0.005, selectedPad.trimEnd + deltaRatio));
      updatePadParameter(selectedPad.id, 'trimEnd', next);
    }
  };

  // Trigger pad and run smooth playhead animation
  const triggerPad = (padId: string, pitchOffsetSemitones = 0) => {
    audioEngine.init();
    if (!audioEngine.ctx) return;

    const pad = pads.find(p => p.id === padId);
    if (!pad || !pad.buffer) {
      onShowNotification("No audio loaded in this pad. Record with your mic or import audio!", "error");
      return;
    }

    const ctx = audioEngine.ctx;
    const now = ctx.currentTime;

    stopPad(padId);

    const finalBuffer = pad.reversed ? cloneAndReverseBuffer(ctx, pad.buffer) : pad.buffer;
    const durationTotal = finalBuffer.duration;
    const startTimeOffset = pad.trimStart * durationTotal;
    const playbackDuration = (pad.trimEnd - pad.trimStart) * durationTotal;

    const source = ctx.createBufferSource();
    source.buffer = finalBuffer;

    const totalPitch = pad.pitch + pitchOffsetSemitones;
    const rate = Math.pow(2, totalPitch / 12);
    source.playbackRate.setValueAtTime(rate, now);

    const biquad = ctx.createBiquadFilter();
    biquad.type = 'lowpass';
    biquad.frequency.setValueAtTime(pad.filterCutoff, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(pad.volume, now);

    source.connect(biquad);
    biquad.connect(gainNode);
    gainNode.connect(audioEngine.masterGain || ctx.destination);

    if (pad.loop) {
      source.loop = true;
      source.loopStart = startTimeOffset;
      source.loopEnd = startTimeOffset + playbackDuration;
      source.start(now, startTimeOffset);
    } else {
      source.start(now, startTimeOffset, playbackDuration / rate);
    }

    setPlayingPads(prev => ({ ...prev, [padId]: true }));

    // Animate playhead on active waveform
    if (padId === selectedPadId) {
      const audioStartCtxTime = now;
      const effectiveDuration = (playbackDuration / rate);

      const animPlayhead = () => {
        const elapsed = ctx.currentTime - audioStartCtxTime;
        if (elapsed < effectiveDuration || pad.loop) {
          const progress = (elapsed % effectiveDuration) / effectiveDuration;
          const currentRatio = pad.trimStart + (progress * (pad.trimEnd - pad.trimStart));
          setPlayheadRatio(currentRatio);
          playheadAnimRef.current = requestAnimationFrame(animPlayhead);
        } else {
          setPlayheadRatio(null);
        }
      };
      if (playheadAnimRef.current) cancelAnimationFrame(playheadAnimRef.current);
      playheadAnimRef.current = requestAnimationFrame(animPlayhead);
    }

    if (!activeSourcesRef.current.has(padId)) {
      activeSourcesRef.current.set(padId, []);
    }
    activeSourcesRef.current.get(padId)!.push(source);

    source.onended = () => {
      const arr = activeSourcesRef.current.get(padId) || [];
      const updated = arr.filter(s => s !== source);
      activeSourcesRef.current.set(padId, updated);

      if (updated.length === 0) {
        setPlayingPads(prev => ({ ...prev, [padId]: false }));
        if (padId === selectedPadId) {
          setPlayheadRatio(null);
          if (playheadAnimRef.current) cancelAnimationFrame(playheadAnimRef.current);
        }
      }
    };
  };

  const stopPad = (padId: string) => {
    const sources = activeSourcesRef.current.get(padId);
    if (sources && sources.length > 0) {
      sources.forEach(src => {
        try {
          src.stop();
        } catch (e) {}
      });
      activeSourcesRef.current.set(padId, []);
    }
    setPlayingPads(prev => ({ ...prev, [padId]: false }));
    if (padId === selectedPadId) {
      setPlayheadRatio(null);
      if (playheadAnimRef.current) cancelAnimationFrame(playheadAnimRef.current);
    }
  };

  const updatePadParameter = (padId: string, param: keyof SamplerPad, value: any) => {
    setPads(prev => prev.map(p => {
      if (p.id !== padId) return p;
      return { ...p, [param]: value };
    }));
  };

  const handleResetParameters = (padId: string) => {
    setPads(prev => prev.map(p => p.id === padId ? {
      ...p,
      volume: 1.0,
      pitch: 0,
      loop: false,
      reversed: false,
      trimStart: 0,
      trimEnd: 1,
      filterCutoff: 20000
    } : p));
    onShowNotification("Pad parameters reset to default.", "info");
  };

  // Export/Download active sample as WAV file
  const handleDownloadSample = (pad: SamplerPad) => {
    if (!pad.buffer) {
      onShowNotification("No audio buffer to export.", "error");
      return;
    }
    try {
      const wavBlob = audioBufferToWav(pad.buffer);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pad.name.toLowerCase().replace(/\s+/g, '_')}_demondseed.wav`;
      a.click();
      URL.revokeObjectURL(url);
      onShowNotification(`Downloaded "${pad.name}" as WAV!`, "success");
    } catch (err) {
      console.error("Export WAV failed:", err);
      onShowNotification("Could not export WAV file.", "error");
    }
  };

  // Handle Importing local files
  const handleImportAudioFile = async (e: React.ChangeEvent<HTMLInputElement>, padId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      audioEngine.init();
      if (!audioEngine.ctx) {
        onShowNotification("Web Audio Context not initialized.", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          let decodedBuffer = await audioEngine.ctx!.decodeAudioData(arrayBuffer);

          if (autoNormalize) {
            decodedBuffer = normalizeAudioBuffer(audioEngine.ctx!, decodedBuffer);
          }

          setPads(prev => prev.map(p => p.id === padId ? {
            ...p,
            name: file.name.replace(/\.[^/.]+$/, ""),
            buffer: decodedBuffer,
            trimStart: 0,
            trimEnd: 1,
            isCustomMic: false
          } : p));

          onShowNotification(`"${file.name}" loaded into Sampler Pad!`, "success");
        } catch (decErr) {
          console.error("Audio decode error:", decErr);
          onShowNotification("Failed to decode audio. Please try another format (WAV or MP3).", "error");
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("File loading failed:", err);
      onShowNotification("File system error occurred.", "error");
    }

    e.target.value = '';
  };

  // Add new blank pad
  const handleAddNewPadSlot = () => {
    const newKey = (pads.length + 1).toString();
    const newPadId = `pad-${Date.now()}`;
    const newName = `Custom Slot ${pads.length + 1}`;

    const newPad: SamplerPad = {
      id: newPadId,
      name: newName,
      key: newKey,
      color: 'bg-[#FF3E82] shadow-[0_0_12px_rgba(255,62,130,0.4)]',
      bgColor: 'bg-black/40',
      borderColor: 'border-white/20',
      buffer: null,
      volume: 1.0,
      pitch: 0,
      loop: false,
      reversed: false,
      trimStart: 0,
      trimEnd: 1,
      filterCutoff: 20000,
      isCustomMic: true
    };

    setPads(prev => [...prev, newPad]);
    setSelectedPadId(newPadId);
    onShowNotification(`Added Pad 0${newKey}! Record with your mic or import audio.`, "info");
  };

  // Remove a custom pad slot
  const handleRemovePad = (padId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pads.length <= 2) {
      onShowNotification("Minimum 2 pads required.", "error");
      return;
    }
    stopPad(padId);
    setPads(prev => prev.filter(p => p.id !== padId));
    if (selectedPadId === padId) {
      const remaining = pads.filter(p => p.id !== padId);
      setSelectedPadId(remaining[0]?.id || 'pad-1');
    }
    onShowNotification("Sample Pad removed.", "info");
  };

  // Calculate durations for display
  const totalDurationSec = selectedPad.buffer ? selectedPad.buffer.duration : 0;
  const startSec = (selectedPad.trimStart * totalDurationSec).toFixed(3);
  const endSec = (selectedPad.trimEnd * totalDurationSec).toFixed(3);
  const selectedDurationSec = Math.max(0, (selectedPad.trimEnd - selectedPad.trimStart) * totalDurationSec).toFixed(3);

  // Dynamic cursor style based on hover & drag mode
  const getCanvasCursor = () => {
    if (dragMode === 'start' || dragMode === 'end' || isHoveringHandle === 'start' || isHoveringHandle === 'end') {
      return 'ew-resize';
    }
    if (dragMode === 'region' || isHoveringHandle === 'body') {
      return 'grab';
    }
    return 'crosshair';
  };

  return (
    <div className="glass bg-[#121217]/95 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 text-white font-mono select-none">
      
      {/* Header telemetry and title banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-accent accent-glow-text uppercase tracking-wider flex items-center gap-2 font-dotgothic text-base">
              <Scissors className="w-4.5 h-4.5 text-accent" />
              DEMONSEED VISUAL WAVEFORM SAMPLER &amp; TRANSIENT TRIMMER
            </h3>
            <span className="text-[9px] font-bold text-secondary px-1.5 py-0.5 bg-black/60 border border-secondary/30 rounded">
              WAVE_DSP V2.4
            </span>
          </div>
          <p className="text-[11px] text-white/60 font-mono mt-0.5">
            Capture mic audio or import stems, then visually drag trim handles to isolate punchy transients, loops, or vocal chops!
          </p>
        </div>
        
        {/* Quick Shortcut and Pad count telemetry */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-black/60 border border-white/10 rounded text-[10px] font-mono text-white/70">
            <span className="text-accent font-bold">KEYS:</span> [1]–[{pads.length}] trigger live
          </div>
          <button
            onClick={handleAddNewPadSlot}
            className="flex items-center gap-1 px-2.5 py-1 bg-accent/20 hover:bg-accent text-accent hover:text-white border border-accent/40 rounded text-xs font-bold transition-all cursor-pointer shadow-sm uppercase"
            title="Add a new custom sample pad slot"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Pad Slot</span>
          </button>
        </div>
      </div>

      {/* Main Sampler Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: MPC Tap Pads Grid & Live Microphone Recording Console (span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Microphone Live Capture & Pre-amp Console */}
          <div className="glass bg-black/60 border border-accent/40 rounded-xl p-3.5 flex flex-col gap-3 relative overflow-hidden shadow-[0_0_15px_rgba(255,62,130,0.15)]">
            
            {/* Header with Live Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider">
                  MIC AUDIO CAPTURE
                </span>
              </div>
              <button
                onClick={toggleMicMonitoring}
                className={`text-[9px] px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 font-bold ${
                  isMonitoringMic 
                    ? 'bg-secondary/20 border-secondary text-secondary shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                }`}
                title="Toggle Live Mic Level Monitor"
              >
                <Activity className="w-3 h-3" />
                <span>{isMonitoringMic ? 'MONITOR: ON' : 'MONITOR: OFF'}</span>
              </button>
            </div>

            {/* Live Audio Level Meter */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[8px] text-white/50 uppercase">
                <span>INPUT LEVEL VU</span>
                <span className={micLevel > 75 ? 'text-accent font-bold' : 'text-secondary'}>
                  {micLevel}% {micLevel > 80 ? '(PEAKING)' : micLevel > 0 ? '(ACTIVE)' : '(IDLE)'}
                </span>
              </div>
              <div className="h-5 bg-black/80 border border-white/10 rounded relative overflow-hidden flex items-center px-1">
                <canvas 
                  ref={micMeterCanvasRef} 
                  width={240} 
                  height={18} 
                  className="w-full h-full block" 
                />
                {!isMonitoringMic && !isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white/40 font-mono">
                    Click Monitor or Record to test mic
                  </div>
                )}
              </div>
            </div>

            {/* Quick Capture Duration & Modes */}
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div className="flex flex-col gap-1">
                <span className="text-white/50 uppercase font-bold">DURATION</span>
                <div className="flex bg-black/60 border border-white/10 p-0.5 rounded">
                  {[1.0, 2.0, 3.0, 5.0].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setMaxRecordDuration(dur)}
                      className={`flex-1 py-0.5 rounded transition-all cursor-pointer text-center font-bold ${
                        maxRecordDuration === dur 
                          ? 'bg-accent text-white shadow-sm' 
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-white/50 uppercase font-bold">CAPTURE TARGET</span>
                <div className="flex bg-black/60 border border-white/10 p-0.5 rounded">
                  <button
                    onClick={() => setRecordMode('replace')}
                    className={`flex-1 py-0.5 rounded transition-all cursor-pointer text-center font-bold truncate px-1 ${
                      recordMode === 'replace' 
                        ? 'bg-secondary text-black shadow-sm font-black' 
                        : 'text-white/50 hover:text-white'
                    }`}
                    title={`Record into Pad 0${pads.findIndex(p => p.id === selectedPadId) + 1}`}
                  >
                    PAD 0{pads.findIndex(p => p.id === selectedPadId) + 1}
                  </button>
                  <button
                    onClick={() => setRecordMode('new')}
                    className={`flex-1 py-0.5 rounded transition-all cursor-pointer text-center font-bold truncate px-1 ${
                      recordMode === 'new' 
                        ? 'bg-accent text-white shadow-sm font-black' 
                        : 'text-white/50 hover:text-white'
                    }`}
                    title="Capture into a brand new sample pad"
                  >
                    + NEW PAD
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Enhancers */}
            <div className="flex items-center justify-between text-[9px] pt-1 border-t border-white/5">
              <label className="flex items-center gap-1.5 cursor-pointer text-white/70 hover:text-white">
                <input 
                  type="checkbox" 
                  checked={autoNormalize} 
                  onChange={(e) => setAutoNormalize(e.target.checked)}
                  className="accent-[#FF3E82] cursor-pointer rounded"
                />
                <span>Auto-Normalize</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-white/70 hover:text-white">
                <input 
                  type="checkbox" 
                  checked={autoTrimSilence} 
                  onChange={(e) => setAutoTrimSilence(e.target.checked)}
                  className="accent-[#00F0FF] cursor-pointer rounded"
                />
                <span>Auto-Trim Silence</span>
              </label>
            </div>

            {/* Main Record Action Trigger Button */}
            <div className="flex items-center gap-2 mt-0.5">
              <button
                onClick={() => {
                  if (isRecording) {
                    stopRecordingImmediately();
                  } else {
                    startRecordingProcess(selectedPadId, recordMode === 'new');
                  }
                }}
                className={`flex-1 py-2 px-3 rounded font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-lg ${
                  countInSeconds !== null
                    ? 'bg-amber-500 text-black border-amber-400 animate-pulse'
                    : isRecording
                    ? 'bg-accent text-white border-white/60 animate-pulse shadow-[0_0_20px_rgba(255,62,130,0.8)]'
                    : 'bg-accent/90 hover:bg-accent text-white border-accent hover:shadow-[0_0_15px_rgba(255,62,130,0.5)]'
                }`}
              >
                {countInSeconds !== null ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>COUNT-IN... {countInSeconds}</span>
                  </>
                ) : isRecording ? (
                  <>
                    <Mic className="w-3.5 h-3.5 animate-bounce" />
                    <span>RECORDING {recordingSeconds.toFixed(1)}s / {maxRecordDuration}s</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>
                      {recordMode === 'new' 
                        ? 'CAPTURE NEW SAMPLE VIA MIC' 
                        : `RECORD MIC INTO PAD 0${pads.findIndex(p => p.id === selectedPadId) + 1}`}
                    </span>
                  </>
                )}
              </button>

              {isRecording && (
                <button
                  onClick={stopRecordingImmediately}
                  className="px-2.5 py-2 bg-black border border-white/20 hover:border-secondary rounded text-secondary hover:text-white transition-all cursor-pointer"
                  title="Finish recording early"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
            </div>
          </div>

          {/* MPC Tap Pads List */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest font-mono">
              ACTIVE SAMPLE PADS ({pads.length})
            </span>
            <span className="text-[9px] text-secondary font-mono">
              Select pad to trim waveform
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {pads.map((pad, idx) => {
              const isSelected = selectedPadId === pad.id;
              const isPlaying = playingPads[pad.id];
              
              return (
                <div 
                  key={pad.id}
                  onClick={() => setSelectedPadId(pad.id)}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-30 select-none group ${
                    isSelected 
                      ? 'bg-[#181822] border-accent shadow-[0_0_12px_rgba(255,62,130,0.25)] border-l-4' 
                      : 'bg-black/50 border-white/10 hover:border-white/25'
                  }`}
                >
                  {/* Top line fader and info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold font-mono text-white/60 uppercase tracking-wider">
                        PAD 0{idx + 1}
                      </span>
                      {pad.isCustomMic && (
                        <span className="px-1 py-0.2 bg-accent/20 border border-accent/40 text-accent rounded text-[8px] font-bold">
                          MIC
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-black/60 text-secondary rounded text-[9px] font-mono border border-white/10">
                        [{pad.key}]
                      </span>
                      {pads.length > 2 && (
                        <button
                          onClick={(e) => handleRemovePad(pad.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 text-white/40 transition-opacity"
                          title="Delete Pad"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visual trigger button block */}
                  <div className="flex flex-col items-center justify-center my-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPlaying && pad.loop) {
                          stopPad(pad.id);
                        } else {
                          triggerPad(pad.id);
                        }
                      }}
                      className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-100 transform active:scale-95 cursor-pointer ${
                        isPlaying 
                          ? `${pad.color} text-white border-transparent scale-105` 
                          : 'bg-black/60 border-white/15 text-white/60 hover:text-white hover:border-white/40'
                      }`}
                    >
                      {isPlaying && pad.loop ? (
                        <Square className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Bottom Line: Name and Loop/Rev tags */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white truncate max-w-[95px]" title={pad.name}>
                      {pad.name}
                    </span>
                    <div className="flex gap-1">
                      {pad.loop && (
                        <span className="text-[8px] font-bold bg-accent/20 text-accent px-1 rounded border border-accent/40 font-mono uppercase">L</span>
                      )}
                      {pad.reversed && (
                        <span className="text-[8px] font-bold bg-secondary/20 text-secondary px-1 rounded border border-secondary/40 font-mono uppercase">R</span>
                      )}
                    </div>
                  </div>

                  {/* Active playing LED-style glow bar at the bottom */}
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full overflow-hidden">
                    <div className={`h-full w-full transition-opacity duration-150 ${
                      isPlaying ? 'bg-accent' : 'bg-transparent'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Visual Waveform Editor & Trimmer, Transient Snapping & Chromatic Keyboard (span 7) */}
        <div className="lg:col-span-7 glass bg-black/60 border border-white/10 rounded-2xl p-4.5 flex flex-col gap-4 shadow-xl">
          
          {/* Header of Active Pad Editor */}
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent shadow-[0_0_8px_#FF3E82]" />
              <span className="text-xs font-bold text-secondary uppercase font-mono tracking-wide">
                PAD 0{pads.findIndex(p => p.id === selectedPadId) + 1} WAVEFORM EDITOR:
              </span>
              <input
                type="text"
                value={selectedPad.name}
                onChange={(e) => updatePadParameter(selectedPad.id, 'name', e.target.value)}
                className="bg-black/60 text-white border border-white/15 rounded px-2 py-0.5 text-xs font-bold outline-none focus:border-accent w-40 font-mono"
                placeholder="Name your sample"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {selectedPad.buffer && (
                <button
                  onClick={() => handleDownloadSample(selectedPad)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white rounded border border-white/10 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Download this sample as a .WAV file"
                >
                  <Download className="w-3 h-3" />
                  <span>WAV</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (selectedPad.buffer && audioEngine.ctx) {
                    const normalized = normalizeAudioBuffer(audioEngine.ctx, selectedPad.buffer);
                    updatePadParameter(selectedPad.id, 'buffer', normalized);
                    onShowNotification("Sample peak level normalized to 0dB!", "success");
                  }
                }}
                className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white rounded border border-white/10 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Normalize peak amplitude"
              >
                <Wand2 className="w-3 h-3 text-secondary" />
                <span>NORMALIZE</span>
              </button>

              <button
                onClick={() => handleResetParameters(selectedPad.id)}
                className="p-1 bg-white/5 hover:bg-white/15 text-white/60 hover:text-white rounded border border-white/10 cursor-pointer transition-colors"
                title="Reset Pad Parameters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Visual Waveform Editor & Trimmer Panel */}
          <div className="flex flex-col gap-2 bg-[#0d0d12] border border-white/10 rounded-xl p-3 shadow-inner">
            
            {/* Waveform Telemetry Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-secondary font-bold uppercase flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-secondary" />
                  <span>TRIMMED SELECTION:</span>
                </span>
                <span className="text-white font-bold bg-black/60 px-2 py-0.5 rounded border border-white/10">
                  {selectedDurationSec}s <span className="text-white/40">({((selectedPad.trimEnd - selectedPad.trimStart) * 100).toFixed(1)}%)</span>
                </span>
              </div>

              {/* Waveform Zoom & Action Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSnapBothToZeroCrossing}
                  className="px-2 py-0.5 bg-black/60 hover:bg-secondary/20 text-secondary border border-secondary/40 hover:border-secondary rounded text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Snap trim start and end to closest zero-crossings to remove pops"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>SNAP ZERO-CROSS</span>
                </button>

                <button
                  onClick={handleCropToTrim}
                  className="px-2 py-0.5 bg-accent/20 hover:bg-accent text-accent hover:text-white border border-accent/40 rounded text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  title="Crop Audio: permanently slice sample to trimmed selection"
                >
                  <Crop className="w-2.5 h-2.5" />
                  <span>CROP SAMPLE</span>
                </button>

                <button
                  onClick={handleResetTrim}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 rounded text-[9px] font-bold transition-all cursor-pointer"
                  title="Reset Trim Range to 100%"
                >
                  RESET
                </button>

                {/* Zoom Selector */}
                <div className="flex bg-black/60 border border-white/10 p-0.5 rounded">
                  {[1, 2, 4].map(z => (
                    <button
                      key={z}
                      onClick={() => setZoomLevel(z)}
                      className={`px-1.5 py-0.2 rounded text-[8px] font-bold transition-all cursor-pointer ${
                        zoomLevel === z ? 'bg-secondary text-black' : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {z}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Canvas Canvas Area */}
            <div 
              ref={canvasContainerRef}
              className="relative rounded-lg overflow-hidden border border-white/15 shadow-inner h-28 bg-[#08080c] select-none"
            >
              <canvas 
                ref={canvasRef} 
                width={560} 
                height={112} 
                onMouseMove={handleCanvasMouseMove}
                onMouseDown={handleCanvasMouseDown}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseLeave}
                style={{ cursor: getCanvasCursor() }}
                className="w-full h-full block"
              />

              {/* Visual Drag Instruction Overlay on Empty */}
              {selectedPad.buffer && (
                <div className="absolute top-1 left-2 pointer-events-none text-[8px] font-mono text-white/30 uppercase">
                  DRAG HANDLES [S/E] OR REGION TO SCULPT TRANSIENT
                </div>
              )}
            </div>

            {/* Horizontal Scroll Bar when Zoomed In */}
            {zoomLevel > 1 && (
              <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-white/5 text-[8px] text-white/50">
                <MoveHorizontal className="w-3 h-3 text-secondary" />
                <span>ZOOM PAN:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={scrollOffset}
                  onChange={(e) => setScrollOffset(parseFloat(e.target.value))}
                  className="flex-1 h-1 accent-[#00F0FF] bg-white/10 rounded-full cursor-pointer"
                />
              </div>
            )}

            {/* Precision Micro-Adjustment Controls (Start & End Milliseconds and Nudges) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/60 p-2.5 rounded-lg border border-white/10">
              
              {/* Start Handle Controls */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-secondary font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    START POINT: {startSec}s
                  </span>
                  <span className="text-white/50">
                    {(selectedPad.trimStart * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min="0"
                    max="0.95"
                    step="0.001"
                    value={selectedPad.trimStart}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < selectedPad.trimEnd - 0.005) {
                        updatePadParameter(selectedPad.id, 'trimStart', val);
                      }
                    }}
                    className="flex-1 h-1.5 accent-[#00F0FF] bg-white/10 rounded-full cursor-pointer"
                  />
                  <button
                    onClick={() => nudgeTrimPoint('start', -10)}
                    className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 text-secondary border border-white/10 rounded text-[8px] font-bold cursor-pointer"
                    title="Nudge Start -10ms"
                  >
                    -10ms
                  </button>
                  <button
                    onClick={() => nudgeTrimPoint('start', 10)}
                    className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 text-secondary border border-white/10 rounded text-[8px] font-bold cursor-pointer"
                    title="Nudge Start +10ms"
                  >
                    +10ms
                  </button>
                </div>
              </div>

              {/* End Handle Controls */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-accent font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    END POINT: {endSec}s
                  </span>
                  <span className="text-white/50">
                    {(selectedPad.trimEnd * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.001"
                    value={selectedPad.trimEnd}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val > selectedPad.trimStart + 0.005) {
                        updatePadParameter(selectedPad.id, 'trimEnd', val);
                      }
                    }}
                    className="flex-1 h-1.5 accent-[#FF3E82] bg-white/10 rounded-full cursor-pointer"
                  />
                  <button
                    onClick={() => nudgeTrimPoint('end', -10)}
                    className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 text-accent border border-white/10 rounded text-[8px] font-bold cursor-pointer"
                    title="Nudge End -10ms"
                  >
                    -10ms
                  </button>
                  <button
                    onClick={() => nudgeTrimPoint('end', 10)}
                    className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 text-accent border border-white/10 rounded text-[8px] font-bold cursor-pointer"
                    title="Nudge End +10ms"
                  >
                    +10ms
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Audition Selection Trigger */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => triggerPad(selectedPad.id)}
                className="flex-1 py-1.5 bg-secondary/15 hover:bg-secondary/25 border border-secondary/40 text-secondary hover:text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Audition Trimmed Selection (or press [{selectedPad.key}])</span>
              </button>
            </div>
          </div>

          {/* Chromatic Mini-Keyboard (Turn the Trimmed Audio Snippet into a Playable Musical Instrument) */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-accent font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5" />
                Play Trimmed Sample as Tuned Chromatic Instrument
              </span>
              <span className="text-[8px] text-white/50 font-mono">
                Pitched across 12 Semitones (C3 – B3)
              </span>
            </div>

            {/* Chromatic piano keys bar */}
            <div className="grid grid-cols-12 gap-1 h-9">
              {[
                { note: 'C', semitone: -12, black: false },
                { note: 'C#', semitone: -11, black: true },
                { note: 'D', semitone: -10, black: false },
                { note: 'D#', semitone: -9, black: true },
                { note: 'E', semitone: -8, black: false },
                { note: 'F', semitone: -7, black: false },
                { note: 'F#', semitone: -6, black: true },
                { note: 'G', semitone: -5, black: false },
                { note: 'G#', semitone: -4, black: true },
                { note: 'A', semitone: -3, black: false },
                { note: 'A#', semitone: -2, black: true },
                { note: 'B', semitone: 0, black: false },
              ].map((k) => (
                <button
                  key={k.note}
                  onClick={() => triggerPad(selectedPad.id, k.semitone)}
                  className={`h-full rounded text-[8px] font-bold flex flex-col items-center justify-end pb-1 border transition-all cursor-pointer active:scale-95 ${
                    k.black 
                      ? 'bg-black text-secondary border-secondary/40 hover:bg-secondary/20' 
                      : 'bg-white/10 text-white border-white/20 hover:bg-accent/30 hover:border-accent'
                  }`}
                  title={`Trigger ${selectedPad.name} at ${k.note} (${k.semitone} semitones)`}
                >
                  <span>{k.note}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Parametric Modifiers (Pitch, Filter, Volume, Rev, Loop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Pitch Shift & Cutoff */}
            <div className="flex flex-col gap-2">
              {/* Pitch Shift */}
              <div className="bg-black/50 p-2 rounded-xl border border-white/10 flex flex-col gap-1">
                <span className="text-[9px] text-white/70 font-mono uppercase font-bold flex justify-between">
                  <span>Pitch Tuning</span>
                  <span className="text-accent font-bold">{selectedPad.pitch > 0 ? `+${selectedPad.pitch}` : selectedPad.pitch} semitones</span>
                </span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={selectedPad.pitch}
                  onChange={(e) => updatePadParameter(selectedPad.id, 'pitch', parseInt(e.target.value))}
                  className="w-full h-1 accent-[#FF3E82] bg-white/10 rounded-full cursor-pointer my-0.5"
                />
                <div className="flex justify-between text-[7px] text-white/40 font-mono">
                  <span>-1 Oct</span>
                  <span>Root (0)</span>
                  <span>+1 Oct</span>
                </div>
              </div>

              {/* Lowpass Filter Cutoff */}
              <div className="bg-black/50 p-2 rounded-xl border border-white/10 flex flex-col gap-1">
                <span className="text-[9px] text-white/70 font-mono uppercase font-bold flex justify-between">
                  <span>Lowpass Filter</span>
                  <span className="text-secondary font-bold">
                    {selectedPad.filterCutoff === 20000 ? 'OPEN' : `${selectedPad.filterCutoff} Hz`}
                  </span>
                </span>
                <input
                  type="range"
                  min="200"
                  max="20000"
                  step="100"
                  value={selectedPad.filterCutoff}
                  onChange={(e) => updatePadParameter(selectedPad.id, 'filterCutoff', parseInt(e.target.value))}
                  className="w-full h-1 accent-[#00F0FF] bg-white/10 rounded-full cursor-pointer my-0.5"
                />
                <div className="flex justify-between text-[7px] text-white/40 font-mono">
                  <span>Muffled</span>
                  <span>Warm</span>
                  <span>20kHz</span>
                </div>
              </div>
            </div>

            {/* Volume Gain & Loop / Reverse Toggles */}
            <div className="flex flex-col gap-2">
              {/* Volume Gain */}
              <div className="bg-black/50 p-2 rounded-xl border border-white/10 flex flex-col gap-1">
                <span className="text-[9px] text-white/70 font-mono uppercase font-bold flex justify-between">
                  <span>Sample Level Gain</span>
                  <span className="text-emerald-400 font-bold">{(selectedPad.volume * 100).toFixed(0)}%</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={selectedPad.volume}
                  onChange={(e) => updatePadParameter(selectedPad.id, 'volume', parseFloat(e.target.value))}
                  className="w-full h-1 accent-emerald-400 bg-white/10 rounded-full cursor-pointer my-0.5"
                />
                <div className="flex justify-between text-[7px] text-white/40 font-mono">
                  <span>0%</span>
                  <span>100%</span>
                  <span>150%</span>
                </div>
              </div>

              {/* Toggles Panel */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updatePadParameter(selectedPad.id, 'loop', !selectedPad.loop)}
                  className={`py-1.5 px-2.5 rounded text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedPad.loop 
                      ? 'bg-accent/20 border-accent text-accent shadow-[0_0_10px_rgba(255,62,130,0.3)]' 
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${selectedPad.loop ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                  {selectedPad.loop ? 'Loop: ON' : 'Loop: OFF'}
                </button>

                <button
                  onClick={() => updatePadParameter(selectedPad.id, 'reversed', !selectedPad.reversed)}
                  className={`py-1.5 px-2.5 rounded text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedPad.reversed 
                      ? 'bg-secondary/20 border-secondary text-secondary shadow-[0_0_10px_rgba(0,240,255,0.3)]' 
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  <FastForward className="w-3 h-3" />
                  {selectedPad.reversed ? 'Rev: ON' : 'Rev: OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Import Local File Drag/Drop Area */}
          <div className="border border-dashed border-white/15 hover:border-secondary/50 hover:bg-secondary/5 p-2.5 rounded-xl flex items-center justify-center gap-3 text-center transition-all group relative cursor-pointer">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => handleImportAudioFile(e, selectedPad.id)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              title="Click or Drop local audio file here to load"
            />
            <div className="p-1.5 bg-white/5 rounded border border-white/10 text-secondary group-hover:scale-110 transition-transform">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-white group-hover:text-secondary transition-colors">
                Or Import Audio File into Pad 0{pads.findIndex(p => p.id === selectedPad.id) + 1}
              </h4>
              <p className="text-[8px] text-white/40 font-mono">
                Supports .WAV, .MP3, .OGG, .M4A
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
