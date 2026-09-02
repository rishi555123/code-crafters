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
        badgeBg: 'bg-slate-50 text-slate-600 border-slate-200',
        progressBarBg: 'bg-slate-200',
        textColor: 'text-slate-500',
        label: 'STALE TELEMETRY'
      };
    }
    if (riskLevel === 'HIGH') {
      return {
        badgeBg: 'bg-red-50 text-red-700 border-red-200 animate-pulse',
        progressBarBg: 'bg-gradient-to-r from-red-600 to-red-500',
        textColor: 'text-red-600',
        label: 'CRITICAL HAZARD'
      };
    }
    if (riskLevel === 'MEDIUM') {
      return {
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        progressBarBg: 'bg-gradient-to-r from-amber-600 to-amber-500',
        textColor: 'text-amber-600',
        label: 'ELEVATED RISK'
      };
    }
    return {
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      progressBarBg: 'bg-gradient-to-r from-emerald-600 to-emerald-500',
      textColor: 'text-emerald-600',
      label: 'STABLE CONDITIONS'
    };
  };

  const riskStyle = getRiskColorInfo();

  return (
    <div className="bg-white/90 rounded-2xl border border-slate-200 p-5 shadow-sm backdrop-blur-md flex flex-col gap-4">
      {/* Zone Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-mono text-cyan-600 uppercase tracking-wider font-semibold">Active Sector</span>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
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
            if (z.stale) statusDot = 'bg-slate-300';
            else if (z.risk_level === 'HIGH') statusDot = 'bg-red-400 animate-ping';
            else if (z.risk_level === 'MEDIUM') statusDot = 'bg-amber-400';

            return (
              <button
                key={zId}
                onClick={() => onSelectZone(zId)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-700 shadow-md shadow-cyan-950/50'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-200'
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
        <div className="bg-white/95 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-slate-500 animate-pulse" />
            <div>
              <strong className="text-slate-700">TELEMETRY DROPPED (STALE)</strong>
              <span className="block text-[11px] text-slate-500">No sensor packets received in &gt; 15 mins. Geotechnical baseline locked.</span>
            </div>
          </div>
          <button
            onClick={() => onToggleStale(currentZone.zone_id || currentZone.id)}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-cyan-600 rounded text-xs font-mono font-bold whitespace-nowrap"
          >
            Reconnect
          </button>
        </div>
      )}

      {/* Hysteresis Step Notice if in progress */}
      {currentZone.hysteresis_step && (
        <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-2.5 text-xs text-amber-700 flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-600 animate-spin" />
          <span><strong>False-Alarm Hysteresis:</strong> {currentZone.hysteresis_step}</span>
        </div>
      )}

      {/* Primary Risk Gauge Card */}
      <div className={`p-4 rounded-xl border ${
        isStale 
          ? 'border-slate-200 bg-slate-50' 
          : riskLevel === 'HIGH' 
          ? 'border-red-900/80 bg-red-50 glow-high' 
          : riskLevel === 'MEDIUM' 
          ? 'border-amber-900/60 bg-amber-50/20' 
          : 'border-emerald-900/50 bg-emerald-50/20'
      }`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">AI Risk Prediction Index</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
                {riskScore.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-slate-500">/ 1.00</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={`px-3 py-1 rounded-lg border text-xs font-mono font-extrabold uppercase tracking-wider ${riskStyle.badgeBg}`}>
              {isStale ? 'STALE' : `${riskLevel} RISK`}
            </span>
            <span className="text-[11px] font-mono text-slate-500">{riskStyle.label}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white rounded-full h-3 p-0.5 border border-slate-200 mt-3 overflow-hidden">
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
      <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
          <span>Lithology: <strong className="text-slate-700">{currentZone.rock_type || 'Basalt/Quartzite'}</strong></span>
          <span>Slope: <strong className="text-slate-700">{currentZone.slope_angle || '60°'}</strong></span>
          <span>Elev: <strong className="text-slate-700">{currentZone.elevation_m || 450}m</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStale(currentZone.zone_id || currentZone.id)}
            className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-mono transition-all"
          >
            {isStale ? 'Set Active' : 'Simulate Network Drop'}
          </button>

          <button
            onClick={onOpenCVModal}
            className="px-3 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-700 text-[11px] font-bold font-mono transition-all flex items-center gap-1"
          >
            <span>CV Camera</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

