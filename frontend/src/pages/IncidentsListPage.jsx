import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  History, 
  Search, 
  Filter, 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  AlertOctagon, 
  ShieldAlert, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function IncidentsListPage({ incidents = [] }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterZone, setFilterZone] = useState('ALL');

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = 
      (inc.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.zone_name || inc.zone_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.weather_conditions || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = 
      filterSeverity === 'ALL' || 
      (inc.crack_severity || '').toUpperCase() === filterSeverity.toUpperCase();

    const matchesZone = 
      filterZone === 'ALL' || 
      (inc.zone_id || '').toUpperCase() === filterZone.toUpperCase();

    return matchesSearch && matchesSeverity && matchesZone;
  });

  const handleExportCSV = () => {
    const headers = ["Incident ID", "Zone ID", "Timestamp", "Risk Score Before Event", "Deformation (mm)", "Crack Severity", "Weather Conditions", "Status"];
    const rows = filteredIncidents.map(i => [
      i.id,
      i.zone_id,
      i.event_time,
      i.risk_score_before_event,
      i.deformation_mm,
      i.crack_severity,
      `"${i.weather_conditions}"`,
      i.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rockfall_incidents_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white/90 rounded-2xl border border-slate-200 p-5 shadow-sm backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
            <Link to="/" className="hover:text-cyan-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-cyan-600 font-bold">Incidents</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-600">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Geotechnical Incident Audit Log
              </h1>
              <span className="text-xs font-mono text-slate-500">
                GET /api/incidents — Historical failure events & post-event feedback records
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-cyan-600" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/90 rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incident ID, zone, weather triggers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
            <span>Sector:</span>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Sectors</option>
              <option value="SLOPE_A">Slope A</option>
              <option value="SLOPE_B">Slope B</option>
              <option value="SLOPE_C">Slope C</option>
              <option value="SLOPE_D">Slope D</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white/90 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/95 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Incident ID</th>
                <th className="px-5 py-3.5">Sector</th>
                <th className="px-5 py-3.5">Timestamp (UTC/IST)</th>
                <th className="px-5 py-3.5">Pre-Risk Score</th>
                <th className="px-5 py-3.5">Deformation</th>
                <th className="px-5 py-3.5">Crack Severity</th>
                <th className="px-5 py-3.5">Weather / Trigger</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/70">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-500">
                    No incidents found matching the specified filters.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => {
                  const isHigh = inc.risk_score_before_event >= 0.75 || inc.crack_severity === 'CRITICAL';

                  return (
                    <tr 
                      key={inc.id}
                      onClick={() => navigate(`/incident/${inc.id}`)}
                      className="hover:bg-white/90 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4 font-bold text-cyan-600 group-hover:text-cyan-700">
                        {inc.id}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        {inc.zone_name || inc.zone_id}
                      </td>
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(inc.event_time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          isHigh ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {Number(inc.risk_score_before_event).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {inc.deformation_mm} mm
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-yellow-400 font-semibold">{inc.crack_severity}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 max-w-[240px] truncate">
                        {inc.weather_conditions}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.status === 'ACTIVE EMERGENCY' 
                            ? 'bg-red-600 text-white animate-pulse' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}>
                          {inc.status || 'RESOLVED'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-cyan-600 group-hover:text-cyan-700 font-semibold">
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

