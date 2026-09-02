import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Activity, 
  Layers, 
  Camera, 
  History, 
  Sliders, 
  Radio,
  Server,
  LayoutDashboard
} from 'lucide-react';
import { soundService } from '../services/audio';

export default function Header({
  activeAlertsCount = 0,
  isMockMode = false,
  onToggleMockMode,
  onOpenDemoDrawer,
  onOpenCVModal,
  selectedZone,
  backendConnected = true
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMuted, setIsMuted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundService.setMuted(newMuted);
    if (!newMuted) {
      soundService.playBeep(880, 0.1);
    }
  };

  return (
    <header className="bg-slate-50 border-b border-slate-200 px-4 lg:px-6 py-3 sticky top-0 z-40 backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Branding & Nav Links */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 shadow-md shadow-cyan-950/50 border border-cyan-400/30 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  activeAlertsCount > 0 ? 'bg-red-400' : 'bg-emerald-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  activeAlertsCount > 0 ? 'bg-red-500' : 'bg-emerald-500'
                }`}></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono tracking-widest text-cyan-600 uppercase bg-cyan-50/80 border border-cyan-200/60 px-1.5 py-0.5 rounded">
                  SIH25071
                </span>
                <h1 className="text-base font-extrabold text-slate-900 tracking-wide">
                  CODE CRAFTERS <span className="text-slate-500 font-normal">| Rockfall Early Warning</span>
                </h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>Open-Pit Mine Geotechnical Safety</span>
                <span>•</span>
                <span className="font-mono text-cyan-600/90">Autonomous Slope Radar</span>
              </div>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-white/90 p-1 rounded-xl border border-slate-200 text-xs font-mono">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/incidents"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              <History className="w-3.5 h-3.5" />
              <span>Incidents Log</span>
            </NavLink>
          </nav>
        </div>

        {/* Center: System Telemetry Stats */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Active Alerts Pill */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
            activeAlertsCount > 0
              ? 'bg-red-50/60 border-red-200 text-red-700 animate-pulse shadow-lg shadow-red-950/50'
              : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            {activeAlertsCount > 0 ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            )}
            <span>{activeAlertsCount > 0 ? `${activeAlertsCount} HIGH ALERTS` : 'SLOPES NORMAL'}</span>
          </div>

          {/* Backend Connection Indicator */}
          <button 
            onClick={onToggleMockMode}
            title="Click to toggle Live Backend API vs Mock Simulator Mode"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              isMockMode
                ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                : backendConnected
                ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                : 'bg-amber-50/50 border-amber-200/60 text-amber-700'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>{isMockMode ? 'SIMULATION MODE' : (backendConnected ? 'LIVE BACKEND' : 'OFFLINE (FALLBACK)')}</span>
            <span className={`w-2 h-2 rounded-full ${isMockMode ? 'bg-purple-400' : (backendConnected ? 'bg-emerald-400' : 'bg-amber-400')}`}></span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-lg border transition-all ${
              isMuted 
                ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-600' 
                : 'bg-white border-slate-200 text-cyan-600 hover:border-cyan-500/50'
            }`}
            title={isMuted ? "Unmute Audio Alarm" : "Mute Audio Alarm"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Right: Quick Action Buttons & Clock */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCVModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-cyan-500/50 text-xs font-medium text-slate-700 transition-all shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden sm:inline">CV Crack AI</span>
          </button>

          <button
            onClick={onOpenDemoDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-md shadow-cyan-950/60"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Demo Scenarios</span>
          </button>

          {/* Clock */}
          <div className="hidden xl:flex flex-col text-right font-mono border-l border-slate-200 pl-3 ml-1">
            <span className="text-xs font-semibold text-slate-700">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className="text-[10px] text-slate-500">
              {currentTime.toISOString().split('T')[0]}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
