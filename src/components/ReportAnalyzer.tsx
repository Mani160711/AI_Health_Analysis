import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  FileDown, 
  CheckCircle2, 
  Info,
  Sliders,
  Sparkles,
  BarChart3,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { jsPDF } from 'jspdf';

interface MedicalParameter {
  parameter: string;
  value: string;
  unit: string;
  normal_range: string;
  status: string; // High, Low, Normal
}

interface AnalysisResults {
  parameters: MedicalParameter[];
  summary: string;
}

export default function ReportAnalyzer() {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        uploadAndAnalyze(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        uploadAndAnalyze(file);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'text/plain'];
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isTXT = file.type === 'text/plain' || file.name.endsWith('.txt');
    
    if (!isPDF && !isTXT) {
      setError('Unsupported file format. Please upload a PDF or TXT file.');
      return false;
    }
    
    const maxSize = 12 * 1024 * 1024; // 12MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum supported limit is 12MB.');
      return false;
    }
    
    setError(null);
    return true;
  };

  const uploadAndAnalyze = async (file: File) => {
    setStatus('analyzing');
    setResults(null);
    setError(null);

    const formData = new FormData();
    formData.append('report', file);

    try {
      const response = await fetch('/api/analyze-report', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server rejected or failed to parse clinical report.');
      }

      const parsedData: AnalysisResults = await response.json();
      setResults(parsedData);
      setStatus('done');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during medical report analysis.');
      setStatus('idle');
    }
  };

  // Safe numerical parses for graphics integration
  const parseNumerical = (valStr: string): number => {
    const matched = valStr.match(/(-?\d+(\.\d+)?)/);
    return matched ? parseFloat(matched[1]) : 0;
  };

  const formatChartData = () => {
    if (!results) return [];
    return results.parameters
      .map(p => {
        const valueNum = parseNumerical(p.value);
        if (isNaN(valueNum) || valueNum === 0) return null;
        return {
          name: p.parameter,
          Value: valueNum,
          unit: p.unit,
          status: p.status,
          range: p.normal_range
        };
      })
      .filter(Boolean) as Array<{
        name: string;
        Value: number;
        unit: string;
        status: string;
        range: string;
      }>;
  };

  const chartData = formatChartData();

  // Highlight status cell markers
  const getStatusStyle = (statusStr: string) => {
    const s = statusStr.toLowerCase();
    if (s.includes('high')) {
      return {
        bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        dot: 'bg-rose-500',
        text: 'High'
      };
    }
    if (s.includes('low')) {
      return {
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        dot: 'bg-amber-500',
        text: 'Low'
      };
    }
    return {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      dot: 'bg-emerald-500',
      text: 'Normal'
    };
  };

  // Export parsed summary metrics to professional PDF report using jsPDF
  const exportPdf = () => {
    if (!results) return;

    try {
      const doc = new jsPDF();
      
      // Clinical Header Setup
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('Clinical Diagnostic Evaluation Report', 14, 20);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Evaluation Timestamp: ${new Date().toLocaleString()} | Powered by MediSense AI Suite`, 14, 26);
      
      // Horizontal slate line
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 30, 196, 30);
      
      // Clinical Summary Panel
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(51, 65, 85);
      doc.text('Clinical Synthesis Evaluation Summary:', 14, 39);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const wrappedSummary = doc.splitTextToSize(results.summary, 178);
      doc.text(wrappedSummary, 14, 45);
      
      // Biomarkers Table
      let currentY = 52 + (wrappedSummary.length * 4.5);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('Extracted Physiological Parameters & Biomarkers', 14, currentY);
      currentY += 6;
      
      // Table Header row bg
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, currentY, 182, 8, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Biomarker Parameter', 16, currentY + 5.5);
      doc.text('Measured Value', 82, currentY + 5.5);
      doc.text('Unit', 114, currentY + 5.5);
      doc.text('Reference Bounds', 136, currentY + 5.5);
      doc.text('Status', 174, currentY + 5.5);
      currentY += 8;
      
      // Row parameters loop
      results.parameters.forEach((param) => {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(55, 65, 81);
        
        // Draw row separator line
        doc.setDrawColor(241, 245, 249);
        doc.line(14, currentY + 8, 196, currentY + 8);
        
        doc.text(param.parameter, 16, currentY + 5.5);
        doc.text(param.value, 82, currentY + 5.5);
        doc.text(param.unit, 114, currentY + 5.5);
        doc.text(param.normal_range, 136, currentY + 5.5);
        
        // Custom color rules based on clinical bounds
        const statusLower = param.status.toLowerCase();
        if (statusLower.includes('high')) {
          doc.setTextColor(220, 38, 38); // red-600
          doc.setFont('Helvetica', 'bold');
        } else if (statusLower.includes('low')) {
          doc.setTextColor(217, 119, 6); // amber-600
          doc.setFont('Helvetica', 'bold');
        } else {
          doc.setTextColor(5, 150, 105); // emerald-600
          doc.setFont('Helvetica', 'normal');
        }
        
        doc.text(param.status, 174, currentY + 5.5);
        currentY += 8;
      });
      
      // Disclaimer Footer
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('DISCLAIMER: This diagnostic evaluation sheet is parsed by deep AI models. It does not replace clinician advice. Please consult primary care specialists.', 14, 285);
      
      doc.save(`MediSense-Evaluation-Report.pdf`);
    } catch (pdfErr) {
      console.error(pdfErr);
      setError('An error occurred during PDF generation. Please consult direct parameters table.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and overview */}
      <div>
        <h1 className="text-3xl font-display font-medium text-slate-100 tracking-tight flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-[#14B8A6] animate-pulse" /> Health Report Analyzer
        </h1>
        <p className="text-slate-405 mt-1">
          Drop diagnostic sheets, blood panels, or TXT records to automatically harvest biomarkers, index normal ranges, and synthesize plain-English insights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Hand: Upload Widget and Pipeline Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-xl font-display font-medium text-slate-200">Diagnostics Ingest</h2>
            <p className="text-xs text-slate-400">
              Drag-and-drop or select active lab slips. Our clinical extraction engines process documents index records safely using HIPAA guidance models.
            </p>

            {/* Drag Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 relative group flex flex-col justify-center items-center gap-3 ${
                isDragging
                  ? 'border-[#14B8A6] bg-[#0F3D3C]/40 shadow-lg shadow-[#14B8A6]/10'
                  : 'border-[#145e5c]/40 bg-[#042F2E]/40 hover:border-[#14B8A6]/80 hover:bg-[#0F3D3C]/30'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.txt"
                className="hidden"
              />
              <div className="p-3 bg-[#042F2E] border border-[#145e5c] rounded-lg group-hover:scale-105 transition-all text-[#14B8A6]">
                <UploadCloud className="h-8 w-8 animate-bounce" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300">Drag & Drop report</p>
                <p className="text-xs text-slate-500 mt-1">or click to browse local files</p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                Supports PDF or TXT up to 12MB
              </span>
            </div>

            {selectedFile && (
              <div className="p-3 bg-[#042F2E]/60 rounded-xl border border-[#145e5c]/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4.5 w-4.5 text-[#14B8A6] flex-shrink-0" />
                  <span className="text-teal-250 font-mono truncate">{selectedFile.name}</span>
                </div>
                <button 
                  onClick={() => { setSelectedFile(null); setResults(null); setStatus('idle'); }}
                  className="text-slate-500 hover:text-rose-400 transition-all ml-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-[#145e5c]/35 mt-2">
              <span className="text-[10px] font-mono text-teal-400/85 flex items-center gap-1.5 uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5 text-[#14B8A6]" /> HIPAA Compliant Local Pipeline
              </span>
            </div>
          </div>

          {/* Quick Informational Guide */}
          <div className="p-5 bg-gradient-to-br from-teal-950/10 to-transparent border border-[#145e5c]/30 rounded-2xl space-y-2.5">
            <h4 className="text-xs font-semibold text-teal-250 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Info className="h-4 w-4 text-[#14B8A6]" /> Analysis Reference Guide
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upon file parsing, results are structured directly below. High levels represent metrics exceeding positive benchmarks, whereas Low indicates measurements tracking sub-optimal reference bounds. Take medical recommendations as suggestions, always consult healthcare providers.
            </p>
          </div>
        </div>

        {/* Right Hand: Actionable outputs, charts, visual results table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Diagnostic results header status bar */}
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-800/80">
              <div className="space-y-0.5">
                <h2 className="text-xl font-display font-medium text-slate-200">Physiological Benchmarks</h2>
                <span className="text-xs text-slate-400">Diagnostic evaluations and metric extraction index.</span>
              </div>
              <div>
                {status === 'analyzing' && (
                  <span className="inline-flex items-center gap-2 text-xs font-mono text-[#14B8A6] bg-[#042F2E] px-3 py-1.5 rounded-xl border border-[#145e5c]/50">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Extracting & Analyzing...
                  </span>
                )}
                {status === 'done' && (
                  <span className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/10 px-3 py-1.5 rounded-xl border border-emerald-800/30">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Evaluation Concluded
                  </span>
                )}
                {status === 'idle' && (
                  <span className="inline-flex items-center gap-2 text-xs font-mono text-teal-400 bg-[#042F2E]/60 px-3 py-1.5 rounded-xl border border-[#145e5c]/40">
                    Awaiting Raw Records
                  </span>
                )}
              </div>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="p-4 bg-rose-950/10 border border-rose-900/30 rounded-xl text-rose-450 text-xs flex items-center gap-2.5">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500 flex-shrink-0 animate-bounce" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading placeholder skeleton */}
            {status === 'analyzing' && (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="h-10 bg-slate-950 rounded-xl border border-slate-850 w-2/3" />
                <div className="space-y-2">
                  <div className="h-14 bg-slate-950 rounded-xl border border-slate-850" />
                  <div className="h-14 bg-slate-950 rounded-xl border border-slate-850" />
                  <div className="h-14 bg-slate-950 rounded-xl border border-slate-850" />
                </div>
                <div className="h-24 bg-slate-950 rounded-xl border border-slate-850 mt-6" />
              </div>
            )}

            {/* Awaiting input state */}
            {status === 'idle' && !error && (
              <div className="py-24 text-center space-y-3">
                <FileText className="h-14 w-14 text-slate-700 mx-auto animate-pulse" />
                <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium">No diagnostic indicators parsed</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Drag and drop local medical panel files, prescription text, or lab charts on the left pane to initialize.
                </p>
              </div>
            )}

            {/* Conclusion Done State */}
            {status === 'done' && results && (
              <div className="space-y-6">
                
                {/* Visual table component */}
                <div className="overflow-x-auto rounded-xl border border-[#145e5c]/40 bg-[#042F2E]/60">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#042F2E] text-teal-300 font-mono uppercase tracking-wider border-b border-[#145e5c]/40">
                        <th className="px-4 py-3.5 font-semibold">Diagnostic Param</th>
                        <th className="px-4 py-3.5 font-semibold">Measured Value</th>
                        <th className="px-4 py-3.5 font-semibold">Unit</th>
                        <th className="px-4 py-3.5 font-semibold">Reference Range</th>
                        <th className="px-4 py-3.5 font-semibold text-center">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {results.parameters.map((param, index) => {
                        const style = getStatusStyle(param.status);
                        return (
                          <tr key={index} className="hover:bg-slate-900/35 transition-colors">
                            <td className="px-4 py-3.5 font-medium text-slate-200">{param.parameter}</td>
                            <td className="px-4 py-3.5 font-semibold font-mono text-slate-100">{param.value}</td>
                            <td className="px-4 py-3.5 font-mono text-slate-400">{param.unit || '--'}</td>
                            <td className="px-4 py-3.5 font-mono text-slate-400">{param.normal_range}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border ${style.bg}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                                {style.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Comparative Recharts Graphical Metrics Panel */}
                {chartData.length > 0 && (
                  <div className="space-y-3.5 pt-2">
                    <h3 className="text-sm font-semibold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4 text-[#14B8A6]" /> Comparative Value Index
                    </h3>
                    
                    <div className="h-64 bg-slate-950 rounded-xl border border-slate-850 p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#101b2a" horizontal={false} />
                          <XAxis type="number" stroke="#4a5568" fontSize={9} fontClassName="font-mono" />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="#4a5568" 
                            width={110} 
                            fontSize={9} 
                            tickFormatter={(tick) => tick.length > 18 ? `${tick.slice(0, 16)}...` : tick}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-[#0F3D3C] border border-[#145e5c] p-3 rounded-lg shadow-xl text-xs space-y-1">
                                    <p className="font-semibold text-white">{data.name}</p>
                                    <p className="text-teal-200">
                                      Your Value: <span className="font-mono text-[#14B8A6] font-bold">{data.Value} {data.unit}</span>
                                    </p>
                                    <p className="text-slate-400 text-[11px]">
                                      Reference Range: <span className="font-mono">{data.range}</span>
                                    </p>
                                    <p className={`text-[10px] font-bold uppercase transition mt-1 inline-block ${
                                      data.status.toLowerCase().includes('high') ? 'text-rose-450' : 
                                      data.status.toLowerCase().includes('low') ? 'text-amber-450' : 'text-emerald-450'
                                    }`}>
                                      • {data.status}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="Value" radius={[0, 4, 4, 0]} barSize={12}>
                            {chartData.map((entry, index) => {
                              const s = entry.status.toLowerCase();
                              let color = '#10b981'; // Normal - Emerald
                              if (s.includes('high')) color = '#ef4444'; // High - Red
                              if (s.includes('low')) color = '#f59e0b'; // Low - Yellow
                              return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* AI Synthesis Assessment Summary Panel */}
                <div className="p-4 bg-gradient-to-r from-[#042F2E] to-[#0F3D3C] border border-[#145e5c]/40 rounded-xl space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 text-[#14B8A6]/5 pointer-events-none">
                    <Sliders className="h-16 w-16" />
                  </div>
                  <div className="flex items-center gap-2 text-[#14B8A6]">
                    <Sparkles className="h-4.5 w-4.5 text-[#14B8A6] animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold">AI Synthesis Evaluation</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1">
                    {results.summary}
                  </p>
                </div>

                {/* Export Report Actions footer */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={exportPdf}
                    className="flex items-center gap-2 text-xs font-mono font-semibold bg-[#0F3D3C] hover:bg-[#124d4c] border border-[#145e5c] text-white px-5 py-3 rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    <FileDown className="h-4 w-4 text-[#14B8A6]" /> Download PDF Analysis
                  </button>
                </div>
                
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
