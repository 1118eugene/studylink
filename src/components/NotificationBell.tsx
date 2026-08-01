import { useEffect, useState } from 'react';
import { loadNotifications, clearNotifications } from '../lib/notifications';
import Modal from './Modal';

function NotificationBell() {
  const [notifications, setNotifications] = useState(loadNotifications());
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(typeof window !== 'undefined' ? window.innerWidth <= 1080 : false);

  useEffect(() => {
    const handleUpdate = () => setNotifications(loadNotifications());
    window.addEventListener('StudyLinkNotificationsUpdated', handleUpdate);
    return () => window.removeEventListener('StudyLinkNotificationsUpdated', handleUpdate);
  }, []);

  useEffect(() => {
    const onResize = () => setIsSmallScreen(window.innerWidth <= 1080);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="notification-bell">
      <button
        type="button"
        className="notification-toggle button-secondary"
        onClick={() => {
          // On small screens show the modal fallback, otherwise anchor the panel in the sidebar
          if (isSmallScreen) {
            setNotifications(loadNotifications());
            setShowModal(true);
          } else {
            setOpen((value) => {
              const next = !value;
              if (next) setNotifications(loadNotifications());
              return next;
            });
          }
        }}
      >
        <span>🔔</span>
        {unreadCount > 0 ? <span className="notification-count">{unreadCount}</span> : null}
      </button>
      {open ? (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <strong>Notifications</strong>
            <button type="button" className="text-button" onClick={() => { clearNotifications(); setNotifications([]); }}>
              Clear
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="notification-empty">No notifications yet.</p>
          ) : (
            <div className="notification-list">
              {notifications.map((item) => (
                <article key={item.id} className="notification-item">
                  <p className="notification-title">{item.title}</p>
                  <p className="notification-message">{item.message}</p>
                  <span className="notification-time">{new Date(item.createdAt).toLocaleString()}</span>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <Modal open={showModal} title="Notifications" onClose={() => setShowModal(false)}>
        <div className="notification-panel-header">
          <strong>Notifications</strong>
          <button type="button" className="text-button" onClick={() => { clearNotifications(); setNotifications([]); }}>
            Clear
          </button>
        </div>
        {notifications.length === 0 ? (
          <p className="notification-empty">No notifications yet.</p>
        ) : (
          <div className="notification-list">
            {notifications.map((item) => (
              <article key={item.id} className="notification-item">
                <p className="notification-title">{item.title}</p>
                <p className="notification-message">{item.message}</p>
                <span className="notification-time">{new Date(item.createdAt).toLocaleString()}</span>
              </article>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default NotificationBell;
