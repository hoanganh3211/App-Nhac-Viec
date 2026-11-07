import React, { useState } from 'react';
import { Sparkles, Plus, LogIn, AlertCircle, LogOut } from 'lucide-react';
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
  onCreateRoom,
}) => {
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [inputVal, setInputVal] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('');
  const [creatorNameInput, setCreatorNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = extractCode(inputVal);
    if (!code) return;

    setIsLoading(true);
    setErrorMessage(null);
    const success = await onJoinByCode(code);
    setIsLoading(false);

    if (!success) {
      setErrorMessage(`Không tìm thấy phòng "${code}". Vui lòng kiểm tra lại!`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
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
      {/* Current user header */}
      {currentUser && (
        <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-xl">{currentUser.avatar || '👤'}</span>
            <span className="text-xs font-bold text-slate-800 truncate">{currentUser.username}</span>
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

      {/* Hero */}
      <div className="text-center space-y-2 my-auto">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg mx-auto">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">ViệcNhà</h1>
        <p className="text-xs text-slate-500">Phân chia việc nhà công bằng & đơn giản</p>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/90 space-y-4 my-auto">
        {/* Toggle tabs */}
        <div className="p-1 bg-slate-100 rounded-2xl flex space-x-1 text-xs font-semibold">
          <button
            onClick={() => { setMode('join'); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              mode === 'join'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vào phòng
          </button>
          <button
            onClick={() => { setMode('create'); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              mode === 'create'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tạo phòng mới
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {mode === 'join' ? (
          <form onSubmit={handleJoin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhập mã phòng hoặc link mời:
              </label>
              <input
                type="text"
                required
                placeholder="VD: P-8K2A hoặc dán link"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-center font-bold tracking-wider focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Đang vào...' : 'Vào Phòng'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên phòng:
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Phòng 402"
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {!currentUser && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên của bạn:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng"
                  value={creatorNameInput}
                  onChange={(e) => setCreatorNameInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !roomNameInput.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isLoading ? 'Đang tạo...' : 'Tạo Phòng'}</span>
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-[11px] text-slate-400 py-2">
        ViệcNhà • Tối giản & Hiệu quả
      </div>
    </div>
  );
};
