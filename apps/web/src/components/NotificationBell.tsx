import { useEffect, useState } from 'react';
import { loadNotifications, clearNotifications, type NotificationItem } from '../lib/notifications';
import { apiFetch } from '../lib/apiClient';
import Modal from './Modal';
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  useClick,
  useDismiss,
  useInteractions,
  FloatingPortal,
} from '@floating-ui/react';

type ServerNotification = {
  id: number;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
};

function NotificationBell() {
  const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>(loadNotifications());
  const [serverNotifications, setServerNotifications] = useState<ServerNotification[]>([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(typeof window !== 'undefined' ? window.innerWidth <= 1080 : false);

  const floatingContext = useFloating({
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    placement: 'bottom-end',
    middleware: [offset(8), flip(), shift()],
  });
  const notifications = [
    ...serverNotifications.map((item) => ({
      id: `api-${item.id}`,
      title: item.title,
      message: item.message,
      createdAt: item.created_at,
      serverId: item.id,
      readAt: item.read_at,
    })),
    ...localNotifications.map((item) => ({ ...item, serverId: null, readAt: null })),
  ];

  async function refreshServerNotifications() {
    setError('');
    try {
      const response = await apiFetch('/api/notifications');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to load notifications.');
      setServerNotifications(payload.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications.');
    }
  }

  async function clearAllNotifications() {
    setError('');
    try {
      const response = await apiFetch('/api/notifications', { method: 'DELETE' });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Unable to clear notifications.');
      }
      clearNotifications();
      setLocalNotifications([]);
      setServerNotifications([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to clear notifications.');
    }
  }

  async function markRead(id: number) {
    setError('');
    try {
      const response = await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Unable to update notification.');
      }
      setServerNotifications((current) => current.map((item) => item.id === id
        ? { ...item, read_at: new Date().toISOString() }
        : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update notification.');
    }
  }

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return undefined;

    function nodeContains(el: any, target: Node) {
      if (!el) return false;
      // DOM elements
      if (typeof (el as Element).contains === 'function') {
        return (el as Element).contains(target);
      }
      // Floating UI virtual elements may not implement contains
      return false;
    }

    function onPointerDown(e: PointerEvent) {
      const ref = floatingContext.refs.reference.current;
      const float = floatingContext.refs.floating.current;
      const target = e.target as Node;
      if (nodeContains(ref, target)) return;
      if (nodeContains(float, target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, floatingContext.refs]);

  useEffect(() => {
    void refreshServerNotifications();
    const handleUpdate = () => setLocalNotifications(loadNotifications());
    window.addEventListener('StudyLinkNotificationsUpdated', handleUpdate);
    return () => window.removeEventListener('StudyLinkNotificationsUpdated', handleUpdate);
  }, []);

  useEffect(() => {
    const onResize = () => setIsSmallScreen(window.innerWidth <= 1080);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const unreadCount = serverNotifications.filter((item) => !item.read_at).length + localNotifications.length;
  const renderNotifications = () => (
    <>
      {error ? <p className="notification-empty" role="alert">{error}</p> : null}
      {notifications.length === 0 ? (
        <p className="notification-empty">No notifications yet.</p>
      ) : (
        <div className="notification-list">
          {notifications.map((item) => (
            <article key={item.id} className={`notification-item${item.readAt ? ' notification-read' : ''}`}>
              <button
                type="button"
                className="notification-item-action"
                onClick={() => item.serverId === null ? undefined : void markRead(item.serverId)}
                disabled={item.serverId === null || Boolean(item.readAt)}
                aria-label={item.readAt ? 'Notification read' : 'Mark notification as read'}
              >
                <p className="notification-title">{item.title}</p>
                <p className="notification-message">{item.message}</p>
                <span className="notification-time">{new Date(item.createdAt).toLocaleString()}</span>
              </button>
            </article>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="notification-bell">
      <button
        type="button"
        ref={floatingContext.refs.setReference}
        onClick={() => {
          if (isSmallScreen) {
            setLocalNotifications(loadNotifications());
            void refreshServerNotifications();
            setShowModal(true);
          } else {
            setLocalNotifications(loadNotifications());
            const nextOpen = !open;
            setOpen(nextOpen);
            if (nextOpen) void refreshServerNotifications();
          }
        }}
        className="notification-toggle button-secondary"
      >
        <span>🔔</span>
        {unreadCount > 0 ? <span className="notification-count">{unreadCount}</span> : null}
      </button>
      {!isSmallScreen ? (
        <FloatingPortal>
          {open ? (
            <div
              ref={floatingContext.refs.setFloating}
              style={{ position: floatingContext.strategy, left: floatingContext.x ?? 0, top: floatingContext.y ?? 0 }}
              className="notification-panel"
            >
              <div className="notification-panel-header">
                <strong>Notifications</strong>
                <button type="button" className="text-button" onClick={() => void clearAllNotifications()}>
                  Clear
                </button>
              </div>
              {renderNotifications()}
            </div>
          ) : null}
        </FloatingPortal>
      ) : null}

      <Modal open={showModal} title="Notifications" onClose={() => setShowModal(false)}>
        <div className="notification-panel-header">
          <strong>Notifications</strong>
          <button type="button" className="text-button" onClick={() => void clearAllNotifications()}>
            Clear
          </button>
        </div>
        {renderNotifications()}
      </Modal>
    </div>
  );
}

export default NotificationBell;
