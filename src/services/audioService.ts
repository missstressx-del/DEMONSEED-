/**
 * Audio Service
 * 
 * Interacts with the server-side Lyria API endpoint (/api/generate-music)
 * and provides algorithmic DSP audio stem synthesis fallback when API access
 * or network is restricted.
 */

import { DurationMode } from "../types";

export interface GenerateSongResult {
  url: string;
  blob: Blob;
  source: 'lyria' | 'dsp-synth';
}

export interface StemSuggestions {
  genre?: string;
  bpm?: number;
  scale?: string;
  rootNote?: string;
  stemType?: 'bass' | 'pad' | 'lead' | 'drums' | 'fx';
  synthSettings?: {
    cutoffHz?: number;
    resonance?: number;
    attackSec?: number;
    decaySec?: number;
    waveform?: 'sawtooth' | 'square' | 'sine' | 'triangle';
  };
  description?: string;
}

/**
 * Uses Gemini 3.7 Flash on server to analyze user prompt and extract musical parameters
 */
export async function getStemSuggestions(prompt: string): Promise<StemSuggestions | null> {
  try {
    const res = await fetch('/api/ai/suggest-stem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.suggestions || null;
  } catch {
    return null;
  }
}

/**
 * Generates an audio stem via the server-side Lyria endpoint.
 * If the server encounters 401/403 or network issues,
 * it can fall back to DSP algorithmic stem synthesis.
 */
export async function generateSong(
  prompt: string,
  mode: DurationMode,
  onProgress?: (text: string) => void
): Promise<GenerateSongResult> {
  if (onProgress) {
    onProgress('Connecting to Lyria audio synthesis engine...');
  }

  try {
    const res = await fetch('/api/generate-music', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, mode }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const isAuthOrPerm =
        res.status === 401 ||
        res.status === 403 ||
        errData.code === 401 ||
        errData.code === 403 ||
        errData.needsPaidKey ||
        errData.error === 'PERMISSION_OR_AUTH_REQUIRED' ||
        errData.error === 'PERMISSION_DENIED';

      const error = new Error(
        errData.message || (isAuthOrPerm
          ? 'Lyria music models require a project with billing enabled in AI Studio.'
          : `Server responded with error ${res.status}`)
      );
      (error as any).isPermissionDenied = isAuthOrPerm;
      (error as any).status = res.status;
      (error as any).needsPaidKey = isAuthOrPerm;
      throw error;
    }

    const data = await res.json();
    if (!data.audioBase64) {
      throw new Error('No audio data received from generation server.');
    }

    if (onProgress && data.text) {
      onProgress(data.text);
    }

    const binaryString = atob(data.audioBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
    return {
      url: URL.createObjectURL(blob),
      blob,
      source: 'lyria',
    };
  } catch (err: any) {
    console.warn('Lyria API request failed:', err);
    throw err;
  }
}

/**
 * High-quality offline Algorithmic DSP Synthesizer Stem Generator.
 * Renders custom multi-oscillator chord progressions, ambient pads, sub basslines,
 * or synth arpeggios directly to an uncompressed 44.1kHz stereo WAV Blob.
 */
export async function generateAlgorithmicStem(
  prompt: string,
  bpm: number = 120,
  durationSteps: number = 16,
  onProgress?: (text: string) => void
): Promise<GenerateSongResult> {
  if (onProgress) {
    onProgress('Synthesizing custom multi-harmonic DSP audio stem...');
  }

  const sampleRate = 44100;
  const secondsPerStep = (60 / bpm) / 4;
  const totalDurationSeconds = Math.max(1, durationSteps * secondsPerStep);
  const totalSamples = Math.floor(sampleRate * totalDurationSeconds);

  // Determine musical mood/scale based on prompt text
  const pLower = prompt.toLowerCase();
  const isWitchHouse = pLower.includes('witch') || pLower.includes('occult') || pLower.includes('screwed') || pLower.includes('salem') || pLower.includes('†');
  const isBass = pLower.includes('bass') || pLower.includes('808') || pLower.includes('sub');
  const isPad = pLower.includes('pad') || pLower.includes('ambient') || pLower.includes('space') || pLower.includes('atmosphere');
  const isLead = pLower.includes('lead') || pLower.includes('melody') || pLower.includes('vocal') || pLower.includes('solo');
  const isDrums = pLower.includes('drum') || pLower.includes('techno') || pLower.includes('beat') || pLower.includes('pulse');

  // Scale frequencies (in Hz)
  // For Witch House: C Harmonic Minor / Phrygian (C2 = 65.41, D#2 = 77.78, G2 = 98.00, G#2 = 103.83, B2 = 123.47)
  // Standard Minor Pentatonic / Cyberpunk Neo-Soul: A minor root (A1 = 55, A3 = 220, A4 = 440)
  const rootFreq = isWitchHouse 
    ? (isBass ? 65.41 : isPad ? 130.81 : 261.63)
    : (isBass ? 55 : isPad ? 220 : 440);
  const scaleRatios = isWitchHouse
    ? [1.0, 1.0595, 1.1892, 1.3348, 1.4142, 1.5874, 1.8877] // Dark minor / Phrygian with tritone & minor 2nd
    : [1.0, 1.1892, 1.3348, 1.4983, 1.7818, 2.0, 2.3784];

  // Stereo buffer channels
  const leftChannel = new Float32Array(totalSamples);
  const rightChannel = new Float32Array(totalSamples);

  // Render audio sample by sample
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const currentStep = Math.floor(t / secondsPerStep);
    const stepProgress = (t % secondsPerStep) / secondsPerStep;

    let sampleL = 0;
    let sampleR = 0;

    if (isBass) {
      // Deep sub bass with analog saturation
      const noteIdx = currentStep % scaleRatios.length;
      const freq = (rootFreq * scaleRatios[noteIdx]) / 2;
      const env = Math.exp(-stepProgress * 3.5);
      
      // Main fundamental + 2nd harmonic
      const osc1 = Math.sin(2 * Math.PI * freq * t);
      const osc2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.4;
      const sub = Math.tanh((osc1 + osc2) * 1.6);

      sampleL = sub * env * 0.85;
      sampleR = sub * env * 0.85;
    } else if (isPad) {
      // Lush detuned stereo pad chords
      const chordNotes = [0, 2, 4];
      const swell = (Math.sin((t / totalDurationSeconds) * Math.PI) + 0.2) * 0.8;

      for (const n of chordNotes) {
        const f = rootFreq * scaleRatios[n % scaleRatios.length];
        // Detuned dual oscillators for wide chorus
        const l = Math.sin(2 * Math.PI * f * 1.003 * t) + Math.sin(2 * Math.PI * (f * 1.5) * t) * 0.3;
        const r = Math.sin(2 * Math.PI * f * 0.997 * t) + Math.sin(2 * Math.PI * (f * 1.5) * 1.002 * t) * 0.3;
        sampleL += l * 0.25;
        sampleR += r * 0.25;
      }
      sampleL *= swell;
      sampleR *= swell;
    } else if (isDrums) {
      // 4-on-the-floor kick + syncopated percussion
      const isKickStep = currentStep % 4 === 0;
      if (isKickStep) {
        const kickFreq = 150 * Math.exp(-stepProgress * 18) + 45;
        const kickEnv = Math.exp(-stepProgress * 8);
        const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv;
        sampleL += kick * 0.8;
        sampleR += kick * 0.8;
      }

      // Shaker / Hi-hat
      const hatEnv = Math.exp(-stepProgress * 25);
      const whiteNoise = (Math.random() * 2 - 1) * hatEnv * 0.2;
      sampleL += whiteNoise * 0.7;
      sampleR += whiteNoise * 1.1;
    } else {
      // Arpeggiated melody with stereo delay feel
      const noteIdx = (currentStep * 2 + Math.floor(stepProgress * 2)) % scaleRatios.length;
      const freq = rootFreq * scaleRatios[noteIdx];
      const env = Math.exp(-stepProgress * 5);

      // Bright sawtooth approximation
      const saw = (Math.sin(2 * Math.PI * freq * t) +
                   0.5 * Math.sin(4 * Math.PI * freq * t) +
                   0.25 * Math.sin(6 * Math.PI * freq * t)) * env * 0.45;

      const pan = Math.sin(currentStep * 0.8) * 0.4;
      sampleL = saw * (0.6 - pan);
      sampleR = saw * (0.6 + pan);
    }

    leftChannel[i] = Math.max(-1, Math.min(1, sampleL));
    rightChannel[i] = Math.max(-1, Math.min(1, sampleR));
  }

  // Encode to 16-bit PCM Stereo WAV Blob
  const wavBlob = encodeWAV(leftChannel, rightChannel, sampleRate);
  const url = URL.createObjectURL(wavBlob);

  if (onProgress) {
    onProgress('DSP stem rendered into studio timeline!');
  }

  return {
    url,
    blob: wavBlob,
    source: 'dsp-synth',
  };
}

function encodeWAV(left: Float32Array, right: Float32Array, sampleRate: number): Blob {
  const numChannels = 2;
  const numSamples = left.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const sL = Math.max(-1, Math.min(1, left[i]));
    const sR = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7FFF, true);
    offset += 2;
    view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
