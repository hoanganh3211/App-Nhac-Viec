import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Activity, 
  Filter
} from 'lucide-react';
import { Chore, Member, ChoreLog } from '../types';
import { getTodayDateString } from '../utils/storage';

interface ChoreScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  chores: Chore[];
  members: Member[];
  logs: ChoreLog[];
  currentUserId: string | null;
}

type ViewScope = 'week' | 'month' | 'heatmap';

export const ChoreScheduleModal: React.FC<ChoreScheduleModalProps> = ({
  isOpen,
  onClose,
  chores,
  members,
  logs,
  currentUserId,
}) => {
  const [scope, setScope] = useState<ViewScope>('week');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayDateString());

  // Date offsets
  // currentMonth: Date object pointing to the 1st of viewed month
  const [viewMonthDate, setViewMonthDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // weekOffset: 0 = this week, -1 = last week, +1 = next week
  const [weekOffset, setWeekOffset] = useState<number>(0);

  if (!isOpen) return null;

  const todayStr = getTodayDateString();

  // Helper to format Date to YYYY-MM-DD
  const formatDateToYMD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. Dữ liệu logs được chuẩn hóa theo dateStr
  const normalizedLogs = useMemo(() => {
    return logs.map((log) => {
      let date = log.dateStr;
      if (!date) {
        if (log.completedAt.includes('Hôm nay')) {
          date = todayStr;
        } else {
          date = todayStr;
        }
      }
      return {
        ...log,
        dateStr: date,
      };
    });
  }, [logs, todayStr]);

  // 2. Heatmap & Daily Activity Map (dateStr -> { completedCount, penaltyCount, points, logs: [] })
  const dailyActivityMap = useMemo(() => {
    const map = new Map<string, { completedCount: number; penaltyCount: number; points: number; logs: ChoreLog[] }>();

    normalizedLogs.forEach((log) => {
      if (selectedMemberId !== 'all' && log.memberId !== selectedMemberId) return;

      const dateKey = log.dateStr || todayStr;
      const existing = map.get(dateKey) || { completedCount: 0, penaltyCount: 0, points: 0, logs: [] };

      if (log.type === 'completed' || log.type === 'recovery_bonus') {
        existing.completedCount += 1;
        existing.points += log.pointsEarned;
      } else if (log.type === 'late_penalty') {
        existing.penaltyCount += 1;
        existing.points += log.pointsEarned;
      } else {
        existing.points += log.pointsEarned;
      }
      existing.logs.push(log);
      map.set(dateKey, existing);
    });

    return map;
  }, [normalizedLogs, selectedMemberId, todayStr]);

  // 3. Tính toán các ngày trong tuần hiện tại dựa trên weekOffset
  const weekDays = useMemo(() => {
    const now = new Date();
    // Monday of current week
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day; // day 0 is Sunday
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + weekOffset * 7);

    const days: { date: Date; dateStr: string; label: string; fullDate: string; isToday: boolean }[] = [];
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dStr = formatDateToYMD(d);
      days.push({
        date: d,
        dateStr: dStr,
        label: labels[i],
        fullDate: `${d.getDate()}/${d.getMonth() + 1}`,
        isToday: dStr === todayStr,
      });
    }
    return days;
  }, [weekOffset, todayStr]);

  // 4. Tính toán các ngày trong tháng hiện tại (Calendar Grid)
  const monthCalendarDays = useMemo(() => {
    const year = viewMonthDate.getFullYear();
    const month = viewMonthDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Day of week for 1st day (0 = CN, 1 = T2, ..., 6 = T7)
    let startDayOfWeek = firstDayOfMonth.getDay();
    // Chuyển sang chuẩn T2 = 0, ..., CN = 6
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: { date: Date; dateStr: string; dayNumber: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Padding ngày tháng trước
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      const dStr = formatDateToYMD(prevDate);
      days.push({
        date: prevDate,
        dateStr: dStr,
        dayNumber: prevDate.getDate(),
        isCurrentMonth: false,
        isToday: dStr === todayStr,
      });
    }

    // Các ngày trong tháng này
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const curDate = new Date(year, month, i);
      const dStr = formatDateToYMD(curDate);
      days.push({
        date: curDate,
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
      });
    }

    // Padding ngày tháng sau để đủ lưới 35 hoặc 42 ô
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dStr = formatDateToYMD(nextDate);
      days.push({
        date: nextDate,
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
      });
    }

    return days;
  }, [viewMonthDate, todayStr]);

  // 5. GitHub Heatmap Cells (Last 70 days / 10 weeks)
  const heatmapDays = useMemo(() => {
    const end = new Date();
    // Start 69 days ago
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 69);

    // Adjust start to previous Monday
    const startDay = start.getDay();
    const diffToMonday = startDay === 0 ? -6 : 1 - startDay;
    start.setDate(start.getDate() + diffToMonday);

    const cells: { dateStr: string; date: Date; count: number; points: number }[] = [];
    const cur = new Date(start);

    while (cur <= end) {
      const dStr = formatDateToYMD(cur);
      const act = dailyActivityMap.get(dStr);
      cells.push({
        dateStr: dStr,
        date: new Date(cur),
        count: act ? act.completedCount : 0,
        points: act ? act.points : 0,
      });
      cur.setDate(cur.getDate() + 1);
    }
    return cells;
  }, [dailyActivityMap]);

  // 6. Tính danh sách công việc và trạng thái cho ngày được chọn (`selectedDateStr`)
  const selectedDateDetails = useMemo(() => {
    const targetDate = new Date(selectedDateStr + 'T00:00:00');
    const dayOfWeek = targetDate.getDay(); // 0 = CN, 1 = T2, ...
    const isPast = selectedDateStr < todayStr;
    const isToday = selectedDateStr === todayStr;
    const isFuture = selectedDateStr > todayStr;

    const activity = dailyActivityMap.get(selectedDateStr);
    const dayLogs = activity ? activity.logs : [];

    // Filter chores by member
    const relevantChores = chores.filter((c) =>
      selectedMemberId === 'all' ? true : c.assignedTo === selectedMemberId
    );

    // Chores scheduled for this day of week
    const scheduledChores = relevantChores.filter((c) => {
      if (c.frequency === 'once') return true;
      if (c.frequency === 'daily') return true;
      if (!c.daysOfWeek || c.daysOfWeek.length === 0) return true;
      return c.daysOfWeek.includes(dayOfWeek);
    });

    return {
      dateStr: selectedDateStr,
      targetDate,
      isPast,
      isToday,
      isFuture,
      activity,
      dayLogs,
      scheduledChores,
    };
  }, [selectedDateStr, todayStr, dailyActivityMap, chores, selectedMemberId]);

  // Overall Stats
  const overallStats = useMemo(() => {
    let totalCompleted = 0;
    let totalPenalty = 0;
    let totalPoints = 0;

    dailyActivityMap.forEach((v) => {
      totalCompleted += v.completedCount;
      totalPenalty += v.penaltyCount;
      totalPoints += v.points;
    });

    return { totalCompleted, totalPenalty, totalPoints };
  }, [dailyActivityMap]);

  // Month navigation
  const handlePrevMonth = () => {
    setViewMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleResetToCurrentMonth = () => {
    const d = new Date();
    setViewMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDateStr(todayStr);
    setWeekOffset(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center text-white shadow-inner">
              <CalendarIcon className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center space-x-1.5">
                <span>Lịch & Tiến Độ Làm Việc</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[9px] uppercase font-bold tracking-wider">
                  Timeline
                </span>
              </h3>
              <p className="text-[10px] text-indigo-100">
                Theo dõi theo tuần, tháng và bảng nhiệt hoạt động
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

        {/* Scope Tabs & Member Filter */}
        <div className="p-3 bg-slate-50 border-b border-slate-200/80 space-y-2.5 shrink-0">
          {/* Scope Selector: Week | Month | Heatmap */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setScope('week')}
              className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                scope === 'week' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Trong tuần</span>
            </button>
            <button
              onClick={() => setScope('month')}
              className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                scope === 'month' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Trong tháng</span>
            </button>
            <button
              onClick={() => setScope('heatmap')}
              className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                scope === 'heatmap' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Bảng hoạt động</span>
            </button>
          </div>

          {/* Member Filter Chips: Tất cả | Của tôi | Từng thành viên */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            <span className="text-[10px] font-semibold text-slate-400 shrink-0 flex items-center space-x-0.5">
              <Filter className="w-3 h-3" />
              <span>Xem:</span>
            </span>

            <button
              onClick={() => setSelectedMemberId('all')}
              className={`px-2.5 py-1 rounded-xl font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                selectedMemberId === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Cả phòng ({members.length})
            </button>

            {currentUserId && (
              <button
                onClick={() => setSelectedMemberId(currentUserId)}
                className={`px-2.5 py-1 rounded-xl font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                  selectedMemberId === currentUserId
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Của tôi (Bạn)
              </button>
            )}

            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                className={`px-2.5 py-1 rounded-xl font-medium transition shrink-0 whitespace-nowrap flex items-center space-x-1 cursor-pointer ${
                  selectedMemberId === m.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{m.avatar}</span>
                <span>{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-slate-700 no-scrollbar">
          {/* TAB 1: WEEK VIEW */}
          {scope === 'week' && (
            <div className="space-y-3">
              {/* Week Navigator */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                <button
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  title="Tuần trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-2">
                  <span>
                    Tuần từ {weekDays[0].fullDate} đến {weekDays[6].fullDate}
                  </span>
                  {weekOffset !== 0 && (
                    <button
                      onClick={() => setWeekOffset(0)}
                      className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md hover:bg-indigo-100 cursor-pointer"
                    >
                      Về tuần này
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  title="Tuần sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 7 Days Grid / Cards */}
              <div className="space-y-2">
                {weekDays.map((d) => {
                  const dayAct = dailyActivityMap.get(d.dateStr);
                  const isSelected = selectedDateStr === d.dateStr;
                  const isFuture = d.dateStr > todayStr;
                  const dOfWeek = d.date.getDay();

                  // Chores scheduled for this day of week
                  const dayChores = chores.filter((c) => {
                    if (selectedMemberId !== 'all' && c.assignedTo !== selectedMemberId) return false;
                    if (c.frequency === 'once') return true;
                    if (c.frequency === 'daily') return true;
                    if (!c.daysOfWeek || c.daysOfWeek.length === 0) return true;
                    return c.daysOfWeek.includes(dOfWeek);
                  });

                  return (
                    <div
                      key={d.dateStr}
                      onClick={() => setSelectedDateStr(d.dateStr)}
                      className={`p-3 rounded-2xl border transition cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                          : d.isToday
                          ? 'border-indigo-300 bg-slate-50'
                          : 'border-slate-200/80 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                              d.isToday
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {d.label}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                              <span>Ngày {d.fullDate}</span>
                              {d.isToday && (
                                <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-700 text-[9px] font-extrabold uppercase">
                                  Hôm nay
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {dayChores.length} công việc dự kiến
                            </div>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex items-center space-x-1.5 text-[10px]">
                          {dayAct && dayAct.completedCount > 0 && (
                            <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{dayAct.completedCount} đã xong</span>
                            </span>
                          )}

                          {dayAct && dayAct.penaltyCount > 0 && (
                            <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>{dayAct.penaltyCount} trễ hạn</span>
                            </span>
                          )}

                          {isFuture && (
                            <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Sắp tới</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Mini Chore Previews if selected */}
                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1.5">
                          {dayChores.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">
                              Không có công việc nào được lên lịch cho ngày này.
                            </p>
                          ) : (
                            dayChores.map((c) => {
                              const assignee = members.find((m) => m.id === c.assignedTo);
                              const isCompleted = d.isToday && c.isCompletedToday;
                              return (
                                <div
                                  key={c.id}
                                  className="p-2 bg-white rounded-xl border border-slate-100 flex items-center justify-between text-xs shadow-2xs"
                                >
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <span>{c.icon}</span>
                                    <span className="font-semibold text-slate-800 truncate">{c.title}</span>
                                    {isCompleted && (
                                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                        ✓ Xong
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1.5 shrink-0 text-[10px]">
                                    <span className="text-slate-400">{c.dueTime}</span>
                                    <span className="font-bold text-amber-700">+{c.points}đ</span>
                                    <span className="px-1.5 py-0.2 bg-slate-100 rounded-md text-slate-600 font-medium">
                                      {assignee?.name || 'Chưa giao'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MONTH VIEW (CALENDAR GRID) */}
          {scope === 'month' && (
            <div className="space-y-3">
              {/* Month Navigator */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  title="Tháng trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-2">
                  <span className="capitalize">
                    Tháng {viewMonthDate.getMonth() + 1} / {viewMonthDate.getFullYear()}
                  </span>
                  <button
                    onClick={handleResetToCurrentMonth}
                    className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md hover:bg-indigo-100 cursor-pointer"
                  >
                    Hôm nay
                  </button>
                </div>

                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  title="Tháng sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Month Calendar Grid */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
                  <span>T2</span>
                  <span>T3</span>
                  <span>T4</span>
                  <span>T5</span>
                  <span>T6</span>
                  <span>T7</span>
                  <span>CN</span>
                </div>

                {/* Day Cells */}
                <div className="grid grid-cols-7 gap-1">
                  {monthCalendarDays.map((d) => {
                    const isSelected = selectedDateStr === d.dateStr;
                    const act = dailyActivityMap.get(d.dateStr);

                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => setSelectedDateStr(d.dateStr)}
                        className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between transition cursor-pointer relative ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : d.isToday
                            ? 'bg-indigo-50 border border-indigo-300 text-indigo-900 font-bold'
                            : d.isCurrentMonth
                            ? 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                            : 'text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[11px] leading-none">{d.dayNumber}</span>

                        {/* Status dots */}
                        <div className="flex items-center space-x-0.5 pb-0.5">
                          {act && act.completedCount > 0 && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-amber-300' : 'bg-emerald-500'
                              }`}
                              title={`${act.completedCount} hoàn thành`}
                            />
                          )}
                          {act && act.penaltyCount > 0 && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-rose-200' : 'bg-rose-500'
                              }`}
                              title={`${act.penaltyCount} trễ hạn`}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GITHUB-STYLE ACTIVITY HEATMAP */}
          {scope === 'heatmap' && (
            <div className="space-y-3">
              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-center">
                  <div className="text-[10px] font-semibold text-emerald-800">Hoàn thành</div>
                  <div className="text-base font-extrabold text-emerald-900 mt-0.5">
                    {overallStats.totalCompleted} việc
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-center">
                  <div className="text-[10px] font-semibold text-amber-800">Điểm đóng góp</div>
                  <div className="text-base font-extrabold text-amber-900 mt-0.5">
                    +{overallStats.totalPoints}đ
                  </div>
                </div>

                <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-200/80 text-center">
                  <div className="text-[10px] font-semibold text-rose-800">Lần trễ hạn</div>
                  <div className="text-base font-extrabold text-rose-900 mt-0.5">
                    {overallStats.totalPenalty} lần
                  </div>
                </div>
              </div>

              {/* GitHub Heatmap Grid Card */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Bảng hoạt động kiểu GitHub (70 ngày gần nhất)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Đậm màu = Chăm chỉ</span>
                </div>

                {/* Heatmap Grid */}
                <div className="overflow-x-auto no-scrollbar py-1">
                  <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5">
                    {heatmapDays.map((c) => {
                      const isSelected = selectedDateStr === c.dateStr;
                      let bgClass = 'bg-slate-100 hover:border-slate-300';
                      if (c.count === 1) bgClass = 'bg-emerald-200 hover:bg-emerald-300';
                      else if (c.count === 2) bgClass = 'bg-emerald-400 hover:bg-emerald-500';
                      else if (c.count >= 3) bgClass = 'bg-emerald-600 hover:bg-emerald-700';

                      return (
                        <button
                          key={c.dateStr}
                          type="button"
                          onClick={() => setSelectedDateStr(c.dateStr)}
                          title={`Ngày ${c.dateStr}: ${c.count} việc hoàn thành (+${c.points}đ)`}
                          className={`w-3.5 h-3.5 rounded-xs transition-all cursor-pointer ${bgClass} ${
                            isSelected ? 'ring-2 ring-indigo-600 ring-offset-1' : ''
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>Bấm vào từng ô để xem chi tiết ngày đó</span>
                  <div className="flex items-center space-x-1 font-medium">
                    <span>Ít</span>
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-100 border border-slate-200" />
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-200" />
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400" />
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                    <span>Nhiều</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL BREAKDOWN FOR SELECTED DATE */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-xs text-slate-800">
                  Chi tiết ngày {selectedDateDetails.targetDate.toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric',
                  })}
                </h4>
              </div>
              {selectedDateDetails.isToday && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                  Hôm nay
                </span>
              )}
            </div>

            {/* List of activity / logs for this day */}
            <div className="space-y-1.5">
              {selectedDateDetails.dayLogs.length > 0 ? (
                selectedDateDetails.dayLogs.map((log) => {
                  const isPenalty = log.pointsEarned < 0;
                  return (
                    <div
                      key={log.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isPenalty
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-white border-slate-200/80 text-slate-800 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {isPenalty ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span className="font-semibold truncate">{log.choreTitle}</span>
                        <span className="text-[10px] text-slate-400 truncate">({log.memberName})</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          isPenalty ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {log.pointsEarned > 0 ? `+${log.pointsEarned}` : log.pointsEarned}đ
                      </span>
                    </div>
                  );
                })
              ) : selectedDateDetails.scheduledChores.length > 0 ? (
                selectedDateDetails.scheduledChores.map((chore) => {
                  const assignee = members.find((m) => m.id === chore.assignedTo);
                  const isDone = selectedDateDetails.isToday && chore.isCompletedToday;
                  return (
                    <div
                      key={chore.id}
                      className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs shadow-2xs"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span>{chore.icon}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">{chore.title}</div>
                          <div className="text-[10px] text-slate-400">Phụ trách: {assignee?.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400">{chore.dueTime}</span>
                        {isDone ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ Đã xong
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                            {selectedDateDetails.isPast ? 'Chưa tick' : 'Dự kiến'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs italic">
                  Không có công việc nào hoặc không có ghi nhận làm việc trong ngày này.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Tự động cập nhật theo thời gian thực</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
