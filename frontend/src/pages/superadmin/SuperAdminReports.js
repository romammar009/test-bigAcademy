import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function SuperAdminReports() {
  const [completionData, setCompletionData] = useState([]);
  const [staffData, setStaffData]           = useState([]);
  const [activeReport, setActiveReport]     = useState('completion');
  const [filterLocation, setFilter]         = useState('all');
  const [locations, setLocations]           = useState([]);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/reports/completion/'),
      API.get('/reports/staff/')
    ]).then(([comp, staff]) => {
      setCompletionData(comp.data);
      setStaffData(staff.data);

      // Extract unique locations from staff
      const locs = [...new Set(staff.data.map(s => s.location).filter(Boolean))];
      setLocations(locs);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredStaff = filterLocation === 'all'
    ? staffData
    : staffData.filter(s => s.location === filterLocation);

  if (loading) return <p>Loading reports...</p>;

  return (
    <div>
      <h4 className="mb-3">Reports</h4>

      <div className="btn-group mb-4">
        <button
          className={`btn btn-sm ${activeReport === 'completion' ? 'btn-warning' : 'btn-outline-warning'}`}
          onClick={() => setActiveReport('completion')}
        >
          Course Completion
        </button>
        <button
          className={`btn btn-sm ${activeReport === 'staff' ? 'btn-warning' : 'btn-outline-warning'}`}
          onClick={() => setActiveReport('staff')}
        >
          Staff Progress
        </button>
      </div>

      {/* Course Completion */}
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
                          className="progress-bar bg-warning"
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

      {/* Staff Progress */}
      {activeReport === 'staff' && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted">Showing staff across your assigned locations</span>
            <select
              className="form-select w-auto"
              value={filterLocation}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Completed</th>
                  <th>In Progress</th>
                  <th>Not Started</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(staff => (
                  <tr key={staff.user_id}>
                    <td className="fw-semibold">{staff.name}</td>
                    <td>{staff.location}</td>
                    <td><span className="badge bg-success">{staff.completed}</span></td>
                    <td><span className="badge bg-warning text-dark">{staff.in_progress}</span></td>
                    <td><span className="badge bg-secondary">{staff.not_started}</span></td>
                    <td>
                      {staff.has_locked_quiz && (
                        <span className="badge bg-danger">⚠️ Quiz Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}