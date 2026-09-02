import React from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  CloudRain, 
  Droplets, 
  Thermometer, 
  Activity, 
  Ruler, 
  Scan, 
  Radio, 
  Clock, 
  WifiOff, 
  Layers,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import StatCard from './StatCard';

export default function ZoneDetailsPanel({
  zones = [],
  selectedZoneId,
  onSelectZone,
  onToggleStale,
  onOpenCVModal
}) {
  const currentZone = zones.find(z => (z.zone_id || z.id) === selectedZoneId) || zones[0];

  if (!currentZone) return null;

  const isStale = currentZone.stale;
  const riskLevel = currentZone.risk_level || 'LOW';
  const riskScore = Number(currentZone.risk_score || 0);

  const getRiskColorInfo = () => {
    if (isStale) {
      return {
        badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
        progressBarBg: 'bg-slate-600',
        textColor: 'text-slate-400',
        label: 'STALE TELEMETRY'
      };
    }
    if (riskLevel === 'HIGH') {
      return {
        badgeBg: 'bg-red-950 text-red-300 border-red-800 animate-pulse',
        progressBarBg: 'bg-gradient-to-r from-red-600 to-red-500',
        textColor: 'text-red-400',
        label: 'CRITICAL HAZARD'
      };
    }
    if (riskLevel === 'MEDIUM') {
      return {
        badgeBg: 'bg-amber-950 text-amber-300 border-amber-800',
        progressBarBg: 'bg-gradient-to-r from-amber-600 to-amber-500',
        textColor: 'text-amber-400',
        label: 'ELEVATED RISK'
      };
    }
    return {
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      progressBarBg: 'bg-gradient-to-r from-emerald-600 to-emerald-500',
      textColor: 'text-emerald-400',
      label: 'STABLE CONDITIONS'
    };
  };

  const riskStyle = getRiskColorInfo();

  return (
    <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4">
      {/* Zone Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">Active Sector</span>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {currentZone.zone_name || currentZone.name || currentZone.zone_id}
            </h2>
          </div>
        </div>

        {/* Sector Quick Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {zones.map((z) => {
            const zId = z.zone_id || z.id;
            const isSelected = zId === selectedZoneId;
            let statusDot = 'bg-emerald-400';
            if (z.stale) statusDot = 'bg-slate-400';
            else if (z.risk_level === 'HIGH') statusDot = 'bg-red-400 animate-ping';
            else if (z.risk_level === 'MEDIUM') statusDot = 'bg-amber-400';

            return (
              <button
                key={zId}
                onClick={() => onSelectZone(zId)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                <span>{zId.replace('SLOPE_', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STALE Banner if telemetry disconnected */}
      {isStale && (
        <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-slate-400 animate-pulse" />
            <div>
              <strong className="text-slate-200">TELEMETRY DROPPED (STALE)</strong>
              <span className="block text-[11px] text-slate-400">No sensor packets received in &gt; 15 mins. Geotechnical baseline locked.</span>
            </div>
          </div>
          <button
            onClick={() => onToggleStale(currentZone.zone_id || currentZone.id)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-xs font-mono font-bold whitespace-nowrap"
          >
            Reconnect
          </button>
        </div>
      )}

      {/* Hysteresis Step Notice if in progress */}
      {currentZone.hysteresis_step && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-2.5 text-xs text-amber-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400 animate-spin" />
          <span><strong>False-Alarm Hysteresis:</strong> {currentZone.hysteresis_step}</span>
        </div>
      )}

      {/* Primary Risk Gauge Card */}
      <div className={`p-4 rounded-xl border ${
        isStale 
          ? 'border-slate-800 bg-slate-900/40' 
          : riskLevel === 'HIGH' 
          ? 'border-red-900/80 bg-red-950/30 glow-high' 
          : riskLevel === 'MEDIUM' 
          ? 'border-amber-900/60 bg-amber-950/20' 
          : 'border-emerald-900/50 bg-emerald-950/20'
      }`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">AI Risk Prediction Index</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-black font-mono tracking-tight text-white">
                {riskScore.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 1.00</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={`px-3 py-1 rounded-lg border text-xs font-mono font-extrabold uppercase tracking-wider ${riskStyle.badgeBg}`}>
              {isStale ? 'STALE' : `${riskLevel} RISK`}
            </span>
            <span className="text-[11px] font-mono text-slate-400">{riskStyle.label}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 border border-slate-800 mt-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${riskStyle.progressBarBg}`}
            style={{ width: `${Math.min(100, Math.max(5, riskScore * 100))}%` }}
          ></div>
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Crack Severity */}
        <StatCard
          title="CV Crack Severity"
          value={currentZone.crack_severity || 'NONE'}
          icon={Scan}
          status={isStale ? 'stale' : currentZone.crack_severity === 'HIGH' ? 'critical' : currentZone.crack_severity === 'MEDIUM' ? 'warning' : 'safe'}
          subText={currentZone.crack_detected ? "Visual Fracture Active" : "No Cracks Detected"}
        />

        {/* Deformation */}
        <StatCard
          title="Slope Deformation"
          value={currentZone.deformation_mm || 0}
          unit="mm"
          icon={Ruler}
          status={isStale ? 'stale' : currentZone.deformation_mm > 10 ? 'critical' : currentZone.deformation_mm > 5 ? 'warning' : 'safe'}
          subText={currentZone.deformation_mm > 10 ? "Exceeds Threshold (10mm)" : "Within Tolerance"}
        />

        {/* Rainfall */}
        <StatCard
          title="Rainfall Telemetry"
          value={currentZone.rainfall_mm || 0}
          unit="mm/h"
          icon={CloudRain}
          status={isStale ? 'stale' : currentZone.rainfall_mm > 35 ? 'critical' : currentZone.rainfall_mm > 15 ? 'warning' : 'safe'}
          subText={currentZone.rainfall_mm > 35 ? "Torrential Mine Inundation" : "Pore Pressure Nominal"}
        />

        {/* Vibration */}
        <StatCard
          title="Seismic Vibration"
          value={currentZone.vibration || 0}
          unit="mm/s"
          icon={Activity}
          status={isStale ? 'stale' : currentZone.vibration > 6 ? 'critical' : currentZone.vibration > 3 ? 'warning' : 'safe'}
          subText={currentZone.vibration > 6 ? "High Geophone Tremor" : "Stable Baseline"}
        />

        {/* Humidity */}
        <StatCard
          title="Relative Humidity"
          value={currentZone.humidity || 0}
          unit="%"
          icon={Droplets}
          status={isStale ? 'stale' : 'normal'}
          subText="Ambient Atmosphere"
        />

        {/* Temperature */}
        <StatCard
          title="Bench Temperature"
          value={currentZone.temperature || 0}
          unit="°C"
          icon={Thermometer}
          status={isStale ? 'stale' : 'normal'}
          subText="Thermal Gradient"
        />
      </div>

      {/* Sector Geotechnical Metadata & Actions Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <span>Lithology: <strong className="text-slate-200">{currentZone.rock_type || 'Basalt/Quartzite'}</strong></span>
          <span>Slope: <strong className="text-slate-200">{currentZone.slope_angle || '60°'}</strong></span>
          <span>Elev: <strong className="text-slate-200">{currentZone.elevation_m || 450}m</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStale(currentZone.zone_id || currentZone.id)}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-mono transition-all"
          >
            {isStale ? 'Set Active' : 'Simulate Network Drop'}
          </button>

          <button
            onClick={onOpenCVModal}
            className="px-3 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold font-mono transition-all flex items-center gap-1"
          >
            <span>CV Camera</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

