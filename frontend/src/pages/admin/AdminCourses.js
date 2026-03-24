import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function AdminCourses() {
  const [courses, setCourses]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [message, setMessage]     = useState('');
  const [form, setForm]           = useState({
    title: '', description: '', version: '1.0',
    estimated_minutes: '', expiry_months: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = () => {
    API.get('/courses/')
      .then(res => setCourses(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.patch(`/courses/${editing.id}/`, form);
        setMessage('Course updated successfully.');
      } else {
        await API.post('/courses/', form);
        setMessage('Course created successfully.');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ title: '', description: '', version: '1.0', estimated_minutes: '', expiry_months: '' });
      fetchCourses();
    } catch (err) {
      setMessage('Something went wrong.');
    }
  };

  const handleEdit = (course) => {
    setEditing(course);
    setForm({
      title:             course.title,
      description:       course.description || '',
      version:           course.version,
      estimated_minutes: course.estimated_minutes || '',
      expiry_months:     course.expiry_months || ''
    });
    setShowForm(true);
  };

  const handleArchive = async (course) => {
    if (!window.confirm(`Archive "${course.title}"?`)) return;
    try {
      await API.delete(`/courses/${course.id}/`);
      setMessage('Course archived.');
      fetchCourses();
    } catch (err) {
      setMessage('Could not archive course.');
    }
  };

  const handlePublishToggle = async (course) => {
  const newStatus = course.status === 'published' ? 'draft' : 'published';
  try {
    await API.patch(`/courses/${course.id}/`, { status: newStatus });
    setMessage(`Course ${newStatus === 'published' ? 'published' : 'unpublished'} successfully.`);
    fetchCourses();
  } catch (err) {
    setMessage('Could not update course status.');
  }
};

  const statusBadge = (status) => {
    if (status === 'published') return <span className="badge bg-success">Published</span>;
    if (status === 'draft')     return <span className="badge bg-warning text-dark">Draft</span>;
    return <span className="badge bg-secondary">Archived</span>;
  };

  if (loading) return <p>Loading courses...</p>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Courses</h4>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setShowForm(!showForm); setEditing(null);
            setForm({ title: '', description: '', version: '1.0', estimated_minutes: '', expiry_months: '' });
          }}
        >
          {showForm ? 'Cancel' : '+ New Course'}
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      {/* Course Form */}
      {showForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5>{editing ? 'Edit Course' : 'New Course'}</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input className="form-control" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Version</label>
                  <input className="form-control" value={form.version}
                    onChange={e => setForm({ ...form, version: e.target.value })} required />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Estimated Minutes</label>
                  <input type="number" className="form-control" value={form.estimated_minutes}
                    onChange={e => setForm({ ...form, estimated_minutes: e.target.value })} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Expiry Months</label>
                  <input type="number" className="form-control" value={form.expiry_months}
                    onChange={e => setForm({ ...form, expiry_months: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                {editing ? 'Update Course' : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Course List */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Title</th>
              <th>Version</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Expiry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course.id}>
                <td className="fw-semibold">{course.title}</td>
                <td>v{course.version}</td>
                <td>{statusBadge(course.status)}</td>
                <td>{course.estimated_minutes ? `${course.estimated_minutes} mins` : '—'}</td>
                <td>{course.expiry_months ? `${course.expiry_months} months` : 'No expiry'}</td>
                <td>
                  <button className="btn btn-outline-primary btn-sm me-2"
                    onClick={() => handleEdit(course)}>
                    Edit
                  </button>
                  <button
                    className={`btn btn-sm me-2 ${course.status === 'published' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                    onClick={() => handlePublishToggle(course)}>
                    {course.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button className="btn btn-outline-danger btn-sm"
                    onClick={() => handleArchive(course)}>
                    Archive
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}