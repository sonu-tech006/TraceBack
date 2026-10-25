import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { ExplorePage } from './pages/ExplorePage';
import { MatchesPage } from './pages/MatchesPage';
import { ReportItemPage } from './pages/ReportItemPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { MyClaimsPage } from './pages/MyClaimsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CommunityPage } from './pages/CommunityPage';
import { AdminPage } from './pages/AdminPage';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ClaimModal } from './components/ClaimModal';
import { AuthModal } from './components/AuthModal';
import { Item, ItemType } from './types';
import confetti from 'canvas-confetti';
import { CheckCircle2, Sparkles } from 'lucide-react';

function AppContent() {
  const [activeView, setActiveView] = useState<string>('home');
  const [reportType, setReportType] = useState<ItemType>('lost');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [claimTargetItem, setClaimTargetItem] = useState<Item | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [matchesLostId, setMatchesLostId] = useState<string | undefined>(undefined);
  const [bannerAlert, setBannerAlert] = useState<{ title: string; message: string; isMatch?: boolean } | null>(null);

  const handleOpenReport = (type: ItemType = 'lost') => {
    setReportType(type);
    setActiveView('report');
  };

  const handleReportSuccess = (item: Item, matchFound: boolean) => {
    if (matchFound) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
      });
      setBannerAlert({
        title: 'Report Indexed & Potential Matches Detected!',
        message: `Your ${item.type} report #${item.id} was saved. High-confidence candidate matches were found!`,
        isMatch: true,
      });
      setMatchesLostId(item.type === 'lost' ? item.id : undefined);
      setActiveView('matches');
    } else {
      setBannerAlert({
        title: 'Report Successfully Indexed',
        message: `Your ${item.type} report #${item.id} is active and being monitored by AI candidate discovery.`,
      });
      setActiveView('my-reports');
    }

    setTimeout(() => {
      setBannerAlert(null);
    }, 8000);
  };

  const handleClaimSuccess = (claimId: string) => {
    setClaimTargetItem(null);
    setBannerAlert({
      title: 'Ownership Claim Submitted Successfully',
      message: `Claim #${claimId} is now under verification review. You can track progress in My Claims.`,
    });
    setActiveView('my-claims');
    setTimeout(() => {
      setBannerAlert(null);
    }, 8000);
  };

  const handleViewMatchesForItem = (item: Item) => {
    setMatchesLostId(item.type === 'lost' ? item.id : undefined);
    setActiveView('matches');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={(v) => {
          setActiveView(v);
          setMatchesLostId(undefined);
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenReport={handleOpenReport}
      />

      {/* Floating Global Banner Alert */}
      {bannerAlert && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs shadow-md ${
              bannerAlert.isMatch
                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {bannerAlert.isMatch ? (
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <div>
                <span className="font-bold block text-sm">{bannerAlert.title}</span>
                <span>{bannerAlert.message}</span>
              </div>
            </div>

            <button
              onClick={() => setBannerAlert(null)}
              className="text-xs font-semibold hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 w-full">
        {activeView === 'home' && (
          <LandingPage
            onOpenReport={handleOpenReport}
            onSelectItem={(item) => setSelectedItem(item)}
            setActiveView={setActiveView}
            setSearchQuery={setSearchQuery}
            setSelectedCategory={setSelectedCategory}
          />
        )}

        {activeView === 'explore' && (
          <ExplorePage
            initialType="all"
            initialSearch={searchQuery}
            initialCategory={selectedCategory}
            onSelectItem={(item) => setSelectedItem(item)}
            onOpenReport={handleOpenReport}
          />
        )}

        {activeView === 'matches' && (
          <MatchesPage
            onSelectItem={(item) => setSelectedItem(item)}
            onStartClaim={(item) => setClaimTargetItem(item)}
            initialLostId={matchesLostId}
          />
        )}

        {activeView === 'report' && (
          <ReportItemPage
            initialType={reportType}
            onSuccess={handleReportSuccess}
            onCancel={() => setActiveView('home')}
          />
        )}

        {activeView === 'my-reports' && (
          <MyReportsPage
            onSelectItem={(item) => setSelectedItem(item)}
            onOpenReport={() => handleOpenReport('lost')}
            onViewMatches={handleViewMatchesForItem}
          />
        )}

        {activeView === 'my-claims' && <MyClaimsPage />}

        {activeView === 'analytics' && <AnalyticsPage />}

        {activeView === 'community' && <CommunityPage />}

        {activeView === 'admin' && <AdminPage />}
      </main>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onStartClaim={(item) => {
          setSelectedItem(null);
          setClaimTargetItem(item);
        }}
        onViewMatches={handleViewMatchesForItem}
      />

      {/* Claim Submission Modal */}
      <ClaimModal
        item={claimTargetItem}
        onClose={() => setClaimTargetItem(null)}
        onSuccess={handleClaimSuccess}
      />

      {/* Auth & Quick Switcher Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Global Footer */}
      <Footer
        setActiveView={(v) => {
          setActiveView(v);
          setMatchesLostId(undefined);
        }}
        onOpenReport={() => handleOpenReport('lost')}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
