import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiCloud, 
  FiServer, 
  FiActivity, 
  FiBell, 
  FiRefreshCw, 
  FiList, 
  FiSettings, 
  FiLogOut, 
  FiMenu 
} from 'react-icons/fi';

/**
 * Sidebar Component for CloudOps-AI Dashboard
 * 
 * Styled entirely using Tailwind CSS utilities.
 * Integrates with react-router-dom <NavLink> for pathing & active state highlighting.
 * Collapses to a rail below 768px (md breakpoint).
 * 
 * @param {string} userName - Fallback username if auth context is not available.
 * @param {string} userAvatar - Optional avatar image URL.
 * @param {function} onLogout - Callback invoked prior to clearing tokens and redirecting.
 */
const Sidebar = ({ 
  userName: propUserName = 'Alex Rivera', 
  userAvatar = '', 
  onLogout = () => {} 
}) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);

  const menuItems = [
    { name: 'Dashboard', icon: FiHome, path: '/dashboard' },
    { name: 'AWS Accounts', icon: FiCloud, path: '/aws-accounts' },
    { name: 'EC2 Instances', icon: FiServer, path: '/instances' },
    { name: 'CloudWatch', icon: FiActivity, path: '/cloudwatch' },
    { name: 'Alerts', icon: FiBell, path: '/alerts' },
    { name: 'Auto Healing', icon: FiRefreshCw, path: '/auto-healing' },
    { name: 'Activity Logs', icon: FiList, path: '/logs' },
    { name: 'Settings', icon: FiSettings, path: '/settings' },
  ];

  // Monitor screen size to collapse/expand dynamically
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsCollapsed(false);
      } else {
        setIsCollapsed(true);
      }
    };

    handleResize(); // Execute once on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  const handleLogout = () => {
    // Clear credentials/auth tokens
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.clear();

    if (onLogout) {
      onLogout();
    }
    
    // Redirect to login page
    navigate('/login');
  };

  // Extract initials for placeholder avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Auth Context dynamic binding
  // Checks window.useAuth or window.AuthContext for modular extraction, falling back to props.
  const useFallbackAuth = () => null;
  const useAuthHook = window.useAuth || useFallbackAuth;
  const authFromHook = useAuthHook();

  const fallbackContext = React.createContext(null);
  const contextToUse = window.AuthContext || fallbackContext;
  const authFromContext = useContext(contextToUse);

  const auth = authFromHook || authFromContext;
  const finalUserName = auth?.user?.name || auth?.username || propUserName;

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col z-50 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      } md:w-64`}
    >
      {/* Brand Header */}
      <div 
        className={`p-4 flex items-center border-b border-slate-800 h-16 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2 font-bold text-white text-lg tracking-wide select-none">
              <FiCloud className="text-blue-500 animate-pulse" size={22} />
              <span>CloudOps<span className="text-blue-500">-AI</span></span>
            </div>
            <button 
              onClick={toggleCollapse}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors duration-200"
              aria-label="Collapse sidebar"
            >
              <FiMenu size={20} />
            </button>
          </>
        ) : (
          <button 
            onClick={toggleCollapse}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors duration-200"
            aria-label="Expand sidebar"
          >
            <FiMenu size={20} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto overflow-x-hidden space-y-1.5 scrollbar-thin">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              aria-label={item.name}
              className={({ isActive }) => 
                `flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
            >
              <IconComponent className="flex-shrink-0" size={20} />
              {!isCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap transition-opacity duration-200">
                  {item.name}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Profile Section */}
      <div 
        className={`p-4 border-t border-slate-800 bg-slate-950/20 flex ${
          isCollapsed ? 'flex-col items-center gap-4' : 'items-center justify-between gap-3'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar / Placeholder */}
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={finalUserName} 
              className="w-9 h-9 rounded-full object-cover border border-slate-700 flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-md shadow-blue-900/30 select-none">
              {getInitials(finalUserName)}
            </div>
          )}
          
          {/* User Name Info */}
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {finalUserName}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                Operator
              </p>
            </div>
          )}
        </div>

        {/* Logout Toggle */}
        <button
          onClick={handleLogout}
          className={`p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors duration-200 flex items-center justify-center ${
            isCollapsed ? 'w-9 h-9' : ''
          }`}
          aria-label="Logout"
          title="Logout"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
