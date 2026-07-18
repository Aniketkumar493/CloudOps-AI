import React, { useState, useEffect } from 'react';
import { 
  FiServer, 
  FiCpu, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiActivity, 
  FiInfo, 
  FiRefreshCw 
} from 'react-icons/fi';
import api from '../api/api';

const CloudWatch = () => {
  const [instances, setInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInstances = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/monitoring/instances/');
      const results = response.data?.results || response.data || [];
      setInstances(results);
    } catch (err) {
      console.error('Fetch CloudWatch instances error:', err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to load instances status.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  // Compute stat values from instances array
  const totalMonitored = instances.length;
  const cpuActive = instances.filter(inst => inst.cpu_utilization !== null).length;
  const agentInstalled = instances.filter(
    inst => inst.memory_utilization !== null || inst.disk_utilization !== null
  ).length;
  const agentless = instances.filter(
    inst => inst.memory_utilization === null && inst.disk_utilization === null
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="!text-2xl md:!text-3xl !font-extrabold !text-white !tracking-tight !my-0 !leading-tight">
            CloudWatch Integration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global CloudWatch agent status and telemetry ingestion overview.
          </p>
        </div>
        <button
          onClick={fetchInstances}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 text-slate-200 border border-slate-800 font-semibold text-sm rounded-lg transition duration-200 shadow-md cursor-pointer"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-red-800/50 bg-red-950/40 text-red-300 text-sm flex items-center gap-2.5">
          <FiAlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Monitored */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-600/15 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-xs text-slate-455 uppercase tracking-wider font-bold">Total Monitored</span>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {isLoading ? <span className="inline-block w-8 h-8 bg-slate-800 rounded animate-pulse"></span> : totalMonitored}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-950/40 border border-blue-900/30 flex items-center justify-center text-blue-400 shadow-inner">
              <FiServer className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">
            Total registered compute resources
          </p>
        </div>

        {/* Card 2: CPU Ingestion Active */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-2xl group-hover:bg-emerald-600/15 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-xs text-slate-455 uppercase tracking-wider font-bold">CPU Data Active</span>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {isLoading ? <span className="inline-block w-8 h-8 bg-slate-800 rounded animate-pulse"></span> : cpuActive}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <FiCpu className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">
            Instances actively pushing CPU metrics
          </p>
        </div>

        {/* Card 3: Agent Installed (Memory/Disk) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl group-hover:bg-purple-600/15 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-xs text-slate-455 uppercase tracking-wider font-bold">Agent Installed</span>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {isLoading ? <span className="inline-block w-8 h-8 bg-slate-800 rounded animate-pulse"></span> : agentInstalled}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-950/40 border border-purple-900/30 flex items-center justify-center text-purple-400 shadow-inner">
              <FiCheckCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">
            With Memory/Disk CloudWatch Agent metrics
          </p>
        </div>

        {/* Card 4: Agentless (No Memory/Disk) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/10 rounded-full blur-2xl group-hover:bg-amber-600/15 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-xs text-slate-455 uppercase tracking-wider font-bold">Agentless</span>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {isLoading ? <span className="inline-block w-8 h-8 bg-slate-800 rounded animate-pulse"></span> : agentless}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-900/30 flex items-center justify-center text-amber-400 shadow-inner">
              <FiAlertCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4">
            Lacking native hypervisor agent extensions
          </p>
        </div>
      </div>

      {/* Explainer Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-950/40 border border-blue-900/30 flex items-center justify-center text-blue-400">
            <FiActivity size={16} />
          </div>
          <h2 className="text-lg font-bold text-white">How Telemetry Ingestion Works</h2>
        </div>

        <p className="text-sm text-slate-350 leading-relaxed">
          CloudWatch is AWS's native monitoring service. This app polls CloudWatch's get_metric_data API every 5 minutes via Celery Beat to collect CPU/Memory/Disk metrics, which power the charts on each instance's detail page.
        </p>

        <div className="border-t border-slate-800/80 pt-4 mt-2">
          <div className="flex items-start gap-2 bg-slate-950/40 p-4.5 rounded-xl border border-slate-800">
            <FiInfo className="text-blue-500 w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-400 space-y-1.5">
              <p className="font-semibold text-slate-300">Important Note on Agentless Monitoring:</p>
              <p>
                Standard EC2 instances provide hypervisor-level metrics like CPU utilization out of the box. However, Memory utilization and Disk utilization require installing the AWS CloudWatch Agent inside the OS on each instance. Instances marked as <span className="text-amber-400 font-semibold">Agentless</span> will only display CPU charts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudWatch;
