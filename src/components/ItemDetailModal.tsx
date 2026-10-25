import React from 'react';
import { Item } from '../types';
import { useAuth } from '../context/AuthContext';
import { getCategoryIcon } from './ItemCard';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Shield,
  ShieldAlert,
  Info,
  Tag,
  CheckCircle,
  FileQuestion,
  Lock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ItemDetailModalProps {
  item: Item | null;
  onClose: () => void;
  onStartClaim?: (item: Item) => void;
  onViewMatches?: (item: Item) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onStartClaim,
  onViewMatches,
}) => {
  const { user } = useAuth();
  if (!item) return null;

  const isLost = item.type === 'lost';
  const isOwner = user && user.id === item.userId;
  const isStaff = user && (user.role === 'admin' || user.role === 'moderator');
  const primaryImage = item.images?.[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-md ${
                isLost
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {isLost ? 'Lost Item Report' : 'Found Item Record'}
            </span>
            <span className="text-xs text-slate-400 font-mono">#{item.id}</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Visual or Fallback */}
          {primaryImage?.url ? (
            <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 max-h-72 flex items-center justify-center">
              <img
                src={primaryImage.url}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover max-h-72"
              />
              {primaryImage.isIllustrative && (
                <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 text-slate-200 text-xs px-3 py-1.5 rounded-lg backdrop-blur-xs flex items-center gap-1.5 border border-slate-700/50">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>AI-generated illustrative image — not a photograph of the actual lost item.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400">
              {getCategoryIcon(item.category, 'w-12 h-12 stroke-[1.5] mb-2 text-slate-300 dark:text-slate-600')}
              <span className="text-sm font-medium">No photograph attached</span>
              <span className="text-xs text-slate-500 mt-0.5">Identified via descriptive attributes</span>
            </div>
          )}

          {/* Title and Metadata */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {item.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{item.category}</span>
              <span aria-hidden="true">·</span>
              <span>{item.subcategory}</span>
              <span aria-hidden="true">·</span>
              <span>Brand: {item.brand || 'Unspecified'}</span>
              <span aria-hidden="true">·</span>
              <span>Color: {item.color}</span>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Public Description
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {/* Distinguishing Characteristics */}
          {item.distinguishingFeatures && item.distinguishingFeatures.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Visible Characteristics
              </h4>
              <div className="flex flex-wrap gap-2">
                {item.distinguishingFeatures.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    <Tag className="w-3 h-3 text-indigo-500" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Venue / Location</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{item.location}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Date Reported</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 font-mono tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{item.date}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block mb-1">City</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {item.city}
              </div>
            </div>
          </div>

          {/* Reward notice if applicable */}
          {item.reward && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span><strong>Reward Offered:</strong> {item.reward}</span>
            </div>
          )}

          {/* Protected Verification Clues (Visible strictly to item author, moderator, or admin) */}
          {(isOwner || isStaff) && item.privateClues && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Private Ownership Clues (Restricted Staff & Reporter View)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                These clues are withheld from public listings to verify claimant legitimacy during ownership review.
              </p>
              {item.privateClues.secretMarks && (
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <strong>Hidden Marks / Wallpaper:</strong> {item.privateClues.secretMarks}
                </div>
              )}
              {item.privateClues.exactStorageLocation && (
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <strong>Custody Storage:</strong> {item.privateClues.exactStorageLocation}
                </div>
              )}
              {item.privateClues.handoverAvailability && (
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <strong>Handover Protocol:</strong> {item.privateClues.handoverAvailability}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Reported by: <span className="font-medium text-slate-700 dark:text-slate-300">{item.userName}</span>
          </div>

          <div className="flex items-center gap-3">
            {onViewMatches && (
              <button
                onClick={() => {
                  onClose();
                  onViewMatches(item);
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Find Matches
              </button>
            )}

            {!isLost && !isOwner && onStartClaim && (
              <button
                onClick={() => {
                  onClose();
                  onStartClaim(item);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                This Is Mine (Start Claim)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
