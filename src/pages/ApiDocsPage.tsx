import React, { useState } from 'react';
import {
  Code2,
  Database,
  Key,
  Copy,
  Check,
  Server,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';

export const ApiDocsPage: React.FC = () => {
  const { showToast } = useFarm();
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(label);
    showToast(`📋 ${label} disalin ke clipboard!`);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/farms/{farm_code}',
      description: 'Mendapatkan profil lengkap kandang, jumlah ayam aktif, usia, dan status garansi.',
      sampleResponse: `{
  "status": "success",
  "data": {
    "farm_code": "EN-000127",
    "owner_name": "Pak Budi Santoso",
    "location": "Depok, Jawa Barat",
    "active_chickens": 12,
    "current_age_weeks": 22,
    "warranty_end": "2026-08-19",
    "status": "active"
  }
}`,
    },
    {
      method: 'POST',
      path: '/api/v1/farms/{farm_code}/reports',
      description: 'Menginput pencatatan harian produksi telur, konsumsi pakan, dan kondisi kawanan ayam.',
      sampleRequest: `{
  "date": "2026-08-31",
  "egg_count": 10,
  "feed_kg": 1.2,
  "chicken_condition": "healthy",
  "notes": "Ayam aktif dan sehat",
  "photo_url": "https://..."
}`,
      sampleResponse: `{
  "status": "success",
  "message": "Daily report saved successfully",
  "data": {
    "report_id": "rep-98124",
    "productivity_rate": 83.3,
    "status": "BAIK"
  }
}`,
    },
    {
      method: 'GET',
      path: '/api/v1/farms/{farm_code}/analytics?month=2026-08',
      description: 'Mendapatkan kalkulasi produktivitas 30 hari, estimasi nilai telur, dan trigger peringatan dini.',
      sampleResponse: `{
  "status": "success",
  "analytics": {
    "total_eggs": 287,
    "average_per_day": 9.6,
    "productivity_rate": 83,
    "total_feed_kg": 37.2,
    "estimated_value_idr": 430500,
    "farm_score": 92
  }
}`,
    },
    {
      method: 'POST',
      path: '/api/v1/tickets',
      description: 'Membuat tiket konsultasi keluhan penyakit / penurunan produksi ke tim dokter hewan Eggnest.',
      sampleRequest: `{
  "farm_code": "EN-000127",
  "category": "Produksi Menurun",
  "egg_count_today": 8,
  "description": "Cuaca agak terik dan telur sedikit berkurang",
  "photo_url": "https://..."
}`,
      sampleResponse: `{
  "status": "success",
  "ticket_code": "EN-CS-00921",
  "status": "Diterima"
}`,
    },
  ];

  const dbTables = [
    {
      name: 'users',
      fields: ['id', 'full_name', 'phone', 'password', 'role', 'created_at'],
    },
    {
      name: 'farms',
      fields: [
        'id',
        'farm_code',
        'user_id',
        'location',
        'activation_date',
        'initial_chickens',
        'active_chickens',
        'chicken_age',
        'warranty_end',
        'status',
        'photo',
      ],
    },
    {
      name: 'daily_reports',
      fields: [
        'id',
        'farm_id',
        'date',
        'egg_count',
        'feed_kg',
        'chicken_condition',
        'notes',
        'photo',
        'created_at',
      ],
    },
    {
      name: 'farm_scores',
      fields: [
        'id',
        'farm_id',
        'production_score',
        'report_score',
        'maintenance_score',
        'health_score',
        'total_score',
        'updated_at',
      ],
    },
    {
      name: 'support_tickets',
      fields: [
        'id',
        'farm_id',
        'category',
        'description',
        'photo',
        'status',
        'created_at',
        'updated_at',
      ],
    },
    {
      name: 'academy_contents',
      fields: [
        'id',
        'title',
        'category',
        'description',
        'content',
        'video_url',
        'thumbnail',
        'age_min',
        'age_max',
        'created_at',
      ],
    },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <span className="px-3 py-1 bg-[#EAF2EC] text-[#1B3022] text-xs font-bold rounded-full border border-[#CDE3D3]">
          REST API & Skema Database
        </span>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight mt-1">
          Dokumentasi Integrasi Eggnest API
        </h1>
        <p className="text-stone-600 text-sm font-medium mt-1">
          Panduan integrasi pihak ketiga untuk sensor IoT kandang pintar, logistik pakan, dan sistem bot WhatsApp.
        </p>
      </div>

      {/* Auth Banner */}
      <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FEF6E9] text-[#78350F] rounded-2xl border border-[#FDE68A]">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#1B3022] text-base font-['Outfit']">Autentikasi API Key</h3>
            <p className="text-xs text-stone-500">
              Sertakan header <code>Authorization: Bearer EGGNEST_SECRET_KEY</code> pada setiap request.
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-[#FAF7F2] rounded-xl text-xs font-mono text-stone-700 border border-[#EFECE6]">
          Base URL: <strong>https://api.eggnest.id/v1</strong>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit'] flex items-center gap-2">
          <Server className="w-5 h-5 text-[#2D4A36]" />
          REST Endpoints
        </h3>

        <div className="space-y-4">
          {endpoints.map((ep) => (
            <div
              key={ep.path}
              className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFECE6] pb-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black tracking-wider ${
                      ep.method === 'GET'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-[#EAF2EC] text-[#1B3022] border border-[#CDE3D3]'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="font-mono text-sm font-bold text-[#1B3022]">{ep.path}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(ep.path, ep.path)}
                  className="p-1.5 text-stone-400 hover:text-[#2D4A36] hover:bg-[#FAF7F2] rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                  title="Salin Path"
                >
                  {copiedEndpoint === ep.path ? <Check className="w-4 h-4 text-[#2D4A36]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-xs text-stone-600 font-medium">{ep.description}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
                {ep.sampleRequest && (
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                      Request Body (JSON)
                    </span>
                    <pre className="bg-[#1B3022] text-[#EAF2EC] p-3.5 rounded-2xl overflow-x-auto leading-relaxed border border-[#2D4A36]">
                      {ep.sampleRequest}
                    </pre>
                  </div>
                )}
                <div className={ep.sampleRequest ? '' : 'lg:col-span-2'}>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    Response Output (200 OK)
                  </span>
                  <pre className="bg-[#1B3022] text-[#D4AF37] p-3.5 rounded-2xl overflow-x-auto leading-relaxed border border-[#2D4A36]">
                    {ep.sampleResponse}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database Schema Section */}
      <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-[#1B3022] font-['Outfit'] flex items-center gap-2">
            <Database className="w-5 h-5 text-[#2D4A36]" />
            Struktur Tabel Database (Section 12 Specification)
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Relasi data PostgreSQL / SQLite untuk arsitektur backend Eggnest
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dbTables.map((tbl) => (
            <div
              key={tbl.name}
              className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6] space-y-2"
            >
              <div className="flex items-center gap-2 border-b border-[#EFECE6] pb-2">
                <span className="w-2 h-2 rounded-full bg-[#2D4A36]"></span>
                <h4 className="font-mono font-bold text-sm text-[#1B3022]">{tbl.name}</h4>
              </div>
              <ul className="space-y-1 font-mono text-[11px] text-stone-600">
                {tbl.fields.map((f) => (
                  <li key={f} className="flex items-center justify-between">
                    <span>• {f}</span>
                    <span className="text-[10px] text-stone-400">
                      {f === 'id' ? 'PK' : f.includes('_id') ? 'FK' : 'varchar'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
