import React from 'react';
import { Item } from '../types';
import {
  Laptop,
  Smartphone,
  Headphones,
  Key,
  CreditCard,
  Briefcase,
  Shirt,
  BookOpen,
  HelpCircle,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Eye,
} from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onSelect: (item: Item) => void;
  onClaim?: (item: Item) => void;
}

export function getCategoryIcon(category: string, className = 'w-4 h-4') {
  switch (category) {
    case 'Electronics':
      return <Laptop className={className} />;
    case 'Bags & Luggage':
      return <Briefcase className={className} />;
    case 'Keys & Badges':
      return <Key className={className} />;
    case 'Documents & IDs':
      return <CreditCard className={className} />;
    case 'Clothing & Footwear':
      return <Shirt className={className} />;
    case 'Books & Stationery':
      return <BookOpen className={className} />;
    case 'Personal Accessories':
      return <Headphones className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect, onClaim }) => {
  const isLost = item.type === 'lost';
  const hasImage = item.images && item.images.length > 0 && Boolean(item.images[0].url);
  const primaryImage = item.images?.[0];

  return (
    <div
      onClick={() => onSelect(item)}
      className="group cursor-pointer rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-md flex flex-col overflow-hidden"
    >
      {/* Visual Asset Container with Zero-Broken-Image Policy */}
      <div className="relative aspect-[16/10] w-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden flex items-center justify-center">
        {hasImage && primaryImage?.url ? (
          <img
            src={primaryImage.url}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-slate-400 dark:text-slate-500">
            {getCategoryIcon(item.category, 'w-10 h-10 stroke-[1.5] mb-2 text-slate-300 dark:text-slate-600')}
            <span className="text-xs font-medium">{item.category}</span>
          </div>
        )}

        {/* Type Identifier Badge in quiet corner */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md shadow-xs ${
              isLost
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {isLost ? 'Lost Item' : 'Found Item'}
          </span>
          {primaryImage?.isIllustrative && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-900/80 text-slate-200 backdrop-blur-xs rounded-md">
              AI Reference
            </span>
          )}
        </div>

        {/* Status indicator */}
        {item.status !== 'open' && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[10px] font-medium bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-700 dark:text-slate-200 rounded-md shadow-xs capitalize">
            {item.status}
          </div>
        )}
      </div>

      {/* Card Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata strictly following Zero-Pill discipline (unboxed text with · separators) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>{item.category}</span>
            <span aria-hidden="true">·</span>
            <span>{item.subcategory}</span>
            {item.brand && item.brand !== 'Unmarked' && (
              <>
                <span aria-hidden="true">·</span>
                <span>{item.brand}</span>
              </>
            )}
          </div>

          {/* Item Title */}
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {item.title}
          </h3>

          {/* Description snippet */}
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Card Footer: Location and Date */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1 truncate max-w-[65%]">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{item.location}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 font-mono text-[11px] tabular-nums">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{item.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
