export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
}

export async function getFCMToken() {
  try {
    const { getToken } = await import('firebase/messaging')
    const { messaging } = await import('./firebase')
    
    if (!messaging) {
      console.warn('Firebase Messaging not available')
      return null
    }

    const permission = await requestNotificationPermission()
    if (!permission) {
      return null
    }

    const token = await getToken(messaging, {
      vapidKey: 'BAAn-vFfNpOOgYl8HK9_w3_Eo_doOjyD9Dg_Yokhr_tHAYq1fpO4ijs8eA0NqVNw7pww7eFcp4qheywA66OZyvM'
    })

    console.log('FCM Token received:', token)
    return token
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

export async function subscribeFCM(onMessageCallback) {
  try {
    const { onMessage } = await import('firebase/messaging')
    const { messaging } = await import('./firebase')
    
    if (!messaging) {
      console.warn('Firebase Messaging not available')
      return () => {}
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload)
      
      if (onMessageCallback) {
        onMessageCallback(payload)
      } else {
        sendLocalNotification(
          payload.notification?.title || 'New Notification',
          {
            body: payload.notification?.body || '',
            icon: payload.notification?.icon || '/placeholder-logo.png',
            data: payload.data
          }
        )
      }
    })

    return unsubscribe
  } catch (error) {
    console.error('Error subscribing to FCM:', error)
    return () => {}
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const hasPermission = await requestNotificationPermission();
    
    if (!hasPermission) {
      console.log('Notification permission denied');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xQmR_gqg9OAm0SzNq4tLKhKPAqcWDrPQqCkTHg_OOg0l0TLLhPQMU'
      )
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

export function sendLocalNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/placeholder-logo.png',
      badge: '/placeholder-logo.png',
      ...options
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, {
          icon: '/placeholder-logo.png',
          badge: '/placeholder-logo.png',
          ...options
        });
      }
    });
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
