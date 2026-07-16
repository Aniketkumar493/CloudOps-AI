import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiAlertCircle, FiInfo, FiRefreshCw } from 'react-icons/fi';
import api from '../api/api';
import StatusBadge from '../components/StatusBadge';
import RelativeTime from '../components/RelativeTime';

const Alerts = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAlerts = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch healing events endpoint (already ordered by triggered_at descending)
      const response = await api.get('/monitoring/healing-events/');
      const results = response.data?.results || response.data || [];
      setEvents(results);
    } catch (err) {
      console.error('Fetch alerts error:', err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to load active system alerts.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="!text-2xl md:!text-3xl !font-extrabold !text-white !tracking-tight !my-0 !leading-tight">
            System Alerts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time feed of infrastructure auto-healing notifications.
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 text-slate-200 border border-slate-800 font-semibold text-sm rounded-lg transition duration-200 shadow-md cursor-pointer"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Alerts List */}
      {isLoading ? (
        // Loading state
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/30">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex-shrink-0"></div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-1/4 bg-slate-800 rounded"></div>
                  <div className="h-4 w-1/8 bg-slate-800 rounded"></div>
                </div>
                <div className="h-4 w-2/3 bg-slate-800 rounded"></div>
                <div className="h-4 w-1/2 bg-slate-800 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Error state
        <div className="p-8 bg-red-950/20 border border-red-900/30 rounded-2xl flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-900/10 border border-red-800/20 flex items-center justify-center text-red-500">
            <FiAlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-white text-lg">Error Loading Alerts</h4>
            <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
          </div>
          <button
            onClick={fetchAlerts}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition duration-200 cursor-pointer border border-slate-700 shadow-md"
          >
            Try Again
          </button>
        </div>
      ) : events.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-24 px-4 border border-dashed border-slate-800 bg-slate-900/20 rounded-2xl text-center space-y-5 shadow-inner">
          <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-950/10 animate-bounce">
            <FiCheckCircle size={28} />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-white">All systems healthy</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No alerts — all systems healthy.
            </p>
          </div>
        </div>
      ) : (
        // Notification-style list
        <div className="space-y-4">
          {events.map((event) => {
            const isSuccess = event.status?.toLowerCase() === 'success';
            return (
              <div
                key={event.id}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition duration-200 ${
                  isSuccess
                    ? 'bg-emerald-950/10 border-emerald-900/30 hover:border-emerald-800/50'
                    : 'bg-red-950/10 border-red-900/30 hover:border-red-800/50'
                }`}
              >
                {/* Status-specific icon wrapper */}
                <div
                  className={`p-2.5 rounded-xl border flex-shrink-0 ${
                    isSuccess
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/30'
                      : 'bg-red-950/40 text-red-400 border-red-800/30'
                  }`}
                >
                  {isSuccess ? <FiCheckCircle size={20} /> : <FiAlertTriangle size={20} />}
                </div>

                {/* Content details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <span className="font-bold text-white text-base truncate">
                      {event.instance_name || 'Unknown Instance'}
                      <span className="text-xs text-slate-500 font-mono font-normal ml-2">
                        ({event.instance_aws_id || 'N/A'})
                      </span>
                    </span>
                    <div className="flex items-center gap-2.5 text-xs text-slate-450 self-start md:self-auto">
                      <StatusBadge status={event.status} />
                      <span className="text-slate-700">•</span>
                      <RelativeTime timestamp={event.triggered_at} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-400">Trigger:</span> {event.reason}
                  </p>
                  
                  {/* Detailed Action notes */}
                  <p className="text-xs text-slate-400 mt-2 flex items-start gap-2 bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-900/80">
                    <FiInfo size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong className="text-slate-350">Action taken:</strong> {event.action_taken} — {event.notes}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alerts;
