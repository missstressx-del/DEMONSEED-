import { SynthConfig, Track, MidiNote } from '../types';
import { audioEngine, PITCH_TO_FREQ, PITCHES } from './audioEngine';

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
  type: 'input' | 'output';
}

export interface MidiCcMapping {
  id: string;
  ccNumber: number;
  channel?: number; // 0 = any/omni, 1-16
  targetType: 'synth' | 'track' | 'global';
  trackId?: string; // specific track ID or 'active'
  paramKey: string;
  label: string;
  min: number;
  max: number;
  isFloat?: boolean;
  inverted?: boolean;
}

export interface MidiLearnTarget {
  targetType: 'synth' | 'track' | 'global';
  trackId?: string;
  paramKey: string;
  label: string;
  min: number;
  max: number;
  isFloat?: boolean;
  inverted?: boolean;
}

export interface MidiEventLog {
  type: 'noteon' | 'noteoff' | 'cc' | 'pitchbend';
  channel: number;
  note?: string;
  noteNumber?: number;
  velocity?: number;
  ccNumber?: number;
  ccValue?: number;
  pitchBend?: number;
  timestamp: number;
}

export interface ActiveVoice {
  id: string;
  pitch: string;
  noteNumber: number;
  osc: OscillatorNode;
  filter: BiquadFilterNode;
  envGain: GainNode;
  config: SynthConfig;
  startTime: number;
  velocity: number;
}

// Convert MIDI note number (0-127) to pitch name (e.g. 60 -> "C4")
export function midiNumberToPitch(noteNum: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(noteNum / 12) - 1;
  const noteName = noteNames[noteNum % 12];
  return `${noteName}${octave}`;
}

// Convert pitch name to MIDI note number (e.g. "C4" -> 60)
export function pitchToMidiNumber(pitch: string): number {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const match = pitch.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60;
  const name = match[1];
  const oct = parseInt(match[2], 10);
  const noteIndex = noteNames.indexOf(name);
  if (noteIndex === -1) return 60;
  return (oct + 1) * 12 + noteIndex;
}

// Convert MIDI note number to frequency in Hz
export function midiNumberToFreq(noteNum: number): number {
  return 440 * Math.pow(2, (noteNum - 69) / 12);
}

class MidiService {
  private midiAccess: any = null;
  private isSupported: boolean = false;
  private isInitialized: boolean = false;
  
  // Devices
  private inputs: Map<string, any> = new Map();
  private selectedInputId: string = 'all'; // 'all' or device ID
  private selectedChannel: number = 0; // 0 = Omni (all channels), 1-16
  
  // Active Voices for sustained note polyphony
  private activeVoices: Map<number, ActiveVoice> = new Map(); // key is noteNumber
  
  // Active Pitch Bend (-8192..8191 normalized to -2..+2 semitones)
  private pitchBendSemitones: number = 0;
  private pitchBendRange: number = 2; // +/- 2 semitones default
  
  // Default CC mappings for synths and tracks
  private defaultCcMappings: MidiCcMapping[] = [
    { id: 'map-cutoff-mod', ccNumber: 1, targetType: 'synth', paramKey: 'cutoff', label: 'Synth Cutoff (Mod Wheel)', min: 200, max: 12000 },
    { id: 'map-cutoff-74', ccNumber: 74, targetType: 'synth', paramKey: 'cutoff', label: 'Synth Filter Cutoff', min: 200, max: 12000 },
    { id: 'map-resonance-71', ccNumber: 71, targetType: 'synth', paramKey: 'resonance', label: 'Synth Filter Resonance', min: 0.1, max: 15.0, isFloat: true },
    { id: 'map-attack-73', ccNumber: 73, targetType: 'synth', paramKey: 'attack', label: 'Synth Attack Time', min: 0.01, max: 1.5, isFloat: true },
    { id: 'map-decay-75', ccNumber: 75, targetType: 'synth', paramKey: 'decay', label: 'Synth Decay Time', min: 0.05, max: 1.5, isFloat: true },
    { id: 'map-sustain-79', ccNumber: 79, targetType: 'synth', paramKey: 'sustain', label: 'Synth Sustain Level', min: 0.0, max: 1.0, isFloat: true },
    { id: 'map-release-72', ccNumber: 72, targetType: 'synth', paramKey: 'release', label: 'Synth Release Time', min: 0.05, max: 2.0, isFloat: true },
    { id: 'map-delay-fb-91', ccNumber: 91, targetType: 'synth', paramKey: 'delayFeedback', label: 'Synth Delay Feedback', min: 0.0, max: 0.9, isFloat: true },
    { id: 'map-delay-time-92', ccNumber: 92, targetType: 'synth', paramKey: 'delayTime', label: 'Synth Delay Time', min: 0.05, max: 1.0, isFloat: true },
    { id: 'map-vol-7', ccNumber: 7, targetType: 'track', paramKey: 'volume', label: 'Active Track Volume', min: 0, max: 1, isFloat: true },
    { id: 'map-pan-10', ccNumber: 10, targetType: 'track', paramKey: 'pan', label: 'Active Track Pan', min: -1, max: 1, isFloat: true },
  ];

  private ccMappings: MidiCcMapping[] = [];

  // MIDI Learn State
  private isGlobalLearnMode: boolean = false;
  private armedTarget: MidiLearnTarget | null = null;
  
  // Listeners & Event subscriptions
  private deviceListeners: Set<(devices: MidiDevice[]) => void> = new Set();
  private eventLogListeners: Set<(event: MidiEventLog) => void> = new Set();
  private activityListeners: Set<(active: boolean) => void> = new Set();
  private paramChangeListeners: Set<(param: keyof SynthConfig | 'volume' | 'pan', value: number) => void> = new Set();
  private synthParamListeners: Set<(trackId: string, paramKey: string, value: number) => void> = new Set();
  private trackParamListeners: Set<(trackId: string, paramKey: string, value: number) => void> = new Set();
  private globalParamListeners: Set<(paramKey: string, value: number) => void> = new Set();
  private stepRecordListeners: Set<(note: { pitch: string; velocity: number }) => void> = new Set();
  private mappingsListeners: Set<(mappings: MidiCcMapping[]) => void> = new Set();
  private learnStatusListeners: Set<(status: { isLearning: boolean; armedTarget: MidiLearnTarget | null }) => void> = new Set();
  private mappingLearnedListeners: Set<(info: { mapping: MidiCcMapping; ccNumber: number; ccValue: number }) => void> = new Set();
  
  // Active target track & synth config for real-time play
  public activeTrack: Track | null = null;
  public isStepRecordActive: boolean = false;

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
    this.ccMappings = JSON.parse(JSON.stringify(this.defaultCcMappings));
  }

  public checkSupport(): boolean {
    return this.isSupported;
  }

  // Initialize Web MIDI access
  public async init(): Promise<{ success: boolean; message: string; devices: MidiDevice[] }> {
    if (!this.isSupported) {
      return { 
        success: false, 
        message: 'Web MIDI API is not supported in this browser. Please use Chrome, Edge, or Brave.', 
        devices: [] 
      };
    }

    try {
      if (!this.midiAccess) {
        this.midiAccess = await (navigator as any).requestMIDIAccess({ sysex: false });
        this.midiAccess.onstatechange = (e: any) => this.handleStateChange(e);
      }

      this.isInitialized = true;
      this.refreshInputs();
      const devices = this.getDevices();

      return {
        success: true,
        message: devices.length > 0 
          ? `Connected to ${devices.length} MIDI input device(s).` 
          : 'Web MIDI enabled. Plug in a USB/Bluetooth MIDI keyboard or controller.',
        devices
      };
    } catch (err: any) {
      console.warn('Web MIDI permission denied or error:', err);
      return {
        success: false,
        message: `MIDI Access error: ${err.message || 'Permission denied'}`,
        devices: []
      };
    }
  }

  // Refresh and attach MIDI message listeners
  private refreshInputs() {
    if (!this.midiAccess) return;

    this.inputs.clear();
    const inputsIterator = this.midiAccess.inputs.values();
    for (const input of inputsIterator) {
      this.inputs.set(input.id, input);
      input.onmidimessage = (msg: any) => this.handleMidiMessage(input.id, msg);
    }

    this.notifyDeviceListeners();
  }

  private handleStateChange(e: any) {
    this.refreshInputs();
  }

  public getDevices(): MidiDevice[] {
    const list: MidiDevice[] = [];
    if (!this.midiAccess) return list;

    for (const input of this.midiAccess.inputs.values()) {
      list.push({
        id: input.id,
        name: input.name || `MIDI Device (${input.id.slice(0, 6)})`,
        manufacturer: input.manufacturer || 'Generic MIDI',
        state: input.state || 'connected',
        type: 'input'
      });
    }
    return list;
  }

  public setSelectedDevice(deviceId: string) {
    this.selectedInputId = deviceId;
  }

  public getSelectedDevice(): string {
    return this.selectedInputId;
  }

  public setSelectedChannel(channel: number) {
    this.selectedChannel = channel; // 0 = Omni, 1-16
  }

  public getSelectedChannel(): number {
    return this.selectedChannel;
  }

  // Handle Incoming Raw MIDI bytes
  private handleMidiMessage(deviceId: string, event: any) {
    if (this.selectedInputId !== 'all' && this.selectedInputId !== deviceId) {
      return;
    }

    const data = event.data;
    if (!data || data.length < 2) return;

    const status = data[0];
    const messageType = status >> 4;
    const channel = (status & 0x0f) + 1;

    // Filter by channel if not Omni
    if (this.selectedChannel !== 0 && this.selectedChannel !== channel) {
      return;
    }

    this.triggerActivityLed();

    const byte1 = data[1];
    const byte2 = data.length > 2 ? data[2] : 0;

    switch (messageType) {
      case 0x9: // Note On
        if (byte2 > 0) {
          this.handleNoteOn(byte1, byte2, channel);
        } else {
          // Note on with velocity 0 is Note Off
          this.handleNoteOff(byte1, channel);
        }
        break;

      case 0x8: // Note Off
        this.handleNoteOff(byte1, channel);
        break;

      case 0xB: // Control Change (CC)
        this.handleControlChange(byte1, byte2, channel);
        break;

      case 0xE: // Pitch Bend
        this.handlePitchBend(byte1, byte2, channel);
        break;

      default:
        break;
    }
  }

  private triggerActivityLed() {
    this.activityListeners.forEach(cb => cb(true));
    setTimeout(() => {
      this.activityListeners.forEach(cb => cb(false));
    }, 120);
  }

  // Handle Note On
  private handleNoteOn(noteNum: number, velocity: number, channel: number) {
    const pitch = midiNumberToPitch(noteNum);
    const normVelocity = velocity / 127;

    const eventLog: MidiEventLog = {
      type: 'noteon',
      channel,
      note: pitch,
      noteNumber: noteNum,
      velocity,
      timestamp: Date.now()
    };
    this.notifyEventLogListeners(eventLog);

    // If step recording is active, dispatch note to piano roll step
    if (this.isStepRecordActive) {
      this.stepRecordListeners.forEach(cb => cb({ pitch, velocity: normVelocity }));
    }

    // Live Voice Triggering for active synth track
    this.startSynthVoice(noteNum, pitch, normVelocity);
  }

  // Handle Note Off
  private handleNoteOff(noteNum: number, channel: number) {
    const pitch = midiNumberToPitch(noteNum);

    const eventLog: MidiEventLog = {
      type: 'noteoff',
      channel,
      note: pitch,
      noteNumber: noteNum,
      timestamp: Date.now()
    };
    this.notifyEventLogListeners(eventLog);

    this.stopSynthVoice(noteNum);
  }

  // Handle Control Change (CC)
  private handleControlChange(ccNumber: number, ccValue: number, channel: number) {
    const eventLog: MidiEventLog = {
      type: 'cc',
      channel,
      ccNumber,
      ccValue,
      timestamp: Date.now()
    };
    this.notifyEventLogListeners(eventLog);

    // If an armed target is waiting for physical MIDI CC input:
    if (this.armedTarget) {
      const target = this.armedTarget;
      const targetTrackId = target.trackId || (this.activeTrack?.id || 'active');
      
      // Check if we should update an existing mapping or create a new one
      const mappingId = `map-${target.targetType}-${targetTrackId}-${target.paramKey}-${Date.now()}`;
      
      // Remove any prior mapping for this specific target & parameter to avoid collisions
      this.ccMappings = this.ccMappings.filter(m => 
        !(m.targetType === target.targetType && m.paramKey === target.paramKey && (m.trackId === target.trackId || (!m.trackId && !target.trackId)))
      );

      const newMapping: MidiCcMapping = {
        id: mappingId,
        ccNumber,
        channel: 0, // Omni or match current channel
        targetType: target.targetType,
        trackId: target.trackId,
        paramKey: target.paramKey,
        label: target.label || `${target.paramKey} (CC ${ccNumber})`,
        min: target.min,
        max: target.max,
        isFloat: target.isFloat,
        inverted: target.inverted
      };

      this.ccMappings.push(newMapping);
      this.notifyMappingsListeners();

      // Notify that mapping was successfully learned
      this.mappingLearnedListeners.forEach(cb => cb({ mapping: newMapping, ccNumber, ccValue }));

      // Clear the armed target but leave learn mode active so user can map multiple controls
      this.armedTarget = null;
      this.notifyLearnStatusListeners();

      // Immediately apply the new value from hardware
      this.dispatchCcValueToTarget(newMapping, ccValue);
      return;
    }

    // Normal operation: dispatch CC values to all active mappings
    const matchingMappings = this.ccMappings.filter(m => 
      m.ccNumber === ccNumber && (!m.channel || m.channel === 0 || m.channel === channel)
    );

    if (matchingMappings.length > 0) {
      matchingMappings.forEach(mapping => {
        this.dispatchCcValueToTarget(mapping, ccValue);
      });
    }
  }

  private dispatchCcValueToTarget(mapping: MidiCcMapping, ccValue: number) {
    let normVal = ccValue / 127;
    if (mapping.inverted) {
      normVal = 1 - normVal;
    }

    let mappedValue = mapping.min + normVal * (mapping.max - mapping.min);
    if (!mapping.isFloat) {
      mappedValue = Math.round(mappedValue);
    }

    // 1. Dispatch to Synth listeners
    if (mapping.targetType === 'synth') {
      const trackId = mapping.trackId || (this.activeTrack?.id || '');
      this.synthParamListeners.forEach(cb => cb(trackId, mapping.paramKey, mappedValue));
      this.paramChangeListeners.forEach(cb => cb(mapping.paramKey as any, mappedValue));

      if (mapping.paramKey === 'cutoff' || mapping.paramKey === 'resonance') {
        this.updateActiveVoicesFilter(mapping.paramKey as any, mappedValue);
      }
    } 
    // 2. Dispatch to Track listeners (Volume, Pan)
    else if (mapping.targetType === 'track') {
      const trackId = mapping.trackId || (this.activeTrack?.id || '');
      this.trackParamListeners.forEach(cb => cb(trackId, mapping.paramKey, mappedValue));
      this.paramChangeListeners.forEach(cb => cb(mapping.paramKey as any, mappedValue));
    }
    // 3. Dispatch to Global listeners (Master Vol, BPM)
    else if (mapping.targetType === 'global') {
      this.globalParamListeners.forEach(cb => cb(mapping.paramKey, mappedValue));
    }
  }

  // Handle Pitch Bend
  private handlePitchBend(lsb: number, msb: number, channel: number) {
    const bendValue = (msb << 7) + lsb; // 0..16383, 8192 is center
    const normalizedBend = (bendValue - 8192) / 8192; // -1..+1
    this.pitchBendSemitones = normalizedBend * this.pitchBendRange;

    const eventLog: MidiEventLog = {
      type: 'pitchbend',
      channel,
      pitchBend: normalizedBend,
      timestamp: Date.now()
    };
    this.notifyEventLogListeners(eventLog);

    // Apply pitch bend detune to active synth voices
    if (audioEngine.ctx) {
      const now = audioEngine.ctx.currentTime;
      const cents = this.pitchBendSemitones * 100;
      this.activeVoices.forEach(voice => {
        try {
          voice.osc.detune.setValueAtTime(cents, now);
        } catch (e) {}
      });
    }
  }

  // --- Real-Time Polyphonic Synth Voice Engine ---

  private startSynthVoice(noteNum: number, pitch: string, velocity: number) {
    audioEngine.init();
    if (!audioEngine.ctx) return;
    const ctx = audioEngine.ctx;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const track = this.activeTrack;
    if (!track) return;

    const config: SynthConfig = track.synthConfig || {
      oscillator: 'sawtooth',
      attack: 0.05,
      decay: 0.25,
      sustain: 0.6,
      release: 0.3,
      cutoff: 2500,
      resonance: 2.0,
      delayTime: 0.25,
      delayFeedback: 0.3
    };

    // If a voice is already active for this note, stop it first
    if (this.activeVoices.has(noteNum)) {
      this.stopSynthVoice(noteNum, 0.02);
    }

    const freq = midiNumberToFreq(noteNum);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const envGain = ctx.createGain();

    osc.type = config.oscillator;
    osc.frequency.setValueAtTime(freq, now);
    // Apply current pitch bend
    osc.detune.setValueAtTime(this.pitchBendSemitones * 100, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(config.cutoff, now);
    filter.Q.setValueAtTime(config.resonance, now);

    const targetGainNode = audioEngine.trackGains.get(track.id) || audioEngine.masterGain || ctx.destination;
    const delayNode = audioEngine.delayNodes.get(track.id);

    osc.connect(filter);
    filter.connect(envGain);
    envGain.connect(targetGainNode);

    if (delayNode) {
      envGain.connect(delayNode);
    }

    // ADSR Attack -> Decay -> Sustain
    const attack = Math.max(0.005, config.attack);
    const decay = Math.max(0.01, config.decay);
    const sustain = config.sustain;
    const peakVolume = Math.max(0.05, Math.min(0.85, 0.6 * velocity));

    envGain.gain.setValueAtTime(0.0001, now);
    envGain.gain.linearRampToValueAtTime(peakVolume, now + attack);
    envGain.gain.exponentialRampToValueAtTime(Math.max(0.001, peakVolume * sustain), now + attack + decay);

    osc.start(now);

    const voice: ActiveVoice = {
      id: `voice-${noteNum}-${Date.now()}`,
      pitch,
      noteNumber: noteNum,
      osc,
      filter,
      envGain,
      config,
      startTime: now,
      velocity
    };

    this.activeVoices.set(noteNum, voice);
  }

  private stopSynthVoice(noteNum: number, overrideRelease?: number) {
    const voice = this.activeVoices.get(noteNum);
    if (!voice || !audioEngine.ctx) return;

    const ctx = audioEngine.ctx;
    const now = ctx.currentTime;
    const release = overrideRelease !== undefined ? overrideRelease : Math.max(0.02, voice.config.release);

    try {
      voice.envGain.gain.cancelScheduledValues(now);
      voice.envGain.gain.setValueAtTime(Math.max(0.0001, voice.envGain.gain.value), now);
      voice.envGain.gain.exponentialRampToValueAtTime(0.0001, now + release);

      voice.osc.stop(now + release + 0.05);

      setTimeout(() => {
        try {
          voice.osc.disconnect();
          voice.filter.disconnect();
          voice.envGain.disconnect();
        } catch (e) {}
      }, (release + 0.1) * 1000);
    } catch (e) {
      console.warn("Voice cleanup error:", e);
    }

    this.activeVoices.delete(noteNum);
  }

  // Panic button: stop all active voices immediately
  public stopAllVoices() {
    this.activeVoices.forEach((_, noteNum) => {
      this.stopSynthVoice(noteNum, 0.01);
    });
    this.activeVoices.clear();
  }

  private updateActiveVoicesFilter(param: 'cutoff' | 'resonance', value: number) {
    if (!audioEngine.ctx) return;
    const now = audioEngine.ctx.currentTime;
    this.activeVoices.forEach(voice => {
      try {
        if (param === 'cutoff') {
          voice.filter.frequency.setTargetAtTime(value, now, 0.03);
        } else if (param === 'resonance') {
          voice.filter.Q.setTargetAtTime(value, now, 0.03);
        }
      } catch (e) {}
    });
  }

  // --- MIDI Learn & Mapping Management ---

  public setMidiLearnMode(active: boolean) {
    this.isGlobalLearnMode = active;
    if (!active) {
      this.armedTarget = null;
    }
    this.notifyLearnStatusListeners();
  }

  public getIsLearnModeActive(): boolean {
    return this.isGlobalLearnMode;
  }

  public armTargetForLearn(target: MidiLearnTarget) {
    this.isGlobalLearnMode = true;
    this.armedTarget = target;
    this.notifyLearnStatusListeners();
  }

  public cancelArmedTarget() {
    this.armedTarget = null;
    this.notifyLearnStatusListeners();
  }

  public getArmedTarget(): MidiLearnTarget | null {
    return this.armedTarget;
  }

  // Legacy compatibility helpers
  public startMidiLearn(paramKey: keyof SynthConfig | 'volume' | 'pan') {
    const defaultLabels: Record<string, { label: string; min: number; max: number; isFloat?: boolean }> = {
      cutoff: { label: 'Synth Filter Cutoff', min: 200, max: 12000 },
      resonance: { label: 'Synth Filter Resonance', min: 0.1, max: 15.0, isFloat: true },
      attack: { label: 'Synth Attack Time', min: 0.01, max: 1.5, isFloat: true },
      decay: { label: 'Synth Decay Time', min: 0.05, max: 1.5, isFloat: true },
      sustain: { label: 'Synth Sustain Level', min: 0.0, max: 1.0, isFloat: true },
      release: { label: 'Synth Release Time', min: 0.05, max: 2.0, isFloat: true },
      delayTime: { label: 'Synth Delay Time', min: 0.05, max: 1.0, isFloat: true },
      delayFeedback: { label: 'Synth Delay Feedback', min: 0.0, max: 0.9, isFloat: true },
      volume: { label: 'Active Track Volume', min: 0, max: 1, isFloat: true },
      pan: { label: 'Active Track Pan', min: -1, max: 1, isFloat: true }
    };
    const def = defaultLabels[String(paramKey)] || { label: String(paramKey), min: 0, max: 127 };
    this.armTargetForLearn({
      targetType: paramKey === 'volume' || paramKey === 'pan' ? 'track' : 'synth',
      trackId: this.activeTrack?.id,
      paramKey: String(paramKey),
      label: def.label,
      min: def.min,
      max: def.max,
      isFloat: def.isFloat
    });
  }

  public cancelMidiLearn() {
    this.cancelArmedTarget();
  }

  public getIsLearning(): { isLearning: boolean; targetParam: string | null; armedTarget: MidiLearnTarget | null } {
    return { 
      isLearning: this.isGlobalLearnMode || this.armedTarget !== null, 
      targetParam: this.armedTarget?.paramKey || null,
      armedTarget: this.armedTarget
    };
  }

  public getCcMappings(): MidiCcMapping[] {
    return [...this.ccMappings];
  }

  public getMappingForParam(paramKey: string, targetType: 'synth' | 'track' | 'global' = 'synth', trackId?: string): MidiCcMapping | undefined {
    return this.ccMappings.find(m => 
      m.paramKey === paramKey && 
      m.targetType === targetType && 
      (!trackId || m.trackId === trackId || !m.trackId)
    );
  }

  public addOrUpdateMapping(mapping: MidiCcMapping) {
    this.ccMappings = this.ccMappings.filter(m => m.id !== mapping.id);
    this.ccMappings.push(mapping);
    this.notifyMappingsListeners();
  }

  public removeMapping(id: string) {
    this.ccMappings = this.ccMappings.filter(m => m.id !== id);
    this.notifyMappingsListeners();
  }

  public clearAllMappings() {
    this.ccMappings = [];
    this.notifyMappingsListeners();
  }

  public resetDefaultMappings() {
    this.ccMappings = JSON.parse(JSON.stringify(this.defaultCcMappings));
    this.notifyMappingsListeners();
  }

  public bindCcMapping(ccNumber: number, paramKey: keyof SynthConfig | 'volume' | 'pan') {
    const defaultLabels: Record<string, { label: string; min: number; max: number; isFloat?: boolean }> = {
      cutoff: { label: `Cutoff (CC ${ccNumber})`, min: 200, max: 12000 },
      resonance: { label: `Resonance (CC ${ccNumber})`, min: 0.1, max: 15.0, isFloat: true },
      attack: { label: `Attack (CC ${ccNumber})`, min: 0.01, max: 1.5, isFloat: true },
      decay: { label: `Decay (CC ${ccNumber})`, min: 0.05, max: 1.5, isFloat: true },
      sustain: { label: `Sustain (CC ${ccNumber})`, min: 0.0, max: 1.0, isFloat: true },
      release: { label: `Release (CC ${ccNumber})`, min: 0.05, max: 2.0, isFloat: true },
      delayTime: { label: `Delay Time (CC ${ccNumber})`, min: 0.05, max: 1.0, isFloat: true },
      delayFeedback: { label: `Feedback (CC ${ccNumber})`, min: 0.0, max: 0.9, isFloat: true },
      volume: { label: `Volume (CC ${ccNumber})`, min: 0, max: 1, isFloat: true },
      pan: { label: `Pan (CC ${ccNumber})`, min: -1, max: 1, isFloat: true }
    };

    const def = defaultLabels[String(paramKey)] || { label: `${String(paramKey)} (CC ${ccNumber})`, min: 0, max: 127 };
    
    // Remove existing
    this.ccMappings = this.ccMappings.filter(m => m.paramKey !== String(paramKey));
    this.ccMappings.push({
      id: `map-${paramKey}-${Date.now()}`,
      ccNumber,
      channel: 0,
      targetType: paramKey === 'volume' || paramKey === 'pan' ? 'track' : 'synth',
      trackId: this.activeTrack?.id,
      paramKey: String(paramKey),
      label: def.label,
      min: def.min,
      max: def.max,
      isFloat: def.isFloat
    });
    this.notifyMappingsListeners();
  }

  // --- Subscriptions ---

  public onDevicesChange(callback: (devices: MidiDevice[]) => void) {
    this.deviceListeners.add(callback);
    callback(this.getDevices());
    return () => this.deviceListeners.delete(callback);
  }

  public onEventLog(callback: (event: MidiEventLog) => void) {
    this.eventLogListeners.add(callback);
    return () => this.eventLogListeners.delete(callback);
  }

  public onActivity(callback: (active: boolean) => void) {
    this.activityListeners.add(callback);
    return () => this.activityListeners.delete(callback);
  }

  public onParamChange(callback: (param: keyof SynthConfig | 'volume' | 'pan', value: number) => void) {
    this.paramChangeListeners.add(callback);
    return () => this.paramChangeListeners.delete(callback);
  }

  public onSynthParamChange(callback: (trackId: string, paramKey: string, value: number) => void) {
    this.synthParamListeners.add(callback);
    return () => this.synthParamListeners.delete(callback);
  }

  public onTrackParamChange(callback: (trackId: string, paramKey: string, value: number) => void) {
    this.trackParamListeners.add(callback);
    return () => this.trackParamListeners.delete(callback);
  }

  public onGlobalParamChange(callback: (paramKey: string, value: number) => void) {
    this.globalParamListeners.add(callback);
    return () => this.globalParamListeners.delete(callback);
  }

  public onStepRecord(callback: (note: { pitch: string; velocity: number }) => void) {
    this.stepRecordListeners.add(callback);
    return () => this.stepRecordListeners.delete(callback);
  }

  public onMappingsChange(callback: (mappings: MidiCcMapping[]) => void) {
    this.mappingsListeners.add(callback);
    callback(this.getCcMappings());
    return () => this.mappingsListeners.delete(callback);
  }

  public onLearnStatusChange(callback: (status: { isLearning: boolean; armedTarget: MidiLearnTarget | null }) => void) {
    this.learnStatusListeners.add(callback);
    callback({ isLearning: this.isGlobalLearnMode, armedTarget: this.armedTarget });
    return () => this.learnStatusListeners.delete(callback);
  }

  public onMappingLearned(callback: (info: { mapping: MidiCcMapping; ccNumber: number; ccValue: number }) => void) {
    this.mappingLearnedListeners.add(callback);
    return () => this.mappingLearnedListeners.delete(callback);
  }

  private notifyMappingsListeners() {
    const mappings = this.getCcMappings();
    this.mappingsListeners.forEach(cb => cb(mappings));
  }

  private notifyLearnStatusListeners() {
    const status = { isLearning: this.isGlobalLearnMode, armedTarget: this.armedTarget };
    this.learnStatusListeners.forEach(cb => cb(status));
  }

  private notifyDeviceListeners() {
    const devices = this.getDevices();
    this.deviceListeners.forEach(cb => cb(devices));
  }

  private notifyEventLogListeners(event: MidiEventLog) {
    this.eventLogListeners.forEach(cb => cb(event));
  }

  // --- Standard MIDI File (.mid) Export & Import Engine ---

  /**
   * Export track MIDI notes into standard MIDI File (SMF Format 0)
   */
  public exportTrackToMidiBlob(track: Track, bpm: number = 120): Blob {
    const notes = track.midiNotes || [];
    const ticksPerQuarterNote = 480; // Standard PPQ
    const ticksPer16th = ticksPerQuarterNote / 4; // 120 ticks per step

    // Build MIDI Track Events: Note On and Note Off
    interface MidiEvent {
      tick: number;
      type: 'on' | 'off';
      noteNum: number;
      velocity: number;
    }

    const rawEvents: MidiEvent[] = [];

    notes.forEach(note => {
      const noteNum = pitchToMidiNumber(note.pitch);
      const startTick = note.step * ticksPer16th;
      const durationTicks = Math.max(1, note.duration) * ticksPer16th;
      const endTick = startTick + durationTicks;

      rawEvents.push({
        tick: startTick,
        type: 'on',
        noteNum,
        velocity: 100 // Standard velocity
      });

      rawEvents.push({
        tick: endTick,
        type: 'off',
        noteNum,
        velocity: 0
      });
    });

    // Sort by tick, note offs before note ons if same tick
    rawEvents.sort((a, b) => {
      if (a.tick !== b.tick) return a.tick - b.tick;
      if (a.type === 'off' && b.type === 'on') return -1;
      if (a.type === 'on' && b.type === 'off') return 1;
      return 0;
    });

    // Helper: Write Variable Length Quantity (VLQ)
    const writeVLQ = (bytes: number[], val: number) => {
      const buffer: number[] = [];
      let v = val;
      buffer.push(v & 0x7f);
      while ((v >>= 7) > 0) {
        buffer.push((v & 0x7f) | 0x80);
      }
      for (let i = buffer.length - 1; i >= 0; i--) {
        bytes.push(buffer[i]);
      }
    };

    const trackBytes: number[] = [];

    // Track Name Meta Event
    const trackName = `${track.name || 'Demonseed Synth'}`;
    writeVLQ(trackBytes, 0); // delta 0
    trackBytes.push(0xff, 0x03, trackName.length);
    for (let i = 0; i < trackName.length; i++) {
      trackBytes.push(trackName.charCodeAt(i));
    }

    // Set Tempo Meta Event (microseconds per quarter note = 60,000,000 / BPM)
    const mpqn = Math.round(60000000 / bpm);
    writeVLQ(trackBytes, 0);
    trackBytes.push(0xff, 0x51, 0x03);
    trackBytes.push((mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff);

    // Time Signature Meta Event (4/4)
    writeVLQ(trackBytes, 0);
    trackBytes.push(0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

    // Write note events with delta times
    let lastTick = 0;
    rawEvents.forEach(evt => {
      const delta = Math.max(0, evt.tick - lastTick);
      writeVLQ(trackBytes, delta);
      lastTick = evt.tick;

      if (evt.type === 'on') {
        trackBytes.push(0x90, evt.noteNum, evt.velocity);
      } else {
        trackBytes.push(0x80, evt.noteNum, 0);
      }
    });

    // End of Track Meta Event
    writeVLQ(trackBytes, 0);
    trackBytes.push(0xff, 0x2f, 0x00);

    // Build SMF File: Header Chunk + Track Chunk
    const fileBytes: number[] = [];

    // 1. Header Chunk: "MThd", length: 6, format 0, 1 track, PPQ
    fileBytes.push(0x4d, 0x54, 0x68, 0x64); // 'MThd'
    fileBytes.push(0x00, 0x00, 0x00, 0x06); // Header length 6
    fileBytes.push(0x00, 0x00);             // Format 0 (single track)
    fileBytes.push(0x00, 0x01);             // 1 track
    fileBytes.push((ticksPerQuarterNote >> 8) & 0xff, ticksPerQuarterNote & 0xff); // Division

    // 2. Track Chunk: "MTrk", length, trackBytes
    fileBytes.push(0x4d, 0x54, 0x72, 0x6b); // 'MTrk'
    const trkLen = trackBytes.length;
    fileBytes.push((trkLen >> 24) & 0xff, (trkLen >> 16) & 0xff, (trkLen >> 8) & 0xff, trkLen & 0xff);
    fileBytes.push(...trackBytes);

    return new Blob([new Uint8Array(fileBytes)], { type: 'audio/midi' });
  }

  /**
   * Parse a standard MIDI file (.mid) and extract notes quantized to 16th steps
   */
  public async parseMidiFile(file: File): Promise<{ notes: MidiNote[]; trackName?: string; bpm?: number }> {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    let offset = 0;

    // Check Header "MThd"
    const readString = (len: number): string => {
      let str = '';
      for (let i = 0; i < len; i++) {
        str += String.fromCharCode(data[offset++]);
      }
      return str;
    };

    const readUint32 = (): number => {
      const val = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
      offset += 4;
      return val >>> 0;
    };

    const readUint16 = (): number => {
      const val = (data[offset] << 8) | data[offset + 1];
      offset += 2;
      return val;
    };

    const readVLQ = (): number => {
      let val = 0;
      while (offset < data.length) {
        const b = data[offset++];
        val = (val << 7) | (b & 0x7f);
        if ((b & 0x80) === 0) break;
      }
      return val;
    };

    if (readString(4) !== 'MThd') {
      throw new Error('Invalid MIDI file: MThd header not found.');
    }

    readUint32(); // header length
    const format = readUint16();
    const numTracks = readUint16();
    const division = readUint16(); // ticks per quarter note
    const ticksPer16th = division / 4;

    const notes: MidiNote[] = [];
    let detectedTrackName: string | undefined;
    let detectedBpm: number | undefined;

    // Parse track chunks
    for (let t = 0; t < numTracks; t++) {
      if (offset >= data.length) break;
      const chunkType = readString(4);
      const chunkLength = readUint32();
      const chunkEnd = offset + chunkLength;

      if (chunkType !== 'MTrk') {
        offset = chunkEnd;
        continue;
      }

      let currentTick = 0;
      let lastStatus = 0;
      const openNotes: Map<number, { startTick: number; velocity: number }> = new Map();

      while (offset < chunkEnd && offset < data.length) {
        const delta = readVLQ();
        currentTick += delta;

        let status = data[offset];
        if (status >= 0x80) {
          offset++;
          lastStatus = status;
        } else {
          status = lastStatus; // Running status
        }

        const msgType = status >> 4;

        if (status === 0xff) {
          // Meta Event
          const metaType = data[offset++];
          const metaLen = readVLQ();
          if (metaType === 0x03 && !detectedTrackName) {
            let name = '';
            for (let i = 0; i < metaLen; i++) name += String.fromCharCode(data[offset + i]);
            detectedTrackName = name;
          } else if (metaType === 0x51 && metaLen === 3 && !detectedBpm) {
            const mpqn = (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
            detectedBpm = Math.round(60000000 / mpqn);
          }
          offset += metaLen;
        } else if (msgType === 0x9) {
          // Note On
          const noteNum = data[offset++];
          const velocity = data[offset++];
          if (velocity > 0) {
            openNotes.set(noteNum, { startTick: currentTick, velocity });
          } else {
            // Note On with 0 vel is Note Off
            if (openNotes.has(noteNum)) {
              const start = openNotes.get(noteNum)!;
              openNotes.delete(noteNum);
              const startStep = Math.round(start.startTick / ticksPer16th);
              const endStep = Math.max(startStep + 1, Math.round(currentTick / ticksPer16th));
              if (startStep < 32) {
                const pitch = midiNumberToPitch(noteNum);
                notes.push({
                  id: `imported-${pitch}-${startStep}-${Date.now()}-${Math.random()}`,
                  pitch,
                  step: startStep,
                  duration: Math.min(16, Math.max(1, endStep - startStep))
                });
              }
            }
          }
        } else if (msgType === 0x8) {
          // Note Off
          const noteNum = data[offset++];
          offset++; // velocity byte
          if (openNotes.has(noteNum)) {
            const start = openNotes.get(noteNum)!;
            openNotes.delete(noteNum);
            const startStep = Math.round(start.startTick / ticksPer16th);
            const endStep = Math.max(startStep + 1, Math.round(currentTick / ticksPer16th));
            if (startStep < 32) {
              const pitch = midiNumberToPitch(noteNum);
              notes.push({
                id: `imported-${pitch}-${startStep}-${Date.now()}-${Math.random()}`,
                pitch,
                step: startStep,
                duration: Math.min(16, Math.max(1, endStep - startStep))
              });
            }
          }
        } else if (msgType === 0xc || msgType === 0xd) {
          offset += 1;
        } else if (msgType === 0xb || msgType === 0xe) {
          offset += 2;
        }
      }

      offset = chunkEnd;
    }

    return { notes, trackName: detectedTrackName, bpm: detectedBpm };
  }
}

export const midiService = new MidiService();
