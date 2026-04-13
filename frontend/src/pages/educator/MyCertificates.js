import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { Award, Download, Loader, CalendarDays, Hash } from 'lucide-react';

export default function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [generating, setGenerating]     = useState(null);

  useEffect(() => {
    API.get('/certificates/')
      .then(res => setCertificates(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (courseId, courseTitle) => {
    setGenerating(courseId);
    try {
      const res = await API.post(
        `/courses/${courseId}/certificate/generate/`,
        {},
        { responseType: 'blob' }
      );
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `certificate_${courseTitle}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not generate certificate.');
    } finally {
      setGenerating(null);
    }
  };

  const S = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
    },
    card: {
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    cardTop: {
      padding: '20px 20px 0',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
    },
    iconBox: {
      width: '44px',
      height: '44px',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    cardBody: {
      padding: '14px 20px 20px',
      flex: 1,
    },
    courseTitle: {
      fontSize: '0.95rem',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '12px',
    },
    metaRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '5px',
      fontSize: '0.78rem',
      color: '#64748b',
    },
    metaLabel: {
      fontWeight: '600',
      color: '#94a3b8',
    },
    idText: {
      fontSize: '0.68rem',
      color: '#cbd5e1',
      marginTop: '10px',
      wordBreak: 'break-all',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '5px',
    },
    expiredBadge: {
      display: 'inline-block',
      fontSize: '0.7rem',
      fontWeight: '600',
      padding: '2px 8px',
      borderRadius: '20px',
      background: '#fef2f2',
      color: '#ef4444',
      marginTop: '6px',
    },
    validBadge: {
      display: 'inline-block',
      fontSize: '0.7rem',
      fontWeight: '600',
      padding: '2px 8px',
      borderRadius: '20px',
      background: '#f0fdf4',
      color: '#10b981',
      marginTop: '6px',
    },
    cardFooter: {
      padding: '12px 20px',
      borderTop: '1px solid #f1f5f9',
      background: '#fafafa',
    },
    downloadBtn: (isLoading) => ({
      width: '100%',
      padding: '9px',
      background: isLoading ? '#f1f5f9' : '#4f46e5',
      color: isLoading ? '#94a3b8' : '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.85rem',
      fontWeight: '600',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '7px',
      transition: 'opacity 0.15s',
    }),
    emptyState: {
      textAlign: 'center',
      padding: '48px 24px',
      color: '#94a3b8',
    },
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
      <Loader size={16} />
      <span style={{ fontSize: '0.85rem' }}>Loading certificates...</span>
    </div>
  );

  const isExpired = (expiresAt) => expiresAt && new Date(expiresAt) < new Date();

  return (
    <div>
      {certificates.length === 0 ? (
        <div style={S.emptyState}>
          <Award size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '0.9rem' }}>
            No certificates yet. Complete a course to earn one.
          </div>
        </div>
      ) : (
        <div style={S.grid}>
          {certificates.map(cert => {
            const expired   = isExpired(cert.expires_at);
            const isLoading = generating === cert.course_id;

            return (
              <div style={S.card} key={cert.id}>
                <div style={S.cardTop}>
                  <div style={S.iconBox}>
                    <Award size={20} color="#fff" />
                  </div>
                  <div style={{ paddingTop: '4px' }}>
                    <div style={S.courseTitle}>{cert.course_title}</div>
                  </div>
                </div>

                <div style={S.cardBody}>
                  <div style={S.metaRow}>
                    <span style={S.metaLabel}>Issued to:</span>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{cert.user_name}</span>
                  </div>
                  <div style={S.metaRow}>
                    <span style={S.metaLabel}>Version:</span>
                    <span>{cert.course_version}</span>
                  </div>
                  <div style={S.metaRow}>
                    <CalendarDays size={12} color="#94a3b8" />
                    <span style={S.metaLabel}>Issued:</span>
                    <span>{new Date(cert.issued_at).toLocaleDateString()}</span>
                  </div>
                  {cert.expires_at && (
                    <div style={S.metaRow}>
                      <CalendarDays size={12} color={expired ? '#ef4444' : '#10b981'} />
                      <span style={S.metaLabel}>Expires:</span>
                      <span style={{ color: expired ? '#ef4444' : '#10b981' }}>
                        {new Date(cert.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {cert.expires_at && (
                    <span style={expired ? S.expiredBadge : S.validBadge}>
                      {expired ? 'Expired' : 'Valid'}
                    </span>
                  )}
                  <div style={S.idText}>
                    <Hash size={10} style={{ flexShrink: 0, marginTop: '1px' }} />
                    {cert.certificate_id}
                  </div>
                </div>

                <div style={S.cardFooter}>
                  <button
                    style={S.downloadBtn(isLoading)}
                    onClick={() => handleDownload(cert.course_id, cert.course_title)}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <><Loader size={14} /> Generating...</>
                      : <><Download size={14} /> Download PDF</>
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}