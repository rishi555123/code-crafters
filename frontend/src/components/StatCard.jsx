import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  unit = '', 
  icon: Icon, 
  status = 'normal', 
  subText, 
  trend,
  className = '' 
}) {
  const statusStyles = {
    normal: 'border-slate-800 bg-slate-900/70 text-slate-200',
    safe: 'border-emerald-900/60 bg-emerald-950/20 text-emerald-400',
    warning: 'border-amber-900/60 bg-amber-950/20 text-amber-400',
    critical: 'border-red-900/60 bg-red-950/30 text-red-400 shadow-lg shadow-red-950/40',
    stale: 'border-slate-800 bg-slate-900/30 text-slate-400 opacity-60'
  };

  const badgeStyles = {
    normal: 'bg-slate-800 text-slate-300',
    safe: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60',
    warning: 'bg-amber-950/80 text-amber-300 border border-amber-800/60',
    critical: 'bg-red-950/80 text-red-300 border border-red-800/60 animate-pulse',
    stale: 'bg-slate-800 text-slate-400 border border-slate-700'
  };

  return (
    <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 ${statusStyles[status] || statusStyles.normal} ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-1.5 rounded-lg ${badgeStyles[status] || badgeStyles.normal}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-2xl font-bold font-mono tracking-tight text-white">{value}</span>
        {unit && <span className="text-xs font-mono text-slate-400 font-medium">{unit}</span>}
      </div>

      {(subText || trend) && (
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
          {subText && <span className="text-slate-400">{subText}</span>}
          {trend && <span className="font-mono text-xs">{trend}</span>}
        </div>
      )}
    </div>
  );
}

