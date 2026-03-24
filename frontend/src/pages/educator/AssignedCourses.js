import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function BrowseCourses() {
  const [courses, setCourses]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [enrolling, setEnrolling]   = useState(false);
  const [message, setMessage]       = useState('');

  useEffect(() => {
    API.get('/courses/browse/')
      .then(res => setCourses(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleEnrol = async (courseId) => {
    setEnrolling(true);
    try {
      await API.post(`/courses/${courseId}/enrol/`);
      // Remove from assigned list
      setCourses(courses.filter(c => c.id !== courseId));
      setSelected(null);
      setMessage('Successfully enrolled! Check My Learning tab.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Enrolment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <p>Loading assigned courses...</p>;

  // Course detail view
  if (selected) {
    return (
      <div>
        <button className="btn btn-link ps-0 mb-3" onClick={() => setSelected(null)}>
          ← Back to Assigned Courses
        </button>

        <div className="card shadow-sm">
          <div className="card-body">
            <h3>{selected.title}</h3>
            <p className="text-muted">{selected.description}</p>

            <div className="mb-3">
              <span className="badge bg-success me-2">v{selected.version}</span>
              {selected.estimated_minutes && (
                <span className="badge bg-secondary me-2">
                  {selected.estimated_minutes} mins
                </span>
              )}
              {selected.expiry_months ? (
                <span className="badge bg-warning text-dark">
                  Certificate valid for {selected.expiry_months} months
                </span>
              ) : (
                <span className="badge bg-info text-dark">
                  Certificate — No Expiry
                </span>
              )}
            </div>

            {/* Certificate notice */}
            <div className="alert alert-success py-2">
              🎓 You will receive a certificate upon completing this course.
            </div>

            {/* Table of contents */}
            <h5 className="mt-4">Course Content</h5>
            {selected.modules && selected.modules.length > 0 ? (
              selected.modules.map((mod, i) => (
                <div key={mod.id} className="mb-3">
                  <h6 className="fw-bold">
                    Module {i + 1}: {mod.title}
                  </h6>
                  <ul className="list-group">
                    {mod.lessons.map(lesson => (
                      <li key={lesson.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>
                          {lesson.content_type === 'video' && '🎬 '}
                          {lesson.content_type === 'pdf'   && '📄 '}
                          {lesson.content_type === 'quiz'  && '📝 '}
                          {lesson.title}
                        </span>
                        {lesson.duration_seconds && (
                          <span className="badge bg-light text-dark">
                            {Math.round(lesson.duration_seconds / 60)} mins
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-muted">No modules added yet.</p>
            )}

            {/* Quizzes */}
            {selected.quizzes && selected.quizzes.length > 0 && (
              <div className="mt-3">
                <h5>Assessments</h5>
                {selected.quizzes.map(quiz => (
                  <div key={quiz.id} className="alert alert-light border">
                    📝 {quiz.title} — Pass mark: {quiz.pass_mark_percent}%
                    ({quiz.attempt_limit} attempts allowed)
                  </div>
                ))}
              </div>
            )}

            {/* Enrol button */}
            <div className="mt-4">
              {message && <div className="alert alert-info py-2">{message}</div>}
              <button
                className="btn btn-success px-5"
                onClick={() => handleEnrol(selected.id)}
                disabled={enrolling}
              >
                {enrolling ? 'Enrolling...' : 'Enrol in this Course'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Course list view
  return (
    <div>
      <h4 className="mb-3">Assigned Courses</h4>
      {message && <div className="alert alert-success py-2">{message}</div>}
      {courses.length === 0 && (
        <p className="text-muted">No assigned courses pending enrolment.</p>
      )}
      <div className="row">
        {courses.map(course => (
          <div className="col-md-4 mb-4" key={course.id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <span className="badge bg-warning text-dark mb-2">Assigned</span>
                <h5 className="card-title">{course.title}</h5>
                <p className="card-text text-muted small">{course.description}</p>
                <div className="mb-2">
                  <span className="badge bg-success me-2">v{course.version}</span>
                  {course.estimated_minutes && (
                    <span className="badge bg-secondary">
                      {course.estimated_minutes} mins
                    </span>
                  )}
                </div>
              </div>
              <div className="card-footer bg-white">
                <button
                  className="btn btn-outline-success btn-sm w-100"
                  onClick={() => setSelected(course)}
                >
                  View Course
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}