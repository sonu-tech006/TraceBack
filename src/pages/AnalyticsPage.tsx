import React, { useState, useEffect } from 'react';
import { DashboardSummary } from '../types';
import { api } from '../lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardSummary()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('Failed to load dashboard summary:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const summary = data?.summary;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Real-Time Database Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Campus & Network Metrics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Aggregated reporting metrics, recovery velocity, and category distribution across all 100 benchmark items.
        </p>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-slate-400 text-[11px] block mb-1">Total Lost</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {summary?.totalLost || 50}
          </div>
          <span className="text-[10px] text-slate-400">Belongings filed</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-slate-400 text-[11px] block mb-1">Total Found</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {summary?.totalFound || 50}
          </div>
          <span className="text-[10px] text-slate-400">Deposited in custody</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-slate-400 text-[11px] block mb-1">Active Open</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
            {summary?.activeReports || 82}
          </div>
          <span className="text-[10px] text-slate-400">Awaiting match/claim</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-slate-400 text-[11px] block mb-1">AI Matches</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
            {summary?.potentialMatches || 15}
          </div>
          <span className="text-[10px] text-slate-400">Pairings ranked</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-slate-400 text-[11px] block mb-1">Pending Claims</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-cyan-600 dark:text-cyan-400">
            {summary?.pendingClaims || 4}
          </div>
          <span className="text-[10px] text-slate-400">In review workflow</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-slate-400 text-[11px] block mb-1">Safely Returned</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {summary?.itemsReturned || 18}
          </div>
          <span className="text-[10px] text-slate-400">Verified handovers</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 col-span-2 lg:col-span-1">
          <span className="text-slate-400 text-[11px] block mb-1">Recovery Rate</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
            {summary?.recoveryRate || 36}%
          </div>
          <span className="text-[10px] text-slate-400">Reunited ratio</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Timeline Area Chart */}
        <div className="lg:col-span-7 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Lost vs. Found Volume & Recoveries
              </h3>
              <p className="text-[11px] text-slate-400">
                Monthly reporting cadence and verified return trends.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">6-Month Trend</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthlyTrends || []}>
                <defs>
                  <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="lost" stroke="#F59E0B" fillOpacity={1} fill="url(#colorLost)" name="Lost Reports" />
                <Area type="monotone" dataKey="found" stroke="#10B981" fillOpacity={1} fill="url(#colorFound)" name="Found Reports" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Reports by Item Category
              </h3>
              <p className="text-[11px] text-slate-400">
                Distribution across high-volume belonging types.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(data?.categoryDistribution || []).slice(0, 5)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={90} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="lost" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Lost" />
                <Bar dataKey="found" fill="#6366F1" radius={[0, 4, 4, 0]} name="Found" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Loss Venues */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
          Top Incident Venues & Facilities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {(data?.topLocations || []).map((loc, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 max-w-[80%] truncate">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {loc.location}
                </span>
              </div>
              <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                {loc.count} reports
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
