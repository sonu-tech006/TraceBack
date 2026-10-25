import React, { useState, useEffect } from 'react';
import { CommunityStory } from '../types';
import { api } from '../lib/api';
import {
  ShieldCheck,
  Heart,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const CommunityPage: React.FC = () => {
  const [stories, setStories] = useState<CommunityStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCommunityStories()
      .then((res) => {
        setStories(res.stories || []);
      })
      .catch((err) => {
        console.error('Failed to load community stories:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-10 pb-16">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
          <Heart className="w-3.5 h-3.5" />
          <span>Trust & Verified Handover Network</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Community & Safe Return Protocols
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Read verified reunion stories and explore authorized safety checklists for campus lost & found handovers.
        </p>
      </div>

      {/* Campus Safety Announcements */}
      <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Official Campus Operations Notice</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Unclaimed items deposited at campus facilities are held in secure lockbox custody for 90 days. For valuable electronics (laptops, phones) and state/federal ID cards, handover must occur exclusively at designated Campus Safety Desks.
        </p>
      </div>

      {/* Verified Return Stories */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Verified Reunion Stories
          </h2>
          <p className="text-xs text-slate-500">
            Real outcomes from students, staff, and campus visitors reunited with their belongings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {stories.map((story) => (
            <div
              key={story.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              {story.imageUrl && (
                <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>{story.category}</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      Recovered in {story.daysToRecover} {story.daysToRecover === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                    {story.title}
                  </h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                    {story.story}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 truncate max-w-[60%]">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{story.venue}</span>
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    by {story.authorName}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safe Handover Checklist */}
      <section className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-6 text-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Safe Handover Protocol Checklist
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Follow these essential rules to guarantee personal safety and prevent fraud.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-bold flex items-center justify-center font-mono">
              ✓
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              1. Meet at Designated Desks
            </h4>
            <p className="text-slate-500 leading-relaxed">
              Always schedule handovers at monitored locations: Campus Security, Student Union Information Desk, or Train Station Master Office.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold flex items-center justify-center font-mono">
              ✓
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              2. Inspect Before Confirming
            </h4>
            <p className="text-slate-500 leading-relaxed">
              Check physical serial numbers, lockscreen wallpaper, or physical markings in person before signing off on the handover.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 font-bold flex items-center justify-center font-mono">
              !
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              3. Zero Payment Requests
            </h4>
            <p className="text-slate-500 leading-relaxed">
              TraceBack is 100% free. Never wire money, purchase gift cards, or pay upfront "courier/shipping fees" to anyone claiming to hold your item.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
