import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Bell, BellRing, Sparkles, Trophy, AlertTriangle, CheckCircle2, 
  X, Volume2, VolumeX, Send, Trash2, ShieldCheck
} from 'lucide-react';
import { PushNotificationItem } from '../types';

interface NotificationCenterProps {
  notifications: PushNotificationItem[];
  onMarkAllRead: () => void;
  onClearNotifications: () => void;
  onSendCustomNotification: (title: string, message: string, type: any) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAllRead,
  onClearNotifications,
  onSendCustomNotification,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customTitle, setCustomTitle] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionStatus(perm);
        if (perm === 'granted') {
          new Notification('INFORMA JUANDA MEDAN', {
            body: 'Notifikasi push aktif! Anda akan menerima update target real-time.',
            icon: '/icon.png',
          });
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        }
      } catch (err) {
        console.error('Push notification permission error', err);
      }
    }
  };

  const handleSendTestPush = () => {
    onSendCustomNotification(
      '🎯 TARGET HARIAN TERCAPAI 100%!',
      'Selamat Tim Informa Juanda Medan! Target penjualan harian telah tercapai Rp 125.400.000 (104.25%)',
      'achievement'
    );
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('INFORMA JUANDA MEDAN - TARGET TERCAPAI!', {
        body: 'Target penjualan harian telah tercapai 100%! Pertahankan performa luar biasa!',
      });
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customMsg.trim()) return;
    onSendCustomNotification(customTitle, customMsg, 'info');
    setCustomTitle('');
    setCustomMsg('');
    setShowCustomForm(false);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`INFORMA JUANDA: ${customTitle}`, {
        body: customMsg,
      });
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="btn-notification-center"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
        title="Pusat Notifikasi & Push Target"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-[#FFD700] animate-bounce" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[9px] font-mono font-bold animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Drawer / Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#111111] border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col text-xs">
          {/* Header */}
          <div className="px-4 py-3 bg-[#151515] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="font-bold text-white text-xs">Pusat Notifikasi Target</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 text-white/40 hover:text-white"
                title={soundEnabled ? 'Suara Aktif' : 'Suara Mati'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#FFD700]" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Push Status Notice */}
          <div className="p-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className={`w-3.5 h-3.5 ${permissionStatus === 'granted' ? 'text-emerald-400' : 'text-[#FFD700]'}`} />
              <span className="text-[11px] text-white/70">
                Push Browser: {permissionStatus === 'granted' ? 'Aktif' : 'Belum Izin'}
              </span>
            </div>
            {permissionStatus !== 'granted' && (
              <button
                type="button"
                onClick={requestPushPermission}
                className="px-2 py-0.5 rounded bg-[#FFD700] hover:bg-[#ffe234] text-black font-bold text-[10px]"
              >
                Aktifkan Push
              </button>
            )}
          </div>

          {/* Quick Push Test & Broadcast Toggle */}
          <div className="p-2.5 bg-[#111111] border-b border-white/5 flex items-center gap-2">
            <button
              type="button"
              id="btn-test-push"
              onClick={handleSendTestPush}
              className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold border border-emerald-500/30 transition-colors text-[11px] flex items-center justify-center gap-1"
            >
              <Trophy className="w-3 h-3 text-[#FFD700]" />
              Tes Push 100% Target
            </button>
            <button
              type="button"
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 font-medium border border-white/10 text-[11px]"
            >
              Broadcast
            </button>
          </div>

          {/* Custom Broadcast Form */}
          {showCustomForm && (
            <form onSubmit={handleBroadcast} className="p-3 bg-black/50 border-b border-white/10 space-y-2">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Judul Pengumuman..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#FFD700]"
              />
              <textarea
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Pesan untuk tim sales Informa Juanda..."
                rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#FFD700]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="px-2 py-1 text-white/40 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-[#FFD700] text-black font-bold text-xs flex items-center gap-1"
                >
                  <Send className="w-3 h-3" /> Kirim
                </button>
              </div>
            </form>
          )}

          {/* Notification List */}
          <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-white/5 p-2 space-y-1.5">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-white/40">
                Belum ada notifikasi pencapaian target.
              </div>
            ) : (
              notifications.map((item) => {
                const isAchievement = item.type === 'achievement';
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl transition-colors ${
                      item.read
                        ? 'bg-white/[0.02] text-white/40'
                        : isAchievement
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
                        : 'bg-white/5 text-white/80 border border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="font-bold flex items-center gap-1.5">
                        {isAchievement ? (
                          <Trophy className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
                        ) : (
                          <Bell className="w-3.5 h-3.5 text-white/50 shrink-0" />
                        )}
                        <span className="truncate text-white text-xs">{item.title}</span>
                      </div>
                      <span className="text-[9px] text-white/40 font-mono shrink-0">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-white/70">
                      {item.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-2.5 bg-[#151515] border-t border-white/10 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-white/40 hover:text-[#FFD700] transition-colors"
            >
              Tandai Semua Dibaca
            </button>
            <button
              type="button"
              onClick={onClearNotifications}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Bersihkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
