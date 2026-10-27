import React, { useState } from 'react';
import { 
  X, 
  Home, 
  Plus, 
  LogIn, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  AlertCircle,
  Users
} from 'lucide-react';
import { AppState } from '../types';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onJoinRoom: (roomCode: string) => Promise<boolean>;
  onCreateRoom: (roomName: string, creatorName: string) => Promise<string>;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  state,
  onJoinRoom,
  onCreateRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'join' | 'create'>('current');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const inviteUrl = `${window.location.origin}?room=${encodeURIComponent(state.roomCode)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShareZalo = async () => {
    const text = `🏠 Tham gia nhóm việc nhà [${state.roomName}] của phòng mình nhé!\n👉 Bấm vào link để vào phòng: ${inviteUrl}\n🔑 Hoặc nhập mã phòng: ${state.roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mời vào phòng ViệcNhà', text });
        return;
      } catch {}
    }
    await handleCopyLink();
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    setIsLoading(true);
    setErrorMessage(null);
    const success = await onJoinRoom(cleanCode);
    setIsLoading(false);

    if (success) {
      onClose();
      setJoinCodeInput('');
    } else {
      setErrorMessage(`Không tìm thấy phòng với mã "${cleanCode}". Hãy kiểm tra lại hoặc tạo phòng mới!`);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !creatorName.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await onCreateRoom(newRoomName.trim(), creatorName.trim());
      setIsLoading(false);
      setActiveTab('current');
      onClose();
    } catch {
      setIsLoading(false);
      setErrorMessage('Có lỗi xảy ra khi tạo phòng. Vui lòng thử lại!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white/20 rounded-xl">
              <Home className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Quản Lý Phòng Chung</h3>
              <p className="text-[10px] text-indigo-100">Mỗi phòng là một không gian riêng biệt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-2 bg-slate-100 flex space-x-1 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('current');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-xl transition ${
              activeTab === 'current'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phòng hiện tại
          </button>
          <button
            onClick={() => {
              setActiveTab('join');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-xl transition ${
              activeTab === 'join'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhập mã vào
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-xl transition ${
              activeTab === 'create'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + Tạo phòng
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-[11px] flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: Current Room & Share */}
          {activeTab === 'current' && (
            <div className="space-y-3.5">
              {/* Room Badge */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Bạn đang ở phòng
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm">{state.roomName}</h4>
                <div className="flex items-center justify-center space-x-1.5 pt-1">
                  <span className="text-[11px] text-slate-500">Mã phòng:</span>
                  <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200/60 text-xs">
                    {state.roomCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 text-slate-500 hover:text-indigo-600"
                    title="Sao chép mã phòng"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Members preview */}
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Thành viên ({state.members.length}):</span>
                </span>
                <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                  {state.members.map((m) => m.name).join(', ')}
                </span>
              </div>

              {/* Invite Link Box */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
                <div className="font-bold text-indigo-900 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Link mời bạn cùng phòng:</span>
                </div>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="flex-1 p-2 bg-white border border-indigo-200 rounded-xl text-[10px] font-mono text-slate-600 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center space-x-1 transition text-xs shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Đã chép' : 'Chép'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-indigo-800/80">
                  Người khác bấm vào link này sẽ vào thẳng phòng này và chọn tên mình!
                </p>
              </div>

              {/* Share button */}
              <button
                onClick={handleShareZalo}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition text-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Gửi Link Mời Qua Zalo</span>
              </button>
            </div>
          )}

          {/* TAB 2: Join by Room Code */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhập mã phòng được chia sẻ:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: P-8K2A hoặc PHONG-302"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase text-center font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                💡 Bạn cùng phòng có thể tìm thấy mã này trong mục <strong>Phòng</strong> của họ. Sau khi nhập, dữ liệu việc nhà của phòng đó sẽ được tải về máy bạn.
              </p>

              <button
                type="submit"
                disabled={isLoading || !joinCodeInput.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Đang kiểm tra phòng...' : 'Tham Gia Phòng Này'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: Create New Room */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên phòng / Nhà trọ mới:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phòng 501 - Cầu Giấy"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên của bạn (Người tạo phòng):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Anh"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/70 text-[11px] text-amber-900">
                ✨ Hệ thống sẽ tự động tạo một <strong>Mã phòng riêng biệt</strong> và bộ việc nhà mẫu cho phòng của bạn.
              </div>

              <button
                type="submit"
                disabled={isLoading || !newRoomName.trim() || !creatorName.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{isLoading ? 'Đang khởi tạo...' : 'Tạo Phòng & Lấy Mã'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
