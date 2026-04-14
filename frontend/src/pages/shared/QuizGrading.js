import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { GraduationCap, ChevronLeft, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function QuizGrading({ accentColor = '#1a1f8c' }) {
  const [attempts, setAttempts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [grades, setGrades]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage]       = useState({ text: '', type: '' });

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = () => {
    API.get('/attempts/pending-grading/')
      .then(res => setAttempts(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleGradeChange = (answerId, isCorrect) => {
    setGrades(prev => ({ ...prev, [answerId]: isCorrect }));
  };

  const allGraded = () => selected && selected.short_answers.every(sa => grades[sa.answer_id] !== undefined);

  const handleSubmitGrades = async () => {
    if (!allGraded()) {
      setMessage({ text: 'Please grade all short answers before submitting.', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const gradesPayload = Object.entries(grades).map(([answerId, isCorrect]) => ({
        answer_id:  parseInt(answerId),
        is_correct: isCorrect,
      }));
      await API.patch(`/attempts/${selected.attempt_id}/grade/`, { grades: gradesPayload });
      setMessage({ text: `Grading submitted for ${selected.user_name}.`, type: 'success' });
      setSelected(null);
      setGrades({});
      fetchPending();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Could not submit grades.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const S = {
    backBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: 'none', border: 'none', color: accentColor,
      fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
      padding: '0', marginBottom: '20px',
    },
    title: { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' },
    pendingBadge: {
      fontSize: '0.72rem', fontWeight: '700', padding: '3px 9px', borderRadius: '20px',
      background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
    },
    message: (type) => ({
      padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
      fontSize: '0.85rem', fontWeight: '500',
      background: type === 'success' ? '#f0fdf4' : '#fef2f2',
      color:      type === 'success' ? '#059669' : '#ef4444',
      border:     `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
    }),
    // Grading view
    gradingCard: {
      background: '#fff', borderRadius: '12px', padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
    },
    gradingTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' },
    metaRow: { display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
    metaItem: { fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' },
    metaLabel: { fontWeight: '600', color: '#94a3b8' },
    divider: { height: '1px', background: '#f1f5f9', margin: '20px 0' },
    sectionTitle: { fontSize: '0.875rem', fontWeight: '700', color: '#0f172a', marginBottom: '16px' },
    answerCard: {
      background: '#f8fafc', borderRadius: '10px', padding: '16px',
      marginBottom: '14px', border: '1px solid #e2e8f0',
    },
    questionText: { fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '10px' },
    answerBox: {
      background: '#fff', borderRadius: '8px', padding: '12px 14px',
      marginBottom: '14px', border: '1px solid #e2e8f0',
      fontSize: '0.875rem', color: '#334155', lineHeight: 1.6,
      whiteSpace: 'pre-wrap',
    },
    gradeRow: { display: 'flex', gap: '10px' },
    gradeBtn: (isSelected, type) => ({
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '7px 16px', fontSize: '0.82rem', fontWeight: '600',
      borderRadius: '7px', cursor: 'pointer', transition: 'all 0.15s',
      border: `1px solid ${type === 'correct'
        ? (isSelected ? '#10b981' : '#bbf7d0')
        : (isSelected ? '#ef4444' : '#fecaca')}`,
      background: type === 'correct'
        ? (isSelected ? '#10b981' : '#f0fdf4')
        : (isSelected ? '#ef4444' : '#fef2f2'),
      color: type === 'correct'
        ? (isSelected ? '#fff' : '#059669')
        : (isSelected ? '#fff' : '#ef4444'),
    }),
    submitBtn: (disabled) => ({
      padding: '10px 32px', fontSize: '0.875rem', fontWeight: '600',
      borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
      border: 'none', marginTop: '20px',
      background: disabled ? '#f1f5f9' : accentColor,
      color: disabled ? '#94a3b8' : '#fff',
    }),
    // List view
    table:  { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    th:     { padding: '12px 16px', fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' },
    td:     { padding: '13px 16px', fontSize: '0.875rem', color: '#334155', borderBottom: '1px solid #f8fafc' },
    nameTd: { fontWeight: '600', color: '#0f172a' },
    badge: (bg, color, border, label) => (
      <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', background: bg, color, border: `1px solid ${border}` }}>{label}</span>
    ),
    gradeActionBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '6px 14px', fontSize: '0.78rem', fontWeight: '600',
      background: accentColor, color: '#fff', border: 'none',
      borderRadius: '6px', cursor: 'pointer',
    },
    emptyCard: {
      background: '#fff', borderRadius: '12px', padding: '48px 24px',
      textAlign: 'center', border: '1px solid #e2e8f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
  };

  if (loading) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading pending submissions...</p>;

  // ── Grading View ─────────────────────────────────────────────────
  if (selected) {
    return (
      <div>
        <button style={S.backBtn} onClick={() => { setSelected(null); setGrades({}); setMessage({ text: '', type: '' }); }}>
          <ChevronLeft size={16} /> Back to Pending List
        </button>

        <div style={S.gradingCard}>
          <div style={S.gradingTitle}>{selected.quiz_title}</div>
          <div style={S.metaRow}>
            <span style={S.metaItem}>
              <span style={S.metaLabel}>Staff:</span>
              {selected.user_name} — {selected.user_email}
            </span>
            <span style={S.metaItem}>
              <Clock size={13} />
              <span style={S.metaLabel}>Submitted:</span>
              {new Date(selected.submitted_at).toLocaleDateString()}
            </span>
            <span style={S.metaItem}>
              <span style={S.metaLabel}>MCQ Score:</span>
              {selected.mcq_score}%
            </span>
          </div>

          <div style={S.divider} />
          <div style={S.sectionTitle}>Short Answer Responses</div>

          {selected.short_answers.map((sa, index) => (
            <div key={sa.answer_id} style={S.answerCard}>
              <div style={S.questionText}>Q{index + 1}: {sa.question_text}</div>
              <div style={S.answerBox}>
                {sa.answer_text || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No answer provided</span>}
              </div>
              <div style={S.gradeRow}>
                <button
                  style={S.gradeBtn(grades[sa.answer_id] === true, 'correct')}
                  onClick={() => handleGradeChange(sa.answer_id, true)}
                >
                  <CheckCircle size={14} /> Satisfactory
                </button>
                <button
                  style={S.gradeBtn(grades[sa.answer_id] === false, 'incorrect')}
                  onClick={() => handleGradeChange(sa.answer_id, false)}
                >
                  <XCircle size={14} /> Unsatisfactory
                </button>
              </div>
            </div>
          ))}

          {message.text && <div style={S.message(message.type)}>{message.text}</div>}

          <button
            style={S.submitBtn(!allGraded() || submitting)}
            onClick={handleSubmitGrades}
            disabled={submitting || !allGraded()}
          >
            {submitting ? 'Submitting...' : 'Submit Grades'}
          </button>
        </div>
      </div>
    );
  }

  // ── Pending List ─────────────────────────────────────────────────
  return (
    <div>
      <div style={S.title}>
        <GraduationCap size={18} color={accentColor} />
        Quiz Grading
        {attempts.length > 0 && (
          <span style={S.pendingBadge}>{attempts.length} pending</span>
        )}
      </div>

      {message.text && <div style={S.message(message.type)}>{message.text}</div>}

      {attempts.length === 0 ? (
        <div style={S.emptyCard}>
          <GraduationCap size={36} color="#cbd5e1" />
          <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '12px' }}>
            No submissions pending review at this time.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                {['Staff Member', 'Quiz', 'Submitted', 'MCQ Score', 'Short Answers', 'Action'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attempts.map(att => (
                <tr key={att.attempt_id}>
                  <td style={{ ...S.td, ...S.nameTd }}>{att.user_name}</td>
                  <td style={S.td}>{att.quiz_title}</td>
                  <td style={S.td}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '0.82rem' }}>
                      <Clock size={12} />
                      {new Date(att.submitted_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={S.td}>{S.badge('#f8fafc', '#64748b', '#e2e8f0', `${att.mcq_score}%`)}</td>
                  <td style={S.td}>{S.badge('#fefce8', '#d97706', '#fde68a', `${att.short_answers.length} to review`)}</td>
                  <td style={S.td}>
                    <button style={S.gradeActionBtn} onClick={() => { setSelected(att); setGrades({}); setMessage({ text: '', type: '' }); }}>
                      <GraduationCap size={13} /> Grade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}