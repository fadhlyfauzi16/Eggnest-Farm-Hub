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
  hideTextOnMobile = false,
  showText = true,
}) => {
  const isLight = variant === 'light';

  const logoSizes = {
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-20',
  };

  const titleSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  };

  const badgeSizes = {
    sm: 'text-[9px] sm:text-[10px]',
    md: 'text-[10px] sm:text-xs',
    lg: 'text-xs sm:text-sm',
  };

  return (
    <div className="flex items-center gap-2.5">
      
      {/* Logo resmi Eggnest Home Farm */}
      <img
        src="/eggnest-logo.png"
        alt="Eggnest Home Farm"
        className={`${logoSizes[size]} w-auto object-contain shrink-0`}
      />

      {/* EGGNEST + FARM HUB */}
      {showText && (
        <div
          className={`${
            hideTextOnMobile ? 'hidden sm:flex' : 'flex'
          } items-center gap-2`}
        >
          <span
            className={`font-black tracking-tight font-['Outfit'] ${
              titleSizes[size]
            } ${
              isLight ? 'text-white' : 'text-[#1B3022]'
            }`}
          >
            EGGNEST
          </span>

          <span
            className={`font-bold tracking-wider font-['Outfit'] ${
              badgeSizes[size]
            } px-2 py-1 rounded-md ${
              isLight
                ? 'bg-white/15 text-white border border-white/20'
                : 'bg-[#EAF2EC] text-[#1B3022] border border-[#CDE3D3]'
            }`}
          >
            FARM HUB
          </span>
        </div>
      )}

    </div>
  );
};