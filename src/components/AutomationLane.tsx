import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Track, TrackAutomation } from '../types';
import { 
  Sliders, 
  RotateCcw, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Waves, 
  Shuffle, 
  Maximize2, 
  Minimize2, 
  BarChart2, 
  MoveHorizontal,
  Flame,
  Volume2,
  Filter
} from 'lucide-react';

interface AutomationLaneProps {
  track: Track;
  onUpdateAutomation: (trackId: string, automation: TrackAutomation) => void;
  currentStep: number;
  isPlaying: boolean;
}

type InterpolationMode = 'smooth' | 'linear' | 'step' | 'exponential';
type ViewMode = 'graph' | 'bars';

export const AutomationLane: React.FC<AutomationLaneProps> = ({
  track,
  onUpdateAutomation,
  currentStep,
  isPlaying,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [interpolationMode, setInterpolationMode] = useState<InterpolationMode>('smooth');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{ step: number; value: number; x: number; y: number } | null>(null);

  const graphSvgRef = useRef<SVGSVGElement | null>(null);
  const lastDrawnStepRef = useRef<number | null>(null);

  // Initialize or fetch automation state
  const activeParam = track.automation?.activeParam ?? 'none';
  const volumeValues = track.automation?.volume ?? Array(32).fill(track.volume ?? 0.8);
  const panValues = track.automation?.pan ?? Array(32).fill(track.pan ?? 0);
  const cutoffValues = track.automation?.cutoff ?? Array(32).fill(0.4);

  // Get current active array
  const currentArray = useMemo(() => {
    if (activeParam === 'volume') return volumeValues;
    if (activeParam === 'pan') return panValues;
    if (activeParam === 'cutoff') return cutoffValues;
    return Array(32).fill(0);
  }, [activeParam, volumeValues, panValues, cutoffValues]);

  // Color theme mapping based on parameter
  const paramTheme = useMemo(() => {
    if (activeParam === 'volume') {
      return {
        stroke: '#bcff00', // Lime
        fill: 'rgba(188, 255, 0, 0.18)',
        glow: 'rgba(188, 255, 0, 0.4)',
        name: 'Volume',
        unit: '%',
        icon: Volume2
      };
    }
    if (activeParam === 'pan') {
      return {
        stroke: '#38bdf8', // Cyan
        fill: 'rgba(56, 189, 248, 0.18)',
        glow: 'rgba(56, 189, 248, 0.4)',
        name: 'Panning',
        unit: 'Pan',
        icon: MoveHorizontal
      };
    }
    if (activeParam === 'cutoff') {
      return {
        stroke: '#ff00f7', // Electric Magenta
        fill: 'rgba(255, 0, 247, 0.18)',
        glow: 'rgba(255, 0, 247, 0.4)',
        name: 'Cutoff Filter',
        unit: 'Hz',
        icon: Filter
      };
    }
    return {
      stroke: '#a1a1aa',
      fill: 'rgba(161, 161, 170, 0.1)',
      glow: 'rgba(161, 161, 170, 0.2)',
      name: 'Off',
      unit: '',
      icon: Sliders
    };
  }, [activeParam]);

  // Global mouse up to stop drawing
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDrawing(false);
      lastDrawnStepRef.current = null;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleParamChange = (param: 'none' | 'volume' | 'pan' | 'cutoff') => {
    onUpdateAutomation(track.id, {
      activeParam: param,
      volume: volumeValues,
      pan: panValues,
      cutoff: cutoffValues,
    });
  };

  const updateCurrentParamArray = useCallback((newValues: number[]) => {
    if (activeParam === 'volume') {
      onUpdateAutomation(track.id, {
        activeParam,
        volume: newValues,
        pan: panValues,
        cutoff: cutoffValues,
      });
    } else if (activeParam === 'pan') {
      onUpdateAutomation(track.id, {
        activeParam,
        volume: volumeValues,
        pan: newValues,
        cutoff: cutoffValues,
      });
    } else if (activeParam === 'cutoff') {
      onUpdateAutomation(track.id, {
        activeParam,
        volume: volumeValues,
        pan: panValues,
        cutoff: newValues,
      });
    }
  }, [activeParam, onUpdateAutomation, track.id, volumeValues, panValues, cutoffValues]);

  const handleClear = () => {
    let resetArr = Array(32).fill(0.8);
    if (activeParam === 'volume') resetArr = Array(32).fill(track.volume ?? 0.8);
    if (activeParam === 'pan') resetArr = Array(32).fill(track.pan ?? 0);
    if (activeParam === 'cutoff') resetArr = Array(32).fill(0.4);
    updateCurrentParamArray(resetArr);
  };

  // Convert raw normalized 0..1 (or -1..1) to formatted display strings
  const formatParameterValue = (val: number, param: string) => {
    if (param === 'volume') {
      const pct = Math.round(val * 100);
      const db = val <= 0.001 ? '-inf' : (20 * Math.log10(val)).toFixed(1);
      return `${pct}% (${db} dB)`;
    }
    if (param === 'pan') {
      if (Math.abs(val) < 0.02) return 'Center (0.0)';
      return val < 0 ? `L ${Math.abs(Math.round(val * 100))}%` : `R ${Math.round(val * 100)}%`;
    }
    if (param === 'cutoff') {
      const freq = 100 * Math.pow(15000 / 100, Math.max(0, Math.min(1, val)));
      return `${Math.round(freq).toLocaleString()} Hz`;
    }
    return val.toFixed(2);
  };

  // Curve Shape Generators
  const applyPresetShape = (shape: 'sine' | 'rampUp' | 'rampDown' | 'sidechain' | 'triangle' | 'random' | 'smooth' | 'invert' | 'humanize') => {
    if (activeParam === 'none') return;
    const next = [...currentArray];

    if (shape === 'sine') {
      // 2 complete cycles of sine wave across 32 steps
      for (let i = 0; i < 32; i++) {
        const sinVal = (Math.sin((i / 32) * Math.PI * 4) + 1) / 2; // 0..1
        if (activeParam === 'pan') {
          next[i] = Math.round(Math.sin((i / 32) * Math.PI * 4) * 100) / 100;
        } else {
          next[i] = Math.round(sinVal * 100) / 100;
        }
      }
    } else if (shape === 'rampUp') {
      for (let i = 0; i < 32; i++) {
        const factor = i / 31;
        if (activeParam === 'pan') {
          next[i] = Math.round((factor * 2 - 1) * 100) / 100;
        } else {
          next[i] = Math.round(factor * 100) / 100;
        }
      }
    } else if (shape === 'rampDown') {
      for (let i = 0; i < 32; i++) {
        const factor = 1 - (i / 31);
        if (activeParam === 'pan') {
          next[i] = Math.round((factor * 2 - 1) * 100) / 100;
        } else {
          next[i] = Math.round(factor * 100) / 100;
        }
      }
    } else if (shape === 'sidechain') {
      // 4-on-the-floor kick ducking curve (8 steps per beat)
      for (let i = 0; i < 32; i++) {
        const beatStep = i % 8;
        // Duck down on step 0, rise exponentially by step 6-7
        const duck = Math.pow(beatStep / 7, 1.8);
        if (activeParam === 'pan') {
          next[i] = Math.round((duck * 2 - 1) * 100) / 100;
        } else {
          next[i] = Math.max(0.05, Math.min(1, Math.round(duck * 100) / 100));
        }
      }
    } else if (shape === 'triangle') {
      for (let i = 0; i < 32; i++) {
        const factor = i < 16 ? i / 16 : 1 - ((i - 16) / 16);
        if (activeParam === 'pan') {
          next[i] = Math.round((factor * 2 - 1) * 100) / 100;
        } else {
          next[i] = Math.round(factor * 100) / 100;
        }
      }
    } else if (shape === 'random') {
      for (let i = 0; i < 32; i++) {
        const rand = Math.random();
        if (activeParam === 'pan') {
          next[i] = Math.round((rand * 2 - 1) * 100) / 100;
        } else {
          next[i] = Math.round(rand * 100) / 100;
        }
      }
    } else if (shape === 'smooth') {
      // 3-point moving average filter
      for (let i = 0; i < 32; i++) {
        const prev = i > 0 ? currentArray[i - 1] : currentArray[0];
        const curr = currentArray[i];
        const nextVal = i < 31 ? currentArray[i + 1] : currentArray[31];
        next[i] = Math.round(((prev + curr * 2 + nextVal) / 4) * 100) / 100;
      }
    } else if (shape === 'invert') {
      for (let i = 0; i < 32; i++) {
        if (activeParam === 'pan') {
          next[i] = Math.round(-currentArray[i] * 100) / 100;
        } else {
          next[i] = Math.round((1 - currentArray[i]) * 100) / 100;
        }
      }
    } else if (shape === 'humanize') {
      for (let i = 0; i < 32; i++) {
        const drift = (Math.random() - 0.5) * 0.12;
        if (activeParam === 'pan') {
          next[i] = Math.max(-1, Math.min(1, Math.round((currentArray[i] + drift) * 100) / 100));
        } else {
          next[i] = Math.max(0, Math.min(1, Math.round((currentArray[i] + drift) * 100) / 100));
        }
      }
    }

    updateCurrentParamArray(next);
  };

  // Convert step & value to SVG coordinate space
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = isExpanded ? 240 : 130;
  const PADDING_X = 20;
  const PADDING_Y = 16;
  const PLOT_W = SVG_WIDTH - PADDING_X * 2;
  const PLOT_H = SVG_HEIGHT - PADDING_Y * 2;

  const stepToX = (step: number) => {
    return PADDING_X + (step / 31) * PLOT_W;
  };

  const xToStep = (x: number) => {
    const clampedX = Math.max(PADDING_X, Math.min(SVG_WIDTH - PADDING_X, x));
    const factor = (clampedX - PADDING_X) / PLOT_W;
    return Math.round(factor * 31);
  };

  const valueToY = (val: number) => {
    if (activeParam === 'pan') {
      const norm = (val + 1) / 2; // 0..1
      return PADDING_Y + (1 - norm) * PLOT_H;
    }
    const clamped = Math.max(0, Math.min(1, val));
    return PADDING_Y + (1 - clamped) * PLOT_H;
  };

  const yToValue = (y: number) => {
    const clampedY = Math.max(PADDING_Y, Math.min(SVG_HEIGHT - PADDING_Y, y));
    const factor = 1 - (clampedY - PADDING_Y) / PLOT_H;
    if (activeParam === 'pan') {
      return Math.round((factor * 2 - 1) * 100) / 100;
    }
    return Math.round(factor * 100) / 100;
  };

  // Generate SVG Path data depending on interpolation mode
  const { pathD, fillD } = useMemo(() => {
    if (activeParam === 'none' || !currentArray || currentArray.length === 0) {
      return { pathD: '', fillD: '' };
    }

    const points = currentArray.map((val, step) => ({
      x: stepToX(step),
      y: valueToY(val),
      step,
      val,
    }));

    if (interpolationMode === 'step') {
      // Staircase stepped interpolation
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const nextX = points[i + 1].x;
        d += ` H ${nextX} V ${points[i + 1].y}`;
      }

      const zeroY = activeParam === 'pan' ? valueToY(0) : valueToY(0);
      const fill = `${d} V ${zeroY} H ${points[0].x} Z`;
      return { pathD: d, fillD: fill };
    }

    if (interpolationMode === 'linear') {
      // Straight lines connecting points
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
      }
      const zeroY = activeParam === 'pan' ? valueToY(0) : valueToY(0);
      const fill = `${d} V ${zeroY} H ${points[0].x} Z`;
      return { pathD: d, fillD: fill };
    }

    if (interpolationMode === 'exponential') {
      // Exponential curve transitions
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const midX = (p0.x + p1.x) / 2;
        const ctrlY = p0.y > p1.y ? p0.y : p1.y;
        d += ` Q ${midX} ${ctrlY} ${p1.x} ${p1.y}`;
      }
      const zeroY = activeParam === 'pan' ? valueToY(0) : valueToY(0);
      const fill = `${d} V ${zeroY} H ${points[0].x} Z`;
      return { pathD: d, fillD: fill };
    }

    // Default: Catmull-Rom to Cubic Bezier smooth spline curve
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const zeroY = activeParam === 'pan' ? valueToY(0) : valueToY(0);
    const fill = `${d} V ${zeroY} H ${points[0].x} Z`;
    return { pathD: d, fillD: fill };
  }, [currentArray, interpolationMode, activeParam, SVG_HEIGHT]);

  // Handle continuous drawing on SVG canvas
  const handleGraphPointerMove = (e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>, forceDraw = false) => {
    if (!graphSvgRef.current || activeParam === 'none') return;
    const rect = graphSvgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Scale to SVG coordinate system
    const scaleX = SVG_WIDTH / rect.width;
    const scaleY = SVG_HEIGHT / rect.height;
    const svgX = clientX * scaleX;
    const svgY = clientY * scaleY;

    const step = xToStep(svgX);
    const val = yToValue(svgY);

    setHoverInfo({
      step,
      value: val,
      x: svgX,
      y: svgY
    });

    if (isDrawing || forceDraw) {
      const updated = [...currentArray];
      
      // Interpolate between last drawn step to avoid gaps if moving mouse quickly
      if (lastDrawnStepRef.current !== null && Math.abs(lastDrawnStepRef.current - step) > 1) {
        const startStep = Math.min(lastDrawnStepRef.current, step);
        const endStep = Math.max(lastDrawnStepRef.current, step);
        const startVal = updated[lastDrawnStepRef.current];
        const endVal = val;

        for (let s = startStep; s <= endStep; s++) {
          const t = (s - startStep) / (endStep - startStep);
          updated[s] = Math.round((startVal + (endVal - startVal) * t) * 100) / 100;
        }
      } else {
        updated[step] = val;
      }

      lastDrawnStepRef.current = step;
      updateCurrentParamArray(updated);
    }
  };

  const handleGraphPointerDown = (e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
    if (activeParam === 'none') return;
    setIsDrawing(true);
    handleGraphPointerMove(e, true);
  };

  // Step bar fallback handler
  const handleStepBarChange = (stepIdx: number, clientY: number, targetElement: HTMLElement) => {
    const rect = targetElement.getBoundingClientRect();
    const y = clientY - rect.top;
    const factor = Math.max(0, Math.min(1, 1 - y / rect.height));

    const updated = [...currentArray];
    if (activeParam === 'pan') {
      const pVal = factor * 2 - 1;
      updated[stepIdx] = Math.round(pVal * 100) / 100;
    } else {
      updated[stepIdx] = Math.round(factor * 100) / 100;
    }
    updateCurrentParamArray(updated);
  };

  // Calculate current playhead position on curve
  const playheadX = stepToX(currentStep);
  const playheadVal = currentArray[currentStep] ?? (activeParam === 'pan' ? 0 : 0.8);
  const playheadY = valueToY(playheadVal);

  return (
    <div 
      id={`automation-lane-${track.id}`} 
      className="mt-1 flex flex-col border-2 border-ink bg-panel p-3 transition-all gap-2.5 shadow-[3px_3px_0px_#000] select-none"
    >
      {/* Header & Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-2">
        {/* Left: Parameter selection pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono">
            <Sliders className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-black uppercase tracking-wider text-ink font-syne">
              {track.name} Automation
            </span>
          </div>

          <div className="flex items-center gap-1 bg-black p-0.5 border border-ink/40">
            <button
              onClick={() => handleParamChange('none')}
              className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                activeParam === 'none'
                  ? 'bg-zinc-800 text-ink-dim border border-ink/40'
                  : 'text-ink-dim hover:text-ink'
              }`}
            >
              Off
            </button>
            <button
              onClick={() => handleParamChange('volume')}
              className={`px-2.5 py-0.5 text-[9px] font-mono font-black uppercase transition-all cursor-pointer flex items-center gap-1 ${
                activeParam === 'volume'
                  ? 'bg-secondary text-black border border-black shadow-[1px_1px_0px_#000]'
                  : 'text-ink hover:text-secondary'
              }`}
            >
              <Volume2 className="w-2.5 h-2.5" />
              Volume
            </button>
            <button
              onClick={() => handleParamChange('pan')}
              className={`px-2.5 py-0.5 text-[9px] font-mono font-black uppercase transition-all cursor-pointer flex items-center gap-1 ${
                activeParam === 'pan'
                  ? 'bg-[#38bdf8] text-black border border-black shadow-[1px_1px_0px_#000]'
                  : 'text-ink hover:text-[#38bdf8]'
              }`}
            >
              <MoveHorizontal className="w-2.5 h-2.5" />
              Pan
            </button>
            {(track.type === 'synth' || track.type === 'bass') && (
              <button
                onClick={() => handleParamChange('cutoff')}
                className={`px-2.5 py-0.5 text-[9px] font-mono font-black uppercase transition-all cursor-pointer flex items-center gap-1 ${
                  activeParam === 'cutoff'
                    ? 'bg-accent text-black border border-black shadow-[1px_1px_0px_#000]'
                    : 'text-ink hover:text-accent'
                }`}
              >
                <Filter className="w-2.5 h-2.5" />
                Cutoff
              </button>
            )}
          </div>
        </div>

        {/* Right: View & Mode Toggles */}
        {activeParam !== 'none' && (
          <div className="flex items-center gap-2">
            {/* Interpolation Type */}
            {viewMode === 'graph' && (
              <div className="flex items-center gap-1 bg-black p-0.5 border border-ink/40">
                <button
                  onClick={() => setInterpolationMode('smooth')}
                  className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    interpolationMode === 'smooth'
                      ? 'bg-panel text-accent border border-ink shadow-[1px_1px_0px_#000]'
                      : 'text-ink-dim hover:text-ink'
                  }`}
                  title="Smooth Bézier Spline Curve"
                >
                  Spline
                </button>
                <button
                  onClick={() => setInterpolationMode('linear')}
                  className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    interpolationMode === 'linear'
                      ? 'bg-panel text-accent border border-ink shadow-[1px_1px_0px_#000]'
                      : 'text-ink-dim hover:text-ink'
                  }`}
                  title="Linear Straight-line transitions"
                >
                  Linear
                </button>
                <button
                  onClick={() => setInterpolationMode('step')}
                  className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    interpolationMode === 'step'
                      ? 'bg-panel text-accent border border-ink shadow-[1px_1px_0px_#000]'
                      : 'text-ink-dim hover:text-ink'
                  }`}
                  title="Step Ladder / Rhythmic Gated transition"
                >
                  Step
                </button>
                <button
                  onClick={() => setInterpolationMode('exponential')}
                  className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    interpolationMode === 'exponential'
                      ? 'bg-panel text-accent border border-ink shadow-[1px_1px_0px_#000]'
                      : 'text-ink-dim hover:text-ink'
                  }`}
                  title="Exponential Snappy Decay/Swell"
                >
                  Expo
                </button>
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-black p-0.5 border border-ink/40">
              <button
                onClick={() => setViewMode('graph')}
                className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  viewMode === 'graph'
                    ? 'bg-secondary text-black font-black border border-black'
                    : 'text-ink-dim hover:text-ink'
                }`}
                title="Continuous Visual Graph Curve View"
              >
                <Activity className="w-2.5 h-2.5" />
                Graph
              </button>
              <button
                onClick={() => setViewMode('bars')}
                className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  viewMode === 'bars'
                    ? 'bg-secondary text-black font-black border border-black'
                    : 'text-ink-dim hover:text-ink'
                }`}
                title="32 Discrete Step Faders View"
              >
                <BarChart2 className="w-2.5 h-2.5" />
                Steps
              </button>
            </div>

            {/* Expand Height Toggle */}
            <button
              onClick={() => setIsExpanded(prev => !prev)}
              className="p-1 bg-surface-raised border border-ink hover:border-accent text-ink hover:text-accent transition-colors cursor-pointer"
              title={isExpanded ? "Collapse graph height" : "Expand graph height"}
            >
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>

      {/* Main Automation Canvas / Graph Area */}
      {activeParam === 'none' ? (
        <div className="h-16 flex items-center justify-center bg-black border-2 border-ink border-dashed text-[11px] text-ink-dim font-mono select-none">
          <span>Select <strong className="text-secondary">Volume</strong>, <strong className="text-[#38bdf8]">Panning</strong>, or <strong className="text-accent">Cutoff</strong> above to draw dynamic automation curves.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Preset Curve Waveform Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 bg-black p-1.5 border border-ink/40 text-[10px] font-mono">
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              <span className="text-[9px] text-ink-dim uppercase font-bold tracking-wider mr-1">Curves:</span>
              <button
                onClick={() => applyPresetShape('sine')}
                className="flex items-center gap-1 px-2 py-0.5 bg-surface-raised hover:bg-ink hover:text-black text-ink border border-ink/50 text-[9px] font-bold cursor-pointer transition-colors"
                title="Apply 2-cycle Sine LFO wave"
              >
                <Waves className="w-2.5 h-2.5 text-accent" />
                Sine LFO
              </button>
              <button
                onClick={() => applyPresetShape('sidechain')}
                className="flex items-center gap-1 px-2 py-0.5 bg-surface-raised hover:bg-ink hover:text-black text-ink border border-ink/50 text-[9px] font-bold cursor-pointer transition-colors"
                title="Apply 4-on-the-floor kick ducking curve"
              >
                <Zap className="w-2.5 h-2.5 text-secondary" />
                Sidechain Pump
              </button>
              <button
                onClick={() => applyPresetShape('rampUp')}
                className="flex items-center gap-1 px-2 py-0.5 bg-surface-raised hover:bg-ink hover:text-black text-ink border border-ink/50 text-[9px] font-bold cursor-pointer transition-colors"
                title="Linear Ramp Up (0 to 100%)"
              >
                <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                Ramp Up
              </button>
              <button
                onClick={() => applyPresetShape('rampDown')}
                className="flex items-center gap-1 px-2 py-0.5 bg-surface-raised hover:bg-ink hover:text-black text-ink border border-ink/50 text-[9px] font-bold cursor-pointer transition-colors"
                title="Linear Ramp Down (100% to 0)"
              >
                <TrendingDown className="w-2.5 h-2.5 text-rose-400" />
                Ramp Down
              </button>
              <button
                onClick={() => applyPresetShape('triangle')}
                className="flex items-center gap-1 px-2 py-0.5 bg-surface-raised hover:bg-ink hover:text-black text-ink border border-ink/50 text-[9px] font-bold cursor-pointer transition-colors"
                title="Triangle Peak Wave"
              >
                <Flame className="w-2.5 h-2.5 text-amber-400" />
                Triangle
              </button>
              <button
                onClick={() => applyPresetShape('random')}
                className="flex items-center gap-1 px-2 py-0.5 bg-surface-raised hover:bg-ink hover:text-black text-ink border border-ink/50 text-[9px] font-bold cursor-pointer transition-colors"
                title="Random Sample & Hold Glitch"
              >
                <Shuffle className="w-2.5 h-2.5 text-cyan-400" />
                Random S&H
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => applyPresetShape('smooth')}
                className="px-2 py-0.5 bg-surface-raised hover:bg-accent hover:text-black text-ink border border-ink/50 text-[9px] font-bold cursor-pointer transition-colors"
                title="Apply 3-point smoothing filter"
              >
                Smooth
              </button>
              <button
                onClick={() => applyPresetShape('invert')}
                className="px-2 py-0.5 bg-surface-raised hover:bg-accent hover:text-black text-ink border border-ink/50 text-[9px] font-bold cursor-pointer transition-colors"
                title="Invert current curve values"
              >
                Invert
              </button>
              <button
                onClick={() => applyPresetShape('humanize')}
                className="px-2 py-0.5 bg-surface-raised hover:bg-accent hover:text-black text-ink border border-ink/50 text-[9px] font-bold cursor-pointer transition-colors"
                title="Add subtle organic humanize drift"
              >
                Humanize
              </button>
              <button
                onClick={handleClear}
                className="px-2 py-0.5 bg-surface-raised hover:bg-rose-500 hover:text-black text-rose-400 border border-ink/50 text-[9px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                title="Reset curve to flat default"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset
              </button>
            </div>
          </div>

          {/* Interactive Graph Curve Canvas */}
          {viewMode === 'graph' ? (
            <div className="relative bg-black border-2 border-ink overflow-hidden group shadow-inner">
              {/* Background Graph Grid Paper */}
              <svg
                ref={graphSvgRef}
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="w-full cursor-crosshair touch-none select-none"
                style={{ height: isExpanded ? '240px' : '130px' }}
                onPointerDown={handleGraphPointerDown}
                onPointerMove={handleGraphPointerMove}
                onPointerLeave={() => setHoverInfo(null)}
              >
                <defs>
                  <linearGradient id={`grad-${track.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={paramTheme.stroke} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={paramTheme.stroke} stopOpacity="0.02" />
                  </linearGradient>
                  
                  {/* Subtle Grid Hatch pattern */}
                  <pattern id={`grid-pattern-${track.id}`} width="25" height="25" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="25" y2="0" stroke="#1f1f23" strokeWidth="0.5" />
                    <line x1="0" y1="0" x2="0" y2="25" stroke="#1f1f23" strokeWidth="0.5" />
                  </pattern>
                </defs>

                {/* Graph Background Paper */}
                <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#09090b" />
                <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill={`url(#grid-pattern-${track.id})`} />

                {/* 4-Beat Bar Division Vertical Gridlines (Every 8 steps = 1 bar in 32-step grid) */}
                {[0, 8, 16, 24, 31].map((step, idx) => {
                  const x = stepToX(step);
                  return (
                    <g key={step}>
                      <line
                        x1={x}
                        y1={PADDING_Y}
                        x2={x}
                        y2={SVG_HEIGHT - PADDING_Y}
                        stroke={step === 0 || step === 31 ? '#3f3f46' : '#27272a'}
                        strokeWidth={step % 8 === 0 ? 1.5 : 0.75}
                        strokeDasharray={step % 8 === 0 ? '' : '2,2'}
                      />
                      {idx < 4 && (
                        <text
                          x={x + 4}
                          y={PADDING_Y - 4}
                          fill="#71717a"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          BAR {idx + 1}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* 16th Sub-beat subdivision ticks */}
                {Array(32).fill(0).map((_, step) => {
                  if (step % 4 !== 0) return null;
                  const x = stepToX(step);
                  return (
                    <line
                      key={`sub-${step}`}
                      x1={x}
                      y1={SVG_HEIGHT - PADDING_Y}
                      x2={x}
                      y2={SVG_HEIGHT - PADDING_Y + 4}
                      stroke="#52525b"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Horizontal Reference Lines (0%, 50%, 100% or Center line for Pan) */}
                {activeParam === 'pan' ? (
                  <>
                    <line
                      x1={PADDING_X}
                      y1={valueToY(1)}
                      x2={SVG_WIDTH - PADDING_X}
                      y2={valueToY(1)}
                      stroke="#27272a"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    <line
                      x1={PADDING_X}
                      y1={valueToY(0)}
                      x2={SVG_WIDTH - PADDING_X}
                      y2={valueToY(0)}
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      opacity="0.6"
                    />
                    <line
                      x1={PADDING_X}
                      y1={valueToY(-1)}
                      x2={SVG_WIDTH - PADDING_X}
                      y2={valueToY(-1)}
                      stroke="#27272a"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    <text x={PADDING_X + 4} y={valueToY(1) + 10} fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">R 100%</text>
                    <text x={PADDING_X + 4} y={valueToY(0) - 3} fill="#71717a" fontSize="8" fontFamily="monospace" fontWeight="bold">CENTER</text>
                    <text x={PADDING_X + 4} y={valueToY(-1) - 4} fill="#f87171" fontSize="8" fontFamily="monospace" fontWeight="bold">L 100%</text>
                  </>
                ) : (
                  <>
                    <line
                      x1={PADDING_X}
                      y1={valueToY(1)}
                      x2={SVG_WIDTH - PADDING_X}
                      y2={valueToY(1)}
                      stroke="#27272a"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    <line
                      x1={PADDING_X}
                      y1={valueToY(0.5)}
                      x2={SVG_WIDTH - PADDING_X}
                      y2={valueToY(0.5)}
                      stroke="#27272a"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    <line
                      x1={PADDING_X}
                      y1={valueToY(0)}
                      x2={SVG_WIDTH - PADDING_X}
                      y2={valueToY(0)}
                      stroke="#3f3f46"
                      strokeWidth="1"
                    />
                    <text x={PADDING_X + 4} y={valueToY(1) + 10} fill="#a1a1aa" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      {activeParam === 'volume' ? '100% (0 dB)' : '15,000 Hz'}
                    </text>
                    <text x={PADDING_X + 4} y={valueToY(0.5) - 3} fill="#52525b" fontSize="8" fontFamily="monospace">
                      {activeParam === 'volume' ? '50% (-6 dB)' : '1,225 Hz'}
                    </text>
                    <text x={PADDING_X + 4} y={valueToY(0) - 4} fill="#52525b" fontSize="8" fontFamily="monospace">
                      {activeParam === 'volume' ? '0% (-inf)' : '100 Hz'}
                    </text>
                  </>
                )}

                {/* Shaded Area Under Curve */}
                {fillD && (
                  <path
                    d={fillD}
                    fill={`url(#grad-${track.id})`}
                    className="pointer-events-none transition-all duration-75"
                  />
                )}

                {/* Main Automation Curve Stroke */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={paramTheme.stroke}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none transition-all duration-75"
                    style={{
                      filter: `drop-shadow(0 0 6px ${paramTheme.glow})`,
                    }}
                  />
                )}

                {/* 32 Step Control Point Nodes */}
                {currentArray.map((val, step) => {
                  const cx = stepToX(step);
                  const cy = valueToY(val);
                  const isHovered = hoverInfo?.step === step;
                  const isCurrent = isPlaying && currentStep === step;

                  return (
                    <g key={`node-${step}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 5 : isCurrent ? 4.5 : 2.5}
                        fill={isHovered ? '#ffffff' : isCurrent ? '#bcff00' : paramTheme.stroke}
                        stroke="#000000"
                        strokeWidth="1.5"
                        className="transition-all duration-75 pointer-events-none"
                      />
                    </g>
                  );
                })}

                {/* Live Real-time Playhead Vertical Line */}
                {isPlaying && (
                  <g className="pointer-events-none">
                    <line
                      x1={playheadX}
                      y1={PADDING_Y}
                      x2={playheadX}
                      y2={SVG_HEIGHT - PADDING_Y}
                      stroke="#bcff00"
                      strokeWidth="2"
                      strokeDasharray="4,2"
                      className="animate-pulse"
                    />
                    {/* Glowing Follower Dot riding along the curve */}
                    <circle
                      cx={playheadX}
                      cy={playheadY}
                      r="6"
                      fill="#bcff00"
                      stroke="#000000"
                      strokeWidth="2"
                      style={{
                        filter: 'drop-shadow(0 0 8px #bcff00)',
                      }}
                    />
                  </g>
                )}

                {/* Hover Cursor Crosshair Guide */}
                {hoverInfo && !isPlaying && (
                  <g className="pointer-events-none">
                    <line
                      x1={hoverInfo.x}
                      y1={PADDING_Y}
                      x2={hoverInfo.x}
                      y2={SVG_HEIGHT - PADDING_Y}
                      stroke="#71717a"
                      strokeWidth="0.75"
                      strokeDasharray="2,2"
                    />
                    <circle
                      cx={stepToX(hoverInfo.step)}
                      cy={valueToY(currentArray[hoverInfo.step])}
                      r="5"
                      fill="#ffffff"
                      stroke="#000000"
                      strokeWidth="1.5"
                    />
                  </g>
                )}
              </svg>

              {/* Dynamic Status / Coordinate Badge on Hover or Play */}
              <div className="absolute bottom-2 right-2 bg-black/90 border border-ink/80 px-2 py-1 flex items-center gap-2 font-mono text-[10px] text-ink shadow-[2px_2px_0px_#000] pointer-events-none">
                <span className="text-ink-dim uppercase font-bold">
                  {hoverInfo ? `Step ${hoverInfo.step + 1}` : isPlaying ? `Playhead: Step ${currentStep + 1}` : 'Ready to draw'}
                </span>
                <span className="text-accent font-black">
                  {hoverInfo 
                    ? formatParameterValue(currentArray[hoverInfo.step], activeParam)
                    : formatParameterValue(playheadVal, activeParam)}
                </span>
              </div>
            </div>
          ) : (
            /* Fallback 32-Step Vertical Matrix Faders View */
            <div className="grid grid-cols-32 gap-0.5 h-16 bg-black border-2 border-ink p-1 select-none">
              {currentArray.map((val, stepIdx) => {
                const isCurrent = isPlaying && currentStep === stepIdx;
                let heightPercent = val * 100;
                let barStyle: React.CSSProperties = {
                  bottom: 0,
                  height: `${Math.max(4, Math.min(100, heightPercent))}%`,
                  backgroundColor: paramTheme.stroke
                };

                if (activeParam === 'pan') {
                  const pct = Math.abs(val) * 50;
                  if (val >= 0) {
                    barStyle = {
                      bottom: '50%',
                      height: `${pct}%`,
                      backgroundColor: '#38bdf8',
                    };
                  } else {
                    barStyle = {
                      top: '50%',
                      height: `${pct}%`,
                      backgroundColor: '#f87171',
                    };
                  }
                }

                return (
                  <div
                    key={stepIdx}
                    onMouseDown={(e) => {
                      setIsDrawing(true);
                      handleStepBarChange(stepIdx, e.clientY, e.currentTarget);
                    }}
                    onMouseEnter={(e) => {
                      if (isDrawing) handleStepBarChange(stepIdx, e.clientY, e.currentTarget);
                    }}
                    className={`relative h-full bg-surface-raised border border-ink/30 hover:border-accent cursor-ns-resize transition-colors overflow-hidden group ${
                      isCurrent ? 'ring-2 ring-secondary bg-secondary/10' : ''
                    }`}
                    title={`Step ${stepIdx + 1}: ${formatParameterValue(val, activeParam)}`}
                  >
                    {/* Visual Bar filling */}
                    <div
                      className="absolute left-0 right-0 opacity-80 group-hover:opacity-100 pointer-events-none transition-all duration-75"
                      style={barStyle}
                    />

                    {/* Step Marker */}
                    {isCurrent && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-secondary animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Drawing Tip Readout */}
          <div className="flex items-center justify-between text-[9px] text-ink-dim font-mono px-1">
            <span>🖱️ <strong>Click and drag</strong> across the graph to freehand paint automation curves in real-time.</span>
            <span className="text-secondary font-bold font-mono">
              ACTIVE PARAMETER: {paramTheme.name.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
