import React, { useState } from 'react';
import { X, UserPlus, Trash2, Home, Users } from 'lucide-react';
import { Member } from '../types';

interface MemberManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  roomName: string;
  onUpdateRoomName: (name: string) => void;
  onAddMember: (name: string, avatar: string, zaloName: string) => void;
  onDeleteMember: (id: string) => void;
}

const AVATAR_OPTIONS = ['👨‍💻', '👩‍💻', '🍳', '🎮', '🐱', '🐶', '🍕', '🚀', '🎸', '⚽'];

export const MemberManagerModal: React.FC<MemberManagerModalProps> = ({
  isOpen,
  onClose,
  members,
  roomName,
  onUpdateRoomName,
  onAddMember,
  onDeleteMember,
}) => {
  const [newRoomName, setNewRoomName] = useState(roomName);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👨‍💻');
  const [zaloName, setZaloName] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddMember(name.trim(), avatar, zaloName.trim() || name.trim());
    setName('');
    setZaloName('');
  };

  const handleSaveRoomName = () => {
    if (newRoomName.trim()) {
      onUpdateRoomName(newRoomName.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Thành Viên & Cài Đặt Phòng</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Room Name setting */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 flex items-center space-x-1">
              <Home className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tên phòng / Nhà chung:</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleSaveRoomName}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-2xl transition"
              >
                Đổi tên
              </button>
            </div>
          </div>

          {/* Members list */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
              <span>Danh sách người ở chung ({members.length} người):</span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-3 flex items-center justify-between hover:bg-white transition"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{member.avatar}</span>
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{member.name}</div>
                      <div className="text-xs text-slate-400">
                        Tag Zalo: @{member.zaloName || member.name} • {member.points} điểm
                      </div>
                    </div>
                  </div>

                  {members.length > 1 && (
                    <button
                      onClick={() => onDeleteMember(member.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Xóa thành viên"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add member form */}
          <form onSubmit={handleAdd} className="space-y-3 pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span>Thêm bạn cùng phòng mới:</span>
            </div>

            {/* Avatar picker */}
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Chọn biểu tượng:</label>
              <div className="flex space-x-1.5 overflow-x-auto pb-1">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition ${
                      avatar === emoji
                        ? 'bg-indigo-100 border-2 border-indigo-600 scale-105'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Họ & Tên:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Tuấn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Tên trên Zalo:</label>
                <input
                  type="text"
                  placeholder="Tên để bot tag"
                  value={zaloName}
                  onChange={(e) => setZaloName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition"
            >
              + Thêm Vào Phòng
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
