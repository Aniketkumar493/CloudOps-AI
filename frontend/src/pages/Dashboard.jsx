import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiServer,
  FiCpu,
  FiHardDrive,
  FiRefreshCw,
  FiAlertCircle,
  FiDatabase,
  FiArrowRight
} from 'react-icons/fi';
import api from '../api/api';

const Dashboard = () => {
  const [instances, setInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInstances = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError('');
    try {
      const response = await api.get('/monitoring/instances/');
      if (response.data && Array.isArray(response.data.results)) {
        setInstances(response.data.results);
      } else if (Array.isArray(response.data)) {
        setInstances(response.data);
      } else {
        setInstances([]);
      }
    } catch (err) {
      console.error('Fetch instances error:', err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to load EC2 instances. Please try again.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  const getStateBadge = (state) => {
    const s = state?.toLowerCase() || 'unknown';
    let badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-800/50';
    if (s === 'running') {
      badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50';
    } else if (s === 'stopped') {
      badgeColor = 'bg-slate-800/40 text-slate-400 border-slate-700/50';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s === 'running' ? 'bg-emerald-500 animate-pulse' : s === 'stopped' ? 'bg-slate-500' : 'bg-amber-500'}`}></span>
        {state || 'Unknown'}
      </span>
    );
  };

  const MetricBar = ({ label, value, icon: Icon }) => {
    const isAvailable = value !== null && value !== undefined;
    const percent = isAvailable ? Math.min(Math.max(value, 0), 100) : 0;
    
    let barColor = 'bg-blue-500';
    if (percent >= 90) {
      barColor = 'bg-red-500';
    } else if (percent >= 75) {
      barColor = 'bg-amber-500';
    }

    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1.5">
            {Icon && <Icon className="text-slate-500" size={13} />}
            {label}
          </span>
          <span className={isAvailable ? 'text-white' : 'text-slate-500 font-medium'}>
            {isAvailable ? `${percent.toFixed(1)}%` : 'N/A'}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
          {isAvailable ? (
            <div
              className={`h-full ${barColor} rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${percent}%` }}
            />
          ) : (
            <div className="h-full bg-slate-900/40 rounded-full flex items-center justify-center">
              <span className="text-[8px] text-slate-600 font-bold tracking-wider leading-none">NO DATA</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Refresh Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="!text-2xl md:!text-3xl !font-extrabold !text-white !tracking-tight !my-0 !leading-tight">
            Operations Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time status and health metrics for synced EC2 instances.
          </p>
        </div>
        <button
          onClick={() => fetchInstances(true)}
          disabled={isLoading || isRefreshing}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-955 border border-slate-800 disabled:opacity-50 text-slate-200 font-semibold text-sm rounded-lg transition duration-200 cursor-pointer shadow-md"
        >
          <FiRefreshCw className={`w-4 h-4 ${(isLoading || isRefreshing) ? 'animate-spin text-blue-500' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Main content grid */}
      {isLoading && !isRefreshing ? (
        // Skeleton loader grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="space-y-2.5">
                  <div className="h-5 w-32 bg-slate-800 rounded"></div>
                  <div className="h-3.5 w-40 bg-slate-800 rounded"></div>
                </div>
                <div className="h-6 w-20 bg-slate-800 rounded-full"></div>
              </div>
              <div className="space-y-4">
                <div className="h-10 bg-slate-800/40 rounded-lg animate-pulse"></div>
                <div className="h-10 bg-slate-800/40 rounded-lg animate-pulse"></div>
                <div className="h-10 bg-slate-800/40 rounded-lg animate-pulse"></div>
              </div>
              <div className="h-4 w-24 bg-slate-800 rounded"></div>
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
            <h4 className="font-bold text-white text-lg">Failed to retrieve telemetry</h4>
            <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => fetchInstances(false)}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition duration-200 cursor-pointer border border-slate-700 shadow-md"
          >
            Retry Fetch
          </button>
        </div>
      ) : instances.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-slate-800 bg-slate-900/20 rounded-2xl text-center space-y-5 shadow-inner">
          <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-lg shadow-blue-900/5 animate-pulse">
            <FiServer size={28} />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-white">No instances found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect an AWS account and sync instances to get started monitoring your workloads.
            </p>
          </div>
          <Link
            to="/aws-accounts"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs rounded-lg transition duration-200 shadow-lg shadow-blue-950/30 cursor-pointer"
          >
            <span>Connect AWS Account</span>
            <FiArrowRight size={14} />
          </Link>
        </div>
      ) : (
        // Grid cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instances.map((instance) => (
            <div
              key={instance.id}
              className="bg-slate-900/55 hover:bg-slate-900 border border-slate-850 hover:border-blue-500/35 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 shadow-xl group hover:shadow-blue-950/5 relative overflow-hidden"
            >
              {/* Radial gradient hover effect */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-600/10 transition-all duration-300 animate-pulse"></div>

              <div className="space-y-5 relative z-10">
                {/* Instance Title & State */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-white truncate text-base group-hover:text-blue-400 transition-colors duration-200">
                      {instance.name || 'Unnamed Instance'}
                    </h3>
                    <span className="font-mono text-xs text-slate-500 tracking-wider block mt-0.5">
                      {instance.instance_id}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    {getStateBadge(instance.state)}
                  </div>
                </div>

                {/* Progress bars metrics */}
                <div className="space-y-3.5 bg-slate-950/45 p-4 rounded-xl border border-slate-850">
                  <MetricBar
                    label="CPU Utilization"
                    value={instance.cpu_utilization}
                    icon={FiCpu}
                  />
                  <MetricBar
                    label="Memory"
                    value={instance.memory_utilization}
                    icon={FiDatabase}
                  />
                  <MetricBar
                    label="Disk Space"
                    value={instance.disk_utilization}
                    icon={FiHardDrive}
                  />
                </div>
              </div>

              {/* Muted Details Footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500 font-semibold relative z-10">
                <span className="bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-850 font-mono text-[11px] text-slate-400">
                  {instance.instance_type}
                </span>
                <span className="italic text-[10px] text-slate-500">
                  Synced:{' '}
                  {new Date(instance.last_synced).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
