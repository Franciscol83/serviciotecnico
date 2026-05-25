import React, { useEffect, useState, useCallback } from 'react';
import { Bell, BellOff, CheckCircle, AlertCircle, Send } from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  getCurrentSubscription,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  sendTestNotification,
} from '@/services/notifications';

const PushNotificationsCard = ({ onMessage }) => {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setSupported(isPushSupported());
    setPermission(getNotificationPermission());
    if (isPushSupported()) {
      const sub = await getCurrentSubscription();
      setSubscribed(!!sub);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const notify = (text, type = 'success') => {
    if (onMessage) onMessage(text, type);
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      await subscribeUserToPush();
      notify('Notificaciones push activadas correctamente', 'success');
      await refresh();
    } catch (e) {
      notify(e.message || 'No se pudo activar las notificaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await unsubscribeUserFromPush();
      notify('Notificaciones push desactivadas', 'success');
      await refresh();
    } catch (e) {
      notify(e.message || 'Error al desactivar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      const res = await sendTestNotification();
      const sent = res?.data?.result?.sent ?? 0;
      if (sent > 0) {
        notify(`Notificación de prueba enviada a ${sent} dispositivo(s)`, 'success');
      } else {
        notify('No se pudo entregar la notificación. ¿Está activada?', 'error');
      }
    } catch (e) {
      notify(e.response?.data?.detail || 'Error al enviar prueba', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6" data-testid="push-notifications-card">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Bell className="w-5 h-5 mr-2" />
        Notificaciones Push
      </h2>

      {!supported && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Tu navegador no soporta notificaciones push. Usa Chrome, Edge, Firefox o Safari 16.4+.
          </p>
        </div>
      )}

      {supported && permission === 'denied' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Permiso bloqueado
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              Habilita las notificaciones desde la configuración del navegador para esta página.
            </p>
          </div>
        </div>
      )}

      {supported && permission !== 'denied' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            {subscribed ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 text-sm">
                <CheckCircle className="w-4 h-4 mr-1" /> Activadas
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-sm">
                <BellOff className="w-4 h-4 mr-1" /> Desactivadas
              </span>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Recibe alertas cuando llegue un mensaje nuevo al chat aunque la app esté cerrada.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {!subscribed ? (
              <button
                onClick={handleEnable}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                data-testid="push-enable-btn"
              >
                <Bell className="w-4 h-4 mr-2" />
                {loading ? 'Activando...' : 'Activar Notificaciones'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleTest}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  data-testid="push-test-btn"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Prueba
                </button>
                <button
                  onClick={handleDisable}
                  disabled={loading}
                  className="flex items-center px-4 py-2 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  data-testid="push-disable-btn"
                >
                  <BellOff className="w-4 h-4 mr-2" />
                  Desactivar
                </button>
              </>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
            <strong>Móvil (PWA):</strong> Instala la app desde el menú del navegador para recibir
            notificaciones nativas en Android/iOS 16.4+. En iOS la app debe instalarse desde Safari.
          </div>
        </div>
      )}
    </div>
  );
};

export default PushNotificationsCard;
