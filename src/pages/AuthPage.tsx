import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { EggnestLogo } from '../components/common/EggnestLogo';
import { ArrowLeft, Eye, EyeOff, Lock, Phone, ShieldCheck, Users, User as UserIcon } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login } = useFarm();
  const navigate = useNavigate();

  const [loginRole, setLoginRole] = useState<'member' | 'mitra' | 'admin'>('member');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [mitraPhone, setMitraPhone] = useState('');
  const [mitraPassword, setMitraPassword] = useState('');
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (loginRole === 'member') {
        if (!memberPhone.trim() || !memberPassword) throw new Error('Nomor WhatsApp dan password wajib diisi.');
        const res = await login({ role: 'member', phone: memberPhone.trim(), password: memberPassword });
        if (res.success) navigate('/home'); else setErrorMessage(res.message);
      } else if (loginRole === 'mitra') {
        if (!mitraPhone.trim() || !mitraPassword) throw new Error('Nomor WhatsApp dan password Mitra wajib diisi.');
        const res = await login({ role: 'mitra', phone: mitraPhone.trim(), password: mitraPassword });
        if (res.success) navigate('/mitra'); else setErrorMessage(res.message);
      } else {
        if (!adminIdentifier.trim() || !adminPassword) throw new Error('Email/Username admin dan password wajib diisi.');
        const res = await login({ role: 'admin', identifier: adminIdentifier.trim(), password: adminPassword });
        if (res.success) navigate('/admin'); else setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleItems = [
    { id: 'member' as const, label: 'MEMBER', icon: UserIcon },
    { id: 'mitra' as const, label: 'MITRA', icon: Users },
    { id: 'admin' as const, label: 'ADMIN', icon: ShieldCheck },
  ];

  const password =
    loginRole === 'member' ? memberPassword : loginRole === 'mitra' ? mitraPassword : adminPassword;
  const setPassword =
    loginRole === 'member' ? setMemberPassword : loginRole === 'mitra' ? setMitraPassword : setAdminPassword;

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans'] text-[#1B3022]">
      <div className="max-w-md w-full mx-auto px-4 mb-4">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 bg-white border border-[#EFECE6] px-3 py-2 rounded-xl">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white border border-[#EFECE6] shadow-sm">
            <EggnestLogo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-['Outfit']">EGGNEST FARM HUB</h1>
          <p className="text-sm text-stone-600">Portal Member, Mitra Pendamping & Administrator</p>
        </div>

        <div className="mt-6 bg-white p-6 sm:p-8 shadow-xl rounded-3xl border border-[#EFECE6]">
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#FAF7F2] rounded-2xl border border-[#EFECE6] mb-6">
            {roleItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setLoginRole(id); setErrorMessage(null); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 ${
                  loginRole === id ? 'bg-[#1B3022] text-white shadow-sm' : 'text-stone-600'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginRole === 'admin' ? (
              <div>
                <label className="block text-xs font-black mb-1.5">Email / Username Admin</label>
                <input
                  value={adminIdentifier}
                  onChange={(e) => setAdminIdentifier(e.target.value)}
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E1D8] bg-[#FAF7F2]"
                  placeholder="Masukkan akun Admin"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-black mb-1.5">
                  Nomor WhatsApp {loginRole === 'mitra' ? 'Mitra' : 'Member'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
                  <input
                    value={loginRole === 'member' ? memberPhone : mitraPhone}
                    onChange={(e) => loginRole === 'member' ? setMemberPhone(e.target.value) : setMitraPhone(e.target.value)}
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E1D8] bg-[#FAF7F2]"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#E5E1D8] bg-[#FAF7F2]"
                  placeholder="Masukkan password"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-3 text-stone-500">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {errorMessage && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">{errorMessage}</div>}

            <button disabled={isLoading} className="w-full py-3.5 rounded-xl bg-[#1B3022] text-white font-black">
              {isLoading ? 'Memeriksa akun...' : 'MASUK'}
            </button>
          </form>

          <div className="mt-5 rounded-2xl bg-[#EAF2EC] border border-[#CDE3D3] p-4 text-xs leading-relaxed text-[#1B3022]">
            <b>Akun tidak dibuat dari halaman ini.</b><br />
            Akun Member dan Mitra Pendamping hanya dibuat oleh Administrator Eggnest. Gunakan data login yang diberikan Admin.
          </div>
        </div>
      </div>
    </div>
  );
};
