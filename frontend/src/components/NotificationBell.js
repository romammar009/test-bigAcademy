import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [open, setOpen]                   = useState(false);
  const dropdownRef                       = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications/');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch (err) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setOpen(!open);
    if (!open && unreadCount > 0) {
      try {
        await API.patch('/notifications/mark-read/', {});
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch (err) {}
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now  = new Date();
    const diff = Math.floor((now - date) / 60000);
    if (diff < 1)    return 'Just now';
    if (diff < 60)   return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        className="btn btn-outline-light btn-sm position-relative"
        onClick={handleOpen}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="position-absolute end-0 mt-2 bg-white border rounded shadow"
          style={{ width: '340px', zIndex: 1050, maxHeight: '400px', overflowY: 'auto' }}
        >
          <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
            <strong className="text-dark">Notifications</strong>
            <small className="text-muted">{notifications.length} total</small>
          </div>

          {notifications.length === 0 ? (
            <div className="p-3 text-center text-muted">
              <div style={{ fontSize: '2rem' }}>🔔</div>
              <div>No notifications yet</div>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`px-3 py-2 border-bottom ${!n.is_read ? 'bg-light' : ''}`}
                style={{ cursor: 'default' }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <strong className="text-dark" style={{ fontSize: '0.9rem' }}>{n.title}</strong>
                  <small className="text-muted ms-2" style={{ whiteSpace: 'nowrap' }}>
                    {formatTime(n.created_at)}
                  </small>
                </div>
                <div className="text-secondary" style={{ fontSize: '0.85rem' }}>{n.message}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}