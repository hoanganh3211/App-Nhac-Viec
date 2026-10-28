import React, { useState } from 'react';
import { 
  Sparkles, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { UserAccount } from '../types';
import { 
  loginAccount, 
  registerAccount, 
  AVATAR_OPTIONS 
} from '../utils/auth';

interface AuthScreenProps {
  onAuthSuccess: (user: UserAccount, isNewRegistration?: boolean) => void;
  pendingRoomCode?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  pendingRoomCode,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showLoginPin, setShowLoginPin] = useState(false);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regConfirmPin, setRegConfirmPin] = useState('');
  const [showRegPin, setShowRegPin] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);

  // Status
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await loginAccount(loginUsername, loginPin);
      setIsLoading(false);

      if (res.success && res.user) {
        onAuthSuccess(res.user, false);
      } else {
        setError(res.error || 'Đăng nhập không thành công.');
      }
    } catch {
      setIsLoading(false);
      setError('Lỗi kết nối cơ sở dữ liệu đám mây. Vui lòng kiểm tra lại mạng hoặc cấu hình!');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPin !== regConfirmPin) {
      setError('Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerAccount(regUsername, regPin, selectedAvatar);
      setIsLoading(false);

      if (res.success && res.user) {
        onAuthSuccess(res.user, true);
      } else {
        setError(res.error || 'Đăng ký tài khoản không thành công.');
      }
    } catch {
      setIsLoading(false);
      setError('Lỗi kết nối cơ sở dữ liệu đám mây. Vui lòng kiểm tra lại mạng hoặc cấu hình!');
    }
  };

  return (
    <div 
      className="min-h-screen max-w-md mx-auto p-4 flex flex-col justify-between font-sans bg-slate-50"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 1.5rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)',
      }}
    >
      {/* Top Header Branding */}
      <div className="pt-2 text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-200 mx-auto transform hover:scale-105 transition-transform">
          <Sparkles className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            ViệcNhà
          </h1>
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-0.5">
            Chia việc công bằng • Sống hoà thuận
          </p>
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-200/80 space-y-4 my-auto">
        {/* Pending Invite Room Banner */}
        {pendingRoomCode && (
          <div className="p-3 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-indigo-950 flex items-center space-x-1">
                <span>Lời mời vào phòng:</span>
                <span className="font-mono text-indigo-600 bg-white px-1.5 py-0.2 rounded border border-indigo-200">
                  {pendingRoomCode}
                </span>
              </div>
              <p className="text-[10px] text-indigo-700/80">
                Đăng nhập hoặc tạo tài khoản để vào phòng ngay!
              </p>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="p-1 bg-slate-100 rounded-2xl flex space-x-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'login'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Đăng Nhập</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'register'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Đăng Ký Tài Khoản</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-start space-x-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="flex-1 font-medium">{error}</span>
          </div>
        )}

        {/* TAB 1: ĐĂNG NHẬP */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên đăng nhập của bạn..."
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Mật khẩu (6 số)</span>
                <span className="text-[10px] text-slate-400 font-normal">Mã PIN 6 số</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showLoginPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  placeholder="Nhập 6 số mật khẩu..."
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm tracking-widest focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPin(!showLoginPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !loginUsername.trim() || loginPin.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-2xl shadow-md shadow-indigo-200 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setError(null);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Chưa có tài khoản? Đăng ký tại đây →
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setLoginUsername('admin');
                  setLoginPin('888888');
                  setError(null);
                }}
                className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center space-x-1.5 transition cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100"
                title="Bấm để tự động điền tài khoản Quản trị viên"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Đăng nhập Admin (admin / 888888)</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ĐĂNG KÝ */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên đăng nhập / Tên hiển thị <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Anh, Minh Tuấn..."
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                💡 Tên này sẽ dùng để hiển thị cho mọi người và nhận thông báo phân việc.
              </p>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Chọn Avatar đại diện:</span>
                <span className="text-xl">{selectedAvatar}</span>
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200/80 rounded-2xl max-h-24 overflow-y-auto">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-8 h-8 text-base rounded-xl flex items-center justify-center transition cursor-pointer ${
                      selectedAvatar === av
                        ? 'bg-indigo-600 text-white shadow-xs scale-110'
                        : 'bg-white hover:bg-slate-200'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Password PIN 6 digits */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu (6 số) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    placeholder="6 chữ số"
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs tracking-widest focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhập lại (6 số) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    placeholder="Khớp 6 số"
                    value={regConfirmPin}
                    onChange={(e) => setRegConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs tracking-widest focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <button
                type="button"
                onClick={() => setShowRegPin(!showRegPin)}
                className="flex items-center space-x-1 text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                {showRegPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showRegPin ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</span>
              </button>
              <span className="text-[10px] text-indigo-600 font-medium">Chỉ cần 6 số PIN</span>
            </div>

            <button
              type="submit"
              disabled={
                isLoading || 
                !regUsername.trim() || 
                regPin.length !== 6 || 
                regPin !== regConfirmPin
              }
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-200 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Đang tạo...' : 'Tạo Tài Khoản & Vào App'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError(null);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Đã có tài khoản rồi? Đăng nhập ngay →
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-400 space-y-1 pb-2">
        <div className="flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bảo mật danh tính & đồng bộ dữ liệu thời gian thực</span>
        </div>
        <p>© 2026 ViệcNhà • Độc lập & Công bằng</p>
      </div>
    </div>
  );
};
