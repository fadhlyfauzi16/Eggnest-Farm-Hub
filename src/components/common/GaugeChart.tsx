import React from 'react';

interface GaugeChartProps {
  score: number; // 0 - 100
  max?: number;
  size?: number;
  label?: string;
  statusText?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  score,
  max = 100,
  size = 240,
  label = 'Score Kandang',
  statusText = 'SANGAT BAIK',
}) => {
  const percentage = Math.min(Math.max(score / max, 0), 1);
  const strokeWidth = 20;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = Math.PI * radius; // Semi-circle circumference
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg
        width={size}
        height={size * 0.65}
        viewBox={`0 0 ${size} ${size * 0.7}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E63946" />
            <stop offset="35%" stopColor="#D4AF37" />
            <stop offset="70%" stopColor="#52796F" />
            <stop offset="100%" stopColor="#2D4A36" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2D4A36" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Background Arc */}
        <path
          d={`M ${strokeWidth},${size * 0.55} A ${radius},${radius} 0 0,1 ${size - strokeWidth},${size * 0.55}`}
          fill="none"
          stroke="#EFECE6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Foreground Value Arc */}
        <path
          d={`M ${strokeWidth},${size * 0.55} A ${radius},${radius} 0 0,1 ${size - strokeWidth},${size * 0.55}`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />

        {/* Tick marks */}
        <circle cx={strokeWidth} cy={size * 0.55} r={3} fill="#C5BFB3" />
        <circle cx={size / 2} cy={strokeWidth + 5} r={3} fill="#C5BFB3" />
        <circle cx={size - strokeWidth} cy={size * 0.55} r={3} fill="#C5BFB3" />
      </svg>

      {/* Center Score Display */}
      <div className="absolute top-[35%] flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl md:text-5xl font-black text-[#1B3022] font-['Outfit'] tracking-tight">
            {score}
          </span>
          <span className="text-xl md:text-2xl font-bold text-[#2D4A36]">/ 100</span>
        </div>
        <span className="text-xs md:text-sm font-bold tracking-wider text-[#1B3022] bg-[#EAF2EC] border border-[#CDE3D3] px-3 py-1 rounded-full mt-1 uppercase shadow-xs">
          {statusText}
        </span>
        <span className="text-xs text-stone-500 mt-1 font-medium">{label}</span>
      </div>
    </div>
  );
};
