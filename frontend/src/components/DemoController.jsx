import React from 'react';
import { 
  X, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Sliders, 
  WifiOff, 
  Zap, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { DEMO_SCENARIOS } from '../constants/zones';

export default function DemoController({
  isOpen,
  onClose,
  currentScenarioId,
  onTriggerScenario,
  selectedZoneId = 'SLOPE_A',
  onToggleStale,
  isStale
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-50 border-l border-slate-200 shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-50 rounded-xl border border-cyan-200/60 text-cyan-600">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Demo Script Controller</span>
              <span className="text-[10px] font-mono bg-cyan-50 text-cyan-600 border border-cyan-200 px-1.5 py-0.2 rounded">
                Section 6
              </span>
            </h2>
            <span className="text-xs font-mono text-slate-500">Target: {selectedZoneId}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scenarios List */}
      <div className="p-5 flex-1 overflow-y-auto space-y-4">
        <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-700">
          <div className="font-bold flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hackathon Presentation Mode</span>
          </div>
          <p className="text-[11px] text-cyan-700/80 leading-relaxed">
            Trigger the 4 live stages in order during the demo. Stage 3 demonstrates the <strong>2-consecutive reading hysteresis</strong> before triggering the audio alert banner!
          </p>
        </div>

        <div className="space-y-3">
          {Object.values(DEMO_SCENARIOS).map((scenario) => {
            const isActive = currentScenarioId === scenario.id;

            return (
              <div
                key={scenario.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? 'border-cyan-500 bg-cyan-50/40 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                      scenario.id === 1 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      scenario.id === 2 ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      scenario.id === 3 ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' :
                      'bg-purple-50 text-purple-600 border border-purple-200'
                    }`}>
                      {scenario.id}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{scenario.title}</h3>
                  </div>

                  <button
                    onClick={() => onTriggerScenario(scenario.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/60'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isActive ? 'Active' : 'Trigger'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                  {scenario.description}
                </p>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Expected:</span>
                  <span className="font-semibold text-slate-700">{scenario.expectedRisk}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* STALE Simulation Button */}
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
            Special Edge Cases
          </span>

          <button
            onClick={() => onToggleStale(selectedZoneId)}
            className={`w-full py-2.5 px-3 rounded-xl border font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              isStale
                ? 'bg-slate-50 border-slate-300 text-slate-700'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <WifiOff className="w-4 h-4 text-slate-500" />
            <span>{isStale ? 'Disable STALE (Reconnect)' : 'Simulate Network Drop (STALE Mode)'}</span>
          </button>
        </div>
      </div>

      {/* Footer Reset */}
      <div className="p-4 bg-white/90 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={() => onTriggerScenario(1)}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Stage 1 (Safe)</span>
        </button>

        <button
          onClick={onClose}
          className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
        >
          Done
        </button>
      </div>
    </div>
  );
}

