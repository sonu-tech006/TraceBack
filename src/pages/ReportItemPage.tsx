import React, { useState } from 'react';
import { Item, ItemType } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Camera,
  Upload,
  Lock,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Info,
  X,
  FileText,
} from 'lucide-react';

interface ReportItemPageProps {
  initialType?: ItemType;
  onSuccess: (item: Item, matchFound: boolean) => void;
  onCancel: () => void;
}

export const ReportItemPage: React.FC<ReportItemPageProps> = ({
  initialType = 'lost',
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const [type, setType] = useState<ItemType>(initialType);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('Cambridge');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [reward, setReward] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [contactMethod, setContactMethod] = useState('In-app secure claim');

  // Image handling
  const [imageUrl, setImageUrl] = useState('');
  const [isIllustrative, setIsIllustrative] = useState(false);
  const [imageLabel, setImageLabel] = useState('');

  // Private clues
  const [serialNumber, setSerialNumber] = useState('');
  const [secretMarks, setSecretMarks] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [handoverProtocol, setHandoverProtocol] = useState('');
  const [verificationQuestion, setVerificationQuestion] = useState('');

  // AI Assistant state
  const [naturalText, setNaturalText] = useState('');
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiExtracted, setAiExtracted] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'Electronics',
    'Bags & Luggage',
    'Keys & Badges',
    'Personal Accessories',
    'Documents & IDs',
    'Clothing & Footwear',
    'Books & Stationery',
    'Others',
  ];

  const handleAddFeature = () => {
    if (featureInput.trim() && !features.includes(featureInput.trim())) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  // AI Description Extraction
  const handleExtractWithAI = async () => {
    if (!naturalText.trim()) return;
    setAnalyzingAi(true);
    setError(null);

    try {
      const res = await api.analyzeDescription(naturalText);
      const a = res.analysis;

      setTitle(a.title || title);
      if (a.category) setCategory(a.category);
      if (a.subcategory) setSubcategory(a.subcategory);
      if (a.brand) setBrand(a.brand);
      if (a.color) setColor(a.color);
      if (a.distinguishingFeatures && a.distinguishingFeatures.length > 0) {
        setFeatures(a.distinguishingFeatures);
      }
      if (a.suggestedVerificationQuestions && a.suggestedVerificationQuestions.length > 0) {
        setVerificationQuestion(a.suggestedVerificationQuestions[0]);
      }
      if (!description.trim()) {
        setDescription(naturalText.trim());
      }
      setAiExtracted(true);
    } catch (err: any) {
      setError('AI extraction could not be completed. Please enter details manually.');
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Image generation or reference selection
  const handleAttachIllustrativeReference = () => {
    // Attach domain-authentic category reference
    if (category === 'Electronics') {
      setImageUrl('/src/assets/images/item_sample_laptop_1792785746551.jpg');
    } else {
      setImageUrl('/src/assets/images/item_sample_backpack_1792785746923.jpg');
    }
    setIsIllustrative(true);
    setImageLabel('AI-generated illustrative image — not a photograph of the actual lost item.');
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
        setIsIllustrative(false);
        setImageLabel('Original user photograph');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim() || !city.trim() || !date) {
      setError('Please fill in all required fields (title, category, description, date, location, city).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: Partial<Item> = {
        type,
        title: title.trim(),
        category,
        subcategory: subcategory.trim() || 'General',
        description: description.trim(),
        date,
        time,
        location: location.trim(),
        city: city.trim(),
        color: color.trim() || 'Unspecified',
        brand: brand.trim() || 'Unmarked',
        distinguishingFeatures: features,
        reward: reward.trim() || undefined,
        estimatedValue: estimatedValue.trim() || undefined,
        contactMethod,
        images: imageUrl ? [{ url: imageUrl, isIllustrative, label: imageLabel }] : [{ url: '', isIllustrative: false }],
        privateClues: {
          serialNumber: serialNumber.trim() || undefined,
          secretMarks: secretMarks.trim() || undefined,
          exactStorageLocation: storageLocation.trim() || undefined,
          handoverAvailability: handoverProtocol.trim() || undefined,
          verificationQuestion: verificationQuestion.trim() || undefined,
        },
      };

      const res = await api.createItem(payload);
      onSuccess(res.item, res.matchFound);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      
      {/* Top Banner and Segmented Type Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Report a Belonging
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            File a lost or found report with descriptive attributes and private verification clues.
          </p>
        </div>

        {/* Type Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setType('lost')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              type === 'lost'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            I Lost Something
          </button>
          <button
            type="button"
            onClick={() => setType('found')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              type === 'found'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            I Found Something
          </button>
        </div>
      </div>

      {/* AI Assistant Card (Natural Language Description Assistant) */}
      <div className="p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 via-white to-cyan-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-cyan-950/20 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                AI Description Assistant
              </h3>
              <p className="text-[11px] text-slate-500">
                Describe in your own words — AI will automatically extract categories, brand, colors, and questions.
              </p>
            </div>
          </div>

          {aiExtracted && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Attributes Populated
            </span>
          )}
        </div>

        <div className="space-y-2">
          <textarea
            rows={2}
            value={naturalText}
            onChange={(e) => setNaturalText(e.target.value)}
            placeholder="e.g., I lost my black Lenovo ThinkPad laptop at the library 3rd floor quiet zone yesterday around 3pm. It has a blue python sticker on the lid and is in a gray sleeve."
            className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-white/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleExtractWithAI}
              disabled={analyzingAi || !naturalText.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${analyzingAi ? 'animate-spin' : ''}`} />
              <span>{analyzingAi ? 'Analyzing Description...' : 'Extract Attributes with AI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Core Details */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 dark:border-slate-800">
            1. Core Belonging Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Item Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Space Gray MacBook Pro 14 inch"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Subcategory
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Laptops, Earbuds, Water Bottle"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Apple, Sony, Hydro Flask, Bellroy"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Dominant Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Space Gray, Navy Blue, Matte Black"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Public Description *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a general description of the item's appearance. Do NOT include secret passwords, full serials, or private unlock patterns."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Distinguishing Characteristics Tags */}
            <div className="sm:col-span-2 space-y-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Distinguishing Characteristics & Features
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  placeholder="e.g. Scratched bottom corner, orange interior lining, anime sticker"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  Add
                </button>
              </div>

              {features.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {features.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-800 dark:text-slate-200"
                    >
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(i)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Time and Venue */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 dark:border-slate-800">
            2. Date and Venue Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Date {type === 'lost' ? 'Lost' : 'Found'} *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Approximate Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                City / Region *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Cambridge, Boston"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Specific Location / Venue / Room *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Main Library 3rd Floor Quiet Study Pods, Table #4"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Visual Assistance (Upload or AI Illustrative Image) */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              3. Visual Assistance & Photograph
            </h3>
            <span className="text-slate-400 text-[11px]">No photo? No problem.</span>
          </div>

          {imageUrl ? (
            <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 max-h-60 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <img
                src={imageUrl}
                alt="Belonging visual"
                className="w-full h-full object-cover max-h-60"
              />
              <button
                type="button"
                onClick={() => {
                  setImageUrl('');
                  setIsIllustrative(false);
                  setImageLabel('');
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
              {isIllustrative && (
                <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 text-slate-200 text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>AI-generated illustrative image — not a photograph of the actual lost item.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Upload Actual Photo */}
              <label className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center justify-center cursor-pointer transition-colors text-center space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
                <Camera className="w-6 h-6 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Upload Actual Photograph
                </span>
                <span className="text-[11px] text-slate-400">
                  PNG, JPG, or WEBP up to 5MB
                </span>
              </label>

              {/* Option B: Attach AI Illustrative Reference */}
              <div
                onClick={handleAttachIllustrativeReference}
                className="p-6 rounded-xl border border-indigo-200 dark:border-indigo-900 hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col items-center justify-center cursor-pointer transition-colors text-center space-y-2"
              >
                <Sparkles className="w-6 h-6 text-indigo-500" />
                <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                  Attach AI Illustrative Reference
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Generates an illustrative representation with mandatory disclaimer label.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Private Ownership Clues (Withheld from public listings) */}
        <div className="p-5 sm:p-6 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-indigo-100 dark:border-indigo-900/60">
            <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              4. Private Ownership Verification Clues
            </h3>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            <strong>Privacy Guarantee:</strong> These fields are strictly private and NEVER displayed in public listings. They are used exclusively by authorized reviewers to verify claimant answers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Serial Number or IMEI (Private)
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. C02G8942Q05D"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Secret Marks / Wallpaper / Engraving (Private)
              </label>
              <input
                type="text"
                value={secretMarks}
                onChange={(e) => setSecretMarks(e.target.value)}
                placeholder="e.g. Nebula lockscreen, monogram initials on inner clasp"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {type === 'found' && (
              <>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Exact Physical Custody / Storage Location (Private)
                  </label>
                  <input
                    type="text"
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                    placeholder="e.g. Science Center Security Desk, Cabinet Locker #4"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Handover Protocol / Desk Hours
                  </label>
                  <input
                    type="text"
                    value={handoverProtocol}
                    onChange={(e) => setHandoverProtocol(e.target.value)}
                    placeholder="e.g. Mon-Fri 9:00 AM - 5:00 PM with campus ID"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Verification Question for Potential Claimants
              </label>
              <input
                type="text"
                value={verificationQuestion}
                onChange={(e) => setVerificationQuestion(e.target.value)}
                placeholder="e.g. What specific sticker is on the laptop lid or what wallpaper is on screen?"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span>{submitting ? 'Indexing Report...' : `Submit ${type === 'lost' ? 'Lost Report' : 'Found Report'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
