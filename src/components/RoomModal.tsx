import React, { useState } from 'react';
import { X, Copy } from 'lucide-react';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: { roomCode: string; roomName: string };
  onJoinRoom: (code: string) => Promise<boolean>;
  onCreateRoom: (name: string, creator: string) => Promise<string>;
}

export const RoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, state, onJoinRoom }) => {
  const [joinCode, setJoinCode] = useState('');
  const [toast, setToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 1500);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(state.roomCode);
    showToast();
  };

  const copyLink = async () => {
    const url = `${window.location.origin}?room=${state.roomCode}`;
    await navigator.clipboard.writeText(url);
    showToast();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError('');
    const ok = await onJoinRoom(code);
    setLoading(false);
    if (ok) {
      setJoinCode('');
      onClose();
    } else {
      setError('Không tìm thấy phòng này.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60" onClick={onClose}>
      <div className="bg-white w-full max-w-xs rounded-3xl shadow-2xl p-5 relative" onClick={(e) => e.stopPropagation()}>
        {/* Toast */}
        {toast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Đã copy!
          </div>
        )}

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
          <X className="w-5 h-5" />
        </button>

        {/* Current room */}
        <div className="text-center mb-4">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Mã phòng</p>
          <button onClick={copyCode} className="text-2xl font-extrabold font-mono text-indigo-600 tracking-widest hover:text-indigo-800 transition">
            {state.roomCode}
          </button>
          <p className="text-[11px] text-slate-400 mt-1">{state.roomName}</p>
        </div>

        <button onClick={copyLink} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition">
          <Copy className="w-3.5 h-3.5" />
          Copy link mời
        </button>

        {/* Divider */}
        <div className="border-t border-slate-200 my-4" />

        {/* Join room */}
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập mã phòng..."
            value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase text-center font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !joinCode.trim()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition"
          >
            {loading ? '...' : 'Vào'}
          </button>
        </form>
        {error && <p className="text-[11px] text-rose-600 mt-1.5 text-center">{error}</p>}
      </div>
    </div>
  );
};
