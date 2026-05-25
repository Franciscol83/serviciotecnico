/**
 * Servicio para gestión de Push Notifications (Web Push API + VAPID)
 */
import apiClient from '@/api/client';

// Convertir clave pública VAPID base64-url a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const isPushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const getNotificationPermission = () =>
  typeof Notification !== 'undefined' ? Notification.permission : 'denied';

export async function getCurrentSubscription() {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribeUserToPush() {
  if (!isPushSupported()) {
    throw new Error('Tu navegador no soporta notificaciones push');
  }

  // Pedir permiso al usuario
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permiso de notificaciones denegado');
  }

  // Obtener clave VAPID del backend
  const { data } = await apiClient.get('/notifications/vapid-public-key');
  const applicationServerKey = urlBase64ToUint8Array(data.public_key);

  // Asegurar service worker registrado
  const registration = await navigator.serviceWorker.ready;

  // Si ya hay suscripción, reutilizar
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }

  // Registrar en backend
  const subJson = subscription.toJSON();
  await apiClient.post('/notifications/subscribe', {
    endpoint: subJson.endpoint,
    keys: subJson.keys,
    expirationTime: subJson.expirationTime || null,
    user_agent: navigator.userAgent,
  });

  return subscription;
}

export async function unsubscribeUserFromPush() {
  const subscription = await getCurrentSubscription();
  if (!subscription) return false;

  try {
    await apiClient.post('/notifications/unsubscribe', {
      endpoint: subscription.endpoint,
    });
  } catch (e) {
    // continuar aún si el backend falla
  }

  return subscription.unsubscribe();
}

export async function sendTestNotification() {
  return apiClient.post('/notifications/test', {
    title: 'Prueba de Notificación',
    body: 'Si ves esto, las notificaciones push funcionan correctamente.',
    url: '/',
  });
}
