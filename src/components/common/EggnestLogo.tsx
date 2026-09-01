import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  hideTextOnMobile?: boolean;
  showText?: boolean;
}

export const EggnestLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'dark',
  showTagline = false,
  hideTextOnMobile = false,
  showText = true,
}) => {
  const isLight = variant === 'light';
  
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  };

  const subSizes = {
    sm: 'text-[9px] sm:text-[10px]',
    md: 'text-[10px] sm:text-xs',
    lg: 'text-xs sm:text-sm',
  };

  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      {/* Icon: Egg + Leaf fusion */}
      <div
        className={`relative ${iconSizes[size]} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
          isLight
            ? 'bg-white/10 text-white border border-white/20'
            : 'bg-gradient-to-br from-[#1B3022] to-[#2D4A36] text-[#D4AF37] shadow-sm shadow-[#1B3022]/10'
        }`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4 drop-shadow-xs"
        >
          {/* Egg silhouette */}
          <path
            d="M24 6C15.5 6 9 17.5 9 29C9 37 15.7 43 24 43C32.3 43 39 37 39 29C39 17.5 32.5 6 24 6Z"
            fill={isLight ? '#FFFFFF' : '#FDFBF7'}
          />
          {/* Golden Yolk Core */}
          <circle cx="24" cy="28" r="9" fill="#D4AF37" />
          <circle cx="22" cy="26" r="3" fill="#F3E5AB" opacity="0.8" />
          
          {/* Organic Leaf curved across the egg */}
          <path
            d="M24 8C27 15 35 18 36 26C32 23 26 21 24 8Z"
            fill="#588157"
          />
          <path
            d="M22 13C25 18 30 20 32 24"
            stroke="#2D4A36"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className={`${hideTextOnMobile ? 'hidden sm:flex' : 'flex'} flex-col`}>
          <div className="flex items-baseline gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight font-['Outfit'] ${titleSizes[size]} ${
                isLight ? 'text-white' : 'text-[#1B3022]'
              }`}
            >
              EGGNEST
            </span>
            <span
              className={`font-bold tracking-wider font-['Outfit'] ${subSizes[size]} px-1.5 py-0.5 rounded ${
                isLight
                  ? 'bg-[#D4AF37] text-[#1B3022]'
                  : 'bg-[#EAF2EC] text-[#1B3022] border border-[#CDE3D3]'
              }`}
            >
              FARM HUB
            </span>
          </div>
          {showTagline && (
            <p
              className={`text-xs mt-1 font-medium ${
                isLight ? 'text-white/80' : 'text-[#3A5A40]'
              }`}
            >
              Kelola kandang & pantau ayam Anda
            </p>
          )}
        </div>
      )}
    </div>
  );
};
