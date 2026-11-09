import React, { useState } from 'react';
import { Sparkles, Music, Loader2, Play, CheckCircle, Cpu, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { Track, AudioClip } from '../types';
import { generateSong, generateAlgorithmicStem, getStemSuggestions, StemSuggestions } from '../services/audioService';
import { audioEngine } from '../services/audioEngine';

interface AiGeneratorProps {
  onAddAudioClip: (clip: AudioClip) => void;
  audioTrack: Track;
}

export function AiGenerator({ onAddAudioClip, audioTrack }: AiGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [startStep, setStartStep] = useState(0);
  const [durationSteps, setDurationSteps] = useState(16);
  const [engineMode, setEngineMode] = useState<'auto' | 'lyria' | 'dsp'>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressLog, setProgressLog] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [generatedClip, setGeneratedClip] = useState<AudioClip | null>(null);
  const [suggestions, setSuggestions] = useState<StemSuggestions | null>(null);

  // Suggested quick prompts for user inspiration
  const promptSuggestions = [
    'A haunted witch house chopped and screwed occult synth pad †‡†',
    'A futuristic space-synth atmosphere sweep',
    'A groovy lo-fi Rhodes keyboard chord progression',
    'An energetic house music synthesizer loop at 120BPM',
    'A deep retro sub-bass synth pulse',
    'A soulful vocal melody echo'
  ];

  const handleGenerate = async (e?: React.FormEvent, forceDsp = false) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setIsPermissionDenied(false);
    setGeneratedClip(null);

    const useDsp = forceDsp || engineMode === 'dsp';

    if (useDsp) {
      setProgressLog('Synthesizing custom multi-harmonic DSP audio stem...');
    } else {
      setProgressLog('Connecting to audio generation engine...');
    }

    try {
      let result;

      if (useDsp) {
        result = await generateAlgorithmicStem(
          prompt,
          120,
          durationSteps,
          (text) => setProgressLog((prev) => prev + '\n' + text)
        );
      } else {
        try {
          result = await generateSong(
            `Generate a short, seamlessly loopable audio stem matching the style: ${prompt}. It should fit in a 120BPM project.`,
            'quick',
            (text) => setProgressLog((prev) => prev + '\n' + text)
          );
        } catch (apiErr: any) {
          console.warn('Cloud API call returned error, auto-recovering with Studio DSP:', apiErr);
          const isAuthOrPerm =
            apiErr?.isPermissionDenied ||
            apiErr?.status === 401 ||
            apiErr?.status === 403 ||
            apiErr?.needsPaidKey ||
            apiErr?.message?.includes('401') ||
            apiErr?.message?.includes('403') ||
            apiErr?.message?.includes('UNAUTHENTICATED') ||
            apiErr?.message?.includes('Permission denied') ||
            apiErr?.message?.includes('authentication credentials');

          if (isAuthOrPerm) {
            setIsPermissionDenied(true);
            setProgressLog((prev) => prev + '\n⚠️ Cloud music API requires a billing-enabled key. Auto-switching to Studio DSP synthesis...');
          } else {
            setProgressLog((prev) => prev + '\n⚠️ Cloud engine unavailable. Auto-switching to Studio DSP synthesis...');
          }

          // Seamlessly synthesize using Studio DSP engine so the stem is guaranteed to render
          result = await generateAlgorithmicStem(
            prompt,
            120,
            durationSteps,
            (text) => setProgressLog((prev) => prev + '\n' + text)
          );
        }
      }

      const { url, blob } = result;

      // Successfully generated audio. Load into audioEngine buffer map
      const clipId = `ai-clip-${Date.now()}`;
      setProgressLog((prev) => prev + '\nDecoding generated audio waveform into WebAudio engine...');
      
      await audioEngine.loadClipBuffer(clipId, url);

      const newClip: AudioClip = {
        id: clipId,
        name: prompt.substring(0, 26) + (prompt.length > 26 ? '...' : ''),
        url,
        blob,
        prompt,
        startStep,
        durationSteps,
      };

      setGeneratedClip(newClip);
      onAddAudioClip(newClip);
      setProgressLog((prev) => prev + '\n✅ Audio stem successfully rendered and placed on timeline!');
    } catch {
      // Emergency fallback in case anything threw in decoding
      try {
        const dspResult = await generateAlgorithmicStem(prompt, 120, durationSteps);
        const clipId = `ai-clip-${Date.now()}`;
        await audioEngine.loadClipBuffer(clipId, dspResult.url);
        const newClip: AudioClip = {
          id: clipId,
          name: prompt.substring(0, 26) + (prompt.length > 26 ? '...' : ''),
          url: dspResult.url,
          blob: dspResult.blob,
          prompt,
          startStep,
          durationSteps,
        };
        setGeneratedClip(newClip);
        onAddAudioClip(newClip);
        setProgressLog((prev) => prev + '\n✅ Audio stem synthesized with Studio DSP engine!');
      } catch (fallbackErr: any) {
        setError(fallbackErr?.message || 'Failed to generate audio stem.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const playPreview = () => {
    if (!generatedClip) return;
    const audio = new Audio(generatedClip.url);
    audio.volume = 0.8;
    audio.play();
  };

  return (
    <div className="bg-[#141416] border border-white/5 rounded-xl p-4 shadow-lg flex flex-col md:flex-row gap-6">
      {/* Input controls */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="border-b border-zinc-800 pb-3 flex items-start justify-between">
          <div>
            <h3 className="text-md font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
              AI Audio Stem Generator
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Generate custom synth chords, ambient sweeps, sub-bass grooves, or drum stems and overlay them directly on your DAW timeline.
            </p>
          </div>

          {/* Engine Selector */}
          <div className="flex items-center gap-1 bg-black p-0.5 border border-zinc-800 rounded">
            <button
              type="button"
              onClick={() => setEngineMode('auto')}
              className={`px-2 py-1 text-[9px] font-mono font-bold rounded transition-all cursor-pointer ${
                engineMode === 'auto' ? 'bg-pink-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Cloud Lyria with automatic instant DSP fallback"
            >
              Auto (Lyria + DSP)
            </button>
            <button
              type="button"
              onClick={() => setEngineMode('dsp')}
              className={`px-2 py-1 text-[9px] font-mono font-bold rounded transition-all cursor-pointer flex items-center gap-1 ${
                engineMode === 'dsp' ? 'bg-secondary text-black font-black' : 'text-zinc-400 hover:text-white'
              }`}
              title="Instant Offline DSP Synth Stem Generator"
            >
              <Zap className="w-2.5 h-2.5" />
              Studio DSP
            </button>
          </div>
        </div>

        <form onSubmit={(e) => handleGenerate(e, false)} className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-zinc-500 font-bold block mb-1 uppercase">Describe the sound or loop</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A retro 80s synthesizer pad chord progression, deep techno drum pulse..."
              disabled={isGenerating}
              className="w-full h-20 bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition-colors resize-none"
            />
          </div>

          {/* Suggested Prompts */}
          <div>
            <label className="text-[10px] text-zinc-600 font-bold block mb-1.5 uppercase">Prompt Suggestions</label>
            <div className="flex flex-wrap gap-1.5">
              {promptSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPrompt(s)}
                  disabled={isGenerating}
                  className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-850 text-[10px] text-zinc-400 hover:text-pink-400 border border-zinc-850 rounded-md transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Step */}
            <div>
              <label className="text-[10px] text-zinc-500 font-bold block mb-1 uppercase">Timeline Position (Start Step)</label>
              <select
                value={startStep}
                onChange={(e) => setStartStep(parseInt(e.target.value))}
                disabled={isGenerating}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value={0}>Step 1 (Beat 1)</option>
                <option value={8}>Step 9 (Beat 3)</option>
                <option value={16}>Step 17 (Beat 5)</option>
                <option value={24}>Step 25 (Beat 7)</option>
              </select>
            </div>

            {/* Loop duration steps */}
            <div>
              <label className="text-[10px] text-zinc-500 font-bold block mb-1 uppercase">Clip Duration (Steps)</label>
              <select
                value={durationSteps}
                onChange={(e) => setDurationSteps(parseInt(e.target.value))}
                disabled={isGenerating}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value={8}>8 Steps (2 Beats)</option>
                <option value={16}>16 Steps (1 Bar)</option>
                <option value={32}>32 Steps (Full 2 Bars)</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Waveform...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Compose & Insert AI Stem
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleGenerate(undefined, true)}
              disabled={isGenerating || !prompt.trim()}
              className="px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-secondary border border-secondary/30 hover:border-secondary text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Instant high-quality DSP synthesis stem rendering"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>DSP Fast Render</span>
            </button>
          </div>
        </form>
      </div>

      {/* Generation logs & outcomes */}
      <div className="w-full md:w-80 bg-zinc-950 border border-zinc-850 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex flex-col h-full gap-2.5">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block border-b border-zinc-850 pb-1.5 flex items-center justify-between">
            <span>Generation Console</span>
            <span className="text-[9px] text-zinc-600 font-mono">Server Proxy</span>
          </span>

          {/* Status Display */}
          <div className="flex-1 bg-zinc-950 rounded p-2.5 border border-zinc-900 font-mono text-[10px] text-zinc-400 overflow-y-auto max-h-[140px] whitespace-pre-wrap leading-relaxed">
            {isGenerating ? (
              <div className="flex items-center gap-2 text-pink-400 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing audio waveform...</span>
              </div>
            ) : (
              <span className="text-zinc-600 italic">No active generation task. Define a prompt to start.</span>
            )}
            {progressLog && <div className="mt-2 text-zinc-300">{progressLog}</div>}
            {error && <div className="mt-2 text-red-400 font-bold">{error}</div>}
            {isPermissionDenied && (
              <div className="mt-2 p-2 bg-amber-950/40 border border-amber-800/60 rounded text-[10px] text-amber-300">
                <div className="flex items-center gap-1 font-bold mb-1">
                  <AlertCircle className="w-3 h-3" />
                  Lyria Cloud API Info
                </div>
                Lyria model calls require a project with billing enabled in AI Studio. We seamlessly synthesized your stem with the Studio DSP engine.
              </div>
            )}
          </div>

          {/* Success result Card */}
          {generatedClip && (
            <div className="border border-green-900/40 bg-green-950/20 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>Audio Stem Rendered Successfully!</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono truncate">
                Name: {generatedClip.name}
              </p>
              <button
                onClick={playPreview}
                className="py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 text-[10px] font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Play className="w-3 h-3" />
                Audition Stem Solo
              </button>
            </div>
          )}
        </div>

        <div className="text-[9px] text-zinc-600 mt-2 text-center font-mono uppercase bg-zinc-900/30 py-1.5 rounded border border-zinc-900">
          Target track: <span className="text-pink-400 font-bold">{audioTrack.name}</span>
        </div>
      </div>
    </div>
  );
}
