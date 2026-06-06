import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  ShieldAlert, 
  Stethoscope, 
  ArrowRight, 
  Info,
  RefreshCw,
  Plus,
  X
} from 'lucide-react';
import LoadingSkeleton from './LoadingSkeleton';

interface Prediction {
  name: string;
  probability: number;
  recommendations: string[];
}

interface PredictionResponse {
  predictions: Prediction[];
  seeDoctorImmediately: boolean;
}

export default function DiseasePredictor() {
  // Configured list of active symptoms mapped to model keys
  const symptomSchema = [
    { key: 'fever', label: 'Fever', category: 'General' },
    { key: 'cough', label: 'Dry Cough', category: 'Respiratory' },
    { key: 'fatigue', label: 'Fatigue', category: 'General' },
    { key: 'headache', label: 'Headache', category: 'Neurological' },
    { key: 'nausea', label: 'Nausea', category: 'Gastrointestinal' },
    { key: 'chest_pain', label: 'Chest Pain', category: 'Cardiovascular' },
    { key: 'shortness_of_breath', label: 'Shortness of Breath', category: 'Respiratory' },
    { key: 'body_ache', label: 'Body Aches', category: 'Musculoskeletal' }
  ];

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Toggle selection
  const handleToggleSymptom = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  // Run matching server inference prediction
  const handleAnalyzeHealth = async () => {
    if (selectedKeys.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build request body matching server keys set to 1
      const requestPayload: Record<string, number> = {};
      symptomSchema.forEach(sym => {
        requestPayload[sym.key] = selectedKeys.includes(sym.key) ? 1 : 0;
      });

      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error('Network response returned an execution anomaly');
      }

      const data: PredictionResponse = await response.json();
      setResults(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to reach standard diagnosis vectors. Please verify connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter schemas
  const filteredSymptoms = symptomSchema.filter((sym) =>
    sym.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedKeys.includes(sym.key)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-medium text-slate-100 tracking-tight flex items-center gap-2">
          <Activity className="h-7 w-7 text-[#14B8A6]" /> AI Disease Predictor
        </h1>
        <p className="text-slate-400 mt-1">
          Inoculate symptoms into our secure clinical machine model to classify co-accuracies against common clinical syndromes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Selector and Inputs */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 space-y-6">
          <div className="space-y-3">
            <h2 className="text-xl font-display font-medium text-slate-200">Select Active Symptoms</h2>
            <p className="text-xs text-slate-400">
              Type or select symptoms below. Emergency indicators such as <span className="text-rose-400 font-semibold">Chest Pain</span> or <span className="text-rose-400 font-semibold">Shortness of Breath</span> will trigger immediate emergency notices.
            </p>
          </div>

          {/* Autocomplete Input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search symptoms (e.g. Fever, Cough, Headache)..."
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full bg-[#042F2E]/60 border border-[#145e5c]/40 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-teal-400/50 focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]/30 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-350"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Dropdown overlay */}
            {isDropdownOpen && searchQuery && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-[#0F3D3C] border border-[#145e5c] rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                {filteredSymptoms.length > 0 ? (
                  filteredSymptoms.map((sym) => (
                    <button
                      key={sym.key}
                      onClick={() => {
                        handleToggleSymptom(sym.key);
                        setSearchQuery('');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#124d4c] text-teal-200 hover:text-[#14B8A6] text-xs font-mono flex items-center justify-between cursor-pointer border-b border-[#042F2E]/30"
                    >
                      <span className="font-sans text-sm text-slate-200">{sym.label}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/40 uppercase tracking-wider">{sym.category}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-xs text-slate-500 text-center">No unselected indicators matching your search query.</div>
                )}
              </div>
            )}
          </div>

          {/* Quick Select Grid */}
          <div className="space-y-2">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-500 block">Symptom Inventory</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {symptomSchema.map((sym) => {
                const isSelected = selectedKeys.includes(sym.key);
                return (
                  <button
                    key={sym.key}
                    onClick={() => handleToggleSymptom(sym.key)}
                    className={`p-3 rounded-xl border text-left text-xs font-medium cursor-pointer transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-[#14B8A6]/10 border-[#14B8A6]/40 text-[#14B8A6] shadow-md shadow-[#14B8A6]/5'
                        : 'bg-[#042F2E]/60 border-[#145e5c]/40 text-teal-200 hover:border-[#14B8A6] hover:text-white'
                    }`}
                  >
                    <span>{sym.label}</span>
                    {isSelected ? (
                      <CheckCircle className="h-4 w-4 text-[#14B8A6]" />
                    ) : (
                      <Plus className="h-3 w-3 text-teal-550 group-hover:text-teal-350" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Render Active Chips */}
          {selectedKeys.length > 0 ? (
            <div className="p-4 bg-[#042F2E]/60 rounded-xl border border-[#145e5c]/40 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono uppercase tracking-wider text-teal-400">Active Pipeline Parameters ({selectedKeys.length})</span>
                <button 
                  onClick={() => { setSelectedKeys([]); setResults(null); }}
                  className="text-[10px] font-mono text-teal-400/70 hover:text-rose-450 cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedKeys.map((key) => {
                  const label = symptomSchema.find(s => s.key === key)?.label || key;
                  return (
                    <span
                      key={key}
                      onClick={() => handleToggleSymptom(key)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#042F2E] text-rose-400 border border-rose-950/30 hover:bg-rose-950/10 hover:border-rose-800/40 cursor-pointer transition-all"
                    >
                      {label} <X className="h-3 w-3 text-rose-400 group-hover:text-rose-300" />
                    </span>
                  );
                })}
              </div>

              {/* Action Trigger Button */}
              <div className="pt-3 flex justify-end">
                <button
                  onClick={handleAnalyzeHealth}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                      Interpreting diagnostic nodes...
                    </>
                  ) : (
                    <>
                      <Stethoscope className="h-4.5 w-4.5" />
                      Classify Health Risks
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center bg-[#042F2E]/30 rounded-2xl border border-dashed border-[#145e5c]/40">
              <Activity className="h-10 w-10 text-teal-600 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-medium text-slate-400">Parameter list is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Select disease metrics or symptom tokens above to launch diagnostic evaluations.</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-950/10 border border-rose-900/30 rounded-xl text-rose-450 text-xs flex items-center gap-2.5">
              <AlertCircle className="h-4.5 w-4.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Panel: Output & Next Steps */}
        <div className="space-y-6">
          {/* Emergency notices if triggered (chest pain, shortness of breath) */}
          {results?.seeDoctorImmediately && (
            <div className="p-5 bg-gradient-to-br from-rose-950/50 to-red-900/10 border border-rose-500/35 rounded-2xl space-y-3 shadow-xl shadow-rose-950/10 animate-pulse">
              <div className="flex items-center gap-2.5 text-rose-400">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="text-sm font-semibold uppercase tracking-wider font-mono">Immediate Critical Warning</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Critical cardiovascular or respiratory symptom indices identified (e.g. Chest pain / restricted breathing). Please bypass remote diagnostic vectors and seek professional clinician triage or emergency room evaluation immediately.
              </p>
            </div>
          )}

          {/* Prediction Evaluation Card wrapper */}
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-display font-medium text-slate-200">Diagnostics Evaluation</h2>

            {isLoading ? (
              <div className="space-y-4">
                <LoadingSkeleton variant="list" />
              </div>
            ) : results ? (
              <div className="space-y-4">
                {results.predictions.map((pred, i) => (
                  <div key={pred.name} className="p-4 bg-[#042F2E]/60 rounded-xl border border-[#145e5c]/40 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{pred.name}</h4>
                        <span className="text-[10px] font-mono text-teal-400 block">Class Match rank #{i+1}</span>
                      </div>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                        pred.probability > 60 
                          ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' 
                          : 'text-[#14B8A6] bg-[#042F2E]/80 border-[#145e5c]/40'
                      }`}>
                        {pred.probability}% Match
                      </span>
                    </div>

                    {/* Performance visual bar */}
                    <div className="w-full bg-[#042F2E] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          pred.probability > 60 ? 'bg-emerald-400' : 'bg-[#14B8A6]'
                        }`} 
                        style={{ width: `${pred.probability}%` }} 
                      />
                    </div>

                    {/* Recommendations Sub-list */}
                    {pred.recommendations && pred.recommendations.length > 0 && (
                      <div className="pt-2 space-y-1">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-teal-400/80 block">Standard Precautions:</span>
                        <ul className="space-y-1">
                          {pred.recommendations.map((rec, rIdx) => (
                            <li key={rIdx} className="text-[11px] text-teal-100 flex items-start gap-1">
                              <span className="text-[#14B8A6] mt-0.5">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center space-y-3 text-slate-500">
                <CheckCircle className="h-10 w-10 text-slate-700 mx-auto" />
                <p className="text-sm">Risk prediction outputs will build here upon selecting system variables.</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
              <Info className="h-3.5 w-3.5 text-slate-500" />
              <span>Statistical Confidence Level: ISO-900</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
