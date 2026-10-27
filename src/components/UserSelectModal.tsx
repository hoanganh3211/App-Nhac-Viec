import React, { useState } from 'react';
import { UserCheck, UserPlus, Check, Sparkles } from 'lucide-react';
import { Member } from '../types';

interface UserSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currentUserId: string | null;
  onSelectUser: (memberId: string) => void;
  onAddNewMember: (name: string, avatar: string, zaloName: string) => void;
}

export const UserSelectModal: React.FC<UserSelectModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUserId,
  onSelectUser,
  onAddNewMember,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('🙋‍♂️');
  const [newZalo, setNewZalo] = useState('');

  const avgPoints = members.length > 0
    ? Math.max(0, Math.round(members.reduce((sum, m) => sum + m.points, 0) / members.length))
    : 0;

  if (!isOpen) return null;

  const handleCreateAndSelect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddNewMember(newName.trim(), newAvatar, newZalo.trim() || newName.trim());
    setIsAddingNew(false);
    setNewName('');
    setNewZalo('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2 backdrop-blur-xs">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-lg">Bạn Là Ai Trong Phòng?</h3>
          <p className="text-xs text-indigo-100 mt-0.5">
            Chọn danh tính của bạn để app nhắc đúng việc được phân công!
          </p>
        </div>

        {/* Member list */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {!isAddingNew ? (
            <>
              <div className="space-y-2">
                {members.map((member) => {
                  const isSelected = member.id === currentUserId;
                  return (
                    <button
                      key={member.id}
                      onClick={() => {
                        onSelectUser(member.id);
                        onClose();
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition transform active:scale-98 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{member.avatar}</span>
                        <div>
                          <div className="font-bold text-sm text-slate-800">{member.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {member.points} điểm • Chuỗi {member.streak} ngày
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <span className="text-xs text-indigo-600 font-semibold">Chọn tôi</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center justify-center space-x-1.5 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tôi là thành viên mới...</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleCreateAndSelect} className="space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Nhập thông tin của bạn:</span>
              </div>

              {avgPoints > 0 && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-950 flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Cơ chế công bằng:</strong> Bạn nhận ngay <strong>{avgPoints} điểm khởi điểm</strong> (điểm TB phòng). Việc nhà của bạn sẽ bắt đầu được chia đều tự động từ <strong>ngày mai</strong> để không xáo trộn việc hôm nay!
                  </span>
                </div>
              )}

              <div className="flex space-x-2">
                <select
                  value={newAvatar}
                  onChange={(e) => setNewAvatar(e.target.value)}
                  className="w-16 p-2 text-xl bg-slate-50 border border-slate-200 rounded-xl text-center"
                >
                  <option value="👨‍💻">👨‍💻</option>
                  <option value="👩‍💻">👩‍💻</option>
                  <option value="🙋‍♂️">🙋‍♂️</option>
                  <option value="🙋‍♀️">🙋‍♀️</option>
                  <option value="🍳">🍳</option>
                  <option value="🎮">🎮</option>
                  <option value="🐱">🐱</option>
                  <option value="🐶">🐶</option>
                </select>

                <input
                  type="text"
                  required
                  placeholder="Họ và Tên của bạn..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <input
                type="text"
                placeholder="Tên Zalo (để tag trong nhóm)..."
                value={newZalo}
                onChange={(e) => setNewZalo(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Tạo & Chọn tôi
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer if user already has an identity */}
        {currentUserId && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Đóng lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
