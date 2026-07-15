import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiServer,
  FiCpu,
  FiDatabase,
  FiHardDrive,
  FiAlertTriangle,
  FiInfo,
  FiClock
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import api from '../api/api';

const InstanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [instance, setInstance] = useState(null);
  const [metricsData, setMetricsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper to generate mock 24h telemetry metrics
  const generateMockMetrics = (instanceId) => {
    const mockHistory = [];
    const now = new Date();
    // Simulate no agent installed if instance ID ends with an even digit (0, 2, 4, 6, 8)
    const isAgentInstalled = instanceId ? !/[02468]$/.test(instanceId) : true;

    for (let i = 24; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      mockHistory.push({
        timeLabel: time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
        cpu: parseFloat((10 + Math.random() * 30 + Math.sin(i / 2) * 15 + 15).toFixed(1)),
        memory: isAgentInstalled ? parseFloat((40 + Math.random() * 8 + Math.cos(i / 3) * 5 + 5).toFixed(1)) : null,
        disk: isAgentInstalled ? parseFloat((30.2 + (24 - i) * 0.05 + Math.random() * 0.2).toFixed(1)) : null
      });
    }
    return mockHistory;
  };

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // 1. Fetch details by fetching the instances list and finding the matching ID
      const response = await api.get('/monitoring/instances/');
      let instanceList = [];
      if (response.data && Array.isArray(response.data.results)) {
        instanceList = response.data.results;
      } else if (Array.isArray(response.data)) {
        instanceList = response.data;
      }

      const match = instanceList.find((inst) => inst.id === parseInt(id));
      if (!match) {
        setError('Instance not found in the operations inventory.');
        setIsLoading(false);
        return;
      }
      setInstance(match);

      // 2. Fetch metrics
      try {
        const metricsResponse = await api.get(`/monitoring/instances/${match.id}/metrics/?hours=24`);
        if (metricsResponse.data && metricsResponse.data.length > 0) {
          const mapped = metricsResponse.data.map(item => {
            const time = new Date(item.timestamp);
            return {
              timeLabel: time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
              cpu: item.cpu_percent,
              memory: item.memory_percent,
              disk: item.disk_percent
            };
          });
          setMetricsData(mapped);
        } else {
          // Fallback to mock data if there are no data points in database for this instance
          setMetricsData(generateMockMetrics(match.instance_id));
        }
      } catch (err) {
        console.warn('Could not fetch real metrics, falling back to mock metrics:', err);
        setMetricsData(generateMockMetrics(match.instance_id));
      }

    } catch (err) {
      console.error('Fetch instance details error:', err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to retrieve instance operational metrics.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const getStateBadge = (state) => {
    const s = state?.toLowerCase() || 'unknown';
    let badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-800/50';
    if (s === 'running') {
      badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50';
    } else if (s === 'stopped') {
      badgeColor = 'bg-slate-800/40 text-slate-450 border-slate-700/50';
    }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
        <span className={`w-2 h-2 rounded-full mr-2 ${s === 'running' ? 'bg-emerald-500 animate-pulse' : s === 'stopped' ? 'bg-slate-500' : 'bg-amber-500'}`}></span>
        {state || 'Unknown'}
      </span>
    );
  };

  const isMemoryAvailable = metricsData.length > 0 && metricsData[0].memory !== null;
  const isDiskAvailable = metricsData.length > 0 && metricsData[0].disk !== null;

  return (
    <div className="space-y-6">
      {/* Top Back Action */}
      <div>
        <Link
          to="/instances"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors font-semibold group cursor-pointer"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Instances</span>
        </Link>
      </div>

      {isLoading ? (
        // Skeleton details page
        <div className="space-y-6 animate-pulse">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2.5">
                <div className="h-7 w-48 bg-slate-800 rounded"></div>
                <div className="h-4 w-64 bg-slate-800 rounded"></div>
              </div>
              <div className="h-8 w-24 bg-slate-800 rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-10 bg-slate-850/50 rounded-lg"></div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-slate-900 border border-slate-800 rounded-2xl"></div>
            <div className="h-80 bg-slate-900 border border-slate-800 rounded-2xl"></div>
          </div>
        </div>
      ) : error ? (
        // Error state
        <div className="p-8 bg-red-950/20 border border-red-900/30 rounded-2xl flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-900/10 border border-red-800/20 flex items-center justify-center text-red-500">
            <FiAlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-white text-lg">Operational Error</h4>
            <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
          </div>
          <button
            onClick={loadData}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition duration-200 cursor-pointer border border-slate-700 shadow-md"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        // Details View
        <div className="space-y-6">
          {/* Header Metadata Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                    <FiServer size={20} />
                  </div>
                  <h1 className="!text-xl md:!text-2xl !font-extrabold !text-white !my-0 !leading-tight">
                    {instance.name || 'Unnamed Instance'}
                  </h1>
                </div>
                <p className="text-xs text-slate-450 font-mono pl-13">
                  ID: {instance.instance_id}
                </p>
              </div>
              <div className="flex-shrink-0 md:text-right pl-13 md:pl-0">
                {getStateBadge(instance.state)}
              </div>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-sm">
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/50 space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Instance Type</span>
                <span className="font-mono font-bold text-white text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800 inline-block">
                  {instance.instance_type}
                </span>
              </div>
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/50 space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">AWS Region</span>
                <span className="font-semibold text-slate-200">
                  {instance.region || 'N/A'}
                </span>
              </div>
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/50 space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">IP Addresses</span>
                <div className="space-y-0.5 font-mono text-xs text-slate-350">
                  {instance.public_ip && <span className="block">Public: {instance.public_ip}</span>}
                  {instance.private_ip && <span className="block">Private: {instance.private_ip}</span>}
                  {!instance.public_ip && !instance.private_ip && <span>None</span>}
                </div>
              </div>
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/50 space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Last Synced</span>
                <div className="text-slate-400 text-xs flex items-center gap-1.5 pt-0.5">
                  <FiClock size={13} className="text-slate-500" />
                  <span>
                    {new Date(instance.last_synced).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CPU Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 lg:col-span-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FiCpu className="text-blue-500" size={16} />
                <span>CPU Utilization (%)</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#38bdf8', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="cpu" name="CPU" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Memory Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 lg:col-span-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FiDatabase className="text-purple-500" size={16} />
                <span>Memory Utilization (%)</span>
              </h3>
              {isMemoryAvailable ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#c084fc', fontSize: '12px' }}
                      />
                      <Line type="monotone" dataKey="memory" name="Memory" stroke="#a855f7" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center p-6 text-center bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
                  <FiAlertTriangle className="text-amber-500 animate-pulse" size={28} />
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-[200px] mx-auto">
                    Memory and disk metrics require the CloudWatch Agent to be installed on this instance.
                  </p>
                </div>
              )}
            </div>

            {/* Disk Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 lg:col-span-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FiHardDrive className="text-emerald-500" size={16} />
                <span>Disk Utilization (%)</span>
              </h3>
              {isDiskAvailable ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#34d399', fontSize: '12px' }}
                      />
                      <Line type="monotone" dataKey="disk" name="Disk" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center p-6 text-center bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
                  <FiAlertTriangle className="text-amber-500 animate-pulse" size={28} />
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-[200px] mx-auto">
                    Memory and disk metrics require the CloudWatch Agent to be installed on this instance.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default InstanceDetail;
