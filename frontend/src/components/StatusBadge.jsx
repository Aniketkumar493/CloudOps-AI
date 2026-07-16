import React from 'react';

/**
 * StatusBadge Component
 * Displays a styled badge with colored dot based on status.
 * Green for success, Red for failed, Slate/Gray for other statuses.
 */
const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase() || 'unknown';
  let badgeClasses = 'bg-slate-800/40 text-slate-400 border-slate-750/50';
  let dotClasses = 'bg-slate-500';

  if (s === 'success') {
    badgeClasses = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50';
    dotClasses = 'bg-emerald-500';
  } else if (s === 'failed') {
    badgeClasses = 'bg-red-950/40 text-red-400 border-red-800/50';
    dotClasses = 'bg-red-500';
  }

  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClasses}`}></span>
      {label}
    </span>
  );
};

export default StatusBadge;
