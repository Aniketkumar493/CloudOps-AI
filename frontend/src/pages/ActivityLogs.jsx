import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiAlertCircle, FiList, FiRefreshCw } from 'react-icons/fi';
import api from '../api/api';
import StatusBadge from '../components/StatusBadge';
import RelativeTime from '../components/RelativeTime';

const ActivityLogs = () => {
  const [events, setEvents] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch helper
  const fetchEvents = useCallback(async (isInitial = true, currentStatus = statusFilter, currentSearch = searchFilter) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError('');

    try {
      let endpoint = '/monitoring/healing-events/';
      let params = {};

      if (!isInitial && nextUrl) {
        // Use the relative path part of nextUrl to fetch the next page
        const urlObj = new URL(nextUrl);
        endpoint = urlObj.pathname;
        params = Object.fromEntries(urlObj.searchParams.entries());
      } else {
        if (currentStatus !== 'All') {
          params.status = currentStatus.toLowerCase();
        }
        if (currentSearch.trim() !== '') {
          params.search = currentSearch;
        }
      }

      const response = await api.get(endpoint, { params });
      
      const newEvents = response.data?.results || response.data || [];
      const nextLink = response.data?.next || null;

      if (isInitial) {
        setEvents(newEvents);
      } else {
        setEvents((prev) => [...prev, ...newEvents]);
      }
      setNextUrl(nextLink);
    } catch (err) {
      console.error('Fetch healing events error:', err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to load activity logs.'
      );
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [nextUrl, statusFilter, searchFilter]);

  // Handle filter changes (debounced search)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEvents(true, statusFilter, searchFilter);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [statusFilter, searchFilter, fetchEvents]);

  const handleLoadMore = () => {
    if (nextUrl) {
      fetchEvents(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="!text-2xl md:!text-3xl !font-extrabold !text-white !tracking-tight !my-0 !leading-tight">
            Activity Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit history of all triggered auto-healing execution logs.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by instance name..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition duration-150"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-bold whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-blue-500 transition duration-150 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Main List / Table */}
      {isLoading ? (
        // Loading skeleton
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-pulse">
          <div className="h-12 bg-slate-950/50 border-b border-slate-800"></div>
          <div className="p-4 space-y-3.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex justify-between items-center py-2 border-b border-slate-850/40 last:border-0">
                <div className="h-4 w-1/4 bg-slate-800 rounded"></div>
                <div className="h-4 w-1/3 bg-slate-800 rounded"></div>
                <div className="h-4 w-1/12 bg-slate-800 rounded-full"></div>
                <div className="h-4 w-1/8 bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        // Error state
        <div className="p-8 bg-red-950/20 border border-red-900/30 rounded-2xl flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-900/10 border border-red-800/20 flex items-center justify-center text-red-500">
            <FiAlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-white text-lg">Error Loading Logs</h4>
            <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => fetchEvents(true)}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition duration-200 cursor-pointer border border-slate-700 shadow-md"
          >
            Try Again
          </button>
        </div>
      ) : events.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-slate-800 bg-slate-900/20 rounded-2xl text-center space-y-5 shadow-inner">
          <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 shadow-lg">
            <FiList size={28} />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-white">No activity yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No activity yet — auto-healing events will appear here once triggered.
            </p>
          </div>
        </div>
      ) : (
        // Table view
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6">Instance name</th>
                    <th className="py-4 px-6">Reason</th>
                    <th className="py-4 px-6">Action Taken</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-350">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-850/40 transition duration-150">
                      <td className="py-4 px-6 font-semibold text-white">
                        <div>{event.instance_name || 'Unknown Instance'}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{event.instance_aws_id}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {event.reason}
                      </td>
                      <td className="py-4 px-6 text-xs font-mono">
                        <span className="bg-slate-950/60 px-2 py-1 rounded border border-slate-850 text-slate-400">
                          {event.action_taken}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={event.status} />
                      </td>
                      <td className="py-4 px-6 text-right text-xs">
                        <RelativeTime timestamp={event.triggered_at} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Load More Button */}
          {nextUrl && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 text-slate-200 font-semibold text-sm rounded-lg transition duration-200 cursor-pointer shadow-md"
              >
                {isLoadingMore ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading more...</span>
                  </>
                ) : (
                  <span>Load More</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
