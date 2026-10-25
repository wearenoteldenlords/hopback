import type { Platform } from '@hopback/platform';

export const webPlatform: Platform = {
  openExternal(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  },
  notify(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  },
};
