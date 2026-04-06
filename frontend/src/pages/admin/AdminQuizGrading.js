import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function AdminQuizGrading() {
  const [attempts, setAttempts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [grades, setGrades]           = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [message, setMessage]         = useState('');

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

  const allGraded = () => {
    if (!selected) return false;
    return selected.short_answers.every(sa => grades[sa.answer_id] !== undefined);
  };

  const handleSubmitGrades = async () => {
    if (!allGraded()) {
      setMessage('Please grade all short answers before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const gradesPayload = Object.entries(grades).map(([answerId, isCorrect]) => ({
        answer_id:  parseInt(answerId),
        is_correct: isCorrect,
      }));

      await API.patch(`/attempts/${selected.attempt_id}/grade/`, {
        grades: gradesPayload
      });

      setMessage(`Grading submitted for ${selected.user_name}.`);
      setSelected(null);
      setGrades({});
      fetchPending();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not submit grades.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading pending submissions...</p>;

  // ── Selected attempt — grading view ─────────────────────────────
  if (selected) {
    return (
      <div>
        <button className="btn btn-link ps-0 mb-3" onClick={() => {
          setSelected(null);
          setGrades({});
          setMessage('');
        }}>
          ← Back to Pending List
        </button>

        <div className="card shadow-sm">
          <div className="card-body">
            <h4>Grading: {selected.quiz_title}</h4>
            <p className="text-muted mb-1">
              <strong>Staff:</strong> {selected.user_name} ({selected.user_email})
            </p>
            <p className="text-muted mb-3">
              <strong>Submitted:</strong> {new Date(selected.submitted_at).toLocaleDateString()}
              &nbsp;·&nbsp;
              <strong>MCQ Score:</strong> {selected.mcq_score}%
            </p>

            <hr />
            <h5 className="mb-3">Short Answer Responses</h5>

            {selected.short_answers.map((sa, index) => (
              <div key={sa.answer_id} className="card mb-3 border">
                <div className="card-body">
                  <p className="fw-semibold mb-2">
                    Q{index + 1}: {sa.question_text}
                  </p>
                  <div className="p-3 bg-light rounded mb-3">
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {sa.answer_text || <span className="text-muted fst-italic">No answer provided</span>}
                    </p>
                  </div>

                  <div className="d-flex gap-3">
                    <button
                      className={`btn btn-sm ${grades[sa.answer_id] === true ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => handleGradeChange(sa.answer_id, true)}
                    >
                      ✓ Satisfactory
                    </button>
                    <button
                      className={`btn btn-sm ${grades[sa.answer_id] === false ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => handleGradeChange(sa.answer_id, false)}
                    >
                      ✗ Unsatisfactory
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {message && <div className="alert alert-info py-2">{message}</div>}

            <div className="mt-3">
              <button
                className="btn btn-primary px-5"
                onClick={handleSubmitGrades}
                disabled={submitting || !allGraded()}
              >
                {submitting ? 'Submitting...' : 'Submit Grades'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Pending list view ────────────────────────────────────────────
  return (
    <div>
      <h4 className="mb-3">
        Quiz Grading
        {attempts.length > 0 && (
          <span className="badge bg-danger ms-2">{attempts.length} pending</span>
        )}
      </h4>

      {message && <div className="alert alert-success py-2">{message}</div>}

      {attempts.length === 0 ? (
        <div className="alert alert-light border">
          No submissions pending review at this time.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Staff Member</th>
                <th>Quiz</th>
                <th>Submitted</th>
                <th>MCQ Score</th>
                <th>Short Answers</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map(att => (
                <tr key={att.attempt_id}>
                  <td className="fw-semibold">{att.user_name}</td>
                  <td>{att.quiz_title}</td>
                  <td>{new Date(att.submitted_at).toLocaleDateString()}</td>
                  <td>
                    <span className="badge bg-secondary">{att.mcq_score}%</span>
                  </td>
                  <td>
                    <span className="badge bg-warning text-dark">
                      {att.short_answers.length} to review
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelected(att);
                        setGrades({});
                        setMessage('');
                      }}
                    >
                      Grade →
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