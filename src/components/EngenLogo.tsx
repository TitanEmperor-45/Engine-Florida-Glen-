import React, { useState } from 'react';
import logoImg from '../assets/images/engen_florida_glen_logo_1791460528638.jpg';

interface EngenLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  redBox?: boolean;
  subtitleText?: string;
  titleText?: string;
}

export const EngenLogo: React.FC<EngenLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  redBox = false,
  subtitleText,
  titleText,
}) => {
  const [imgError, setImgError] = useState(false);

  const containerSizes = {
    sm: 'w-8 h-8 p-0.5',
    md: 'w-11 h-11 p-1',
    lg: 'w-14 h-14 p-1.5',
    xl: 'w-20 h-20 p-2',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const badgeBoxClass = redBox
    ? 'border-2 border-red-600 ring-2 ring-red-100 shadow-sm'
    : 'border border-slate-200 shadow-xs';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Engen Logo Badge (Red Box Container with Blue/White Emblem) */}
      <div
        className={`${containerSizes[size]} rounded-xl bg-white shrink-0 ${badgeBoxClass} flex items-center justify-center overflow-hidden transition-transform`}
      >
        {!imgError ? (
          <img
            src={logoImg}
            alt="Engen Florida-Glen Logo"
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          /* SVG Fallback Emblem (only displayed if image file fails to load) */
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            <rect width="100" height="100" rx="16" fill="#003B73" />
            <circle cx="50" cy="40" r="26" fill="#FFFFFF" stroke="#DE1B22" strokeWidth="5" />
            <path
              d="M36 40 C36 32 44 28 56 28 C64 28 68 32 68 36 C68 40 64 43 54 43 L42 43 C40 43 38 45 38 48 C38 51 41 53 48 53 L64 53"
              stroke="#DE1B22"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <text
              x="50"
              y="82"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="14"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
              letterSpacing="1.5"
            >
              ENGEN
            </text>
          </svg>
        )}
      </div>

      <div>
        <div className="flex items-center gap-1.5 leading-tight">
          <span className={`${titleSizes[size]} font-black tracking-tight text-[#003B73]`}>
            ENGEN
          </span>
          <span className={`${titleSizes[size]} font-extrabold text-[#E31837]`}>
            •
          </span>
          <span className={`${titleSizes[size]} font-bold text-slate-900 tracking-tight`}>
            {titleText || 'Florida-Glen'}
          </span>
        </div>
        {showSubtitle && (
          <div className="text-[11px] sm:text-xs text-slate-600 font-semibold tracking-normal flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
            <span className="text-slate-700 font-medium">
              {subtitleText || 'Florida-Glen : Service Station and Convenient Store'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

