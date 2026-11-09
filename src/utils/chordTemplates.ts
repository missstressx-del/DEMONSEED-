import { MidiNote } from '../types';
import { PITCH_TO_FREQ, PITCHES } from '../services/audioEngine';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export type VoicingStyle = 'root' | 'inv1' | 'inv2' | 'drop2' | 'spread' | 'octave_bass';
export type RhythmPattern = 'sustained' | 'stabs' | 'pumping' | 'arp_up' | 'arp_down' | 'strum';
export type DestinationBar = 'full' | 'bar1' | 'bar2';

export interface ChordTypeDefinition {
  id: string;
  name: string;
  short: string;
  intervals: number[]; // semitones relative to chord root
  category: 'Triad' | 'Suspended' | '7th' | 'Extended / Color' | 'Altered';
  description: string;
}

export const CHORD_TYPES: Record<string, ChordTypeDefinition> = {
  maj: {
    id: 'maj',
    name: 'Major Triad',
    short: '',
    intervals: [0, 4, 7],
    category: 'Triad',
    description: 'Bright, stable, triumphant tonic triad'
  },
  min: {
    id: 'min',
    name: 'Minor Triad',
    short: 'm',
    intervals: [0, 3, 7],
    category: 'Triad',
    description: 'Dark, melancholic, contemplative emotional foundation'
  },
  p5: {
    id: 'p5',
    name: 'Power Chord (5th)',
    short: '5',
    intervals: [0, 7, 12],
    category: 'Triad',
    description: 'Heavy, neutral root-fifth rock and industrial punch'
  },
  sus2: {
    id: 'sus2',
    name: 'Suspended 2nd',
    short: 'sus2',
    intervals: [0, 2, 7],
    category: 'Suspended',
    description: 'Open, floating, unresolved ambient atmosphere'
  },
  sus4: {
    id: 'sus4',
    name: 'Suspended 4th',
    short: 'sus4',
    intervals: [0, 5, 7],
    category: 'Suspended',
    description: 'Tense, dramatic lift pulling toward resolution'
  },
  dim: {
    id: 'dim',
    name: 'Diminished',
    short: 'dim',
    intervals: [0, 3, 6],
    category: 'Triad',
    description: 'Dissonant, unstable, suspenseful tension'
  },
  aug: {
    id: 'aug',
    name: 'Augmented',
    short: 'aug',
    intervals: [0, 4, 8],
    category: 'Triad',
    description: 'Dreamlike, surreal, whole-tone mystery'
  },
  maj7: {
    id: 'maj7',
    name: 'Major 7th',
    short: 'maj7',
    intervals: [0, 4, 7, 11],
    category: '7th',
    description: 'Lush, dreamy, nostalgic synthwave and jazz shimmer'
  },
  min7: {
    id: 'min7',
    name: 'Minor 7th',
    short: 'm7',
    intervals: [0, 3, 7, 10],
    category: '7th',
    description: 'Silky, moody, quintessential lo-fi and deep house vibe'
  },
  dom7: {
    id: 'dom7',
    name: 'Dominant 7th',
    short: '7',
    intervals: [0, 4, 7, 10],
    category: '7th',
    description: 'Energetic, bluesy, driving forward cadence'
  },
  m7b5: {
    id: 'm7b5',
    name: 'Half-Diminished',
    short: 'm7b5',
    intervals: [0, 3, 6, 10],
    category: '7th',
    description: 'Moody, noir, minor ii-V-i emotional turning point'
  },
  dim7: {
    id: 'dim7',
    name: 'Diminished 7th',
    short: 'dim7',
    intervals: [0, 3, 6, 9],
    category: '7th',
    description: 'Symmetrical, dramatic gothic horror tension'
  },
  mM7: {
    id: 'mM7',
    name: 'Minor-Major 7th',
    short: 'm(maj7)',
    intervals: [0, 3, 7, 11],
    category: '7th',
    description: 'Classic spy, cyber-thriller Hitchcock noir chord'
  },
  add9: {
    id: 'add9',
    name: 'Add9',
    short: 'add9',
    intervals: [0, 4, 7, 14],
    category: 'Extended / Color',
    description: 'Crystalline pop clarity without 7th dissonance'
  },
  maj9: {
    id: 'maj9',
    name: 'Major 9th',
    short: 'maj9',
    intervals: [0, 4, 7, 11, 14],
    category: 'Extended / Color',
    description: 'Ultra-sophisticated, glowing neo-soul sunbeam'
  },
  min9: {
    id: 'min9',
    name: 'Minor 9th',
    short: 'm9',
    intervals: [0, 3, 7, 10, 14],
    category: 'Extended / Color',
    description: 'Deep, emotive midnight chillhop velvet'
  },
  dom9: {
    id: 'dom9',
    name: 'Dominant 9th',
    short: '9',
    intervals: [0, 4, 7, 10, 14],
    category: 'Extended / Color',
    description: 'Funky, biting, expressive electric groove'
  },
  min11: {
    id: 'min11',
    name: 'Minor 11th',
    short: 'm11',
    intervals: [0, 3, 7, 10, 14, 17],
    category: 'Extended / Color',
    description: 'Deep modern modal chord with soaring open top'
  },
  dom13: {
    id: 'dom13',
    name: 'Dominant 13th',
    short: '13',
    intervals: [0, 4, 7, 10, 14, 21],
    category: 'Extended / Color',
    description: 'Opulent big-band and French touch sophistication'
  },
  hendrix: {
    id: 'hendrix',
    name: '7#9 (Purple Haze)',
    short: '7#9',
    intervals: [0, 4, 7, 10, 15],
    category: 'Altered',
    description: 'Gritty, explosive psychedelic funk & rock friction'
  },
  dom7b9: {
    id: 'dom7b9',
    name: '7b9 Altered',
    short: '7b9',
    intervals: [0, 4, 7, 10, 13],
    category: 'Altered',
    description: 'Exotic flamenco and jazz dark dominant resolution'
  }
};

export interface ChordStep {
  rootOffset: number; // semitones from tonic key root
  quality: string; // key of CHORD_TYPES
  displayRoman: string; // e.g. 'i', 'VI', 'III', 'VII'
  labelSuffix?: string;
  bassOffset?: number; // optional slash chord bass offset
}

export interface ChordProgressionTemplate {
  id: string;
  name: string;
  genre: 'Synthwave & Cyberpunk' | 'EDM & House' | 'Neo-Soul & R&B' | 'Lo-Fi & Chill' | 'Pop & Anthem' | 'Cinematic & Dramatic' | 'City Pop & J-Pop' | 'Dark & Industrial' | 'Witch House';
  mood: string;
  description: string;
  scaleType: 'minor' | 'major';
  defaultKey: string;
  chords: ChordStep[];
}

export const CHORD_PROGRESSION_TEMPLATES: ChordProgressionTemplate[] = [
  // --- Synthwave & Cyberpunk ---
  {
    id: 'cw-dystopian-requiem',
    name: 'Dystopian Requiem',
    genre: 'Synthwave & Cyberpunk',
    mood: 'Epic, melancholic, blade runner neon aesthetic',
    description: 'The definitive dark synthwave minor progression echoing neon skyscrapers in rain.',
    scaleType: 'minor',
    defaultKey: 'C',
    chords: [
      { rootOffset: 0, quality: 'min', displayRoman: 'i' },
      { rootOffset: 8, quality: 'maj', displayRoman: 'VI' },
      { rootOffset: 3, quality: 'maj', displayRoman: 'III' },
      { rootOffset: 10, quality: 'maj', displayRoman: 'VII' }
    ]
  },
  {
    id: 'cw-nightcity-drive',
    name: 'Nightcity 1984',
    genre: 'Synthwave & Cyberpunk',
    mood: 'Hypnotic, driving, retro analog nostalgia',
    description: 'Continuous rolling tension ideal for high-speed arpeggios and resonant sawtooth leads.',
    scaleType: 'minor',
    defaultKey: 'A',
    chords: [
      { rootOffset: 0, quality: 'min7', displayRoman: 'i7' },
      { rootOffset: 5, quality: 'min7', displayRoman: 'iv7' },
      { rootOffset: 10, quality: 'dom7', displayRoman: 'VII7' },
      { rootOffset: 0, quality: 'min7', displayRoman: 'i7' }
    ]
  },
  {
    id: 'cw-vangelis-horizon',
    name: 'Vangelis Cyber Horizon',
    genre: 'Synthwave & Cyberpunk',
    mood: 'Mysterious, cinematic, exotic tension',
    description: 'Uses the exotic flat-two Neapolitan chord for haunting synthetic majesty.',
    scaleType: 'minor',
    defaultKey: 'D',
    chords: [
      { rootOffset: 0, quality: 'min', displayRoman: 'i' },
      { rootOffset: 1, quality: 'maj', displayRoman: 'bII' },
      { rootOffset: 5, quality: 'min', displayRoman: 'iv' },
      { rootOffset: 0, quality: 'sus2', displayRoman: 'isus2' }
    ]
  },
  {
    id: 'cw-obsidian-drift',
    name: 'Obsidian Descent',
    genre: 'Synthwave & Cyberpunk',
    mood: 'Aggressive, heavy, industrial dawning',
    description: 'Dark descending bass roots with sharp sustained pads for maximum dystopian punch.',
    scaleType: 'minor',
    defaultKey: 'F',
    chords: [
      { rootOffset: 0, quality: 'min', displayRoman: 'i' },
      { rootOffset: 10, quality: 'maj', displayRoman: 'VII' },
      { rootOffset: 8, quality: 'maj', displayRoman: 'VI' },
      { rootOffset: 7, quality: 'dom7', displayRoman: 'V7' }
    ]
  },

  // --- EDM & House ---
  {
    id: 'edm-axis-anthem',
    name: 'Festival Anthem (Axis)',
    genre: 'EDM & House',
    mood: 'Euphoric, soaring, emotional festival mainstage',
    description: 'The golden pop and progressive house progression that moves tens of thousands of souls.',
    scaleType: 'major',
    defaultKey: 'C',
    chords: [
      { rootOffset: 0, quality: 'maj', displayRoman: 'I' },
      { rootOffset: 7, quality: 'maj', displayRoman: 'V' },
      { rootOffset: 9, quality: 'min', displayRoman: 'vi' },
      { rootOffset: 5, quality: 'maj', displayRoman: 'IV' }
    ]
  },
  {
    id: 'edm-future-house-7ths',
    name: 'Future House Stabs',
    genre: 'EDM & House',
    mood: 'Bouncy, sophisticated, punchy club groove',
    description: '4-on-the-floor syncopated 7th stabs with crisp metallic attack.',
    scaleType: 'minor',
    defaultKey: 'G',
    chords: [
      { rootOffset: 5, quality: 'min7', displayRoman: 'iv7' },
      { rootOffset: 7, quality: 'min7', displayRoman: 'v7' },
      { rootOffset: 0, quality: 'min7', displayRoman: 'i7' },
      { rootOffset: 10, quality: 'maj7', displayRoman: 'bVIImaj7' }
    ]
  },
  {
    id: 'edm-deep-house-velvet',
    name: 'Deep House Sunset',
    genre: 'EDM & House',
    mood: 'Warm, sultry, hypnotic late-night basement',
    description: 'Smooth jazz turnarounds voiced with lush minor 9ths and major 7ths.',
    scaleType: 'major',
    defaultKey: 'F',
    chords: [
      { rootOffset: 2, quality: 'min9', displayRoman: 'ii9' },
      { rootOffset: 7, quality: 'dom9', displayRoman: 'V9' },
      { rootOffset: 0, quality: 'maj9', displayRoman: 'Imaj9' },
      { rootOffset: 9, quality: 'min7', displayRoman: 'vi7' }
    ]
  },
  {
    id: 'edm-french-touch',
    name: 'French Touch 90s',
    genre: 'EDM & House',
    mood: 'Funky, filtered, disco-inspired euphoria',
    description: 'Daft Punk & Cassius style extended chords primed for resonant lowpass filter sweeps.',
    scaleType: 'major',
    defaultKey: 'A',
    chords: [
      { rootOffset: 0, quality: 'maj7', displayRoman: 'Imaj7' },
      { rootOffset: 9, quality: 'min7', displayRoman: 'vi7' },
      { rootOffset: 5, quality: 'maj7', displayRoman: 'IVmaj7' },
      { rootOffset: 7, quality: 'dom7', displayRoman: 'V7' }
    ]
  },

  // --- Neo-Soul & R&B ---
  {
    id: 'ns-golden-hour',
    name: 'Golden Hour Neo-Soul',
    genre: 'Neo-Soul & R&B',
    mood: 'Warm, organic, buttery, sun-drenched',
    description: 'Rich extended 9th and 13th voicings with smooth chromatic inner movement.',
    scaleType: 'major',
    defaultKey: 'D',
    chords: [
      { rootOffset: 0, quality: 'maj9', displayRoman: 'Imaj9' },
      { rootOffset: 9, quality: 'min9', displayRoman: 'vi9' },
      { rootOffset: 2, quality: 'min9', displayRoman: 'ii9' },
      { rootOffset: 7, quality: 'dom13', displayRoman: 'V13' }
    ]
  },
  {
    id: 'ns-gospel-lift',
    name: 'Sunday Gospel Glow',
    genre: 'Neo-Soul & R&B',
    mood: 'Spiritual, heartwarming, uplifting emotional resolve',
    description: 'Moving major-to-minor IV turnaround that tugs directly at the heartstrings.',
    scaleType: 'major',
    defaultKey: 'C',
    chords: [
      { rootOffset: 0, quality: 'maj', displayRoman: 'I' },
      { rootOffset: 4, quality: 'min7', displayRoman: 'iii7' },
      { rootOffset: 5, quality: 'maj7', displayRoman: 'IVmaj7' },
      { rootOffset: 5, quality: 'min', displayRoman: 'iv' }
    ]
  },
  {
    id: 'ns-miles-turnaround',
    name: 'Coltrane & Miles Noir',
    genre: 'Neo-Soul & R&B',
    mood: 'Moody, complex, smoke-filled jazz lounge',
    description: 'Half-diminished to altered dominant cadence creating exquisite harmonic depth.',
    scaleType: 'minor',
    defaultKey: 'C',
    chords: [
      { rootOffset: 2, quality: 'm7b5', displayRoman: 'iiø7' },
      { rootOffset: 7, quality: 'dom7b9', displayRoman: 'V7b9' },
      { rootOffset: 0, quality: 'min9', displayRoman: 'i9' },
      { rootOffset: 0, quality: 'mM7', displayRoman: 'i(maj7)' }
    ]
  },

  // --- Lo-Fi & Chill ---
  {
    id: 'lofi-rainy-tape',
    name: 'Rainy Window Tape',
    genre: 'Lo-Fi & Chill',
    mood: 'Wistful, relaxed, tape-warped nostalgia',
    description: 'Gentle minor 7th cycle suited for vinyl crackle, detuned vibrato and Rhodes keyboards.',
    scaleType: 'minor',
    defaultKey: 'E',
    chords: [
      { rootOffset: 0, quality: 'min7', displayRoman: 'i7' },
      { rootOffset: 5, quality: 'min7', displayRoman: 'iv7' },
      { rootOffset: 10, quality: 'dom7', displayRoman: 'bVII7' },
      { rootOffset: 3, quality: 'maj7', displayRoman: 'bIIImaj7' }
    ]
  },
  {
    id: 'lofi-coffee-drift',
    name: 'Coffee Shop Study Drift',
    genre: 'Lo-Fi & Chill',
    mood: 'Warm, safe, focused, introspective',
    description: 'Cozy bedroom beats progression with soft upper extensions that never fatigue the ears.',
    scaleType: 'major',
    defaultKey: 'F',
    chords: [
      { rootOffset: 0, quality: 'maj7', displayRoman: 'Imaj7' },
      { rootOffset: 9, quality: 'min7', displayRoman: 'vi7' },
      { rootOffset: 2, quality: 'min7', displayRoman: 'ii7' },
      { rootOffset: 7, quality: 'dom7', displayRoman: 'V7' }
    ]
  },
  {
    id: 'lofi-2am-dream',
    name: '2 AM Melancholy',
    genre: 'Lo-Fi & Chill',
    mood: 'Hazy, dreamy, tender midnight blues',
    description: 'Stepping downward from the IV chord to a gentle tonic resolution.',
    scaleType: 'major',
    defaultKey: 'Eb',
    chords: [
      { rootOffset: 5, quality: 'maj7', displayRoman: 'IVmaj7' },
      { rootOffset: 4, quality: 'min7', displayRoman: 'iii7' },
      { rootOffset: 2, quality: 'min7', displayRoman: 'ii7' },
      { rootOffset: 0, quality: 'maj7', displayRoman: 'Imaj7' }
    ]
  },

  // --- Cinematic & Dramatic ---
  {
    id: 'cin-interstellar',
    name: 'Interstellar Horizon',
    genre: 'Cinematic & Dramatic',
    mood: 'Cosmic, vast, awe-inspiring, poignant',
    description: 'Hans Zimmer style ascending drama moving through major chords over a minor center.',
    scaleType: 'minor',
    defaultKey: 'A',
    chords: [
      { rootOffset: 0, quality: 'min', displayRoman: 'i' },
      { rootOffset: 8, quality: 'maj', displayRoman: 'VI' },
      { rootOffset: 3, quality: 'maj', displayRoman: 'III' },
      { rootOffset: 10, quality: 'maj', displayRoman: 'VII' }
    ]
  },
  {
    id: 'cin-suspended-wonder',
    name: 'Suspended Eternity',
    genre: 'Cinematic & Dramatic',
    mood: 'Ethereal, floating, timeless grandeur',
    description: 'Suspended second and fourth chords creating an infinite starry sonic canvas.',
    scaleType: 'major',
    defaultKey: 'C',
    chords: [
      { rootOffset: 0, quality: 'sus2', displayRoman: 'Isus2' },
      { rootOffset: 5, quality: 'sus2', displayRoman: 'IVsus2' },
      { rootOffset: 9, quality: 'sus4', displayRoman: 'visus4' },
      { rootOffset: 7, quality: 'sus4', displayRoman: 'Vsus4' }
    ]
  },
  {
    id: 'cin-heroes-ascent',
    name: "Hero's Final Ascent",
    genre: 'Cinematic & Dramatic',
    mood: 'Triumphant, emotional, cinematic peak',
    description: 'Epic cinematic journey from emotional struggle to resolute victory.',
    scaleType: 'major',
    defaultKey: 'G',
    chords: [
      { rootOffset: 9, quality: 'min', displayRoman: 'vi' },
      { rootOffset: 5, quality: 'maj', displayRoman: 'IV' },
      { rootOffset: 0, quality: 'maj', displayRoman: 'I' },
      { rootOffset: 7, quality: 'maj', displayRoman: 'V' }
    ]
  },
  {
    id: 'cin-dark-cadence',
    name: 'Inception Dramatic Cadence',
    genre: 'Cinematic & Dramatic',
    mood: 'Dark, tense, relentless clock ticking',
    description: 'Dark minor gravity paired with minor iv tension for high-stakes score passages.',
    scaleType: 'minor',
    defaultKey: 'A',
    chords: [
      { rootOffset: 0, quality: 'min', displayRoman: 'i' },
      { rootOffset: 3, quality: 'maj', displayRoman: 'III' },
      { rootOffset: 10, quality: 'maj', displayRoman: 'VII' },
      { rootOffset: 5, quality: 'min', displayRoman: 'iv' }
    ]
  },

  // --- City Pop & J-Pop ---
  {
    id: 'jp-royal-road',
    name: 'Royal Road (王道 Oudou)',
    genre: 'City Pop & J-Pop',
    mood: 'Iconic, emotional, anime opening climax',
    description: 'The legendary Japanese royal progression used in hundreds of anime anthems and hit singles.',
    scaleType: 'major',
    defaultKey: 'F',
    chords: [
      { rootOffset: 5, quality: 'maj7', displayRoman: 'IVmaj7' },
      { rootOffset: 7, quality: 'dom7', displayRoman: 'V7' },
      { rootOffset: 4, quality: 'min7', displayRoman: 'iii7' },
      { rootOffset: 9, quality: 'min', displayRoman: 'vi' }
    ]
  },
  {
    id: 'jp-just-the-two',
    name: 'Shibuya 90s (Two Of Us)',
    genre: 'City Pop & J-Pop',
    mood: 'Groovy, sparkling, sophisticated retro funk',
    description: 'Tatsuro Yamashita & City Pop staple utilizing chromatic secondary dominant transitions.',
    scaleType: 'major',
    defaultKey: 'Db',
    chords: [
      { rootOffset: 5, quality: 'maj7', displayRoman: 'IVmaj7' },
      { rootOffset: 4, quality: 'dom7', displayRoman: 'III7' },
      { rootOffset: 9, quality: 'min7', displayRoman: 'vi7' },
      { rootOffset: 0, quality: 'dom7', displayRoman: 'I7' }
    ]
  },
  {
    id: 'jp-summer-nostalgia',
    name: 'Shonan Coastline Summer',
    genre: 'City Pop & J-Pop',
    mood: 'Breezy, nostalgic, driving along the beach',
    description: 'Sparkling FM brass and synth keys progression filled with optimism.',
    scaleType: 'major',
    defaultKey: 'E',
    chords: [
      { rootOffset: 5, quality: 'maj7', displayRoman: 'IVmaj7' },
      { rootOffset: 4, quality: 'min7', displayRoman: 'iii7' },
      { rootOffset: 9, quality: 'min7', displayRoman: 'vi7' },
      { rootOffset: 0, quality: 'maj7', displayRoman: 'Imaj7' }
    ]
  },

  // --- Dark & Industrial ---
  {
    id: 'dk-phrygian-dominance',
    name: 'Phrygian Cyber Dominance',
    genre: 'Dark & Industrial',
    mood: 'Menacing, aggressive, biomechanical, dark techno',
    description: 'Half-step minor tensions providing an ominous, predatory sonic assault.',
    scaleType: 'minor',
    defaultKey: 'E',
    chords: [
      { rootOffset: 0, quality: 'min', displayRoman: 'i' },
      { rootOffset: 1, quality: 'maj', displayRoman: 'bII' },
      { rootOffset: 10, quality: 'min', displayRoman: 'bvii' },
      { rootOffset: 0, quality: 'p5', displayRoman: 'i5' }
    ]
  },
  {
    id: 'dk-andalusian-tragedy',
    name: 'Andalusian Gothic Descent',
    genre: 'Dark & Industrial',
    mood: 'Tragic, ancient, gothic, relentless',
    description: 'Flamenco and dark synth descending stepwise cadence ending on major V resolution.',
    scaleType: 'minor',
    defaultKey: 'A',
    chords: [
      { rootOffset: 0, quality: 'min', displayRoman: 'i' },
      { rootOffset: 10, quality: 'maj', displayRoman: 'VII' },
      { rootOffset: 8, quality: 'maj', displayRoman: 'VI' },
      { rootOffset: 7, quality: 'maj', displayRoman: 'V' }
    ]
  },
  {
    id: 'dk-industrial-dissonance',
    name: 'Tritone Dissonance',
    genre: 'Dark & Industrial',
    mood: 'Heavy, jarring, raw cyberpunk grit',
    description: 'Flirts with the devil in music (diminished 5th tritone) for harsh mechanical friction.',
    scaleType: 'minor',
    defaultKey: 'D',
    chords: [
      { rootOffset: 0, quality: 'p5', displayRoman: 'i5' },
      { rootOffset: 6, quality: 'dim', displayRoman: 'bVdim' },
      { rootOffset: 5, quality: 'min', displayRoman: 'iv' },
      { rootOffset: 1, quality: 'p5', displayRoman: 'bII5' }
    ]
  },
  // --- Witch House ---
  {
    id: 'wh-occult-requiem',
    name: 'Occult Ritual Requiem †‡†',
    genre: 'Witch House',
    mood: 'Haunted, dragging, gothic ritual, nocturnal',
    description: 'The definitive dark Salem/White Ring minor cadence with suspended minor tensions and deep sub harmony.',
    scaleType: 'minor',
    defaultKey: 'C',
    chords: [
      { rootOffset: 0, quality: 'min', displayRoman: 'i' },
      { rootOffset: 8, quality: 'maj', displayRoman: 'VI' },
      { rootOffset: 5, quality: 'min', displayRoman: 'iv' },
      { rootOffset: 7, quality: 'maj', displayRoman: 'V' }
    ]
  },
  {
    id: 'wh-salem-phrygian',
    name: 'Salem Crypt Phrygian †',
    genre: 'Witch House',
    mood: 'Hypnotic, slow chopped & screwed, sinister',
    description: 'Relentless half-step Phrygian tension designed for dragging 808 subs and detuned supersaw leads.',
    scaleType: 'minor',
    defaultKey: 'D',
    chords: [
      { rootOffset: 0, quality: 'min', displayRoman: 'i' },
      { rootOffset: 1, quality: 'maj', displayRoman: 'bII' },
      { rootOffset: 5, quality: 'min', displayRoman: 'iv' },
      { rootOffset: 0, quality: 'min', displayRoman: 'i' }
    ]
  },
  {
    id: 'wh-ethereal-voices',
    name: 'Ethereal Ghost Choir',
    genre: 'Witch House',
    mood: 'Dreamy, melancholic, reverb-drenched, gothic',
    description: 'Cascading minor seventh and major seventh textures echoing through cold cathedral reverbs.',
    scaleType: 'minor',
    defaultKey: 'A',
    chords: [
      { rootOffset: 0, quality: 'min7', displayRoman: 'i7' },
      { rootOffset: 8, quality: 'maj7', displayRoman: 'VImaj7' },
      { rootOffset: 3, quality: 'maj', displayRoman: 'III' },
      { rootOffset: 10, quality: 'maj', displayRoman: 'VII' }
    ]
  },
  {
    id: 'wh-resurrection-hex',
    name: 'Resurrection Hex †‡†',
    genre: 'Witch House',
    mood: 'Crushing, dragging sub-bass, tritone gravity',
    description: 'Ominous chromatic descent passing through a diminished fifth before resolving to the dark root.',
    scaleType: 'minor',
    defaultKey: 'F',
    chords: [
      { rootOffset: 0, quality: 'min', displayRoman: 'i' },
      { rootOffset: 8, quality: 'maj', displayRoman: 'bVI' },
      { rootOffset: 6, quality: 'dim', displayRoman: 'bVdim' },
      { rootOffset: 7, quality: 'min', displayRoman: 'v' }
    ]
  }
];

// --- Pitch Calculation & Voicing Utilities ---

export function getAbsoluteNoteName(keyRoot: string, semitonesFromRoot: number): string {
  const rootIndex = NOTE_NAMES.indexOf(keyRoot);
  if (rootIndex === -1) return keyRoot;
  const targetIndex = (rootIndex + semitonesFromRoot + 1200) % 12;
  return NOTE_NAMES[targetIndex];
}

export function formatChordName(keyRoot: string, step: ChordStep): string {
  const chordRootName = getAbsoluteNoteName(keyRoot, step.rootOffset);
  const typeDef = CHORD_TYPES[step.quality] || CHORD_TYPES.maj;
  return `${chordRootName}${typeDef.short}${step.labelSuffix || ''}`;
}

export function calculateChordPitches(
  keyRoot: string,
  step: ChordStep,
  baseOctave: number = 3,
  voicing: VoicingStyle = 'root'
): string[] {
  const rootIndex = NOTE_NAMES.indexOf(keyRoot);
  if (rootIndex === -1) return [];

  const chordRootSemis = (rootIndex + step.rootOffset) % 12;
  const chordRootName = NOTE_NAMES[chordRootSemis];
  const typeDef = CHORD_TYPES[step.quality] || CHORD_TYPES.maj;
  const intervals = typeDef.intervals;

  // Base raw note pitches (semitones from C0)
  // Standard MIDI: C4 = 60
  // Let's compute absolute semitone values
  const baseRootPitchVal = baseOctave * 12 + chordRootSemis;
  let rawPitches: number[] = intervals.map(int => baseRootPitchVal + int);

  // Apply Voicings
  if (voicing === 'inv1' && rawPitches.length >= 3) {
    // 1st inversion: move root up an octave
    rawPitches = [...rawPitches.slice(1), rawPitches[0] + 12];
  } else if (voicing === 'inv2' && rawPitches.length >= 3) {
    // 2nd inversion: move 1st and 2nd notes up or 5th down
    rawPitches = [...rawPitches.slice(2), rawPitches[0] + 12, rawPitches[1] + 12];
  } else if (voicing === 'drop2' && rawPitches.length >= 4) {
    // Drop 2: Drop second highest note down by 1 octave
    const sorted = [...rawPitches].sort((a, b) => a - b);
    const dropIndex = sorted.length - 2;
    sorted[dropIndex] -= 12;
    rawPitches = sorted.sort((a, b) => a - b);
  } else if (voicing === 'spread') {
    // Wide Spread: Bass root down 12 semitones, 5th in middle, 3rd and 7th on top
    const bassNote = baseRootPitchVal - 12;
    const upperPitches = rawPitches.filter(p => p !== baseRootPitchVal);
    rawPitches = [bassNote, ...upperPitches];
  } else if (voicing === 'octave_bass') {
    // Double bass root down 12 or 24 semitones
    const subBass = baseRootPitchVal - 12;
    rawPitches = [subBass, ...rawPitches];
  }

  // Convert semitone numbers to pitch strings (e.g. "C4")
  const resultPitches: string[] = [];
  rawPitches.forEach(semis => {
    const oct = Math.floor(semis / 12);
    const note = NOTE_NAMES[semis % 12];
    const pitchStr = `${note}${oct}`;
    if (PITCH_TO_FREQ[pitchStr]) {
      resultPitches.push(pitchStr);
    }
  });

  // Remove duplicates and return sorted
  return Array.from(new Set(resultPitches)).sort((a, b) => {
    return (PITCH_TO_FREQ[a] || 0) - (PITCH_TO_FREQ[b] || 0);
  });
}

// Generate MIDI notes array from chord progression template
export function generateMidiNotesForProgression(
  template: ChordProgressionTemplate,
  keyRoot: string = 'C',
  baseOctave: number = 3,
  voicing: VoicingStyle = 'root',
  rhythm: RhythmPattern = 'sustained',
  destination: DestinationBar = 'full',
  trackId: string = 'track-synth'
): MidiNote[] {
  const chords = template.chords;
  if (!chords || chords.length === 0) return [];

  let startStep = 0;
  let totalSteps = 32;

  if (destination === 'bar1') {
    startStep = 0;
    totalSteps = 16;
  } else if (destination === 'bar2') {
    startStep = 16;
    totalSteps = 16;
  }

  const chordDurationSteps = Math.floor(totalSteps / chords.length);
  const notes: MidiNote[] = [];

  chords.forEach((chordStep, chordIdx) => {
    const chordStartStep = startStep + (chordIdx * chordDurationSteps);
    const chordPitches = calculateChordPitches(keyRoot, chordStep, baseOctave, voicing);

    if (chordPitches.length === 0) return;

    if (rhythm === 'sustained') {
      // Sustained full chord block (e.g. 8 steps long with 1-step breath)
      const duration = Math.max(1, chordDurationSteps - 1);
      chordPitches.forEach((pitch, pIdx) => {
        notes.push({
          id: `${trackId}-chord-${chordIdx}-${pIdx}-${chordStartStep}`,
          pitch,
          step: chordStartStep,
          duration
        });
      });
    } else if (rhythm === 'stabs') {
      // Punchy 16th stabs: beat 1 (step 0), beat 2.5 (step 3), beat 4 (step 6)
      const stabOffsets = [0, 3, 6].filter(off => off < chordDurationSteps);
      stabOffsets.forEach((off) => {
        const step = chordStartStep + off;
        chordPitches.forEach((pitch, pIdx) => {
          notes.push({
            id: `${trackId}-stab-${chordIdx}-${off}-${pIdx}-${step}`,
            pitch,
            step,
            duration: 1
          });
        });
      });
    } else if (rhythm === 'pumping') {
      // 4-on-the-floor pumping chords: on every 4th step with duration 2
      for (let offset = 0; offset < chordDurationSteps; offset += 4) {
        const step = chordStartStep + offset;
        chordPitches.forEach((pitch, pIdx) => {
          notes.push({
            id: `${trackId}-pump-${chordIdx}-${offset}-${pIdx}-${step}`,
            pitch,
            step,
            duration: 2
          });
        });
      }
    } else if (rhythm === 'arp_up') {
      // 16th rolling upward arpeggio
      for (let stepOff = 0; stepOff < chordDurationSteps; stepOff += 2) {
        const p = chordPitches[(stepOff / 2) % chordPitches.length];
        notes.push({
          id: `${trackId}-arp-${chordIdx}-${stepOff}-${p}`,
          pitch: p,
          step: chordStartStep + stepOff,
          duration: 2
        });
      }
    } else if (rhythm === 'arp_down') {
      // 16th rolling downward arpeggio
      const reversed = [...chordPitches].reverse();
      for (let stepOff = 0; stepOff < chordDurationSteps; stepOff += 2) {
        const p = reversed[(stepOff / 2) % reversed.length];
        notes.push({
          id: `${trackId}-arpdn-${chordIdx}-${stepOff}-${p}`,
          pitch: p,
          step: chordStartStep + stepOff,
          duration: 2
        });
      }
    } else if (rhythm === 'strum') {
      // Micro-strummed staggered notes
      chordPitches.forEach((pitch, pIdx) => {
        // slight staggered step or duration
        const stepOffset = Math.min(chordDurationSteps - 2, Math.floor(pIdx * 0.5));
        notes.push({
          id: `${trackId}-strum-${chordIdx}-${pIdx}-${chordStartStep}`,
          pitch,
          step: chordStartStep + stepOffset,
          duration: Math.max(1, chordDurationSteps - stepOffset - 1)
        });
      });
    }
  });

  return notes;
}

// Generate single chord MIDI notes for stamping at a specific step
export function generateSingleChordNotes(
  rootNote: string,
  chordTypeId: string,
  octave: number,
  targetStep: number,
  duration: number,
  voicing: VoicingStyle = 'root',
  trackId: string = 'track-synth'
): MidiNote[] {
  const chordStep: ChordStep = {
    rootOffset: 0,
    quality: chordTypeId,
    displayRoman: 'Chord'
  };

  const pitches = calculateChordPitches(rootNote, chordStep, octave, voicing);
  return pitches.map((pitch, idx) => ({
    id: `${trackId}-single-${rootNote}-${chordTypeId}-${targetStep}-${idx}-${Date.now()}`,
    pitch,
    step: targetStep,
    duration
  }));
}
