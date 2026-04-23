import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './BigChildcare-Logo.png';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={S.page}>
      {/* ── TOP NAV BAR ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <img src={Logo} alt="Big Childcare" style={S.navLogo} />
          <button
            style={S.loginBtn}
            onClick={() => navigate('/bigacademy-login2026')}
            onMouseEnter={e => { e.target.style.background = '#fff'; e.target.style.color = '#1b1464'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
          >
            Member Login
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section style={S.hero}>
        <div style={S.heroOverlay} />
        <div style={S.heroContent}>
          <div style={S.academyBadge}>
            <span role="img" aria-label="graduation">🎓</span>
            <span style={S.badgeLabel}>BIG ACADEMY</span>
          </div>
          <h1 style={S.heroTitle}>Welcome to Big Academy</h1>
          <p style={S.heroSubtitle}>
            The dedicated learning platform for Big Childcare educators and staff.
            Access training modules, complete assessments, and earn your professional certifications.
          </p>
          <button
            style={S.heroBtn}
            onClick={() => navigate('/bigacademy-login2026')}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px rgba(220,38,38,0.4)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(220,38,38,0.3)'; }}
          >
            Access Academy Portal →
          </button>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section style={S.features}>
        <div style={S.featuresInner}>
          <div style={S.featureCard}>
            <div style={S.featureIcon}>📚</div>
            <h3 style={S.featureTitle}>Training Modules</h3>
            <p style={S.featureText}>
              Structured learning modules with video tutorials covering child safety,
              supervision, hygiene, emergency response and more.
            </p>
          </div>
          <div style={S.featureCard}>
            <div style={S.featureIcon}>📝</div>
            <h3 style={S.featureTitle}>Assessments</h3>
            <p style={S.featureText}>
              Step-by-step assessments that ensure thorough understanding.
              Watch the video, answer questions, and progress at your own pace.
            </p>
          </div>
          <div style={S.featureCard}>
            <div style={S.featureIcon}>🏅</div>
            <h3 style={S.featureTitle}>Certifications</h3>
            <p style={S.featureText}>
              Earn downloadable certificates upon completion.
              Track your professional development and stay compliant.
            </p>
          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section style={S.about}>
        <div style={S.aboutInner}>
          <h2 style={S.aboutTitle}>Why Big Academy?</h2>
          <p style={S.aboutText}>
            At Big Childcare, we are committed to providing the highest quality care for children
            across Australia. Big Academy ensures our educators are equipped with the knowledge,
            skills and confidence to maintain our industry-leading standards.
          </p>
          <div style={S.aboutStats}>
            <div style={S.statItem}>
              <div style={S.statNumber}>200+</div>
              <div style={S.statLabel}>Educators</div>
            </div>
            <div style={S.statDivider} />
            <div style={S.statItem}>
              <div style={S.statNumber}>50+</div>
              <div style={S.statLabel}>Centres Nationwide</div>
            </div>
            <div style={S.statDivider} />
            <div style={S.statItem}>
              <div style={S.statNumber}>100%</div>
              <div style={S.statLabel}>Compliance Focused</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerLeft}>
            <img src={Logo} alt="Big Childcare" style={S.footerLogo} />
            <p style={S.footerTagline}>We're Big On Fun!</p>
          </div>
          <div style={S.footerRight}>
            <p style={S.footerText}>
              &copy; {new Date().getFullYear()} Big Childcare Pty Ltd. All rights reserved.
            </p>
            <p style={S.footerLinks}>
              <a href="https://bigchildcare.com" target="_blank" rel="noopener noreferrer" style={S.footerLink}>
                bigchildcare.com
              </a>
              <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 10px' }}>|</span>
              <span style={S.footerLink}>Members Only Access</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════ STYLES ═══════════════════════════════════ */
const NAVY = '#1b1464';
const RED = '#e5231b';
const LIGHT_BG = '#f8f9fa';

const S = {
  page: {
    minHeight: '100vh',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    color: '#1a1a1a',
    overflowX: 'hidden',
  },

  /* ── NAV ── */
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: NAVY,
    padding: '0 24px',
    boxShadow: '0 2px 20px rgba(0,0,0,0.15)',
  },
  navInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '70px',
  },
  navLogo: {
    height: '45px',
    objectFit: 'contain',
  },
  loginBtn: {
    padding: '10px 28px',
    background: 'transparent',
    color: '#fff',
    border: '2px solid #fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease',
  },

  /* ── HERO ── */
  hero: {
    position: 'relative',
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${NAVY} 0%, #2d2076 40%, #1e3a8a 100%)`,
    paddingTop: '70px',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 20% 50%, rgba(229,35,27,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(59,130,246,0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    maxWidth: '700px',
    padding: '40px 24px',
  },
  academyBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    padding: '10px 24px',
    borderRadius: '50px',
    marginBottom: '32px',
    backdropFilter: 'blur(10px)',
  },
  badgeLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '3px',
  },
  heroTitle: {
    fontSize: '52px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0 0 20px 0',
    lineHeight: '1.15',
    letterSpacing: '-1px',
  },
  heroSubtitle: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: '1.7',
    margin: '0 auto 40px auto',
    maxWidth: '560px',
  },
  heroBtn: {
    padding: '18px 48px',
    background: RED,
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.3px',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 15px rgba(220,38,38,0.3)',
  },

  /* ── FEATURES ── */
  features: {
    padding: '80px 24px',
    background: '#ffffff',
  },
  featuresInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    gap: '32px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featureCard: {
    flex: '1 1 280px',
    maxWidth: '340px',
    background: LIGHT_BG,
    borderRadius: '20px',
    padding: '40px 32px',
    textAlign: 'center',
    border: '1px solid #e5e7eb',
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: NAVY,
    margin: '0 0 12px 0',
  },
  featureText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.7',
    margin: 0,
  },

  /* ── ABOUT ── */
  about: {
    padding: '80px 24px',
    background: LIGHT_BG,
  },
  aboutInner: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center',
  },
  aboutTitle: {
    fontSize: '36px',
    fontWeight: '800',
    color: NAVY,
    margin: '0 0 20px 0',
  },
  aboutText: {
    fontSize: '16px',
    color: '#6b7280',
    lineHeight: '1.8',
    margin: '0 0 48px 0',
  },
  aboutStats: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '40px',
    flexWrap: 'wrap',
  },
  statItem: {
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '42px',
    fontWeight: '800',
    color: RED,
    lineHeight: '1',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: '0.5px',
  },
  statDivider: {
    width: '1px',
    height: '50px',
    background: '#d1d5db',
  },

  /* ── FOOTER ── */
  footer: {
    background: NAVY,
    padding: '40px 24px',
  },
  footerInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '20px',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  footerLogo: {
    height: '35px',
    objectFit: 'contain',
  },
  footerTagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    fontWeight: '600',
    fontStyle: 'italic',
    margin: 0,
  },
  footerRight: {
    textAlign: 'right',
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '13px',
    margin: '0 0 4px 0',
  },
  footerLinks: {
    margin: 0,
  },
  footerLink: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '13px',
    textDecoration: 'none',
  },
};
