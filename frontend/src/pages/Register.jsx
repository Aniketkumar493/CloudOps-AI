import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiCloud, FiAlertCircle } from 'react-icons/fi';
import api from '../api/api';

const Register = () => {
  const navigate = useNavigate();

  // State for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

 const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validations
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // POST registration details to backend
      await api.post('/auth/register/', {
        email,
        password,
      });

      // Redirect to login page with a success message state
      navigate('/login', {
        state: { message: 'Registration successful! Please log in with your credentials.' },
        replace: true
      });
    } catch (err) {
      console.error('Registration error details:', err.response || err);
      // Clean display of the validation or generic errors returned by backend
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const errorKey = Object.keys(data)[0];
        const errorVal = data[errorKey];
        if (Array.isArray(errorVal)) {
          setError(`${errorKey.charAt(0).toUpperCase() + errorKey.slice(1)}: ${errorVal[0]}`);
        } else if (typeof errorVal === 'string') {
          setError(`${errorKey.charAt(0).toUpperCase() + errorKey.slice(1)}: ${errorVal}`);
        } else {
          setError(data.detail || data.error || 'Failed to register account.');
        }
      } else {
        setError('Failed to register. Please try again later.');
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
            <h2 className="text-xl font-bold text-white tracking-tight">Create your account</h2>
            <p className="text-slate-400 text-xs mt-1">Get started with CloudOps-AI SRE platform</p>
          </div>

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
              <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
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

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <FiLock size={16} />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition duration-150 cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 px-4 rounded-lg tracking-wide transition duration-150 shadow-lg shadow-blue-900/30 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </form>

          {/* Login Redirect Footer */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-450">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-500 hover:text-blue-400 font-semibold transition duration-150"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
