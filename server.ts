import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function generateHarmonicMelody(
  rootNote: string = 'C',
  scaleName: string = 'Minor Pentatonic',
  scalePitches?: string[],
  trackName: string = 'Lead'
) {
  const pitches =
    scalePitches && scalePitches.length > 0
      ? scalePitches
      : ['C4', 'D#4', 'F4', 'G4', 'A#4', 'C5'];

  const rootPitch = pitches[0] || 'C4';
  const thirdPitch = pitches[Math.min(2, pitches.length - 1)] || rootPitch;
  const fifthPitch = pitches[Math.min(4, pitches.length - 1)] || rootPitch;
  const highPitch = pitches[pitches.length - 1] || rootPitch;

  // Bar 1 Motif (Steps 0 to 15)
  const candidateSteps = [0, 2, 4, 6, 8, 10, 12, 14];
  const motifSteps = candidateSteps.filter((s) => s === 0 || Math.random() > 0.35);
  if (!motifSteps.includes(0)) motifSteps.unshift(0);

  const bar1: { pitch: string; step: number; duration: number }[] = [];
  motifSteps.forEach((st, idx) => {
    let p = rootPitch;
    if (st === 0) {
      p = rootPitch;
    } else if (idx === motifSteps.length - 1) {
      p = fifthPitch || rootPitch;
    } else {
      const choices = [rootPitch, thirdPitch, fifthPitch, highPitch, ...pitches];
      p = choices[Math.floor(Math.random() * choices.length)];
    }
    const dur = Math.random() > 0.65 ? 2 : 1;
    bar1.push({ pitch: p, step: st, duration: dur });
  });

  // Bar 2 Variation & Answer (Steps 16 to 31)
  const bar2: { pitch: string; step: number; duration: number }[] = [];
  bar1.forEach((note) => {
    const step = note.step + 16;
    if (step < 32) {
      let p = note.pitch;
      if (Math.random() > 0.4) {
        const curIdx = pitches.indexOf(note.pitch);
        const shift = Math.random() > 0.5 ? 1 : -1;
        const targetIdx = Math.max(0, Math.min(pitches.length - 1, (curIdx >= 0 ? curIdx : 0) + shift));
        p = pitches[targetIdx];
      }
      bar2.push({ pitch: p, step, duration: note.duration });
    }
  });

  if (!bar2.some((n) => n.step >= 28)) {
    bar2.push({ pitch: rootPitch, step: 28, duration: 3 });
  }

  const descriptors = ['Groove', 'Echo', 'Neon', 'Pulse', 'Drive', 'Motif', 'Wave'];
  const descriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
  const melodyName = `${rootNote} ${scaleName} ${descriptor}`;

  return {
    melodyName,
    notes: [...bar1, ...bar2],
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // API Route: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasApiKey: !!(process.env.GEMINI_API_KEY || process.env.API_KEY) });
  });

  // API Route: Generate Music via Lyria
  app.post('/api/generate-music', async (req, res) => {
    try {
      const { prompt, mode } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(403).json({
          error: 'API_KEY_MISSING',
          code: 403,
          message: 'No Gemini API key configured in server environment.',
          needsPaidKey: true,
        });
      }

      const modelName = mode === 'full' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

      const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents: prompt,
        config: {
          responseModalities: [Modality.AUDIO],
        },
      });

      let audioAccumulator = '';
      let mimeType = 'audio/wav';
      let textAccumulator = '';

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;

        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioAccumulator && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioAccumulator += part.inlineData.data;
          }
          if (part.text) {
            textAccumulator += part.text;
          }
        }
      }

      if (!audioAccumulator) {
        return res.status(500).json({
          error: 'NO_AUDIO_RETURNED',
          message: 'No audio data was returned by the Lyria model.',
          text: textAccumulator,
        });
      }

      res.json({
        audioBase64: audioAccumulator,
        mimeType,
        text: textAccumulator,
      });
    } catch (err: any) {
      const status = err?.status || err?.statusCode || 500;
      const isAuthOrPermError =
        status === 401 ||
        status === 403 ||
        err?.message?.includes('401') ||
        err?.message?.includes('403') ||
        err?.message?.includes('UNAUTHENTICATED') ||
        err?.message?.includes('PERMISSION_DENIED') ||
        err?.message?.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
        err?.message?.includes('invalid authentication credentials');

      if (!isAuthOrPermError) {
        console.warn('Lyria synthesis error:', err?.message || 'Unknown error');
      }

      res.status(isAuthOrPermError ? 403 : 500).json({
        error: isAuthOrPermError ? 'PERMISSION_OR_AUTH_REQUIRED' : 'GENERATION_FAILED',
        code: isAuthOrPermError ? 403 : 500,
        message: isAuthOrPermError
          ? 'Lyria music generation requires a billing-enabled API key in Google AI Studio.'
          : (err?.message || 'Failed to generate music track with Lyria.'),
        needsPaidKey: isAuthOrPermError,
      });
    }
  });

  // API Route: Intelligent Music Prompt & Synthesis Helper using Gemini 3.8 Flash
  app.post('/api/ai/suggest-stem', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const isWitchHouse = prompt.toLowerCase().includes('witch') || prompt.toLowerCase().includes('salem') || prompt.toLowerCase().includes('occult') || prompt.toLowerCase().includes('†');

      const defaultSuggestions = isWitchHouse ? {
        genre: 'Witch House',
        bpm: 66,
        scale: 'C Harmonic Minor',
        rootFreq: 65.41,
        recommendedType: 'bass',
        description: prompt,
        synthSettings: {
          cutoffHz: 380,
          resonance: 4.5,
          attackSec: 0.08,
          decaySec: 0.45,
          waveform: 'sawtooth',
        },
      } : {
        genre: 'Synthwave',
        bpm: 120,
        scale: 'A Minor',
        rootFreq: 220,
        recommendedType: 'lead',
        description: prompt,
        synthSettings: {
          cutoffHz: 1400,
          resonance: 3.5,
          attackSec: 0.04,
          decaySec: 0.28,
          waveform: 'sawtooth',
        },
      };

      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          success: true,
          suggestions: defaultSuggestions,
        });
      }

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Analyze this musical stem request: "${prompt}". Return a concise JSON object with:
genre (string), bpm (number between 70 and 160), scale (string), rootNote (e.g. "A3", "C2"), stemType (one of: "bass", "pad", "lead", "drums", "fx"), synthSettings (object with cutoffHz, resonance, attackSec, decaySec, waveform: one of "sawtooth", "square", "sine", "triangle").`,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text;
        let parsed = null;
        if (text) {
          try {
            parsed = JSON.parse(text);
          } catch {
            parsed = null;
          }
        }

        return res.json({ success: true, suggestions: parsed || defaultSuggestions });
      } catch {
        return res.json({
          success: true,
          suggestions: defaultSuggestions,
          fallback: true,
        });
      }
    } catch (err: any) {
      res.json({
        success: false,
        message: err?.message,
        fallback: true,
      });
    }
  });

  // API Route: AI-powered Random Melody Generator using Gemini 3.8 Flash
  app.post('/api/ai/generate-melody', async (req, res) => {
    const { rootNote, scaleName, scalePitches, trackName, trackType, bpm } = req.body || {};

    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `You are a world-class electronic music producer and MIDI composer.
Create an inspiring, catchy, rhythmically grooving 32-step melody (steps 0 to 31) for a "${trackName || 'Lead'}" synth track (${trackType || 'synth'}).

Constraints:
- Scale / Key: ${rootNote || 'C'} ${scaleName || 'Minor Pentatonic'}
- Valid Pitches (MUST use ONLY these pitches): ${JSON.stringify(scalePitches && scalePitches.length > 0 ? scalePitches : ['C4', 'D#4', 'F4', 'G4', 'A#4', 'C5'])}
- Total sequence length: 32 steps (16th notes across 2 bars, indices 0 through 31).
- Tempo: ${bpm || 120} BPM.

Composition Guidelines:
- Compose between 10 and 20 notes total.
- Create a musical motif in Bar 1 (steps 0-15) and an answering phrase/variation in Bar 2 (steps 16-31).
- Use musical syncopation, rhythmic variation, and rests.
- Durations: 1 (16th note), 2 (8th note), 3 (dotted 8th), or 4 (quarter note).
- Keep (step + duration <= 32).

Respond ONLY with a valid JSON object matching this schema:
{
  "melodyName": "A creative title for this melody riff",
  "notes": [
    { "pitch": "string (from valid pitches)", "step": 0, "duration": 2 }
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed && Array.isArray(parsed.notes) && parsed.notes.length > 0) {
            return res.json({
              success: true,
              data: parsed,
            });
          }
        }
      } catch {
        // Fall through cleanly to harmonic composition engine
      }
    }

    // High-quality harmonic motif generator
    const fallbackData = generateHarmonicMelody(rootNote, scaleName, scalePitches, trackName);
    return res.json({
      success: true,
      data: fallbackData,
      fallback: true,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lyria DAW Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
