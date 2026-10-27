import React, { useState } from 'react';
import { X, Cloud, CloudUpload, CloudDownload, Copy, Check, Database, Share2 } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, pushStateToCloud, fetchStateFromCloud } from '../utils/supabase';
import { AppState } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onApplyCloudState: (newState: AppState) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  state,
  onApplyCloudState,
}) => {
  const currentCfg = getSupabaseConfig();
  const [url, setUrl] = useState(currentCfg?.url || '');
  const [anonKey, setAnonKey] = useState(currentCfg?.anonKey || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const roomShareUrl = `${window.location.origin}?room=${encodeURIComponent(state.roomCode)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAndPush = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setSyncStatus('Vui lòng nhập đầy đủ Supabase URL và Anon Key.');
      return;
    }
    setIsSyncing(true);
    saveSupabaseConfig(url.trim(), anonKey.trim());
    const ok = await pushStateToCloud(state);
    setIsSyncing(false);
    if (ok) {
      setSyncStatus('✅ Đã lưu cấu hình và đẩy dữ liệu phòng lên Cloud thành công!');
    } else {
      setSyncStatus('⚠️ Lỗi kết nối Supabase. Vui lòng kiểm tra lại URL và Anon Key.');
    }
  };

  const handlePullFromCloud = async () => {
    setIsSyncing(true);
    const cloudState = await fetchStateFromCloud(state.roomCode);
    setIsSyncing(false);
    if (cloudState) {
      onApplyCloudState(cloudState);
      setSyncStatus('✅ Đã đồng bộ dữ liệu mới nhất từ Cloud về máy này!');
    } else {
      setSyncStatus('⚠️ Không tìm thấy dữ liệu cho mã phòng này trên Cloud.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `du-lieu-phong-${state.roomCode}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Đồng Bộ Dữ Liệu Phòng</h3>
              <p className="text-[11px] text-slate-500">Mã phòng: <span className="font-mono font-bold text-indigo-600">{state.roomCode}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700 leading-relaxed">
          {/* Share link to roommates */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
            <div className="font-bold text-indigo-900 flex items-center space-x-1.5">
              <Share2 className="w-4 h-4 text-indigo-600" />
              <span>Link chia sẻ phòng cho các bạn cùng phòng:</span>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                readOnly
                value={roomShareUrl}
                className="flex-1 p-2 bg-white border border-indigo-200 rounded-xl text-[11px] font-mono text-slate-600 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center space-x-1 transition"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
            <p className="text-[11px] text-indigo-700/80">
              Khi bạn cùng phòng bấm vào link này trên điện thoại của họ, họ sẽ vào đúng phòng và chọn danh tính của họ.
            </p>
          </div>

          {/* Supabase Cloud Database */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Kết nối Supabase (Cloud Database Miễn Phí):</span>
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                Realtime Sync
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Kết nối với Supabase để khi 1 người bấm "Đã xong", toàn bộ máy của các bạn khác tự động nhảy trạng thái ngay lập tức!
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Project URL:</label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Anon Public Key:</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {syncStatus && (
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-medium">
                {syncStatus}
              </div>
            )}

            <div className="flex space-x-2 pt-1">
              <button
                onClick={handleSaveAndPush}
                disabled={isSyncing}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center space-x-1 shadow-xs transition"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Đẩy lên Cloud</span>
              </button>

              <button
                onClick={handlePullFromCloud}
                disabled={isSyncing}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center space-x-1 shadow-xs transition"
              >
                <CloudDownload className="w-4 h-4" />
                <span>Kéo từ Cloud</span>
              </button>
            </div>
          </div>

          {/* Backup / Export */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">Sao lưu dữ liệu phòng ra file:</span>
            <button
              onClick={handleExportJSON}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Tải file backup JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
