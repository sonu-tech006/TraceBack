import React from 'react';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck, Heart, MapPin, Sparkles } from 'lucide-react';

interface FooterProps {
  setActiveView: (view: string) => void;
  onOpenReport: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveView, onOpenReport }) => {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-colors text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <BrandLogo size={24} />
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
              AI-assisted community network for campus, transit, and venue lost belongings.
            </p>
            <div className="text-[11px] text-slate-400">
              Find the item. Verify the owner. Return it safely.
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Platform
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => setActiveView('explore')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Explore Directory
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('matches')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  AI Match Candidates
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('analytics')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Analytics & Trends
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenReport()}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors text-indigo-600 dark:text-indigo-400 font-medium"
                >
                  Report a Belonging
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Trust & Safety
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => setActiveView('community')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Safe Handover Protocols
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('community')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Verified Return Stories
                </button>
              </li>
              <li>
                <span className="text-slate-400">
                  Zero public disclosure of private serial numbers or passwords
                </span>
              </li>
            </ul>
          </div>

          {/* Venues */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Supported Venues
            </h4>
            <p className="leading-relaxed">
              University libraries, student centers, transit hubs, athletics facilities, and local community spaces.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                100 Seeded Benchmark Reports
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            © {new Date().getFullYear()} TraceBack Network. Production-style full-stack demonstration.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Privacy Guarded</span>
            <span>·</span>
            <span>Two-Party Verification</span>
            <span>·</span>
            <span>No Public PII</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
