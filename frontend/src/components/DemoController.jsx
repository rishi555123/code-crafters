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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-950 rounded-xl border border-cyan-800/60 text-cyan-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Demo Script Controller</span>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded">
                Section 6
              </span>
            </h2>
            <span className="text-xs font-mono text-slate-400">Target: {selectedZoneId}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scenarios List */}
      <div className="p-5 flex-1 overflow-y-auto space-y-4">
        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/50 text-xs text-cyan-300">
          <div className="font-bold flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hackathon Presentation Mode</span>
          </div>
          <p className="text-[11px] text-cyan-200/80 leading-relaxed">
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
                    ? 'border-cyan-500 bg-cyan-950/40 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500'
                    : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                      scenario.id === 1 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      scenario.id === 2 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      scenario.id === 3 ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse' :
                      'bg-purple-950 text-purple-400 border border-purple-800'
                    }`}>
                      {scenario.id}
                    </span>
                    <h3 className="text-xs font-bold text-white">{scenario.title}</h3>
                  </div>

                  <button
                    onClick={() => onTriggerScenario(scenario.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                      isActive
                        ? 'bg-cyan-600 text-slate-950 shadow-md shadow-cyan-950/60'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isActive ? 'Active' : 'Trigger'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                  {scenario.description}
                </p>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Expected:</span>
                  <span className="font-semibold text-slate-200">{scenario.expectedRisk}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* STALE Simulation Button */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
            Special Edge Cases
          </span>

          <button
            onClick={() => onToggleStale(selectedZoneId)}
            className={`w-full py-2.5 px-3 rounded-xl border font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              isStale
                ? 'bg-slate-800 border-slate-600 text-slate-200'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <WifiOff className="w-4 h-4 text-slate-400" />
            <span>{isStale ? 'Disable STALE (Reconnect)' : 'Simulate Network Drop (STALE Mode)'}</span>
          </button>
        </div>
      </div>

      {/* Footer Reset */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={() => onTriggerScenario(1)}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Stage 1 (Safe)</span>
        </button>

        <button
          onClick={onClose}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
        >
          Done
        </button>
      </div>
    </div>
  );
}

