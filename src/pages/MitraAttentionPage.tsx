import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Egg, HeartPulse } from 'lucide-react';

type FarmRow = any;
type ReportRow = any;

const todayJakarta = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const Chip: React.FC<{ icon: React.ElementType; children: React.ReactNode }> = ({
  icon: Icon,
  children,
}) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-100 text-stone-700">
    <Icon className="w-3.5 h-3.5" />
    {children}
  </span>
);

export const MitraAttentionPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<FarmRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const [dashboardRes, reportsRes] = await Promise.all([
          api.getMitraDashboard(),
          api.getReports(),
        ]);

        if (!active) return;
        setFarms(dashboardRes?.farms || []);
        setReports(reportsRes?.reports || []);
      } catch (err) {
        console.error('Gagal memuat halaman Perlu Perhatian:', err);
        if (active) {
          setFarms([]);
          setReports([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const cases = useMemo(() => {
    const today = todayJakarta();

    return farms
      .map((farm: any) => {
        const farmReports = reports
          .filter((r: any) => (r.farmId ?? r.farm_id) === farm.id)
          .sort((a: any, b: any) =>
            String(b.date ?? b.report_date ?? '').localeCompare(
              String(a.date ?? a.report_date ?? '')
            )
          );

        const latest = farmReports[0];
        const latestDate = latest?.date ?? latest?.report_date;
        const missing = latestDate !== today;

        const eggCount = Number(latest?.eggCount ?? latest?.egg_count ?? 0);
        const activeChickens = Number(
          farm.activeChickens ?? farm.active_chickens ?? farm.initialChickens ?? 12
        );
        const low = Boolean(latest) && activeChickens > 0 && eggCount < activeChickens * 0.6;

        const chickenReports = Array.isArray(latest?.chickenReports)
          ? latest.chickenReports
          : Array.isArray(latest?.chicken_reports)
          ? latest.chicken_reports
          : [];

        const bad = chickenReports.filter((x: any) => {
          const condition = String(x.condition || '').toUpperCase();
          return condition === 'SICK' || condition === 'DEAD';
        });

        const severity =
          bad.some((x: any) => String(x.condition || '').toUpperCase() === 'DEAD')
            ? 'critical'
            : bad.length > 0 || low
            ? 'warning'
            : missing
            ? 'missing'
            : 'ok';

        return { farm, latest, missing, low, bad, severity };
      })
      .filter((item: any) => item.severity !== 'ok')
      .sort((a: any, b: any) => {
        const rank: Record<string, number> = { critical: 0, warning: 1, missing: 2 };
        return (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9);
      });
  }, [farms, reports]);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-black uppercase tracking-wider text-[#2D4A36]">
          Portal Mitra Pendamping
        </div>
        <h1 className="text-2xl md:text-3xl font-black mt-1">Perlu Perhatian</h1>
        <p className="text-sm text-stone-500 mt-1">
          Kandang yang belum dilaporkan, produksi menurun, atau ayam yang membutuhkan tindak lanjut.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center font-bold text-stone-400">Memuat data...</div>
      ) : cases.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
          <h2 className="font-black text-xl mt-3">Tidak ada kasus aktif</h2>
          <p className="text-sm text-emerald-700 mt-1">
            Seluruh kandang binaan dalam kondisi terpantau.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c: any) => (
            <div
              key={c.farm.id}
              className={`bg-white rounded-3xl border p-5 ${
                c.severity === 'critical'
                  ? 'border-rose-200'
                  : c.severity === 'warning'
                  ? 'border-amber-200'
                  : 'border-[#EFECE6]'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="font-mono">
                      {c.farm.farmCode ?? c.farm.farm_code}
                    </strong>
                    <span
                      className={`text-[9px] font-black px-2 py-1 rounded-full ${
                        c.severity === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : c.severity === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {c.severity === 'critical'
                        ? 'KRITIS'
                        : c.severity === 'warning'
                        ? 'PERLU PERHATIAN'
                        : 'BELUM LAPOR'}
                    </span>
                  </div>

                  <h3 className="font-black text-lg mt-1">
                    {c.farm.ownerName ?? c.farm.owner_name}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {c.missing && (
                      <Chip icon={Clock3}>Laporan hari ini belum ada</Chip>
                    )}

                    {c.low && (
                      <Chip icon={Egg}>
                        Produksi terbaru rendah: {c.latest?.eggCount ?? c.latest?.egg_count ?? 0} telur
                      </Chip>
                    )}

                    {c.bad.map((x: any, i: number) => {
                      const number = x.chickenNumber ?? x.chicken_number;
                      const dead = String(x.condition || '').toUpperCase() === 'DEAD';
                      const notes = String(x.customNotes ?? x.custom_notes ?? '');

                      return (
                        <React.Fragment key={`${c.farm.id}-${number ?? i}-${i}`}>
                          <Chip icon={HeartPulse}>
                            Ayam #{number}: {dead ? 'mati' : 'sakit'}
                            {notes ? ` — ${notes}` : ''}
                          </Chip>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {c.latest?.notes && (
                    <p className="text-xs text-stone-500 mt-3">
                      Catatan terakhir: {c.latest.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/mitra/support?farmId=${encodeURIComponent(c.farm.id)}`)
                    }
                    className="px-4 py-2.5 rounded-2xl border font-black text-xs flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Konsultasi
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/mitra/reports?farmId=${encodeURIComponent(c.farm.id)}`)
                    }
                    className="px-4 py-2.5 rounded-2xl bg-[#D4AF37] font-black text-xs flex items-center gap-2"
                  >
                    Buka Laporan
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MitraAttentionPage;
