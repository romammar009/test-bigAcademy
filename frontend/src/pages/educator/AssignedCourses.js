import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import {
  BookOpen, ChevronLeft, Clock, Award,
  PlayCircle, FileText, PenLine, CheckCircle
} from 'lucide-react';

export default function BrowseCourses() {
  const [courses, setCourses]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage]     = useState({ text: '', type: '' });

  useEffect(() => {
    API.get('/my-learning/')
      .then(res => setCourses(res.data.filter(e => e.status === 'not_started')))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleEnrol = async (courseId) => {
    setEnrolling(true);
    try {
      await API.patch(`/enrolments/${courseId}/start/`);
      setCourses(courses.filter(c => c.course.id !== courseId));
      setSelected(null);
      setMessage({ text: 'Successfully enrolled! Check My Learning tab.', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Enrolment failed.', type: 'error' });
    } finally {
      setEnrolling(false);
    }
  };

  const contentIcon = (type) => {
    if (type === 'video')   return <PlayCircle size={13} color="#2563eb" />;
    if (type === 'pdf')     return <FileText size={13} color="#7c3aed" />;
    if (type === 'article') return <BookOpen size={13} color="#059669" />;
    return <PenLine size={13} color="#d97706" />;
  };

  const S = {
    backBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: 'none', border: 'none', color: '#0891b2',
      fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
      padding: '0', marginBottom: '20px',
    },
    // Detail view
    detailCard: {
      background: '#fff', borderRadius: '12px', padding: '28px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
    },
    courseTitle: { fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' },
    courseDesc:  { fontSize: '0.875rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.6 },
    badgeRow:    { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
    badge: (bg, color, border) => ({
      fontSize: '0.72rem', fontWeight: '700', padding: '4px 10px', borderRadius: '20px',
      background: bg, color, border: `1px solid ${border}`,
      display: 'inline-flex', alignItems: 'center', gap: '5px',
    }),
    certNotice: {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 16px', borderRadius: '8px', marginBottom: '24px',
      background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0',
      fontSize: '0.875rem', fontWeight: '500',
    },
    sectionTitle: { fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', marginBottom: '14px', marginTop: '24px' },
    moduleBlock:  { marginBottom: '20px' },
    moduleTitle:  { fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' },
    lessonItem: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: '8px', marginBottom: '4px',
      background: '#f8fafc', border: '1px solid #f1f5f9',
    },
    lessonLeft:    { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#334155' },
    lessonDuration:{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' },
    quizItem: {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 16px', borderRadius: '8px', marginBottom: '8px',
      background: '#fefce8', border: '1px solid #fde68a',
      fontSize: '0.875rem',
    },
    message: (type) => ({
      padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
      fontSize: '0.85rem', fontWeight: '500',
      background: type === 'success' ? '#f0fdf4' : '#fef2f2',
      color:      type === 'success' ? '#059669' : '#ef4444',
      border:     `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
    }),
    enrolBtn: (loading) => ({
      padding: '11px 32px', fontSize: '0.875rem', fontWeight: '600',
      borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
      border: 'none', background: loading ? '#f1f5f9' : '#0891b2',
      color: loading ? '#94a3b8' : '#fff',
      display: 'inline-flex', alignItems: 'center', gap: '8px',
    }),
    // List view
    grid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
    },
    card: {
      background: '#fff', borderRadius: '12px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    },
    cardBody:   { padding: '20px', flex: 1 },
    assignedTag: {
      fontSize: '0.68rem', fontWeight: '700', padding: '3px 8px', borderRadius: '20px',
      background: '#fefce8', color: '#d97706', border: '1px solid #fde68a',
      display: 'inline-block', marginBottom: '10px',
    },
    cardTitle:  { fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' },
    cardDesc:   { fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, marginBottom: '12px' },
    cardMeta:   { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    cardFooter: { padding: '12px 20px', borderTop: '1px solid #f1f5f9', background: '#fafafa' },
    viewBtn: {
      width: '100%', padding: '9px', fontSize: '0.85rem', fontWeight: '600',
      background: '#ecfeff', color: '#0891b2', border: '1px solid #a5f3fc',
      borderRadius: '8px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    },
    emptyState: { textAlign: 'center', padding: '48px 24px', color: '#94a3b8' },
  };

  if (loading) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading assigned courses...</p>;

  // ── Detail View ──────────────────────────────────────────────────
  if (selected) {
    return (
      <div>
        <button style={S.backBtn} onClick={() => setSelected(null)}>
          <ChevronLeft size={16} /> Back to Assigned Courses
        </button>

        <div style={S.detailCard}>
          <div style={S.courseTitle}>{selected.title}</div>
          <div style={S.courseDesc}>{selected.description}</div>

          <div style={S.badgeRow}>
            <span style={S.badge('#f0fdf4', '#059669', '#bbf7d0')}>
              v{selected.version}
            </span>
            {selected.estimated_minutes && (
              <span style={S.badge('#f8fafc', '#64748b', '#e2e8f0')}>
                <Clock size={11} /> {selected.estimated_minutes} mins
              </span>
            )}
            {selected.expiry_months ? (
              <span style={S.badge('#fefce8', '#d97706', '#fde68a')}>
                <Award size={11} /> Valid for {selected.expiry_months} months
              </span>
            ) : (
              <span style={S.badge('#eff6ff', '#2563eb', '#bfdbfe')}>
                <Award size={11} /> No Expiry
              </span>
            )}
          </div>

          <div style={S.certNotice}>
            <Award size={16} />
            You will receive a certificate upon completing this course.
          </div>

          {selected.modules?.length > 0 && (
            <>
              <div style={S.sectionTitle}>Course Content</div>
              {selected.modules.map((mod, i) => (
                <div key={mod.id} style={S.moduleBlock}>
                  <div style={S.moduleTitle}>
                    <BookOpen size={14} color="#0891b2" />
                    Module {i + 1}: {mod.title}
                  </div>
                  {mod.lessons.map(lesson => (
                    <div key={lesson.id} style={S.lessonItem}>
                      <div style={S.lessonLeft}>
                        {contentIcon(lesson.content_type)}
                        {lesson.title}
                      </div>
                      {lesson.duration_seconds && (
                        <span style={S.lessonDuration}>
                          <Clock size={11} />
                          {Math.round(lesson.duration_seconds / 60)} mins
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {selected.quizzes?.length > 0 && (
            <>
              <div style={S.sectionTitle}>Assessments</div>
              {selected.quizzes.map(quiz => (
                <div key={quiz.id} style={S.quizItem}>
                  <PenLine size={15} color="#d97706" />
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.875rem' }}>{quiz.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Pass mark: {quiz.pass_mark_percent}% · {quiz.attempt_limit} attempts allowed
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          <div style={{ marginTop: '24px' }}>
            {message.text && <div style={S.message(message.type)}>{message.text}</div>}
            <button style={S.enrolBtn(enrolling)} onClick={() => handleEnrol(selected.id)} disabled={enrolling}>
              <CheckCircle size={15} />
              {enrolling ? 'Enrolling...' : 'Enrol in this Course'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List View ────────────────────────────────────────────────────
  return (
    <div>
      {message.text && <div style={S.message(message.type)}>{message.text}</div>}

      {courses.length === 0 ? (
        <div style={S.emptyState}>
          <BookOpen size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '0.9rem' }}>No assigned courses pending enrolment.</div>
        </div>
      ) : (
        <div style={S.grid}>
          {courses.map(course => (
            <div style={S.card} key={course.id}>
              <div style={S.cardBody}>
                <div style={S.assignedTag}>Assigned</div>
                <div style={S.cardTitle}>{course.title}</div>
                <div style={S.cardDesc}>{course.description}</div>
                <div style={S.cardMeta}>
                  <span style={S.badge('#f0fdf4', '#059669', '#bbf7d0')}>v{course.version}</span>
                  {course.estimated_minutes && (
                    <span style={S.badge('#f8fafc', '#64748b', '#e2e8f0')}>
                      <Clock size={11} /> {course.estimated_minutes} mins
                    </span>
                  )}
                </div>
              </div>
              <div style={S.cardFooter}>
                <button style={S.viewBtn} onClick={() => setSelected(course)}>
                  <BookOpen size={14} /> View Course
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}