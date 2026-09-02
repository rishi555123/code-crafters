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
        <div className="lg:col-span-4 bg-white/90 rounded-2xl border border-slate-200 p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900">Recent Slope Incidents</h3>
              </div>
              <button
                onClick={() => navigate('/incidents')}
                className="text-xs font-mono text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1"
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
                  className="p-3 rounded-xl bg-white/90 hover:bg-white border border-slate-200 hover:border-indigo-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-cyan-600 group-hover:text-cyan-700 flex items-center gap-1">
                      <span>{inc.zone_name || inc.zone_id}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      inc.status === 'ACTIVE EMERGENCY' ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {inc.status || 'RESOLVED'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
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
          <div className="pt-3 border-t border-slate-200 mt-4 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500">SIH 2026 Presentation</span>
            <button
              onClick={onOpenDemoDrawer}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-cyan-950/60"
            >
              Launch 4-Stage Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

