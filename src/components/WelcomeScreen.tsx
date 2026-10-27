import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  LogIn, 
  Link as LinkIcon, 
  AlertCircle,
  Scale,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { UserAccount } from '../types';

interface WelcomeScreenProps {
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onJoinByCode: (roomCode: string) => Promise<boolean>;
  onJoinByLink: (linkOrCode: string) => Promise<boolean>;
  onCreateRoom: (roomName: string, creatorName: string) => Promise<string>;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  currentUser,
  onLogout,
  onJoinByCode,
  onJoinByLink,
  onCreateRoom,
}) => {
  const [activeMethod, setActiveMethod] = useState<'code' | 'link' | 'create'>('code');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [roomNameInput, setNewRoomNameInput] = useState('');
  const [creatorNameInput, setCreatorNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to extract room code from invite URL or raw code
  const extractCode = (input: string): string => {
    const trimmed = input.trim();
    try {
      if (trimmed.includes('room=')) {
        const urlStr = trimmed.startsWith('http') ? trimmed : `https://dummy.com/${trimmed}`;
        const url = new URL(urlStr);
        const code = url.searchParams.get('room');
        if (code) return code.toUpperCase();
      }
    } catch {}
    return trimmed.toUpperCase();
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) return;

    setIsLoading(true);
    setErrorMessage(null);
    const success = await onJoinByCode(code);
    setIsLoading(false);

    if (!success) {
      setErrorMessage(`Không tìm thấy phòng với mã "${code}". Vui lòng kiểm tra lại hoặc tạo phòng mới!`);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const extracted = extractCode(linkInput);
    if (!extracted) {
      setErrorMessage('Đường link không hợp lệ hoặc không chứa mã phòng.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    const success = await onJoinByLink(extracted);
    setIsLoading(false);

    if (!success) {
      setErrorMessage(`Không thể kết nối vào phòng từ link này. Mã phòng "${extracted}" không tồn tại.`);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCreatorName = currentUser?.username || creatorNameInput.trim();
    if (!roomNameInput.trim() || !finalCreatorName) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await onCreateRoom(roomNameInput.trim(), finalCreatorName);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
      setErrorMessage('Có lỗi xảy ra khi tạo phòng. Vui lòng thử lại!');
    }
  };

  return (
    <div 
      className="min-h-screen max-w-md mx-auto p-4 flex flex-col justify-between font-sans bg-slate-50"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 1rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)',
      }}
    >
      {/* Current Logged-in User Bar */}
      {currentUser && (
        <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs mb-2">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-xl">{currentUser.avatar || '👤'}</span>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Đang đăng nhập:</div>
              <div className="text-xs font-bold text-slate-800 truncate">{currentUser.username}</div>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl font-semibold flex items-center space-x-1 cursor-pointer transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      )}

      {/* Top Branding Section */}
      <div className="pt-4 text-center space-y-3">
        {/* App Logo */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-300 mx-auto animate-bounce-subtle">
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

        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Ứng dụng theo dõi việc làm chung cho nhóm ở chung, phân chia công bằng theo điểm và chống đùn đẩy việc nhà.
        </p>
      </div>

      {/* Main Entry Card */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/90 space-y-4 my-auto">
        {/* 3 Entry Tabs */}
        <div className="p-1 bg-slate-100 rounded-2xl flex space-x-1 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveMethod('code');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition ${
              activeMethod === 'code'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhập mã phòng
          </button>

          <button
            onClick={() => {
              setActiveMethod('link');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition ${
              activeMethod === 'link'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dán link mời
          </button>

          <button
            onClick={() => {
              setActiveMethod('create');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition ${
              activeMethod === 'create'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tạo phòng mới
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-[11px] flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* METHOD 1: Enter Room Code */}
        {activeMethod === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhập mã phòng của bạn cùng phòng:
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: P-8K2A hoặc PHONG-302"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono uppercase text-center font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Mã phòng gồm 6 ký tự do người tạo phòng chia sẻ cho bạn.
            </p>

            <button
              type="submit"
              disabled={isLoading || !roomCodeInput.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-indigo-100 transition flex items-center justify-center space-x-1.5 text-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Đang vào phòng...' : 'Tham Gia Phòng Ngay'}</span>
            </button>
          </form>
        )}

        {/* METHOD 2: Paste Invite Link */}
        {activeMethod === 'link' && (
          <form onSubmit={handleLinkSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dán đường link mời bạn nhận được:
              </label>
              <input
                type="text"
                required
                placeholder="https://.../?room=P-XXXX"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Dán toàn bộ link Zalo hoặc link web mà bạn cùng phòng gửi cho bạn.
            </p>

            <button
              type="submit"
              disabled={isLoading || !linkInput.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md shadow-blue-100 transition flex items-center justify-center space-x-1.5 text-xs"
            >
              <LinkIcon className="w-4 h-4" />
              <span>{isLoading ? 'Đang kiểm tra link...' : 'Vào Phòng Từ Link'}</span>
            </button>
          </form>
        )}

        {/* METHOD 3: Create New Room */}
        {activeMethod === 'create' && (
          <form onSubmit={handleCreateSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên phòng / Nhà trọ của bạn:
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Phòng 402 - Độc Đắc"
                value={roomNameInput}
                onChange={(e) => setNewRoomNameInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {currentUser ? (
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{currentUser.avatar || '👤'}</span>
                  <div>
                    <div className="text-[10px] text-indigo-700 font-semibold uppercase">Người tạo phòng:</div>
                    <div className="text-xs font-bold text-slate-800">{currentUser.username}</div>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                  Tài khoản của bạn
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên của bạn:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Anh"
                  value={creatorNameInput}
                  onChange={(e) => setCreatorNameInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="p-2.5 bg-indigo-50 rounded-2xl text-[11px] text-indigo-900 border border-indigo-100">
              ✨ Sau khi tạo, hệ thống sẽ sinh <strong>Mã phòng riêng</strong> và link mời để bạn gửi vào nhóm Zalo cho các bạn cùng phòng.
            </div>

            <button
              type="submit"
              disabled={isLoading || !roomNameInput.trim() || (!currentUser && !creatorNameInput.trim())}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-indigo-100 transition flex items-center justify-center space-x-1.5 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isLoading ? 'Đang tạo phòng...' : 'Tạo Phòng & Lấy Mã'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Feature Badges Footer */}
      <div className="grid grid-cols-3 gap-2 text-center pt-2">
        <div className="p-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <Scale className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
          <div className="text-[10px] font-bold text-slate-800">Chia công bằng</div>
          <div className="text-[9px] text-slate-400">Tính điểm độ nặng</div>
        </div>

        <div className="p-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <Sparkles className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <div className="text-[10px] font-bold text-slate-800">Nhượng việc</div>
          <div className="text-[9px] text-slate-400">Bảo lưu + thưởng</div>
        </div>

        <div className="p-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
          <div className="text-[10px] font-bold text-slate-800">Riêng biệt 100%</div>
          <div className="text-[9px] text-slate-400">Bảo mật mã phòng</div>
        </div>
      </div>
    </div>
  );
};
