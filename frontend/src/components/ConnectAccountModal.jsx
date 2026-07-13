import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiX } from 'react-icons/fi';
import api from '../api/api';

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
];

const ConnectAccountModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    access_key_id: '',
    secret_access_key: '',
    region: 'us-east-1',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Pre-validation
    if (!formData.access_key_id || !formData.secret_access_key) {
      setError('Access Key ID and Secret Access Key are required.');
      setIsLoading(false);
      return;
    }

    // Auto-generate name if empty
    const accountName = formData.name.trim() || `AWS-Account-${formData.access_key_id.slice(-4) || 'New'}`;

    try {
      await api.post('/monitoring/cloud-accounts/', {
        ...formData,
        name: accountName,
      });

      setSuccess('AWS Account successfully connected!');
      setTimeout(() => {
        onSuccess();
        onClose();
        setFormData({
          name: '',
          access_key_id: '',
          secret_access_key: '',
          region: 'us-east-1',
        });
        setSuccess('');
      }, 1500);
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to connect AWS Account';
      if (err.response?.data && typeof err.response.data === 'object') {
        const fieldErrors = Object.entries(err.response.data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
          .join('\n');
        setError(fieldErrors || errMsg);
      } else {
        setError(errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/30">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Connect AWS Account
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors duration-200"
            aria-label="Close modal"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-200 text-sm whitespace-pre-line animate-pulse">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-200 text-sm">
              {success}
            </div>
          )}

          {/* Account Alias */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Account Name / Alias
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Production AWS Account"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 focus:border-blue-600 rounded-lg text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-blue-600 transition duration-200 text-sm"
            />
          </div>

          {/* Access Key ID */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              AWS Access Key ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="access_key_id"
              required
              placeholder="AKIAIOSFODNN7EXAMPLE"
              value={formData.access_key_id}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 focus:border-blue-600 rounded-lg text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-blue-600 transition duration-200 text-sm font-mono"
            />
          </div>

          {/* Secret Access Key */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              AWS Secret Access Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                name="secret_access_key"
                required
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                value={formData.secret_access_key}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pl-3.5 pr-10 py-2 bg-slate-950/60 border border-slate-800 focus:border-blue-600 rounded-lg text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-blue-600 transition duration-200 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition duration-200"
                aria-label={showSecret ? 'Hide secret key' : 'Show secret key'}
              >
                {showSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Region */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              AWS Region
            </label>
            <select
              name="region"
              value={formData.region}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 focus:border-blue-600 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 transition duration-200 text-sm"
            >
              {AWS_REGIONS.map((region) => (
                <option key={region.value} value={region.value} className="bg-slate-900 text-slate-200">
                  {region.label} ({region.value})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 bg-slate-950/10 -mx-6 -mb-6 p-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition duration-200 shadow-md shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connecting...</span>
                </div>
              ) : (
                'Connect Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectAccountModal;
