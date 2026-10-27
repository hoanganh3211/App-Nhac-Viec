import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, AlertCircle } from 'lucide-react';
import { generateZaloDailyReminder, shareToZalo } from '../utils/zalo';
import { Chore, Member } from '../types';

interface ZaloReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  roomCode: string;
  chores: Chore[];
  members: Member[];
}

export const ZaloReminderModal: React.FC<ZaloReminderModalProps> = ({
  isOpen,
  onClose,
  roomName,
  roomCode,
  chores,
  members,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const reminderText = generateZaloDailyReminder(roomName, roomCode, chores, members);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reminderText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    const success = await shareToZalo(reminderText);
    if (success) {
      setCopied(true),
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-white" />
            <h3 className="font-bold text-base">Gửi Nhắc Việc Vào Nhóm Zalo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-start space-x-2 p-3 bg-blue-50/80 rounded-2xl text-blue-800 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <div>
              Tin nhắn có sẵn danh sách người làm việc hôm nay và <strong>link trực tiếp vào đúng phòng này</strong> ({roomCode}).
            </div>
          </div>

          {/* Message Preview Box */}
          <div className="relative">
            <div className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Nội dung xem trước:
            </div>
            <pre className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto select-all">
              {reminderText}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center space-x-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Đã chép nội dung!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Sao chép tin nhắn</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-200 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Mở Zalo Gửi Nhóm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
