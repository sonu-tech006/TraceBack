import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [seedStatus, setSeedStatus] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.getSeedStatus(), api.getAuditLogs(), api.getDatabaseStatus()])
      .then(([statusRes, logsRes, dbRes]) => {
        setSeedStatus(statusRes);
        setAuditLogs(logsRes.logs || []);
        setDbStatus(dbRes);
      })
      .catch((err) => {
        console.error('Failed to load admin data:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset the benchmark dataset back to the default 100 verified items? Real user-created items will be preserved.')) {
      return;
    }
    setResetting(true);
    try {
      const res = await api.resetDemoData();
      setMessage(res.message);
      fetchData();
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo dataset');
    } finally {
      setResetting(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <Shield className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-900 dark:text-white text-base">
          Administrator Access Required
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please switch to the Administrator profile (Marcus Vance) using the top navigation profile menu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 text-xs">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
          <Shield className="w-3.5 h-3.5" />
          <span>Campus Administration Console</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          System Management & Audit Logs
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspect immutable audit trails, monitor database integrity, and safely reset benchmark items.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Live Database Connection (.env) */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Database Connection (.env)
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configured via <code className="font-mono text-indigo-600 dark:text-indigo-400">MONGODB_URI</code> in environment file.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
              dbStatus?.connected
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
            }`}>
              {dbStatus?.status || 'Active (Local Persistent Fallback)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono tabular-nums text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] block font-sans">Active Engine / Driver</span>
            <span className="font-bold text-slate-900 dark:text-white font-sans">
              {dbStatus?.provider || 'MongoDB Atlas (Mongoose)'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 sm:col-span-2">
            <span className="text-slate-400 text-[10px] block font-sans">Connection String (.env MONGODB_URI)</span>
            <span className="text-indigo-600 dark:text-indigo-400 text-[11px] truncate block">
              {dbStatus?.uriRedacted || 'mongodb://sonukr7435_db_user:****@...'}
            </span>
          </div>
        </div>

        {dbStatus?.notice && (
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px]">
            <span className="font-semibold">Atlas Note: </span>
            {dbStatus.notice}. Ensure your MongoDB Atlas cluster Network Access allows connections from 0.0.0.0/0 (Anywhere).
          </div>
        )}
      </div>

      {/* Benchmark Demo Dataset Management */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              100-Item Benchmark Seed Status
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              50 lost reports & 50 found reports with verified paired candidates.
            </p>
          </div>

          <button
            onClick={handleResetDemoData}
            disabled={resetting}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Reset Benchmark Dataset (100 Items)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono tabular-nums">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] block">Total Items In Database</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {seedStatus?.totalItems || 100}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] block">Benchmark Items</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {seedStatus?.demoItemsTotal || 100}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] block">Seeded Lost Reports</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {seedStatus?.lostDemoCount || 50}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] block">Seeded Found Reports</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {seedStatus?.foundDemoCount || 50}
            </span>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Security & Handover Audit Trail
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Immutable system events recording claim reviews, handovers, and user operations.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Authorized User</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap tabular-nums">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
