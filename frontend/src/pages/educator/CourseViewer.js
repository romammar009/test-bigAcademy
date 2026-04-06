import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import QuizTaker from './QuizTaker';

export default function CourseViewer({ enrolment, onBack }) {
  const [modules, setModules]               = useState([]);
  const [lessonProgress, setLessonProgress] = useState({});
  const [activeLesson, setActiveLesson]     = useState(null);
  const [activeQuiz, setActiveQuiz]         = useState(null);
  const [activeQuizResult, setActiveQuizResult] = useState(null);
  const [expandedModule, setExpanded]       = useState(null);
  const [loading, setLoading]               = useState(true);
  const [completing, setCompleting]         = useState(false);
  const [message, setMessage]               = useState('');
  const [quizStatusLoading, setQuizStatusLoading] = useState(false);
  const [quizStatuses, setQuizStatuses]     = useState({});

  // Unlock request state
  const [lockedQuiz, setLockedQuiz]             = useState(null);
  const [unlockReason, setUnlockReason]         = useState('');
  const [requestingUnlock, setRequestingUnlock] = useState(false);
  const [unlockMessage, setUnlockMessage]       = useState('');

  const course = enrolment.course;

  useEffect(() => {
    fetchCourseData();
  }, []);

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

      if (courseData.modules && courseData.modules.length > 0) {
        setExpanded(courseData.modules[0].id);
      }
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
      console.log('Quiz status:', quizStatus);

      setQuizStatuses(prev => ({ ...prev, [quiz.id]: quizStatus }));

      // Already passed — show read-only result view
      if (quizStatus.last_result?.passed === true) {
        try {
          const answersRes = await API.get(`/quizzes/${quiz.id}/last-attempt/`);
          setActiveQuizResult({ quiz, quizStatus, lastAttempt: answersRes.data });
        } catch (err) {
          setActiveQuizResult({ quiz, quizStatus, lastAttempt: null });
        }
        return;
      }

      if (quizStatus.locked) {
        setLockedQuiz(quiz);
        return;
      }

      if (quizStatus.last_result && quizStatus.last_result.grading_status === 'pending') {
        setMessage('⏳ Your quiz is pending review by your branch manager. You will be notified once graded.');
        return;
      }

      // Graded and passed — show result view
      if (quizStatus.last_result?.grading_status === 'graded' && quizStatus.last_result?.passed === true) {
        try {
          const answersRes = await API.get(`/quizzes/${quiz.id}/last-attempt/`);
          setActiveQuizResult({ quiz, quizStatus, lastAttempt: answersRes.data });
        } catch (err) {
          setActiveQuizResult({ quiz, quizStatus, lastAttempt: null });
        }
        return;
      }

      if (quizStatus.last_result &&
          quizStatus.last_result.grading_status === 'graded' &&
          !quizStatus.last_result.passed) {
        const attemptsLeft = quizStatus.attempts_left;
        setMessage(`❌ You did not pass your last attempt. You have ${attemptsLeft} attempt(s) remaining. Starting new attempt...`);
        setTimeout(() => {
          setMessage('');
          setActiveQuiz(quiz);
        }, 2500);
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
    if (!unlockReason.trim()) {
      setUnlockMessage('Please provide a reason for your unlock request.');
      return;
    }
    setRequestingUnlock(true);
    try {
      await API.post(`/quizzes/${lockedQuiz.id}/unlock-request/`, { reason: unlockReason });
      setUnlockMessage('✅ Unlock request submitted! Your branch manager will review it.');
      setUnlockReason('');
      setTimeout(() => {
        setLockedQuiz(null);
        setUnlockMessage('');
      }, 3000);
    } catch (err) {
      setUnlockMessage(err.response?.data?.error || 'Could not submit request.');
    } finally {
      setRequestingUnlock(false);
    }
  };

  const isModuleComplete = (module) => {
    if (!module.lessons || module.lessons.length === 0) return false;
    return module.lessons.every(l =>
      lessonProgress[Number(l.id)] || lessonProgress[String(l.id)]
    );
  };

  const isModuleUnlocked = (moduleIndex) => {
    if (moduleIndex === 0) return true;
    const prevModule = modules[moduleIndex - 1];
    return isModuleComplete(prevModule);
  };

  const isLessonUnlocked = (module, moduleIndex, lessonIndex) => {
    if (!isModuleUnlocked(moduleIndex)) return false;
    if (lessonIndex === 0) return true;
    const prevLesson = module.lessons[lessonIndex - 1];
    return !!lessonProgress[Number(prevLesson.id)] || !!lessonProgress[String(prevLesson.id)];
  };

  const isQuizUnlocked = (module) => isModuleComplete(module);

  const renderLessonContent = (lesson) => {
    if (lesson.content_type === 'video') {
      return (
        <div className="ratio ratio-16x9 mb-3">
          <iframe src={lesson.content_url} title={lesson.title} allowFullScreen />
        </div>
      );
    }
    if (lesson.content_type === 'pdf') {
      return (
        <div className="mb-3">
          <iframe src={lesson.content_url} width="100%" height="600px" title={lesson.title} />
        </div>
      );
    }
    if (lesson.content_type === 'text' || lesson.content_type === 'article') {
      return (
        <div className="mb-3 p-3 bg-light rounded"
          dangerouslySetInnerHTML={{ __html: lesson.content_url }} />
      );
    }
    return <p className="text-muted">No content available for this lesson.</p>;
  };

  const handleQuizComplete = () => {
    setActiveQuiz(null);
    setActiveLesson(null);
    fetchCourseData();
  };

  const renderQuizStatus = (quiz) => {
    const status = quizStatuses[quiz.id];
    if (!status) return null;
    return (
      <span className="ms-2">
        <small className="text-muted">
          {status.attempt_count}/{quiz.attempt_limit} attempts used
        </small>
        {status.last_result && (
          status.last_result.grading_status === 'pending'
            ? <span className="badge bg-info ms-2">⏳ Pending Review</span>
            : status.last_result.passed
              ? <span className="badge bg-success ms-2">✅ Passed</span>
              : <span className="badge bg-danger ms-2">
                  ❌ Failed {status.last_result.score_percent !== null ? `— ${status.last_result.score_percent}%` : ''}
                </span>
        )}
      </span>
    );
  };

  // ── Active Quiz View ─────────────────────────────────────────────
  if (activeQuiz) {
    return (
      <QuizTaker
        quiz={activeQuiz}
        onBack={() => setActiveQuiz(null)}
        onComplete={handleQuizComplete}
      />
    );
  }

  // ── Read-Only Result View (already passed) ───────────────────────
  if (activeQuizResult) {
    const { quiz, quizStatus, lastAttempt } = activeQuizResult;
    return (
      <div>
        <button className="btn btn-link ps-0 mb-3" onClick={() => setActiveQuizResult(null)}>
          ← Back to Course
        </button>

        {/* Score summary */}
        <div className="card shadow-sm mb-4">
          <div className="card-body text-center p-4">
            <div style={{ fontSize: '3rem' }}>🎉</div>
            <h3 className="mt-3 text-success">You Passed!</h3>
            <p className="text-muted">
              Score: <strong>{quizStatus.last_result.score_percent}%</strong>
              &nbsp;— pass mark was <strong>{quiz.pass_mark_percent}%</strong>
            </p>
            <p className="text-muted small">
              Your certificate is available in the Certificates tab.
            </p>
          </div>
        </div>

        {/* Answer review */}
        {lastAttempt && lastAttempt.answers && lastAttempt.answers.length > 0 && (
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">📋 Answer Review</h5>
              {lastAttempt.answers.map((ans, index) => {

                // Short answer
                if (ans.question_type === 'short_answer') {
                  return (
                    <div key={ans.question_id} className="p-3 rounded mb-3 border border-info bg-info bg-opacity-10">
                      <div className="d-flex align-items-start gap-2 mb-2">
                        <span>📝</span>
                        <p className="fw-semibold mb-0">Q{index + 1}: {ans.question_text}</p>
                      </div>
                      <div className="ms-4">
                        <p className="mb-1 small">
                          <span className="text-muted">Your answer: </span>
                          <span className="fw-semibold">{ans.selected_text || 'No answer provided'}</span>
                        </p>
                        <small className="text-muted fst-italic">Reviewed by your branch manager</small>
                      </div>
                    </div>
                  );
                }

                // MCQ / truefalse
                const correctInfo = lastAttempt.correct_answers?.[String(ans.question_id)];
                const isCorrect   = ans.is_correct;
                const correctText = correctInfo?.correct_option_text;

                return (
                  <div
                    key={ans.question_id}
                    className={`p-3 rounded mb-3 border ${
                      isCorrect
                        ? 'border-success bg-success bg-opacity-10'
                        : 'border-danger bg-danger bg-opacity-10'
                    }`}
                  >
                    <div className="d-flex align-items-start gap-2 mb-2">
                      <span>{isCorrect ? '✅' : '❌'}</span>
                      <p className="fw-semibold mb-0">Q{index + 1}: {ans.question_text}</p>
                    </div>
                    <div className="ms-4">
                      <p className="mb-1 small">
                        <span className="text-muted">Your answer: </span>
                        <span className={isCorrect ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                          {ans.selected_text || 'No answer'}
                        </span>
                      </p>
                      {!isCorrect && correctText && (
                        <p className="mb-0 small">
                          <span className="text-muted">Correct answer: </span>
                          <span className="text-success fw-semibold">{correctText}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Locked Quiz — Unlock Request Form ────────────────────────────
  if (lockedQuiz) {
    return (
      <div>
        <button className="btn btn-link ps-0 mb-3" onClick={() => {
          setLockedQuiz(null);
          setUnlockReason('');
          setUnlockMessage('');
        }}>
          ← Back to Course
        </button>
        <div className="card shadow-sm">
          <div className="card-body">
            <h4>🔒 Quiz Locked</h4>
            <p className="text-muted mb-4">
              You have used all <strong>{lockedQuiz.attempt_limit}</strong> attempts
              for <strong>{lockedQuiz.title}</strong>.
              Submit a request below and your branch manager will review it.
            </p>
            <div className="mb-3">
              <label className="form-label fw-semibold">Reason for unlock request:</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Explain why you need another attempt..."
                value={unlockReason}
                onChange={e => setUnlockReason(e.target.value)}
              />
            </div>
            {unlockMessage && (
              <div className={`alert py-2 ${unlockMessage.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>
                {unlockMessage}
              </div>
            )}
            <button
              className="btn btn-primary"
              onClick={handleUnlockRequest}
              disabled={requestingUnlock}
            >
              {requestingUnlock ? 'Submitting...' : 'Submit Unlock Request'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active Lesson View ───────────────────────────────────────────
  if (activeLesson) {
    return (
      <div>
        <button className="btn btn-link ps-0 mb-3" onClick={() => setActiveLesson(null)}>
          ← Back to Course
        </button>
        <div className="card shadow-sm">
          <div className="card-body">
            <h4>{activeLesson.title}</h4>
            <span className="badge bg-secondary mb-3">
              {activeLesson.content_type.toUpperCase()}
            </span>
            {renderLessonContent(activeLesson)}
            {message && <div className="alert alert-success py-2">{message}</div>}
            {lessonProgress[Number(activeLesson.id)] || lessonProgress[String(activeLesson.id)] ? (
              <div className="alert alert-success py-2">✅ This lesson is complete!</div>
            ) : (
              <button
                className="btn btn-success mt-2"
                onClick={() => handleCompleteLesson(activeLesson.id)}
                disabled={completing}
              >
                {completing ? 'Saving...' : '✓ Mark as Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Course Accordion View ────────────────────────────────────────
  if (loading) return <p>Loading course...</p>;

  const totalLessons   = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const completedCount = modules.reduce((sum, m) =>
    sum + (m.lessons?.filter(l =>
      lessonProgress[Number(l.id)] || lessonProgress[String(l.id)]
    ).length || 0), 0);

  const allQuizzes    = modules.flatMap(m => m.quizzes || []);
  const allQuizPassed = allQuizzes.length === 0 ||
    allQuizzes.every(q => quizStatuses[q.id]?.last_result?.passed === true);
  const lessonPercent  = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const overallPercent = lessonPercent === 100 && allQuizPassed ? 100 : Math.min(lessonPercent, 99);

  return (
    <div>
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        ← Back to My Learning
      </button>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h3>{course.title}</h3>
          <p className="text-muted">{course.description}</p>
          <div className="d-flex align-items-center gap-3 mt-3">
            <div className="progress flex-grow-1" style={{ height: '12px' }}>
              <div
                className={`progress-bar ${overallPercent === 100 ? 'bg-success' : 'bg-primary'}`}
                style={{ width: `${overallPercent}%` }}
              />
            </div>
            <span className="fw-bold">{overallPercent}%</span>
          </div>
          <small className="text-muted">{completedCount} of {totalLessons} lessons completed</small>
        </div>
      </div>

      {message && (
        <div className={`alert py-2 ${
          message.startsWith('⏳') ? 'alert-info' :
          message.startsWith('❌') ? 'alert-warning' :
          'alert-success'
        }`}>
          {message}
        </div>
      )}

      {/* Accordion Modules */}
      <div className="accordion" id="courseAccordion">
        {modules.map((module, moduleIndex) => {
          const isOpen       = expandedModule === module.id;
          const modComplete  = isModuleComplete(module);
          const quizUnlocked = isQuizUnlocked(module);
          const modUnlocked  = isModuleUnlocked(moduleIndex);

          return (
            <div className="accordion-item mb-2 shadow-sm" key={module.id}>
              <h2 className="accordion-header">
                <button
                  className={`accordion-button ${!isOpen ? 'collapsed' : ''}`}
                  onClick={() => modUnlocked && setExpanded(isOpen ? null : module.id)}
                  style={{ cursor: modUnlocked ? 'pointer' : 'not-allowed' }}
                >
                  <div className="d-flex align-items-center gap-3 w-100 me-3">
                    <span>
                      {!modUnlocked
                        ? <span className="badge bg-secondary me-2">🔒 Locked</span>
                        : modComplete
                          ? <span className="badge bg-success me-2">✓ Complete</span>
                          : <span className="badge bg-secondary me-2">Module {moduleIndex + 1}</span>
                      }
                      {module.title}
                    </span>
                    <small className="text-muted ms-auto">
                      {module.lessons?.filter(l =>
                        lessonProgress[Number(l.id)] || lessonProgress[String(l.id)]
                      ).length || 0} / {module.lessons?.length || 0} lessons
                    </small>
                  </div>
                </button>
              </h2>

              {isOpen && (
                <div className="accordion-body p-0">
                  <ul className="list-group list-group-flush">
                    {module.lessons && module.lessons.map((lesson, lessonIndex) => {
                      const unlocked  = isLessonUnlocked(module, moduleIndex, lessonIndex);
                      const completed = lessonProgress[Number(lesson.id)] || lessonProgress[String(lesson.id)];
                      return (
                        <li
                          key={lesson.id}
                          className={`list-group-item d-flex justify-content-between align-items-center
                            ${!unlocked ? 'text-muted' : ''}
                            ${unlocked ? 'list-group-item-action' : ''}
                          `}
                          style={{ cursor: unlocked ? 'pointer' : 'not-allowed' }}
                          onClick={() => unlocked && setActiveLesson(lesson)}
                        >
                          <span>
                            {completed
                              ? <span className="text-success me-2">✅</span>
                              : unlocked
                                ? <span className="me-2">▶</span>
                                : <span className="me-2">🔒</span>
                            }
                            {lesson.content_type === 'video'   && '🎬 '}
                            {lesson.content_type === 'pdf'     && '📄 '}
                            {lesson.content_type === 'article' && '📰 '}
                            {lesson.content_type === 'text'    && '📝 '}
                            {lesson.title}
                          </span>
                          {lesson.duration_seconds && (
                            <small className="text-muted">
                              {Math.round(lesson.duration_seconds / 60)} mins
                            </small>
                          )}
                        </li>
                      );
                    })}

                    {module.quizzes && module.quizzes.map(quiz => (
                      <li
                        key={quiz.id}
                        className={`list-group-item d-flex justify-content-between align-items-center
                          ${quizUnlocked ? 'list-group-item-action list-group-item-warning' : 'text-muted bg-light'}
                        `}
                        style={{ cursor: quizUnlocked && !quizStatusLoading ? 'pointer' : 'not-allowed' }}
                        onClick={() => quizUnlocked && !quizStatusLoading && handleQuizClick(quiz)}
                      >
                        <span>
                          {quizUnlocked
                            ? <span className="me-2">📝</span>
                            : <span className="me-2">🔒</span>
                          }
                          <strong>{quiz.title}</strong>
                          <small className="text-muted ms-2">
                            — Pass mark: {quiz.pass_mark_percent}%
                          </small>
                          {renderQuizStatus(quiz)}
                        </span>
                        {quizUnlocked && (
                          <span className="badge bg-warning text-dark">
                            {quizStatusLoading ? 'Loading...' : 'View Quiz'}
                          </span>
                        )}
                        {!quizUnlocked && (
                          <small className="text-muted">Complete all lessons to unlock</small>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}