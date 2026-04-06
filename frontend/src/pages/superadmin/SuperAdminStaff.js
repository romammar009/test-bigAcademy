import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function SuperAdminStaff() {
  const [staff, setStaff]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filterLocation, setFilter] = useState('all');
  const [locations, setLocations]   = useState([]);

  useEffect(() => {
    API.get('/users/')
      .then(res => {
        const users = res.data;
        setStaff(users);

        // Extract unique locations from the staff list
        const locs = [...new Map(
          users
            .filter(u => u.location)
            .map(u => [u.location.name, u.location])
        ).values()];
        setLocations(locs);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const roleBadge = (role) => {
    const badges = {
      'hr_tier1':    <span className="badge bg-danger">HR Team</span>,
      'hr_tier2':    <span className="badge bg-dark">HR Head</span>,
      'super_admin': <span className="badge bg-warning text-dark">Area Manager</span>,
      'admin':       <span className="badge bg-primary">Branch Manager</span>,
      'educator':    <span className="badge bg-success">Educator</span>,
    };
    return badges[role] || <span className="badge bg-secondary">{role}</span>;
  };

  const filteredStaff = filterLocation === 'all'
    ? staff
    : staff.filter(u => u.location && u.location.name === filterLocation);

  if (loading) return <p>Loading staff...</p>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Staff Across My Locations</h4>
        {/* Location filter */}
        <select
          className="form-select w-auto"
          value={filterLocation}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All Locations</option>
          {locations.map(loc => (
            <option key={loc.name} value={loc.name}>{loc.name}</option>
          ))}
        </select>
      </div>

      {/* Summary badges */}
      <div className="d-flex gap-3 mb-3">
        <span className="badge bg-secondary fs-6">
          Total: {filteredStaff.length}
        </span>
        <span className="badge bg-danger fs-6">
          ⚠️ Locked Quizzes: {filteredStaff.filter(u => u.has_locked_quiz).length}
        </span>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Location</th>
              <th>Last Login</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map(member => (
              <tr key={member.id}>
                <td className="fw-semibold">
                  {member.first_name} {member.last_name}
                </td>
                <td>{member.email}</td>
                <td>{roleBadge(member.role)}</td>
                <td>{member.location ? member.location.name : '—'}</td>
                <td>
                  {member.last_login_at
                    ? new Date(member.last_login_at).toLocaleDateString()
                    : 'Never'}
                </td>
                <td>
                  {member.has_locked_quiz && (
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
    </div>
  );
}