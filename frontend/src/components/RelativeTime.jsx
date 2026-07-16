import React from 'react';

/**
 * Helper function to calculate relative time.
 * Falls back to simple locale date representation if > 7 days.
 */
function getRelativeTimeString(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  
  if (isNaN(diffMs)) return 'Invalid date';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  // Handle future dates or small timezone skew
  if (diffSec < 5) return 'just now';

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

/**
 * RelativeTime Component
 * Displays a relative time string (e.g. "2 hours ago")
 * and shows the full local date/time on mouse hover.
 */
const RelativeTime = ({ timestamp }) => {
  if (!timestamp) return <span className="text-slate-500">N/A</span>;
  
  const relativeStr = getRelativeTimeString(timestamp);
  const fullDateStr = new Date(timestamp).toLocaleString();

  return (
    <span title={fullDateStr}>
      {relativeStr}
    </span>
  );
};

export default RelativeTime;
