import React, { useEffect } from 'react';
import { AlertOctagon, BellRing, ShieldAlert, ArrowRight, X, Volume2, VolumeX } from 'lucide-react';
import { soundService } from '../services/audio';

export default function AlertBanner({
  alertZones = [],
  onSelectZone,
  onAcknowledge,
  isMuted,
  onToggleSound
}) {
  if (!alertZones || alertZones.length === 0) return null;

  const primaryAlert = alertZones[0];

  useEffect(() => {
    // Fire continuous alarm when high-risk alert banner appears
    soundService.startContinuousAlarm();
    return () => {
      soundService.stopAlarm();
    };
  }, [alertZones]);

  return (
    <div className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-y-2 border-red-600 text-white px-4 py-3 shadow-2xl shadow-red-950/80 relative overflow-hidden animate-pulse-fast">
      {/* Background scanline pulse */}
      <div className="absolute inset-0 bg-red-500/10 pointer-events-none mix-blend-overlay"></div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 relative z-10">
        {/* Left: Icon & Alert Statement */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 bg-red-600 rounded-xl shadow-lg shadow-red-700/50 flex-shrink-0 animate-bounce">
            <AlertOctagon className="w-6 h-6 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-black font-extrabold text-[11px] px-2 py-0.5 rounded tracking-wider uppercase">
                EMERGENCY ALERT // GEOTECHNICAL FAILURE IMMINENT
              </span>
              <span className="font-mono text-xs text-red-200">
                {new Date(primaryAlert.last_updated || Date.now()).toLocaleTimeString()}
              </span>
            </div>

            <p className="text-sm font-bold text-red-100 mt-0.5">
              <span className="underline decoration-red-400 font-extrabold text-white text-base">
                {primaryAlert.zone_name || primaryAlert.zone_id}
              </span>
              {' '}— Risk Score:{' '}
              <span className="font-mono text-yellow-300 font-extrabold text-base">
                {Number(primaryAlert.risk_score).toFixed(2)} (HIGH)
              </span>
              {' • '}
              <span>Deformation: <strong>{primaryAlert.deformation_mm}mm</strong></span>
              {' • '}
              <span>Crack: <strong>{primaryAlert.crack_severity}</strong></span>
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => onSelectZone(primaryAlert.zone_id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all whitespace-nowrap"
          >
            <span>Focus Zone</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onAcknowledge(primaryAlert.zone_id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-red-500/50 text-red-200 text-xs font-semibold transition-all whitespace-nowrap"
          >
            <span>Acknowledge Siren</span>
          </button>
        </div>
      </div>
    </div>
  );
}

