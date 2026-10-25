import React, { useState } from 'react';
import { Item } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  X,
  Shield,
  ShieldCheck,
  AlertCircle,
  FileText,
  Lock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface ClaimModalProps {
  item: Item | null;
  onClose: () => void;
  onSuccess: (claimId: string) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ item, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [answer, setAnswer] = useState('');
  const [privateProof, setPrivateProof] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  const verificationQuestion =
    item.privateClues?.verificationQuestion ||
    `Can you describe any unique markings, serial numbers, or stickers on this ${item.brand || item.title}?`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to submit an ownership claim');
      return;
    }
    if (!privateProof.trim()) {
      setError('Please provide detailed proof of ownership');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.createClaim({
        foundItemId: item.id,
        answers: [
          {
            question: verificationQuestion,
            answer: answer.trim() || 'Described in proof details below',
          },
        ],
        privateProofDescription: privateProof.trim(),
        proofDocumentUrl: receiptUrl.trim() || undefined,
      });

      onSuccess(res.claim.id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                Claim Item & Verify Ownership
              </h3>
              <p className="text-[11px] text-slate-500">
                Found Record: #{item.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Privacy Note */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Private Verification:</strong> Answers and proof submitted here are strictly private and reviewed only by authorized campus safety staff or the item finder.
            </p>
          </div>

          {/* Item Recap */}
          <div className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <div className="font-semibold text-slate-900 dark:text-white text-sm">
              {item.title}
            </div>
            <div className="text-slate-500 mt-1">
              Found at {item.location} ({item.city}) on {item.date}
            </div>
          </div>

          {/* Verification Question */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              1. Verification Question from Custodian
            </label>
            <p className="text-slate-500 dark:text-slate-400 italic">
              "{verificationQuestion}"
            </p>
            <textarea
              rows={2}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. Stickers on the lid, custom wallpaper, engraving..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Proof of Ownership */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              2. Proof of Ownership Details *
            </label>
            <textarea
              required
              rows={3}
              value={privateProof}
              onChange={(e) => setPrivateProof(e.target.value)}
              placeholder="Describe purchase details, serial numbers, password patterns, internal file names, or unique physical wear only the rightful owner knows..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Optional Receipt/Document Link */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              3. Supporting Document / Receipt URL (Optional)
            </label>
            <input
              type="text"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="Link to purchase receipt, warranty card, or cloud invoice"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? 'Submitting Claim...' : 'Submit Claim'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
