import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiRefreshCw, 
  FiCheckCircle, 
  FiServer, 
  FiAlertCircle, 
  FiArrowRight, 
  FiZap 
} from 'react-icons/fi';
import api from '../api/api';
import StatusBadge from '../components/StatusBadge';
import RelativeTime from '../components/RelativeTime';

const AutoHealing = () => {

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/monitoring/healing-events/');
      const results = response.data?.results || response.data || [];
      setEvents(results);
    } catch (err) {
      console.error('Fetch auto healing events error:', err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to load auto-healing statistics.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Compute stats
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const eventsThisWeek = events.filter(e => new Date(e.triggered_at) >= oneWeekAgo);
  const totalEventsThisWeek = eventsThisWeek.length;
  
  const successEventsThisWeek = eventsThisWeek.filter(e => e.status?.toLowerCase() === 'success');
  const successRate = totalEventsThisWeek > 0 
    ? Math.round((successEventsThisWeek.length / totalEventsThisWeek) * 100) 
    : 100;

  const mostRecentSuccess = events.find(e => e.status?.toLowerCase() === 'success');
  const mostRecentlyHealedInstance = mostRecentSuccess 
    ? mostRecentSuccess.instance_name 
    : 'None';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="!text-2xl md:!text-3xl !font-extrabold !text-white !tracking-tight !my-0 !leading-tight">
            Auto Healing
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated issue remediation policies and action logs.
          </p>
        </div>
      </div>

      {/* Top Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat 1: Events this week */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-600/15 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-xs text-slate-450 uppercase tracking-wider font-bold">Events This Week</span>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {isLoading ? <span className="inline-block w-8 h-8 bg-slate-800 rounded animate-pulse"></span> : totalEventsThisWeek}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-950/40 border border-blue-900/30 flex items-center justify-center text-blue-400 shadow-inner">
              <FiRefreshCw className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">
            Triggered auto-remediations in the last 7 days
          </p>
        </div>

        {/* Stat 2: Success Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-2xl group-hover:bg-emerald-600/15 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-xs text-slate-450 uppercase tracking-wider font-bold">Success Rate</span>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {isLoading ? <span className="inline-block w-8 h-8 bg-slate-800 rounded animate-pulse"></span> : `${successRate}%`}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <FiCheckCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">
            Ratio of successful auto-healing workflows
          </p>
        </div>

        {/* Stat 3: Most Recently Healed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl group-hover:bg-purple-600/15 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <div className="space-y-2 max-w-[70%]">
              <span className="text-xs text-slate-450 uppercase tracking-wider font-bold">Most Recently Healed</span>
              <h3 className="text-lg font-bold text-white truncate tracking-tight">
                {isLoading ? <span className="inline-block w-32 h-6 bg-slate-800 rounded animate-pulse"></span> : mostRecentlyHealedInstance}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-950/40 border border-purple-900/30 flex items-center justify-center text-purple-400 shadow-inner">
              <FiServer className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">
            Latest successfully recovered EC2 instance
          </p>
        </div>
      </div>

      {/* Main Section split: Event feed + How it works */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Last 10 events */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent Executions</h2>
            <Link 
              to="/logs" 
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
            >
              <span>View all in Activity Logs</span>
              <FiArrowRight size={13} />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-16 bg-slate-850 rounded-xl"></div>
              ))}
            </div>
          ) : error ? (
            <div className="py-10 text-center text-slate-450 flex flex-col items-center justify-center gap-2">
              <FiAlertCircle size={24} className="text-red-500" />
              <p className="text-sm">{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No activity yet — auto-healing events will appear here once triggered.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {events.slice(0, 10).map((event) => {
                return (
                  <div key={event.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate text-sm">
                        {event.instance_name || 'Unknown Instance'}
                        <span className="text-[10px] text-slate-500 font-mono font-normal ml-2">
                          ({event.instance_aws_id})
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">
                        {event.reason}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={event.status} />
                      <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                        <RelativeTime timestamp={event.triggered_at} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Explanatory Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-full justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-950/40 border border-blue-900/30 flex items-center justify-center text-blue-400">
                <FiZap size={16} />
              </div>
              <h2 className="text-lg font-bold text-white">How Auto-Healing Works</h2>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              CloudOps-AI runs a highly resilient, closed-loop remediation pipeline that mitigates common node resource and failure events without operator overhead.
            </p>

            {/* Stepper design */}
            <div className="space-y-4 pt-2">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-blue-600/10 border border-blue-500 text-[10px] font-bold text-blue-400 flex items-center justify-center">1</div>
                  <div className="w-0.5 h-8 bg-slate-800 mt-1"></div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Threshold Breach</h4>
                  <p className="text-[10px] text-slate-450 leading-normal">
                    CPU utilization spikes &gt; 90% for 15 minutes (or memory/disk limits exceed safe threshold).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-blue-600/10 border border-blue-500 text-[10px] font-bold text-blue-400 flex items-center justify-center">2</div>
                  <div className="w-0.5 h-8 bg-slate-800 mt-1"></div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Celery Workflow Task</h4>
                  <p className="text-[10px] text-slate-450 leading-normal">
                    Celery Beat catches metric alarm event, references policies, and fires healing action.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600/10 border border-blue-500 text-[10px] font-bold text-blue-400 flex items-center justify-center flex-shrink-0">3</div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">AWS Reboot via Boto3</h4>
                  <p className="text-[10px] text-slate-450 leading-normal">
                    The backend triggers secure reboot commands on target instances and logs immutable events.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 mt-6">
            <div className="flex items-center justify-between text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-900">
              <span className="text-slate-500">Runbook Version:</span>
              <span className="font-mono text-slate-400 font-semibold">v1.2.0-stable</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AutoHealing;
