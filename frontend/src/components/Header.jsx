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
    <header className="bg-slate-950 border-b border-slate-800/80 px-4 lg:px-6 py-3 sticky top-0 z-40 backdrop-blur-md">
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
                <span className="text-xs font-bold font-mono tracking-widest text-cyan-400 uppercase bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                  SIH25071
                </span>
                <h1 className="text-base font-extrabold text-white tracking-wide">
                  CODE CRAFTERS <span className="text-slate-400 font-normal">| Rockfall Early Warning</span>
                </h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>Open-Pit Mine Geotechnical Safety</span>
                <span>•</span>
                <span className="font-mono text-cyan-400/90">Autonomous Slope Radar</span>
              </div>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-cyan-600 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
                    ? 'bg-cyan-600 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
              ? 'bg-red-950/60 border-red-800 text-red-300 animate-pulse shadow-lg shadow-red-950/50'
              : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400'
          }`}>
            {activeAlertsCount > 0 ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span>{activeAlertsCount > 0 ? `${activeAlertsCount} HIGH ALERTS` : 'SLOPES NORMAL'}</span>
          </div>

          {/* Backend Connection Indicator */}
          <button 
            onClick={onToggleMockMode}
            title="Click to toggle Live Backend API vs Mock Simulator Mode"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              isMockMode
                ? 'bg-purple-950/50 border-purple-800/60 text-purple-300 hover:bg-purple-900/50'
                : backendConnected
                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                : 'bg-amber-950/50 border-amber-800/60 text-amber-300'
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
                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300' 
                : 'bg-slate-900 border-slate-700 text-cyan-400 hover:border-cyan-500/50'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-xs font-medium text-slate-200 transition-all shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">CV Crack AI</span>
          </button>

          <button
            onClick={onOpenDemoDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-950/60"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Demo Scenarios</span>
          </button>

          {/* Clock */}
          <div className="hidden xl:flex flex-col text-right font-mono border-l border-slate-800 pl-3 ml-1">
            <span className="text-xs font-semibold text-slate-200">
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
