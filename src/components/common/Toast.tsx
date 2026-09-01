import React from 'react';
import { useFarm } from '../../context/FarmContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useFarm();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 animate-bounce transition-all duration-300">
      <div className="bg-[#1B4332] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-[#40916C]/40 flex items-center gap-3 max-w-md text-sm md:text-base font-semibold">
        <span className="text-xl">✨</span>
        <span className="leading-snug">{toastMessage}</span>
      </div>
    </div>
  );
};
