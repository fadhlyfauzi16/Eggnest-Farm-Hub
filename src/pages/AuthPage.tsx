import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { EggnestLogo } from '../components/common/EggnestLogo';
import {
  KeyRound,
  Phone,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Mail,
  Home,
  Info,
  ArrowLeft,
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onBackToLanding?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onBackToLanding }) => {
  const { login, registerMember, showToast } = useFarm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlMode = searchParams.get('mode');
  const [mode, setMode] = useState<'login' | 'register'>(
    urlMode === 'register' || urlMode === 'login' ? urlMode : initialMode
  );
  const [loginRole, setLoginRole] = useState<'member' | 'admin'>('member');

  useEffect(() => {
    const qMode = searchParams.get('mode');
    if (qMode === 'register' || qMode === 'login') {
      setMode(qMode);
    }
  }, [searchParams]);

  // Member Login state
  const [memberPhone, setMemberPhone] = useState('081234567890');
  const [memberPassword, setMemberPassword] = useState('password123');

  // Admin Login state
  const [adminIdentifier, setAdminIdentifier] = useState('admin@eggnest.id');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Register Member state
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFarmCode, setRegFarmCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Quick Demo Autofill helpers
  const autofillMemberDemo = () => {
    setMode('login');
    setLoginRole('member');
    setMemberPhone('081234567890');
    setMemberPassword('password123');
    setErrorMessage(null);
  };

  const autofillAdminDemo = () => {
    setMode('login');
    setLoginRole('admin');
    setAdminIdentifier('admin@eggnest.id');
    setAdminPassword('admin123');
    setErrorMessage(null);
  };

  const autofillNewRegistrationDemo = () => {
    setMode('register');
    setRegFullName('Ahmad Dahlan');
    setRegPhone('081299112233');
    setRegPassword('pass1234');
    setRegConfirmPassword('pass1234');
    setRegFarmCode('EN-000128'); // Available unactivated farm
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (loginRole === 'member') {
        if (!memberPhone.trim() || !memberPassword) {
          setErrorMessage('Nomor WhatsApp dan password wajib diisi.');
          setIsLoading(false);
          return;
        }

        const res = await login({
          role: 'member',
          phone: memberPhone.trim(),
          password: memberPassword,
        });

        if (res.success) {
          navigate('/home');
        } else {
          setErrorMessage(res.message);
        }
      } else {
        if (!adminIdentifier.trim() || !adminPassword) {
          setErrorMessage('Email/Username admin dan password wajib diisi.');
          setIsLoading(false);
          return;
        }

        const res = await login({
          role: 'admin',
          identifier: adminIdentifier.trim(),
          password: adminPassword,
        });

        if (res.success) {
          navigate('/admin');
        } else {
          setErrorMessage(res.message);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regFullName.trim()) {
      setErrorMessage('Nama Lengkap wajib diisi.');
      return;
    }
    if (!regPhone.trim()) {
      setErrorMessage('Nomor WhatsApp wajib diisi.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password minimal 6 karakter.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok.');
      return;
    }
    if (!regFarmCode.trim()) {
      setErrorMessage('Farm ID / Kode Aktivasi wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerMember({
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        farmCode: regFarmCode.trim().toUpperCase(),
      });

      if (res.success) {
        navigate('/home');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registrasi gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (onBackToLanding) {
      onBackToLanding();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans'] text-[#1B3022] selection:bg-[#EAF2EC]">
      {/* Back button */}
      <div className="max-w-md w-full mx-auto px-4 mb-4 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#1B3022] transition-colors cursor-pointer py-1.5 px-3 rounded-xl bg-white border border-[#EFECE6] shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </button>
        <div className="text-[11px] text-stone-500 font-medium ml-auto">
          Eggnest Secure Portal
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white border border-[#EFECE6] shadow-xs mb-1">
            <EggnestLogo size="lg" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B3022] font-['Outfit'] tracking-tight">
            EGGNEST FARM HUB
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Sistem Pendamping & Pengelolaan Ayam Petelur Rumahan
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-6 bg-white py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-[#EFECE6] space-y-6 relative overflow-hidden">
          {/* Top Toggle: MASUK vs DAFTAR */}
          <div className="grid grid-cols-2 p-1 bg-[#FAF7F2] rounded-2xl border border-[#EFECE6]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`py-2.5 text-sm font-extrabold rounded-xl transition-all cursor-pointer font-['Outfit'] ${
                mode === 'login'
                  ? 'bg-[#1B3022] text-[#FDFBF7] shadow-sm'
                  : 'text-stone-600 hover:text-[#1B3022]'
              }`}
            >
              MASUK
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`py-2.5 text-sm font-extrabold rounded-xl transition-all cursor-pointer font-['Outfit'] ${
                mode === 'register'
                  ? 'bg-[#1B3022] text-[#FDFBF7] shadow-sm'
                  : 'text-stone-600 hover:text-[#1B3022]'
              }`}
            >
              DAFTAR
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-5">
              {/* Segmented Selector: [ MEMBER ] [ ADMIN ] */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
                  Pilih Jenis Akun
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginRole('member');
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-3 text-xs font-black rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      loginRole === 'member'
                        ? 'bg-[#EAF2EC] border-[#2D4A36] text-[#1B3022] shadow-xs'
                        : 'bg-[#FAF7F2] border-[#EFECE6] text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>MEMBER KANDANG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginRole('admin');
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-3 text-xs font-black rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      loginRole === 'admin'
                        ? 'bg-[#1B3022] border-[#1B3022] text-[#FDFBF7] shadow-xs'
                        : 'bg-[#FAF7F2] border-[#EFECE6] text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span>ADMIN EGGNEST</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {loginRole === 'member' ? (
                  /* Member Inputs */
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700">
                      Nomor WhatsApp
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={memberPhone}
                        onChange={(e) => setMemberPhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full pl-10 pr-4 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-sm font-semibold text-[#1B3022] focus:outline-none focus:ring-2 focus:ring-[#2D4A36] focus:bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  /* Admin Inputs */
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700">
                      Email atau Username Admin
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={adminIdentifier}
                        onChange={(e) => setAdminIdentifier(e.target.value)}
                        placeholder="admin@eggnest.id"
                        className="w-full pl-10 pr-4 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-sm font-semibold text-[#1B3022] focus:outline-none focus:ring-2 focus:ring-[#2D4A36] focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-700">
                      Password
                    </label>
                    <span
                      onClick={() => showToast('Hubungi CS Eggnest di 0812-8899-7700 untuk reset password akun Anda.')}
                      className="text-[11px] font-bold text-[#2D4A36] hover:underline cursor-pointer"
                    >
                      Lupa Password?
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginRole === 'member' ? memberPassword : adminPassword}
                      onChange={(e) =>
                        loginRole === 'member'
                          ? setMemberPassword(e.target.value)
                          : setAdminPassword(e.target.value)
                      }
                      placeholder="Masukkan password Anda"
                      className="w-full pl-10 pr-11 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-sm font-semibold text-[#1B3022] focus:outline-none focus:ring-2 focus:ring-[#2D4A36] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-4 bg-[#1B3022] hover:bg-[#2D4A36] text-[#FDFBF7] font-black text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="text-sm font-bold">Memverifikasi...</span>
                  ) : (
                    <>
                      <span>MASUK SEKARANG</span>
                      <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-[#EFECE6]">
                <p className="text-xs text-stone-600">
                  Belum punya akun member?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage(null);
                    }}
                    className="font-bold text-[#1B3022] hover:underline cursor-pointer"
                  >
                    DAFTAR SEKARANG
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* MODE: REGISTER MEMBER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">
                  Nama Lengkap Pemilik Kandang
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-sm font-semibold text-[#1B3022] focus:outline-none focus:ring-2 focus:ring-[#2D4A36] focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">
                  Nomor WhatsApp Aktif
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-sm font-semibold text-[#1B3022] focus:outline-none focus:ring-2 focus:ring-[#2D4A36] focus:bg-white"
                  />
                </div>
              </div>

              {/* Farm ID Verification Field */}
              <div className="space-y-1 p-3.5 bg-[#EAF2EC] rounded-2xl border border-[#CDE3D3]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1B3022]">
                    Farm ID / Kode Aktivasi
                  </label>
                  <span className="text-[10px] font-bold text-[#2D4A36]">
                    Wajib Valid
                  </span>
                </div>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#2D4A36]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regFarmCode}
                    onChange={(e) => setRegFarmCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: EN-000128"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#CDE3D3] rounded-xl text-sm font-mono font-bold text-[#1B3022] uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#2D4A36]"
                  />
                </div>
                <p className="text-[11px] text-stone-600 mt-1">
                  Kode tertera pada sertifikat paket ayam / kardus kandang Eggnest Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">
                    Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 karakter"
                    className="w-full px-3.5 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-sm font-semibold text-[#1B3022] focus:outline-none focus:ring-2 focus:ring-[#2D4A36] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">
                    Konfirmasi Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    className="w-full px-3.5 py-3 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl text-sm font-semibold text-[#1B3022] focus:outline-none focus:ring-2 focus:ring-[#2D4A36] focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-4 bg-[#1B3022] hover:bg-[#2D4A36] text-[#FDFBF7] font-black text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span className="text-sm font-bold">Mendaftarkan...</span>
                ) : (
                  <>
                    <span>BUAT AKUN MEMBER</span>
                    <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-[#EFECE6]">
                <p className="text-xs text-stone-600">
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                    }}
                    className="font-bold text-[#1B3022] hover:underline cursor-pointer"
                  >
                    MASUK DI SINI
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Quick Demo Selector Box (For easy review & testing) */}
          <div className="pt-4 border-t border-[#EFECE6] bg-[#FAF7F2] -mx-6 -mb-8 p-6 space-y-2.5">
            <span className="text-[10px] font-black tracking-wider text-stone-500 uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Pintasan Pengujian Demo:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={autofillMemberDemo}
                className="p-2 text-left bg-white hover:bg-stone-50 border border-[#EFECE6] rounded-xl text-[11px] font-bold text-[#1B3022] transition-colors cursor-pointer shadow-2xs"
              >
                👤 Member Demo (Budi)
                <span className="block font-normal text-[10px] text-stone-500">EN-000127</span>
              </button>

              <button
                type="button"
                onClick={autofillAdminDemo}
                className="p-2 text-left bg-white hover:bg-stone-50 border border-[#EFECE6] rounded-xl text-[11px] font-bold text-[#1B3022] transition-colors cursor-pointer shadow-2xs"
              >
                🛡️ Admin Control
                <span className="block font-normal text-[10px] text-stone-500">admin@eggnest.id</span>
              </button>

              <button
                type="button"
                onClick={autofillNewRegistrationDemo}
                className="p-2 text-left bg-white hover:bg-stone-50 border border-[#EFECE6] rounded-xl text-[11px] font-bold text-[#1B3022] transition-colors cursor-pointer shadow-2xs"
              >
                ✨ Register Baru
                <span className="block font-normal text-[10px] text-stone-500">Klaim EN-000128</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
