import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function HRReports() {
  const [completionData, setCompletionData] = useState([]);
  const [staffData, setStaffData]           = useState([]);
  const [activeReport, setActiveReport]     = useState('completion');
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/reports/completion/'),
      API.get('/reports/staff/')
    ]).then(([comp, staff]) => {
      setCompletionData(comp.data);
      setStaffData(staff.data);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading reports...</p>;

  return (
    <div>
      <h4 className="mb-3">Reports</h4>

      {/* Report toggle */}
      <div className="btn-group mb-4">
        <button
          className={`btn btn-sm ${activeReport === 'completion' ? 'btn-danger' : 'btn-outline-danger'}`}
          onClick={() => setActiveReport('completion')}
        >
          Course Completion
        </button>
        <button
          className={`btn btn-sm ${activeReport === 'staff' ? 'btn-danger' : 'btn-outline-danger'}`}
          onClick={() => setActiveReport('staff')}
        >
          Staff Progress
        </button>
      </div>

      {/* Course Completion Report */}
      {activeReport === 'completion' && (
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
              {completionData.map(course => (
                <tr key={course.course_id}>
                  <td className="fw-semibold">{course.course_title}</td>
                  <td>{course.total}</td>
                  <td><span className="badge bg-success">{course.completed}</span></td>
                  <td><span className="badge bg-warning text-dark">{course.in_progress}</span></td>
                  <td><span className="badge bg-secondary">{course.not_started}</span></td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="progress flex-grow-1" style={{ height: '8px' }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${course.completion_rate}%` }}
                        />
                      </div>
                      <small>{course.completion_rate}%</small>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff Progress Report */}
      {activeReport === 'staff' && (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Location</th>
                <th>Completed</th>
                <th>In Progress</th>
                <th>Not Started</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {staffData.map(staff => (
                <tr key={staff.user_id}>
                  <td className="fw-semibold">{staff.name}</td>
                  <td>{staff.email}</td>
                  <td>{staff.location}</td>
                  <td><span className="badge bg-success">{staff.completed}</span></td>
                  <td><span className="badge bg-warning text-dark">{staff.in_progress}</span></td>
                  <td><span className="badge bg-secondary">{staff.not_started}</span></td>
                  <td>
                    {staff.has_locked_quiz && (
                      <span className="badge bg-danger" title="Has locked quiz attempts">
                        ⚠️ Quiz Locked
                      </span>
                    )}
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