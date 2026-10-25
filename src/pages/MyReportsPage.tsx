import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ItemCard } from '../components/ItemCard';
import { PlusCircle, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface MyReportsPageProps {
  onSelectItem: (item: Item) => void;
  onOpenReport: () => void;
  onViewMatches: (item: Item) => void;
}

export const MyReportsPage: React.FC<MyReportsPageProps> = ({
  onSelectItem,
  onOpenReport,
  onViewMatches,
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'lost' | 'found'>('all');

  const fetchMyReports = () => {
    if (!user) return;
    setLoading(true);
    api.getItems({ userId: user.id, limit: 50 })
      .then((res) => {
        setItems(res.items || []);
      })
      .catch((err) => {
        console.error('Error fetching my reports:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMyReports();
  }, [user]);

  const filtered = items.filter((i) => (tab === 'all' ? true : i.type === tab));

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Reported Belongings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your lost and found listings, track potential matches, and update recovery status.
          </p>
        </div>

        <button
          onClick={onOpenReport}
          className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>File New Report</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl self-start w-fit text-xs">
        <button
          onClick={() => setTab('all')}
          className={`px-3.5 py-1.5 font-semibold rounded-lg transition-colors ${
            tab === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All ({items.length})
        </button>
        <button
          onClick={() => setTab('lost')}
          className={`px-3.5 py-1.5 font-semibold rounded-lg transition-colors ${
            tab === 'lost'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Lost ({items.filter((i) => i.type === 'lost').length})
        </button>
        <button
          onClick={() => setTab('found')}
          className={`px-3.5 py-1.5 font-semibold rounded-lg transition-colors ${
            tab === 'found'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Found ({items.filter((i) => i.type === 'found').length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            No reports filed yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Have you misplaced something or discovered an unattended belonging on campus?
          </p>
          <button
            onClick={onOpenReport}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Create Your First Report
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div key={item.id} className="relative group">
              <ItemCard item={item} onSelect={onSelectItem} />
              {item.type === 'lost' && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewMatches(item);
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Search Matches for this item</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
