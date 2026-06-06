import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  FileText, 
  Brain, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Heart
} from 'lucide-react';

export default function HeroSection() {
  const cards = [
    {
      title: 'Disease Predictor',
      tagline: 'Symptom matching risk logs',
      desc: 'Formulate high-fidelity physiological predictions using advanced clinical triage modeling.',
      path: '/disease',
      icon: Activity,
      color: 'border-teal-500/30 hover:border-teal-400 text-[#14B8A6] group-hover:text-shadow-glow',
      glow: 'shadow-teal-500/10 hover:shadow-teal-500/20',
      tag: 'Triage Engine'
    },
    {
      title: 'Report Analyzer',
      tagline: 'Physiological diagnostics interpretation',
      desc: 'Transcribe structured test indices, raw diagnostic reports, or lab panels instantly.',
      path: '/report',
      icon: FileText,
      color: 'border-emerald-500/30 hover:border-emerald-400 text-emerald-400',
      glow: 'shadow-emerald-500/10 hover:shadow-emerald-500/20',
      tag: 'Biomarkers'
    },
    {
      title: 'Mental Health',
      tagline: 'Resonant coping & sensory pacers',
      desc: 'Trace daily anxiety vectors, record sentiment logs, and align with calming somatic pacers.',
      path: '/mental-health',
      icon: Brain,
      color: 'border-[#14B8A6]/30 hover:border-[#14B8A6] text-teal-300',
      glow: 'shadow-teal-500/10 hover:shadow-teal-500/20',
      tag: 'Somatic Reset'
    },
    {
      title: 'AI Chat Assistant',
      tagline: 'Direct clinical triage companion',
      desc: 'Leverage secure contextual chat matching to get rapid symptoms, dietary, and dosage support.',
      path: '/chat',
      icon: MessageSquare,
      color: 'border-[#14B8A6]/30 hover:border-[#2dd4bf] text-teal-400',
      glow: 'shadow-teal-550/10 hover:shadow-teal-550/20',
      tag: 'Secure Chat'
    }
  ];

  const recentAlerts = [
    { title: 'Core health models updated with clinical data cohort v2.1', time: '2h ago' },
    { title: 'Blood panel analytical benchmarks validated under ISO-2940', time: '1d ago' }
  ];

  return (
    <div className="space-y-10 py-4">
      {/* Animated Heartbeat ESG Banner */}
      <div className="relative w-full glass-card-glowing rounded-3xl p-6 md:p-8 overflow-hidden border border-[#14B8A6]/15 bg-[#124d4c]">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950/20 to-transparent pointer-events-none" />
        
        {/* ECG line container absolutely positioned at the bottom of the card */}
        <div className="absolute bottom-0 left-0 right-0 h-28 opacity-40 hover:opacity-75 transition-opacity duration-300">
          <svg className="w-full h-full text-teal-400" preserveAspectRatio="none" viewBox="0 0 1000 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Wider background glow path */}
            <path 
              d="M0,50 L120,50 L130,35 L140,65 L150,10 L160,90 L170,45 L180,50 L380,50 L390,35 L400,65 L410,10 L420,90 L430,45 L440,50 L640,50 L650,35 L660,65 L670,10 L680,90 L690,45 L700,50 L880,50 L890,35 L900,65 L910,10 L920,90 L930,45 L940,50 L1000,50" 
              stroke="rgba(20, 184, 166, 0.2)" 
              strokeWidth="6" 
              className="animate-ecg" 
            />
            {/* Crisp foreground primary neon line */}
            <path 
              d="M0,50 L120,50 L130,35 L140,65 L150,10 L160,90 L170,45 L180,50 L380,50 L390,35 L400,65 L410,10 L420,90 L430,45 L440,50 L640,50 L650,35 L660,65 L670,10 L680,90 L690,45 L700,50 L880,50 L890,35 L900,65 L910,10 L920,90 L930,45 L940,50 L1000,50" 
              stroke="#14B8A6" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="animate-ecg" 
            />
          </svg>
        </div>

        {/* Content Elements */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#042F2E]/70 text-teal-300 border border-[#14B8A6]/30">
              <Sparkles className="h-3 w-3 animate-pulse text-[#14B8A6]" /> Grounded Neural Diagnosis Engine
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-100 tracking-tight leading-tight">
              Your AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-400 font-extrabold text-shadow-glow">Health Companion</span>
            </h1>
            <p className="text-sm md:text-base text-teal-100/90 leading-relaxed">
              MediSense AI orchestrates clinical knowledge vectors with somatic diagnostic models, helping practitioners map biomarkers, triage symptoms, and monitor mental resilience in real-time.
            </p>
          </div>

          {/* Health Score Circular Indicator */}
          <div className="flex-shrink-0 flex items-center justify-center bg-[#042F2E]/80 p-5 rounded-2xl border border-[#145e5c]/40 backdrop-blur-md animate-glow animate-pulse">
            <div className="relative flex items-center justify-center">
              {/* Outer circular chart container */}
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  strokeWidth="6"
                  stroke="rgba(255,255,255,0.05)"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  strokeWidth="6"
                  stroke="#14B8A6"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - 75 / 100)} // SVG dynamic offset
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute text-center">
                <span className="block text-2xl font-bold font-display text-slate-100 text-shadow-glow">75</span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-teal-300">Index</span>
              </div>
            </div>
            <div className="ml-4 space-y-1">
              <p className="text-xs font-mono text-teal-400 uppercase tracking-wider">Health Score</p>
              <p className="text-sm font-semibold text-emerald-400 text-shadow-green">Optimal Variance</p>
              <p className="text-[10px] text-teal-200/80 leading-none">Resting BPM: 72 (Normal)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Navigation Feature Cards */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-mono uppercase tracking-wider text-teal-300 font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#14B8A6]" />
            Core Diagnostic Suites
          </h2>
          <p className="text-xs text-teal-400/80">Pick an active medical domain to initialize clinical triage analysis.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link 
                key={card.path} 
                to={card.path} 
                className="group relative p-6 block overflow-hidden rounded-2xl glass-card transition-all duration-300 hover:scale-[1.01] hover:border-[#14B8A6]/40 shadow-md cursor-pointer"
              >
                {/* Accent top gradient lines for startup feel */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14B8A6]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl bg-[#042F2E] border ${card.color} transition-colors`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-[#042F2E] border border-[#145e5c]/40 text-teal-300">
                    {card.tag}
                  </span>
                </div>

                <div className="mt-5 space-y-1.5">
                  <h3 className="text-lg font-display font-medium text-slate-100 group-hover:text-[#14B8A6] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs font-mono text-teal-300/60">{card.tagline}</p>
                  <p className="text-sm text-teal-100/80 leading-relaxed pt-1">
                    {card.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Operational Dashboard Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance and validation logs */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#145e5c]/25">
            <h3 className="text-sm font-mono uppercase tracking-wider text-teal-300">System Notification Feed</h3>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="space-y-3">
            {recentAlerts.map((alert, index) => (
              <div key={index} className="flex justify-between items-start gap-4 p-3 rounded-xl bg-[#042F2E]/40 border border-[#145e5c]/30 hover:bg-[#042F2E]/80 transition-colors">
                <p className="text-xs text-teal-100 font-medium">{alert.title}</p>
                <span className="text-[10.5px] font-mono text-teal-300/80 whitespace-nowrap">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Disclaimer Card */}
        <div className="p-6 rounded-2xl glass-card flex flex-col justify-between border-teal-500/10">
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Ethical AI Agreement
            </p>
            <p className="text-xs text-teal-100/80 leading-relaxed">
              MediSense AI is structured for informational triage support. Metrics represent clinical approximations, not a true diagnostic recommendation or standard physician replacement.
            </p>
          </div>
          <div className="pt-4 border-t border-[#145e5c]/40 flex items-center justify-between text-[10px] font-mono text-teal-400">
            <span>FDA Class II Guidance Match</span>
            <span>Version 1.2.6</span>
          </div>
        </div>
      </div>
    </div>
  );
}
