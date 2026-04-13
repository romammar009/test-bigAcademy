import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function HRManageUsers({ isExecutive }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [message, setMessage]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({
    email: '', first_name: '', last_name: '',
    role: 'educator', phone_number: '', password: ''
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = () => {
    API.get('/users/')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await API.post('/users/register/', form);
      setMessage('User registered successfully.');
      setShowForm(false);
      setForm({ email: '', first_name: '', last_name: '', role: 'educator', phone_number: '', password: '' });
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Registration failed.');
    }
  };

  const handleOffboard = async (u) => {
    if (!window.confirm(`Offboard ${u.first_name} ${u.last_name}?`)) return;
    try {
      await API.patch(`/users/${u.id}/offboard/`, { offboard_type: 'disabled' });
      setMessage(`${u.first_name} ${u.last_name} has been offboarded.`);
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not offboard user.');
    }
  };

  // Can this HR user offboard the target user?
  const canOffboard = (targetUser) => {
    // Cannot offboard yourself
    if (targetUser.email === currentUser.email) return false;
    // Only executives can offboard other HR users
    if (targetUser.role === 'hr' && !isExecutive) return false;
    return true;
  };

  const roleBadge = (role) => {
    const badges = {
      'hr':             <span className="badge bg-danger">HR</span>,
      'area_manager':   <span className="badge bg-warning text-dark">Area Manager</span>,
      'branch_manager': <span className="badge bg-primary">Branch Manager</span>,
      'educator':       <span className="badge bg-success">Educator</span>,
    };
    return badges[role] || <span className="badge bg-secondary">{role}</span>;
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Users</h4>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Onboard User'}
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      {/* Register Form */}
      {showForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5>Onboard New User</h5>
            <form onSubmit={handleRegister}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">First Name</label>
                  <input className="form-control" value={form.first_name}
                    onChange={e => setForm({ ...form, first_name: e.target.value })} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Last Name</label>
                  <input className="form-control" value={form.last_name}
                    onChange={e => setForm({ ...form, last_name: e.target.value })} required />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="educator">Educator</option>
                    <option value="branch_manager">Branch Manager</option>
                    <option value="area_manager">Area Manager</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone Number</label>
                  <input className="form-control" value={form.phone_number}
                    onChange={e => setForm({ ...form, phone_number: e.target.value })} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-danger">
                Onboard User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Location</th>
              <th>Last Login</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="fw-semibold">
                  {u.first_name} {u.last_name}
                  {u.role === 'hr' && u.is_hr_executive && (
                    <span className="ms-2 badge bg-danger">Executive</span>
                  )}
                </td>
                <td>{u.email}</td>
                <td>{roleBadge(u.role)}</td>
                <td>{u.location ? u.location.name : '—'}</td>
                <td>{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}</td>
                <td>
                  <span className={`badge ${u.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                    {u.status}
                  </span>
                </td>
                <td>
                  {canOffboard(u) ? (
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleOffboard(u)}
                    >
                      Offboard
                    </button>
                  ) : (
                    <span className="text-muted small">—</span>
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