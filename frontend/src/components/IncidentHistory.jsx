import React, { useState } from 'react';
import { 
  History, 
  AlertTriangle, 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText,
  X,
  ExternalLink
} from 'lucide-react';

export default function IncidentHistory({
  isOpen,
  onClose,
  incidents = [],
  onSelectZone
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  if (!isOpen) return null;

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = 
      (inc.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.zone_name || inc.zone_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.weather_conditions || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = 
      filterSeverity === 'ALL' || 
      (inc.crack_severity || '').toUpperCase() === filterSeverity.toUpperCase();

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-950 rounded-xl border border-indigo-800/60 text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Geotechnical Incident & Rockfall History</span>
                <span className="text-xs font-mono bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded">
                  GET /api/incidents
                </span>
              </h2>
              <span className="text-xs font-mono text-slate-400">
                Audit Trail & Historical Slope Failures
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by zone, incident ID, weather..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500/50"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>
        </div>

        {/* Incident Table / List */}
        <div className="p-6 overflow-y-auto">
          {filteredIncidents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              No historical incident records match the filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Incident ID</th>
                    <th className="px-4 py-3">Sector</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Pre-Risk</th>
                    <th className="px-4 py-3">Deform (mm)</th>
                    <th className="px-4 py-3">Weather / Trigger</th>
                    <th className="px-4 py-3">Protocol Executed</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
                  {filteredIncidents.map((inc) => {
                    const isHigh = inc.risk_score_before_event >= 0.75 || inc.crack_severity === 'CRITICAL';

                    return (
                      <tr key={inc.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-cyan-400">
                          {inc.id}
                        </td>
                        <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                          {inc.zone_name || inc.zone_id}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {new Date(inc.event_time).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            isHigh ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {Number(inc.risk_score_before_event).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-200">
                          {inc.deformation_mm} mm
                        </td>
                        <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">
                          {inc.weather_conditions}
                        </td>
                        <td className="px-4 py-3 text-slate-400 max-w-[220px] truncate">
                          {inc.action_taken || 'Siren activated, zone evacuated'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inc.status === 'ACTIVE EMERGENCY' 
                              ? 'bg-red-600 text-white animate-pulse' 
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}>
                            {inc.status || 'RESOLVED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

