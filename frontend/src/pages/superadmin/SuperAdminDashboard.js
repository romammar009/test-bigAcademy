import QuizGrading from '../shared/QuizGrading';
import CoursesManager from '../shared/CoursesManager';
import AssignmentsManager from '../shared/AssignmentsManager';
// import AdminQuizGrading from '../admin/AdminQuizGrading';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import SuperAdminStaff from './SuperAdminStaff';
import SuperAdminUnlockRequests from './SuperAdminUnlockRequests';
import SuperAdminReports from './SuperAdminReports';
import NotificationBell from '../../components/NotificationBell';
import logo from '../../BigChildcare-Logo.png';
import {
  LayoutDashboard, Users, Unlock, BarChart2,
  BookOpen, ClipboardList, GraduationCap,
  LogOut, ChevronLeft, ChevronRight,
  BookMarked, CheckCircle, Clock,
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { key: 'dashboard', path: '/area-manager/dashboard', icon: LayoutDashboard, label: 'Dashboard'       },
  { key: 'courses',   path: '/area-manager/courses',   icon: BookOpen,        label: 'Courses'         },
  { key: 'assignments', path: '/area-manager/assignments', icon: ClipboardList, label: 'Assignments'   },
  { key: 'grading',   path: '/area-manager/grading',   icon: GraduationCap,   label: 'Quiz Grading'   },
  { key: 'requests',  path: '/area-manager/requests',  icon: Unlock,          label: 'Unlock Requests' },
  { key: 'staff',     path: '/area-manager/staff',     icon: Users,           label: 'Staff'           },
  { key: 'reports',   path: '/area-manager/reports',   icon: BarChart2,       label: 'Reports'         },
];

export default function AreaManagerDashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ total_staff: 0, pending_grading: 0, pending_unlocks: 0, completed: 0 });
  const navigate = useNavigate();
  const location = useLocation();

  const activeItem = SIDEBAR_ITEMS.find(i => location.pathname.startsWith(i.path)) || SIDEBAR_ITEMS[0];

  useEffect(() => {
    if (location.pathname === '/area-manager' || location.pathname === '/area-manager/') {
      navigate('/area-manager/dashboard', { replace: true });
    }
  }, [location.pathname]);

  useEffect(() => {
    API.get('/users/').then(res => {
      setStats(prev => ({ ...prev, total_staff: res.data.filter(u => u.role === 'educator').length }));
    }).catch(() => {});
    API.get('/attempts/pending-grading/').then(res => {
      setStats(prev => ({ ...prev, pending_grading: res.data.length }));
    }).catch(() => {});
    API.get('/unlock-requests/').then(res => {
      setStats(prev => ({ ...prev, pending_unlocks: res.data.length }));
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await API.post('/auth/logout/'); } catch (err) {}
    logout();
    navigate('/login');
  };

  const S = {
    layout: {
      display: 'flex', minHeight: '100vh',
      fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
    },
    sidebar: {
      width: sidebarOpen ? '240px' : '68px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1d24a5 0%, #2563eb 100%)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s ease',
      overflow: 'hidden', flexShrink: 0,
      boxShadow: '3px 0 16px rgba(26,31,140,0.2)',
    },
    sidebarHeader: {
      padding: '0 12px', height: '64px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', gap: '8px',
      justifyContent: sidebarOpen ? 'flex-start' : 'center',
    },
    logoText: { color: '#fff', fontWeight: '700', fontSize: '0.95rem', whiteSpace: 'nowrap', lineHeight: 1.2 },
    logoSub:  { color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' },
    toggleBtn: {
      background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
      cursor: 'pointer', padding: '4px', marginLeft: 'auto', flexShrink: 0,
      display: 'flex', alignItems: 'center',minWidth: '24px',
    },
    navSection: { padding: '20px 0 8px', flex: 1 },
    navSectionLabel: {
      padding: '0 18px 8px', color: 'rgba(255,255,255,0.35)',
      fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    },
    navItem: (isActive) => ({
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 18px', cursor: 'pointer',
      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
      background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
      borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
      transition: 'all 0.15s ease', whiteSpace: 'nowrap', overflow: 'hidden', userSelect: 'none',
    }),
    navText: { fontSize: '0.875rem', fontWeight: '500' },
    sidebarFooter: { padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' },
    userRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', overflow: 'hidden' },
    avatar: {
      width: '34px', height: '34px', borderRadius: '50%',
      background: 'rgba(255,255,255,0.2)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: '700', fontSize: '0.8rem',
      flexShrink: 0, border: '2px solid rgba(255,255,255,0.25)',
    },
    userName: { color: '#fff', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    userRole: { color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' },
    logoutBtn: {
      width: '100%', padding: '8px 12px',
      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '7px', color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
      whiteSpace: 'nowrap', overflow: 'hidden',
    },
    main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#eff6ff' },
    topbar: {
      height: '64px', background: '#fff', borderBottom: '1px solid #bfdbfe',
      display: 'flex', alignItems: 'center', padding: '0 28px', gap: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    pageTitle: {
      fontWeight: '700', fontSize: '1rem', color: '#1e293b',
      flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
    },
    roleBadge: {
      fontSize: '0.8rem', color: '#2563eb', fontWeight: '600',
      background: '#eff6ff', padding: '4px 12px',
      borderRadius: '20px', border: '1px solid #bfdbfe',
    },
    content: { flex: 1, padding: '28px', overflowY: 'auto' },
    greetingTitle:    { fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' },
    greetingSubtitle: { fontSize: '0.875rem', color: '#64748b', marginBottom: '24px' },
    statsGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px', marginBottom: '32px',
    },
    statCard: (accent) => ({
      background: '#fff', borderRadius: '12px', padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `3px solid ${accent}`,
    }),
    statIconBox: (bg) => ({
      width: '36px', height: '36px', borderRadius: '8px', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
    }),
    statNumber: { fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: 1, marginBottom: '6px' },
    statLabel:  { fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' },
    sectionLabel: { fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' },
    quickLinksGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' },
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
      <div style={S.greetingSubtitle}>Area Manager — Manage courses and track staff progress</div>

      <div style={S.statsGrid}>
        {[
          { label: 'Total Staff',      value: stats.total_staff,     Icon: Users,        accent: '#2563eb', iconColor: '#2563eb', iconBg: '#eff6ff' },
          { label: 'Pending Grading',  value: stats.pending_grading, Icon: GraduationCap,accent: '#f59e0b', iconColor: '#f59e0b', iconBg: '#fefce8' },
          { label: 'Unlock Requests',  value: stats.pending_unlocks, Icon: Unlock,       accent: '#ef4444', iconColor: '#ef4444', iconBg: '#fef2f2' },
          { label: 'Courses',          value: 0,                     Icon: BookMarked,   accent: '#10b981', iconColor: '#10b981', iconBg: '#f0fdf4' },
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
          { Icon: BookOpen,      bg: '#eff6ff', color: '#2563eb', label: 'Courses',         sub: 'Create & manage courses',      path: '/area-manager/courses'     },
          { Icon: ClipboardList, bg: '#f0fdf4', color: '#059669', label: 'Assignments',      sub: 'Assign courses to staff',      path: '/area-manager/assignments' },
          { Icon: GraduationCap, bg: '#fefce8', color: '#d97706', label: 'Quiz Grading',     sub: 'Grade short answer responses', path: '/area-manager/grading'     },
          { Icon: Unlock,        bg: '#fef2f2', color: '#ef4444', label: 'Unlock Requests',  sub: 'Review quiz unlock requests',  path: '/area-manager/requests'    },
          { Icon: Users,         bg: '#f5f3ff', color: '#7c3aed', label: 'Staff',            sub: 'View staff at your locations', path: '/area-manager/staff'       },
          { Icon: BarChart2,     bg: '#ecfeff', color: '#0891b2', label: 'Reports',          sub: 'Track completion & progress',  path: '/area-manager/reports'     },
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
            </div>
          ))}
        </div>

        <div style={S.sidebarFooter}>
          <div style={S.userRow}>
            <div style={S.avatar}>{user.first_name[0]}{user.last_name[0]}</div>
            {sidebarOpen && (
              <div style={{ overflow: 'hidden' }}>
                <div style={S.userName}>{user.first_name} {user.last_name}</div>
                <div style={S.userRole}>Area Manager</div>
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
            {ActiveIcon && <ActiveIcon size={18} color="#2563eb" />}
            {activeItem?.label}
          </div>
          <NotificationBell />
          <span style={S.roleBadge}>Area Manager</span>
        </div>

        <div style={S.content}>
          {activeItem?.key === 'dashboard'   && <HomeDashboard />}
          {activeItem?.key === 'courses'     && <CoursesManager accentColor="#2563eb" />}
          {activeItem?.key === 'assignments' && <AssignmentsManager accentColor="#2563eb" />}
          {activeItem?.key === 'grading' && <QuizGrading accentColor="#2563eb" />}
          {activeItem?.key === 'requests'    && <SuperAdminUnlockRequests />}
          {activeItem?.key === 'staff'       && <SuperAdminStaff />}
          {activeItem?.key === 'reports'     && <SuperAdminReports />}
        </div>
      </div>
    </div>
  );
}