import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Flame, 
  Calendar, 
  Scale, 
  Trash2, 
  Edit3, 
  ClipboardList, 
  User, 
  Zap, 
  Search,
  ArrowLeft,
  ShieldAlert
} from 'lucide-react';
import { Chore, FrequencyType, Member, RotationRule } from '../types';
import { DAYS_OF_WEEK, formatChoreDays } from '../utils/storage';

interface ChoreManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  chores: Chore[];
  members: Member[];
  onRequestEditChore: (
    choreId: string,
    updatedData: Partial<Omit<Chore, 'id' | 'assignedTo' | 'isCompletedToday'>>
  ) => void;
  onRequestDeleteChore: (choreId: string) => void;
}

export const ChoreManagerModal: React.FC<ChoreManagerModalProps> = ({
  isOpen,
  onClose,
  chores,
  members,
  onRequestEditChore,
  onRequestDeleteChore,
}) => {
  const [activeView, setActiveView] = useState<'list' | 'edit'>('list');
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteChore, setConfirmDeleteChore] = useState<Chore | null>(null);

  // Form states for editing
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🧹');
  const [category, setCategory] = useState<Chore['category']>('cleaning');
  const [points, setPoints] = useState(2);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [dueTime, setDueTime] = useState('21:00');
  const [rotationRule, setRotationRule] = useState<RotationRule>('least-points');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const startEdit = (chore: Chore) => {
    setEditingChore(chore);
    setTitle(chore.title);
    setIcon(chore.icon);
    setCategory(chore.category);
    setPoints(chore.points);
    setDaysOfWeek(chore.daysOfWeek && chore.daysOfWeek.length > 0 ? chore.daysOfWeek : [1, 2, 3, 4, 5, 6, 0]);
    setFrequency(chore.frequency);
    setDueTime(chore.dueTime);
    setRotationRule(chore.rotationRule);
    setDescription(chore.description || '');
    setActiveView('edit');
  };

  const handleToggleDay = (day: number) => {
    if (frequency === 'once') {
      setDaysOfWeek([day]);
      return;
    }

    // Nếu đang chọn cả 7 ngày mà người dùng bấm vào 1 thứ cụ thể (VD: CN)
    // => Người dùng muốn CHỈ CHỌN RIÊNG THỨ ĐÓ!
    if (daysOfWeek.length === 7) {
      setDaysOfWeek([day]);
      setFrequency('weekly');
      return;
    }

    if (daysOfWeek.includes(day)) {
      if (daysOfWeek.length > 1) {
        const next = daysOfWeek.filter((d) => d !== day);
        setDaysOfWeek(next);
        if (next.length < 7 && frequency === 'daily') {
          setFrequency('weekly');
        }
      }
    } else {
      const next = [...daysOfWeek, day].sort();
      setDaysOfWeek(next);
      if (next.length === 7) {
        setFrequency('daily');
      }
    }
  };

  const handleQuickSelectDays = (type: 'all' | 'weekdays' | 'weekend' | 'sunday') => {
    if (type === 'all') {
      setDaysOfWeek([1, 2, 3, 4, 5, 6, 0]);
      if (frequency !== 'once') setFrequency('daily');
    } else if (type === 'weekdays') {
      setDaysOfWeek([1, 2, 3, 4, 5]);
      if (frequency !== 'once') setFrequency('weekly');
    } else if (type === 'weekend') {
      setDaysOfWeek([6, 0]);
      if (frequency !== 'once') setFrequency('weekly');
    } else if (type === 'sunday') {
      setDaysOfWeek([0]); // Chủ Nhật
      if (frequency !== 'once') setFrequency('weekly');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChore || !title.trim()) return;

    onRequestEditChore(editingChore.id, {
      title: title.trim(),
      icon,
      category,
      points,
      daysOfWeek,
      frequency,
      dueTime,
      rotationRule: frequency === 'once' ? 'fixed' : rotationRule,
      description: description.trim(),
    });

    setActiveView('list');
    setEditingChore(null);
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteChore) return;
    onRequestDeleteChore(confirmDeleteChore.id);
    setConfirmDeleteChore(null);
  };

  const filteredChores = chores.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            {activeView === 'edit' ? (
              <button
                type="button"
                onClick={() => {
                  setActiveView('list');
                  setEditingChore(null);
                }}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white shadow-inner">
                <ClipboardList className="w-4 h-4 text-amber-300" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-sm text-white">
                {activeView === 'edit' ? 'Chỉnh Sửa Công Việc' : 'Quản Lý Công Việc Phòng'}
              </h3>
              <p className="text-[10px] text-indigo-100">
                {activeView === 'edit'
                  ? 'Thay đổi thông tin (Người làm giữ nguyên theo phân bổ)'
                  : `${chores.length} công việc đang hoạt động trong phòng`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LIST VIEW */}
        {activeView === 'list' && (
          <div className="p-4 overflow-y-auto space-y-3 flex-1 text-slate-700 no-scrollbar">
            {/* Democracy Notice */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start space-x-2 text-amber-950 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Quy tắc dân chủ:</strong> Khi phòng có từ 2 người, mọi thao tác sửa hoặc xóa công việc sẽ được gửi thành đề xuất biểu quyết chung (cần &gt;50% thành viên đồng ý).
              </div>
            </div>

            {/* Search bar */}
            {chores.length > 3 && (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm công việc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            )}

            {/* Chores list */}
            <div className="space-y-2">
              {filteredChores.length === 0 ? (
                <div className="text-center py-10 px-4 text-slate-400 text-xs">
                  Không tìm thấy công việc nào phù hợp.
                </div>
              ) : (
                filteredChores.map((chore) => {
                  const assignee = members.find((m) => m.id === chore.assignedTo);
                  return (
                    <div
                      key={chore.id}
                      className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-base shrink-0">
                            {chore.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-slate-800 truncate">
                              {chore.title}
                            </h4>
                            {chore.description && (
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                {chore.description}
                              </p>
                            )}

                            {/* Badges */}
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className="inline-flex items-center space-x-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200/60 shrink-0 whitespace-nowrap">
                                <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                <span>+{chore.points}đ</span>
                              </span>

                              <span className="inline-flex items-center space-x-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 shrink-0 whitespace-nowrap">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                <span>{chore.dueTime}</span>
                              </span>

                              {chore.frequency === 'once' ? (
                                <span className="inline-flex items-center space-x-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0 whitespace-nowrap">
                                  <Zap className="w-2.5 h-2.5 fill-amber-500" />
                                  <span>1 lần</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 shrink-0 whitespace-nowrap">
                                  <Calendar className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{formatChoreDays(chore.daysOfWeek, chore.frequency)}</span>
                                </span>
                              )}

                              <span className="inline-flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0 whitespace-nowrap">
                                <User className="w-2.5 h-2.5" />
                                <span>{assignee?.name || 'Chưa giao'}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(chore)}
                            title="Chỉnh sửa công việc"
                            className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteChore(chore)}
                            title="Xóa công việc khỏi phòng"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* EDIT VIEW */}
        {activeView === 'edit' && editingChore && (
          <form onSubmit={handleSaveEdit} className="p-4 overflow-y-auto space-y-3.5 flex-1 text-slate-700 no-scrollbar">
            {/* Fixed Assignee Guard Notice */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start space-x-2 text-indigo-950 text-xs">
              <User className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Người phụ trách:</strong>{' '}
                <span className="font-semibold text-indigo-700">
                  {members.find((m) => m.id === editingChore.assignedTo)?.name || 'Chưa giao'}
                </span>
                <p className="text-[10px] text-indigo-800/80 mt-0.5">
                  *Không thay đổi người làm thủ công. Hệ thống giữ nguyên người làm hiện tại và tiếp tục tự động xoay việc công bằng cho các ngày sau.
                </p>
              </div>
            </div>

            {/* Title & Icon */}
            <div className="flex space-x-2">
              <div className="w-16">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Icon</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full text-center text-xl p-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  maxLength={2}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tên công việc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Days of week */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Làm việc vào thứ mấy?</span>
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold">
                  {frequency === 'once' 
                    ? `(Làm 1 lần: ${DAYS_OF_WEEK.find(d => d.day === daysOfWeek[0])?.full || 'Hôm nay'})` 
                    : frequency === 'daily'
                    ? '(Hàng ngày: Cả 7 ngày T2-CN)'
                    : `(Hàng tuần: ${daysOfWeek.map(d => DAYS_OF_WEEK.find(x => x.day === d)?.label).join(', ')})`}
                </span>
              </div>

              {/* Day Pills */}
              <div className="grid grid-cols-7 gap-1">
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = daysOfWeek.includes(d.day);
                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => handleToggleDay(d.day)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>

              {frequency !== 'once' && (
                <div className="flex flex-wrap gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickSelectDays('sunday')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition cursor-pointer"
                  >
                    Chỉ Chủ Nhật
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectDays('all')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition cursor-pointer"
                  >
                    Cả tuần (T2-CN)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectDays('weekdays')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                  >
                    T2 - T6
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectDays('weekend')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cuối tuần
                  </button>
                </div>
              )}
            </div>

            {/* Frequency & Time */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chu kỳ lặp</label>
                <select
                  value={frequency}
                  onChange={(e) => {
                    const newFreq = e.target.value as FrequencyType;
                    setFrequency(newFreq);
                    if (newFreq === 'daily') {
                      setDaysOfWeek([1, 2, 3, 4, 5, 6, 0]);
                    } else if (newFreq === 'weekly') {
                      if (daysOfWeek.length === 7) {
                        setDaysOfWeek([new Date().getDay()]);
                      }
                    } else if (newFreq === 'once') {
                      setRotationRule('fixed');
                      if (daysOfWeek.length !== 1) {
                        setDaysOfWeek([new Date().getDay()]);
                      }
                    }
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="daily">Hàng ngày</option>
                  <option value="weekly">Hàng tuần</option>
                  <option value="alternate">Cách ngày</option>
                  <option value="once">⚡ Làm 1 lần duy nhất</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Hạn hoàn thành</span>
                </label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Points slider */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                <span className="flex items-center space-x-1">
                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                  <span>Trọng số điểm:</span>
                </span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full font-bold">
                  {points} điểm
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Rotation Rule */}
            {frequency !== 'once' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Thuật toán xoay việc cho các ngày sau
                </label>
                <select
                  value={rotationRule}
                  onChange={(e) => setRotationRule(e.target.value as RotationRule)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="least-points">Ưu tiên người ít điểm nhất (Công bằng nhất)</option>
                  <option value="round-robin">Xoay vòng tuần tự (A-B-C)</option>
                  <option value="fixed">Cố định người này</option>
                </select>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú mô tả</label>
              <input
                type="text"
                placeholder="Ghi chú chi tiết cho công việc..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setActiveView('list');
                  setEditingChore(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {members.length > 1 ? '+ Gửi Đề Xuất Sửa Việc' : 'Lưu Thay Đổi'}
              </button>
            </div>
            {members.length > 1 && (
              <p className="text-[10px] text-slate-400 text-center italic">
                *Chỉnh sửa sẽ được gửi cho phòng biểu quyết (cần &gt;50% đồng ý).
              </p>
            )}
          </form>
        )}

        {/* Delete Confirmation Modal Overlay */}
        {confirmDeleteChore && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-20 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl p-4 max-w-xs w-full shadow-2xl border border-slate-100 space-y-3 text-center animate-in zoom-in-95 duration-150">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {members.length > 1 ? 'Đề xuất xóa công việc?' : 'Xóa công việc này?'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Bạn có chắc muốn xóa "{confirmDeleteChore.icon} {confirmDeleteChore.title}"?
                  {members.length > 1 && ' Đề xuất cần hơn 50% thành viên phòng đồng ý.'}
                </p>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteChore(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  {members.length > 1 ? 'Gửi đề xuất' : 'Xóa việc'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
