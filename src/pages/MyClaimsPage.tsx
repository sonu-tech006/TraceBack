import React, { useState, useEffect } from 'react';
import { Claim } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  Shield,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Lock,
  ArrowRight,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const MyClaimsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'submitted' | 'incoming'>('submitted');
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [incomingClaims, setIncomingClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalClaim, setReviewModalClaim] = useState<Claim | null>(null);

  // Review form state
  const [reviewStatus, setReviewStatus] = useState<string>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [safeLocation, setSafeLocation] = useState('Campus Security Station A, Main Library Lobby');
  const [scheduledTime, setScheduledTime] = useState('Tomorrow at 3:00 PM');
  const [reviewing, setReviewing] = useState(false);

  // Handover code input
  const [handoverCodeInput, setHandoverCodeInput] = useState('');
  const [handoverMessage, setHandoverMessage] = useState<string | null>(null);

  const fetchClaims = () => {
    if (!user) return;
    setLoading(true);

    Promise.all([api.getMyClaims(), api.getIncomingClaims()])
      .then(([myRes, incRes]) => {
        setMyClaims(myRes.claims || []);
        setIncomingClaims(incRes.claims || []);
      })
      .catch((err) => {
        console.error('Failed to load claims:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClaims();
  }, [user]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalClaim) return;
    setReviewing(true);

    try {
      await api.reviewClaim(reviewModalClaim.id, {
        status: reviewStatus,
        reviewNotes,
        safeLocation,
        scheduledTime,
      });
      setReviewModalClaim(null);
      fetchClaims();
    } catch (err: any) {
      alert(err.message || 'Review failed');
    } finally {
      setReviewing(false);
    }
  };

  const handleConfirmHandover = async (claimId: string, isReporterOrStaff: boolean) => {
    try {
      const res = await api.confirmHandover(claimId, isReporterOrStaff ? handoverCodeInput : undefined);
      if (res.bothConfirmed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      setHandoverMessage(res.message);
      fetchClaims();
      setTimeout(() => setHandoverMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Handover confirmation failed');
    }
  };

  const getStatusBadge = (status: Claim['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold text-[11px]">Pending Review</span>;
      case 'under_review':
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-[11px]">Under Review</span>;
      case 'approved':
        return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold text-[11px]">Approved · Handover Ready</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold text-[11px]">Safely Returned</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-semibold text-[11px]">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-semibold text-[11px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ownership Claims & Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track ownership verification progress, inspect private proof, and execute secure two-party handovers.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto text-xs">
          <button
            onClick={() => setActiveTab('submitted')}
            className={`px-3.5 py-1.5 font-semibold rounded-lg transition-colors ${
              activeTab === 'submitted'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            My Claims ({myClaims.length})
          </button>
          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-3.5 py-1.5 font-semibold rounded-lg transition-colors ${
              activeTab === 'incoming'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Claims to Review ({incomingClaims.length})
          </button>
        </div>
      </div>

      {handoverMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{handoverMessage}</span>
        </div>
      )}

      {/* Claims List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'submitted' ? (
        myClaims.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <Shield className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No claims submitted yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              If you discover a found belonging that matches what you lost, click "This Is Mine" to start a claim.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {myClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 text-xs"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">Claim #{claim.id}</span>
                      {getStatusBadge(claim.status)}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                      {claim.foundItemTitle}
                    </h3>
                  </div>

                  <div className="text-right text-slate-400 text-[11px] font-mono tabular-nums">
                    Submitted: {new Date(claim.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Question & Answer Summary */}
                {claim.answers && claim.answers.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Verification Answer Provided:
                    </span>
                    <div className="text-slate-600 dark:text-slate-300 italic">
                      "{claim.answers[0].answer}"
                    </div>
                  </div>
                )}

                {/* Handover Details if Approved */}
                {claim.status === 'approved' && claim.handoverDetails && (
                  <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>Safe Handover Location & Verification Code</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Safe Venue</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {claim.handoverDetails.safeLocation}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Time / Window</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {claim.handoverDetails.scheduledTime || 'During staff hours'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Handover Code</span>
                        <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                          {claim.handoverDetails.verificationCode}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">
                        Present your student/government ID and this code to the custodian.
                      </span>

                      {!claim.handoverDetails.claimantConfirmed && (
                        <button
                          onClick={() => handleConfirmHandover(claim.id, false)}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors"
                        >
                          I Have Received My Item
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Completed State */}
                {claim.status === 'completed' && (
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold">Item Return Confirmed! Belonging safely reunited with verified owner.</span>
                  </div>
                )}

                {/* Timeline */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block mb-2">
                    Claim Activity Timeline
                  </span>
                  <div className="space-y-1.5">
                    {claim.timeline.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{step.action}</span>
                        <span className="text-slate-400 font-mono">({new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                        {step.note && <span className="text-slate-500">— {step.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Incoming Claims to Review */
        incomingClaims.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No claims awaiting review
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When members claim found items you reported, their verification proof will appear here for review.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {incomingClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 text-xs"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">Claim #{claim.id}</span>
                      {getStatusBadge(claim.status)}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                      {claim.foundItemTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Claimant:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{claim.claimantName}</span>
                    <span className="text-slate-400">({claim.claimantEmail})</span>
                  </div>
                </div>

                {/* Private Claimant Proof Review */}
                <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Claimant's Submitted Verification Proof</span>
                  </div>

                  {claim.answers && claim.answers.length > 0 && (
                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>Answer to verification question:</strong> {claim.answers[0].answer}
                    </div>
                  )}

                  <div className="text-slate-700 dark:text-slate-300">
                    <strong>Proof Description:</strong> {claim.privateProofDescription}
                  </div>

                  {claim.proofDocumentUrl && (
                    <div className="pt-1">
                      <a
                        href={claim.proofDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
                      >
                        View Supporting Document / Receipt
                      </a>
                    </div>
                  )}
                </div>

                {/* Custodian Action Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[11px]">
                    Ensure serial numbers and sticker marks correspond before authorizing handover.
                  </div>

                  <div className="flex items-center gap-2">
                    {claim.status === 'pending' || claim.status === 'under_review' ? (
                      <button
                        onClick={() => {
                          setReviewModalClaim(claim);
                          setReviewStatus('approved');
                        }}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Review & Decide</span>
                      </button>
                    ) : claim.status === 'approved' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={handoverCodeInput}
                          onChange={(e) => setHandoverCodeInput(e.target.value)}
                          placeholder="Verification Code (e.g. TB-8942)"
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs uppercase"
                        />
                        <button
                          onClick={() => handleConfirmHandover(claim.id, true)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
                        >
                          Confirm Handover Release
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Review Modal */}
      {reviewModalClaim && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Review Claim #{reviewModalClaim.id}
            </h3>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Decision *
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="approved">Approve Ownership & Schedule Handover</option>
                <option value="under_review">Mark Under Further Review</option>
                <option value="rejected">Reject Claim (Insufficient Evidence)</option>
              </select>
            </div>

            {reviewStatus === 'approved' && (
              <>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Safe Handover Location
                  </label>
                  <input
                    type="text"
                    value={safeLocation}
                    onChange={(e) => setSafeLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Handover Availability / Time Window
                  </label>
                  <input
                    type="text"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Review Notes / Instructions to Claimant
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Please bring university ID card and proof of purchase to the security desk."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReviewModalClaim(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={reviewing}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
              >
                {reviewing ? 'Saving...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
