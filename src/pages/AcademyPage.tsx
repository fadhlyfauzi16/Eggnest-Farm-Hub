import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { AcademyCategory, AcademyContent } from '../types';
import {
  GraduationCap,
  Play,
  BookOpen,
  Egg,
  Wheat,
  HeartPulse,
  Sparkles,
  Droplets,
  HelpCircle,
  Clock,
  CheckCircle,
  X,
  Share2,
  Bookmark,
} from 'lucide-react';

export const AcademyPage: React.FC = () => {
  const { academyContents } = useFarm();
  const [selectedCategory, setSelectedCategory] = useState<AcademyCategory | 'Semua'>('Semua');
  const [activeContent, setActiveContent] = useState<AcademyContent | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const categories: { name: AcademyCategory | 'Semua'; icon: React.FC<{ className?: string }> }[] = [
    { name: 'Semua', icon: BookOpen },
    { name: 'Produksi Telur', icon: Egg },
    { name: 'Pakan', icon: Wheat },
    { name: 'Kesehatan Ayam', icon: HeartPulse },
    { name: 'Kebersihan Kandang', icon: Sparkles },
    { name: 'Air Minum', icon: Droplets },
    { name: 'Permasalahan Umum', icon: HelpCircle },
  ];

  const publishedContents = academyContents.filter((c) => c.published);

  const recommendedItem =
    publishedContents.find((c) => c.isRecommended) || publishedContents[0] || academyContents[0];

  const filteredContents = publishedContents.filter((c) => {
    if (selectedCategory === 'Semua') return true;
    return c.category === selectedCategory;
  });

  const toggleSave = (id: string) => {
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter((item) => item !== id));
    } else {
      setSavedIds([...savedIds, id]);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <span className="px-3 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-bold rounded-full border border-[#CDE3D3]">
          Pusat Edukasi Mitra
        </span>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight mt-1">
          Eggnest Academy
        </h1>
        <p className="text-stone-600 text-sm font-medium mt-1">
          Belajar beternak lebih mudah dengan panduan praktis dan video singkat 2 menit.
        </p>
      </div>

      {/* Bagian: Rekomendasi Untuk Anda (Featured Video Card) */}
      {recommendedItem && (
        <div className="bg-[#1B3022] text-[#FDFBF7] rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-[#2D4A36]">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-[#D4AF37] text-[#1B3022] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider font-['Outfit']">
              ⭐ REKOMENDASI UNTUK ANDA
            </span>
            <span className="text-xs text-[#EAF2EC]/80">Kesesuaian Usia Ayam: 20–25 Minggu</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Video Thumbnail Preview */}
            <div
              onClick={() => setActiveContent(recommendedItem)}
              className="lg:col-span-6 relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer group aspect-video bg-black/40 border border-white/20"
            >
              <img
                src={recommendedItem.thumbnail}
                alt={recommendedItem.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#D4AF37] text-[#1B3022] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
              </div>
              <span className="absolute bottom-3 right-3 bg-black/80 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                ⏱ {recommendedItem.duration || '2 Menit'}
              </span>
            </div>

            {/* Description & Action */}
            <div className="lg:col-span-6 space-y-3">
              <h2 className="text-2xl md:text-3xl font-black font-['Outfit'] text-[#FDFBF7] leading-tight">
                {recommendedItem.title}
              </h2>
              <p className="text-[#EAF2EC]/90 text-sm font-medium leading-relaxed">
                {recommendedItem.description}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveContent(recommendedItem)}
                  className="px-6 py-3.5 bg-[#D4AF37] hover:bg-[#E5B842] text-[#1B3022] font-black rounded-2xl text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 font-['Outfit']"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Buka Panduan Lengkap
                </button>
                <button
                  onClick={() => toggleSave(recommendedItem.id)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-colors cursor-pointer"
                  title="Simpan Materi"
                >
                  <Bookmark
                    className={`w-5 h-5 ${
                      savedIds.includes(recommendedItem.id) ? 'fill-current text-[#D4AF37]' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kategori dengan Icon Besar */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-[#1B3022] font-['Outfit']">
          Pilih Kategori Pembelajaran:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2D4A36] text-[#FDFBF7] border-[#2D4A36] shadow-md ring-2 ring-[#2D4A36]/30 font-bold'
                    : 'bg-white text-stone-700 border-[#EFECE6] hover:bg-[#FAF7F2]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-white/20 text-[#FDFBF7]' : 'bg-[#FAF7F2] text-[#2D4A36]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daftar Materi Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1B3022] font-['Outfit']">
            Materi: <span className="text-[#2D4A36]">{selectedCategory}</span>
          </h3>
          <span className="text-xs text-stone-500 font-medium">
            {filteredContents.length} panduan tersedia
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContents.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveContent(item)}
              className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-[#FAF7F2] overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[#1B3022] text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-xs border border-[#EFECE6]">
                  {item.category}
                </span>
                {item.type === 'video' ? (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 text-[#1B3022] flex items-center justify-center shadow-md">
                      <Play className="w-6 h-6 fill-current ml-0.5 text-[#2D4A36]" />
                    </div>
                  </div>
                ) : (
                  <span className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    📖 {item.readTime || item.duration || '3 mnt'}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-[#1B3022] group-hover:text-[#2D4A36] transition-colors leading-snug line-clamp-2 font-['Outfit']">
                    {item.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EFECE6] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2D4A36] flex items-center gap-1 group-hover:underline">
                    Buka Materi →
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(item.id);
                    }}
                    className="p-1 text-stone-400 hover:text-[#2D4A36]"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        savedIds.includes(item.id) ? 'fill-current text-[#2D4A36]' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Modal Reader / Video Player */}
      {activeContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#EFECE6] w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 md:p-6 border-b border-[#EFECE6] flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <span className="text-xs font-bold text-[#1B3022] bg-[#EAF2EC] px-2.5 py-0.5 rounded-full uppercase border border-[#CDE3D3]">
                  {activeContent.category}
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-[#1B3022] font-['Outfit'] mt-1">
                  {activeContent.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveContent(null)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Media preview */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-900 shadow-md">
                <img
                  src={activeContent.thumbnail}
                  alt={activeContent.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37] text-[#1B3022] flex items-center justify-center mb-2 shadow-lg">
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </div>
                  <span className="text-sm font-bold font-['Outfit']">Panduan Edukasi Eggnest</span>
                  <span className="text-xs text-white/80">Durasi: {activeContent.duration || '2 menit'}</span>
                </div>
              </div>

              {/* Text Body */}
              <div className="text-stone-700 text-sm md:text-base leading-relaxed whitespace-pre-line">
                {activeContent.content}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#EFECE6] bg-[#FAF7F2] flex items-center justify-between">
              <span className="text-xs text-stone-500 font-medium">
                Ditinjau oleh Tim Dokter Hewan & Teknis Eggnest
              </span>
              <button
                onClick={() => setActiveContent(null)}
                className="px-5 py-2.5 bg-[#2D4A36] text-[#FDFBF7] font-bold text-sm rounded-xl hover:bg-[#1B3022] cursor-pointer"
              >
                Selesai Belajar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
