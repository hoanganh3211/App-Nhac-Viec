import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Share2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { AppState, Chore, Member } from './types';
import { loadState, saveState, getNextAssignee } from './utils/storage';
import { playSuccessSound, playNudgeSound } from './utils/audio';
import { Navbar } from './components/Navbar';
import { ChoreCard } from './components/ChoreCard';
import { FairnessBoard } from './components/FairnessBoard';
import { AddChoreModal } from './components/AddChoreModal';
import { MemberManagerModal } from './components/MemberManagerModal';
import { ZaloReminderModal } from './components/ZaloReminderModal';
import { HistoryModal } from './components/HistoryModal';
import { PenaltyModal } from './components/PenaltyModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { shareToZalo } from './utils/zalo';

export function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [activeTab, setActiveTab] = useState<'today' | 'pending' | 'completed' | 'all'>('today');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isAddChoreOpen, setIsAddChoreOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isZaloOpen, setIsZaloOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPenaltyOpen, setIsPenaltyOpen] = useState(false);
  const [isPWAOpen, setIsPWAOpen] = useState(false);

  // Persist state to localStorage on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Toggle chore completed
  const handleToggleComplete = (choreId: string) => {
    const targetChore = state.chores.find((c) => c.id === choreId);
    if (!targetChore) return;

    const willBeCompleted = !targetChore.isCompletedToday;
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const assignee = state.members.find((m) => m.id === targetChore.assignedTo);

    if (willBeCompleted) {
      // Fire confetti celebration & audio
      playSuccessSound();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      });

      showToast(`🎉 Tuyệt vời! +${targetChore.points} điểm cho ${assignee?.name || 'bạn'}!`);
    }

    // Update members points & streak
    const updatedMembers = state.members.map((member) => {
      if (member.id === targetChore.assignedTo) {
        return {
          ...member,
          points: willBeCompleted
            ? member.points + targetChore.points
            : Math.max(0, member.points - targetChore.points),
          streak: willBeCompleted ? member.streak + 1 : Math.max(0, member.streak - 1),
        };
      }
      return member;
    });

    // Update chore state
    const updatedChores = state.chores.map((chore) => {
      if (chore.id === choreId) {
        return {
          ...chore,
          isCompletedToday: willBeCompleted,
          completedAt: willBeCompleted ? nowTimeStr : undefined,
          completedBy: willBeCompleted ? chore.assignedTo : undefined,
        };
      }
      return chore;
    });

    // Add log entry if completed
    let updatedLogs = [...state.logs];
    if (willBeCompleted) {
      updatedLogs = [
        {
          id: 'log_' + Date.now(),
          choreId: targetChore.id,
          choreTitle: targetChore.title,
          memberId: targetChore.assignedTo,
          memberName: assignee?.name || 'Thành viên',
          completedAt: `Hôm nay lúc ${nowTimeStr}`,
          pointsEarned: targetChore.points,
        },
        ...state.logs,
      ];
    }

    setState((prev) => ({
      ...prev,
      members: updatedMembers,
      chores: updatedChores,
      logs: updatedLogs,
    }));
  };

  // Rotate chore to next roommate
  const handleRotateNext = (choreId: string) => {
    const chore = state.chores.find((c) => c.id === choreId);
    if (!chore) return;

    const nextId = getNextAssignee(chore.assignedTo, chore.rotationRule, state.members);
    const nextMember = state.members.find((m) => m.id === nextId);

    const updatedChores = state.chores.map((c) =>
      c.id === choreId ? { ...c, assignedTo: nextId } : c
    );

    setState((prev) => ({ ...prev, chores: updatedChores }));
    showToast(`Đã chuyển lượt "${chore.title}" cho ${nextMember?.name || 'người tiếp theo'}`);
  };

  // Nudge specific person via Zalo
  const handleNudge = async (chore: Chore, assignee?: Member) => {
    playNudgeSound();
    const tag = assignee ? `@${assignee.zaloName || assignee.name}` : 'bạn';
    const text = `📢 [NHẮC VIỆC NHÀ] Alo ${tag} ơi!\nĐến giờ làm việc "${chore.title}" rồi nè (${chore.dueTime}). Làm xong nhớ mở app tick nhé! 🧹\n🔗 ${window.location.origin}`;
    
    await shareToZalo(text);
    showToast(`Đã chuẩn bị lời nhắc cho ${assignee?.name}! Hãy dán vào Zalo nhé.`);
  };

  // Add chore
  const handleAddChore = (newChoreData: Omit<Chore, 'id' | 'isCompletedToday'>) => {
    const newChore: Chore = {
      ...newChoreData,
      id: 'chore_' + Date.now(),
      isCompletedToday: false,
    };
    setState((prev) => ({
      ...prev,
      chores: [newChore, ...prev.chores],
    }));
    showToast(`Đã thêm việc "${newChore.title}" thành công!`);
  };

  // Add member
  const handleAddMember = (name: string, avatar: string, zaloName: string) => {
    const newMember: Member = {
      id: 'm_' + Date.now(),
      name,
      avatar,
      color: 'bg-indigo-500 text-white',
      points: 0,
      streak: 0,
      zaloName,
    };
    setState((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
    showToast(`Đã thêm ${name} vào phòng!`);
  };

  // Delete member
  const handleDeleteMember = (id: string) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
    }));
    showToast('Đã xóa thành viên khỏi phòng.');
  };

  // Update room name
  const handleUpdateRoomName = (name: string) => {
    setState((prev) => ({ ...prev, roomName: name }));
    showToast('Đã cập nhật tên phòng!');
  };

  // Add Penalty record
  const handleAddPenalty = (memberId: string, amount: number, reason: string) => {
    const member = state.members.find((m) => m.id === memberId);
    const newPenalty = {
      id: 'pen_' + Date.now(),
      memberId,
      memberName: member?.name || 'Thành viên',
      amount,
      reason,
      date: new Date().toLocaleDateString('vi-VN'),
      status: 'pending' as const,
    };
    setState((prev) => ({
      ...prev,
      penalties: [newPenalty, ...prev.penalties],
    }));
    showToast(`Đã ghi phạt ${amount.toLocaleString('vi-VN')}đ vào quỹ phòng!`);
  };

  // Mark penalty paid
  const handleMarkPaid = (id: string) => {
    setState((prev) => ({
      ...prev,
      penalties: prev.penalties.map((p) => (p.id === id ? { ...p, status: 'paid' } : p)),
    }));
    showToast('Đã ghi nhận nộp phạt vào quỹ phòng.');
  };

  // Filter chores based on tab
  const filteredChores = state.chores.filter((chore) => {
    if (activeTab === 'pending') return !chore.isCompletedToday;
    if (activeTab === 'completed') return chore.isCompletedToday;
    return true; // 'today' or 'all'
  });

  const uncompletedCount = state.chores.filter((c) => !c.isCompletedToday).length;
  const completedCount = state.chores.filter((c) => c.isCompletedToday).length;
  const todayFormatted = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  });

  return (
    <div className="min-h-screen pb-20 max-w-md mx-auto relative bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        roomName={state.roomName}
        uncompletedCount={uncompletedCount}
        onOpenAddChore={() => setIsAddChoreOpen(true)}
        onOpenMembers={() => setIsMembersOpen(true)}
        onOpenZaloReminder={() => setIsZaloOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPWA={() => setIsPWAOpen(true)}
      />

      {/* Main Container */}
      <main className="p-4 space-y-4 flex-1">
        {/* Date & Motivation Banner */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div className="flex items-center space-x-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span className="capitalize">{todayFormatted}</span>
          </div>

          <div className="flex items-center space-x-1 font-semibold text-slate-700">
            <span>Tiến độ:</span>
            <span className="text-indigo-600 font-bold">
              {completedCount}/{state.chores.length}
            </span>
            <span>việc</span>
          </div>
        </div>

        {/* Fairness & Karma Board */}
        <FairnessBoard
          members={state.members}
          penalties={state.penalties}
          onOpenPenaltyModal={() => setIsPenaltyOpen(true)}
        />

        {/* Filter Pills */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-1 bg-slate-200/70 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === 'today'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hôm nay ({state.chores.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === 'pending'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chưa xong ({uncompletedCount})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === 'completed'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã xong ({completedCount})
            </button>
          </div>

          <button
            onClick={() => setIsAddChoreOpen(true)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
          >
            <span>+ Việc mới</span>
          </button>
        </div>

        {/* Chores List */}
        <div className="space-y-3">
          {filteredChores.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Không còn việc nào ở mục này!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Mọi người làm việc siêu năng suất! Cả phòng hãy tận hưởng không gian sạch sẽ nhé.
                </p>
              </div>
            </div>
          ) : (
            filteredChores.map((chore) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                members={state.members}
                onToggleComplete={handleToggleComplete}
                onNudge={handleNudge}
                onRotateNext={handleRotateNext}
              />
            ))
          )}
        </div>

        {/* PWA Promotion Callout */}
        <div
          onClick={() => setIsPWAOpen(true)}
          className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 flex items-center justify-between cursor-pointer hover:border-indigo-200 transition"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Cài app trực tiếp không tốn phí</div>
              <div className="text-[11px] text-slate-500">
                Ghim ra màn hình iPhone / Android dùng mượt mà
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-600" />
        </div>
      </main>

      {/* Floating Bottom Quick Zalo Trigger */}
      <div className="fixed bottom-3 inset-x-0 max-w-md mx-auto px-4 z-20 pointer-events-none">
        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            onClick={() => setIsZaloOpen(true)}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center space-x-2 transition transform active:scale-98"
          >
            <Share2 className="w-4 h-4" />
            <span>Gửi Bảng Nhắc Việc Vào Nhóm Zalo</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-0 max-w-xs mx-auto z-50 animate-in slide-in-from-top duration-200">
          <div className="p-3 bg-slate-900/90 backdrop-blur-md text-white text-xs font-medium rounded-2xl shadow-xl text-center border border-white/10 flex items-center justify-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* All Interactive Modals */}
      <AddChoreModal
        isOpen={isAddChoreOpen}
        onClose={() => setIsAddChoreOpen(false)}
        onAddChore={handleAddChore}
        members={state.members}
      />

      <MemberManagerModal
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        members={state.members}
        roomName={state.roomName}
        onUpdateRoomName={handleUpdateRoomName}
        onAddMember={handleAddMember}
        onDeleteMember={handleDeleteMember}
      />

      <ZaloReminderModal
        isOpen={isZaloOpen}
        onClose={() => setIsZaloOpen(false)}
        roomName={state.roomName}
        chores={state.chores}
        members={state.members}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={state.logs}
      />

      <PenaltyModal
        isOpen={isPenaltyOpen}
        onClose={() => setIsPenaltyOpen(false)}
        penalties={state.penalties}
        members={state.members}
        onAddPenalty={handleAddPenalty}
        onMarkPaid={handleMarkPaid}
      />

      <PWAInstallModal
        isOpen={isPWAOpen}
        onClose={() => setIsPWAOpen(false)}
      />
    </div>
  );
}

export default App;
