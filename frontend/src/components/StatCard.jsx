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
    normal: 'border-slate-200 bg-white text-slate-700 shadow-sm',
    safe: 'border-emerald-200 bg-white text-emerald-600 shadow-sm',
    warning: 'border-amber-200 bg-white text-amber-600 shadow-sm',
    critical: 'border-red-200 bg-red-50 text-red-600 shadow-sm',
    stale: 'border-slate-200 bg-slate-50 text-slate-500 opacity-60'
  };

  const badgeStyles = {
    normal: 'bg-slate-50 text-slate-600',
    safe: 'bg-emerald-50/80 text-emerald-700 border border-emerald-200/60',
    warning: 'bg-amber-50/80 text-amber-700 border border-amber-200/60',
    critical: 'bg-red-50/80 text-red-700 border border-red-200/60 animate-pulse',
    stale: 'bg-slate-50 text-slate-500 border border-slate-200'
  };

  return (
    <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 ${statusStyles[status] || statusStyles.normal} ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-1.5 rounded-lg ${badgeStyles[status] || badgeStyles.normal}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">{value}</span>
        {unit && <span className="text-xs font-mono text-slate-500 font-medium">{unit}</span>}
      </div>

      {(subText || trend) && (
        <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
          {subText && <span className="text-slate-500">{subText}</span>}
          {trend && <span className="font-mono text-xs">{trend}</span>}
        </div>
      )}
    </div>
  );
}

