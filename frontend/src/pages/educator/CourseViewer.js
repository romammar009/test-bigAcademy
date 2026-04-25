import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import QuizTaker from './QuizTaker';
import {
  ChevronLeft, ChevronDown, ChevronUp,
  CheckCircle, Lock, PlayCircle,
  BookOpen, Clock, AlertCircle, ClipboardList,
  Video, FileIcon, BookMarked, PenLine
} from 'lucide-react';

export default function CourseViewer({ enrolment, onBack }) {
  const [modules, setModules]                   = useState([]);
  const [lessonProgress, setLessonProgress]     = useState({});
  const [activeLesson, setActiveLesson]         = useState(null);
  const [activeQuiz, setActiveQuiz]             = useState(null);
  const [activeQuizResult, setActiveQuizResult] = useState(null);
  const [expandedModule, setExpanded]           = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [completing, setCompleting]             = useState(false);
  const [message, setMessage]                   = useState('');
  const [quizStatusLoading, setQuizStatusLoading] = useState(false);
  const [quizStatuses, setQuizStatuses]         = useState({});
  const [lockedQuiz, setLockedQuiz]             = useState(null);
  const [unlockReason, setUnlockReason]         = useState('');
  const [requestingUnlock, setRequestingUnlock] = useState(false);
  const [unlockMessage, setUnlockMessage]       = useState('');

  const course = enrolment.course;
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCourseData(); }, []);

  const fetchCourseData = async () => {
    try {
      const courseRes  = await API.get(`/courses/${course.id}/`);
      const courseData = courseRes.data;
      setModules(courseData.modules || []);

      const progressRes      = await API.get(`/courses/${course.id}/progress/`);
      const completedLessons = progressRes.data.completed_lesson_ids || [];
      const progressMap      = {};
      completedLessons.forEach(id => {
        progressMap[Number(id)] = true;
        progressMap[String(id)] = true;
      });
      setLessonProgress(progressMap);

      const allQuizzes = courseData.modules?.flatMap(m => m.quizzes || []) || [];
      const statusMap  = {};
      await Promise.all(allQuizzes.map(async (quiz) => {
        try {
          const statusRes    = await API.get(`/quizzes/${quiz.id}/status/`);
          statusMap[quiz.id] = statusRes.data;
        } catch (err) {}
      }));
      setQuizStatuses(statusMap);

      if (courseData.modules?.length > 0) setExpanded(courseData.modules[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLesson = async (lessonId) => {
    setCompleting(true);
    try {
      await API.post(`/lessons/${lessonId}/complete/`);
      setLessonProgress(prev => ({
        ...prev,
        [Number(lessonId)]: true,
        [String(lessonId)]: true,
      }));
      setMessage('Lesson marked as complete!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Could not mark lesson as complete.');
    } finally {
      setCompleting(false);
    }
  };

  const handleQuizClick = async (quiz) => {
    setQuizStatusLoading(true);
    setMessage('');
    try {
      const res        = await API.get(`/quizzes/${quiz.id}/status/`);
      const quizStatus = res.data;
      setQuizStatuses(prev => ({ ...prev, [quiz.id]: quizStatus }));

      if (quizStatus.last_result?.passed === true) {
        try {
          const answersRes = await API.get(`/quizzes/${quiz.id}/last-attempt/`);
          setActiveQuizResult({ quiz, quizStatus, lastAttempt: answersRes.data });
        } catch (err) {
          setActiveQuizResult({ quiz, quizStatus, lastAttempt: null });
        }
        return;
      }
      if (quizStatus.locked) { setLockedQuiz(quiz); return; }
      if (quizStatus.last_result?.grading_status === 'pending') {
        setMessage('Your quiz is pending review. You will be notified once graded.');
        return;
      }
      if (quizStatus.last_result?.grading_status === 'graded' && quizStatus.last_result?.passed === true) {
        try {
          const answersRes = await API.get(`/quizzes/${quiz.id}/last-attempt/`);
          setActiveQuizResult({ quiz, quizStatus, lastAttempt: answersRes.data });
        } catch (err) {
          setActiveQuizResult({ quiz, quizStatus, lastAttempt: null });
        }
        return;
      }
      if (quizStatus.last_result?.grading_status === 'graded' && !quizStatus.last_result?.passed) {
        setMessage(`You did not pass your last attempt. You have ${quizStatus.attempts_left} attempt(s) remaining.`);
        setTimeout(() => { setMessage(''); setActiveQuiz(quiz); }, 2500);
        return;
      }
      setActiveQuiz(quiz);
    } catch (err) {
      setActiveQuiz(quiz);
    } finally {
      setQuizStatusLoading(false);
    }
  };

  const handleUnlockRequest = async () => {
    if (!unlockReason.trim()) { setUnlockMessage('Please provide a reason.'); return; }
    setRequestingUnlock(true);
    try {
      await API.post(`/quizzes/${lockedQuiz.id}/unlock-request/`, { reason: unlockReason });
      setUnlockMessage('Unlock request submitted! Your manager will review it.');
      setUnlockReason('');
      setTimeout(() => { setLockedQuiz(null); setUnlockMessage(''); }, 3000);
    } catch (err) {
      setUnlockMessage(err.response?.data?.error || 'Could not submit request.');
    } finally {
      setRequestingUnlock(false);
    }
  };

  const isModuleComplete  = (module) => module.lessons?.length > 0 && module.lessons.every(l => lessonProgress[Number(l.id)] || lessonProgress[String(l.id)]);
  const isModuleUnlocked  = (idx) => idx === 0 || isModuleComplete(modules[idx - 1]);
  const isLessonUnlocked  = (module, modIdx, lesIdx) => isModuleUnlocked(modIdx) && (lesIdx === 0 || !!(lessonProgress[Number(module.lessons[lesIdx-1].id)] || lessonProgress[String(module.lessons[lesIdx-1].id)]));
  const isQuizUnlocked    = (module) => isModuleComplete(module);

  const contentIcon = (type) => {
    if (type === 'video')   return <Video size={13} />;
    if (type === 'pdf')     return <FileIcon size={13} />;
    if (type === 'article') return <BookMarked size={13} />;
    return <PenLine size={13} />;
  };

  const renderLessonContent = (lesson) => {
    if (lesson.content_type === 'video') return (
      <div style={{ marginBottom: '16px' }}>
        {console.log('VIDEO URL:', lesson.content_url)}
        <video controls style={{ width: '100%', borderRadius: '8px' }}
          src={`http://localhost:8000${lesson.content_url}`} />
      </div>
    );
    if (lesson.content_type === 'pdf') return (
      <iframe src={lesson.content_url} width="100%" height="600px" title={lesson.title} style={{ borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }} />
    );
    if (lesson.content_type === 'text' || lesson.content_type === 'article') return (
      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px', lineHeight: 1.7, color: '#334155' }}
        dangerouslySetInnerHTML={{ __html: lesson.content_url }} />
    );
    if (lesson.content_type === 'ppt') return (
      <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent('http://localhost:8000' + lesson.content_url)}&embedded=true`} width="100%" height="500px" style={{ borderRadius: '8px', border: 'none', marginBottom: '16px' }} />
    );
    if (lesson.content_type === 'youtube') return (
      <div style={{ aspectRatio: '16/9', marginBottom: '16px' }}>
        <iframe src={lesson.content_url} title={lesson.title} allowFullScreen style={{ width: '100%', height: '100%', borderRadius: '8px', border: 'none' }} />
      </div>
    );
    return <p style={{ color: '#94a3b8' }}>No content available.</p>;
  };

  const S = {
    page: { background: '#eef1ff', minHeight: '100%' },
    backBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: 'none', border: 'none', color: '#2563eb',
      fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
      padding: '0', marginBottom: '20px',
    },
    headerCard: {
      background: '#fff', borderRadius: '12px', padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
      marginBottom: '20px',
    },
    courseTitle: { fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' },
    courseDesc:  { fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' },
    progressBar: { height: '8px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', flex: 1 },
    progressFill: (pct) => ({ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10b981' : '#2563eb', borderRadius: '10px', transition: 'width 0.3s ease' }),
    progressRow: { display: 'flex', alignItems: 'center', gap: '12px' },
    progressPct:  { fontSize: '0.875rem', fontWeight: '700', color: '#0f172a', minWidth: '36px' },
    progressSub:  { fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' },
    messageBox: (type) => ({
      padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
      fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
      background: type === 'warning' ? '#fffbeb' : type === 'error' ? '#fef2f2' : '#f0fdf4',
      color:      type === 'warning' ? '#d97706' : type === 'error' ? '#ef4444' : '#059669',
      border:     `1px solid ${type === 'warning' ? '#fde68a' : type === 'error' ? '#fecaca' : '#bbf7d0'}`,
    }),
    moduleCard: (unlocked) => ({
      background: '#fff', borderRadius: '10px', marginBottom: '10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0',
      overflow: 'hidden', opacity: unlocked ? 1 : 0.6,
    }),
    moduleHeader: (isOpen, isComplete) => ({
      padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px',
      cursor: 'pointer', userSelect: 'none',
      background: isOpen ? '#f8fafc' : '#fff',
      borderBottom: isOpen ? '1px solid #e2e8f0' : 'none',
    }),
    moduleBadge: (isComplete, isLocked) => ({
      fontSize: '0.7rem', fontWeight: '700', padding: '3px 9px', borderRadius: '20px',
      background: isLocked ? '#f1f5f9' : isComplete ? '#f0fdf4' : '#eff6ff',
      color:      isLocked ? '#94a3b8'  : isComplete ? '#059669' : '#2563eb',
      border:     `1px solid ${isLocked ? '#e2e8f0' : isComplete ? '#bbf7d0' : '#bfdbfe'}`,
      display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
    }),
    moduleTitle:   { fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', flex: 1 },
    moduleCount:   { fontSize: '0.75rem', color: '#94a3b8', flexShrink: 0 },
    lessonItem: (unlocked, completed) => ({
      padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px',
      borderBottom: '1px solid #f8fafc', cursor: unlocked ? 'pointer' : 'not-allowed',
      background: completed ? '#fafffe' : '#fff',
      transition: 'background 0.1s',
    }),
    lessonIconBox: (completed, unlocked) => ({
      width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: completed ? '#f0fdf4' : unlocked ? '#eff6ff' : '#f8fafc',
      color:      completed ? '#10b981' : unlocked ? '#2563eb' : '#cbd5e1',
    }),
    lessonTitle:    { fontSize: '0.875rem', color: '#334155', flex: 1 },
    lessonDuration: { fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' },
    quizItem: (unlocked) => ({
      padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px',
      cursor: unlocked ? 'pointer' : 'not-allowed',
      background: unlocked ? '#fffbeb' : '#fafafa',
      borderTop: '1px solid #f1f5f9',
    }),
    quizIconBox: {
      width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#fef3c7', color: '#d97706',
    },
    quizTitle:   { fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', flex: 1 },
    quizBadge: (type) => ({
      fontSize: '0.7rem', fontWeight: '600', padding: '2px 8px', borderRadius: '10px',
      background: type === 'passed' ? '#f0fdf4' : type === 'failed' ? '#fef2f2' : type === 'pending' ? '#eff6ff' : '#fef3c7',
      color:      type === 'passed' ? '#059669' : type === 'failed' ? '#ef4444' : type === 'pending' ? '#2563eb' : '#d97706',
    }),
    // Lesson view
    lessonPage:   { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    lessonTitle2: { fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' },
    typeBadge:    { fontSize: '0.72rem', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', background: '#eff6ff', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '16px' },
    completeBtn:  { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '7px' },
    completedNote:{ padding: '10px 16px', background: '#f0fdf4', color: '#059669', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #bbf7d0' },
    // Quiz result
    resultCard:   { background: '#fff', borderRadius: '12px', padding: '32px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', marginBottom: '20px' },
    scoreCircle:  { width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4', border: '3px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.5rem', fontWeight: '800', color: '#059669' },
    answerCard: (correct) => ({
      background: correct ? '#f0fdf4' : '#fef2f2', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px',
      border: `1px solid ${correct ? '#bbf7d0' : '#fecaca'}`,
    }),
    // Unlock form
    unlockCard:  { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    textarea:    { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#334155', resize: 'vertical', minHeight: '100px', fontFamily: 'inherit' },
    submitBtn:   { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' },
  };

  const renderQuizStatusBadge = (quiz) => {
    const status = quizStatuses[quiz.id];
    if (!status) return null;
    if (status.last_result?.passed)                              return <span style={S.quizBadge('passed')}>Passed</span>;
    if (status.last_result?.grading_status === 'pending')        return <span style={S.quizBadge('pending')}>Pending Review</span>;
    if (status.last_result && !status.last_result.passed)        return <span style={S.quizBadge('failed')}>Failed — {status.last_result.score_percent}%</span>;
    return null;
  };

  // ── Active Quiz ──────────────────────────────────────────────────
  if (activeQuiz) return (
    <QuizTaker quiz={activeQuiz} onBack={() => setActiveQuiz(null)} onComplete={() => { setActiveQuiz(null); setActiveLesson(null); fetchCourseData(); }} />
  );

  // ── Quiz Result View ─────────────────────────────────────────────
  if (activeQuizResult) {
    const { quiz, quizStatus, lastAttempt } = activeQuizResult;
    return (
      <div style={S.page}>
        <button style={S.backBtn} onClick={() => setActiveQuizResult(null)}>
          <ChevronLeft size={16} /> Back to Course
        </button>
        <div style={S.resultCard}>
          <div style={S.scoreCircle}>{quizStatus.last_result.score_percent}%</div>
          <h3 style={{ fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>You Passed!</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Pass mark was {quiz.pass_mark_percent}% — your certificate is in the Certificates tab.</p>
        </div>
        {lastAttempt?.answers?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <h5 style={{ fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={16} color="#2563eb" /> Answer Review
            </h5>
            {lastAttempt.answers.map((ans, idx) => {
              if (ans.question_type === 'short_answer') return (
                <div key={ans.question_id} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Q{idx + 1} — Short Answer</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>{ans.question_text}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}><span style={{ color: '#94a3b8', fontWeight: '600' }}>Your answer: </span>{ans.selected_text || 'No answer provided'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>Reviewed by your manager</div>
                </div>
              );
              const correctInfo = lastAttempt.correct_answers?.[String(ans.question_id)];
              return (
                <div key={ans.question_id} style={S.answerCard(ans.is_correct)}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: ans.is_correct ? '#059669' : '#ef4444', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {ans.is_correct ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                    Q{idx + 1} — {ans.is_correct ? 'Correct' : 'Incorrect'}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>{ans.question_text}</div>
                  <div style={{ fontSize: '0.85rem', color: ans.is_correct ? '#059669' : '#ef4444' }}><span style={{ color: '#94a3b8', fontWeight: '600' }}>Your answer: </span>{ans.selected_text || 'No answer'}</div>
                  {!ans.is_correct && correctInfo && (
                    <div style={{ fontSize: '0.85rem', color: '#059669', marginTop: '4px' }}><span style={{ color: '#94a3b8', fontWeight: '600' }}>Correct: </span>{correctInfo.correct_option_text}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Locked Quiz ──────────────────────────────────────────────────
  if (lockedQuiz) return (
    <div style={S.page}>
      <button style={S.backBtn} onClick={() => { setLockedQuiz(null); setUnlockReason(''); setUnlockMessage(''); }}>
        <ChevronLeft size={16} /> Back to Course
      </button>
      <div style={S.unlockCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={18} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1rem' }}>Quiz Locked</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>All {lockedQuiz.attempt_limit} attempts used</div>
          </div>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' }}>
          Submit an unlock request for <strong>{lockedQuiz.title}</strong> and your manager will review it.
        </p>
        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Reason for unlock request</label>
        <textarea style={S.textarea} rows={4} placeholder="Explain why you need another attempt..." value={unlockReason} onChange={e => setUnlockReason(e.target.value)} />
        {unlockMessage && (
          <div style={{ ...S.messageBox(unlockMessage.includes('submitted') ? 'success' : 'error'), marginTop: '12px' }}>
            {unlockMessage}
          </div>
        )}
        <button style={{ ...S.submitBtn, marginTop: '14px' }} onClick={handleUnlockRequest} disabled={requestingUnlock}>
          {requestingUnlock ? 'Submitting...' : 'Submit Unlock Request'}
        </button>
      </div>
    </div>
  );

  // ── Active Lesson ────────────────────────────────────────────────
  if (activeLesson) {
    const isCompleted = lessonProgress[Number(activeLesson.id)] || lessonProgress[String(activeLesson.id)];
    return (
      <div style={S.page}>
        <button style={S.backBtn} onClick={() => setActiveLesson(null)}>
          <ChevronLeft size={16} /> Back to Course
        </button>
        <div style={S.lessonPage}>
          <div style={S.lessonTitle2}>{activeLesson.title}</div>
          <div style={S.typeBadge}>
            {contentIcon(activeLesson.content_type)}
            {activeLesson.content_type.toUpperCase()}
          </div>
          {renderLessonContent(activeLesson)}
          {message && <div style={{ ...S.messageBox('success'), marginBottom: '12px' }}><CheckCircle size={14} />{message}</div>}
          {isCompleted
            ? <div style={S.completedNote}><CheckCircle size={16} /> This lesson is complete!</div>
            : <button style={S.completeBtn} onClick={() => handleCompleteLesson(activeLesson.id)} disabled={completing}>
                <CheckCircle size={15} />
                {completing ? 'Saving...' : 'Mark as Complete'}
              </button>
          }
        </div>
      </div>
    );
  }

  // ── Course Accordion ─────────────────────────────────────────────
  if (loading) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading course...</p>;

  const totalLessons   = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const completedCount = modules.reduce((sum, m) => sum + (m.lessons?.filter(l => lessonProgress[Number(l.id)] || lessonProgress[String(l.id)]).length || 0), 0);
  const allQuizzes     = modules.flatMap(m => m.quizzes || []);
  const allQuizPassed  = allQuizzes.length === 0 || allQuizzes.every(q => quizStatuses[q.id]?.last_result?.passed === true);
  const lessonPercent  = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const overallPercent = lessonPercent === 100 && allQuizPassed ? 100 : Math.min(lessonPercent, 99);

  return (
    <div style={S.page}>
      <button style={S.backBtn} onClick={onBack}>
        <ChevronLeft size={16} /> Back to My Learning
      </button>

      {/* Header */}
      <div style={S.headerCard}>
        <div style={S.courseTitle}>{course.title}</div>
        <div style={S.courseDesc}>{course.description}</div>
        <div style={S.progressRow}>
          <div style={S.progressBar}>
            <div style={S.progressFill(overallPercent)} />
          </div>
          <span style={S.progressPct}>{overallPercent}%</span>
        </div>
        <div style={S.progressSub}>{completedCount} of {totalLessons} lessons completed</div>
      </div>

      {message && (
        <div style={S.messageBox(message.includes('not pass') ? 'warning' : message.includes('pending') ? 'info' : 'success')}>
          <AlertCircle size={14} /> {message}
        </div>
      )}

      {/* Modules */}
      {modules.map((module, moduleIndex) => {
        const isOpen      = expandedModule === module.id;
        const modComplete = isModuleComplete(module);
        const modUnlocked = isModuleUnlocked(moduleIndex);
        const quizUnlocked = isQuizUnlocked(module);

        return (
          <div style={S.moduleCard(modUnlocked)} key={module.id}>
            <div style={S.moduleHeader(isOpen, modComplete)} onClick={() => modUnlocked && setExpanded(isOpen ? null : module.id)}>
              <div style={S.moduleBadge(modComplete, !modUnlocked)}>
                {!modUnlocked ? <><Lock size={10} /> Locked</> : modComplete ? <><CheckCircle size={10} /> Complete</> : <><BookOpen size={10} /> Module {moduleIndex + 1}</>}
              </div>
              <span style={S.moduleTitle}>{module.title}</span>
              <span style={S.moduleCount}>
                {module.lessons?.filter(l => lessonProgress[Number(l.id)] || lessonProgress[String(l.id)]).length || 0} / {module.lessons?.length || 0} lessons
              </span>
              {modUnlocked && (isOpen ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />)}
            </div>

            {isOpen && (
              <div>
                {module.lessons?.map((lesson, lessonIndex) => {
                  const unlocked  = isLessonUnlocked(module, moduleIndex, lessonIndex);
                  const completed = !!(lessonProgress[Number(lesson.id)] || lessonProgress[String(lesson.id)]);
                  return (
                    <div key={lesson.id} style={S.lessonItem(unlocked, completed)} onClick={() => unlocked && setActiveLesson(lesson)}>
                      <div style={S.lessonIconBox(completed, unlocked)}>
                        {completed ? <CheckCircle size={14} /> : unlocked ? <PlayCircle size={14} /> : <Lock size={14} />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                        <span style={{ color: '#94a3b8' }}>{contentIcon(lesson.content_type)}</span>
                        <span style={S.lessonTitle}>{lesson.title}</span>
                      </div>
                      {lesson.duration_seconds && (
                        <span style={S.lessonDuration}>
                          <Clock size={11} />
                          {Math.round(lesson.duration_seconds / 60)} mins
                        </span>
                      )}
                    </div>
                  );
                })}

                {module.quizzes?.map(quiz => (
                  <div key={quiz.id} style={S.quizItem(quizUnlocked && !quizStatusLoading)} onClick={() => quizUnlocked && !quizStatusLoading && handleQuizClick(quiz)}>
                    <div style={S.quizIconBox}>
                      {quizUnlocked ? <ClipboardList size={14} /> : <Lock size={14} color="#94a3b8" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={S.quizTitle}>{quiz.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pass mark: {quiz.pass_mark_percent}%</div>
                    </div>
                    {renderQuizStatusBadge(quiz)}
                    {quizUnlocked && !quizStatusLoading && (
                      <div style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600',
                        background: '#0891b2', color: '#fff', flexShrink: 0,
                      }}>
                       {quizStatuses[quiz.id]?.last_result?.passed ? 'Review' : 'Take Quiz'}
                      </div>
                    )}
                    {!quizUnlocked && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Complete all lessons to unlock</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}