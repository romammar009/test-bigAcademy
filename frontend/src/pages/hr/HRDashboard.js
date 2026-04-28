import QuizGrading from '../shared/QuizGrading';
import CoursesManager from '../shared/CoursesManager';
import AssignmentsManager from '../shared/AssignmentsManager';
import logo from '../../BigChildcare-Logo.png';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import HRManageUsers from './HRManageUsers';
import HRUnlockRequests from './HRUnlockRequests';
import HRReports from './HRReports';
import NotificationBell from '../../components/NotificationBell';
import NotificationsPage from '../shared/NotificationsPage';
import {
  LayoutDashboard, Users, Unlock, BarChart2,
  BookOpen, ClipboardList, GraduationCap,
  LogOut, ChevronLeft, ChevronRight,
  UserCheck, ShieldCheck, TrendingUp, Bell,
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { key: 'dashboard',   path: '/hr/dashboard',   icon: LayoutDashboard, label: 'Dashboard'       },
  { key: 'courses',     path: '/hr/courses',     icon: BookOpen,        label: 'Courses'         },
  { key: 'assignments', path: '/hr/assignments', icon: ClipboardList,   label: 'Assignments'     },
  { key: 'grading',     path: '/hr/grading',     icon: GraduationCap,   label: 'Quiz Grading'    },
  { key: 'users',       path: '/hr/users',       icon: Users,           label: 'Users'           },
  { key: 'requests',    path: '/hr/requests',    icon: Unlock,          label: 'Unlock Requests' },
  { key: 'reports',       path: '/hr/reports',        icon: BarChart2,       label: 'Reports'         },
  { key: 'notifications', path: '/hr/notifications',  icon: Bell,            label: 'Notifications'   },
];

export default function HRDashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ total_users: 0, educators: 0, managers: 0, pending_unlocks: 0 });
  const [latestNotifications, setLatestNotifications] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const activeItem = SIDEBAR_ITEMS.find(i => location.pathname.startsWith(i.path)) || SIDEBAR_ITEMS[0];
  const isExecutive = user.is_hr_executive;

  useEffect(() => {
    if (location.pathname === '/hr' || location.pathname === '/hr/') {
      navigate('/hr/dashboard', { replace: true });
    }
  }, [location.pathname]);

  useEffect(() => {
    API.get('/users/').then(res => {
      const users = res.data;
      setStats(prev => ({
        ...prev,
        total_users: users.length,
        educators:   users.filter(u => u.role === 'educator').length,
        managers:    users.filter(u => u.role === 'branch_manager' || u.role === 'area_manager').length,
      }));
    }).catch(() => {});
    API.get('/unlock-requests/').then(res => {
      setStats(prev => ({ ...prev, pending_unlocks: res.data.length }));
    }).catch(() => {});
    API.get('/attempts/pending-grading/').then(res => {
      setStats(prev => ({ ...prev, pending_grading: res.data.length }));
    }).catch(() => {});
    API.get('/notifications/').then(res => {
      setLatestNotifications((res.data.notifications || []).slice(0, 3));
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await API.post('/auth/logout/'); } catch (err) {}
    logout();
    navigate('/bigacademy-login2026');
  };

  const S = {
    layout: {
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
    },
    sidebar: {
      width: sidebarOpen ? '240px' : '68px',
      height: '100vh',
      background: 'linear-gradient(180deg, #6b0f1a 0%, #b5132a 100%)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: '3px 0 16px rgba(107,15,26,0.2)',
    },
    sidebarHeader: {
      padding: '0 12px',
      height: '64px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      
    },
    logoBox: {
      width: '34px',
      height: '34px',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: '800',
      fontSize: '0.85rem',
      flexShrink: 0,
    },
    logoText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: '0.95rem',
      whiteSpace: 'nowrap',
      lineHeight: 1.2,
    },
    logoSub: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '0.65rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    toggleBtn: {
      background: 'none',
      border: 'none',
      color: 'rgba(255,255,255,0.6)',
      cursor: 'pointer',
      padding: '4px',
      marginLeft: 'auto',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
    },
    navSection: { padding: '20px 0 8px', flex: 1 },
    navSectionLabel: {
      padding: '0 18px 8px',
      color: 'rgba(255,255,255,0.35)',
      fontSize: '0.65rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    },
    navItem: (isActive) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 18px',
      cursor: 'pointer',
      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
      background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
      borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
      transition: 'all 0.15s ease',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      userSelect: 'none',
    }),
    navText: { fontSize: '0.875rem', fontWeight: '500' },
    sidebarFooter: {
      padding: '16px',
      borderTop: '1px solid rgba(255,255,255,0.1)',
    },
    userRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '12px',
      overflow: 'hidden',
    },
    avatar: {
      width: '34px',
      height: '34px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: '700',
      fontSize: '0.8rem',
      flexShrink: 0,
      border: '2px solid rgba(255,255,255,0.25)',
    },
    userName: {
      color: '#fff',
      fontSize: '0.85rem',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    userRole: { color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' },
    executiveBadge: {
      display: 'inline-block',
      fontSize: '0.6rem',
      fontWeight: '700',
      padding: '1px 6px',
      borderRadius: '10px',
      background: 'rgba(255,255,255,0.2)',
      color: '#fff',
      marginTop: '2px',
      letterSpacing: '0.05em',
    },
    logoutBtn: {
      width: '100%',
      padding: '8px 12px',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '7px',
      color: 'rgba(255,255,255,0.75)',
      fontSize: '0.82rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
    main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#fff0f0' },
    topbar: {
      height: '64px',
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    pageTitle: {
      fontWeight: '700',
      fontSize: '1rem',
      color: '#1e293b',
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    roleBadge: {
      fontSize: '0.8rem',
      color: '#b5132a',
      fontWeight: '600',
      background: '#fff0f0',
      padding: '4px 12px',
      borderRadius: '20px',
      border: '1px solid #fecdd3',
    },
    content: { flex: 1, padding: '28px', overflowY: 'auto' },
    greetingTitle:    { fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' },
    greetingSubtitle: { fontSize: '0.875rem', color: '#64748b', marginBottom: '24px' },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
      marginBottom: '32px',
    },
    statCard: (accent) => ({
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      borderTop: `3px solid ${accent}`,
    }),
    statIconBox: (bg) => ({
      width: '36px', height: '36px', borderRadius: '8px', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
    }),
    statNumber: { fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: 1, marginBottom: '6px' },
    statLabel:  { fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' },
    sectionLabel: { fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' },
    quickLinksGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' },
    quickLink: {
      background: '#fff', borderRadius: '10px', padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: '14px',
      cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      border: '1px solid #e2e8f0', transition: 'box-shadow 0.15s',
    },
    quickLinkIconBox: (bg) => ({
      width: '40px', height: '40px', borderRadius: '10px', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }),
    quickLinkTitle: { fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', marginBottom: '2px' },
    quickLinkSub:   { fontSize: '0.75rem', color: '#94a3b8' },
  };

  const ActiveIcon = activeItem?.icon;

  const HomeDashboard = () => (
    <div>
      <div style={S.greetingTitle}>Welcome, {user.first_name}! 👋</div>
      <div style={S.greetingSubtitle}>
        {isExecutive ? 'HR Executive — Full system access' : 'HR — Manage users and monitor progress'}
      </div>

      <div style={S.statsGrid}>
        {[
          { label: 'Total Users',     value: stats.total_users,    Icon: Users,      accent: '#b5132a', iconColor: '#b5132a', iconBg: '#fff0f0' },
          { label: 'Educators',       value: stats.educators,      Icon: UserCheck,  accent: '#10b981', iconColor: '#10b981', iconBg: '#f0fdf4' },
          { label: 'Managers',        value: stats.managers,       Icon: ShieldCheck,accent: '#2563eb', iconColor: '#2563eb', iconBg: '#eff6ff' },
          { label: 'Pending Unlocks', value: stats.pending_unlocks,Icon: TrendingUp, accent: '#f59e0b', iconColor: '#f59e0b', iconBg: '#fefce8' },
        ].map(stat => (
          <div key={stat.label} style={S.statCard(stat.accent)}>
            <div style={S.statIconBox(stat.iconBg)}>
              <stat.Icon size={18} color={stat.iconColor} />
            </div>
            <div style={S.statNumber}>{stat.value}</div>
            <div style={S.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={S.sectionLabel}>Quick Links</div>
      <div style={S.quickLinksGrid}>
        {[
          { Icon: Users,    bg: '#fff0f0', color: '#b5132a', label: 'Manage Users',    sub: 'Onboard & offboard staff',       path: '/hr/users'    },
          { Icon: Unlock,   bg: '#fefce8', color: '#d97706', label: 'Unlock Requests', sub: 'Review pending quiz unlocks',    path: '/hr/requests' },
          { Icon: BarChart2,bg: '#f0fdf4', color: '#059669', label: 'Reports',         sub: 'View completion & staff reports',path: '/hr/reports'  },
        ].map(link => (
          <div key={link.path} style={S.quickLink} onClick={() => navigate(link.path)}>
            <div style={S.quickLinkIconBox(link.bg)}>
              <link.Icon size={18} color={link.color} />
            </div>
            <div>
              <div style={S.quickLinkTitle}>{link.label}</div>
              <div style={S.quickLinkSub}>{link.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={S.sectionLabel}>Latest Updates</div>
          <span onClick={() => navigate('/hr/notifications')}
            style={{ fontSize: '0.78rem', color: '#b5132a', fontWeight: '600', cursor: 'pointer' }}>
            View all →
          </span>
        </div>
        {latestNotifications.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No notifications yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {latestNotifications.map(n => (
              <div key={n.id} style={{
                background: n.is_read ? '#fff' : '#fff0f0',
                border: `1px solid ${n.is_read ? '#e2e8f0' : '#fecdd3'}`,
                borderRadius: '10px', padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '3px' }}>{n.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{n.message}</div>
                </div>
                {!n.is_read && (
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#b5132a', flexShrink: 0, marginTop: '4px' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={S.layout}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.sidebarHeader}>
          {sidebarOpen ? (
            <>
              <img src={logo} alt="Big Childcare" style={{ width: '48px', height: '44px', objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={S.logoText}>Big Academy</div>
                <div style={S.logoSub}>LMS Portal</div>
              </div>
            </>
          ) : null}
          <button style={S.toggleBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <div style={S.navSection}>
          {sidebarOpen && <div style={S.navSectionLabel}>Navigation</div>}
          {SIDEBAR_ITEMS.map(({ key, path, icon: Icon, label }) => (
            <div key={key} style={S.navItem(location.pathname.startsWith(path))} onClick={() => navigate(path)}>
              <Icon size={18} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span style={S.navText}>{label}</span>}
              {sidebarOpen && key === 'requests' && stats.pending_unlocks > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontWeight: '700', padding: '2px 6px', borderRadius: '10px', background: '#ef4444', color: '#fff', minWidth: '18px', textAlign: 'center' }}>
                  {stats.pending_unlocks}
                </span>
              )}
              {sidebarOpen && key === 'grading' && stats.pending_grading > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontWeight: '700', padding: '2px 6px', borderRadius: '10px', background: '#f59e0b', color: '#fff', minWidth: '18px', textAlign: 'center' }}>
                  {stats.pending_grading}
                </span>
              )}
            </div>
          ))}
        </div>

        <div style={S.sidebarFooter}>
          <div style={S.userRow}>
            <div style={S.avatar}>
              {user.first_name[0]}{user.last_name[0]}
            </div>
            {sidebarOpen && (
              <div style={{ overflow: 'hidden' }}>
                <div style={S.userName}>{user.first_name} {user.last_name}</div>
                <div style={S.userRole}>
                  {isExecutive ? 'HR Executive' : 'HR'}
                </div>
                {/* {isExecutive && <div style={S.executiveBadge}>EXECUTIVE</div>} */}
              </div>
            )}
          </div>
          <button style={S.logoutBtn} onClick={handleLogout}>
            <LogOut size={15} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={S.main}>
        <div style={S.topbar}>
          <div style={S.pageTitle}>
            {ActiveIcon && <ActiveIcon size={18} color="#b5132a" />}
            {activeItem?.label}
          </div>
          <NotificationBell />
          <span style={S.roleBadge}>
            {isExecutive ? 'HR Executive' : 'HR'}
          </span>
        </div>

        <div style={S.content}>
          {activeItem?.key === 'dashboard'       && <HomeDashboard />}
          {activeItem?.key === 'courses'         && <CoursesManager accentColor="#b5132a" />}
          {activeItem?.key === 'assignments'     && <AssignmentsManager accentColor="#b5132a" />}
          {activeItem?.key === 'users'           && <HRManageUsers isExecutive={isExecutive} />}
          {activeItem?.key === 'requests'        && <HRUnlockRequests />}
          {activeItem?.key === 'reports'         && <HRReports />}
          {activeItem?.key === 'grading'         && <QuizGrading accentColor="#b5132a" />}
          {activeItem?.key === 'notifications'   && <NotificationsPage />}
        </div>
      </div>
    </div>
  );
}