import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses]         = useState([]);
  const [staff, setStaff]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [message, setMessage]         = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState({
    course_id:       '',
    assignment_type: 'all',
    target_value:    '',
    mandatory:       true,
    due_at:          '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignRes, courseRes, staffRes] = await Promise.all([
        API.get('/assignments/'),
        API.get('/courses/'),
        API.get('/users/'),
      ]);
      setAssignments(assignRes.data);
      setCourses(courseRes.data.filter(c => c.status === 'published'));
      setStaff(staffRes.data.filter(u => u.role === 'educator'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post('/assignments/create/', form);
      showMessage('Course assigned successfully.');
      setShowForm(false);
      setForm({ course_id: '', assignment_type: 'all', target_value: '', mandatory: true, due_at: '' });
      fetchData();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Could not create assignment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignment) => {
    if (!window.confirm(`Remove assignment for "${assignment.course_title}"?`)) return;
    try {
      await API.delete(`/assignments/${assignment.id}/delete/`);
      showMessage('Assignment removed.');
      fetchData();
    } catch (err) {
      showMessage('Could not remove assignment.');
    }
  };

  const assignmentLabel = (a) => {
    if (a.assignment_type === 'all') {
      return <span className="badge bg-primary">All Staff</span>;
    }
    if (a.assignment_type === 'user') {
      const member = staff.find(s => String(s.id) === String(a.target_value));
      return <span className="badge bg-info text-dark">
        {member ? `${member.first_name} ${member.last_name}` : `User #${a.target_value}`}
      </span>;
    }
    return <span className="badge bg-secondary">{a.target_value}</span>;
  };

  if (loading) return <p>Loading assignments...</p>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Course Assignments</h4>
        <button className="btn btn-primary btn-sm"
          onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Assignment'}
        </button>
      </div>

      {message && <div className="alert alert-info py-2 mb-3">{message}</div>}

      {/* Assignment Form */}
      {showForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5>Assign Course</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Course</label>
                  <select className="form-select" value={form.course_id}
                    onChange={e => setForm({ ...form, course_id: e.target.value })} required>
                    <option value="">Select a course...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Assign To</label>
                  <select className="form-select" value={form.assignment_type}
                    onChange={e => setForm({ ...form, assignment_type: e.target.value, target_value: '' })}>
                    <option value="all">All Staff</option>
                    <option value="user">Individual</option>
                  </select>
                </div>
                {form.assignment_type === 'user' && (
                  <div className="col-md-3">
                    <label className="form-label">Select Staff Member</label>
                    <select className="form-select" value={form.target_value}
                      onChange={e => setForm({ ...form, target_value: e.target.value })} required>
                      <option value="">Select a person...</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.first_name} {s.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="col-md-3">
                  <label className="form-label">Due Date (optional)</label>
                  <input type="date" className="form-control" value={form.due_at}
                    onChange={e => setForm({ ...form, due_at: e.target.value })} />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox"
                      checked={form.mandatory}
                      onChange={e => setForm({ ...form, mandatory: e.target.checked })}
                      id="mandatory" />
                    <label className="form-check-label" htmlFor="mandatory">Mandatory</label>
                  </div>
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-3" disabled={saving}>
                {saving ? 'Assigning...' : 'Assign Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assignments Table */}
      {assignments.length === 0 ? (
        <div className="text-center text-muted py-5">
          <div style={{ fontSize: '2.5rem' }}>📋</div>
          <p>No assignments yet. Create one above.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Course</th>
                <th>Assigned To</th>
                <th>Mandatory</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id}>
                  <td className="fw-semibold">{a.course_title}</td>
                  <td>{assignmentLabel(a)}</td>
                  <td>{a.mandatory
                    ? <span className="badge bg-danger">Mandatory</span>
                    : <span className="badge bg-secondary">Optional</span>}
                  </td>
                  <td>{a.due_at ? new Date(a.due_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <button className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(a)}>
                      Remove
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