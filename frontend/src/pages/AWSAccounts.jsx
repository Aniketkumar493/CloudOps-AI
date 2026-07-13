import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCloud, FiAlertCircle } from 'react-icons/fi';
import api from '../api/api';
import ConnectAccountModal from '../components/ConnectAccountModal';

const AWSAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/monitoring/cloud-accounts/');
      if (response.data && Array.isArray(response.data.results)) {
        setAccounts(response.data.results);
      } else if (Array.isArray(response.data)) {
        setAccounts(response.data);
      } else {
        setAccounts([]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load AWS accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDisconnect = async (id, name) => {
    if (!window.confirm(`Are you sure you want to disconnect account "${name}"?`)) {
      return;
    }

    setActionMessage({ type: '', text: '' });
    try {
      await api.delete(`/monitoring/cloud-accounts/${id}/`);
      setActionMessage({ type: 'success', text: `Successfully disconnected "${name}".` });
      fetchAccounts();
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.detail || err.message || `Failed to disconnect "${name}".`,
      });
      setTimeout(() => setActionMessage({ type: '', text: '' }), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            AWS Accounts
          </h1>
          <p className="text-sm text-slate-455 mt-1">
            Connect and manage your AWS credentials to monitor cloud resources.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-lg transition duration-200 shadow-lg shadow-blue-900/30 cursor-pointer"
        >
          <FiPlus size={16} />
          <span>Connect Account</span>
        </button>
      </div>

      {/* Alert Messages */}
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
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Fetching accounts...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-950/30 border border-red-900/40 rounded-2xl flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
          <FiAlertCircle className="text-red-500" size={32} />
          <h4 className="font-bold text-white">Error Loading Accounts</h4>
          <p className="text-slate-400 text-sm">{error}</p>
          <button
            onClick={fetchAccounts}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition duration-200 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-slate-800 bg-slate-900/20 rounded-2xl text-center space-y-4">
          <div className="w-14 h-14 bg-slate-905 border border-slate-800 rounded-full flex items-center justify-center text-blue-500 shadow-inner">
            <FiCloud size={24} />
          </div>
          <div className="max-w-sm space-y-1">
            <h3 className="text-base font-bold text-white">No AWS accounts connected yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect your first AWS credential pair to discover and monitor EC2 instances and retrieve CloudWatch telemetry.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/25 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer"
          >
            Get Started
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Account Alias</th>
                  <th className="py-4 px-6">Region</th>
                  <th className="py-4 px-6 font-mono">Access Key ID</th>
                  <th className="py-4 px-6">Connected on</th>
                  <th className="py-4 px-6 text-center">EC2 Instances</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-850/40 transition duration-150">
                    <td className="py-4 px-6 font-semibold text-white">
                      {account.name}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {account.region}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      {account.access_key_id}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {new Date(account.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-white">
                      {account.instance_count !== undefined ? account.instance_count : 0}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDisconnect(account.id, account.name)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition duration-200 cursor-pointer"
                        title="Disconnect AWS Account"
                        aria-label="Disconnect account"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <ConnectAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAccounts}
      />
    </div>
  );
};

export default AWSAccounts;
