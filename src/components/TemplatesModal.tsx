import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Save, Trash2, Download, Upload, Plus, FileCode, Music, Clock, Sliders, Layers, Info, Sparkles, Search, Tag, Filter
} from 'lucide-react';
import { Track, PresetTemplate, DrumTrackState, MidiNote } from '../types';
import { systemTemplates, TEMPLATE_CATEGORIES, TemplateCategory } from '../data/systemTemplates';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBpm: number;
  currentTracks: Track[];
  currentEq: { bass: number; mid: number; treble: number };
  onLoadTemplate: (template: PresetTemplate) => void;
  showNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  currentBpm,
  currentTracks,
  currentEq,
  onLoadTemplate,
  showNotification
}) => {
  const [customTemplates, setCustomTemplates] = useState<PresetTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [newTemplateDesc, setNewTemplateDesc] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('All');

  // Filtered system templates based on category and search query
  const filteredSystemTemplates = useMemo(() => {
    return systemTemplates.filter(template => {
      const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        template.name.toLowerCase().includes(q) ||
        (template.description && template.description.toLowerCase().includes(q)) ||
        (template.genre && template.genre.toLowerCase().includes(q)) ||
        template.bpm.toString().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  // Filtered custom templates based on search query
  const filteredCustomTemplates = useMemo(() => {
    return customTemplates.filter(template => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        template.name.toLowerCase().includes(q) ||
        (template.description && template.description.toLowerCase().includes(q)) ||
        template.bpm.toString().includes(q)
      );
    });
  }, [customTemplates, searchQuery]);

  // Load custom templates on open
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('lyria_custom_templates');
      if (stored) {
        try {
          setCustomTemplates(JSON.parse(stored));
        } catch (e) {
          console.error("Error reading templates from localStorage", e);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Save the current config as a custom named template
  const handleSaveCurrent = () => {
    if (!newTemplateName.trim()) {
      showNotification("Please enter a name for your template preset.", "error");
      return;
    }

    const newTemplate: PresetTemplate = {
      id: 'template-' + Date.now(),
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || 'Custom user configuration template',
      createdAt: new Date().toLocaleString(),
      bpm: currentBpm,
      tracks: JSON.parse(JSON.stringify(currentTracks)), // Deep clone to isolate state
      eq: { ...currentEq }
    };

    const updatedList = [newTemplate, ...customTemplates];
    setCustomTemplates(updatedList);
    localStorage.setItem('lyria_custom_templates', JSON.stringify(updatedList));
    
    setNewTemplateName('');
    setNewTemplateDesc('');
    showNotification(`Template "${newTemplate.name}" saved successfully!`, "success");
  };

  // Delete user saved template
  const handleDeleteTemplate = (id: string, name: string) => {
    const updatedList = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updatedList);
    localStorage.setItem('lyria_custom_templates', JSON.stringify(updatedList));
    showNotification(`Template "${name}" deleted.`, "info");
  };

  // Export specific template as `.json` file (Named Preset File)
  const handleExportTemplateFile = (template: PresetTemplate) => {
    try {
      const exportData = {
        name: "Lyria Preset Template",
        version: "1.0",
        template: {
          id: template.id,
          name: template.name,
          description: template.description || '',
          createdAt: template.createdAt,
          bpm: template.bpm,
          tracks: template.tracks,
          eq: template.eq
        }
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const sanitizedName = template.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const filename = `${sanitizedName}-preset.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification(`Exported template "${template.name}" as JSON preset file!`, "success");
    } catch (e) {
      console.error("Export template failed", e);
      showNotification("Failed to export template file.", "error");
    }
  };

  // Import template from an uploaded `.json` file
  const handleImportTemplateFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        let templateData: PresetTemplate;

        // Check if the file is a project export or direct template export
        if (parsed.template && typeof parsed.template === 'object') {
          // Dedicated template export structure
          const t = parsed.template;
          templateData = {
            id: 'template-imported-' + Date.now(),
            name: t.name || 'Imported Template',
            description: t.description || 'Imported via preset file',
            createdAt: new Date().toLocaleString(),
            bpm: typeof t.bpm === 'number' ? t.bpm : 120,
            tracks: Array.isArray(t.tracks) ? t.tracks : [],
            eq: t.eq || { bass: 0, mid: 0, treble: 0 }
          };
        } else if (parsed.name === "Lyria Studio Project" || parsed.tracks) {
          // Standard project export structure can also be imported as a template!
          templateData = {
            id: 'template-imported-' + Date.now(),
            name: parsed.title || file.name.replace('.json', ''),
            description: 'Imported from Lyria project export',
            createdAt: new Date().toLocaleString(),
            bpm: typeof parsed.bpm === 'number' ? parsed.bpm : 120,
            tracks: Array.isArray(parsed.tracks) ? parsed.tracks : [],
            eq: parsed.eq || { bass: 0, mid: 0, treble: 0 }
          };
        } else {
          throw new Error("Invalid template file format.");
        }

        if (templateData.tracks.length === 0) {
          throw new Error("Template does not contain any tracks.");
        }

        const updatedList = [templateData, ...customTemplates];
        setCustomTemplates(updatedList);
        localStorage.setItem('lyria_custom_templates', JSON.stringify(updatedList));

        showNotification(`Preset template "${templateData.name}" imported and added to your presets list!`, "success");
      } catch (err: any) {
        console.error("Error importing template file:", err);
        showNotification(err.message || "Failed to parse template file. Make sure it is a valid Lyria JSON preset.", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-[#0c0c0e]/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[#141417] border-2 border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-[#0c0c0e]/90 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#d946ef]/10 border border-[#d946ef]/30 flex items-center justify-center text-[#d946ef]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider font-syne uppercase">
                Lyria Studio Templates & Presets
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tight mt-0.5">
                Save, load, and share your favorite track setups, synth voices, and drum steps
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Save Current Config */}
          <div className="lg:col-span-1 bg-[#0c0c0e]/40 p-4 rounded-xl border border-zinc-800/80 flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2 mb-3">
                <Save className="w-3.5 h-3.5 text-[#d946ef]" />
                Save Current Track Config
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono leading-relaxed uppercase">
                Capture all drum patterns, polyphonic synthesizer parameters, master equalizer gains, and current BPM.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-zinc-400 font-bold uppercase font-mono tracking-wider">
                  Preset Name <span className="text-[#d946ef] font-sans">*</span>
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. Deep House Groove, Space Synth..."
                  className="bg-[#0c0c0e] border border-zinc-800 focus:border-[#d946ef] text-[11px] text-white px-3 py-2 rounded-lg focus:outline-none transition-all font-mono"
                  maxLength={40}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-zinc-400 font-bold uppercase font-mono tracking-wider">
                  Description / Notes (Optional)
                </label>
                <textarea
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  placeholder="Describe your synth patch settings or track details..."
                  className="bg-[#0c0c0e] border border-zinc-800 focus:border-[#d946ef] text-[11px] text-white px-3 py-2 rounded-lg focus:outline-none transition-all h-20 resize-none font-mono"
                  maxLength={150}
                />
              </div>

              <button
                onClick={handleSaveCurrent}
                className="w-full mt-2 py-2 px-4 bg-[#d946ef] hover:bg-[#d946ef]/90 text-[#0c0c0e] font-mono text-[10px] font-extrabold uppercase rounded-lg tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Presets List
              </button>
            </div>

            <div className="mt-auto border-t border-zinc-850 pt-3.5">
              <div className="bg-[#d946ef]/5 border border-[#d946ef]/15 rounded-lg p-2.5 flex gap-2">
                <Sparkles className="w-4 h-4 text-[#d946ef] shrink-0" />
                <p className="text-[9px] text-zinc-400 font-mono leading-relaxed uppercase">
                  You can also import previously saved preset files to load them back on any device! Use the import button in the templates panel.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: Template List */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            
            {/* List Tools & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-800">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 15+ presets by genre, BPM, name..."
                  className="w-full pl-8 pr-7 py-1.5 bg-[#0c0c0e] border border-zinc-800 focus:border-[#d946ef] text-[11px] text-white rounded-lg focus:outline-none transition-all font-mono placeholder:text-zinc-600"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {/* External file import trigger */}
              <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[10px] font-mono font-bold rounded-lg cursor-pointer uppercase transition-all shrink-0">
                <Upload className="w-3.5 h-3.5 text-[#d946ef]" />
                <span>Import Preset</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportTemplateFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
                <Filter className="w-2.5 h-2.5" />
                Genre:
              </span>
              {TEMPLATE_CATEGORIES.map((cat) => {
                const count = cat === 'All' 
                  ? systemTemplates.length 
                  : systemTemplates.filter(t => t.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#d946ef] text-black shadow-sm font-black'
                        : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[8px] px-1 py-0.2 rounded ${
                      isSelected ? 'bg-black/25 text-black' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Templates List */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 max-h-[58vh]">
              
              {/* User Saved Templates */}
              {filteredCustomTemplates.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-zinc-400 font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                      <Save className="w-2.5 h-2.5 text-[#d946ef]" />
                      Your Custom Saved Presets ({filteredCustomTemplates.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredCustomTemplates.map((template) => (
                      <div 
                        key={template.id} 
                        className="bg-[#0c0c0e]/50 border border-zinc-800/90 rounded-xl p-3.5 flex flex-col justify-between hover:border-[#d946ef]/50 transition-all group relative"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-white font-mono tracking-wide truncate pr-2 uppercase">
                              {template.name}
                            </span>
                            <span className="text-[8px] bg-[#d946ef]/15 text-[#d946ef] border border-[#d946ef]/30 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                              CUSTOM
                            </span>
                          </div>
                          
                          <p className="text-[9px] text-zinc-500 font-mono leading-relaxed min-h-[24px] uppercase mb-2 line-clamp-2">
                            {template.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] text-zinc-400 font-mono uppercase pb-2.5 border-b border-zinc-850">
                            <span className="flex items-center gap-0.5 text-pink-400 font-bold">
                              <Clock className="w-3 h-3 text-pink-500" />
                              {template.bpm} BPM
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Sliders className="w-3 h-3 text-purple-400" />
                              {template.tracks.length} Channels
                            </span>
                            {template.eq && (
                              <>
                                <span>•</span>
                                <span className="text-[8px] text-zinc-500">
                                  EQ {template.eq.bass >= 0 ? `+${template.eq.bass}` : template.eq.bass}dB
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-3">
                          <button
                            onClick={() => {
                              onLoadTemplate(template);
                              onClose();
                            }}
                            className="flex-1 py-1.5 px-3 bg-zinc-900 hover:bg-[#d946ef] hover:text-black text-white hover:border-transparent font-mono text-[9px] font-bold border border-zinc-800 rounded-lg uppercase transition-all cursor-pointer"
                          >
                            Load Preset
                          </button>
                          
                          <button
                            onClick={() => handleExportTemplateFile(template)}
                            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Export this preset template as a named JSON file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteTemplate(template.id, template.name)}
                            className="p-1.5 text-red-500 hover:text-red-400 bg-zinc-900 border border-zinc-800 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Delete template from list"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Built-in System Templates */}
              {filteredSystemTemplates.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-zinc-400 font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5 text-[#d946ef]" />
                      Built-In Studio Templates ({filteredSystemTemplates.length}{filteredSystemTemplates.length !== systemTemplates.length ? ` of ${systemTemplates.length}` : ''})
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredSystemTemplates.map((template) => (
                      <div 
                        key={template.id} 
                        className="bg-[#0c0c0e]/40 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-zinc-700 hover:bg-[#0c0c0e]/70 transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-zinc-200 font-mono tracking-wide truncate uppercase">
                              {template.name}
                            </span>
                            {template.genre ? (
                              <span className="text-[8px] bg-[#d946ef]/15 text-[#d946ef] border border-[#d946ef]/30 px-1.5 py-0.5 rounded font-mono font-extrabold uppercase shrink-0">
                                {template.genre}
                              </span>
                            ) : (
                              <span className="text-[8px] bg-[#d946ef] text-black px-1.5 py-0.5 rounded font-mono font-extrabold uppercase shrink-0">
                                STUDIO
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[9px] text-zinc-400 font-mono leading-relaxed min-h-[30px] uppercase mb-2.5 line-clamp-2">
                            {template.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-zinc-400 font-mono uppercase pb-2.5 border-b border-zinc-850/60">
                            <span className="flex items-center gap-0.5 text-pink-400 font-bold">
                              <Clock className="w-3 h-3 text-pink-500" />
                              {template.bpm} BPM
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Sliders className="w-3 h-3 text-purple-400" />
                              {template.tracks.length} Tracks
                            </span>
                            {template.eq && (
                              <>
                                <span>•</span>
                                <span className="text-[8px] text-zinc-500">
                                  B:{template.eq.bass >= 0 ? `+${template.eq.bass}` : template.eq.bass} M:{template.eq.mid >= 0 ? `+${template.eq.mid}` : template.eq.mid} T:{template.eq.treble >= 0 ? `+${template.eq.treble}` : template.eq.treble}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-3">
                          <button
                            onClick={() => {
                              onLoadTemplate(template);
                              onClose();
                            }}
                            className="flex-1 py-1.5 px-3 bg-[#d946ef] hover:bg-[#d946ef]/90 text-black font-mono text-[9px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:shadow"
                          >
                            Load Template
                          </button>
                          
                          <button
                            onClick={() => handleExportTemplateFile(template)}
                            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Export system preset as JSON file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state when filters return no results */}
              {filteredCustomTemplates.length === 0 && filteredSystemTemplates.length === 0 && (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center gap-3 bg-[#0c0c0e]/30 border border-dashed border-zinc-800 rounded-xl">
                  <Music className="w-8 h-8 text-zinc-600" />
                  <div>
                    <p className="text-xs text-zinc-300 font-mono font-bold uppercase">No Presets Found</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase">
                      No presets matched "{searchQuery}" in category "{selectedCategory}".
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear Search & Reset Filters
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#0c0c0e]/90 px-6 py-3 border-t border-zinc-800 flex items-center justify-between text-[9px] text-zinc-500 font-mono uppercase">
          <span>Preset compatibility: Lyria Engine v2.0+</span>
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            Named presets save to browser storage instantly
          </span>
        </div>

      </div>
    </div>
  );
};
