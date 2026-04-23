import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { Bell, CheckCircle, Award, Unlock, GraduationCap, Info } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    API.get('/notifications/')
      .then(res => setNotifications(res.data.notifications))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (type) => {
    if (type === 'certificate_issued')  return <Award size={16} color="#0891b2" />;
    if (type === 'unlock_approved')     return <Unlock size={16} color="#059669" />;
    if (type === 'unlock_denied')       return <Unlock size={16} color="#ef4444" />;
    if (type === 'short_answer_graded') return <GraduationCap size={16} color="#d97706" />;
    if (type === 'quiz_locked')         return <Unlock size={16} color="#ef4444" />;
    return <Info size={16} color="#2563eb" />;
  };

  const getIconBg = (type) => {
    if (type === 'certificate_issued')  return '#ecfeff';
    if (type === 'unlock_approved')     return '#f0fdf4';
    if (type === 'unlock_denied')       return '#fef2f2';
    if (type === 'short_answer_graded') return '#fefce8';
    if (type === 'quiz_locked')         return '#fef2f2';
    return '#eff6ff';
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now  = new Date();
    const diff = Math.floor((now - date) / 60000);
    if (diff < 1)    return 'Just now';
    if (diff < 60)   return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const S = {
    header: {
      display: 'flex', alignItems: 'center', gap: '8px',
      fontSize: '1.1rem', fontWeight: '700', color: '#0f172a',
      marginBottom: '20px',
    },
    emptyState: {
      textAlign: 'center', padding: '48px 24px', color: '#94a3b8',
    },
    list: {
      display: 'flex', flexDirection: 'column', gap: '10px',
    },
    item: (isUnread) => ({
      background: isUnread ? '#f0f9ff' : '#fff',
      borderRadius: '10px',
      padding: '14px 16px',
      border: `1px solid ${isUnread ? '#bae6fd' : '#e2e8f0'}`,
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
    }),
    iconBox: (type) => ({
      width: '36px', height: '36px', borderRadius: '8px',
      background: getIconBg(type),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }),
    content: { flex: 1 },
    title: {
      fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '3px',
    },
    message: {
      fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5,
    },
    time: {
      fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0,
    },
    unreadDot: {
      width: '7px', height: '7px', borderRadius: '50%',
      background: '#0891b2', flexShrink: 0, marginTop: '6px',
    },
  };

  if (loading) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading notifications...</p>;

  return (
    <div>
      <div style={S.header}>
        <Bell size={18} color="#0891b2" />
        All Notifications
      </div>

      {notifications.length === 0 ? (
        <div style={S.emptyState}>
          <Bell size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '0.9rem' }}>No notifications yet.</div>
        </div>
      ) : (
        <div style={S.list}>
          {notifications.map(n => (
            <div key={n.id} style={S.item(!n.is_read)}>
              <div style={S.iconBox(n.type)}>
                {getIcon(n.type)}
              </div>
              <div style={S.content}>
                <div style={S.title}>{n.title}</div>
                <div style={S.message}>{n.message}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={S.time}>{formatTime(n.created_at)}</span>
                {!n.is_read && <div style={S.unreadDot} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}