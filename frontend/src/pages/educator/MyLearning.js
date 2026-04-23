import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import CourseViewer from './CourseViewer';
import {
  BookOpen, Clock, Award, PlayCircle,
  FileText, PenLine, ChevronLeft, CheckCircle
} from 'lucide-react';

export default function BrowseCourses() {
  const [enrolments, setEnrolments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);  // course detail view
  const [active, setActive]         = useState(null);  // course viewer

  useEffect(() => { fetchEnrolments(); }, []);

  const fetchEnrolments = () => {
    API.get('/my-learning/')
      .then(res => setEnrolments(res.data.filter(e => e.status === 'not_started')))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
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
    lessonLeft:     { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#334155' },
    lessonDuration: { fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' },
    quizItem: {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 16px', borderRadius: '8px', marginBottom: '8px',
      background: '#fefce8', border: '1px solid #fde68a', fontSize: '0.875rem',
    },
    startBtn: {
      padding: '11px 32px', fontSize: '0.875rem', fontWeight: '600',
      borderRadius: '8px', cursor: 'pointer', border: 'none',
      background: '#0891b2', color: '#fff',
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      marginTop: '24px',
    },
    grid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
    },
    card: {
      background: '#fff', borderRadius: '12px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    },
    cardBody:    { padding: '20px', flex: 1 },
    assignedTag: {
      fontSize: '0.68rem', fontWeight: '700', padding: '3px 8px', borderRadius: '20px',
      background: '#fefce8', color: '#d97706', border: '1px solid #fde68a',
      display: 'inline-block', marginBottom: '10px',
    },
    cardTitle:  { fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' },
    cardDesc:   { fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, marginBottom: '12px' },
    cardMeta:   { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    cardFooter: { padding: '12px 20px', borderTop: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', gap: '8px' },
    viewBtn: {
      flex: 1, padding: '9px', fontSize: '0.85rem', fontWeight: '600',
      background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
      borderRadius: '8px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    },
    startCardBtn: {
      flex: 1, padding: '9px', fontSize: '0.85rem', fontWeight: '600',
      background: '#0891b2', color: '#fff', border: 'none',
      borderRadius: '8px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    },
    emptyState: { textAlign: 'center', padding: '48px 24px', color: '#94a3b8' },
  };

  // ── Course Viewer ─────────────────────────────────────────────
  if (active) {
    return (
      <CourseViewer
        enrolment={active}
        onBack={() => {
          setActive(null);
          setSelected(null);
          fetchEnrolments();
        }}
      />
    );
  }

  // ── Detail View ───────────────────────────────────────────────
  if (selected) {
    const course = selected.course;
    return (
      <div>
        <button style={S.backBtn} onClick={() => setSelected(null)}>
          <ChevronLeft size={16} /> Back to Assigned Courses
        </button>

        <div style={S.detailCard}>
          <div style={S.courseTitle}>{course.title}</div>
          <div style={S.courseDesc}>{course.description}</div>

          <div style={S.badgeRow}>
            <span style={S.badge('#f0fdf4', '#059669', '#bbf7d0')}>v{course.version}</span>
            {course.estimated_minutes && (
              <span style={S.badge('#f8fafc', '#64748b', '#e2e8f0')}>
                <Clock size={11} /> {course.estimated_minutes} mins
              </span>
            )}
            {course.expiry_months ? (
              <span style={S.badge('#fefce8', '#d97706', '#fde68a')}>
                <Award size={11} /> Valid for {course.expiry_months} months
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

          {course.modules?.length > 0 && (
            <>
              <div style={S.sectionTitle}>Course Content</div>
              {course.modules.map((mod, i) => (
                <div key={mod.id} style={S.moduleBlock}>
                  <div style={S.moduleTitle}>
                    <BookOpen size={14} color="#0891b2" />
                    Module {i + 1}: {mod.title}
                  </div>
                  {mod.lessons?.map(lesson => (
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
                  {mod.quizzes?.map(quiz => (
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
                </div>
              ))}
            </>
          )}

          <button style={S.startBtn} onClick={() => setActive(selected)}>
            <PlayCircle size={15} /> Start Course
          </button>
        </div>
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────
  if (loading) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading assigned courses...</p>;

  return (
    <div>
      {enrolments.length === 0 ? (
        <div style={S.emptyState}>
          <BookOpen size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '0.9rem', marginBottom: '6px' }}>No new courses assigned.</div>
          <div style={{ fontSize: '0.8rem' }}>Check My Learning to continue courses you've already started.</div>
        </div>
      ) : (
        <div style={S.grid}>
          {enrolments.map(enrolment => (
            <div style={S.card} key={enrolment.id}>
              <div style={S.cardBody}>
                <div style={S.assignedTag}>Assigned</div>
                <div style={S.cardTitle}>{enrolment.course.title}</div>
                <div style={S.cardDesc}>{enrolment.course.description}</div>
                <div style={S.cardMeta}>
                  <span style={S.badge('#f0fdf4', '#059669', '#bbf7d0')}>v{enrolment.course.version}</span>
                  {enrolment.course.estimated_minutes && (
                    <span style={S.badge('#f8fafc', '#64748b', '#e2e8f0')}>
                      <Clock size={11} /> {enrolment.course.estimated_minutes} mins
                    </span>
                  )}
                </div>
              </div>
              <div style={S.cardFooter}>
                <button style={S.viewBtn} onClick={() => setSelected(enrolment)}>
                  <BookOpen size={14} /> View Details
                </button>
                <button style={S.startCardBtn} onClick={() => setActive(enrolment)}>
                  <PlayCircle size={14} /> Start
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}