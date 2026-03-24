import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function AdminReports() {
  const [completionData, setCompletionData] = useState([]);
  const [staffData, setStaffData]           = useState([]);
  const [activeReport, setActiveReport]     = useState('completion');
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/reports/completion/'),
      API.get('/reports/staff/')
    ])
      .then(([completion, staff]) => {
        setCompletionData(completion.data);
        setStaffData(staff.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading reports...</p>;

  return (
    <div>
      <h4 className="mb-3">Reports</h4>

      {/* Report Toggle */}
      <div className="btn-group mb-4">
        <button
          className={`btn btn-sm ${activeReport === 'completion' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveReport('completion')}
        >
          Course Completion
        </button>
        <button
          className={`btn btn-sm ${activeReport === 'staff' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveReport('staff')}
        >
          Staff Progress
        </button>
      </div>

      {/* Course Completion Report */}
      {activeReport === 'completion' && (
        <div>
          <h5 className="mb-3">Course Completion Rates</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Course</th>
                  <th>Total Enrolled</th>
                  <th>Completed</th>
                  <th>In Progress</th>
                  <th>Not Started</th>
                  <th>Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {completionData.map(row => (
                  <tr key={row.course_id}>
                    <td className="fw-semibold">{row.course_title}</td>
                    <td>{row.total}</td>
                    <td><span className="badge bg-success">{row.completed}</span></td>
                    <td><span className="badge bg-primary">{row.in_progress}</span></td>
                    <td><span className="badge bg-secondary">{row.not_started}</span></td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: '8px' }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${row.completion_rate}%` }}
                          />
                        </div>
                        <small className="fw-bold">{row.completion_rate}%</small>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Progress Report */}
      {activeReport === 'staff' && (
        <div>
          <h5 className="mb-3">Staff Progress</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Total Courses</th>
                  <th>Completed</th>
                  <th>In Progress</th>
                  <th>Not Started</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {staffData.map(row => (
                  <tr key={row.user_id}>
                    <td className="fw-semibold">{row.name}</td>
                    <td>{row.email}</td>
                    <td>{row.location}</td>
                    <td>{row.total}</td>
                    <td><span className="badge bg-success">{row.completed}</span></td>
                    <td><span className="badge bg-primary">{row.in_progress}</span></td>
                    <td><span className="badge bg-secondary">{row.not_started}</span></td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: '8px' }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${row.total > 0 ? Math.round(row.completed / row.total * 100) : 0}%` }}
                          />
                        </div>
                        <small className="fw-bold">
                          {row.total > 0 ? Math.round(row.completed / row.total * 100) : 0}%
                        </small>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}