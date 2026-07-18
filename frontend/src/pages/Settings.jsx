import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUser, 
  FiBell, 
  FiAlertTriangle, 
  FiLogOut, 
  FiTrash2, 
  FiInfo 
} from 'react-icons/fi';
import api from '../api/api';

// Simple JWT decoder helper
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const Settings = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/auth/me/');
        if (response.data && response.data.email) {
          setEmail(response.data.email);
        } else {
          throw new Error('No email found in backend response');
        }
      } catch (err) {
        console.warn('Failed to fetch user profile, trying local storage decode...', err);
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        if (token) {
          const decoded = decodeToken(token);
          if (decoded && (decoded.email || decoded.username)) {
            setEmail(decoded.email || decoded.username);
          } else {
            setEmail('TODO: Email not available in token');
          }
        } else {
          setEmail('TODO: Email not available (no active session tokens)');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="!text-2xl md:!text-3xl !font-extrabold !text-white !tracking-tight !my-0 !leading-tight">
          Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-3xl">
        {/* Section A: Account */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-950/40 border border-blue-900/30 flex items-center justify-center text-blue-400">
              <FiUser size={16} />
            </div>
            <h2 className="text-lg font-bold text-white">Account Details</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4 pt-2">
            <div>
              <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Email Address</label>
              <div className="mt-1.5 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm select-all">
                {isLoading ? (
                  <span className="inline-block w-40 h-4 bg-slate-800 rounded animate-pulse"></span>
                ) : (
                  email
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section B: Notification Preferences */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-950/40 border border-blue-900/30 flex items-center justify-center text-blue-400">
              <FiBell size={16} />
            </div>
            <h2 className="text-lg font-bold text-white">Notification Preferences</h2>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-800/60">
            <div className="space-y-0.5 max-w-[80%]">
              <h3 className="text-sm font-semibold text-slate-200">Email alerts on auto-healing events</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                Receive notification updates if CPU/Disk/Memory triggers remediation tasks.
              </p>
            </div>
            {/* Custom switch button */}
            <button
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                emailAlerts ? 'bg-blue-600' : 'bg-slate-800'
              }`}
              aria-label="Toggle email alerts"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  emailAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 italic mt-2">
            <FiInfo size={12} />
            <span>TODO: Notification state is currently UI-only and not synced to the backend.</span>
          </div>
        </div>

        {/* Section C: Danger Zone */}
        <div className="bg-slate-900 border border-red-950/50 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 text-red-400">
            <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-900/30 flex items-center justify-center">
              <FiAlertTriangle size={16} />
            </div>
            <h2 className="text-lg font-bold">Danger Zone</h2>
          </div>

          <p className="text-xs text-slate-450 leading-relaxed">
            Actions below are irreversible or terminate your active console session.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-850 hover:bg-slate-800 active:bg-slate-900 text-white font-semibold text-sm rounded-lg transition duration-200 cursor-pointer shadow-md"
            >
              <FiLogOut size={16} />
              <span>Log Out</span>
            </button>

            {/* Tooltip Wrapper */}
            <div className="relative group w-full sm:w-auto">
              <button
                disabled
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-red-950/20 text-red-500/50 border border-red-950/50 font-semibold text-sm rounded-lg cursor-not-allowed"
              >
                <FiTrash2 size={16} />
                <span>Delete Account</span>
              </button>
              
              {/* Tooltip text */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-205 shadow-xl whitespace-nowrap z-10">
                Coming soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
