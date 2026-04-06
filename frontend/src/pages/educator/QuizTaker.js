import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function QuizTaker({ quiz, onBack, onComplete }) {
  const [attempt, setAttempt]         = useState(null);
  const [questions, setQuestions]     = useState([]);
  const [answers, setAnswers]         = useState({});
  const [currentQ, setCurrentQ]       = useState(0);
  const [stage, setStage]             = useState('loading');
  const [result, setResult]           = useState(null);
  const [declaration, setDeclaration] = useState({ signed: false, name: '' });
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  const DECLARATION_TEXT = `I confirm that I have completed this induction quiz and understand the policies, 
procedures and expectations outlined in the Big Childcare Educator Handbook. 

Content covered during induction:
• Program & Practice
• Child Protection and Child Safety
• Supervision & SAFE PATH
• Personal Devices
• Medical Practices
• Sun Safety
• First Aid & Incident Management
• Collection & Attendance
• Excursions & Environment
• Code of Conduct
• Reportable Conduct
• Behaviour Support

I acknowledge my responsibility to follow these procedures to ensure the health, 
safety and wellbeing of children in my care.`;

  useEffect(() => {
    startAttempt();
  }, []);

  const startAttempt = async () => {
    try {
      const res = await API.post(`/quizzes/${quiz.id}/attempt/`);
      setAttempt(res.data);
      setQuestions(res.data.questions || []);
      setStage('quiz');
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not start quiz.';
      setError(msg);
      setStage('error');
    }
  };

  const handleMCQAnswer = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: { option_id: optionId } }));
  };

  const handleShortAnswer = (questionId, text) => {
    setAnswers(prev => ({ ...prev, [questionId]: { answer_text: text } }));
  };

  const allAnswered = () => {
    return questions.every(q => {
      const ans = answers[q.id];
      if (q.question_type === 'mcq' || q.question_type === 'truefalse') {
        return ans && ans.option_id;
      }
      if (q.question_type === 'short_answer') {
        return ans && ans.answer_text && ans.answer_text.trim().length > 0;
      }
      return false;
    });
  };

  const handleSubmitQuiz = async () => {
    if (!allAnswered()) {
      setError('Please answer all questions before proceeding.');
      return;
    }
    setStage('declaration');
    setError('');
  };

  const handleSubmitFinal = async () => {
    if (!declaration.signed) {
      setError('Please confirm the declaration.');
      return;
    }
    if (!declaration.name.trim()) {
      setError('Please type your full name to sign the declaration.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const answersPayload = questions.map(q => {
        const ans = answers[q.id];
        if (q.question_type === 'mcq' || q.question_type === 'truefalse') {
          return { question_id: q.id, option_id: ans.option_id };
        }
        return { question_id: q.id, answer_text: ans.answer_text };
      });

      const res = await API.post(`/attempts/${attempt.attempt_id}/submit/`, {
        answers:            answersPayload,
        declaration_signed: true,
        declaration_name:   declaration.name.trim(),
      });

      setResult(res.data);
      setStage('result');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQ];
  const totalQ          = questions.length;
  const progressPct     = Math.round(((currentQ + 1) / totalQ) * 100);

  // ── Error ────────────────────────────────────────────────────────
  if (stage === 'error') {
    return (
      <div>
        <button className="btn btn-link ps-0 mb-3" onClick={onBack}>← Back</button>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (stage === 'loading') {
    return <p>Loading quiz...</p>;
  }

  // ── Result Screen ────────────────────────────────────────────────
  if (stage === 'result') {
    const isPending = result.grading_status === 'pending';
    const passed    = result.passed;

    return (
      <div>
        {/* Score summary card */}
        <div className="card shadow-sm mb-4">
          <div className="card-body text-center p-4">
            {isPending ? (
              <>
                <div style={{ fontSize: '3rem' }}>⏳</div>
                <h3 className="mt-3">Submitted Successfully!</h3>
                <div className="alert alert-info mt-3">
                  Your responses have been submitted. Your branch manager will
                  review your answers and you will be notified once grading is complete.
                </div>
              </>
            ) : passed ? (
              <>
                <div style={{ fontSize: '3rem' }}>🎉</div>
                <h3 className="mt-3 text-success">Congratulations! You Passed!</h3>
                <p className="text-muted">
                  You scored <strong>{result.mcq_score}%</strong> —
                  pass mark was <strong>{result.pass_mark}%</strong>
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3rem' }}>😔</div>
                <h3 className="mt-3 text-danger">Not Quite There</h3>
                <p className="text-muted">
                  You scored <strong>{result.mcq_score}%</strong> —
                  pass mark is <strong>{result.pass_mark}%</strong>
                </p>
                {result.locked && (
                  <div className="alert alert-warning mt-3">
                    You have used all {quiz.attempt_limit} attempts.
                    Please request an unlock from your branch manager.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Answer review — only for MCQ/truefalse (not pending short answers) */}
        {!isPending && (
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">📋 Answer Review</h5>
              {questions.map((q, index) => {
                if (q.question_type === 'short_answer') return null;

                const userAnswer    = answers[q.id];
                const selectedId    = userAnswer?.option_id;
                const correctInfo    = result.correct_answers?.[q.id];
                const correctOptionId = correctInfo?.correct_option_id;
                const selectedOption = q.options?.find(o => o.id === selectedId);
                const isCorrect      = selectedId === correctOptionId;
                const correctOptionText = correctInfo?.correct_option_text;

                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded mb-3 border ${
                      isCorrect ? 'border-success bg-success bg-opacity-10' : 'border-danger bg-danger bg-opacity-10'
                    }`}
                  >
                    <div className="d-flex align-items-start gap-2 mb-2">
                      <span>{isCorrect ? '✅' : '❌'}</span>
                      <p className="fw-semibold mb-0">
                        Q{index + 1}: {q.question_text}
                      </p>
                    </div>

                    <div className="ms-4">
                      <p className="mb-1 small">
                        <span className="text-muted">Your answer: </span>
                        <span className={isCorrect ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                          {selectedOption?.option_text || 'No answer'}
                        </span>
                      </p>
                      {!isCorrect && correctOptionText && (
                          <p className="mb-0 small">
                              <span className="text-muted">Correct answer: </span>
                              <span className="text-success fw-semibold">{correctOptionText}</span>
                          </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="d-flex gap-3">
          <button className="btn btn-outline-secondary" onClick={onBack}>
            Back to Course
          </button>
          {!isPending && !passed && !result.locked && (
            <button className="btn btn-primary" onClick={() => {
              setStage('loading');
              setAnswers({});
              setCurrentQ(0);
              startAttempt();
            }}>
              Try Again
            </button>
          )}
          {passed && (
            <button className="btn btn-success" onClick={onComplete}>
              Continue →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Declaration Screen ───────────────────────────────────────────
  if (stage === 'declaration') {
    return (
      <div>
        <div className="card shadow-sm">
          <div className="card-body">
            <h4 className="mb-3">📋 Staff Declaration</h4>
            <div
              className="p-3 bg-light rounded mb-4"
              style={{ whiteSpace: 'pre-line', fontSize: '0.9rem' }}
            >
              {DECLARATION_TEXT}
            </div>
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="declarationCheck"
                  checked={declaration.signed}
                  onChange={e => setDeclaration(prev => ({ ...prev, signed: e.target.checked }))}
                />
                <label className="form-check-label fw-semibold" htmlFor="declarationCheck">
                  I confirm that I have read and understood the above declaration.
                </label>
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold">Type your full name to sign:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Your full name"
                value={declaration.name}
                onChange={e => setDeclaration(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <div className="d-flex gap-3">
              <button className="btn btn-outline-secondary" onClick={() => setStage('quiz')}>
                ← Back to Quiz
              </button>
              <button
                className="btn btn-success px-5"
                onClick={handleSubmitFinal}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit & Sign'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz Screen ──────────────────────────────────────────────────
  return (
    <div>
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>← Back to Course</button>

      <div className="card shadow-sm">
        <div className="card-body">
          <h4>{quiz.title}</h4>

          {/* Progress bar */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="progress flex-grow-1" style={{ height: '8px' }}>
              <div className="progress-bar bg-success" style={{ width: `${progressPct}%` }} />
            </div>
            <small className="text-muted">Question {currentQ + 1} of {totalQ}</small>
          </div>

          {/* Question */}
          <div className="mb-4">
            <h5 className="mb-3">{currentQ + 1}. {currentQuestion.question_text}</h5>

            {/* MCQ / True False */}
            {(currentQuestion.question_type === 'mcq' ||
              currentQuestion.question_type === 'truefalse') && (
              <div className="d-flex flex-column gap-2">
                {currentQuestion.options && currentQuestion.options.map(option => {
                  const selected = answers[currentQuestion.id]?.option_id === option.id;
                  return (
                    <div
                      key={option.id}
                      className={`p-3 rounded border ${
                        selected ? 'border-success bg-success bg-opacity-10' : 'border-light bg-light'
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleMCQAnswer(currentQuestion.id, option.id)}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle border d-flex align-items-center justify-content-center"
                          style={{
                            width: '24px', height: '24px', minWidth: '24px',
                            borderColor: selected ? '#198754' : '#dee2e6',
                            backgroundColor: selected ? '#198754' : 'white'
                          }}
                        >
                          {selected && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                        </div>
                        {option.option_text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Short Answer */}
            {currentQuestion.question_type === 'short_answer' && (
              <div>
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Type your answer here..."
                  value={answers[currentQuestion.id]?.answer_text || ''}
                  onChange={e => handleShortAnswer(currentQuestion.id, e.target.value)}
                />
                <small className="text-muted">
                  This response will be reviewed by your branch manager.
                </small>
              </div>
            )}
          </div>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          {/* Navigation */}
          <div className="d-flex justify-content-between">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setCurrentQ(prev => prev - 1)}
              disabled={currentQ === 0}
            >
              ← Previous
            </button>
            {currentQ < totalQ - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setCurrentQ(prev => prev + 1)}
                disabled={!answers[currentQuestion.id]}
              >
                Next →
              </button>
            ) : (
              <button
                className="btn btn-success px-4"
                onClick={handleSubmitQuiz}
                disabled={!allAnswered()}
              >
                Review & Sign Declaration →
              </button>
            )}
          </div>

          {/* Question dots */}
          <div className="d-flex gap-1 mt-4 flex-wrap">
            {questions.map((q, i) => (
              <button
                key={q.id}
                className={`btn btn-sm rounded-circle p-0 ${
                  answers[q.id] ? 'btn-success' : i === currentQ ? 'btn-primary' : 'btn-outline-secondary'
                }`}
                style={{ width: '32px', height: '32px', fontSize: '12px' }}
                onClick={() => setCurrentQ(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}