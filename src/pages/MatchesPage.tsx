import React, { useState, useEffect } from 'react';
import { MatchCandidate, Item } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Shield,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Sliders,
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  Lock,
} from 'lucide-react';

interface MatchesPageProps {
  onSelectItem: (item: Item) => void;
  onStartClaim: (item: Item) => void;
  initialLostId?: string;
}

export const MatchesPage: React.FC<MatchesPageProps> = ({
  onSelectItem,
  onStartClaim,
  initialLostId,
}) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState<number>(50);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});

  const fetchMatches = () => {
    setLoading(true);
    const params: Record<string, string> = { minScore: String(minScore) };
    if (initialLostId) params.lostId = initialLostId;
    api.getMatches(params)
      .then((res) => {
        setMatches(res.matches || []);
      })
      .catch((err) => {
        console.error('Failed to load matches:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMatches();
  }, [minScore, initialLostId]);

  const handleDeepenAIExplanation = async (match: MatchCandidate) => {
    setExplainingId(match.id);
    try {
      const res = await api.explainMatch(match.lostItemId, match.foundItemId);
      setAiExplanations((prev) => ({
        ...prev,
        [match.id]: res.explanation,
      }));
    } catch (e) {
      console.warn('AI explanation failed:', e);
    } finally {
      setExplainingId(null);
    }
  };

  const handleClaimCandidate = async (foundItemId: string) => {
    try {
      const res = await api.getItem(foundItemId);
      if (res.item) {
        onStartClaim(res.item);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewItem = async (itemId: string) => {
    try {
      const res = await api.getItem(itemId);
      if (res.item) {
        onSelectItem(res.item);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Candidate Ranking Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Potential Item Matches
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comparing reported lost items against catalogued found belongings using multi-signal scoring.
          </p>
        </div>

        <button
          onClick={fetchMatches}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Trust & Safety Disclaimer Card */}
      <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Core Principle: AI Ranks Candidates, Humans Verify Ownership</span>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            A high similarity score reflects category, brand, and temporal proximity. It is strictly a candidate suggestion, not proof of ownership. Physical items will only be released after verified ownership proof (receipts, serials, secret marks) is approved by custody staff.
          </p>
        </div>
      </div>

      {/* Filter and Score Slider Controls */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Minimum Compatibility Score:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="40"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-28 sm:w-36 accent-indigo-600 cursor-pointer"
            />
            <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400 text-sm">
              {minScore}%
            </span>
          </div>
        </div>

        <div className="text-slate-500 font-mono text-[11px] tabular-nums">
          {matches.length} matching candidates shortlisted
        </div>
      </div>

      {/* Matches List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 animate-pulse"
            >
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            No candidate matches above {minScore}% threshold
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try lowering the similarity threshold or check back as new lost & found reports are filed by campus members.
          </p>
          <button
            onClick={() => setMinScore(50)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Reset to 50% Threshold
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const explanation = aiExplanations[match.id] || match.whySuggested;
            const isExplaining = explainingId === match.id;

            return (
              <div
                key={match.id}
                className="p-5 sm:p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5"
              >
                {/* Score Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="font-mono text-xs text-slate-400">Pair #{match.id}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono tabular-nums text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {match.score}% Compatibility
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Multi-signal algorithmic rank
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reciprocal Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Lost Item Card */}
                  <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-semibold uppercase tracking-wider">
                        Lost Report
                      </span>
                      <button
                        onClick={() => handleViewItem(match.lostItemId)}
                        className="text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>View Report</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {match.lostItemTitle}
                    </div>
                    <div className="text-slate-500">
                      ID: <span className="font-mono">{match.lostItemId}</span>
                    </div>
                  </div>

                  {/* Found Item Card */}
                  <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold uppercase tracking-wider">
                        Found Item In Custody
                      </span>
                      <button
                        onClick={() => handleViewItem(match.foundItemId)}
                        className="text-emerald-800 dark:text-emerald-300 hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>View Record</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {match.foundItemTitle}
                    </div>
                    <div className="text-slate-500">
                      ID: <span className="font-mono">{match.foundItemId}</span>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Bar Signals */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Signal Weight Breakdown
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs text-center font-mono tabular-nums">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <div className="text-slate-400 text-[10px]">Category</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {match.breakdown?.categoryScore || 25}/25
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <div className="text-slate-400 text-[10px]">Brand</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {match.breakdown?.brandScore || 20}/20
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <div className="text-slate-400 text-[10px]">Color</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {match.breakdown?.colorScore || 15}/15
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <div className="text-slate-400 text-[10px]">Location</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {match.breakdown?.locationScore || 18}/20
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <div className="text-slate-400 text-[10px]">Date Window</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {match.breakdown?.dateScore || 10}/10
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <div className="text-slate-400 text-[10px]">Text Overlap</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {match.breakdown?.textScore || 8}/10
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matching vs Conflicting Attributes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 block mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Matching Signals ({match.matchingAttributes.length})
                    </span>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                      {match.matchingAttributes.map((attr, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          <span>{attr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      Differing / Distinct Signals
                    </span>
                    {match.conflictingAttributes.length > 0 ? (
                      <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                        {match.conflictingAttributes.map((attr, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-amber-500" />
                            <span>{attr}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        No major conflicting attributes identified.
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Explanation Callout */}
                <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Similarity Rationale
                    </span>
                    <button
                      onClick={() => handleDeepenAIExplanation(match)}
                      disabled={isExplaining}
                      className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isExplaining ? 'animate-spin' : ''}`} />
                      <span>{isExplaining ? 'Analyzing with Gemini...' : 'Regenerate Gemini Analysis'}</span>
                    </button>
                  </div>
                  <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                    {explanation}
                  </p>
                </div>

                {/* Match Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    Physical ownership verification required before release.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleClaimCandidate(match.foundItemId)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>This Is Mine (Start Claim)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
