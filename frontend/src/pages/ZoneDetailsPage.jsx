import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Compass, 
  Layers, 
  Camera, 
  Activity, 
  CloudRain, 
  Droplets, 
  Thermometer, 
  Ruler, 
  Scan, 
  WifiOff, 
  ShieldAlert, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import StatCard from '../components/StatCard';
import TelemetryCharts from '../components/TelemetryCharts';
import MineMap from '../components/MineMap';

export default function ZoneDetailsPage({
  zones,
  onSelectZone,
  onToggleStale,
  onOpenCVModal
}) {
  const { zoneId } = useParams();
  const navigate = useNavigate();

  const currentZone = zones.find(z => (z.zone_id || z.id) === zoneId) || zones[0];
  const isStale = currentZone?.stale;
  const riskLevel = currentZone?.risk_level || 'LOW';
  const riskScore = Number(currentZone?.risk_score || 0);

  const zoneIndex = zones.findIndex(z => (z.zone_id || z.id) === currentZone?.zone_id || (z.zone_id || z.id) === currentZone?.id);
  const prevZone = zones[(zoneIndex - 1 + zones.length) % zones.length];
  const nextZone = zones[(zoneIndex + 1) % zones.length];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs & Sector Header */}
      <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-5 shadow-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
            <Link to="/" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span>/</span>
            <span>Sectors</span>
            <span>/</span>
            <span className="text-cyan-400 font-bold">{currentZone?.zone_id || currentZone?.id}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {currentZone?.zone_name || currentZone?.name || currentZone?.zone_id}
            </h1>
            <span className={`px-3 py-1 rounded-lg border text-xs font-mono font-extrabold uppercase tracking-wider ${
              isStale ? 'bg-slate-800 text-slate-300 border-slate-700' :
              riskLevel === 'HIGH' ? 'bg-red-950 text-red-300 border-red-800 animate-pulse' :
              riskLevel === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border-amber-800' :
              'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}>
              {isStale ? 'STALE' : `${riskLevel} RISK`}
            </span>
          </div>
        </div>

        {/* Sector Nav Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/zone/${prevZone.zone_id || prevZone.id}`)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <button
            onClick={() => onOpenCVModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono shadow-md shadow-cyan-950/60"
          >
            <Camera className="w-4 h-4" />
            <span>CV Camera Inspect</span>
          </button>

          <button
            onClick={() => navigate(`/zone/${nextZone.zone_id || nextZone.id}`)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: Map + Telemetry KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Mini Map Focused on this Zone (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <MineMap
            zones={zones}
            selectedZoneId={currentZone?.zone_id || currentZone?.id}
            onSelectZone={(zId) => navigate(`/zone/${zId}`)}
            className="h-full min-h-[420px]"
          />
        </div>

        {/* Right: Telemetry & Risk Details (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Risk Score Index Bar */}
          <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">AI Risk Prediction Model</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-4xl font-black font-mono tracking-tight text-white">
                    {riskScore.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/ 1.00</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 block">Coordinates:</span>
                <span className="font-mono text-xs text-cyan-300">
                  {currentZone?.latitude.toFixed(4)}°N, {currentZone?.longitude.toFixed(4)}°E
                </span>
                <span className="block text-[11px] font-mono text-slate-500 mt-1">
                  Elevation: {currentZone?.elevation_m || 450}m AMSL
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-3.5 p-0.5 border border-slate-800 mt-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  riskLevel === 'HIGH' ? 'bg-gradient-to-r from-red-600 to-red-500' :
                  riskLevel === 'MEDIUM' ? 'bg-gradient-to-r from-amber-600 to-amber-500' :
                  'bg-gradient-to-r from-emerald-600 to-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, riskScore * 100))}%` }}
              ></div>
            </div>
          </div>

          {/* Telemetry Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              title="Crack Severity"
              value={currentZone?.crack_severity || 'NONE'}
              icon={Scan}
              status={isStale ? 'stale' : currentZone?.crack_severity === 'HIGH' ? 'critical' : currentZone?.crack_severity === 'MEDIUM' ? 'warning' : 'safe'}
              subText={currentZone?.crack_detected ? "Fracture Detected" : "Clear Slope Surface"}
            />

            <StatCard
              title="Deformation"
              value={currentZone?.deformation_mm || 0}
              unit="mm"
              icon={Ruler}
              status={isStale ? 'stale' : currentZone?.deformation_mm > 10 ? 'critical' : currentZone?.deformation_mm > 5 ? 'warning' : 'safe'}
              subText={currentZone?.deformation_mm > 10 ? "Above Critical Limit" : "Safe Elastic Range"}
            />

            <StatCard
              title="Rainfall"
              value={currentZone?.rainfall_mm || 0}
              unit="mm/h"
              icon={CloudRain}
              status={isStale ? 'stale' : currentZone?.rainfall_mm > 35 ? 'critical' : currentZone?.rainfall_mm > 15 ? 'warning' : 'safe'}
              subText={currentZone?.rainfall_mm > 35 ? "High Hydro-Load" : "Normal Drainage"}
            />

            <StatCard
              title="Seismic Vibration"
              value={currentZone?.vibration || 0}
              unit="mm/s"
              icon={Activity}
              status={isStale ? 'stale' : currentZone?.vibration > 6 ? 'critical' : currentZone?.vibration > 3 ? 'warning' : 'safe'}
              subText="Tri-Axial Geophone"
            />

            <StatCard
              title="Humidity"
              value={currentZone?.humidity || 0}
              unit="%"
              icon={Droplets}
              status={isStale ? 'stale' : 'normal'}
              subText="Atmospheric Sensor"
            />

            <StatCard
              title="Bench Temp"
              value={currentZone?.temperature || 0}
              unit="°C"
              icon={Thermometer}
              status={isStale ? 'stale' : 'normal'}
              subText="Infrared Surface"
            />
          </div>
        </div>
      </div>

      {/* Telemetry Charts for This Zone */}
      <TelemetryCharts selectedZone={currentZone} />
    </div>
  );
}

