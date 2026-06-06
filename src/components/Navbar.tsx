import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  FileText,
  Brain,
  MessageSquare,
  Home,
  Menu,
  X,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const location = useLocation();

  const navigation = [
    {
      name: 'Executive Overview',
      path: '/',
      icon: Home,
      color: 'text-cyan-400',
      activeColor: 'bg-cyan-500/10 border-cyan-500/30 text-slate-100',
      desc: 'Health indicator summary'
    },
    {
      name: 'Disease Predictor',
      path: '/disease',
      icon: Activity,
      color: 'text-cyan-400 animate-pulse',
      activeColor: 'bg-cyan-500/10 border-cyan-500/30 text-slate-100',
      desc: 'Symptom matching risk analysis'
    },
    {
      name: 'Report Analyzer',
      path: '/report',
      icon: FileText,
      color: 'text-emerald-400',
      activeColor: 'bg-emerald-500/10 border-emerald-500/30 text-slate-100',
      desc: 'Blood panel analytical interpret'
    },
    {
      name: 'Mental Health',
      path: '/mental-health',
      icon: Brain,
      color: 'text-rose-400',
      activeColor: 'bg-rose-500/10 border-rose-500/30 text-slate-100',
      desc: 'Mood logs & somatics simulator'
    },
    {
      name: 'AI Chat Assistant',
      path: '/chat',
      icon: MessageSquare,
      color: 'text-indigo-400',
      activeColor: 'bg-indigo-500/10 border-indigo-500/30 text-slate-100',
      desc: 'Primary care triage portal'
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#0F3D3C] border-r border-[#145e5c]/80 transition-transform duration-300 transform lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col justify-between`}
    >
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        {/* Brand logo & Header */}
        <div className="flex items-center justify-between px-6 pb-6 border-b border-[#145e5c]">
          <Link to="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="p-2.5 bg-[#124d4c] border border-[#1e706e] rounded-xl text-[#14B8A6] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Stethoscope className="h-6 w-6 animate-pulse text-[#14B8A6]" />
            </div>
            <div>
              <span className="text-lg font-display font-bold tracking-tight bg-gradient-to-r from-slate-100 to-teal-100 bg-clip-text text-transparent group-hover:text-shadow-glow">
                MediSense AI
              </span>
              <span className="block text-[10px] uppercase font-mono tracking-wider text-[#14B8A6] font-semibold">
                Clinical Assist
              </span>
            </div>
          </Link>
          
          {/* Close Sidebar button explicitly for mobile */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#124d4c] cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Clinical Operations navigation link lists */}
        <nav className="mt-6 flex-1 px-4 space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#124d4c] border border-[#1e706e] text-slate-100 shadow-lg relative'
                    : 'text-teal-200 hover:text-slate-100 hover:bg-[#124d4c]/40'
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105 ${item.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-slate-200 group-hover:text-[#14B8A6] transition-colors font-medium">{item.name}</p>
                  <p className="text-[10px] text-teal-300/60 font-normal truncate group-hover:text-teal-200 transition-colors">{item.desc}</p>
                </div>
                {isActive && (
                  <span className="absolute right-3 h-2 w-2 rounded-full bg-[#14B8A6] animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Persistent System Status Meter */}
      <div className="p-4 border-t border-[#145e5c]/85 bg-[#0F3D3C]">
        <div className="glass-card rounded-xl p-4 border border-[#1e706e] space-y-3 bg-[#0a2322]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-teal-300/70 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            Clinical API active
          </p>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 bg-[#042F2E] border border-[#145e5c]/40 rounded-lg">
              <span className="block text-[9px] text-teal-400 font-mono">LATENCY</span>
              <span className="font-semibold text-emerald-400">12ms</span>
            </div>
            <div className="p-2 bg-[#042F2E] border border-[#145e5c]/40 rounded-lg">
              <span className="block text-[9px] text-teal-400 font-mono">SECURE</span>
              <span className="font-semibold text-teal-300 font-mono">HIPAA</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
