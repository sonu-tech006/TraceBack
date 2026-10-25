import React, { useState, useEffect } from 'react';
import { Item, DashboardSummary, MatchCandidate } from '../types';
import { api } from '../lib/api';
import { ItemCard, getCategoryIcon } from '../components/ItemCard';
import {
  Search,
  Sparkles,
  Shield,
  ShieldCheck,
  ArrowRight,
  MapPin,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  Layers,
  FileText,
  UserCheck,
  Lock,
} from 'lucide-react';

interface LandingPageProps {
  onOpenReport: (type?: 'lost' | 'found') => void;
  onSelectItem: (item: Item) => void;
  setActiveView: (view: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenReport,
  onSelectItem,
  setActiveView,
  setSearchQuery,
  setSelectedCategory,
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [topMatches, setTopMatches] = useState<MatchCandidate[]>([]);
  const [summary, setSummary] = useState<DashboardSummary['summary'] | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    // Load recent items
    api.getItems({ limit: 6, sortBy: 'newest' })
      .then((res) => setRecentItems(res.items || []))
      .catch(() => {});

    // Load top matches
    api.getMatches({ minScore: '75' })
      .then((res) => setTopMatches(res.matches?.slice(0, 3) || []))
      .catch(() => {});

    // Load summary metrics
    api.getDashboardSummary()
      .then((res) => setSummary(res.summary))
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchQuery(localSearch.trim());
      setActiveView('explore');
    }
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setActiveView('explore');
  };

  const categories = [
    { name: 'Electronics', count: 'Laptops, phones, chargers' },
    { name: 'Bags & Luggage', count: 'Backpacks, wallets, totes' },
    { name: 'Keys & Badges', count: 'Key fobs, room cards, lanyards' },
    { name: 'Personal Accessories', count: 'Watches, glasses, bottles' },
    { name: 'Documents & IDs', count: 'Passports, student cards' },
    { name: 'Clothing & Footwear', count: 'Jackets, hoodies, caps' },
    { name: 'Books & Stationery', count: 'Notebooks, sketchbooks' },
  ];

  const faqs = [
    {
      q: 'Can I report a lost belonging if I don’t have a photo?',
      a: 'Yes, absolutely. TraceBack was built specifically for this situation. You can describe your item using color, brand, approximate time, and venue. Our AI can even generate an illustrative reference image with clear disclaimers.',
    },
    {
      q: 'How does AI candidate matching work without compromising privacy?',
      a: 'TraceBack compares high-level physical characteristics (category, subcategory, brand, color tones, venue proximity, and temporal difference) to rank candidates. Private verification clues—like exact serial numbers, wallpaper pictures, or locker codes—are strictly hidden and never fed to public prompts.',
    },
    {
      q: 'Does AI automatically approve ownership claims?',
      a: 'Never. Our core principle is: Find the item. Verify the owner. Return it safely. AI only highlights candidate possibilities. Ownership verification is approved strictly by the finder or campus safety administrator after private answers are confirmed.',
    },
    {
      q: 'How does safe physical handover work?',
      a: 'When an ownership claim is approved, both parties receive a unique 4-digit verification code (e.g. TB-8942) and an authorized campus safe location (like Campus Security Desk or Student Union). Both confirm handover completion in-app.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>AI-Powered Lost & Found Network</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] text-balance">
              Lost Something? <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500">
                Let AI Help You Find It.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Report lost and found items on campus, transit hubs, and venues. Discover matches using intelligent descriptive search, verify ownership securely, and return belongings safely.
            </p>

            {/* Quick Search Bar */}
            <form onSubmit={handleSearchSubmit} className="max-w-xl">
              <div className="relative flex items-center shadow-md rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-500">
                <Search className="w-5 h-5 text-slate-400 ml-3.5 shrink-0" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search item name, brand, color, or campus venue..."
                  className="w-full px-3 py-3.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                />
                <button
                  type="submit"
                  className="mr-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onOpenReport('lost')}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2"
              >
                <span>I Lost Something</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenReport('found')}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2"
              >
                <span>I Found Something</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveView('matches')}
                className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>View AI Matches</span>
              </button>
            </div>
          </div>

          {/* Right Hero Visual Banner */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-800 aspect-[16/10] lg:aspect-[4/3] flex items-center justify-center">
              <img
                src="/src/assets/images/hero_traceback_banner_1792785745959.jpg"
                alt="University campus library study hall"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2 text-xs font-medium text-cyan-300 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Campus Safety Verified Network</span>
                </div>
                <p className="text-sm font-semibold leading-snug">
                  100+ items catalogued across libraries, dorms, and campus facilities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Total Reports</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {(summary?.totalLost || 50) + (summary?.totalFound || 50)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary?.totalLost || 50} Lost · {summary?.totalFound || 50} Found
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">AI Matches Ranked</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
              {summary?.potentialMatches || 15}+
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Descriptive pairings ready
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Pending Claims</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {summary?.pendingClaims || 4}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Under verification review
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Successfully Returned</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {summary?.itemsReturned || 18}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary?.recoveryRate || 36}% overall return rate
            </div>
          </div>
        </div>
      </section>

      {/* AI Potential Matches Showcase */}
      {topMatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>AI Descriptive Discovery</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Recent AI Candidate Matches
              </h2>
            </div>
            <button
              onClick={() => setActiveView('matches')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Explore all match pairings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => setActiveView('matches')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Candidate Pairing
                    </span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {match.score}% Score
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
                      <span className="font-semibold block text-[10px] text-amber-600 uppercase">Lost Item:</span>
                      <span className="line-clamp-1">{match.lostItemTitle}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200">
                      <span className="font-semibold block text-[10px] text-emerald-600 uppercase">Found Item:</span>
                      <span className="line-clamp-1">{match.foundItemTitle}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {match.whySuggested}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  <span>Review match details</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category Discovery Navigation */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Browse by Category
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Filter all 100 benchmark community reports across campuses and venues.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 hover:shadow-xs transition-all text-left flex items-start gap-3 group"
            >
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {getCategoryIcon(cat.name, 'w-5 h-5')}
              </div>
              <div>
                <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {cat.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {cat.count}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recently Reported Items */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Recently Reported Belongings
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Active community reports indexed in the TraceBack database.
            </p>
          </div>
          <button
            onClick={() => setActiveView('explore')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} onSelect={onSelectItem} />
          ))}
        </div>
      </section>

      {/* How TraceBack Works Section */}
      <section className="p-6 sm:p-10 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-8">
        <div className="max-w-2xl text-center mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            How TraceBack Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            A trusted four-step protocol built around privacy, physical verification, and safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 font-bold flex items-center justify-center font-mono">
              01
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Report Belonging
            </h3>
            <p className="text-slate-500 leading-relaxed">
              Describe your lost or found item. Don’t have a photo? AI analyzes your text and extracts structured attributes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold flex items-center justify-center font-mono">
              02
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              AI Candidate Match
            </h3>
            <p className="text-slate-500 leading-relaxed">
              Hybrid matching calculates compatibility based on category, brand, color tone, date delta, and venue proximity.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 font-bold flex items-center justify-center font-mono">
              03
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Ownership Verification
            </h3>
            <p className="text-slate-500 leading-relaxed">
              Claimants submit private proof (wallpaper, sticker details, receipts). The custodian reviews answers before approval.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-bold flex items-center justify-center font-mono">
              04
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Safe Handover
            </h3>
            <p className="text-slate-500 leading-relaxed">
              Handover is scheduled at an authorized campus security desk or student union with a 4-digit verification code.
            </p>
          </div>
        </div>
      </section>

      {/* Community Impact & Testimonials */}
      <section className="space-y-6">
        <div className="max-w-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Community Voices & Verified Returns
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real feedback from campus administrators and students reunited with their belongings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed italic">
              "TraceBack transformed our facility lost-and-found from messy storage boxes into a searchable, secure network. The private verification question workflow ensures students only get back what actually belongs to them."
            </p>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <img
                src="/src/assets/images/avatar_marcus_admin_1792785746915.jpg"
                alt="Marcus Vance"
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">
                  Marcus Vance
                </div>
                <div className="text-[11px] text-slate-400">
                  Campus Safety & Facilities Administrator
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed italic">
              "I left my MacBook Pro in the science center late at night before finals and panicked because I had no photos of it. The AI description assistance captured my laptop's stickers, and within hours it matched a report from custodial staff!"
            </p>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <img
                src="/src/assets/images/avatar_sarah_chen_1792785746764.jpg"
                alt="Sarah Chen"
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">
                  Sarah Chen
                </div>
                <div className="text-[11px] text-slate-400">
                  Student Union Coordinator & Reunited Owner
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="space-y-4 max-w-3xl mx-auto">
        <div className="text-center space-y-1 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500">
            Everything you need to know about reporting, privacy, and handover safety.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-indigo-500' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
