/* Hook to manage browser Notification permission and sending notifications
   - Persists user's enabled preference in localStorage under 'notificationsEnabled'
   - Exposes: permission, enabled, requestPermission, setEnabled, notify
*/
import { useEffect, useState, useCallback } from 'react';

type PermissionState = NotificationPermission | 'unsupported';

export default function useNotifications() {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  const getInitialPermission = (): PermissionState => {
    if (!isSupported) return 'unsupported';
    return Notification.permission;
  };

  const [permission, setPermission] = useState<PermissionState>(getInitialPermission);
  const [enabled, setEnabledState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('notificationsEnabled');
      if (v === 'true') return true;
    } catch (e) {
      // ignore
    }
    return getInitialPermission() === 'granted';
  });

  useEffect(() => {
    if (!isSupported) return;
    // keep permission in sync
    const p = Notification.permission;
    setPermission(p);
  }, [isSupported]);

  const persistEnabled = useCallback((val: boolean) => {
    try {
      localStorage.setItem('notificationsEnabled', String(!!val));
    } catch (e) {
      // ignore
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<PermissionState> => {
    if (!isSupported) return 'unsupported';
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
      const allow = p === 'granted';
      setEnabledState(allow);
      persistEnabled(allow);
      return p;
    } catch (e) {
      return 'denied';
    }
  }, [isSupported, persistEnabled]);

  const setEnabled = useCallback((val: boolean) => {
    setEnabledState(val);
    persistEnabled(val);
  }, [persistEnabled]);

  const notify = useCallback((title: string, options?: NotificationOptions) => {
    // If Notification API available and permission granted, use it
    const pref = (() => {
      try {
        return localStorage.getItem('notificationsEnabled') === 'true';
      } catch (e) {
        return enabled;
      }
    })();

    if (!pref) return false;

    if (isSupported && Notification.permission === 'granted') {
      try {
        // eslint-disable-next-line no-new
        new Notification(title, options);
        return true;
      } catch (e) {
        // fallthrough to fallback
      }
    }

    // Fallback: in-page toast + title flashing + temporary favicon badge
    try {
      // transient toast
      (function showToast() {
        if (typeof document === 'undefined') return;
        const id = 'pt-toast-notification';
        let el = document.getElementById(id);
        if (!el) {
          el = document.createElement('div');
          el.id = id;
          el.style.position = 'fixed';
          el.style.right = '1rem';
          el.style.bottom = '1rem';
          el.style.zIndex = '9999';
          el.style.maxWidth = '360px';
          el.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';
          document.body.appendChild(el);
        }

        const toast = document.createElement('div');
        toast.style.background = 'linear-gradient(90deg,#0b1220,#071026)';
        toast.style.color = 'white';
        toast.style.padding = '12px 14px';
        toast.style.borderRadius = '10px';
        toast.style.boxShadow = '0 12px 30px rgba(2,6,23,0.7)';
        toast.style.marginTop = '10px';
        toast.style.fontSize = '14px';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '12px';
        toast.style.minWidth = '220px';
        toast.style.maxWidth = '100%';
        toast.style.opacity = '1';

        const emoji = document.createElement('div');
        emoji.textContent = '⏱️';
        emoji.style.fontSize = '18px';

        const content = document.createElement('div');
        const titleEl = document.createElement('div');
        titleEl.textContent = title;
        titleEl.style.fontWeight = '700';
        const bodyEl = document.createElement('div');
        bodyEl.textContent = (options && options.body) || '';
        bodyEl.style.opacity = '0.9';
        bodyEl.style.fontSize = '13px';

        content.appendChild(titleEl);
        if (bodyEl.textContent) content.appendChild(bodyEl);

        // add a close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'rgba(255,255,255,0.8)';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.marginLeft = 'auto';
        closeBtn.style.fontSize = '14px';

        toast.appendChild(emoji);
        toast.appendChild(content);
        toast.appendChild(closeBtn);

        el.appendChild(toast);

        const removeToast = () => {
          try {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 300ms ease';
            setTimeout(() => { if (el.contains(toast)) el.removeChild(toast); }, 320);
          } catch (e) {}
        };

        closeBtn.addEventListener('click', removeToast);

        // auto-dismiss after 10 seconds
        setTimeout(removeToast, 10000);
      })();

      // flash title
      (function flashTitle() {
        if (typeof document === 'undefined') return;
        const orig = document.title;
        let flashes = 0;
        const max = 6;
        const t = setInterval(() => {
          if (flashes >= max) {
            document.title = orig;
            clearInterval(t);
            return;
          }
          document.title = (flashes % 2 === 0 ? '🔔 ' : '') + orig;
          flashes += 1;
        }, 700);
      })();

      // attempt temporary favicon badge by swapping to /favicon.svg if present
      (function swapFavicon() {
        if (typeof document === 'undefined') return;
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
        if (!link) return;
        const origHref = link.href;
        // if there is a favicon, briefly toggle it to draw attention
        try {
          link.href = '/favicon.svg';
        } catch (e) {}
        setTimeout(() => {
          try { link.href = origHref; } catch (e) {}
        }, 3500);
      })();

      return false;
    } catch (e) {
      return false;
    }
  }, [enabled, isSupported]);

  return { permission, enabled, requestPermission, setEnabled, notify } as const;
}

