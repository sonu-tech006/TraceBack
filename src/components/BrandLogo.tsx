import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  showTagline?: boolean;
}

export const BrandIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="tb-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      {/* Outer location radar ring */}
      <circle cx="14" cy="14" r="10" stroke="url(#tb-grad)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Inner beacon / discovery star diamond */}
      <path
        d="M14 8L15.6 12.4L20 14L15.6 15.6L14 20L12.4 15.6L8 14L12.4 12.4L14 8Z"
        fill="url(#tb-grad)"
      />
      {/* Search lens handle extending like a recovery trace */}
      <path
        d="M21.5 21.5L29 29"
        stroke="url(#tb-grad)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Small discovery pulse node */}
      <circle cx="28" cy="10" r="2.2" fill="#06B6D4" />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 28, className = '' }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <BrandIcon size={size} />
      <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
        TraceBack
      </span>
    </div>
  );
};
