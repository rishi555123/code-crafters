import React from 'react';
import { useNavigate } from 'react-router-dom';
import MineMap from '../components/MineMap';
import ZoneDetailsPanel from '../components/ZoneDetailsPanel';
import TelemetryCharts from '../components/TelemetryCharts';
import { ChevronRight, ArrowUpRight, History } from 'lucide-react';

export default function DashboardPage({
  zones,
  selectedZoneId,
  onSelectZone,
  onToggleStale,
  onOpenCVModal,
  incidents,
  onOpenDemoDrawer
}) {
  const navigate = useNavigate();
  const currentSelectedZone = zones.find(z => (z.zone_id || z.id) === selectedZoneId) || zones[0];

  return (
    <div className="space-y-5">
      {/* Top Split View: Map (Left) + Live Conditions Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Leaflet Mine Geospatial Map (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <MineMap
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={(zoneId) => {
              onSelectZone(zoneId);
            }}
            className="h-full min-h-[480px]"
          />
        </div>

        {/* Right: Live Conditions & Sector Details (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <ZoneDetailsPanel
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={onSelectZone}
            onToggleStale={onToggleStale}
            onOpenCVModal={onOpenCVModal}
          />
        </div>
      </div>

      {/* Bottom Section: Real-Time Telemetry Trendlines & Incidents Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Real-time Time-series Trends (8 Cols) */}
        <div className="lg:col-span-8">
          <TelemetryCharts selectedZone={currentSelectedZone} />
        </div>

        {/* Quick Incidents & Geotechnical Safety Card (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-950/90 rounded-2xl border border-slate-800 p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Recent Slope Incidents</h3>
              </div>
              <button
                onClick={() => navigate('/incidents')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <span>View All ({incidents.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {incidents.slice(0, 3).map((inc) => (
                <div 
                  key={inc.id}
                  onClick={() => navigate(`/incident/${inc.id}`)}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1">
                      <span>{inc.zone_name || inc.zone_id}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      inc.status === 'ACTIVE EMERGENCY' ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {inc.status || 'RESOLVED'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {inc.weather_conditions} • Def: {inc.deformation_mm}mm
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">
                    ID: {inc.id} • Risk: {Number(inc.risk_score_before_event).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Demo Trigger Footer */}
          <div className="pt-3 border-t border-slate-800/80 mt-4 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500">SIH 2026 Presentation</span>
            <button
              onClick={onOpenDemoDrawer}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold transition-all shadow-md shadow-cyan-950/60"
            >
              Launch 4-Stage Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

