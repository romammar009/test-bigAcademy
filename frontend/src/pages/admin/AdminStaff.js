import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function AdminStaff() {
  const [staff, setStaff]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/users/')
      .then(res => setStaff(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const roleBadge = (role) => {
    if (role === 'super_admin') return <span className="badge bg-danger">Super Admin</span>;
    if (role === 'admin')       return <span className="badge bg-primary">Admin</span>;
    return <span className="badge bg-success">Educator</span>;
  };

  if (loading) return <p>Loading staff...</p>;

  return (
    <div>
      <h4 className="mb-3">Staff</h4>
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Location</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}