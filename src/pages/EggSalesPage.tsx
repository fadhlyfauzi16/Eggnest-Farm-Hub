import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useFarm } from '../context/FarmContext';
import {
  Banknote,
  CalendarDays,
  Edit3,
  Egg,
  PackageCheck,
  Plus,
  RefreshCw,
  Save,
  ShoppingBasket,
  Trash2,
  X,
} from 'lucide-react';

type Sale = {
  id: string;
  farmId: string;
  farmCode?: string;
  ownerName?: string;
  saleDate: string;
  priceBasis: 'kg' | 'egg';
  eggCount: number;
  weightKg: number | null;
  unitPrice: number;
  totalAmount: number;
  buyerName?: string | null;
  notes?: string | null;
};

const todayKey = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const monthKey = () => todayKey().slice(0, 7);

const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export const EggSalesPage: React.FC = () => {
  const { farm, showToast } = useFarm();
  const [month, setMonth] = useState(monthKey());
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<any>({
    transactionCount: 0,
    totalEggs: 0,
    totalWeightKg: 0,
    totalAmount: 0,
    averagePricePerKg: 0,
    producedEggs: 0,
    availableEggs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    saleDate: todayKey(),
    priceBasis: 'kg' as 'kg' | 'egg',
    eggCount: '',
    weightKg: '',
    unitPrice: '',
    buyerName: '',
    notes: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.getEggSales({ month });
      setSales((res.sales || []) as Sale[]);
      setSummary(res.summary || {});
    } catch (e: any) {
      showToast(e?.message || 'Gagal memuat penjualan telur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  const totalPreview = useMemo(() => {
    const count = Number(form.eggCount || 0);
    const weight = Number(form.weightKg || 0);
    const price = Number(form.unitPrice || 0);
    return form.priceBasis === 'kg' ? Math.round(weight * price) : Math.round(count * price);
  }, [form]);

  const reset = () => {
    setEditing(null);
    setForm({
      saleDate: todayKey(),
      priceBasis: 'kg',
      eggCount: '',
      weightKg: '',
      unitPrice: '',
      buyerName: '',
      notes: '',
    });
  };

  const startNew = () => {
    reset();
    setOpen(true);
  };

  const startEdit = (sale: Sale) => {
    setEditing(sale);
    setForm({
      saleDate: sale.saleDate,
      priceBasis: sale.priceBasis,
      eggCount: String(sale.eggCount),
      weightKg: sale.weightKg == null ? '' : String(sale.weightKg),
      unitPrice: String(sale.unitPrice),
      buyerName: sale.buyerName || '',
      notes: sale.notes || '',
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        saleDate: form.saleDate,
        priceBasis: form.priceBasis,
        eggCount: Number(form.eggCount),
        weightKg: form.priceBasis === 'kg' ? Number(form.weightKg) : null,
        unitPrice: Number(form.unitPrice),
        buyerName: form.buyerName.trim(),
        notes: form.notes.trim(),
      };
      if (editing) {
        await api.updateEggSale(editing.id, payload);
        showToast('Penjualan berhasil diperbarui.');
      } else {
        await api.createEggSale(payload);
        showToast('Penjualan telur berhasil dicatat.');
      }
      setOpen(false);
      reset();
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan penjualan.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (sale: Sale) => {
    if (!window.confirm(`Hapus transaksi ${sale.saleDate} sebesar ${rupiah(sale.totalAmount)}?`)) return;
    try {
      await api.deleteEggSale(sale.id);
      showToast('Transaksi dihapus.');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Gagal menghapus transaksi.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="inline-flex px-3 py-1 rounded-full bg-[#EAF2EC] border border-[#CDE3D3] text-[11px] font-black text-[#2D4A36]">
            DATA PENJUALAN NYATA
          </span>
          <h1 className="text-3xl md:text-4xl font-black font-['Outfit'] mt-2 text-[#1B3022]">
            Penjualan Telur
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Catat hanya telur yang benar-benar terjual. Produksi kandang dan penjualan tetap menjadi dua data terpisah.
          </p>
          <div className="text-xs font-bold text-[#2D4A36] mt-2">
            Farm ID: {farm.farmCode || '-'}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white border border-[#E5E1D8] font-bold text-sm"
          />
          <button
            onClick={load}
            className="px-4 py-2.5 rounded-2xl bg-white border border-[#E5E1D8] font-bold text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Perbarui
          </button>
          <button
            onClick={startNew}
            className="px-4 py-2.5 rounded-2xl bg-[#D4AF37] text-[#1B3022] font-black text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Catat Penjualan
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={Banknote} label="Omzet Bulan Ini" value={rupiah(summary.totalAmount)} />
        <Metric icon={Egg} label="Telur Terjual" value={`${summary.totalEggs || 0} butir`} />
        <Metric icon={ShoppingBasket} label="Transaksi" value={`${summary.transactionCount || 0} kali`} />
        <Metric icon={PackageCheck} label="Stok Tercatat" value={`${summary.availableEggs || 0} butir`} />
      </section>

      <div className="rounded-3xl bg-[#EAF2EC] border border-[#CDE3D3] p-4 text-xs text-[#1B3022]">
        <strong>Stok tercatat</strong> dihitung dari total produksi pada laporan kandang dikurangi total telur yang sudah dicatat terjual.
        Sistem akan menolak transaksi jika jumlah telur melebihi stok produksi yang tercatat.
      </div>

      <section className="bg-white rounded-3xl border border-[#EFECE6] overflow-hidden">
        <div className="p-5 border-b border-[#EFECE6]">
          <h2 className="font-black text-xl text-[#1B3022]">Riwayat Penjualan</h2>
          <p className="text-xs text-stone-500 mt-1">Transaksi bulan {month}.</p>
        </div>

        {loading ? (
          <div className="py-14 text-center text-sm font-bold text-stone-400">Memuat...</div>
        ) : sales.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <ShoppingBasket className="w-10 h-10 mx-auto text-stone-300" />
            <div className="font-black mt-3">Belum ada penjualan bulan ini</div>
            <p className="text-xs text-stone-500 mt-1">Klik “Catat Penjualan” setelah telur benar-benar terjual.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EFECE6]">
            {sales.map((sale) => (
              <div key={sale.id} className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <CalendarDays className="w-4 h-4" />
                    {sale.saleDate}
                  </div>
                  <div className="font-black text-lg mt-1">{rupiah(sale.totalAmount)}</div>
                  <div className="text-xs text-stone-500 mt-1">
                    {sale.eggCount} butir
                    {sale.priceBasis === 'kg'
                      ? ` • ${sale.weightKg || 0} kg • ${rupiah(sale.unitPrice)}/kg`
                      : ` • ${rupiah(sale.unitPrice)}/butir`}
                    {sale.buyerName ? ` • ${sale.buyerName}` : ''}
                  </div>
                  {sale.notes && <div className="text-xs text-stone-600 mt-2">{sale.notes}</div>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(sale)}
                    className="px-4 py-2.5 rounded-2xl border border-[#E5E1D8] text-xs font-black flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => remove(sale)}
                    className="px-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 p-3 flex items-center justify-center">
          <form
            onSubmit={submit}
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
          >
            <div className="sticky top-0 z-10 bg-[#1B3022] text-white p-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#D4AF37] font-black uppercase">
                  {editing ? 'Edit Transaksi' : 'Penjualan Baru'}
                </div>
                <h2 className="text-xl font-black mt-1">Catat Penjualan Telur</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <label className="block text-xs font-black">
                Tanggal Penjualan *
                <input
                  type="date"
                  required
                  value={form.saleDate}
                  onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
                  className="mt-2 w-full p-3 rounded-2xl border"
                />
              </label>

              <label className="block text-xs font-black">
                Jumlah Telur Terjual (butir) *
                <input
                  type="number"
                  min="1"
                  required
                  value={form.eggCount}
                  onChange={(e) => setForm({ ...form, eggCount: e.target.value })}
                  placeholder={`Maks. stok tercatat ${summary.availableEggs || 0} butir`}
                  className="mt-2 w-full p-3 rounded-2xl border"
                />
              </label>

              <div>
                <div className="text-xs font-black mb-2">Cara Menentukan Harga *</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, priceBasis: 'kg' })}
                    className={`p-3 rounded-2xl border font-black text-xs ${
                      form.priceBasis === 'kg'
                        ? 'bg-[#2D4A36] text-white border-[#2D4A36]'
                        : 'bg-white'
                    }`}
                  >
                    Harga per Kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, priceBasis: 'egg', weightKg: '' })}
                    className={`p-3 rounded-2xl border font-black text-xs ${
                      form.priceBasis === 'egg'
                        ? 'bg-[#2D4A36] text-white border-[#2D4A36]'
                        : 'bg-white'
                    }`}
                  >
                    Harga per Butir
                  </button>
                </div>
              </div>

              {form.priceBasis === 'kg' && (
                <label className="block text-xs font-black">
                  Berat Telur yang Terjual (kg) *
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.weightKg}
                    onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                    placeholder="Contoh: 2"
                    className="mt-2 w-full p-3 rounded-2xl border"
                  />
                </label>
              )}

              <label className="block text-xs font-black">
                {form.priceBasis === 'kg' ? 'Harga Jual per Kg *' : 'Harga Jual per Butir *'}
                <input
                  type="number"
                  min="1"
                  required
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                  placeholder={form.priceBasis === 'kg' ? 'Contoh: 24000' : 'Contoh: 1500'}
                  className="mt-2 w-full p-3 rounded-2xl border"
                />
              </label>

              <div className="rounded-3xl bg-[#FFF8E1] border border-[#E8CD62] p-5">
                <div className="text-[10px] font-black text-stone-500 uppercase">Total Penjualan</div>
                <div className="text-3xl font-black text-[#1B3022] mt-1">{rupiah(totalPreview)}</div>
                <div className="text-xs text-stone-500 mt-1">Dihitung otomatis dari data yang Anda isi.</div>
              </div>

              <label className="block text-xs font-black">
                Pembeli / Tujuan Penjualan (opsional)
                <input
                  value={form.buyerName}
                  onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                  placeholder="Contoh: Tetangga, warung, reseller"
                  className="mt-2 w-full p-3 rounded-2xl border"
                />
              </label>

              <label className="block text-xs font-black">
                Catatan (opsional)
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="mt-2 w-full p-3 rounded-2xl border"
                  placeholder="Catatan singkat transaksi..."
                />
              </label>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 py-3 rounded-2xl border font-black text-xs"
              >
                Batal
              </button>
              <button
                disabled={saving}
                className="flex-[2] py-3 rounded-2xl bg-[#D4AF37] text-[#1B3022] font-black text-xs flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan Penjualan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const Metric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <div className="bg-white border border-[#EFECE6] rounded-3xl p-4 md:p-5">
    <Icon className="w-5 h-5 text-[#2D4A36]" />
    <div className="text-xl md:text-2xl font-black mt-2 text-[#1B3022]">{value}</div>
    <div className="text-xs font-bold text-stone-500 mt-1">{label}</div>
  </div>
);

export default EggSalesPage;
