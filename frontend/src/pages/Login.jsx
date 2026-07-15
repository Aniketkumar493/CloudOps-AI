import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiCloud, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import api from '../api/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if there is a success message from registration
  const successMessage = location.state?.message || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login/', {
        email,
        password,
      });
      
      const { access, refresh } = response.data;
      
      // Store in localStorage matching keys used by api.js
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error details:', err.response || err);
      // Clean display of the error returned by backend or fallbacks
      const status = err.response?.status;
      if (status === 401) {
        setError('Invalid email or password.');
      } else {
        setError(
          err.response?.data?.detail || 
          err.response?.data?.error || 
          'Something went wrong. Please try again later.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background radial highlights */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 transition duration-300">
        {/* Logo/Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/5 mb-3">
            <FiCloud size={32} className="animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight text-center">
            CloudOps<span className="text-blue-500">-AI</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1 text-center font-medium">
            Autonomous Cloud Infrastructure Operations
          </p>
        </div>

        {/* Card wrapper */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">Welcome back</h2>
            <p className="text-slate-400 text-xs mt-1">Sign in to access your operations dashboard</p>
          </div>

          {/* Success messages */}
          {successMessage && !error && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 rounded-xl text-xs flex items-center gap-2.5">
              <FiCheckCircle size={16} className="flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error messages */}
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/50 text-red-300 rounded-xl text-xs flex items-center gap-2.5">
              <FiAlertCircle size={16} className="flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <FiMail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition duration-150"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <FiLock size={16} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition duration-150 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 px-4 rounded-lg tracking-wide transition duration-150 shadow-lg shadow-blue-900/30 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </button>
          </form>

          {/* Registration Redirect Footer */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-450">
              New to CloudOps-AI?{' '}
              <Link
                to="/register"
                className="text-blue-500 hover:text-blue-400 font-semibold transition duration-150"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
