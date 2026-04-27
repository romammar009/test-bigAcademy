import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Clock, Award, AlertCircle, PenLine, ClipboardList
} from 'lucide-react';

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
- Program & Practice
- Child Protection and Child Safety
- Supervision & SAFE PATH
- Personal Devices
- Medical Practices
- Sun Safety
- First Aid & Incident Management
- Collection & Attendance
- Excursions & Environment
- Code of Conduct
- Reportable Conduct
- Behaviour Support

I acknowledge my responsibility to follow these procedures to ensure the health, 
safety and wellbeing of children in my care.`;

  useEffect(() => { startAttempt(); }, []);

  const startAttempt = async () => {
    try {
      const res = await API.post(`/quizzes/${quiz.id}/attempt/`);
      setAttempt(res.data);
      setQuestions(res.data.questions || []);
      setStage('quiz');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start quiz.');
      setStage('error');
    }
  };

  const handleMCQAnswer    = (questionId, optionId) => setAnswers(prev => ({ ...prev, [questionId]: { option_id: optionId } }));
  const handleShortAnswer  = (questionId, text)     => setAnswers(prev => ({ ...prev, [questionId]: { answer_text: text } }));

  const allAnswered = () => questions.every(q => {
    const ans = answers[q.id];
    if (q.question_type === 'mcq' || q.question_type === 'single_choice' || q.question_type === 'truefalse') return ans && ans.option_id;
    if (q.question_type === 'short_answer') return ans && ans.answer_text?.trim().length > 0;
    return false;
  });

  const handleSubmitQuiz = () => {
    if (!allAnswered()) { setError('Please answer all questions before proceeding.'); return; }
    setStage('declaration');
    setError('');
  };

  const handleSubmitFinal = async () => {
    if (!declaration.signed) { setError('Please confirm the declaration.'); return; }
    if (!declaration.name.trim()) { setError('Please type your full name to sign the declaration.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const answersPayload = questions.map(q => {
        const ans = answers[q.id];
        if (q.question_type === 'mcq' || q.question_type === 'single_choice' || q.question_type === 'truefalse') return { question_id: q.id, option_id: ans.option_id };
        return { question_id: q.id, answer_text: ans.answer_text };
      });
      const res = await API.post(`/attempts/${attempt.attempt_id}/submit/`, {
        answers: answersPayload, declaration_signed: true, declaration_name: declaration.name.trim(),
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
  const progressPct     = totalQ > 0 ? Math.round(((currentQ + 1) / totalQ) * 100) : 0;

  const S = {
    backBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: 'none', border: 'none', color: '#0891b2',
      fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
      padding: '0', marginBottom: '20px',
    },
    card: {
      background: '#fff', borderRadius: '12px', padding: '28px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
    },
    quizTitle:    { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '20px' },
    progressRow:  { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' },
    progressBar:  { height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', flex: 1 },
    progressFill: (pct) => ({ height: '100%', width: `${pct}%`, background: '#0891b2', borderRadius: '10px', transition: 'width 0.3s ease' }),
    progressText: { fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', whiteSpace: 'nowrap' },
    questionText: { fontSize: '1rem', fontWeight: '600', color: '#0f172a', marginBottom: '20px', lineHeight: 1.5 },
    optionItem: (isSelected) => ({
      padding: '12px 16px', borderRadius: '8px', marginBottom: '8px',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
      border: `1px solid ${isSelected ? '#0891b2' : '#e2e8f0'}`,
      background: isSelected ? '#ecfeff' : '#fff',
      transition: 'all 0.15s',
    }),
    optionCircle: (isSelected) => ({
      width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
      border: `2px solid ${isSelected ? '#0891b2' : '#cbd5e1'}`,
      background: isSelected ? '#0891b2' : '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }),
    optionText: (isSelected) => ({
      fontSize: '0.875rem', color: isSelected ? '#0e7490' : '#334155', fontWeight: isSelected ? '600' : '400',
    }),
    textarea: {
      width: '100%', padding: '12px 14px', borderRadius: '8px',
      border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#334155',
      resize: 'vertical', minHeight: '120px', fontFamily: 'inherit',
      outline: 'none', lineHeight: 1.6, boxSizing: 'border-box',
    },
    textareaHint: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' },
    navRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' },
    navBtn: (disabled, primary) => ({
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '9px 18px', fontSize: '0.85rem', fontWeight: '600',
      borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
      border: 'none', transition: 'all 0.15s',
      background: disabled ? '#f1f5f9' : primary ? '#0891b2' : '#f8fafc',
      color: disabled ? '#94a3b8' : primary ? '#fff' : '#475569',
    }),
    dotsRow:  { display: 'flex', gap: '6px', marginTop: '20px', flexWrap: 'wrap' },
    dot: (answered, isCurrent) => ({
      width: '30px', height: '30px', borderRadius: '50%', fontSize: '0.75rem',
      fontWeight: '600', cursor: 'pointer', border: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: answered ? '#0891b2' : isCurrent ? '#ecfeff' : '#f1f5f9',
      color: answered ? '#fff' : isCurrent ? '#0891b2' : '#94a3b8',
      outline: isCurrent ? '2px solid #0891b2' : 'none',
    }),
    error: {
      padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
      fontSize: '0.85rem', fontWeight: '500',
      background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
      display: 'flex', alignItems: 'center', gap: '8px',
    },
    // Result
    resultCenter: { textAlign: 'center', padding: '16px 0 24px' },
    resultIcon:   { marginBottom: '12px' },
    resultTitle:  (passed) => ({ fontSize: '1.3rem', fontWeight: '800', color: passed ? '#059669' : '#ef4444', marginBottom: '6px' }),
    resultSub:    { fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' },
    pendingBox: {
      padding: '14px 16px', borderRadius: '8px', background: '#eff6ff',
      color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '0.875rem', marginTop: '12px',
    },
    lockedBox: {
      padding: '14px 16px', borderRadius: '8px', background: '#fefce8',
      color: '#d97706', border: '1px solid #fde68a', fontSize: '0.875rem', marginTop: '12px',
    },
    answerReview: { marginTop: '24px' },
    reviewTitle:  { fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
    reviewItem: (correct) => ({
      padding: '14px 16px', borderRadius: '10px', marginBottom: '10px',
      background: correct ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${correct ? '#bbf7d0' : '#fecaca'}`,
    }),
    reviewQ:    { fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' },
    reviewAns:  { fontSize: '0.82rem', color: '#64748b', marginLeft: '22px' },
    actionRow:  { display: 'flex', gap: '10px', marginTop: '24px' },
    // Declaration
    declText: {
      padding: '16px', background: '#f8fafc', borderRadius: '8px',
      fontSize: '0.82rem', color: '#475569', lineHeight: 1.7,
      whiteSpace: 'pre-line', marginBottom: '20px',
      border: '1px solid #e2e8f0', maxHeight: '280px', overflowY: 'auto',
    },
    checkRow: { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px', cursor: 'pointer' },
    checkbox: { width: '18px', height: '18px', flexShrink: 0, accentColor: '#0891b2', marginTop: '2px' },
    checkLabel: { fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', lineHeight: 1.5 },
    nameInput: {
      width: '100%', padding: '10px 14px', borderRadius: '8px',
      border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#334155',
      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    },
    submitBtn: (disabled) => ({
      padding: '10px 28px', fontSize: '0.875rem', fontWeight: '600',
      borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
      border: 'none', background: disabled ? '#f1f5f9' : '#0891b2',
      color: disabled ? '#94a3b8' : '#fff',
      display: 'inline-flex', alignItems: 'center', gap: '7px',
    }),
  };

  // ── Error ────────────────────────────────────────────────────────
  if (stage === 'error') return (
    <div>
      <button style={S.backBtn} onClick={onBack}><ChevronLeft size={16} /> Back</button>
      <div style={S.error}><AlertCircle size={15} />{error}</div>
    </div>
  );

  // ── Loading ──────────────────────────────────────────────────────
  if (stage === 'loading') return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading quiz...</p>;

  // ── Result ───────────────────────────────────────────────────────
  if (stage === 'result') {
    const isPending = result.grading_status === 'pending';
    const passed    = result.passed;
    return (
      <div>
        <div style={S.card}>
          <div style={S.resultCenter}>
            {isPending ? (
              <>
                <div style={S.resultIcon}><Clock size={48} color="#2563eb" /></div>
                <div style={{ ...S.resultTitle(true), color: '#2563eb' }}>Submitted Successfully!</div>
                <div style={S.resultSub}>Your MCQ score: {result.mcq_score}%</div>
                <div style={S.pendingBox}>Your short answers are pending review. You'll be notified once graded.</div>
              </>
            ) : passed ? (
              <>
                <div style={S.resultIcon}><Award size={48} color="#059669" /></div>
                <div style={S.resultTitle(true)}>Congratulations! You Passed!</div>
                <div style={S.resultSub}>You scored <strong>{result.mcq_score}%</strong> — pass mark was <strong>{result.pass_mark}%</strong></div>
              </>
            ) : (
              <>
                <div style={S.resultIcon}><XCircle size={48} color="#ef4444" /></div>
                <div style={S.resultTitle(false)}>Not Quite There</div>
                <div style={S.resultSub}>You scored <strong>{result.mcq_score}%</strong> — pass mark is <strong>{result.pass_mark}%</strong></div>
                {result.locked && (
                  <div style={S.lockedBox}>You have used all {quiz.attempt_limit} attempts. Please request an unlock from your manager.</div>
                )}
              </>
            )}
          </div>

          {!isPending && (
            <div style={S.answerReview}>
              <div style={S.reviewTitle}><ClipboardList size={16} color="#0891b2" /> Answer Review</div>
              {questions.map((q, index) => {
                if (q.question_type === 'short_answer') return null;
                const userAnswer      = answers[q.id];
                const selectedId      = userAnswer?.option_id;
                const correctInfo     = result.correct_answers?.[q.id];
                const correctOptionId = correctInfo?.correct_option_id;
                const selectedOption  = q.options?.find(o => o.id === selectedId);
                const isCorrect       = selectedId === correctOptionId;
                return (
                  <div key={q.id} style={S.reviewItem(isCorrect)}>
                    <div style={S.reviewQ}>
                      {isCorrect ? <CheckCircle size={15} color="#059669" style={{ flexShrink: 0, marginTop: '1px' }} /> : <XCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />}
                      Q{index + 1}: {q.question_text}
                    </div>
                    <div style={S.reviewAns}>
                      <span style={{ color: '#94a3b8', fontWeight: '600' }}>Your answer: </span>
                      <span style={{ color: isCorrect ? '#059669' : '#ef4444', fontWeight: '600' }}>{selectedOption?.option_text || 'No answer'}</span>
                    </div>
                    {!isCorrect && correctInfo && (
                      <div style={{ ...S.reviewAns, marginTop: '4px' }}>
                        <span style={{ color: '#94a3b8', fontWeight: '600' }}>Correct: </span>
                        <span style={{ color: '#059669', fontWeight: '600' }}>{correctInfo.correct_option_text}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={S.actionRow}>
            <button style={S.navBtn(false, false)} onClick={onBack}>
              <ChevronLeft size={15} /> Back to Course
            </button>
            {!isPending && !passed && !result.locked && (
              <button style={S.navBtn(false, true)} onClick={() => { setStage('loading'); setAnswers({}); setCurrentQ(0); startAttempt(); }}>
                Try Again
              </button>
            )}
            {passed && (
              <button style={S.navBtn(false, true)} onClick={onComplete}>
                Continue <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Declaration ──────────────────────────────────────────────────
  if (stage === 'declaration') return (
    <div>
      <div style={S.card}>
        <div style={{ ...S.quizTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={18} color="#0891b2" /> Staff Declaration
        </div>
        <div style={S.declText}>{DECLARATION_TEXT}</div>
        <label style={S.checkRow}>
          <input type="checkbox" style={S.checkbox} checked={declaration.signed}
            onChange={e => setDeclaration(prev => ({ ...prev, signed: e.target.checked }))} />
          <span style={S.checkLabel}>I confirm that I have read and understood the above declaration.</span>
        </label>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
            Type your full name to sign:
          </label>
          <input type="text" style={S.nameInput} placeholder="Your full name"
            value={declaration.name} onChange={e => setDeclaration(prev => ({ ...prev, name: e.target.value }))} />
        </div>
        {error && <div style={S.error}><AlertCircle size={14} />{error}</div>}
        <div style={S.actionRow}>
          <button style={S.navBtn(false, false)} onClick={() => setStage('quiz')}>
            <ChevronLeft size={15} /> Back to Quiz
          </button>
          <button style={S.submitBtn(submitting)} onClick={handleSubmitFinal} disabled={submitting}>
            <CheckCircle size={15} />
            {submitting ? 'Submitting...' : 'Submit & Sign'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Quiz Screen ──────────────────────────────────────────────────
  return (
    <div>
      <button style={S.backBtn} onClick={onBack}><ChevronLeft size={16} /> Back to Course</button>
      <div style={S.card}>
        <div style={S.quizTitle}>{quiz.title}</div>

        <div style={S.progressRow}>
          <div style={S.progressBar}>
            <div style={S.progressFill(progressPct)} />
          </div>
          <span style={S.progressText}>Question {currentQ + 1} of {totalQ}</span>
        </div>

        <div style={S.questionText}>{currentQ + 1}. {currentQuestion.question_text}</div>

        {(currentQuestion.question_type === 'mcq' || currentQuestion.question_type === 'single_choice' || currentQuestion.question_type === 'truefalse') && (
          <div>
            {currentQuestion.options?.map(option => {
              const isSelected = answers[currentQuestion.id]?.option_id === option.id;
              return (
                <div key={option.id} style={S.optionItem(isSelected)} onClick={() => handleMCQAnswer(currentQuestion.id, option.id)}>
                  <div style={S.optionCircle(isSelected)}>
                    {isSelected && <CheckCircle size={12} color="#fff" />}
                  </div>
                  <span style={S.optionText(isSelected)}>{option.option_text}</span>
                </div>
              );
            })}
          </div>
        )}

        {currentQuestion.question_type === 'short_answer' && (
          <div>
            <textarea
              style={S.textarea}
              rows={5}
              placeholder="Type your answer here..."
              value={answers[currentQuestion.id]?.answer_text || ''}
              onChange={e => handleShortAnswer(currentQuestion.id, e.target.value)}
            />
            <div style={S.textareaHint}>This response will be reviewed by your manager.</div>
          </div>
        )}

        {error && <div style={{ ...S.error, marginTop: '16px' }}><AlertCircle size={14} />{error}</div>}

        <div style={S.navRow}>
          <button style={S.navBtn(currentQ === 0, false)} onClick={() => setCurrentQ(prev => prev - 1)} disabled={currentQ === 0}>
            <ChevronLeft size={15} /> Previous
          </button>
          {currentQ < totalQ - 1 ? (
            <button style={S.navBtn(!answers[currentQuestion.id], true)} onClick={() => setCurrentQ(prev => prev + 1)} disabled={!answers[currentQuestion.id]}>
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button style={S.navBtn(!allAnswered(), true)} onClick={handleSubmitQuiz} disabled={!allAnswered()}>
              Review & Sign <ChevronRight size={15} />
            </button>
          )}
        </div>

        <div style={S.dotsRow}>
          {questions.map((q, i) => (
            <button key={q.id} style={S.dot(!!answers[q.id], i === currentQ)} onClick={() => setCurrentQ(i)}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}