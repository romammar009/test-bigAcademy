import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import CourseViewer from './CourseViewer';
import { BookOpen, PlayCircle, FileText, Clock, CheckCircle } from 'lucide-react';

export default function MyLearning() {
  const [enrolments, setEnrolments]  = useState([]);
  const [progress, setProgress]      = useState({});
  const [loading, setLoading]        = useState(true);
  const [activeEnrolment, setActive] = useState(null);

  useEffect(() => { fetchEnrolments(); }, []);

  const fetchEnrolments = () => {
    API.get('/my-learning/')
      .then(res => {
        setEnrolments(res.data);
        res.data.forEach(enrolment => {
          if (enrolment.status === 'completed') {
            setProgress(prev => ({ ...prev, [enrolment.course.id]: 100 }));
          } else if (enrolment.status === 'not_started') {
            setProgress(prev => ({ ...prev, [enrolment.course.id]: 0 }));
          } else {
            API.get(`/courses/${enrolment.course.id}/progress/`)
              .then(r => setProgress(prev => ({
                ...prev,
                [enrolment.course.id]: r.data.percent
              })))
              .catch(() => {});
          }
        });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  if (activeEnrolment) {
    return (
      <CourseViewer
        enrolment={activeEnrolment}
        onBack={() => {
          setActive(null);
          fetchEnrolments();
        }}
      />
    );
  }

  if (loading) return <p style={{ color: '#64748b' }}>Loading...</p>;

  const S = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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
    cardBody: { padding: '20px', flex: 1 },
    cardTitle: {
      fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px',
    },
    cardDesc: {
      fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, marginBottom: '14px',
    },
    badgeRow: { display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' },
    badge: (bg, color) => ({
      fontSize: '0.72rem', fontWeight: '600', padding: '3px 10px',
      borderRadius: '20px', background: bg, color,
    }),
    progressWrap: { marginBottom: '12px' },
    progressBar: {
      height: '6px', background: '#e2e8f0', borderRadius: '10px',
      overflow: 'hidden', marginBottom: '4px',
    },
    progressFill: (pct) => ({
      height: '100%', width: `${pct}%`,
      background: pct === 100 ? '#10b981' : '#2563eb',
      borderRadius: '10px', transition: 'width 0.3s ease',
    }),
    progressText: {
      fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', textAlign: 'right',
    },
    dateRow: { display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '4px' },
    dateText: {
      fontSize: '0.75rem', color: '#94a3b8',
      display: 'flex', alignItems: 'center', gap: '5px',
    },
    cardFooter: {
      padding: '12px 20px', borderTop: '1px solid #f1f5f9', background: '#fafafa',
    },
    actionBtn: (isCompleted) => ({
      width: '100%', padding: '9px',
      background: isCompleted ? '#f0fdf4' : '#2563eb',
      color: isCompleted ? '#059669' : '#fff',
      border: isCompleted ? '1px solid #bbf7d0' : 'none',
      borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600',
      cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '7px', transition: 'opacity 0.15s',
    }),
    emptyState: { textAlign: 'center', padding: '48px 24px', color: '#94a3b8' },
  };

  const statusConfig = {
    completed:   { bg: '#f0fdf4', color: '#059669', label: 'Completed'   },
    in_progress: { bg: '#eff6ff', color: '#2563eb', label: 'In Progress' },
    not_started: { bg: '#f8fafc', color: '#64748b', label: 'Not Started' },
  };

  return (
    <div>
      {enrolments.length === 0 ? (
        <div style={S.emptyState}>
          <BookOpen size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '0.9rem' }}>No courses yet. Courses assigned to you will appear here.</div>
        </div>
      ) : (
        <div style={S.grid}>
          {enrolments.map(enrolment => {
            const pct         = progress[enrolment.course.id] ?? 0;
            const isCompleted = enrolment.status === 'completed';
            const sc          = statusConfig[enrolment.status] || statusConfig.not_started;

            return (
              <div style={S.card} key={enrolment.id}>
                <div style={S.cardBody}>
                  <div style={S.cardTitle}>{enrolment.course.title}</div>
                  <div style={S.cardDesc}>{enrolment.course.description}</div>

                  <div style={S.badgeRow}>
                    <span style={S.badge(sc.bg, sc.color)}>{sc.label}</span>
                    <span style={S.badge('#f8fafc', '#64748b')}>{enrolment.source}</span>
                  </div>

                  <div style={S.progressWrap}>
                    <div style={S.progressBar}>
                      <div style={S.progressFill(pct)} />
                    </div>
                    <div style={S.progressText}>{pct}%</div>
                  </div>

                  <div style={S.dateRow}>
                    {enrolment.started_at && (
                      <span style={S.dateText}>
                        <Clock size={11} />
                        Started: {new Date(enrolment.started_at).toLocaleDateString()}
                      </span>
                    )}
                    {enrolment.completed_at && (
                      <span style={S.dateText}>
                        <CheckCircle size={11} color="#10b981" />
                        Completed: {new Date(enrolment.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div style={S.cardFooter}>
                  <button style={S.actionBtn(isCompleted)} onClick={() => setActive(enrolment)}>
                    {isCompleted
                      ? <><FileText size={14} /> Review Course</>
                      : enrolment.status === 'not_started'
                        ? <><PlayCircle size={14} /> Start Course</>
                        : <><PlayCircle size={14} /> Continue Learning</>
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