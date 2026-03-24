import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function MyLearning() {
  const [enrolments, setEnrolments] = useState([]);
  const [progress, setProgress]     = useState({});
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    API.get('/my-learning/')
      .then(res => {
        setEnrolments(res.data);
        // Fetch progress for each enrolled course
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
  }, []);

  const statusBadge = (status) => {
    if (status === 'completed')   return <span className="badge bg-success">Completed</span>;
    if (status === 'in_progress') return <span className="badge bg-primary">In Progress</span>;
    return <span className="badge bg-secondary">Not Started</span>;
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h4 className="mb-3">My Learning</h4>
      {enrolments.length === 0 && (
        <p className="text-muted">No enrolments yet.</p>
      )}
      <div className="row">
        {enrolments.map(enrolment => {
          const pct = progress[enrolment.course.id] ?? 0;
          return (
            <div className="col-md-4 mb-4" key={enrolment.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{enrolment.course.title}</h5>
                  <p className="text-muted small">{enrolment.course.description}</p>
                  <div className="mb-3">
                    {statusBadge(enrolment.status)}
                    <span className="badge bg-light text-dark ms-2">
                      {enrolment.source}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="d-flex align-items-center gap-2">
                    <div className="progress flex-grow-1" style={{ height: '10px' }}>
                      <div
                        className={`progress-bar ${pct === 100 ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <small className="text-muted fw-bold">{pct}%</small>
                  </div>

                  {enrolment.started_at && (
                    <p className="small text-muted mt-2 mb-0">
                      Started: {new Date(enrolment.started_at).toLocaleDateString()}
                    </p>
                  )}
                  {enrolment.completed_at && (
                    <p className="small text-muted mb-0">
                      Completed: {new Date(enrolment.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="card-footer bg-white">
                  <small className="text-muted">
                    v{enrolment.course.version}
                    {enrolment.course.expiry_months &&
                      ` · Expires in ${enrolment.course.expiry_months} months`}
                  </small>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}