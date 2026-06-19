import React from 'react';

const StatusBadge = ({ status }) => {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

  const s = status ? status.toLowerCase() : '';

  if (['delivered', 'active', 'completed', 'success'].includes(s)) {
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['pending', 'processing'].includes(s)) {
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['cancelled', 'inactive', 'failed', 'error'].includes(s)) {
    colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['shipped'].includes(s)) {
    colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (['admin'].includes(s)) {
    colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${colorClass} capitalize`}>
      {status}
    </span>
  );
};

export default StatusBadge;
