import React from 'react';

interface EggnestLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
  goldColor?: string;
  greenColor?: string;
}

export const EggnestLogo: React.FC<EggnestLogoProps> = ({
  className = '',
  size = 40,
  showText = true,
  textColor = '#F7F1E4',
  goldColor = '#E9B949',
  greenColor = '#153A24',
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`} id="eggnest-brand-logo">
      <div
        className="relative shrink-0 rounded-full overflow-hidden border-2 border-[#E9B949]/60 shadow-lg shadow-[#E9B949]/10 transition-transform duration-300 hover:scale-105 bg-[#0C1F14]"
        style={{ width: size, height: size }}
      >
        <img
          src="/eggnest-logo.jpg"
          alt="Eggnest Home Farm Logo"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {showText && (
        <div className="flex flex-col tracking-wider leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className="font-display font-medium text-base sm:text-lg tracking-[0.2em] uppercase"
              style={{ color: textColor }}
            >
              EGGNEST
            </span>
            <span
              className="font-sans text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded tracking-widest uppercase bg-[#E9B949] text-[#153A24]"
            >
              FARM
            </span>
          </div>
          <span
            className="text-[9px] sm:text-[10px] tracking-[0.28em] uppercase font-light mt-1 text-[#D1C8B8]"
          >
            1 Rumah 1 Kandang
          </span>
        </div>
      )}
    </div>
  );
};
