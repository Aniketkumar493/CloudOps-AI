import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiServer,
  FiRefreshCw,
  FiAlertCircle,
  FiCloud,
  FiArrowRight,
  FiInfo
} from 'react-icons/fi';
import api from '../api/api';

const EC2Instances = () => {
  const navigate = useNavigate();
  const [instances, setInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const fetchInstances = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
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
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setActionMessage({ type: '', text: '' });
    try {
      // POST without body triggers sync for all active credentials
      const response = await api.post('/monitoring/instances/sync/');
      setActionMessage({
        type: 'success',
        text: response.data?.message || 'Successfully triggered AWS EC2 inventory sync!'
      });
      // Re-fetch instances from database cache
      await fetchInstances(false);
      setTimeout(() => setActionMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      console.error('Sync trigger error:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to trigger AWS EC2 inventory sync.'
      });
      setTimeout(() => setActionMessage({ type: '', text: '' }), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStateBadge = (state) => {
    const s = state?.toLowerCase() || 'unknown';
    let badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-800/50';
    if (s === 'running') {
      badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50';
    } else if (s === 'stopped') {
      badgeColor = 'bg-slate-800/40 text-slate-450 border-slate-700/50';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s === 'running' ? 'bg-emerald-500 animate-pulse' : s === 'stopped' ? 'bg-slate-500' : 'bg-amber-500'}`}></span>
        {state || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="!text-2xl md:!text-3xl !font-extrabold !text-white !tracking-tight !my-0 !leading-tight">
            EC2 Instances
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Detailed list and metadata overview of AWS compute instances.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isLoading || isSyncing}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition duration-200 shadow-lg shadow-blue-900/30 cursor-pointer"
        >
          <FiRefreshCw className={`w-4 h-4 ${(isLoading || isSyncing) ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing AWS...' : 'Sync Now'}</span>
        </button>
      </div>

      {/* Action / Success Messages */}
      {actionMessage.text && (
        <div
          className={`p-3.5 rounded-xl border text-sm flex items-center gap-2.5 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
              : 'bg-red-950/40 border-red-800/50 text-red-300'
          }`}
        >
          <FiAlertCircle size={16} />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Main List Area */}
      {isLoading ? (
        // Loading State - Pulse skeleton table rows
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-pulse">
          <div className="h-12 bg-slate-950/50 border-b border-slate-800"></div>
          <div className="p-4 space-y-3.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex justify-between items-center py-2 border-b border-slate-850/40 last:border-0">
                <div className="h-4 w-1/4 bg-slate-800 rounded"></div>
                <div className="h-4 w-1/6 bg-slate-800 rounded"></div>
                <div className="h-4 w-1/12 bg-slate-800 rounded"></div>
                <div className="h-4 w-1/12 bg-slate-800 rounded-full"></div>
                <div className="h-4 w-1/12 bg-slate-800 rounded"></div>
                <div className="h-4 w-1/8 bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        // Error State
        <div className="p-8 bg-red-950/20 border border-red-900/30 rounded-2xl flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-900/10 border border-red-800/20 flex items-center justify-center text-red-500">
            <FiAlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-white text-lg">Error Loading Instances</h4>
            <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => fetchInstances(true)}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition duration-200 cursor-pointer border border-slate-700 shadow-md"
          >
            Try Again
          </button>
        </div>
      ) : instances.length === 0 ? (
        // Empty State (Dashboard style)
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
          <button
            onClick={() => navigate('/aws-accounts')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs rounded-lg transition duration-200 shadow-lg shadow-blue-950/30 cursor-pointer"
          >
            <span>Connect AWS Account</span>
            <FiArrowRight size={14} />
          </button>
        </div>
      ) : (
        // Data Table View
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Name/Tag</th>
                  <th className="py-4 px-6">Instance ID</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">State</th>
                  <th className="py-4 px-6">Region</th>
                  <th className="py-4 px-6 text-right">Last Synced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {instances.map((instance) => (
                  <tr
                    key={instance.id}
                    onClick={() => navigate(`/instances/${instance.id}`)}
                    className="hover:bg-slate-850/40 transition duration-150 cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {instance.name || 'Unnamed Instance'}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-450 group-hover:text-slate-200 transition-colors">
                      {instance.instance_id}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-slate-850">
                        {instance.instance_type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {getStateBadge(instance.state)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800/65 text-slate-350 border border-slate-750">
                        {instance.region || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-xs text-slate-450">
                      {new Date(instance.last_synced).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EC2Instances;
