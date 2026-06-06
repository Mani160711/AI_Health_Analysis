import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Shield,
  Menu,
  X,
  User,
  Bell,
  Activity,
  Heart
} from 'lucide-react';
import HeroSection from './components/HeroSection';
import DiseasePredictor from './components/DiseasePredictor';
import ReportAnalyzer from './components/ReportAnalyzer';
import MentalHealth from './components/MentalHealth';
import ChatAssistant from './components/ChatAssistant';
import Navbar from './components/Navbar';

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 font-sans flex overflow-hidden">
      {/* Sidebar navigation */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/30 backdrop-blur-md px-6 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800/80 hover:text-slate-250 lg:hidden cursor-pointer"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Page Indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-mono text-slate-400">MediSense AI Sovereign Environment</span>
          </div>

          {/* User Profile Mini Panel */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 relative cursor-pointer">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-rose-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2.5 pl-4 border-l border-slate-850">
              <div className="h-8 w-8 rounded-lg bg-cyan-950/20 border border-cyan-500/80 flex items-center justify-center text-cyan-400">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-slate-200 leading-none">Clinician Console</p>
                <p className="text-[10px] text-slate-500 font-mono">ID: 4937-US</p>
              </div>
            </div>
          </div>
        </header>

        {/* Router child rendering main body */}
        <main className="flex-1 overflow-y-auto bg-dark-bg p-6 md:p-8 lg:p-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <DashboardLayout>
        <Routes>
          {/* Default Hero Homepage Route */}
          <Route path="/" element={<HeroSection />} />
          <Route path="/disease" element={<DiseasePredictor />} />
          <Route path="/report" element={<ReportAnalyzer />} />
          <Route path="/mental-health" element={<MentalHealth />} />
          <Route path="/chat" element={<ChatAssistant />} />
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DashboardLayout>
    </HashRouter>
  );
}
