import React, { useState, useEffect } from 'react';
import { 
  Sliders, X, Trash2, Plus, RefreshCw, Radio, Check, 
  Flame, Target, Zap, Activity, Volume2, ArrowRight, ShieldAlert
} from 'lucide-react';
import { midiService, MidiCcMapping, MidiDevice, MidiEventLog, MidiLearnTarget } from '../services/midiService';

interface MidiMappingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function MidiMappingsModal({ isOpen, onClose, onShowNotification }: MidiMappingsModalProps) {
  const [mappings, setMappings] = useState<MidiCcMapping[]>([]);
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [lastEvent, setLastEvent] = useState<MidiEventLog | null>(null);
  const [isLearnActive, setIsLearnActive] = useState<boolean>(false);
  const [armedTarget, setArmedTarget] = useState<MidiLearnTarget | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<number>(midiService.getSelectedChannel());

  // Form for manually adding a new CC mapping
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newCcNumber, setNewCcNumber] = useState<number>(74);
  const [newTargetType, setNewTargetType] = useState<'synth' | 'track' | 'global'>('synth');
  const [newParamKey, setNewParamKey] = useState<string>('cutoff');
  const [newLabel, setNewLabel] = useState<string>('Filter Cutoff');
  const [newMin, setNewMin] = useState<number>(200);
  const [newMax, setNewMax] = useState<number>(12000);
  const [newIsFloat, setNewIsFloat] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    setMappings(midiService.getCcMappings());
    setDevices(midiService.getDevices());

    const unsubMappings = midiService.onMappingsChange((maps) => {
      setMappings(maps);
    });

    const unsubDevices = midiService.onDevicesChange((devs) => {
      setDevices(devs);
    });

    const unsubEvents = midiService.onEventLog((evt) => {
      setLastEvent(evt);
    });

    const unsubLearn = midiService.onLearnStatusChange((status) => {
      setIsLearnActive(status.isLearning);
      setArmedTarget(status.armedTarget);
    });

    const unsubLearned = midiService.onMappingLearned(({ mapping, ccNumber }) => {
      if (onShowNotification) {
        onShowNotification(`Learned MIDI CC #${ccNumber} ➔ ${mapping.label}`, 'success');
      }
    });

    return () => {
      unsubMappings();
      unsubDevices();
      unsubEvents();
      unsubLearn();
      unsubLearned();
    };
  }, [isOpen, onShowNotification]);

  if (!isOpen) return null;

  const handleToggleGlobalLearn = () => {
    const next = !isLearnActive;
    midiService.setMidiLearnMode(next);
    if (next) {
      onShowNotification?.("MIDI Learn mode active! Click any UI parameter, then turn a physical knob/fader on your MIDI controller.", "info");
    }
  };

  const handleArmMapping = (map: MidiCcMapping) => {
    midiService.armTargetForLearn({
      targetType: map.targetType,
      trackId: map.trackId,
      paramKey: map.paramKey,
      label: map.label,
      min: map.min,
      max: map.max,
      isFloat: map.isFloat,
      inverted: map.inverted
    });
    onShowNotification?.(`Armed "${map.label}". Twist any physical knob/fader to rebind CC #${map.ccNumber}...`, "info");
  };

  const handleDeleteMapping = (id: string, label: string) => {
    midiService.removeMapping(id);
    onShowNotification?.(`Removed mapping for "${label}"`, "info");
  };

  const handleUpdateMappingField = (id: string, field: keyof MidiCcMapping, value: any) => {
    const target = mappings.find(m => m.id === id);
    if (!target) return;
    const updated = { ...target, [field]: value };
    midiService.addOrUpdateMapping(updated);
  };

  const handleResetDefaults = () => {
    midiService.resetDefaultMappings();
    onShowNotification?.("Reset all MIDI CC mappings to factory standard.", "success");
  };

  const handleClearAll = () => {
    midiService.clearAllMappings();
    onShowNotification?.("Cleared all MIDI CC mappings.", "info");
  };

  const handleAddCustomMapping = (e: React.FormEvent) => {
    e.preventDefault();
    const mapping: MidiCcMapping = {
      id: `custom-${newParamKey}-${Date.now()}`,
      ccNumber: newCcNumber,
      channel: 0,
      targetType: newTargetType,
      paramKey: newParamKey,
      label: newLabel || `${newParamKey} (CC ${newCcNumber})`,
      min: Number(newMin),
      max: Number(newMax),
      isFloat: newIsFloat
    };
    midiService.addOrUpdateMapping(mapping);
    setShowAddForm(false);
    onShowNotification?.(`Added mapping: CC #${newCcNumber} ➔ ${mapping.label}`, "success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl bg-zinc-950 border border-[#00F0FF]/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col max-h-[90vh] overflow-hidden text-white font-mono">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00F0FF]/15 border border-[#00F0FF]/40 rounded-lg text-[#00F0FF]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wider flex items-center gap-2">
                <span>MIDI LEARN &amp; HARDWARE CONTROLLER MAPPER</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 font-mono">
                  {mappings.length} ACTIVE BINDINGS
                </span>
              </h2>
              <p className="text-[11px] text-white/50">
                Click any parameter in the UI to arm, then twist/slide your physical MIDI hardware knob to bind instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Global MIDI Learn Toggle Button */}
            <button
              onClick={handleToggleGlobalLearn}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                isLearnActive
                  ? 'bg-[#FF3E82] text-white border-[#FF3E82] shadow-[0_0_15px_rgba(255,62,130,0.6)] animate-pulse'
                  : 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40 hover:bg-[#00F0FF]/25'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>{isLearnActive ? 'LEARN MODE ON (CLICK PARAM)' : 'ENABLE MIDI LEARN'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Controller Activity & Status Bar */}
        <div className="px-6 py-3 bg-black/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Connected Device Info */}
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-[11px]">HARDWARE:</span>
            {devices.length > 0 ? (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[11px] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {devices.map(d => d.name).join(', ')}
              </span>
            ) : (
              <span className="text-amber-400/80 italic text-[11px]">No MIDI hardware detected. Plug in a USB/Bluetooth controller.</span>
            )}
          </div>

          {/* Real-Time Live CC Meter */}
          <div className="flex items-center gap-3 bg-zinc-900 px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-[10px] text-white/50 font-bold uppercase">LIVE INPUT:</span>
            {lastEvent ? (
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-[#00F0FF] font-black">{lastEvent.type.toUpperCase()}</span>
                {lastEvent.type === 'cc' && (
                  <>
                    <span className="text-white/80">CC #{lastEvent.ccNumber}</span>
                    <span className="text-pink-400 font-bold">VAL: {lastEvent.ccValue}</span>
                    {/* Visual Bar */}
                    <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/10">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00F0FF] to-[#FF3E82] transition-all duration-75"
                        style={{ width: `${((lastEvent.ccValue || 0) / 127) * 100}%` }}
                      />
                    </div>
                  </>
                )}
                {lastEvent.type === 'noteon' && (
                  <span className="text-emerald-400 font-bold">NOTE: {lastEvent.note} (VEL: {lastEvent.velocity})</span>
                )}
                {lastEvent.type === 'pitchbend' && (
                  <span className="text-amber-400 font-bold">BEND: {(lastEvent.pitchBend || 0).toFixed(2)}</span>
                )}
              </div>
            ) : (
              <span className="text-white/30 italic text-[11px]">Waiting for controller movement...</span>
            )}
          </div>
        </div>

        {/* Armed Parameter Banner */}
        {armedTarget && (
          <div className="px-6 py-2.5 bg-[#FF3E82]/20 border-b border-[#FF3E82]/40 flex items-center justify-between text-xs text-[#FF3E82] animate-pulse">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#FF3E82]" />
              <span>
                <strong>ARMED FOR LEARNING:</strong> Move any physical knob/fader to map to <strong>"{armedTarget.label}"</strong>
              </span>
            </div>
            <button
              onClick={() => midiService.cancelArmedTarget()}
              className="px-2 py-0.5 bg-black text-white hover:bg-white/20 rounded text-[10px] cursor-pointer"
            >
              Cancel Arm
            </button>
          </div>
        )}

        {/* Mappings Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">Configured Controller Mappings</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddForm(prev => !prev)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] rounded transition-colors cursor-pointer border border-white/10"
              >
                <Plus className="w-3 h-3 text-[#00F0FF]" />
                <span>{showAddForm ? 'Close Add Form' : 'Add Manual Mapping'}</span>
              </button>
              <button
                onClick={handleResetDefaults}
                className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] rounded transition-colors cursor-pointer border border-white/10"
              >
                <RefreshCw className="w-3 h-3 text-amber-400" />
                <span>Reset Factory CCs</span>
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] rounded transition-colors cursor-pointer border border-rose-500/20"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Add Manual Mapping Form */}
          {showAddForm && (
            <form onSubmit={handleAddCustomMapping} className="p-4 bg-zinc-900 border border-[#00F0FF]/30 rounded-xl space-y-3 mb-4">
              <div className="text-xs font-bold text-[#00F0FF] uppercase flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Create Custom MIDI CC Mapping</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">CC NUMBER (0-127)</label>
                  <input
                    type="number"
                    min="0"
                    max="127"
                    value={newCcNumber}
                    onChange={(e) => setNewCcNumber(parseInt(e.target.value) || 0)}
                    className="w-full bg-black border border-white/20 rounded px-2 py-1 text-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">TARGET TYPE</label>
                  <select
                    value={newTargetType}
                    onChange={(e) => setNewTargetType(e.target.value as any)}
                    className="w-full bg-black border border-white/20 rounded px-2 py-1 text-white text-xs"
                  >
                    <option value="synth">Synth Parameter</option>
                    <option value="track">Track Volume/Pan</option>
                    <option value="global">Global (Master/BPM)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">PARAM KEY</label>
                  <input
                    type="text"
                    value={newParamKey}
                    onChange={(e) => setNewParamKey(e.target.value)}
                    placeholder="e.g. cutoff, volume, bpm"
                    className="w-full bg-black border border-white/20 rounded px-2 py-1 text-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">LABEL</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Master Cutoff"
                    className="w-full bg-black border border-white/20 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">MIN VALUE</label>
                  <input
                    type="number"
                    step="any"
                    value={newMin}
                    onChange={(e) => setNewMin(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black border border-white/20 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">MAX VALUE</label>
                  <input
                    type="number"
                    step="any"
                    value={newMax}
                    onChange={(e) => setNewMax(parseFloat(e.target.value) || 1)}
                    className="w-full bg-black border border-white/20 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="isFloatCheck"
                    checked={newIsFloat}
                    onChange={(e) => setNewIsFloat(e.target.checked)}
                    className="rounded accent-[#00F0FF]"
                  />
                  <label htmlFor="isFloatCheck" className="text-[11px] text-white/70">Float / Decimal Precision</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 bg-white/10 text-white text-xs rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#00F0FF] text-black font-bold text-xs rounded cursor-pointer"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          )}

          {/* Table */}
          {mappings.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/50 rounded-xl border border-dashed border-white/10 text-white/40">
              <Radio className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#00F0FF]" />
              <p className="text-sm font-bold">No MIDI CC mappings configured.</p>
              <p className="text-xs text-white/30 mt-1">Click "Reset Factory CCs" or enable MIDI Learn and click any UI slider to bind.</p>
            </div>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-900 border-b border-white/10 text-white/50 text-[10px] uppercase font-bold">
                    <th className="py-2.5 px-4">Hardware CC</th>
                    <th className="py-2.5 px-4">Target Parameter</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Min Value</th>
                    <th className="py-2.5 px-4">Max Value</th>
                    <th className="py-2.5 px-4 text-center">Invert</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {mappings.map((map) => {
                    const isCurrentlyArmed = armedTarget?.paramKey === map.paramKey && armedTarget?.targetType === map.targetType;
                    const isReceivingThisCC = lastEvent?.type === 'cc' && lastEvent?.ccNumber === map.ccNumber;

                    return (
                      <tr 
                        key={map.id} 
                        className={`transition-colors ${
                          isCurrentlyArmed 
                            ? 'bg-[#FF3E82]/15' 
                            : isReceivingThisCC 
                            ? 'bg-[#00F0FF]/10' 
                            : 'hover:bg-white/5'
                        }`}
                      >
                        {/* CC Number */}
                        <td className="py-2.5 px-4 font-bold">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                            isReceivingThisCC
                              ? 'bg-[#00F0FF] text-black border-[#00F0FF] shadow-[0_0_10px_#00F0FF]'
                              : 'bg-zinc-800 text-[#00F0FF] border-zinc-700'
                          }`}>
                            <span>CC #{map.ccNumber}</span>
                            {isReceivingThisCC && <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />}
                          </span>
                        </td>

                        {/* Label */}
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{map.label}</span>
                            <span className="text-[9px] text-white/30 font-mono">({map.paramKey})</span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            map.targetType === 'synth' 
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' 
                              : map.targetType === 'track' 
                              ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' 
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}>
                            {map.targetType}
                          </span>
                        </td>

                        {/* Min Value */}
                        <td className="py-2.5 px-4">
                          <input
                            type="number"
                            step="any"
                            value={map.min}
                            onChange={(e) => handleUpdateMappingField(map.id, 'min', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-black border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-white"
                          />
                        </td>

                        {/* Max Value */}
                        <td className="py-2.5 px-4">
                          <input
                            type="number"
                            step="any"
                            value={map.max}
                            onChange={(e) => handleUpdateMappingField(map.id, 'max', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-black border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-white"
                          />
                        </td>

                        {/* Invert */}
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={map.inverted || false}
                            onChange={(e) => handleUpdateMappingField(map.id, 'inverted', e.target.checked)}
                            className="rounded accent-[#00F0FF] cursor-pointer"
                            title="Invert parameter response curve"
                          />
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleArmMapping(map)}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                isCurrentlyArmed
                                  ? 'bg-[#FF3E82] text-white border-[#FF3E82] animate-pulse'
                                  : 'bg-white/5 hover:bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/30'
                              }`}
                              title="Re-learn this parameter with another hardware knob"
                            >
                              {isCurrentlyArmed ? 'WAITING CC...' : 'RE-LEARN'}
                            </button>
                            <button
                              onClick={() => handleDeleteMapping(map.id, map.label)}
                              className="p-1 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                              title="Delete mapping"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/60 flex items-center justify-between">
          <div className="text-[11px] text-white/40 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Hardware controllers send 7-bit CC (0-127). DEMONSEED scales them dynamically to high-precision DSP values.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => midiService.stopAllVoices()}
              className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              PANIC RESET
            </button>
            <button
              onClick={onClose}
              className="px-5 py-1.5 bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-black font-black rounded-lg text-xs transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              DONE
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
