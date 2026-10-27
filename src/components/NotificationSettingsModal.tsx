import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Clock, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Smartphone, 
  Share2, 
  Sparkles, 
  Volume2,
  Users
} from 'lucide-react';
import { NotificationSettings } from '../types';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  getNotificationPermission, 
  requestNotificationPermission, 
  triggerPushNotification,
  isIOSDevice,
  isStandaloneMode
} from '../utils/notifications';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: (settings: NotificationSettings) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChanged,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission);
  const [testSent, setTestSent] = useState(false);
  const isIOS = isIOSDevice();
  const isStandalone = isStandaloneMode();

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
    if (granted) {
      triggerPushNotification('🔔 Chúc mừng! Thông báo đẩy đã sẵn sàng', {
        body: 'Bạn sẽ nhận được nhắc việc hôm nay, báo việc ngày mai và cảnh báo sát hạn chót.',
      });
    }
  };

  const handleTestNotification = async () => {
    setTestSent(true);
    await triggerPushNotification('🔔 [Thử nghiệm] Nhắc việc nhà', {
      body: 'Hệ thống thông báo đẩy đang hoạt động hoàn hảo trên điện thoại của bạn!',
    });
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSave = () => {
    saveNotificationSettings(settings);
    onSettingsChanged?.(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center space-x-1.5">
                <span>Cài Đặt Thông Báo Đẩy</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 font-semibold uppercase tracking-wider">
                  Mobile PWA
                </span>
              </h3>
              <p className="text-[11px] text-indigo-100">
                Nhắc việc hôm nay, báo việc ngày mai & cảnh báo sát hạn
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

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto no-scrollbar flex-1 text-slate-700">
          {/* Permission Status Banner */}
          <div className="p-3 rounded-2xl border bg-slate-50 border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Quyền thông báo thiết bị:</span>
              {permission === 'granted' ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Đã cấp quyền</span>
                </span>
              ) : permission === 'denied' ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>Bị chặn</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Chưa cấp quyền</span>
                </span>
              )}
            </div>

            {permission !== 'granted' ? (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-600">
                  {permission === 'denied'
                    ? 'Bạn đã chặn thông báo trên trình duyệt. Vui lòng nhấn vào biểu tượng ổ khóa bên cạnh thanh địa chỉ web để bật lại quyền thông báo.'
                    : 'Cấp quyền để nhận thông báo đẩy ra màn hình khóa khi đến giờ làm việc hoặc khi có việc gấp.'}
                </p>
                {permission !== 'denied' && (
                  <button
                    onClick={handleRequestPermission}
                    className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition active:scale-98"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Bật quyền thông báo trên điện thoại</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-[11px] text-slate-500">Kiểm tra thông báo trên màn hình:</span>
                <button
                  onClick={handleTestNotification}
                  disabled={testSent}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 font-semibold text-[11px] rounded-lg shadow-2xs flex items-center space-x-1 transition"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{testSent ? 'Đang gửi...' : 'Gửi thử nghiệm 🔔'}</span>
                </button>
              </div>
            )}
          </div>

          {/* iOS Compatibility Special Guide */}
          {isIOS && !isStandalone && (
            <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-1.5 text-amber-950">
              <div className="flex items-center space-x-1.5 font-bold text-xs text-amber-900">
                <Smartphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Hướng dẫn nhận thông báo trên iPhone (iOS):</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Trên iOS 16.4+, Apple yêu cầu ứng dụng phải được thêm ra Màn hình chính mới có thể nhận thông báo đẩy khi khóa màn hình:
              </p>
              <ol className="text-[11px] text-amber-900 list-decimal list-inside space-y-1 pl-1 font-medium">
                <li>Bấm nút <strong>Chia sẻ (biểu tượng <Share2 className="w-3 h-3 inline text-amber-700" /> ở Safari)</strong></li>
                <li>Chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong></li>
                <li>Mở app từ biểu tượng trên Màn hình chính và bật thông báo</li>
              </ol>
            </div>
          )}

          {/* Settings Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1">
              <span>Lịch Nhắc Cá Nhân Trong Ngày</span>
            </h4>

            {/* Master Toggle */}
            <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-indigo-950">Kích hoạt thông báo đẩy</div>
                <div className="text-[10px] text-indigo-700">Tự động nhận thông báo theo cài đặt bên dưới</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 1. Nhắc việc hôm nay */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Nhắc việc cần làm hôm nay</div>
                    <div className="text-[10px] text-slate-400">Báo tổng số việc và hạn chót trong ngày</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.todayReminderEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, todayReminderEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {settings.todayReminderEnabled && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-600 font-medium">Thời gian nhắc:</span>
                  <input
                    type="time"
                    value={settings.todayReminderTime}
                    onChange={(e) =>
                      setSettings({ ...settings, todayReminderTime: e.target.value })
                    }
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* 2. Báo việc ngày mai */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Báo lịch việc ngày mai</div>
                    <div className="text-[10px] text-slate-400">Xem trước mai bạn có những việc gì & bao nhiêu điểm</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.tomorrowPreviewEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, tomorrowPreviewEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {settings.tomorrowPreviewEnabled && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-600 font-medium">Thời gian báo:</span>
                  <input
                    type="time"
                    value={settings.tomorrowPreviewTime}
                    onChange={(e) =>
                      setSettings({ ...settings, tomorrowPreviewTime: e.target.value })
                    }
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* 3. Cảnh báo sát hạn chót */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Cảnh báo sát hạn chót</div>
                    <div className="text-[10px] text-slate-400">Nhắc nhở tự động nhiều mốc để không bị phạt trừ điểm</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.urgentDeadlineEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, urgentDeadlineEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {settings.urgentDeadlineEnabled && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded-xl space-y-1">
                    <div className="font-semibold text-slate-700 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>Việc thường (&lt; 3đ):</span>
                    </div>
                    <p className="text-slate-500 pl-3">
                      Báo trước <strong>30 phút</strong>, <strong>15 phút</strong>, <strong>5 phút</strong> trước giờ hết hạn.
                    </p>
                  </div>

                  <div className="p-2 bg-amber-50/70 rounded-xl space-y-1">
                    <div className="font-semibold text-amber-900 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Việc nặng điểm cao (≥ 3đ):</span>
                    </div>
                    <p className="text-amber-800 pl-3">
                      Báo trước <strong>2 tiếng</strong>, <strong>1 tiếng</strong>, <strong>30 phút</strong> trước giờ hết hạn.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Thông báo hoạt động phòng */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Thông báo hoạt động phòng</div>
                    <div className="text-[10px] text-slate-400">Báo khi có người xong việc, nhượng việc, biểu quyết</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.roomActivitiesEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, roomActivitiesEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition transform active:scale-98 cursor-pointer"
          >
            Lưu Cài Đặt
          </button>
        </div>
      </div>
    </div>
  );
};
