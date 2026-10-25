import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { api } from '../lib/api';
import { ItemCard } from '../components/ItemCard';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Camera,
  RefreshCw,
} from 'lucide-react';

interface ExplorePageProps {
  initialType?: 'all' | 'lost' | 'found';
  initialSearch?: string;
  initialCategory?: string;
  onSelectItem: (item: Item) => void;
  onOpenReport: (type?: 'lost' | 'found') => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  initialType = 'all',
  initialSearch = '',
  initialCategory = 'All',
  onSelectItem,
  onOpenReport,
}) => {
  const [typeTab, setTypeTab] = useState<'all' | 'lost' | 'found'>(initialType);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState('All');
  const [status, setStatus] = useState('All');
  const [hasImage, setHasImage] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Load items when filters change
  const fetchItems = () => {
    setLoading(true);
    api.getItems({
      type: typeTab === 'all' ? undefined : typeTab,
      search: search.trim() || undefined,
      category: category !== 'All' ? category : undefined,
      city: city !== 'All' ? city : undefined,
      status: status !== 'All' ? status : undefined,
      hasImage: hasImage ? 'true' : undefined,
      sortBy,
      page,
      limit,
    })
      .then((res) => {
        setItems(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      })
      .catch((err) => {
        console.error('Error fetching items:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, [typeTab, search, category, city, status, hasImage, sortBy, page]);

  const categories = [
    'All',
    'Electronics',
    'Bags & Luggage',
    'Keys & Badges',
    'Personal Accessories',
    'Documents & IDs',
    'Clothing & Footwear',
    'Books & Stationery',
    'Others',
  ];

  const cities = ['All', 'Cambridge', 'Boston', 'San Francisco', 'Chicago', 'Seattle', 'New York'];

  const activeFilterCount =
    (category !== 'All' ? 1 : 0) +
    (city !== 'All' ? 1 : 0) +
    (status !== 'All' ? 1 : 0) +
    (hasImage ? 1 : 0) +
    (search ? 1 : 0);

  const clearAllFilters = () => {
    setSearch('');
    setCategory('All');
    setCity('All');
    setStatus('All');
    setHasImage(false);
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Header & Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Explore Belongings Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search 100 indexed reports across university campuses, transit stations, and venues.
          </p>
        </div>

        {/* Functional segmented tab buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => {
              setTypeTab('all');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              typeTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => {
              setTypeTab('lost');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              typeTab === 'lost'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => {
              setTypeTab('found');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              typeTab === 'found'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Found
          </button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by title, brand, venue, or color..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>

          {/* City Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  City: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Badges / Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={hasImage}
                onChange={(e) => {
                  setHasImage(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                Has Photograph Attached
              </span>
            </label>

            {/* Status quick select */}
            <div className="flex items-center gap-1 text-slate-500">
              <span>Status:</span>
              <button
                onClick={() => setStatus('All')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  status === 'All'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatus('open')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  status === 'open'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setStatus('claimed')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  status === 'claimed'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Claimed
              </button>
              <button
                onClick={() => setStatus('returned')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  status === 'returned'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Returned
              </button>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Reset all filters ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing{' '}
          <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
            {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)}
          </span>{' '}
          of{' '}
          <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
            {total}
          </span>{' '}
          reports
        </div>
        <div>
          Page <span className="font-mono tabular-nums">{page}</span> of{' '}
          <span className="font-mono tabular-nums">{totalPages}</span>
        </div>
      </div>

      {/* Grid of Items */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 animate-pulse"
            >
              <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            No matching reports found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find any reports matching your active filters. Try adjusting your search keywords or resetting filters.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={() => onOpenReport()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Report New Belonging
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onSelect={onSelectItem} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            // Only show nearby pages
            if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold font-mono tabular-nums transition-colors ${
                    page === p
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              );
            }
            if (p === page - 2 || p === page + 2) {
              return (
                <span key={p} className="text-slate-400 px-1">
                  ...
                </span>
              );
            }
            return null;
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
