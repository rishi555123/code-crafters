import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  History, 
  AlertOctagon, 
  ShieldAlert, 
  ShieldCheck, 
  MapPin, 
  CloudRain, 
  Ruler, 
  Scan, 
  Activity, 
  Calendar, 
  Clock, 
  FileText,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function IncidentDetailsPage({ incidents = [], zones = [] }) {
  const { incidentId } = useParams();
  const navigate = useNavigate();

  const incident = incidents.find(i => i.id === incidentId) || incidents[0] || {
    id: incidentId || 'INC-2026-0810-01',
    zone_id: 'SLOPE_C',
    zone_name: 'Slope C - West Pit Wall',
    event_time: '2026-08-10T14:32:00.000Z',
    risk_score_before_event: 0.89,
    weather_conditions: 'Heavy Rain (42mm), 86% Humidity',
    crack_severity: 'HIGH',
    deformation_mm: 12.8,
    alert_sent: true,
    action_taken: 'Personnel evacuated; haul road diverted to Bench 4',
    status: 'RESOLVED'
  };

  const correspondingZone = zones.find(z => (z.zone_id || z.id) === incident.zone_id);

  return (
    <div className="space-y-6">
      {/* Page Header with Breadcrumbs */}
      <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-5 shadow-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
            <Link to="/" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span>/</span>
            <Link to="/incidents" className="hover:text-cyan-400 transition-colors">
              Incidents
            </Link>
            <span>/</span>
            <span className="text-cyan-400 font-bold">{incident.id}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-950 rounded-xl border border-red-800 text-red-400">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Incident Report: {incident.id}
              </h1>
              <span className="text-xs font-mono text-slate-400">
                Sector: {incident.zone_name || incident.zone_id} • Recorded: {new Date(incident.event_time).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {correspondingZone && (
            <button
              onClick={() => navigate(`/zone/${correspondingZone.zone_id || correspondingZone.id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono shadow-md shadow-cyan-950/60"
            >
              <MapPin className="w-4 h-4" />
              <span>Inspect {incident.zone_id}</span>
            </button>
          )}

          <button
            onClick={() => navigate('/incidents')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300"
          >
            Back to List
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pre-Event AI Risk Score"
          value={Number(incident.risk_score_before_event).toFixed(2)}
          unit="/ 1.00"
          icon={Activity}
          status="critical"
          subText="Triggered Siren Protocol"
        />

        <StatCard
          title="Slope Deformation at Failure"
          value={incident.deformation_mm}
          unit="mm"
          icon={Ruler}
          status="critical"
          subText="Continuous Extensometer Breach"
        />

        <StatCard
          title="CV Crack Severity"
          value={incident.crack_severity}
          icon={Scan}
          status="warning"
          subText="YOLO Detection Confirmed"
        />

        <StatCard
          title="Incident Lifecycle Status"
          value={incident.status || 'RESOLVED'}
          icon={ShieldCheck}
          status={incident.status === 'ACTIVE EMERGENCY' ? 'critical' : 'safe'}
          subText="Geotechnical Safety Logged"
        />
      </div>

      {/* Detailed Post-Mortem Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environmental & Trigger Analysis */}
        <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <CloudRain className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Trigger & Environmental Context</h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[11px] uppercase mb-1">Weather & Precipitation</span>
              <strong className="text-white text-sm">{incident.weather_conditions}</strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[11px] uppercase mb-1">Alert Transmission Log</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${incident.alert_sent ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                <span className="text-slate-200">
                  {incident.alert_sent ? 'Automated Early Warning Siren dispatched to control room & site radios' : 'Alert not dispatched'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[11px] uppercase mb-1">Geotechnical Failure Mechanism</span>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                Tension crack propagation along bedding planes accelerated by rapid pore-water pressure accumulation after 42mm precipitation event.
              </p>
            </div>
          </div>
        </div>

        {/* Safety Team Response & Remediation */}
        <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Emergency Response Actions</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400 block text-[11px] uppercase mb-1">Action Logged by Dispatch</span>
              <strong className="text-cyan-300 text-sm block mb-2">{incident.action_taken}</strong>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero casualties; heavy haulers re-routed to North Ramp</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-xs text-emerald-300 space-y-1 font-sans">
              <strong className="block font-mono text-[11px] uppercase tracking-wider text-emerald-400">
                AI Continuous Learning Loop (Master Plan Section 1)
              </strong>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                Rockfall telemetry and failure parameters recorded into PostgreSQL database for future risk model weight calibration and geotechnical benchmarking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

