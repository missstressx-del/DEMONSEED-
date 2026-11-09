import { SynthConfig, Track, MidiNote, DrumTrackState, AudioClip, VstPlugin, VstParameter, RitualState, FlowStateSettings, BrainwaveBand } from '../types';
import { getGroovePresetById, calculateStepGroove } from './groovePresets';

// Map pitch strings to frequencies
export const PITCH_TO_FREQ: { [key: string]: number } = {
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50,
};

export const PITCHES = Object.keys(PITCH_TO_FREQ).sort((a, b) => {
  // Sort by octave first, then by index in piano scale
  const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octaveA = parseInt(a.slice(-1));
  const octaveB = parseInt(b.slice(-1));
  if (octaveA !== octaveB) return octaveA - octaveB;
  
  const noteA = a.slice(0, -1);
  const noteB = b.slice(0, -1);
  return scale.indexOf(noteA) - scale.indexOf(noteB);
});

export class AudioEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  trackGains: Map<string, GainNode> = new Map();
  trackPanners: Map<string, StereoPannerNode> = new Map();
  delayNodes: Map<string, DelayNode> = new Map();
  delayFeedbackNodes: Map<string, GainNode> = new Map();
  
  // VST tracking
  trackVsts: Map<string, VstPlugin[]> = new Map();
  vstNodes: Map<string, AudioNode[]> = new Map();

  // Equalizer gains (in dB, range: -12 to 12)
  eqBass: number = 0;
  eqMid: number = 0;
  eqTreble: number = 0;

  // Equalizer nodes
  bassFilter: BiquadFilterNode | null = null;
  midFilter: BiquadFilterNode | null = null;
  trebleFilter: BiquadFilterNode | null = null;
  analyser: AnalyserNode | null = null;

  // Master Bus Compressor parameters and node
  compEnabled: boolean = true;
  compThreshold: number = -12; // dB, range: -40 to 0
  compRatio: number = 3.0; // range: 1 to 20
  compAttack: number = 0.012; // seconds, range: 0.001 to 0.1
  compRelease: number = 0.15; // seconds, range: 0.01 to 1.0
  masterCompressor: DynamicsCompressorNode | null = null;

  // Master Output Gain (trim before limiter)
  masterOutputGain: number = 0.0; // dB, range: -24 to +12 (0.0 dB is unity)
  masterOutputGainNode: GainNode | null = null;

  // Master Limiter parameters and nodes
  limiterEnabled: boolean = true;
  limiterThreshold: number = -1.0; // dB, range: -10 to 0
  limiterCeiling: number = -0.5; // dB, range: -3 to 0
  masterLimiter: DynamicsCompressorNode | null = null;
  limiterGain: GainNode | null = null;

  isPlaying: boolean = false;
  bpm: number = 120;
  currentStep: number = 0;
  totalSteps: number = 32; // 2 bars of 16th notes
  
  // Audio scheduler variables
  private schedulerTimerId: any = null;
  private nextNoteTime: number = 0.0; // when the next note is due
  private scheduleAheadTime: number = 0.1; // how far ahead to schedule (seconds)
  private lookahead: number = 25.0; // how frequently to call scheduler (ms)
  
  // Track Analysers for individual channel peak level metering
  trackAnalysers: Map<string, AnalyserNode> = new Map();
  
  // Track configurations (provided by React state)
  tracks: Track[] = [];
  
  // Active buffers loaded for audio clips
  audioBuffers: Map<string, AudioBuffer> = new Map();
  // Active playing buffer sources (so we can stop them)
  activeBufferSources: Map<string, AudioBufferSourceNode[]> = new Map();

  // Callbacks for UI updates
  onStepChange: ((step: number) => void) | null = null;
  onRitualStateChange: ((state: RitualState) => void) | null = null;

  // Stereo Analysers for Lissajous Vector Scope & Phase Telemetry
  analyserLeft: AnalyserNode | null = null;
  analyserRight: AnalyserNode | null = null;

  // Ritual Performance Engine Master Nodes
  ritualInputNode: GainNode | null = null;
  ritualOutputNode: GainNode | null = null;
  ritualFilterNode: BiquadFilterNode | null = null;
  ritualTapeShaper: WaveShaperNode | null = null;
  ritualTapeBrakeDelay: DelayNode | null = null;
  ritualFlutterDelay: DelayNode | null = null;
  ritualFlutterGain: GainNode | null = null;
  ritualFlutterLfo1: OscillatorNode | null = null;
  ritualFlutterLfo2: OscillatorNode | null = null;
  ritualStutterDelay: DelayNode | null = null;
  ritualStutterFeedback: GainNode | null = null;
  ritualStutterDry: GainNode | null = null;
  ritualStutterWet: GainNode | null = null;
  ritualVoidConvolver: ConvolverNode | null = null;
  ritualVoidDry: GainNode | null = null;
  ritualVoidWet: GainNode | null = null;

  // Ritual Performance State
  ritualState: RitualState = {
    isTapeStopping: false,
    isHalftime: false,
    stutterActive: false,
    stutterDivision: '1/16',
    voidReverbWet: 0,
    tapeRuinDrive: 0,
    tapeFlutter: 0,
    xyPad: { x: 0.5, y: 0.5, active: false },
  };

  private originalBpmBeforeHalftime: number | null = null;
  private tapeStopIntervalId: any = null;

  // Flow State Neural & Binaural Beat Engine State
  flowSettings: FlowStateSettings = {
    isEnabled: false,
    band: 'alpha',
    carrierFreq: 432,
    beatFreq: 10.0,
    waveType: 'sine',
    volume: 0.35,
    noiseType: 'pink',
    noiseVolume: 0.15,
    isochronic: false,
    pulseDepth: 0.5,
  };

  onFlowStateChange: ((settings: FlowStateSettings) => void) | null = null;

  private flowLeftOsc: OscillatorNode | null = null;
  private flowRightOsc: OscillatorNode | null = null;
  private flowPannerLeft: StereoPannerNode | null = null;
  private flowPannerRight: StereoPannerNode | null = null;
  private flowMasterGain: GainNode | null = null;
  private flowIsochronicGain: GainNode | null = null;
  private flowIsochronicLfo: OscillatorNode | null = null;
  private flowNoiseSource: AudioBufferSourceNode | null = null;
  private flowNoiseGain: GainNode | null = null;
  private flowNoiseFilter: BiquadFilterNode | null = null;

  constructor() {
    // Lazy initialize to bypass browser autoplay blocks
  }

  init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    
    // Initialize EQ filter nodes
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.setValueAtTime(150, this.ctx.currentTime); // Bass crossover at 150 Hz
    this.bassFilter.gain.setValueAtTime(this.eqBass, this.ctx.currentTime);

    this.midFilter = this.ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
    this.midFilter.frequency.setValueAtTime(1000, this.ctx.currentTime); // Mid peak at 1 kHz
    this.midFilter.gain.setValueAtTime(this.eqMid, this.ctx.currentTime);

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.setValueAtTime(4000, this.ctx.currentTime); // Treble crossover at 4 kHz
    this.trebleFilter.gain.setValueAtTime(this.eqTreble, this.ctx.currentTime);

    // Initialize AnalyserNode for real-time visualization
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.75;

    // Initialize Master Compressor Node
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    if (this.compEnabled) {
      this.masterCompressor.threshold.setValueAtTime(this.compThreshold, this.ctx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(this.compRatio, this.ctx.currentTime);
      this.masterCompressor.attack.setValueAtTime(this.compAttack, this.ctx.currentTime);
      this.masterCompressor.release.setValueAtTime(this.compRelease, this.ctx.currentTime);
    } else {
      // flat settings when bypassed
      this.masterCompressor.threshold.setValueAtTime(0, this.ctx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.25, this.ctx.currentTime);
    }

    // Initialize Master Limiter Nodes
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.limiterGain = this.ctx.createGain();
    
    if (this.limiterEnabled) {
      this.masterLimiter.threshold.setValueAtTime(this.limiterThreshold, this.ctx.currentTime);
      this.masterLimiter.ratio.setValueAtTime(20.0, this.ctx.currentTime); // brickwall ratio
      this.masterLimiter.attack.setValueAtTime(0.003, this.ctx.currentTime); // ultra fast attack
      this.masterLimiter.release.setValueAtTime(0.10, this.ctx.currentTime); // release
      this.masterLimiter.knee.setValueAtTime(0.0, this.ctx.currentTime); // hard knee
      
      const ceilingGainVal = Math.pow(10, this.limiterCeiling / 20);
      this.limiterGain.gain.setValueAtTime(ceilingGainVal, this.ctx.currentTime);
    } else {
      // flat settings when bypassed
      this.masterLimiter.threshold.setValueAtTime(0, this.ctx.currentTime);
      this.masterLimiter.ratio.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterLimiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.masterLimiter.release.setValueAtTime(0.10, this.ctx.currentTime);
      this.masterLimiter.knee.setValueAtTime(0.0, this.ctx.currentTime);
      
      this.limiterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    }

    // Initialize Master Output Gain (trim before limiter)
    this.masterOutputGainNode = this.ctx.createGain();
    const initialOutputGainVal = Math.pow(10, this.masterOutputGain / 20);
    this.masterOutputGainNode.gain.setValueAtTime(initialOutputGainVal, this.ctx.currentTime);

    // Routing: masterGain -> bassFilter -> midFilter -> trebleFilter -> ritualInputNode -> (Ritual Chain) -> ritualOutputNode -> masterCompressor -> masterOutputGainNode -> masterLimiter -> limiterGain -> analyser -> ctx.destination
    this.initRitualEngineNodes();

    this.masterGain.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.ritualInputNode!);
    this.ritualOutputNode!.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterOutputGainNode);
    this.masterOutputGainNode.connect(this.masterLimiter);
    this.masterLimiter.connect(this.limiterGain);
    this.limiterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Initialize Stereo Splitters for Lissajous Vector Scope
    this.analyserLeft = this.ctx.createAnalyser();
    this.analyserLeft.fftSize = 512;
    this.analyserLeft.smoothingTimeConstant = 0.6;
    this.analyserRight = this.ctx.createAnalyser();
    this.analyserRight.fftSize = 512;
    this.analyserRight.smoothingTimeConstant = 0.6;
    const splitter = this.ctx.createChannelSplitter(2);
    this.limiterGain.connect(splitter);
    splitter.connect(this.analyserLeft, 0);
    splitter.connect(this.analyserRight, 1);
    
    console.info("Web Audio Engine with Ritual Engine, 3-Band Equalizer, Master Bus Compressor, Master Output Gain, and Vector Scope initialized successfully.");
  }

  setMasterCompressor(enabled: boolean, threshold: number, ratio: number, attack: number, release: number) {
    this.compEnabled = enabled;
    this.compThreshold = threshold;
    this.compRatio = ratio;
    this.compAttack = attack;
    this.compRelease = release;

    if (this.ctx && this.masterCompressor) {
      const now = this.ctx.currentTime;
      if (enabled) {
        this.masterCompressor.threshold.setValueAtTime(threshold, now);
        this.masterCompressor.ratio.setValueAtTime(ratio, now);
        this.masterCompressor.attack.setValueAtTime(attack, now);
        this.masterCompressor.release.setValueAtTime(release, now);
      } else {
        // Bypass values
        this.masterCompressor.threshold.setValueAtTime(0, now);
        this.masterCompressor.ratio.setValueAtTime(1.0, now);
        this.masterCompressor.attack.setValueAtTime(0.003, now);
        this.masterCompressor.release.setValueAtTime(0.25, now);
      }
    }
  }

  setMasterLimiter(enabled: boolean, threshold: number, ceiling: number) {
    this.limiterEnabled = enabled;
    this.limiterThreshold = threshold;
    this.limiterCeiling = ceiling;

    if (this.ctx && this.masterLimiter && this.limiterGain) {
      const now = this.ctx.currentTime;
      if (enabled) {
        this.masterLimiter.threshold.setValueAtTime(threshold, now);
        this.masterLimiter.ratio.setValueAtTime(20.0, now);
        this.masterLimiter.attack.setValueAtTime(0.003, now);
        this.masterLimiter.release.setValueAtTime(0.10, now);
        this.masterLimiter.knee.setValueAtTime(0.0, now);
        
        const ceilingGainVal = Math.pow(10, ceiling / 20);
        this.limiterGain.gain.setValueAtTime(ceilingGainVal, now);
      } else {
        // Bypass values
        this.masterLimiter.threshold.setValueAtTime(0, now);
        this.masterLimiter.ratio.setValueAtTime(1.0, now);
        this.masterLimiter.attack.setValueAtTime(0.003, now);
        this.masterLimiter.release.setValueAtTime(0.10, now);
        this.masterLimiter.knee.setValueAtTime(0.0, now);
        
        this.limiterGain.gain.setValueAtTime(1.0, now);
      }
    }
  }

  setMasterOutputGain(gainDb: number) {
    this.masterOutputGain = gainDb;
    if (this.ctx && this.masterOutputGainNode) {
      const now = this.ctx.currentTime;
      const gainVal = Math.pow(10, gainDb / 20);
      this.masterOutputGainNode.gain.setValueAtTime(gainVal, now);
    }
  }

  getMasterOutputGain(): number {
    return this.masterOutputGain;
  }

  setEQ(bass: number, mid: number, treble: number) {
    this.eqBass = bass;
    this.eqMid = mid;
    this.eqTreble = treble;

    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.bassFilter) {
        this.bassFilter.gain.setValueAtTime(bass, now);
      }
      if (this.midFilter) {
        this.midFilter.gain.setValueAtTime(mid, now);
      }
      if (this.trebleFilter) {
        this.trebleFilter.gain.setValueAtTime(treble, now);
      }
    }
  }

  // ==========================================
  // RITUAL PERFORMANCE ENGINE IMPLEMENTATION
  // ==========================================

  private makeSaturationCurve(amount: number = 0.5): Float32Array {
    const k = Math.max(0, Math.min(100, amount * 50));
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      if (k === 0) {
        curve[i] = x;
      } else {
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
    }
    return curve;
  }

  private createSalemReverbImpulse(durationSec: number = 3.8, decay: number = 2.2): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext not ready");
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const envelope = Math.exp(-t * decay);
      // Dark cathedral dampening over time
      const damp = Math.cos((i / length) * Math.PI * 0.5);
      left[i] = (Math.random() * 2 - 1) * envelope * damp;
      right[i] = (Math.random() * 2 - 1) * envelope * damp;
    }
    return impulse;
  }

  initRitualEngineNodes() {
    if (!this.ctx) return;

    this.ritualInputNode = this.ctx.createGain();
    this.ritualOutputNode = this.ctx.createGain();

    // 1. Resonant filter for XY Pad
    this.ritualFilterNode = this.ctx.createBiquadFilter();
    this.ritualFilterNode.type = 'lowpass';
    this.ritualFilterNode.frequency.setValueAtTime(20000, this.ctx.currentTime);
    this.ritualFilterNode.Q.setValueAtTime(1.0, this.ctx.currentTime);

    // 2. Tape Ruin Shaper
    this.ritualTapeShaper = this.ctx.createWaveShaper();
    this.ritualTapeShaper.curve = this.makeSaturationCurve(0.0) as Float32Array<ArrayBuffer>;
    this.ritualTapeShaper.oversample = '2x';

    // 3. Tape Wow/Flutter pitch delay modulation
    this.ritualFlutterDelay = this.ctx.createDelay(0.1);
    this.ritualFlutterDelay.delayTime.setValueAtTime(0.015, this.ctx.currentTime);
    this.ritualFlutterGain = this.ctx.createGain();
    this.ritualFlutterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.ritualFlutterLfo1 = this.ctx.createOscillator();
    this.ritualFlutterLfo1.type = 'sine';
    this.ritualFlutterLfo1.frequency.setValueAtTime(0.6, this.ctx.currentTime); // Slow wow (0.6 Hz)

    this.ritualFlutterLfo2 = this.ctx.createOscillator();
    this.ritualFlutterLfo2.type = 'triangle';
    this.ritualFlutterLfo2.frequency.setValueAtTime(5.2, this.ctx.currentTime); // Fast flutter (5.2 Hz)

    this.ritualFlutterLfo1.connect(this.ritualFlutterGain);
    this.ritualFlutterLfo2.connect(this.ritualFlutterGain);
    this.ritualFlutterGain.connect(this.ritualFlutterDelay.delayTime);

    try {
      this.ritualFlutterLfo1.start();
      this.ritualFlutterLfo2.start();
    } catch (e) {
      // Ignored if already started
    }

    // 4. Glitch Stutter Repeater
    this.ritualStutterDelay = this.ctx.createDelay(1.5);
    this.ritualStutterDelay.delayTime.setValueAtTime(0.125, this.ctx.currentTime);
    this.ritualStutterFeedback = this.ctx.createGain();
    this.ritualStutterFeedback.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.ritualStutterDry = this.ctx.createGain();
    this.ritualStutterDry.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.ritualStutterWet = this.ctx.createGain();
    this.ritualStutterWet.gain.setValueAtTime(0.0, this.ctx.currentTime);

    // Stutter feedback loop
    this.ritualStutterDelay.connect(this.ritualStutterFeedback);
    this.ritualStutterFeedback.connect(this.ritualStutterDelay);
    this.ritualStutterDelay.connect(this.ritualStutterWet);

    // 5. Salem Void Cathedral Reverb
    this.ritualVoidConvolver = this.ctx.createConvolver();
    try {
      this.ritualVoidConvolver.buffer = this.createSalemReverbImpulse(4.0, 2.0);
    } catch (err) {
      console.warn("Could not generate Salem Reverb impulse", err);
    }
    this.ritualVoidDry = this.ctx.createGain();
    this.ritualVoidDry.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.ritualVoidWet = this.ctx.createGain();
    this.ritualVoidWet.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.ritualVoidConvolver.connect(this.ritualVoidWet);

    // Chain connections:
    // ritualInputNode -> ritualFilterNode -> ritualTapeShaper -> ritualFlutterDelay ->
    // -> [Dry + Stutter] -> [Void Dry + Void Wet] -> ritualOutputNode
    this.ritualInputNode.connect(this.ritualFilterNode);
    this.ritualFilterNode.connect(this.ritualTapeShaper);
    this.ritualTapeShaper.connect(this.ritualFlutterDelay);

    // Send into stutter dry and delay
    this.ritualFlutterDelay.connect(this.ritualStutterDry);
    this.ritualFlutterDelay.connect(this.ritualStutterDelay);

    // Combine stutter dry + wet into void section
    const stutterBus = this.ctx.createGain();
    this.ritualStutterDry.connect(stutterBus);
    this.ritualStutterWet.connect(stutterBus);

    stutterBus.connect(this.ritualVoidDry);
    stutterBus.connect(this.ritualVoidConvolver);

    this.ritualVoidDry.connect(this.ritualOutputNode);
    this.ritualVoidWet.connect(this.ritualOutputNode);
  }

  notifyRitualState() {
    if (this.onRitualStateChange) {
      this.onRitualStateChange({ ...this.ritualState, xyPad: { ...this.ritualState.xyPad } });
    }
  }

  triggerTapeStop(durationSeconds: number = 1.4, autoResume: boolean = true) {
    if (!this.ctx || !this.isPlaying) return;

    if (this.tapeStopIntervalId) {
      clearInterval(this.tapeStopIntervalId);
      this.tapeStopIntervalId = null;
    }

    const startBpm = this.bpm;
    const startTime = Date.now();
    const durationMs = durationSeconds * 1000;

    this.ritualState.isTapeStopping = true;
    this.notifyRitualState();

    // Deceleration curve
    this.tapeStopIntervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);
      
      // Decelerate via cubic easing
      const factor = Math.max(0.05, Math.pow(1 - progress, 2.5));
      this.bpm = Math.max(10, Math.round(startBpm * factor));

      if (progress >= 1.0) {
        clearInterval(this.tapeStopIntervalId);
        this.tapeStopIntervalId = null;

        if (autoResume) {
          setTimeout(() => {
            this.spoolUpTape(startBpm, 0.7);
          }, 300);
        } else {
          this.pause();
          this.bpm = startBpm;
          this.ritualState.isTapeStopping = false;
          this.notifyRitualState();
        }
      }
    }, 25);
  }

  spoolUpTape(targetBpm?: number, durationSeconds: number = 0.8) {
    if (this.tapeStopIntervalId) {
      clearInterval(this.tapeStopIntervalId);
      this.tapeStopIntervalId = null;
    }

    const startBpm = this.bpm;
    const finalBpm = targetBpm || (this.originalBpmBeforeHalftime || 120);
    const startTime = Date.now();
    const durationMs = durationSeconds * 1000;

    this.tapeStopIntervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);
      // Accelerate back to target
      const ease = 1 - Math.pow(1 - progress, 3);
      this.bpm = Math.round(startBpm + (finalBpm - startBpm) * ease);

      if (progress >= 1.0) {
        clearInterval(this.tapeStopIntervalId);
        this.tapeStopIntervalId = null;
        this.bpm = finalBpm;
        this.ritualState.isTapeStopping = false;
        this.notifyRitualState();
      }
    }, 25);
  }

  toggleHalftime(forcedState?: boolean) {
    const newState = forcedState !== undefined ? forcedState : !this.ritualState.isHalftime;
    this.ritualState.isHalftime = newState;

    if (newState) {
      this.originalBpmBeforeHalftime = this.bpm;
      this.bpm = Math.max(30, Math.round(this.bpm * 0.5));
      // Dark tape warming
      if (this.ctx && this.ritualFilterNode) {
        this.ritualFilterNode.frequency.setTargetAtTime(3200, this.ctx.currentTime, 0.08);
      }
    } else {
      if (this.originalBpmBeforeHalftime) {
        this.bpm = this.originalBpmBeforeHalftime;
      }
      if (this.ctx && this.ritualFilterNode && !this.ritualState.xyPad.active) {
        this.ritualFilterNode.frequency.setTargetAtTime(20000, this.ctx.currentTime, 0.08);
      }
    }
    this.notifyRitualState();
  }

  setStutter(active: boolean, division: '1/16' | '1/32' | '1/8T' = '1/16') {
    this.ritualState.stutterActive = active;
    this.ritualState.stutterDivision = division;

    if (this.ctx && this.ritualStutterDelay && this.ritualStutterFeedback && this.ritualStutterDry && this.ritualStutterWet) {
      const now = this.ctx.currentTime;
      if (active) {
        // Calculate delay time in seconds
        const quarterNoteSec = 60 / Math.max(30, this.bpm);
        let delayTime = quarterNoteSec * 0.25; // 1/16
        if (division === '1/32') delayTime = quarterNoteSec * 0.125;
        if (division === '1/8T') delayTime = quarterNoteSec * (2 / 3) * 0.5;

        this.ritualStutterDelay.delayTime.setValueAtTime(delayTime, now);
        this.ritualStutterFeedback.gain.setTargetAtTime(0.88, now, 0.01);
        this.ritualStutterWet.gain.setTargetAtTime(0.95, now, 0.01);
        this.ritualStutterDry.gain.setTargetAtTime(0.05, now, 0.01);
      } else {
        this.ritualStutterFeedback.gain.setTargetAtTime(0.0, now, 0.02);
        this.ritualStutterWet.gain.setTargetAtTime(0.0, now, 0.03);
        this.ritualStutterDry.gain.setTargetAtTime(1.0, now, 0.02);
      }
    }
    this.notifyRitualState();
  }

  setVoidReverb(wet: number) {
    const clamped = Math.max(0, Math.min(1, wet));
    this.ritualState.voidReverbWet = clamped;

    if (this.ctx && this.ritualVoidDry && this.ritualVoidWet) {
      const now = this.ctx.currentTime;
      this.ritualVoidWet.gain.setTargetAtTime(clamped * 0.85, now, 0.03);
      this.ritualVoidDry.gain.setTargetAtTime(1.0 - clamped * 0.45, now, 0.03);
    }
    this.notifyRitualState();
  }

  setTapeRuin(drive: number, flutter: number) {
    const clampedDrive = Math.max(0, Math.min(1, drive));
    const clampedFlutter = Math.max(0, Math.min(1, flutter));

    this.ritualState.tapeRuinDrive = clampedDrive;
    this.ritualState.tapeFlutter = clampedFlutter;

    if (this.ctx) {
      if (this.ritualTapeShaper) {
        this.ritualTapeShaper.curve = this.makeSaturationCurve(clampedDrive) as Float32Array<ArrayBuffer>;
      }
      if (this.ritualFlutterGain) {
        // Up to 0.003s pitch jitter
        this.ritualFlutterGain.gain.setTargetAtTime(clampedFlutter * 0.0035, this.ctx.currentTime, 0.05);
      }
    }
    this.notifyRitualState();
  }

  setRitualXY(x: number, y: number, active: boolean) {
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    this.ritualState.xyPad = { x: clampedX, y: clampedY, active };

    if (this.ctx && this.ritualFilterNode) {
      const now = this.ctx.currentTime;
      if (active) {
        // Frequency exponential mapping 120Hz .. 18000Hz
        const cutoff = 120 * Math.pow(18000 / 120, clampedX);
        const qVal = 0.5 + clampedY * 11.5;
        this.ritualFilterNode.frequency.setTargetAtTime(cutoff, now, 0.02);
        this.ritualFilterNode.Q.setTargetAtTime(qVal, now, 0.02);

        // Drive wave shaper slightly on high Y
        if (this.ritualTapeShaper && clampedY > 0.4) {
          const driveAmount = (clampedY - 0.4) * 0.9;
          this.ritualTapeShaper.curve = this.makeSaturationCurve(driveAmount) as Float32Array<ArrayBuffer>;
        }
      } else {
        // Return to neutral
        this.ritualFilterNode.frequency.setTargetAtTime(this.ritualState.isHalftime ? 3200 : 20000, now, 0.08);
        this.ritualFilterNode.Q.setTargetAtTime(1.0, now, 0.08);
        if (this.ritualTapeShaper) {
          this.ritualTapeShaper.curve = this.makeSaturationCurve(this.ritualState.tapeRuinDrive) as Float32Array<ArrayBuffer>;
        }
      }
    }
    this.notifyRitualState();
  }

  // Synthesizes Occult Formant Vocal Resonance
  triggerFormantVowel(vowel: string = 'A', freqHz: number = 130.81, durationSec: number = 0.8) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // Formant filter frequencies
    const FORMANT_MAP: Record<string, { f1: number; f2: number; q1: number; q2: number; sub?: boolean }> = {
      'A': { f1: 800, f2: 1200, q1: 5, q2: 6 },
      'E': { f1: 400, f2: 2200, q1: 6, q2: 7 },
      'I': { f1: 280, f2: 2600, q1: 7, q2: 8 },
      'O': { f1: 500, f2: 900, q1: 5, q2: 5 },
      'U': { f1: 320, f2: 700, q1: 6, q2: 6 },
      'AUM': { f1: 600, f2: 1050, q1: 6, q2: 6, sub: true },
      'MORTIS': { f1: 250, f2: 1400, q1: 8, q2: 8, sub: true },
      'WITCH': { f1: 450, f2: 3000, q1: 9, q2: 9, sub: true },
    };

    const formant = FORMANT_MAP[vowel.toUpperCase()] || FORMANT_MAP['A'];

    // Carrier oscillators (detuned saws)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freqHz, now);
    osc2.frequency.setValueAtTime(freqHz * 1.008, now); // subtle chorusing

    // Formant filters in parallel
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(formant.f1, now);
    filter1.Q.setValueAtTime(formant.q1, now);

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(formant.f2, now);
    filter2.Q.setValueAtTime(formant.q2, now);

    const voxGain = this.ctx.createGain();
    voxGain.gain.setValueAtTime(0.001, now);
    voxGain.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
    voxGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc1.connect(filter1);
    osc2.connect(filter1);
    osc1.connect(filter2);
    osc2.connect(filter2);

    filter1.connect(voxGain);
    filter2.connect(voxGain);

    // Optional sub drone oscillator
    let subOsc: OscillatorNode | null = null;
    if (formant.sub) {
      subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freqHz * 0.5, now);
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.exponentialRampToValueAtTime(0.25, now + 0.08);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + durationSec + 0.1);
    }

    voxGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec + 0.05);
    osc2.stop(now + durationSec + 0.05);
  }

  // ==========================================
  // FLOW STATE NEURAL & BINAURAL BEAT ENGINE
  // ==========================================

  get flowState(): FlowStateSettings {
    return this.flowSettings;
  }

  private createFlowNoiseBuffer(type: 'pink' | 'brown' | 'void'): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext not ready");
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 5; // 5 seconds looped
    const buffer = this.ctx.createBuffer(2, bufferSize, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (type === 'brown' || type === 'void') {
      let lastOutL = 0.0;
      let lastOutR = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;
        lastOutL = (lastOutL + 0.02 * whiteL) / 1.02;
        lastOutR = (lastOutR + 0.02 * whiteR) / 1.02;
        left[i] = lastOutL * 3.5;
        right[i] = lastOutR * 3.5;
      }
    } else {
      // Pink noise using Paul Kellet's filter
      let b0L = 0, b1L = 0, b2L = 0, b3L = 0, b4L = 0, b5L = 0, b6L = 0;
      let b0R = 0, b1R = 0, b2R = 0, b3R = 0, b4R = 0, b5R = 0, b6R = 0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;

        b0L = 0.99886 * b0L + whiteL * 0.0555179;
        b1L = 0.99332 * b1L + whiteL * 0.0750759;
        b2L = 0.96900 * b2L + whiteL * 0.1538520;
        b3L = 0.86650 * b3L + whiteL * 0.3104856;
        b4L = 0.55000 * b4L + whiteL * 0.5329522;
        b5L = -0.7616 * b5L - whiteL * 0.0168980;
        left[i] = (b0L + b1L + b2L + b3L + b4L + b5L + b6L + whiteL * 0.5362) * 0.11;
        b6L = whiteL * 0.115926;

        b0R = 0.99886 * b0R + whiteR * 0.0555179;
        b1R = 0.99332 * b1R + whiteR * 0.0750759;
        b2R = 0.96900 * b2R + whiteR * 0.1538520;
        b3R = 0.86650 * b3R + whiteR * 0.3104856;
        b4R = 0.55000 * b4R + whiteR * 0.5329522;
        b5R = -0.7616 * b5R - whiteR * 0.0168980;
        right[i] = (b0R + b1R + b2R + b3R + b4R + b5R + b6R + whiteR * 0.5362) * 0.11;
        b6R = whiteR * 0.115926;
      }
    }

    return buffer;
  }

  setFlowState(settings: Partial<FlowStateSettings>) {
    this.flowSettings = { ...this.flowSettings, ...settings };

    // Auto-calculate band from beat frequency if beat frequency changed
    if (settings.beatFreq !== undefined && settings.band === undefined) {
      const bf = settings.beatFreq;
      if (bf < 4) this.flowSettings.band = 'delta';
      else if (bf < 8) this.flowSettings.band = 'theta';
      else if (bf < 14) this.flowSettings.band = 'alpha';
      else if (bf < 30) this.flowSettings.band = 'beta';
      else this.flowSettings.band = 'gamma';
    }

    if (this.onFlowStateChange) {
      this.onFlowStateChange({ ...this.flowSettings });
    }

    if (this.flowSettings.isEnabled) {
      this.startFlowState();
    } else {
      this.stopFlowState();
    }
  }

  startFlowState() {
    this.init();
    if (!this.ctx) return;

    const { carrierFreq, beatFreq, waveType, volume, noiseType, noiseVolume, isochronic, pulseDepth } = this.flowSettings;
    const now = this.ctx.currentTime;

    // Left ear = Carrier - (Beat / 2), Right ear = Carrier + (Beat / 2)
    const freqLeft = Math.max(20, carrierFreq - beatFreq / 2);
    const freqRight = Math.max(20, carrierFreq + beatFreq / 2);

    // If nodes already exist, smoothly transition parameters
    if (this.flowLeftOsc && this.flowRightOsc && this.flowMasterGain) {
      this.flowLeftOsc.type = waveType;
      this.flowRightOsc.type = waveType;
      this.flowLeftOsc.frequency.setTargetAtTime(freqLeft, now, 0.05);
      this.flowRightOsc.frequency.setTargetAtTime(freqRight, now, 0.05);
      this.flowMasterGain.gain.setTargetAtTime(volume * 0.4, now, 0.05);

      if (this.flowNoiseGain) {
        const effectiveNoiseVol = noiseType !== 'none' ? noiseVolume * 0.35 : 0.0;
        this.flowNoiseGain.gain.setTargetAtTime(effectiveNoiseVol, now, 0.05);
      }

      if (this.flowIsochronicLfo && this.flowIsochronicGain) {
        this.flowIsochronicLfo.frequency.setTargetAtTime(beatFreq, now, 0.05);
        this.flowIsochronicGain.gain.setTargetAtTime(isochronic ? pulseDepth * 0.5 : 0.0, now, 0.05);
      }
      return;
    }

    // Otherwise instantiate new dedicated binaural chain
    this.stopFlowState(); // Clean up old nodes if any

    this.flowMasterGain = this.ctx.createGain();
    this.flowMasterGain.gain.setValueAtTime(0.001, now);
    this.flowMasterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.4), now + 0.15);

    // Left Channel
    this.flowLeftOsc = this.ctx.createOscillator();
    this.flowLeftOsc.type = waveType;
    this.flowLeftOsc.frequency.setValueAtTime(freqLeft, now);
    this.flowPannerLeft = this.ctx.createStereoPanner();
    this.flowPannerLeft.pan.setValueAtTime(-1.0, now); // Hard Left

    // Right Channel
    this.flowRightOsc = this.ctx.createOscillator();
    this.flowRightOsc.type = waveType;
    this.flowRightOsc.frequency.setValueAtTime(freqRight, now);
    this.flowPannerRight = this.ctx.createStereoPanner();
    this.flowPannerRight.pan.setValueAtTime(1.0, now); // Hard Right

    this.flowLeftOsc.connect(this.flowPannerLeft);
    this.flowRightOsc.connect(this.flowPannerRight);

    // Isochronic pulse modulator
    const isochronicCarrierGain = this.ctx.createGain();
    isochronicCarrierGain.gain.setValueAtTime(1.0, now);

    this.flowIsochronicGain = this.ctx.createGain();
    this.flowIsochronicGain.gain.setValueAtTime(isochronic ? pulseDepth * 0.5 : 0.0, now);

    this.flowIsochronicLfo = this.ctx.createOscillator();
    this.flowIsochronicLfo.type = 'sine';
    this.flowIsochronicLfo.frequency.setValueAtTime(beatFreq, now);
    this.flowIsochronicLfo.connect(this.flowIsochronicGain);
    this.flowIsochronicGain.connect(isochronicCarrierGain.gain);

    this.flowPannerLeft.connect(isochronicCarrierGain);
    this.flowPannerRight.connect(isochronicCarrierGain);
    isochronicCarrierGain.connect(this.flowMasterGain);

    // Ambient Noise Bed
    if (noiseType !== 'none') {
      try {
        const noiseBuffer = this.createFlowNoiseBuffer(noiseType);
        this.flowNoiseSource = this.ctx.createBufferSource();
        this.flowNoiseSource.buffer = noiseBuffer;
        this.flowNoiseSource.loop = true;

        this.flowNoiseFilter = this.ctx.createBiquadFilter();
        this.flowNoiseFilter.type = 'lowpass';
        this.flowNoiseFilter.frequency.setValueAtTime(noiseType === 'brown' ? 450 : 1200, now);

        this.flowNoiseGain = this.ctx.createGain();
        this.flowNoiseGain.gain.setValueAtTime(noiseVolume * 0.35, now);

        this.flowNoiseSource.connect(this.flowNoiseFilter);
        this.flowNoiseFilter.connect(this.flowNoiseGain);
        this.flowNoiseGain.connect(this.flowMasterGain);

        this.flowNoiseSource.start(now);
      } catch (err) {
        console.warn("Noise buffer generation failed", err);
      }
    }

    // Connect directly to output destination so binaural beat stays pristine & unaffected by master comp
    this.flowMasterGain.connect(this.ctx.destination);

    this.flowLeftOsc.start(now);
    this.flowRightOsc.start(now);
    this.flowIsochronicLfo.start(now);
  }

  stopFlowState() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (this.flowMasterGain) {
      try {
        this.flowMasterGain.gain.setTargetAtTime(0.0001, now, 0.05);
      } catch (e) {}
    }

    setTimeout(() => {
      if (this.flowLeftOsc) {
        try { this.flowLeftOsc.stop(); this.flowLeftOsc.disconnect(); } catch (e) {}
        this.flowLeftOsc = null;
      }
      if (this.flowRightOsc) {
        try { this.flowRightOsc.stop(); this.flowRightOsc.disconnect(); } catch (e) {}
        this.flowRightOsc = null;
      }
      if (this.flowIsochronicLfo) {
        try { this.flowIsochronicLfo.stop(); this.flowIsochronicLfo.disconnect(); } catch (e) {}
        this.flowIsochronicLfo = null;
      }
      if (this.flowNoiseSource) {
        try { this.flowNoiseSource.stop(); this.flowNoiseSource.disconnect(); } catch (e) {}
        this.flowNoiseSource = null;
      }
      if (this.flowMasterGain) {
        try { this.flowMasterGain.disconnect(); } catch (e) {}
        this.flowMasterGain = null;
      }
    }, 80);
  }

  setTracks(tracks: Track[]) {
    this.tracks = tracks;
    if (!this.ctx) return;

    // Build/rebuild gain, panners, analysers, and delays for tracks
    tracks.forEach(track => {
      if (!this.trackGains.has(track.id)) {
        const gain = this.ctx!.createGain();
        const panner = this.ctx!.createStereoPanner();
        const analyser = this.ctx!.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.6;
        
        // Delay effect nodes
        const delay = this.ctx!.createDelay(2.0);
        const feedback = this.ctx!.createGain();
        
        delay.delayTime.value = track.synthConfig?.delayTime ?? 0.25;
        feedback.gain.value = track.synthConfig?.delayFeedback ?? 0.3;
        
        // Connect delay feedback loop
        delay.connect(feedback);
        feedback.connect(delay);
        
        // Connect main chain: gain -> analyser -> panner -> masterGain
        gain.connect(analyser);
        analyser.connect(panner);
        panner.connect(this.masterGain!);
        
        // Connect delay node in parallel to track panner
        delay.connect(panner);

        this.trackGains.set(track.id, gain);
        this.trackAnalysers.set(track.id, analyser);
        this.trackPanners.set(track.id, panner);
        this.delayNodes.set(track.id, delay);
        this.delayFeedbackNodes.set(track.id, feedback);
      }

      // Update parameters
      const gainNode = this.trackGains.get(track.id);
      const pannerNode = this.trackPanners.get(track.id);
      const delayNode = this.delayNodes.get(track.id);
      const feedbackNode = this.delayFeedbackNodes.get(track.id);

      if (gainNode && pannerNode) {
        // Handle Mute / Solo logic
        const anySoloed = this.tracks.some(t => t.soloed);
        let targetGain = track.volume;
        
        if (track.muted) {
          targetGain = 0;
        } else if (anySoloed && !track.soloed) {
          targetGain = 0;
        }

        gainNode.gain.setValueAtTime(targetGain, this.ctx!.currentTime);
        pannerNode.pan.setValueAtTime(track.pan, this.ctx!.currentTime);
      }

      if (delayNode && feedbackNode && track.synthConfig) {
        delayNode.delayTime.setValueAtTime(track.synthConfig.delayTime, this.ctx!.currentTime);
        feedbackNode.gain.setValueAtTime(track.synthConfig.delayFeedback, this.ctx!.currentTime);
      }

      // Apply any configured VSTs for this track
      const existingVsts = this.trackVsts.get(track.id);
      if (existingVsts) {
        this.applyTrackVsts(track.id, existingVsts);
      }
    });
  }

  applyTrackVsts(trackId: string, vsts: VstPlugin[]) {
    this.trackVsts.set(trackId, vsts);
    this.init(); // ensure ctx exists
    if (!this.ctx) return;

    const gainNode = this.trackGains.get(trackId);
    const pannerNode = this.trackPanners.get(trackId);
    if (!gainNode || !pannerNode) return;

    // Disconnect gainNode and existing VST nodes
    try {
      gainNode.disconnect();
    } catch (e) {}

    const oldNodes = this.vstNodes.get(trackId) || [];
    oldNodes.forEach(node => {
      try {
        node.disconnect();
        // Stop any internal oscillators to prevent leakage
        if ((node as any)._internalOsc) {
          try { (node as any)._internalOsc.stop(); } catch (e) {}
        }
        if ((node as any)._additionalOsc) {
          try { (node as any)._additionalOsc.stop(); } catch (e) {}
        }
        // Check if there is any connect target override (like Chorus Delay)
        if ((node as any)._connectTargetOverride) {
          (node as any)._connectTargetOverride.disconnect();
        }
      } catch (e) {}
    });

    const activeVstNodes: AudioNode[] = [];

    // Filter to only enabled VSTs
    const enabledVsts = vsts.filter(v => v.isEnabled);

    enabledVsts.forEach(vst => {
      try {
        let vstNode: AudioNode | null = null;

        if (vst.code) {
          // Eval Custom JavaScript VST node!
          const paramsObj: { [key: string]: number } = {};
          vst.parameters.forEach(p => {
            paramsObj[p.id] = p.value;
          });
          try {
            // Create dynamic AudioNode with eval constructor
            const customBuilder = new Function('ctx', 'params', vst.code);
            const customNode = customBuilder(this.ctx, paramsObj);
            if (customNode && typeof customNode.connect === 'function') {
              vstNode = customNode;
            }
          } catch (err) {
            console.error(`Error compiling custom VST ${vst.name}:`, err);
          }
        } else if (vst.id === 'bitcrusher') {
          // Bitcrusher-9000
          const shaper = this.ctx!.createWaveShaper();
          const amountParam = vst.parameters.find(p => p.id === 'amount')?.value ?? 50;
          
          const n_samples = 44100;
          const curve = new Float32Array(n_samples);
          const steps = Math.max(2, Math.floor(100 - amountParam)); // lower steps = more crushed
          for (let i = 0 ; i < n_samples; ++i ) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = Math.round(x * steps) / steps;
          }
          shaper.curve = curve;
          vstNode = shaper;

        } else if (vst.id === 'saturator') {
          // Saturator Shaper Tube Overdrive
          const shaper = this.ctx!.createWaveShaper();
          const drive = vst.parameters.find(p => p.id === 'drive')?.value ?? 5;
          
          const n_samples = 44100;
          const curve = new Float32Array(n_samples);
          for (let i = 0 ; i < n_samples; ++i ) {
            const x = (i * 2) / n_samples - 1;
            const absX = Math.abs(x);
            // soft tube saturation formula
            curve[i] = x * (absX + drive) / (x * x + (drive - 1) * absX + 1);
          }
          shaper.curve = curve;
          vstNode = shaper;

        } else if (vst.id === 'ringmod') {
          // Psychedelic Metallic Ring Modulator
          const ringGain = this.ctx!.createGain();
          const ringOsc = this.ctx!.createOscillator();
          const depth = (vst.parameters.find(p => p.id === 'depth')?.value ?? 80) / 100;
          const freq = vst.parameters.find(p => p.id === 'frequency')?.value ?? 440;
          
          ringOsc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
          
          const oscGain = this.ctx!.createGain();
          oscGain.gain.setValueAtTime(depth, this.ctx!.currentTime);
          
          ringOsc.connect(oscGain);
          oscGain.connect(ringGain.gain);
          
          ringOsc.start();
          
          vstNode = ringGain;
          (ringGain as any)._internalOsc = ringOsc;

        } else if (vst.id === 'autowah') {
          // Auto-Wah Sweep Filter
          const filter = this.ctx!.createBiquadFilter();
          filter.type = 'peaking';
          filter.Q.value = vst.parameters.find(p => p.id === 'resonance')?.value ?? 5;
          
          const speed = vst.parameters.find(p => p.id === 'speed')?.value ?? 4;
          const depth = vst.parameters.find(p => p.id === 'depth')?.value ?? 1500;
          const baseFreq = vst.parameters.find(p => p.id === 'baseFreq')?.value ?? 1000;
          
          filter.frequency.setValueAtTime(baseFreq, this.ctx!.currentTime);
          
          const lfo = this.ctx!.createOscillator();
          lfo.frequency.setValueAtTime(speed, this.ctx!.currentTime);
          
          const lfoGain = this.ctx!.createGain();
          lfoGain.gain.setValueAtTime(depth, this.ctx!.currentTime);
          
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start();
          
          vstNode = filter;
          (filter as any)._internalOsc = lfo;

        } else if (vst.id === 'chorusdelay') {
          // Echo Llama Chorus Delay
          const delay = this.ctx!.createDelay(2.0);
          const feedback = this.ctx!.createGain();
          const wet = this.ctx!.createGain();
          const dry = this.ctx!.createGain();
          
          const dTime = vst.parameters.find(p => p.id === 'delayTime')?.value ?? 0.3;
          const fBack = vst.parameters.find(p => p.id === 'feedback')?.value ?? 0.4;
          const wetMix = vst.parameters.find(p => p.id === 'mix')?.value ?? 0.5;
          
          delay.delayTime.setValueAtTime(dTime, this.ctx!.currentTime);
          feedback.gain.setValueAtTime(fBack, this.ctx!.currentTime);
          wet.gain.setValueAtTime(wetMix, this.ctx!.currentTime);
          dry.gain.setValueAtTime(1 - wetMix, this.ctx!.currentTime);
          
          // Connect delay loop
          delay.connect(feedback);
          feedback.connect(delay);
          
          const inputProxy = this.ctx!.createGain();
          const outputProxy = this.ctx!.createGain();
          
          inputProxy.connect(dry);
          dry.connect(outputProxy);
          
          inputProxy.connect(delay);
          delay.connect(wet);
          wet.connect(outputProxy);
          
          vstNode = inputProxy;
          (inputProxy as any)._connectTargetOverride = outputProxy;

        } else if (vst.id === 'phaser') {
          // Multi-stage BiquadAllpassFilter cascade with LFO
          const allpass1 = this.ctx!.createBiquadFilter();
          const allpass2 = this.ctx!.createBiquadFilter();
          const allpass3 = this.ctx!.createBiquadFilter();
          const allpass4 = this.ctx!.createBiquadFilter();
          
          allpass1.type = 'allpass';
          allpass2.type = 'allpass';
          allpass3.type = 'allpass';
          allpass4.type = 'allpass';
          
          const rate = vst.parameters.find(p => p.id === 'rate')?.value ?? 1.5;
          const depth = vst.parameters.find(p => p.id === 'depth')?.value ?? 70;
          const feedbackVal = (vst.parameters.find(p => p.id === 'feedback')?.value ?? 50) / 100;
          const baseFreq = vst.parameters.find(p => p.id === 'baseFreq')?.value ?? 800;
          
          allpass1.frequency.setValueAtTime(baseFreq, this.ctx!.currentTime);
          allpass2.frequency.setValueAtTime(baseFreq, this.ctx!.currentTime);
          allpass3.frequency.setValueAtTime(baseFreq, this.ctx!.currentTime);
          allpass4.frequency.setValueAtTime(baseFreq, this.ctx!.currentTime);
          
          // Connect cascade
          allpass1.connect(allpass2);
          allpass2.connect(allpass3);
          allpass3.connect(allpass4);
          
          // Feedback loop
          const fbGain = this.ctx!.createGain();
          fbGain.gain.setValueAtTime(feedbackVal, this.ctx!.currentTime);
          allpass4.connect(fbGain);
          fbGain.connect(allpass1);
          
          // LFO modulator
          const lfo = this.ctx!.createOscillator();
          lfo.frequency.setValueAtTime(rate, this.ctx!.currentTime);
          
          const lfoGain = this.ctx!.createGain();
          lfoGain.gain.setValueAtTime(depth * 5, this.ctx!.currentTime); // modulation range
          
          lfo.connect(lfoGain);
          lfoGain.connect(allpass1.frequency);
          lfoGain.connect(allpass2.frequency);
          lfoGain.connect(allpass3.frequency);
          lfoGain.connect(allpass4.frequency);
          
          lfo.start();
          
          const inputProxy = this.ctx!.createGain();
          const mixGain = this.ctx!.createGain();
          const dryGain = this.ctx!.createGain();
          const outputProxy = this.ctx!.createGain();
          
          inputProxy.connect(dryGain);
          dryGain.connect(outputProxy);
          
          inputProxy.connect(allpass1);
          allpass4.connect(mixGain);
          mixGain.connect(outputProxy);
          
          vstNode = inputProxy;
          (inputProxy as any)._internalOsc = lfo;
          (inputProxy as any)._connectTargetOverride = outputProxy;

        } else if (vst.id === 'tremolo') {
          // Pulsing volume & stereo panning modulation
          const rate = vst.parameters.find(p => p.id === 'rate')?.value ?? 3.0;
          const depth = (vst.parameters.find(p => p.id === 'depth')?.value ?? 80) / 100;
          
          const pannerNode = this.ctx!.createStereoPanner();
          const lfo = this.ctx!.createOscillator();
          lfo.frequency.setValueAtTime(rate, this.ctx!.currentTime);
          
          const lfoGain = this.ctx!.createGain();
          lfoGain.gain.setValueAtTime(depth, this.ctx!.currentTime);
          
          lfo.connect(lfoGain);
          lfoGain.connect(pannerNode.pan);
          lfo.start();
          
          const ampGain = this.ctx!.createGain();
          const ampLfo = this.ctx!.createOscillator();
          ampLfo.frequency.setValueAtTime(rate, this.ctx!.currentTime);
          const ampLfoGain = this.ctx!.createGain();
          ampLfoGain.gain.setValueAtTime(depth * 0.3, this.ctx!.currentTime);
          
          ampLfo.connect(ampLfoGain);
          ampLfoGain.connect(ampGain.gain);
          ampLfo.start();
          
          ampGain.connect(pannerNode);
          
          vstNode = ampGain;
          (ampGain as any)._internalOsc = lfo;
          (ampGain as any)._additionalOsc = ampLfo;
          (ampGain as any)._connectTargetOverride = pannerNode;

        } else if (vst.id === 'exciter') {
          // High frequency crossover harmonic saturation
          const freq = vst.parameters.find(p => p.id === 'freq')?.value ?? 6000;
          const mixVal = (vst.parameters.find(p => p.id === 'mix')?.value ?? 40) / 100;
          const drive = vst.parameters.find(p => p.id === 'drive')?.value ?? 3;
          
          const hpFilter = this.ctx!.createBiquadFilter();
          hpFilter.type = 'highpass';
          hpFilter.frequency.setValueAtTime(freq, this.ctx!.currentTime);
          
          const shaper = this.ctx!.createWaveShaper();
          const n_samples = 44100;
          const curve = new Float32Array(n_samples);
          for (let i = 0 ; i < n_samples; ++i ) {
            const x = (i * 2) / n_samples - 1;
            const absX = Math.abs(x);
            curve[i] = x * (absX + drive) / (x * x + (drive - 1) * absX + 1);
          }
          shaper.curve = curve;
          
          const wetGain = this.ctx!.createGain();
          const dryGain = this.ctx!.createGain();
          
          wetGain.gain.setValueAtTime(mixVal, this.ctx!.currentTime);
          dryGain.gain.setValueAtTime(1.0, this.ctx!.currentTime);
          
          const inputProxy = this.ctx!.createGain();
          const outputProxy = this.ctx!.createGain();
          
          inputProxy.connect(dryGain);
          dryGain.connect(outputProxy);
          
          inputProxy.connect(hpFilter);
          hpFilter.connect(shaper);
          shaper.connect(wetGain);
          wetGain.connect(outputProxy);
          
          vstNode = inputProxy;
          (inputProxy as any)._connectTargetOverride = outputProxy;

        } else if (vst.id === 'vocalfilter') {
          // Parallel band formant peaking filters mimicking vocal cords
          const vowelVal = vst.parameters.find(p => p.id === 'vowel')?.value ?? 50;
          const resonance = vst.parameters.find(p => p.id === 'resonance')?.value ?? 8;
          const lfoRate = vst.parameters.find(p => p.id === 'lfoRate')?.value ?? 0;
          
          const f1Filter = this.ctx!.createBiquadFilter();
          const f2Filter = this.ctx!.createBiquadFilter();
          
          f1Filter.type = 'peaking';
          f2Filter.type = 'peaking';
          
          f1Filter.gain.setValueAtTime(15, this.ctx!.currentTime);
          f2Filter.gain.setValueAtTime(15, this.ctx!.currentTime);
          
          f1Filter.Q.setValueAtTime(resonance, this.ctx!.currentTime);
          f2Filter.Q.setValueAtTime(resonance, this.ctx!.currentTime);
          
          const updateFormants = (v: number) => {
            let f1 = 600;
            let f2 = 1400;
            if (v <= 50) {
              const t = v / 50;
              f1 = 800 * (1 - t) + 400 * t;
              f2 = 1200 * (1 - t) + 2200 * t;
            } else {
              const t = (v - 50) / 50;
              f1 = 400 * (1 - t) + 300 * t;
              f2 = 2200 * (1 - t) + 800 * t;
            }
            try {
              f1Filter.frequency.setValueAtTime(f1, this.ctx!.currentTime);
              f2Filter.frequency.setValueAtTime(f2, this.ctx!.currentTime);
            } catch (e) {}
          };
          
          updateFormants(vowelVal);
          
          let lfo: OscillatorNode | null = null;
          if (lfoRate > 0) {
            lfo = this.ctx!.createOscillator();
            lfo.frequency.setValueAtTime(lfoRate, this.ctx!.currentTime);
            
            const f1Mod = this.ctx!.createGain();
            const f2Mod = this.ctx!.createGain();
            
            f1Mod.gain.setValueAtTime(200, this.ctx!.currentTime);
            f2Mod.gain.setValueAtTime(600, this.ctx!.currentTime);
            
            lfo.connect(f1Mod);
            lfo.connect(f2Mod);
            
            f1Mod.connect(f1Filter.frequency);
            f2Mod.connect(f2Filter.frequency);
            
            lfo.start();
          }
          
          const inputProxy = this.ctx!.createGain();
          const outputProxy = this.ctx!.createGain();
          
          inputProxy.connect(f1Filter);
          inputProxy.connect(f2Filter);
          
          f1Filter.connect(outputProxy);
          f2Filter.connect(outputProxy);
          
          vstNode = inputProxy;
          (inputProxy as any)._connectTargetOverride = outputProxy;
          if (lfo) {
            (inputProxy as any)._internalOsc = lfo;
          }

        } else if (vst.id === 'growlbox') {
          // Growlbox Vocal FX - Formant shifting throat growl, subharmonic distortion & dynamic vowel modulation
          const throat = vst.parameters.find(p => p.id === 'throat')?.value ?? 450;
          const sub = (vst.parameters.find(p => p.id === 'sub')?.value ?? 60) / 100;
          const drive = vst.parameters.find(p => p.id === 'drive')?.value ?? 8;
          const modRate = vst.parameters.find(p => p.id === 'modRate')?.value ?? 3.5;
          const resonance = vst.parameters.find(p => p.id === 'resonance')?.value ?? 7.5;
          const mixVal = (vst.parameters.find(p => p.id === 'mix')?.value ?? 80) / 100;

          // 1. Dual Throat Formant Filters (F1 and F2)
          const f1Filter = this.ctx!.createBiquadFilter();
          const f2Filter = this.ctx!.createBiquadFilter();
          f1Filter.type = 'peaking';
          f2Filter.type = 'peaking';
          f1Filter.frequency.setValueAtTime(throat, this.ctx!.currentTime);
          f2Filter.frequency.setValueAtTime(Math.min(throat * 2.35, 6000), this.ctx!.currentTime);
          f1Filter.Q.setValueAtTime(resonance, this.ctx!.currentTime);
          f2Filter.Q.setValueAtTime(resonance * 0.9, this.ctx!.currentTime);
          f1Filter.gain.setValueAtTime(18, this.ctx!.currentTime);
          f2Filter.gain.setValueAtTime(15, this.ctx!.currentTime);

          // 2. Subharmonic low-shelf throat body booster
          const subFilter = this.ctx!.createBiquadFilter();
          subFilter.type = 'lowshelf';
          subFilter.frequency.setValueAtTime(160, this.ctx!.currentTime);
          subFilter.gain.setValueAtTime(sub * 14, this.ctx!.currentTime);

          // 3. Dynamic Formant Sweep LFO
          let lfo: OscillatorNode | null = null;
          if (modRate > 0) {
            lfo = this.ctx!.createOscillator();
            lfo.frequency.setValueAtTime(modRate, this.ctx!.currentTime);
            lfo.type = 'sawtooth';

            const lfoGain1 = this.ctx!.createGain();
            const lfoGain2 = this.ctx!.createGain();
            lfoGain1.gain.setValueAtTime(throat * 0.55, this.ctx!.currentTime);
            lfoGain2.gain.setValueAtTime(throat * 0.95, this.ctx!.currentTime);

            lfo.connect(lfoGain1);
            lfo.connect(lfoGain2);
            lfoGain1.connect(f1Filter.frequency);
            lfoGain2.connect(f2Filter.frequency);
            lfo.start();
          }

          // 4. Asymmetric Growl Wavefolder / Saturation Distortion Shaper
          const shaper = this.ctx!.createWaveShaper();
          const n_samples = 44100;
          const curve = new Float32Array(n_samples);
          const deg = Math.PI / 180;
          const k = drive * 3.5;
          for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            // Asymmetric saturation + wave-folding throat compression
            const folded = Math.sin(x * (1 + (drive * 0.15)));
            const y = ((3 + k) * folded * 20 * deg) / (Math.PI + k * Math.abs(folded));
            curve[i] = Math.tanh(y * 0.7);
          }
          shaper.curve = curve;

          // 5. Signal routing and Wet/Dry crossfader
          const inputProxy = this.ctx!.createGain();
          const outputProxy = this.ctx!.createGain();
          const dryGain = this.ctx!.createGain();
          const wetGain = this.ctx!.createGain();
          const throatGain = this.ctx!.createGain();

          dryGain.gain.setValueAtTime(1.0 - (mixVal * 0.6), this.ctx!.currentTime);
          wetGain.gain.setValueAtTime(mixVal * 1.15, this.ctx!.currentTime);
          throatGain.gain.setValueAtTime(0.85, this.ctx!.currentTime);

          inputProxy.connect(dryGain);
          dryGain.connect(outputProxy);

          // Wet processing chain: input -> subFilter -> parallel F1/F2 -> throatGain -> shaper -> wetGain -> output
          inputProxy.connect(subFilter);
          subFilter.connect(f1Filter);
          subFilter.connect(f2Filter);
          f1Filter.connect(throatGain);
          f2Filter.connect(throatGain);
          throatGain.connect(shaper);
          shaper.connect(wetGain);
          wetGain.connect(outputProxy);

          vstNode = inputProxy;
          (inputProxy as any)._connectTargetOverride = outputProxy;
          if (lfo) {
            (inputProxy as any)._internalOsc = lfo;
          }

        } else if (vst.id === 'detuner') {
          // Lush split left-right delay chorused detune
          const detuneVal = vst.parameters.find(p => p.id === 'detune')?.value ?? 15;
          const delayVal = (vst.parameters.find(p => p.id === 'delay')?.value ?? 10) / 1000; // ms to s
          const widthVal = (vst.parameters.find(p => p.id === 'width')?.value ?? 100) / 100;
          
          const splitter = this.ctx!.createChannelSplitter(2);
          const merger = this.ctx!.createChannelMerger(2);
          
          const delayL = this.ctx!.createDelay(0.1);
          const delayR = this.ctx!.createDelay(0.1);
          
          delayL.delayTime.setValueAtTime(delayVal, this.ctx!.currentTime);
          delayR.delayTime.setValueAtTime(delayVal + 0.005, this.ctx!.currentTime);
          
          const lfoL = this.ctx!.createOscillator();
          const lfoR = this.ctx!.createOscillator();
          
          lfoL.frequency.setValueAtTime(0.2, this.ctx!.currentTime);
          lfoR.frequency.setValueAtTime(0.35, this.ctx!.currentTime);
          
          const modGainL = this.ctx!.createGain();
          const modGainR = this.ctx!.createGain();
          
          const modDepth = (Math.abs(detuneVal) / 50) * 0.002;
          modGainL.gain.setValueAtTime(modDepth, this.ctx!.currentTime);
          modGainR.gain.setValueAtTime(modDepth * 1.2, this.ctx!.currentTime);
          
          lfoL.connect(modGainL);
          modGainL.connect(delayL.delayTime);
          
          lfoR.connect(modGainR);
          modGainR.connect(delayR.delayTime);
          
          lfoL.start();
          lfoR.start();
          
          const inputProxy = this.ctx!.createGain();
          const outputProxy = this.ctx!.createGain();
          
          inputProxy.connect(splitter);
          
          splitter.connect(delayL, 0);
          delayL.connect(merger, 0, 0);
          
          splitter.connect(delayR, 1);
          delayR.connect(merger, 0, 1);
          
          const wetGain = this.ctx!.createGain();
          wetGain.gain.setValueAtTime(widthVal, this.ctx!.currentTime);
          
          const dryGain = this.ctx!.createGain();
          dryGain.gain.setValueAtTime(1 - (widthVal * 0.5), this.ctx!.currentTime);
          
          merger.connect(wetGain);
          
          inputProxy.connect(dryGain);
          dryGain.connect(outputProxy);
          wetGain.connect(outputProxy);
          
          vstNode = inputProxy;
          (inputProxy as any)._connectTargetOverride = outputProxy;
          (inputProxy as any)._internalOsc = lfoL;
          (inputProxy as any)._additionalOsc = lfoR;
        }

        if (vstNode) {
          activeVstNodes.push(vstNode);
        }
      } catch (err) {
        console.error(`Failed to construct VST ${vst.name}:`, err);
      }
    });

    this.vstNodes.set(trackId, activeVstNodes);

    // Chain gainNode -> VstNodes -> pannerNode
    let currentSource: AudioNode = gainNode;
    activeVstNodes.forEach(node => {
      try {
        currentSource.connect(node);
        if ((node as any)._connectTargetOverride) {
          currentSource = (node as any)._connectTargetOverride;
        } else {
          currentSource = node;
        }
      } catch (err) {
        console.error("Failed to connect VST node chain step:", err);
      }
    });
    
    const analyser = this.trackAnalysers.get(trackId);
    try {
      if (analyser) {
        currentSource.connect(analyser);
        analyser.connect(pannerNode);
      } else {
        currentSource.connect(pannerNode);
      }
    } catch (e) {
      console.error("Failed to connect last VST to panner node", e);
    }
  }

  // Real-time audio peak and RMS level extraction for a track
  getTrackAudioLevel(trackId: string): { peak: number; rms: number; db: number } {
    const analyser = this.trackAnalysers.get(trackId);
    if (!analyser || !this.ctx) {
      return { peak: 0, rms: 0, db: -60 };
    }

    try {
      const data = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(data);
      
      let sumSquares = 0;
      let peak = 0;
      for (let i = 0; i < data.length; i++) {
        const abs = Math.abs(data[i]);
        if (abs > peak) peak = abs;
        sumSquares += data[i] * data[i];
      }
      
      const rms = Math.sqrt(sumSquares / data.length);
      const db = peak > 0.0001 ? Math.max(-60, Math.min(6, 20 * Math.log10(peak))) : -60;
      return { peak, rms, db };
    } catch (e) {
      return { peak: 0, rms: 0, db: -60 };
    }
  }

  // Pre-load audio clip blobs into buffers
  async loadClipBuffer(clipId: string, url: string): Promise<AudioBuffer> {
    this.init();
    if (this.audioBuffers.has(clipId)) {
      return this.audioBuffers.get(clipId)!;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(clipId, audioBuffer);
      return audioBuffer;
    } catch (e) {
      console.error(`Failed to decode audio clip: ${clipId}`, e);
      throw e;
    }
  }

  setBpm(newBpm: number) {
    this.bpm = Math.max(20, Math.min(300, newBpm));
  }

  play() {
    this.init();
    if (this.ctx!.state === 'suspended') {
      this.ctx!.resume();
    }

    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.nextNoteTime = this.ctx!.currentTime + 0.05;
    
    // Start the scheduler
    this.schedulerTimerId = setInterval(() => this.scheduler(), this.lookahead);
    console.info("Playback started");
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.schedulerTimerId) {
      clearInterval(this.schedulerTimerId);
      this.schedulerTimerId = null;
    }
    this.stopAllActiveSources();
    console.info("Playback paused");
  }

  stop() {
    this.isPlaying = false;
    if (this.schedulerTimerId) {
      clearInterval(this.schedulerTimerId);
      this.schedulerTimerId = null;
    }
    this.currentStep = 0;
    if (this.onStepChange) {
      this.onStepChange(0);
    }
    this.stopAllActiveSources();
    console.info("Playback stopped and reset");
  }

  private stopAllActiveSources() {
    this.activeBufferSources.forEach((sources) => {
      sources.forEach(src => {
        try {
          src.stop();
        } catch (e) {}
      });
    });
    this.activeBufferSources.clear();
  }

  private scheduler() {
    if (!this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }
  }

  private advanceStep() {
    // 16th notes: 4 steps per beat. 
    // Seconds per beat = 60 / BPM. 
    // Seconds per step = (60 / BPM) / 4 = 15 / BPM.
    const secondsPerStep = 15.0 / this.bpm;
    this.nextNoteTime += secondsPerStep;
    
    this.currentStep = (this.currentStep + 1) % this.totalSteps;
    
    if (this.onStepChange) {
      // Trigger UI callback
      this.onStepChange(this.currentStep);
    }
  }

  private scheduleStep(step: number, time: number) {
    this.tracks.forEach(track => {
      const gainNode = this.trackGains.get(track.id);
      const pannerNode = this.trackPanners.get(track.id);
      if (!gainNode) return;

      // Calculate automation-aware volume and pan
      let targetVolume = track.volume;
      let targetPan = track.pan;

      if (track.automation) {
        if (track.automation.activeParam === 'volume' && track.automation.volume) {
          const autoVol = track.automation.volume[step];
          if (autoVol !== undefined) {
            targetVolume = autoVol;
          }
        }
        if (track.automation.activeParam === 'pan' && track.automation.pan) {
          const autoPan = track.automation.pan[step];
          if (autoPan !== undefined) {
            targetPan = autoPan;
          }
        }
      }

      // Apply Mute & Solo overrides
      const anySoloed = this.tracks.some(t => t.soloed);
      if (track.muted) {
        targetVolume = 0;
      } else if (anySoloed && !track.soloed) {
        targetVolume = 0;
      }

      // Schedule volume and panning parameter changes at exact step enter time
      gainNode.gain.setValueAtTime(targetVolume, time);
      if (pannerNode) {
        pannerNode.pan.setValueAtTime(targetPan, time);
      }

      // If the track is completely silent, we don't trigger synthesis nodes
      if (targetVolume === 0) return;

      if (track.type === 'drums' && track.drumState) {
        // Schedule drum notes with groove timing and velocity dynamics
        const drums = track.drumState;
        const grooveConfig = drums.groove || track.grooveConfig || { presetId: 'straight', swing: 50, humanize: 0, velocityDrift: 0 };
        const preset = getGroovePresetById(grooveConfig.presetId);
        const { timeOffset, velocity } = calculateStepGroove(
          step,
          this.bpm,
          preset,
          grooveConfig.swing,
          grooveConfig.humanize,
          grooveConfig.velocityDrift
        );

        const drumTime = Math.max(time, time + timeOffset);

        if (drums.kick?.[step]) {
          this.triggerKick(drumTime, gainNode, velocity, track.drumLayerConfig);
        }
        if (drums.snare?.[step]) {
          this.triggerSnare(drumTime, gainNode, velocity, track.drumLayerConfig);
        }
        if (drums.hihat?.[step]) {
          this.triggerHihat(drumTime, gainNode, velocity, track.drumLayerConfig);
        }
        if (drums.clap?.[step]) {
          this.triggerClap(drumTime, gainNode, velocity, track.drumLayerConfig);
        }
      }

      if ((track.type === 'synth' || track.type === 'bass') && track.midiNotes && track.synthConfig) {
        // Cutoff automation-aware frequency mapping
        let currentCutoff = track.synthConfig.cutoff;
        if (track.automation && track.automation.activeParam === 'cutoff' && track.automation.cutoff) {
          const autoFactor = track.automation.cutoff[step];
          if (autoFactor !== undefined) {
            // Exponential mapping from 100 Hz to 15000 Hz
            currentCutoff = 100 * Math.pow(15000 / 100, autoFactor);
          }
        }

        const synthConfigWithCutoff = {
          ...track.synthConfig,
          cutoff: currentCutoff
        };

        // If track has groove enabled, apply micro-timing
        let noteTimeOffset = 0;
        let noteVelocity = 1.0;
        if (track.grooveConfig && track.grooveConfig.presetId !== 'straight') {
          const preset = getGroovePresetById(track.grooveConfig.presetId);
          const groove = calculateStepGroove(step, this.bpm, preset, track.grooveConfig.swing, track.grooveConfig.humanize, track.grooveConfig.velocityDrift);
          noteTimeOffset = groove.timeOffset;
          noteVelocity = groove.velocity;
        }

        const noteTriggerTime = Math.max(time, time + noteTimeOffset);

        // Find notes scheduled on this exact step
        const notes = track.midiNotes.filter(n => n.step === step);
        notes.forEach(note => {
          const secondsPerStep = 15.0 / this.bpm;
          const duration = note.duration * secondsPerStep;
          this.triggerSynthNote(note.pitch, noteTriggerTime, duration, synthConfigWithCutoff, gainNode, this.delayNodes.get(track.id), noteVelocity);

          // Track-to-Track Companion Layering
          if (track.layerTargetTrackId) {
            const companionTrack = this.tracks.find(t => t.id === track.layerTargetTrackId);
            if (companionTrack && companionTrack.synthConfig && !companionTrack.muted) {
              const companionGain = this.trackGains.get(companionTrack.id);
              if (companionGain) {
                this.triggerSynthNote(
                  note.pitch,
                  noteTriggerTime,
                  duration,
                  companionTrack.synthConfig,
                  companionGain,
                  this.delayNodes.get(companionTrack.id),
                  noteVelocity * 0.85
                );
              }
            }
          }
        });
      }

      if (track.type === 'audio' && track.clips) {
        // Schedule any audio clip starting at this step
        const clips = track.clips.filter(c => c.startStep === step);
        clips.forEach(clip => {
          this.triggerAudioClip(clip, time, gainNode);
        });
      }
    });
  }

  // --- Drum Synthesizers ---

  // Synthesize noise buffer for transients and noise layering
  private createNoiseBuffer(ctx: BaseAudioContext, type: 'white' | 'pink' = 'white', duration = 0.5): AudioBuffer {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  }

  // Synthesize a classic Kick drum (with optional sub-bass layering)
  triggerKick(time: number, outputNode: AudioNode, velocity: number = 1.0, layerConfig?: Track['drumLayerConfig']) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(outputNode);
    
    // Pitch sweep (Kick has high initial freq sweeping rapidly down to sub frequencies)
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    // Volume envelope scaled by velocity dynamics
    const peakGain = Math.max(0.1, Math.min(1.8, 1.2 * velocity));
    gain.gain.setValueAtTime(peakGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    
    osc.start(time);
    osc.stop(time + 0.31);

    // Drum Layering: Deep 45Hz Sub-Bass Boom Layer
    if (layerConfig?.kickSubLayer) {
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(50, time);
      subOsc.frequency.exponentialRampToValueAtTime(25, time + 0.38);
      
      const subVol = Math.max(0.05, Math.min(1.2, 0.85 * velocity));
      subGain.gain.setValueAtTime(subVol, time);
      subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

      subOsc.connect(subGain);
      subGain.connect(outputNode);
      subOsc.start(time);
      subOsc.stop(time + 0.39);
    }
  }

  // Synthesize Snare drum using highpassed white noise mixed with a brief tone triangle (with optional crack transient layer)
  triggerSnare(time: number, outputNode: AudioNode, velocity: number = 1.0, layerConfig?: Track['drumLayerConfig']) {
    if (!this.ctx) return;
    
    // Create white noise buffer
    const bufferSize = this.ctx.sampleRate * 0.25; // 0.25 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = this.ctx.createGain();
    const peakNoise = Math.max(0.1, Math.min(1.2, 0.7 * velocity));
    noiseGain.gain.setValueAtTime(peakNoise, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(outputNode);
    
    // Snare fundamental tone (triangle wave)
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    
    const oscGain = this.ctx.createGain();
    const peakTone = Math.max(0.05, Math.min(0.9, 0.5 * velocity));
    oscGain.gain.setValueAtTime(peakTone, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
    
    osc.connect(oscGain);
    oscGain.connect(outputNode);
    
    noise.start(time);
    noise.stop(time + 0.21);
    
    osc.start(time);
    osc.stop(time + 0.13);

    // Drum Layering: Crisp White Noise Crack / Rimshot Snap Transient Layer
    if (layerConfig?.snareCrackLayer) {
      const crackSrc = this.ctx.createBufferSource();
      crackSrc.buffer = buffer;
      const crackFilter = this.ctx.createBiquadFilter();
      crackFilter.type = 'highpass';
      crackFilter.frequency.setValueAtTime(4500, time);

      const crackGain = this.ctx.createGain();
      const peakCrack = Math.max(0.05, Math.min(0.9, 0.6 * velocity));
      crackGain.gain.setValueAtTime(peakCrack, time);
      crackGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

      crackSrc.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(outputNode);

      crackSrc.start(time);
      crackSrc.stop(time + 0.07);
    }
  }

  // Synthesize closed Hi-Hat using heavily bandpassed white noise with a fast release (with optional stereo spread layer)
  triggerHihat(time: number, outputNode: AudioNode, velocity: number = 1.0, layerConfig?: Track['drumLayerConfig']) {
    if (!this.ctx) return;
    
    const bufferSize = this.ctx.sampleRate * 0.05; // very short
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 8000;
    filter.Q.value = 4;
    
    const gain = this.ctx.createGain();
    const peakHat = Math.max(0.05, Math.min(0.8, 0.4 * velocity));
    gain.gain.setValueAtTime(peakHat, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + 0.04);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(outputNode);
    
    noise.start(time);
    noise.stop(time + 0.051);

    // Drum Layering: Stereo Micro-Delayed Hihat Sizzle
    if (layerConfig?.hihatSpread) {
      const spreadNoise = this.ctx.createBufferSource();
      spreadNoise.buffer = buffer;
      const spreadFilter = this.ctx.createBiquadFilter();
      spreadFilter.type = 'highpass';
      spreadFilter.frequency.value = 10000;
      const spreadGain = this.ctx.createGain();
      spreadGain.gain.setValueAtTime(peakHat * 0.65, time + 0.004);
      spreadGain.gain.exponentialRampToValueAtTime(0.005, time + 0.045);

      spreadNoise.connect(spreadFilter);
      spreadFilter.connect(spreadGain);
      spreadGain.connect(outputNode);

      spreadNoise.start(time + 0.004);
      spreadNoise.stop(time + 0.055);
    }
  }

  // Synthesize Clap (with optional multi-clap burst layer)
  triggerClap(time: number, outputNode: AudioNode, velocity: number = 1.0, layerConfig?: Track['drumLayerConfig']) {
    if (!this.ctx) return;
    
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 2;
    filter.connect(outputNode);

    // Standard handclap pulses + optional extra clap stack layers
    const pulses = layerConfig?.clapStack
      ? [0, 0.008, 0.018, 0.028, 0.042, 0.058]
      : [0, 0.015, 0.03, 0.045];

    pulses.forEach((offset, idx) => {
      const src = this.ctx!.createBufferSource();
      src.buffer = buffer;
      
      const pGain = this.ctx!.createGain();
      const isLast = idx === pulses.length - 1;
      const duration = isLast ? 0.28 : 0.012;
      const initialVol = (isLast ? 0.65 : 0.4) * velocity;
      
      pGain.gain.setValueAtTime(initialVol, time + offset);
      pGain.gain.exponentialRampToValueAtTime(0.001, time + offset + duration);
      
      src.connect(filter);
      filter.connect(pGain);
      pGain.connect(outputNode);
      
      src.start(time + offset);
      src.stop(time + offset + duration + 0.01);
    });
  }

  // --- Multi-Layer Subtractive Synthesizer Voice ---

  triggerSynthNote(
    pitch: string, 
    time: number, 
    duration: number, 
    config: SynthConfig, 
    outputNode: AudioNode,
    sendToDelayNode?: DelayNode,
    velocity: number = 1.0
  ) {
    if (!this.ctx) return;
    const freq = PITCH_TO_FREQ[pitch];
    if (!freq) return;

    const filter = this.ctx.createBiquadFilter();
    const envGain = this.ctx.createGain();

    // Resonant Filter Settings
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(config.cutoff, time);
    filter.Q.setValueAtTime(config.resonance, time);

    filter.connect(envGain);
    envGain.connect(outputNode);
    
    if (sendToDelayNode) {
      envGain.connect(sendToDelayNode);
    }

    // Envelope calculation (ADSR)
    const attack = Math.max(0.005, config.attack);
    const decay = Math.max(0.01, config.decay);
    const sustain = Math.max(0, Math.min(1, config.sustain));
    const release = Math.max(0.01, config.release);

    const maxVolume = Math.max(0.05, Math.min(0.85, 0.5 * velocity));
    
    envGain.gain.setValueAtTime(0, time);
    envGain.gain.linearRampToValueAtTime(maxVolume, time + attack);
    envGain.gain.exponentialRampToValueAtTime(maxVolume * sustain + 0.001, time + attack + decay);
    
    const releaseStartTime = time + duration;
    envGain.gain.setValueAtTime(maxVolume * sustain + 0.001, releaseStartTime);
    envGain.gain.exponentialRampToValueAtTime(0.0001, releaseStartTime + release);

    const stopTime = releaseStartTime + release + 0.1;

    // --- Layer 1: Core Oscillator (with Multi-Voice Unison Stacking) ---
    const unisonCount = config.unisonVoices && config.unisonVoices > 1 ? Math.min(7, config.unisonVoices) : 1;
    const unisonCents = config.unisonDetune ?? 14;
    const unisonSpread = config.unisonSpread ?? 0.6;

    if (unisonCount === 1) {
      const osc1 = this.ctx.createOscillator();
      osc1.type = config.oscillator;
      osc1.frequency.setValueAtTime(freq, time);
      osc1.connect(filter);
      osc1.start(time);
      osc1.stop(stopTime);
    } else {
      // Create multi-voice detuned unison stack
      const perVoiceGain = 1.0 / Math.sqrt(unisonCount);
      for (let i = 0; i < unisonCount; i++) {
        const oscVoice = this.ctx.createOscillator();
        oscVoice.type = config.oscillator;
        
        // Spread detune symmetrically around center
        const offsetRatio = unisonCount === 1 ? 0 : (i / (unisonCount - 1) - 0.5) * 2; // -1 to +1
        const cents = offsetRatio * unisonCents;
        const detunedFreq = freq * Math.pow(2, cents / 1200);
        oscVoice.frequency.setValueAtTime(detunedFreq, time);

        const vGain = this.ctx.createGain();
        vGain.gain.setValueAtTime(perVoiceGain, time);

        if (this.ctx.createStereoPanner && unisonSpread > 0) {
          const panner = this.ctx.createStereoPanner();
          panner.pan.setValueAtTime(offsetRatio * unisonSpread, time);
          oscVoice.connect(vGain);
          vGain.connect(panner);
          panner.connect(filter);
        } else {
          oscVoice.connect(vGain);
          vGain.connect(filter);
        }

        oscVoice.start(time);
        oscVoice.stop(stopTime);
      }
    }

    // --- Layer 2: Companion Oscillator Layer ---
    if (config.layer2Enabled) {
      const osc2 = this.ctx.createOscillator();
      osc2.type = config.layer2Oscillator || 'sawtooth';

      const oct2 = config.layer2Octave ?? 0;
      const detune2 = config.layer2Detune ?? 7; // cents
      const freq2 = freq * Math.pow(2, oct2 + detune2 / 1200);
      osc2.frequency.setValueAtTime(freq2, time);

      const layer2Gain = this.ctx.createGain();
      const l2Mix = Math.max(0, Math.min(1.0, config.layer2Level ?? 0.75));
      layer2Gain.gain.setValueAtTime(l2Mix, time);

      if (this.ctx.createStereoPanner && (config.layer2Pan !== undefined && config.layer2Pan !== 0)) {
        const panner2 = this.ctx.createStereoPanner();
        panner2.pan.setValueAtTime(Math.max(-1, Math.min(1, config.layer2Pan)), time);
        osc2.connect(layer2Gain);
        layer2Gain.connect(panner2);
        panner2.connect(filter);
      } else {
        osc2.connect(layer2Gain);
        layer2Gain.connect(filter);
      }

      osc2.start(time);
      osc2.stop(stopTime);
    }

    // --- Sub-Bass Layer Underlay ---
    if (config.subEnabled) {
      const subOsc = this.ctx.createOscillator();
      subOsc.type = config.subOscillator || 'sine';

      const subOct = config.subOctave ?? -1;
      const subFreq = freq * Math.pow(2, subOct);
      subOsc.frequency.setValueAtTime(subFreq, time);

      const subGain = this.ctx.createGain();
      const subMix = Math.max(0, Math.min(1.0, config.subLevel ?? 0.65));
      subGain.gain.setValueAtTime(subMix, time);

      // Connect directly to envGain to preserve pure, un-muffled sub bass punch
      subOsc.connect(subGain);
      subGain.connect(envGain);

      subOsc.start(time);
      subOsc.stop(stopTime);
    }

    // --- Noise / Transient Grit Layer ---
    if (config.noiseLayerEnabled) {
      try {
        const noiseBuf = this.createNoiseBuffer(this.ctx, config.noiseType || 'white', 0.6);
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = noiseBuf;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(2000, time);

        const noiseGain = this.ctx.createGain();
        const noiseMix = Math.max(0, Math.min(1.0, (config.noiseLevel ?? 0.25) * 0.5));
        noiseGain.gain.setValueAtTime(noiseMix, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + attack + 0.15);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(filter);

        noiseSrc.start(time);
        noiseSrc.stop(time + attack + 0.2);
      } catch (err) {
        console.warn("Noise layer skipped:", err);
      }
    }
  }

  // --- Play individual notes live (e.g., from virtual Keyboard) ---
  playNoteLive(pitch: string, config: SynthConfig, trackId: string) {
    this.init();
    if (this.ctx!.state === 'suspended') {
      this.ctx!.resume();
    }
    
    const gainNode = this.trackGains.get(trackId) || this.masterGain!;
    const delayNode = this.delayNodes.get(trackId);
    
    // Play with a sustain hold of 0.4s for instant auditioning
    this.triggerSynthNote(pitch, this.ctx!.currentTime, 0.4, config, gainNode, delayNode);

    // Track-to-Track Companion Layering
    const currentTrack = this.tracks.find(t => t.id === trackId);
    if (currentTrack && currentTrack.layerTargetTrackId) {
      const companionTrack = this.tracks.find(t => t.id === currentTrack.layerTargetTrackId);
      if (companionTrack && companionTrack.synthConfig && !companionTrack.muted) {
        const compGain = this.trackGains.get(companionTrack.id) || this.masterGain!;
        const compDelay = this.delayNodes.get(companionTrack.id);
        this.triggerSynthNote(pitch, this.ctx!.currentTime, 0.4, companionTrack.synthConfig, compGain, compDelay, 0.85);
      }
    }
  }

  // Audition multi-note chords live with subtle optional strumming
  playChordLive(pitches: string[], config: SynthConfig, trackId: string, duration = 0.6, strumMs = 15) {
    this.init();
    if (this.ctx!.state === 'suspended') {
      this.ctx!.resume();
    }
    const gainNode = this.trackGains.get(trackId) || this.masterGain!;
    const delayNode = this.delayNodes.get(trackId);
    
    pitches.forEach((pitch, idx) => {
      const startTime = this.ctx!.currentTime + (idx * (strumMs / 1000));
      this.triggerSynthNote(pitch, startTime, duration, config, gainNode, delayNode);
    });
  }

  // Play a specific sound preview live (e.g. auditioning drums with layers)
  playDrumLive(drum: 'kick' | 'snare' | 'hihat' | 'clap', trackId: string) {
    this.init();
    if (this.ctx!.state === 'suspended') {
      this.ctx!.resume();
    }
    const track = this.tracks.find(t => t.id === trackId);
    const gainNode = this.trackGains.get(trackId) || this.masterGain!;
    const layerCfg = track?.drumLayerConfig;
    if (drum === 'kick') this.triggerKick(this.ctx!.currentTime, gainNode, 1.0, layerCfg);
    if (drum === 'snare') this.triggerSnare(this.ctx!.currentTime, gainNode, 1.0, layerCfg);
    if (drum === 'hihat') this.triggerHihat(this.ctx!.currentTime, gainNode, 1.0, layerCfg);
    if (drum === 'clap') this.triggerClap(this.ctx!.currentTime, gainNode, 1.0, layerCfg);
  }

  // --- Audio Clip trigger ---
  triggerAudioClip(clip: AudioClip, time: number, outputNode: AudioNode) {
    if (!this.ctx) return;
    const buffer = this.audioBuffers.get(clip.id);
    if (!buffer) {
      console.warn(`Buffer not loaded for clip: ${clip.id}`);
      return;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(outputNode);
    
    src.start(time);
    
    // Keep track so we can stop it if playback stops
    if (!this.activeBufferSources.has(clip.id)) {
      this.activeBufferSources.set(clip.id, []);
    }
    this.activeBufferSources.get(clip.id)!.push(src);
    
    src.onended = () => {
      const arr = this.activeBufferSources.get(clip.id);
      if (arr) {
        this.activeBufferSources.set(clip.id, arr.filter(s => s !== src));
      }
    };
  }

  // Render the current project's notes and drums into a single 16-bit WAV file blob offline
  async renderToWav(): Promise<Blob> {
    const sampleRate = 44100;
    const secondsPerStep = 15.0 / this.bpm;
    const totalDuration = this.totalSteps * secondsPerStep;
    const tailSeconds = 3.0; // Allow delay tail to ring out nicely
    const totalLengthInSamples = Math.floor(sampleRate * (totalDuration + tailSeconds));

    // Create offline context
    const OfflineCtxClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const offlineCtx = new OfflineCtxClass(2, totalLengthInSamples, sampleRate);

    // Re-create the master output chain in the offline context
    const offlineMasterGain = offlineCtx.createGain();
    offlineMasterGain.gain.setValueAtTime(0.8, 0);

    const offlineBassFilter = offlineCtx.createBiquadFilter();
    offlineBassFilter.type = 'lowshelf';
    offlineBassFilter.frequency.setValueAtTime(150, 0);
    offlineBassFilter.gain.setValueAtTime(this.eqBass, 0);

    const offlineMidFilter = offlineCtx.createBiquadFilter();
    offlineMidFilter.type = 'peaking';
    offlineMidFilter.Q.setValueAtTime(1.0, 0);
    offlineMidFilter.frequency.setValueAtTime(1000, 0);
    offlineMidFilter.gain.setValueAtTime(this.eqMid, 0);

    const offlineTrebleFilter = offlineCtx.createBiquadFilter();
    offlineTrebleFilter.type = 'highshelf';
    offlineTrebleFilter.frequency.setValueAtTime(4000, 0);
    offlineTrebleFilter.gain.setValueAtTime(this.eqTreble, 0);

    // Create offline master compressor
    const offlineCompressor = offlineCtx.createDynamicsCompressor();
    if (this.compEnabled) {
      offlineCompressor.threshold.setValueAtTime(this.compThreshold, 0);
      offlineCompressor.ratio.setValueAtTime(this.compRatio, 0);
      offlineCompressor.attack.setValueAtTime(this.compAttack, 0);
      offlineCompressor.release.setValueAtTime(this.compRelease, 0);
    } else {
      offlineCompressor.threshold.setValueAtTime(0, 0);
      offlineCompressor.ratio.setValueAtTime(1.0, 0);
      offlineCompressor.attack.setValueAtTime(0.003, 0);
      offlineCompressor.release.setValueAtTime(0.25, 0);
    }

    // Create offline master limiter and limiter gain
    const offlineLimiter = offlineCtx.createDynamicsCompressor();
    const offlineLimiterGain = offlineCtx.createGain();

    if (this.limiterEnabled) {
      offlineLimiter.threshold.setValueAtTime(this.limiterThreshold, 0);
      offlineLimiter.ratio.setValueAtTime(20.0, 0);
      offlineLimiter.attack.setValueAtTime(0.003, 0);
      offlineLimiter.release.setValueAtTime(0.10, 0);
      offlineLimiter.knee.setValueAtTime(0.0, 0);
      
      const ceilingGainVal = Math.pow(10, this.limiterCeiling / 20);
      offlineLimiterGain.gain.setValueAtTime(ceilingGainVal, 0);
    } else {
      offlineLimiter.threshold.setValueAtTime(0, 0);
      offlineLimiter.ratio.setValueAtTime(1.0, 0);
      offlineLimiter.attack.setValueAtTime(0.003, 0);
      offlineLimiter.release.setValueAtTime(0.10, 0);
      offlineLimiter.knee.setValueAtTime(0.0, 0);
      
      offlineLimiterGain.gain.setValueAtTime(1.0, 0);
    }

    // Create offline master output gain (trim before limiter)
    const offlineOutputGain = offlineCtx.createGain();
    const offlineOutputGainVal = Math.pow(10, this.masterOutputGain / 20);
    offlineOutputGain.gain.setValueAtTime(offlineOutputGainVal, 0);

    // Route master chain
    offlineMasterGain.connect(offlineBassFilter);
    offlineBassFilter.connect(offlineMidFilter);
    offlineMidFilter.connect(offlineTrebleFilter);
    offlineTrebleFilter.connect(offlineCompressor);
    offlineCompressor.connect(offlineOutputGain);
    offlineOutputGain.connect(offlineLimiter);
    offlineLimiter.connect(offlineLimiterGain);
    offlineLimiterGain.connect(offlineCtx.destination);

    // Re-create individual track routings
    const trackGains = new Map<string, GainNode>();
    const delayNodes = new Map<string, DelayNode>();

    this.tracks.forEach(track => {
      const gainNode = offlineCtx.createGain();
      const pannerNode = offlineCtx.createStereoPanner();
      const delayNode = offlineCtx.createDelay(2.0);
      const feedbackNode = offlineCtx.createGain();

      // Solo / Mute logic
      const anySoloed = this.tracks.some(t => t.soloed);
      let targetGain = track.volume;
      if (track.muted) {
        targetGain = 0;
      } else if (anySoloed && !track.soloed) {
        targetGain = 0;
      }

      gainNode.gain.setValueAtTime(targetGain, 0);
      pannerNode.pan.setValueAtTime(track.pan, 0);

      if (track.synthConfig) {
        delayNode.delayTime.setValueAtTime(track.synthConfig.delayTime, 0);
        feedbackNode.gain.setValueAtTime(track.synthConfig.delayFeedback, 0);
      } else {
        delayNode.delayTime.setValueAtTime(0.25, 0);
        feedbackNode.gain.setValueAtTime(0.3, 0);
      }

      // Delay feedback connections
      delayNode.connect(feedbackNode);
      feedbackNode.connect(delayNode);

      // Routing
      pannerNode.connect(offlineMasterGain);
      gainNode.connect(pannerNode);
      delayNode.connect(pannerNode);

      trackGains.set(track.id, gainNode);
      delayNodes.set(track.id, delayNode);
    });

    // Schedule all steps
    for (let step = 0; step < this.totalSteps; step++) {
      const stepTime = step * secondsPerStep;

      this.tracks.forEach(track => {
        const gainNode = trackGains.get(track.id);
        if (!gainNode) return;

        // Drums
        if (track.type === 'drums' && track.drumState) {
          const drums = track.drumState;
          const grooveConfig = drums.groove || track.grooveConfig || { presetId: 'straight', swing: 50, humanize: 0, velocityDrift: 0 };
          const preset = getGroovePresetById(grooveConfig.presetId);
          const { timeOffset, velocity } = calculateStepGroove(
            step,
            this.bpm,
            preset,
            grooveConfig.swing,
            grooveConfig.humanize,
            grooveConfig.velocityDrift
          );
          const drumTime = Math.max(0, stepTime + timeOffset);

          if (drums.kick?.[step]) {
            this.triggerKickOffline(offlineCtx, drumTime, gainNode, velocity, track.drumLayerConfig);
          }
          if (drums.snare?.[step]) {
            this.triggerSnareOffline(offlineCtx, drumTime, gainNode, velocity, track.drumLayerConfig);
          }
          if (drums.hihat?.[step]) {
            this.triggerHihatOffline(offlineCtx, drumTime, gainNode, velocity, track.drumLayerConfig);
          }
          if (drums.clap?.[step]) {
            this.triggerClapOffline(offlineCtx, drumTime, gainNode, velocity, track.drumLayerConfig);
          }
        }

        // Synth / Bass MIDI notes
        if ((track.type === 'synth' || track.type === 'bass') && track.midiNotes && track.synthConfig) {
          const notes = track.midiNotes.filter(n => n.step === step);
          notes.forEach(note => {
            const duration = note.duration * secondsPerStep;
            this.triggerSynthNoteOffline(
              offlineCtx,
              note.pitch,
              stepTime,
              duration,
              track.synthConfig!,
              gainNode,
              delayNodes.get(track.id)
            );

            // Track-to-Track companion layering offline
            if (track.layerTargetTrackId) {
              const companionTrack = this.tracks.find(t => t.id === track.layerTargetTrackId);
              if (companionTrack && companionTrack.synthConfig && !companionTrack.muted) {
                const compGain = trackGains.get(companionTrack.id);
                if (compGain) {
                  this.triggerSynthNoteOffline(
                    offlineCtx,
                    note.pitch,
                    stepTime,
                    duration,
                    companionTrack.synthConfig,
                    compGain,
                    delayNodes.get(companionTrack.id)
                  );
                }
              }
            }
          });
        }

        // Audio clips
        if (track.type === 'audio' && track.clips) {
          const clips = track.clips.filter(c => c.startStep === step);
          clips.forEach(clip => {
            this.triggerAudioClipOffline(offlineCtx, clip, stepTime, gainNode);
          });
        }
      });
    }

    // Start offline render
    const renderedBuffer = await offlineCtx.startRendering();
    
    // Encode to WAV blob
    return this.bufferToWav(renderedBuffer);
  }

  // --- Offline Helpers ---
  private triggerKickOffline(ctx: BaseAudioContext, time: number, outputNode: AudioNode, velocity: number = 1.0, layerConfig?: Track['drumLayerConfig']) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(outputNode);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    const peakGain = Math.max(0.1, Math.min(1.8, 1.2 * velocity));
    gain.gain.setValueAtTime(peakGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    
    osc.start(time);
    osc.stop(time + 0.31);

    if (layerConfig?.kickSubLayer) {
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(50, time);
      subOsc.frequency.exponentialRampToValueAtTime(25, time + 0.38);
      subGain.gain.setValueAtTime(0.85 * velocity, time);
      subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);
      subOsc.connect(subGain);
      subGain.connect(outputNode);
      subOsc.start(time);
      subOsc.stop(time + 0.39);
    }
  }

  private triggerSnareOffline(ctx: BaseAudioContext, time: number, outputNode: AudioNode, velocity: number = 1.0, layerConfig?: Track['drumLayerConfig']) {
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = ctx.createGain();
    const peakNoise = Math.max(0.1, Math.min(1.2, 0.7 * velocity));
    noiseGain.gain.setValueAtTime(peakNoise, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(outputNode);
    
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    
    const oscGain = ctx.createGain();
    const peakTone = Math.max(0.05, Math.min(0.9, 0.5 * velocity));
    oscGain.gain.setValueAtTime(peakTone, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
    
    osc.connect(oscGain);
    oscGain.connect(outputNode);
    
    noise.start(time);
    noise.stop(time + 0.21);
    
    osc.start(time);
    osc.stop(time + 0.13);

    if (layerConfig?.snareCrackLayer) {
      const crackSrc = ctx.createBufferSource();
      crackSrc.buffer = buffer;
      const crackFilter = ctx.createBiquadFilter();
      crackFilter.type = 'highpass';
      crackFilter.frequency.setValueAtTime(4500, time);
      const crackGain = ctx.createGain();
      crackGain.gain.setValueAtTime(0.6 * velocity, time);
      crackGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      crackSrc.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(outputNode);
      crackSrc.start(time);
      crackSrc.stop(time + 0.07);
    }
  }

  private triggerHihatOffline(ctx: BaseAudioContext, time: number, outputNode: AudioNode, velocity: number = 1.0, layerConfig?: Track['drumLayerConfig']) {
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 8000;
    filter.Q.value = 4;
    
    const gain = ctx.createGain();
    const peakHat = Math.max(0.05, Math.min(0.8, 0.4 * velocity));
    gain.gain.setValueAtTime(peakHat, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + 0.04);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(outputNode);
    
    noise.start(time);
    noise.stop(time + 0.051);

    if (layerConfig?.hihatSpread) {
      const spreadNoise = ctx.createBufferSource();
      spreadNoise.buffer = buffer;
      const spreadFilter = ctx.createBiquadFilter();
      spreadFilter.type = 'highpass';
      spreadFilter.frequency.value = 10000;
      const spreadGain = ctx.createGain();
      spreadGain.gain.setValueAtTime(peakHat * 0.65, time + 0.004);
      spreadGain.gain.exponentialRampToValueAtTime(0.005, time + 0.045);
      spreadNoise.connect(spreadFilter);
      spreadFilter.connect(spreadGain);
      spreadGain.connect(outputNode);
      spreadNoise.start(time + 0.004);
      spreadNoise.stop(time + 0.055);
    }
  }

  private triggerClapOffline(ctx: BaseAudioContext, time: number, outputNode: AudioNode, velocity: number = 1.0, layerConfig?: Track['drumLayerConfig']) {
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 2;
    filter.connect(outputNode);

    const pulses = layerConfig?.clapStack
      ? [0, 0.008, 0.018, 0.028, 0.042, 0.058]
      : [0, 0.015, 0.03, 0.045];

    pulses.forEach((offset, idx) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      
      const pGain = ctx.createGain();
      const isLast = idx === pulses.length - 1;
      const duration = isLast ? 0.28 : 0.012;
      const initialVol = (isLast ? 0.65 : 0.4) * velocity;
      
      pGain.gain.setValueAtTime(initialVol, time + offset);
      pGain.gain.exponentialRampToValueAtTime(0.001, time + offset + duration);
      
      src.connect(filter);
      filter.connect(pGain);
      pGain.connect(outputNode);
      
      src.start(time + offset);
      src.stop(time + offset + duration + 0.01);
    });
  }

  private triggerSynthNoteOffline(
    ctx: BaseAudioContext,
    pitch: string,
    time: number,
    duration: number,
    config: SynthConfig,
    outputNode: AudioNode,
    sendToDelayNode?: DelayNode
  ) {
    const freq = PITCH_TO_FREQ[pitch];
    if (!freq) return;

    const filter = ctx.createBiquadFilter();
    const envGain = ctx.createGain();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(config.cutoff, time);
    filter.Q.setValueAtTime(config.resonance, time);

    filter.connect(envGain);
    envGain.connect(outputNode);
    
    if (sendToDelayNode) {
      envGain.connect(sendToDelayNode);
    }

    const attack = Math.max(0.005, config.attack);
    const decay = Math.max(0.01, config.decay);
    const sustain = Math.max(0, Math.min(1, config.sustain));
    const release = Math.max(0.01, config.release);

    const maxVolume = 0.5;
    
    envGain.gain.setValueAtTime(0, time);
    envGain.gain.linearRampToValueAtTime(maxVolume, time + attack);
    envGain.gain.exponentialRampToValueAtTime(maxVolume * sustain + 0.001, time + attack + decay);
    
    const releaseStartTime = time + duration;
    envGain.gain.setValueAtTime(maxVolume * sustain + 0.001, releaseStartTime);
    envGain.gain.exponentialRampToValueAtTime(0.0001, releaseStartTime + release);

    const stopTime = releaseStartTime + release + 0.1;

    // Layer 1 Unison stack
    const unisonCount = config.unisonVoices && config.unisonVoices > 1 ? Math.min(7, config.unisonVoices) : 1;
    const unisonCents = config.unisonDetune ?? 14;
    const perVoiceGain = 1.0 / Math.sqrt(unisonCount);

    for (let i = 0; i < unisonCount; i++) {
      const oscVoice = ctx.createOscillator();
      oscVoice.type = config.oscillator;
      const offsetRatio = unisonCount === 1 ? 0 : (i / (unisonCount - 1) - 0.5) * 2;
      const detunedFreq = freq * Math.pow(2, (offsetRatio * unisonCents) / 1200);
      oscVoice.frequency.setValueAtTime(detunedFreq, time);

      const vGain = ctx.createGain();
      vGain.gain.setValueAtTime(perVoiceGain, time);

      if (ctx.createStereoPanner && (config.unisonSpread ?? 0.6) > 0) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(offsetRatio * (config.unisonSpread ?? 0.6), time);
        oscVoice.connect(vGain);
        vGain.connect(panner);
        panner.connect(filter);
      } else {
        oscVoice.connect(vGain);
        vGain.connect(filter);
      }

      oscVoice.start(time);
      oscVoice.stop(stopTime);
    }

    // Layer 2
    if (config.layer2Enabled) {
      const osc2 = ctx.createOscillator();
      osc2.type = config.layer2Oscillator || 'sawtooth';
      const oct2 = config.layer2Octave ?? 0;
      const detune2 = config.layer2Detune ?? 7;
      osc2.frequency.setValueAtTime(freq * Math.pow(2, oct2 + detune2 / 1200), time);

      const l2Gain = ctx.createGain();
      l2Gain.gain.setValueAtTime(config.layer2Level ?? 0.75, time);

      if (ctx.createStereoPanner && config.layer2Pan) {
        const p2 = ctx.createStereoPanner();
        p2.pan.setValueAtTime(config.layer2Pan, time);
        osc2.connect(l2Gain);
        l2Gain.connect(p2);
        p2.connect(filter);
      } else {
        osc2.connect(l2Gain);
        l2Gain.connect(filter);
      }

      osc2.start(time);
      osc2.stop(stopTime);
    }

    // Sub Bass
    if (config.subEnabled) {
      const subOsc = ctx.createOscillator();
      subOsc.type = config.subOscillator || 'sine';
      subOsc.frequency.setValueAtTime(freq * Math.pow(2, config.subOctave ?? -1), time);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(config.subLevel ?? 0.65, time);

      subOsc.connect(subGain);
      subGain.connect(envGain);

      subOsc.start(time);
      subOsc.stop(stopTime);
    }

    // Noise layer
    if (config.noiseLayerEnabled) {
      try {
        const noiseBuf = this.createNoiseBuffer(ctx, config.noiseType || 'white', 0.6);
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuf;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(2000, time);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime((config.noiseLevel ?? 0.25) * 0.5, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + attack + 0.15);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(filter);

        noiseSrc.start(time);
        noiseSrc.stop(time + attack + 0.2);
      } catch (err) {
        console.warn("Offline noise layer skipped:", err);
      }
    }
  }

  private triggerAudioClipOffline(ctx: BaseAudioContext, clip: AudioClip, time: number, outputNode: AudioNode) {
    const buffer = this.audioBuffers.get(clip.id);
    if (!buffer) {
      console.warn(`Buffer not loaded for clip offline: ${clip.id}`);
      return;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(outputNode);
    
    src.start(time);
  }

  // Convert rendered AudioBuffer into standard 16-bit stereo WAV format blob
  private bufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // Write WAV header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // chunk length
    setUint16(1);                                  // sample format (raw PCM)
    setUint16(numOfChan);                          // channel count
    setUint32(buffer.sampleRate);                  // sample rate
    setUint32(buffer.sampleRate * numOfChan * 2);  // byte rate
    setUint16(numOfChan * 2);                      // block align
    setUint16(16);                                 // bits per sample

    setUint32(0x61746164);                         // "data" chunk
    setUint32(length - pos - 4);                   // chunk length

    for (let i = 0; i < numOfChan; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      if (offset >= buffer.length) break;
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([bufferArray], { type: 'audio/wav' });
  }
}

// Single active engine reference for client usage
export const audioEngine = new AudioEngine();
