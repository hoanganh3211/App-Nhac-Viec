import React from 'react';
import { X, History, CheckCircle, Clock } from 'lucide-react';
import { ChoreLog } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ChoreLog[];
  onClearHistory?: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Lịch Sử Hoàn Thành</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Clock className="w-10 h-10 mx-auto stroke-1" />
              <p className="text-xs">Chưa có lịch sử làm việc nào được ghi nhận.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3"
              >
                <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs text-slate-800 truncate">
                      {log.choreTitle}
                    </h4>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 shrink-0 ml-1">
                      +{log.pointsEarned} điểm
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-1">
                    <span className="font-semibold text-indigo-600">{log.memberName}</span>
                    <span>•</span>
                    <span>{log.completedAt}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
