import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import { Bell } from 'lucide-react';

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

  const S = {
    bellBtn: {
      position: 'relative',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: '#64748b',
      transition: 'all 0.15s ease',
    },
    badge: {
      position: 'absolute',
      top: '-4px',
      right: '-4px',
      background: '#ef4444',
      color: '#fff',
      fontSize: '0.6rem',
      fontWeight: '700',
      borderRadius: '10px',
      padding: '1px 5px',
      minWidth: '16px',
      textAlign: 'center',
      lineHeight: '14px',
      border: '2px solid #fff',
    },
    dropdown: {
      position: 'absolute',
      right: 0,
      top: 'calc(100% + 8px)',
      width: '340px',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      border: '1px solid #e2e8f0',
      zIndex: 1050,
      overflow: 'hidden',
    },
    dropdownHeader: {
      padding: '14px 16px',
      borderBottom: '1px solid #f1f5f9',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dropdownTitle: {
      fontWeight: '700',
      fontSize: '0.9rem',
      color: '#0f172a',
    },
    dropdownCount: {
      fontSize: '0.75rem',
      color: '#94a3b8',
      background: '#f1f5f9',
      padding: '2px 8px',
      borderRadius: '10px',
    },
    notifList: {
      maxHeight: '360px',
      overflowY: 'auto',
    },
    notifItem: (isUnread) => ({
      padding: '12px 16px',
      borderBottom: '1px solid #f8fafc',
      background: isUnread ? '#f0f6ff' : '#fff',
      cursor: 'default',
      transition: 'background 0.1s',
    }),
    notifTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '3px',
      gap: '8px',
    },
    notifTitle: {
      fontSize: '0.85rem',
      fontWeight: '600',
      color: '#1e293b',
    },
    notifTime: {
      fontSize: '0.72rem',
      color: '#94a3b8',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    },
    notifMessage: {
      fontSize: '0.8rem',
      color: '#64748b',
      lineHeight: 1.4,
    },
    unreadDot: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: '#2563eb',
      flexShrink: 0,
      marginTop: '4px',
    },
    emptyState: {
      padding: '32px 16px',
      textAlign: 'center',
      color: '#94a3b8',
    },
    emptyIcon: {
      marginBottom: '8px',
      opacity: 0.4,
    },
    emptyText: {
      fontSize: '0.85rem',
    },
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button style={S.bellBtn} onClick={handleOpen} title="Notifications">
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={S.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={S.dropdown}>
          <div style={S.dropdownHeader}>
            <span style={S.dropdownTitle}>Notifications</span>
            <span style={S.dropdownCount}>{notifications.length} total</span>
          </div>

          <div style={S.notifList}>
            {notifications.length === 0 ? (
              <div style={S.emptyState}>
                <div style={S.emptyIcon}>
                  <Bell size={32} color="#94a3b8" />
                </div>
                <div style={S.emptyText}>No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={S.notifItem(!n.is_read)}>
                  <div style={S.notifTop}>
                    <span style={S.notifTitle}>{n.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {!n.is_read && <div style={S.unreadDot} />}
                      <span style={S.notifTime}>{formatTime(n.created_at)}</span>
                    </div>
                  </div>
                  <div style={S.notifMessage}>{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}