import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import AdminCourseBuilder from '../admin/AdminCourseBuilder';
import { BookOpen, Plus, X, Edit, Archive, Eye, EyeOff } from 'lucide-react';

export default function CoursesManager({ accentColor = '#1a1f8c' }) {
  const [courses, setCourses]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showForm, setShowForm]             = useState(false);
  const [editing, setEditing]               = useState(null);
  const [message, setMessage]               = useState({ text: '', type: '' });
  const [managingCourse, setManagingCourse] = useState(null);
  const [form, setForm]                     = useState({
    title: '', description: '', version: '1.0',
    estimated_minutes: '', expiry_months: ''
  });

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = () => {
    API.get('/courses/')
      .then(res => setCourses(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.patch(`/courses/${editing.id}/`, form);
        showMsg('Course updated successfully.');
      } else {
        await API.post('/courses/', form);
        showMsg('Course created successfully.');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ title: '', description: '', version: '1.0', estimated_minutes: '', expiry_months: '' });
      fetchCourses();
    } catch (err) {
      const detail = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;
      showMsg(`Error: ${detail}`, 'error');
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
      showMsg('Course archived.');
      fetchCourses();
    } catch (err) {
      showMsg('Could not archive course.', 'error');
    }
  };

  const handlePublishToggle = async (course) => {
    const action = course.status === 'published' ? 'unpublish' : 'publish';
    try {
      await API.patch(`/courses/${course.id}/publish/`, { action });
      showMsg(`Course ${action}ed successfully.`);
      fetchCourses();
    } catch (err) {
      showMsg('Could not update course status.', 'error');
    }
  };

  const S = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title:  { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' },
    newBtn: (isOpen) => ({
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600',
      cursor: 'pointer', border: 'none',
      background: isOpen ? '#f1f5f9' : accentColor,
      color: isOpen ? '#64748b' : '#fff',
    }),
    message: (type) => ({
      padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
      fontSize: '0.85rem', fontWeight: '500',
      background: type === 'success' ? '#f0fdf4' : '#fef2f2',
      color:      type === 'success' ? '#059669' : '#ef4444',
      border:     `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
    }),
    formCard: {
      background: '#fff', borderRadius: '12px', padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', marginBottom: '20px',
    },
    formTitle: { fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '18px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
    formRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' },
    label:     { fontSize: '0.78rem', fontWeight: '600', color: '#374151' },
    input:     { padding: '9px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b', outline: 'none', fontFamily: 'inherit' },
    textarea:  { padding: '9px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b', outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: '80px' },
    submitBtn: { padding: '9px 20px', background: accentColor, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' },
    table:  { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    th:     { padding: '12px 16px', fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' },
    td:     { padding: '13px 16px', fontSize: '0.875rem', color: '#334155', borderBottom: '1px solid #f8fafc' },
    nameTd: { fontWeight: '600', color: '#0f172a' },
    statusBadge: (status) => {
      const config = {
        published: { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0', label: 'Published' },
        draft:     { bg: '#fefce8', color: '#d97706', border: '#fde68a', label: 'Draft'     },
        archived:  { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: 'Archived'  },
      };
      const c = config[status] || config.archived;
      return <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{c.label}</span>;
    },
    actionBtn: (bg, color, border) => ({
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '6px', width: '30px', height: '30px',
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: '6px', cursor: 'pointer', marginRight: '4px',
    }),
  };

  if (managingCourse) {
    return (
      <AdminCourseBuilder
        course={managingCourse}
        onBack={() => { setManagingCourse(null); fetchCourses(); }}
      />
    );
  }

  if (loading) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading courses...</p>;

  return (
    <div>
      <div style={S.header}>
        <div style={S.title}><BookOpen size={18} color={accentColor} /> Courses</div>
        <button style={S.newBtn(showForm)} onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ title: '', description: '', version: '1.0', estimated_minutes: '', expiry_months: '' }); }}>
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Course</>}
        </button>
      </div>

      {message.text && <div style={S.message(message.type)}>{message.text}</div>}

      {showForm && (
        <div style={S.formCard}>
          <div style={S.formTitle}>{editing ? 'Edit Course' : 'New Course'}</div>
          <form onSubmit={handleSubmit}>
            <div style={S.formGroup}>
              <label style={S.label}>Title</label>
              <input style={S.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Description</label>
              <textarea style={S.textarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Version</label>
                <input style={S.input} value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} required />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Estimated Minutes</label>
                <input type="number" style={S.input} value={form.estimated_minutes} onChange={e => setForm({ ...form, estimated_minutes: e.target.value })} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Expiry Months</label>
                <input type="number" style={S.input} value={form.expiry_months} onChange={e => setForm({ ...form, expiry_months: e.target.value })} />
              </div>
            </div>
            <button type="submit" style={S.submitBtn}>{editing ? 'Update Course' : 'Create Course'}</button>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr>
              {['Title', 'Version', 'Status', 'Duration', 'Expiry', 'Actions'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course.id}>
                <td style={{ ...S.td, ...S.nameTd }}>{course.title}</td>
                <td style={S.td}>v{course.version}</td>
                <td style={S.td}>{S.statusBadge(course.status)}</td>
                <td style={{ ...S.td, color: '#64748b' }}>{course.estimated_minutes ? `${course.estimated_minutes} mins` : '—'}</td>
                <td style={{ ...S.td, color: '#64748b' }}>{course.expiry_months ? `${course.expiry_months} months` : 'No expiry'}</td>
                <td style={S.td}>
                  <button title="Manage" style={S.actionBtn('#f8fafc', '#475569', '#e2e8f0')} onClick={() => setManagingCourse(course)}>
                    <BookOpen size={14} />
                  </button>
                  <button title="Edit" style={S.actionBtn('#eff6ff', '#2563eb', '#bfdbfe')} onClick={() => handleEdit(course)}>
                    <Edit size={14} />
                  </button>
                  <button
                    title={course.status === 'published' ? 'Unpublish' : 'Publish'}
                    style={S.actionBtn(
                      course.status === 'published' ? '#fefce8' : '#f0fdf4',
                      course.status === 'published' ? '#d97706' : '#059669',
                      course.status === 'published' ? '#fde68a' : '#bbf7d0'
                    )}
                    onClick={() => handlePublishToggle(course)}
                  >
                    {course.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button title="Archive" style={S.actionBtn('#fef2f2', '#ef4444', '#fecaca')} onClick={() => handleArchive(course)}>
                    <Archive size={14} />
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