import React, { useState } from 'react';
import {
  NotificationItem,
  OpenWaConfig,
  AdminProfile,
} from '../types';
import {
  Bell,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  X,
  ExternalLink,
  Send,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle,
  Smartphone,
  Globe,
} from 'lucide-react';
import { formatWaMeUrl } from '../utils/notificationService';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  openwaConfig: OpenWaConfig;
  adminProfile: AdminProfile;
  onUpdateOpenwaConfig: (config: OpenWaConfig) => void;
  onSendTestNotification: (channel: 'whatsapp' | 'email' | 'sms' | 'in_app') => void;
  onMarkAllAsRead: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  openwaConfig,
  adminProfile,
  onUpdateOpenwaConfig,
  onSendTestNotification,
  onMarkAllAsRead,
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [gatewayUrl, setGatewayUrl] = useState<string>(openwaConfig.gatewayUrl);
  const [apiKey, setApiKey] = useState<string>(openwaConfig.apiKey || '');
  const [adminPhone, setAdminPhone] = useState<string>(openwaConfig.defaultRecipientPhone);
  const [adminEmail, setAdminEmail] = useState<string>(openwaConfig.adminEmail);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOpenwaConfig({
      ...openwaConfig,
      gatewayUrl,
      apiKey,
      defaultRecipientPhone: adminPhone,
      adminEmail,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleTriggerTest = async (channel: 'whatsapp' | 'email' | 'sms' | 'in_app') => {
    setIsTesting(channel);
    await onSendTestNotification(channel);
    setTimeout(() => setIsTesting(null), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Open-WA, Email & SMS Notification Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Open-WA Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Admin: {adminProfile.name} · {adminProfile.email} · {adminProfile.cellPhone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'notifications'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Notifications Feed ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Open-WA API & Dispatcher Settings
            </button>
          </div>

          {activeTab === 'notifications' && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-blue-700 hover:text-blue-900 font-medium"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'notifications' ? (
            <div className="space-y-4">
              {/* Quick Test dispatch bar */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Send Test Notification (Live Dispatch Verification)</span>
                  <span className="text-[10px] font-normal text-slate-500">
                    To: {adminProfile.cellPhone} & {adminProfile.email}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTriggerTest('whatsapp')}
                    disabled={isTesting !== null}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isTesting === 'whatsapp' ? 'Sending...' : 'Test WhatsApp (Open-WA)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriggerTest('email')}
                    disabled={isTesting !== null}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isTesting === 'email' ? 'Sending...' : 'Test Admin Email'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriggerTest('sms')}
                    disabled={isTesting !== null}
                    className="px-3 py-1.5 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-purple-600" />
                    <span>{isTesting === 'sms' ? 'Sending...' : 'Test SMS'}</span>
                  </button>
                </div>
              </div>

              {/* Feed items */}
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No notifications recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map((notif) => {
                    return (
                      <div
                        key={notif.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          notif.isRead
                            ? 'bg-white border-slate-200'
                            : 'bg-blue-50/40 border-blue-200/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5">
                              {notif.channel === 'whatsapp' ? (
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                  <MessageSquare className="w-4 h-4" />
                                </div>
                              ) : notif.channel === 'email' ? (
                                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                  <Mail className="w-4 h-4" />
                                </div>
                              ) : notif.channel === 'sms' ? (
                                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                                  <Smartphone className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                  <Bell className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase font-semibold">
                                  {notif.channel}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                                {notif.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                                <span>To: {notif.recipient} ({notif.recipientName})</span>
                                <span>·</span>
                                <span>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>

                          {/* Direct WhatsApp Web link if WhatsApp notification */}
                          {notif.channel === 'whatsapp' && (
                            <a
                              href={formatWaMeUrl(notif.recipient, notif.message)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 flex items-center gap-1 shrink-0"
                              title="Open chat in WhatsApp"
                            >
                              <span>Open WA</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              {isSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Open-WA & notification dispatch configuration saved.</span>
                </div>
              )}

              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-700" />
                  <span>Open-WA WhatsApp REST API (https://www.open-wa.org/)</span>
                </div>
                <p className="text-blue-700/90 leading-relaxed">
                  Open-WA is an open-source WhatsApp HTTP Gateway. By default, it connects to your local or hosted instance (e.g. <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">http://localhost:2785</code>). In dev or standby mode, all outgoing WhatsApp, Email, and SMS alerts are queued and saved into the active database so no messages are lost.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Open-WA REST API Gateway URL
                </label>
                <input
                  type="url"
                  required
                  value={gatewayUrl}
                  onChange={(e) => setGatewayUrl(e.target.value)}
                  placeholder="http://localhost:2785"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Default Open-WA REST endpoint is http://localhost:2785/api
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Open-WA API Key (Optional)
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Leave empty if not required"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Main Administrator WhatsApp & SMS Cell Number
                </label>
                <input
                  type="text"
                  required
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="+27 010 7489"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Main Administrator Alert E-mail
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="valerie.ajtransportcater@gmail.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors shadow-xs"
                >
                  Save Open-WA & Notification Settings
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
