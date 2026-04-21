import logo from '../../BigChildcare-Logo.png';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import BrowseCourses from './AssignedCourses';
import MyLearning from './MyLearning';
import MyCertificates from './MyCertificates';
import API from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../../components/NotificationBell';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Award,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  PlayCircle,
  CheckCircle,
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { key: 'home',         icon: LayoutDashboard, label: 'Dashboard'       },
  { key: 'browse',       icon: BookOpen,        label: 'Assigned Courses' },
  { key: 'learning',     icon: GraduationCap,   label: 'My Learning'     },
  { key: 'certificates', icon: Award,           label: 'Certificates'    },
];

export default function EducatorDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab]     = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats]             = useState({
    total: 0, active: 0, completed: 0, certificates: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/my-learning/').then(res => {
      const enrolments = res.data;
      setStats(prev => ({
        ...prev,
        total:     enrolments.length,
        active:    enrolments.filter(e => e.status === 'in_progress').length,
        completed: enrolments.filter(e => e.status === 'completed').length,
      }));
    }).catch(() => {});
    API.get('/certificates/').then(res => {
      setStats(prev => ({ ...prev, certificates: res.data.length }));
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
      minHeight: '100vh',
      fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
    },
    sidebar: {
      width: sidebarOpen ? '240px' : '68px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #29abe2 0%, #0891b2 100%)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: '3px 0 16px rgba(10,13,74,0.18)',
    },
    sidebarHeader: {
      padding: '0 12px',
      height: '64px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      justifyContent: sidebarOpen ? 'flex-start' : 'center',
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
      overflow: 'hidden',
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
    navSection: {
      padding: '20px 0 8px',
      flex: 1,
    },
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
    navText: {
      fontSize: '0.875rem',
      fontWeight: '500',
    },
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
    userRole: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '0.72rem',
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
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      background: '#ecfeff',
    },
    topbar: {
      height: '64px',
      background: '#fff',
      borderBottom: '1px solid #a5f3fc',
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
    locationBadge: {
      fontSize: '0.8rem',
      color: '#0891b2',
      fontWeight: '600',
      background: '#ecfeff',
      padding: '4px 12px',
      borderRadius: '20px',
      border: '1px solid #a5f3fc',
    },
    content: {
      flex: 1,
      padding: '28px',
      overflowY: 'auto',
      background: '#ecfeff',
    },
    greetingTitle: {
      fontSize: '1.4rem',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '4px',
    },
    greetingSubtitle: {
      fontSize: '0.875rem',
      color: '#64748b',
      marginBottom: '24px',
    },
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
    statNumber: {
      fontSize: '2rem',
      fontWeight: '800',
      color: '#0f172a',
      lineHeight: 1,
      marginBottom: '6px',
    },
    statLabel: {
      fontSize: '0.72rem',
      color: '#94a3b8',
      fontWeight: '600',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    sectionLabel: {
      fontSize: '0.75rem',
      fontWeight: '700',
      color: '#94a3b8',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      marginBottom: '12px',
    },
    quickLinksGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '12px',
    },
    quickLink: {
      background: '#fff',
      borderRadius: '10px',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      cursor: 'pointer',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      border: '1px solid #e2e8f0',
      transition: 'box-shadow 0.15s',
    },
    quickLinkIconBox: (bg) => ({
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }),
    quickLinkTitle: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '2px',
    },
    quickLinkSub: {
      fontSize: '0.75rem',
      color: '#94a3b8',
    },
  };

  const activeItem = SIDEBAR_ITEMS.find(i => i.key === activeTab);
  const ActiveIcon = activeItem?.icon;

  const HomeDashboard = () => (
    <div>
      <div style={S.greetingTitle}>Welcome back, {user.first_name}! 👋</div>
      <div style={S.greetingSubtitle}>Here's your learning overview</div>

      <div style={S.statsGrid}>
        {[
          { label: 'Total Enrolled', value: stats.total,        Icon: BookMarked,  accent: '#2563eb', iconColor: '#2563eb', iconBg: '#eff6ff' },
          { label: 'Active',         value: stats.active,       Icon: PlayCircle,  accent: '#f59e0b', iconColor: '#f59e0b', iconBg: '#fefce8' },
          { label: 'Completed',      value: stats.completed,    Icon: CheckCircle, accent: '#10b981', iconColor: '#10b981', iconBg: '#f0fdf4' },
          { label: 'Certificates',   value: stats.certificates, Icon: Award,       accent: '#8b5cf6', iconColor: '#8b5cf6', iconBg: '#f5f3ff' },
        ].map(stat => (
          <div key={stat.label} style={S.statCard(stat.accent)}>
            <div style={{ ...S.quickLinkIconBox(stat.iconBg), marginBottom: '12px' }}>
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
          { Icon: BookOpen,      bg: '#eff6ff', color: '#2563eb', label: 'Assigned Courses', sub: 'View & enrol in courses',     tab: 'browse'       },
          { Icon: GraduationCap, bg: '#fefce8', color: '#d97706', label: 'My Learning',       sub: 'Continue where you left off', tab: 'learning'     },
          { Icon: Award,         bg: '#f5f3ff', color: '#7c3aed', label: 'Certificates',      sub: 'Download your certificates',  tab: 'certificates' },
        ].map(link => (
          <div key={link.tab} style={S.quickLink} onClick={() => setActiveTab(link.tab)}>
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
          {SIDEBAR_ITEMS.map(({ key, icon: Icon, label }) => (
            <div
              key={key}
              style={S.navItem(activeTab === key)}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span style={S.navText}>{label}</span>}
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
                <div style={S.userRole}>Educator</div>
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
            {ActiveIcon && <ActiveIcon size={18} color="#0891b2" />}
            {activeItem?.label}
          </div>
          <NotificationBell />
          {user.location && (
            <span style={S.locationBadge}>{user.location}</span>
          )}
        </div>

        <div style={S.content}>
          {activeTab === 'home'         && <HomeDashboard />}
          {activeTab === 'browse'       && <BrowseCourses />}
          {activeTab === 'learning'     && <MyLearning />}
          {activeTab === 'certificates' && <MyCertificates />}
        </div>
      </div>
    </div>
  );
}