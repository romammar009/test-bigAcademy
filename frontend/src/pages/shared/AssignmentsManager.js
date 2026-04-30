import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import {
  ClipboardList, Plus, X, Trash2, Calendar,
  Filter, Users, CheckSquare, Square,
  Edit, ToggleLeft, ToggleRight, Eye
} from 'lucide-react';

export default function AssignmentsManager({ accentColor = '#1a1f8c' }) {
  const [assignments, setAssignments]     = useState([]);
  const [courses, setCourses]             = useState([]);
  const [locations, setLocations]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [message, setMessage]             = useState({ text: '', type: '' });
  const [showForm, setShowForm]           = useState(false);
  const [saving, setSaving]               = useState(false);
  const [step, setStep]                   = useState(1);
  const [viewModal, setViewModal]         = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    course_id: '', assignment_type: 'all', mandatory: true, due_at: '',
  });
  const [editForm, setEditForm] = useState({ mandatory: true, due_at: '' });

  const [filters, setFilters]             = useState({ location_ids: [], roles: [] });
  const [previewUsers, setPreviewUsers]   = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [previewing, setPreviewing]       = useState(false);

  const ROLE_OPTIONS = [
    { value: 'educator',       label: 'Educator'       },
    { value: 'branch_manager', label: 'Branch Manager' },
  ];

  const ROLE_ORDER  = ['area_manager', 'branch_manager', 'educator'];
  const ROLE_LABELS = {
    area_manager:   'Area Manager',
    branch_manager: 'Branch Manager',
    educator:       'Educator',
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [assignRes, courseRes, userRes] = await Promise.all([
        API.get('/assignments/'),
        API.get('/courses/'),
        API.get('/users/'),
      ]);
      setAssignments(assignRes.data);
      setCourses(courseRes.data.filter(c => c.status === 'published'));
      const locs = [...new Map(
        userRes.data.filter(u => u.location).map(u => [u.location.id, u.location])
      ).values()];
      setLocations(locs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handlePreview = async () => {
    if (!form.course_id) { showMsg('Please select a course first.', 'error'); return; }

    if (isEditing && previewUsers.length > 0) {
      setStep(2);
      return;
    }

    setPreviewing(true);
    try {
      const res = await API.post('/assignments/preview/', {
        location_ids: filters.location_ids,
        roles:        filters.roles,
      });
      setPreviewUsers(res.data.users);
      setSelectedUsers(res.data.users.map(u => u.id));
      setStep(2);
    } catch (err) {
      showMsg('Could not load users.', 'error');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.course_id) { showMsg('Please select a course.', 'error'); return; }
    if (form.assignment_type === 'filtered' && selectedUsers.length === 0) {
      showMsg('Please select at least one user.', 'error'); return;
    }
    setSaving(true);
    try {
      await API.post('/assignments/create/', {
        course_id:       form.course_id,
        assignment_type: form.assignment_type,
        target_users:    form.assignment_type === 'filtered' ? selectedUsers : [],
        mandatory:       form.mandatory,
        due_at:          form.due_at || null,
      });
      showMsg(form.assignment_type === 'all'
        ? 'Course assigned to all staff successfully.'
        : `Course assigned to ${selectedUsers.length} user(s) successfully.`
      );
      resetForm();
      fetchData();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Could not create assignment.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (assignment) => {
    try {
      const res = await API.patch(`/assignments/${assignment.id}/toggle/`);
      showMsg(res.data.message);
      fetchData();
    } catch (err) {
      showMsg('Could not update assignment.', 'error');
    }
  };

  const handleDelete = async (assignment) => {
    if (!window.confirm(`Delete assignment for "${assignment.course_title}"? This will remove enrolments for all users.`)) return;
    try {
      await API.delete(`/assignments/${assignment.id}/delete/`);
      showMsg('Assignment deleted.');
      fetchData();
    } catch (err) {
      showMsg('Could not delete assignment.', 'error');
    }
  };

  const handleEditSave = async () => {
    if (!form.course_id) { showMsg('Please select a course.', 'error'); return; }
    if (form.assignment_type === 'filtered' && selectedUsers.length === 0) {
      showMsg('Please select at least one user.', 'error'); return;
    }
    setSaving(true);
      try {
        await API.patch(`/assignments/${editingAssignment.id}/edit/`, {
        course_id:       form.course_id,
        assignment_type: form.assignment_type,
        target_users:    form.assignment_type === 'filtered' ? selectedUsers : [],
        mandatory:       form.mandatory,
        due_at:          form.due_at || null,
      });
      showMsg('Assignment updated successfully.');
      setEditingAssignment(null);
      setIsEditing(false);
      resetForm();
      fetchData();
    } catch (err) {
      showMsg('Could not update assignment.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditingAssignment(null);
    setStep(1);
    setForm({ course_id: '', assignment_type: 'all', mandatory: true, due_at: '' });
    setFilters({ location_ids: [], roles: [] });
    setPreviewUsers([]);
    setSelectedUsers([]);
  };

  const toggleLocation = (id) => {
    setFilters(prev => ({
      ...prev,
      location_ids: prev.location_ids.includes(id)
        ? prev.location_ids.filter(l => l !== id)
        : [...prev.location_ids, id]
    }));
  };

  const toggleRole = (role) => {
    setFilters(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const toggleUser = (id) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  };

  const toggleAllUsers = () => {
    setSelectedUsers(selectedUsers.length === previewUsers.length ? [] : previewUsers.map(u => u.id));
  };

  const getAssignedSummary = (a) => {
    if (!a.enrolled_users?.length) return '—';
    const roles = [...new Set(a.enrolled_users.map(u => u.role))];
    return `${a.enrolled_users.length} user(s) · ${roles.length} role(s)`;
  };

  const roleBadge = (role) => {
    const config = {
      educator:       { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0' },
      branch_manager: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
      area_manager:   { bg: '#eef1ff', color: '#1a1f8c', border: '#c7d2fe' },
    };
    const c = config[role] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    return (
      <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
        {ROLE_LABELS[role] || role}
      </span>
    );
  };

  const S = {
    header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title:   { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' },
    newBtn:  (isOpen) => ({
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
    formTitle:  { fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '18px' },
    formGroup:  { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '16px' },
    label:      { fontSize: '0.78rem', fontWeight: '600', color: '#374151' },
    select:     { padding: '9px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b', outline: 'none', fontFamily: 'inherit', background: '#fff' },
    input:      { padding: '9px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b', outline: 'none', fontFamily: 'inherit' },
    typeGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' },
    typeCard:   (isSelected) => ({
      padding: '14px 16px', borderRadius: '8px', cursor: 'pointer',
      border: `2px solid ${isSelected ? accentColor : '#e2e8f0'}`,
      background: isSelected ? `${accentColor}10` : '#fff', transition: 'all 0.15s',
    }),
    typeTitle:  (isSelected) => ({ fontSize: '0.875rem', fontWeight: '700', color: isSelected ? accentColor : '#1e293b', marginBottom: '3px' }),
    typeSub:    { fontSize: '0.75rem', color: '#94a3b8' },
    filterSection: { background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' },
    filterTitle:   { fontSize: '0.82rem', fontWeight: '700', color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' },
    chipRow:    { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    chip:       (isSelected) => ({
      padding: '5px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600',
      cursor: 'pointer', transition: 'all 0.15s',
      background: isSelected ? accentColor : '#fff',
      color:      isSelected ? '#fff' : '#64748b',
      border:     `1px solid ${isSelected ? accentColor : '#e2e8f0'}`,
    }),
    previewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
    previewCount:  { fontSize: '0.82rem', color: '#64748b' },
    selectAll:     { fontSize: '0.78rem', fontWeight: '600', color: accentColor, cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px' },
    userRow2: (isSelected) => ({
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
      marginBottom: '6px', transition: 'all 0.15s',
      background: isSelected ? `${accentColor}08` : '#f8fafc',
      border: `1px solid ${isSelected ? accentColor + '40' : '#f1f5f9'}`,
    }),
    userAvatar: {
      width: '32px', height: '32px', borderRadius: '50%',
      background: accentColor + '20', color: accentColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.75rem', fontWeight: '700', flexShrink: 0,
    },
    userName2:  { fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', flex: 1 },
    userLoc:    { fontSize: '0.75rem', color: '#94a3b8' },
    btnRow:     { display: 'flex', gap: '10px', marginTop: '16px' },
    backBtn:    { padding: '9px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', color: '#64748b', cursor: 'pointer' },
    submitBtn:  (disabled) => ({
      padding: '9px 20px', background: disabled ? '#f1f5f9' : accentColor,
      color: disabled ? '#94a3b8' : '#fff', border: 'none',
      borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }),
    table:  { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    th:     { padding: '12px 16px', fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' },
    td:     { padding: '13px 16px', fontSize: '0.875rem', color: '#334155', borderBottom: '1px solid #f8fafc' },
    nameTd: { fontWeight: '600', color: '#0f172a' },
    badge:  (bg, color, border, label) => (
      <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', background: bg, color, border: `1px solid ${border}` }}>{label}</span>
    ),
    iconBtn: (bg, color, border) => ({
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer',
      background: bg, color, border: `1px solid ${border}`, marginRight: '4px',
    }),
    emptyState: { textAlign: 'center', padding: '48px 24px', color: '#94a3b8' },
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    },
    modal: {
      background: '#fff', borderRadius: '12px', padding: '24px',
      width: '100%', maxWidth: '500px', maxHeight: '80vh',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    modalTitle:  { fontSize: '1rem', fontWeight: '700', color: '#0f172a' },
    modalBody:   { overflowY: 'auto', flex: 1 },
    roleGroup:   { marginBottom: '16px' },
    roleHeader:  { fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' },
    modalUserRow: {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '8px 12px', borderRadius: '8px', background: '#f8fafc',
      border: '1px solid #f1f5f9', marginBottom: '6px',
    },
  };

  if (loading) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading assignments...</p>;

  return (
    <div>
      <div style={S.header}>
        <div style={S.title}><ClipboardList size={18} color={accentColor} /> Course Assignments</div>
        <button style={S.newBtn(showForm)} onClick={() => showForm ? resetForm() : setShowForm(true)}>
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Assignment</>}
        </button>
      </div>

      {message.text && <div style={S.message(message.type)}>{message.text}</div>}

      {/* ── New Assignment Form ── */}
      {showForm && (
        <div style={S.formCard}>
          {step === 1 && (
            <>
              <div style={S.formTitle}>{isEditing ? 'Edit Assignment' : 'New Assignment'}</div>
              <div style={S.formGroup}>
                <label style={S.label}>Course</label>
                <select style={S.select} value={form.course_id}
                  onChange={e => setForm({ ...form, course_id: e.target.value })} required>
                  <option value="">Select a course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Assign To</label>
                <div style={S.typeGrid}>
                  <div style={S.typeCard(form.assignment_type === 'all')}
                    onClick={() => setForm({ ...form, assignment_type: 'all' })}>
                    <div style={S.typeTitle(form.assignment_type === 'all')}>All Staff</div>
                    <div style={S.typeSub}>Assign to everyone at your locations</div>
                  </div>
                  <div style={S.typeCard(form.assignment_type === 'filtered')}
                    onClick={() => setForm({ ...form, assignment_type: 'filtered' })}>
                    <div style={S.typeTitle(form.assignment_type === 'filtered')}>Filter & Select</div>
                    <div style={S.typeSub}>Filter by location and role</div>
                  </div>
                </div>
              </div>
              {form.assignment_type === 'filtered' && (
                <div style={S.filterSection}>
                  <div style={S.filterTitle}><Filter size={14} /> Filter Users</div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>BY LOCATION</div>
                    <div style={S.chipRow}>
                      {locations.map(loc => (
                        <div key={loc.id} style={S.chip(filters.location_ids.includes(loc.id))}
                          onClick={() => toggleLocation(loc.id)}>{loc.name}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>BY ROLE</div>
                    <div style={S.chipRow}>
                      {ROLE_OPTIONS.map(r => (
                        <div key={r.value} style={S.chip(filters.roles.includes(r.value))}
                          onClick={() => toggleRole(r.value)}>{r.label}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div style={S.formGroup}>
                  <label style={S.label}>Due Date (optional)</label>
                  <input type="date" style={S.input} value={form.due_at}
                    onChange={e => setForm({ ...form, due_at: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                    <input type="checkbox" checked={form.mandatory}
                      onChange={e => setForm({ ...form, mandatory: e.target.checked })}
                      style={{ width: '16px', height: '16px' }} />
                    Mandatory
                  </label>
                </div>
              </div>
              <div style={S.btnRow}>
                {form.assignment_type === 'filtered' ? (
                  <button style={S.submitBtn(!form.course_id || previewing)} onClick={handlePreview} disabled={!form.course_id || previewing}>
                    {previewing ? 'Loading...' : <><Users size={14} style={{ marginRight: '6px' }} /> {isEditing ? 'View/Edit Users' : 'Preview Users'}</>}
                  </button>
                ) : (
                  <button style={S.submitBtn(!form.course_id || saving)} onClick={isEditing ? handleEditSave : handleSubmit} disabled={!form.course_id || saving}>
                    {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Assign to All Staff'}
                  </button>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={S.formTitle}>Select Users to Assign</div>
              <div style={S.previewHeader}>
                <span style={S.previewCount}>{previewUsers.length} user(s) found — {selectedUsers.length} selected</span>
                <button style={S.selectAll} onClick={toggleAllUsers}>
                  {selectedUsers.length === previewUsers.length
                    ? <><CheckSquare size={14} /> Deselect All</>
                    : <><Square size={14} /> Select All</>}
                </button>
              </div>
              {previewUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.875rem' }}>No users match the selected filters.</div>
              ) : (
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {previewUsers.map(u => (
                    <div key={u.id} style={S.userRow2(selectedUsers.includes(u.id))} onClick={() => toggleUser(u.id)}>
                      <div style={S.userAvatar}>{u.name.split(' ').map(n => n[0]).join('')}</div>
                      <div style={{ flex: 1 }}>
                        <div style={S.userName2}>{u.name}</div>
                        <div style={S.userLoc}>{u.location}</div>
                      </div>
                      {roleBadge(u.role)}
                      {selectedUsers.includes(u.id) ? <CheckSquare size={16} color={accentColor} /> : <Square size={16} color="#cbd5e1" />}
                    </div>
                  ))}
                </div>
              )}
              <div style={S.btnRow}>
                <button style={S.backBtn} onClick={() => setStep(1)}>← Back</button>
                <button style={S.submitBtn(selectedUsers.length === 0 || saving)} onClick={isEditing ? handleEditSave : handleSubmit} disabled={selectedUsers.length === 0 || saving}>
                  {saving ? 'Saving...' : isEditing ? `Save Changes` : `Assign to ${selectedUsers.length} User(s)`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Edit Assignment Modal ── */}
      {/* ── Assigned To Modal ── */}
      {viewModal && (
        <div style={S.overlay} onClick={() => setViewModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalTitle}>Assigned To — {viewModal.course_title}</div>
              <button onClick={() => setViewModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            <div style={S.modalBody}>
              {!viewModal.enrolled_users?.length ? (
                <div style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '24px' }}>No users enrolled.</div>
              ) : (
                ROLE_ORDER.map(role => {
                  const users = viewModal.enrolled_users?.filter(u => u.role === role) || [];
                  if (!users.length) return null;
                  return (
                    <div key={role} style={S.roleGroup}>
                      <div style={S.roleHeader}>{ROLE_LABELS[role]} ({users.length})</div>
                      {users.map(u => (
                        <div key={u.id} style={S.modalUserRow}>
                          <div style={{ ...S.userAvatar, width: '28px', height: '28px', fontSize: '0.7rem' }}>
                            {u.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.location}</div>
                          </div>
                          {roleBadge(u.role)}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Assignments Table ── */}
      {assignments.length === 0 ? (
        <div style={S.emptyState}>
          <ClipboardList size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '0.9rem' }}>No assignments yet. Create one above.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                {['Course', 'Assigned To', 'Status', 'Mandatory', 'Due Date', 'Actions'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id} style={{ opacity: a.is_active ? 1 : 0.6 }}>
                  <td style={{ ...S.td, ...S.nameTd }}>{a.course_title}</td>
                  <td style={S.td}>
                    <button
                      title="View assigned users"
                      onClick={() => setViewModal(a)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 }}
                    >
                      <Eye size={13} /> {getAssignedSummary(a)}
                    </button>
                  </td>
                  <td style={S.td}>
                    {a.is_active
                      ? S.badge('#f0fdf4', '#059669', '#bbf7d0', 'Active')
                      : S.badge('#f8fafc', '#94a3b8', '#e2e8f0', 'Disabled')}
                  </td>
                  <td style={S.td}>
                    {a.mandatory
                      ? S.badge('#fef2f2', '#ef4444', '#fecaca', 'Mandatory')
                      : S.badge('#f8fafc', '#64748b', '#e2e8f0', 'Optional')}
                  </td>
                  <td style={S.td}>
                    {a.due_at ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '0.82rem' }}>
                        <Calendar size={12} /> {new Date(a.due_at).toLocaleDateString()}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={S.td}>
                    <button
                      title={a.is_active ? 'Disable to edit' : 'Edit assignment'}
                      style={{
                        ...S.iconBtn(
                          a.is_active ? '#f1f5f9' : '#eff6ff',
                          a.is_active ? '#cbd5e1' : '#2563eb',
                          a.is_active ? '#e2e8f0' : '#bfdbfe'
                        ),
                        cursor: a.is_active ? 'not-allowed' : 'pointer',
                      }}
                      disabled={a.is_active}
                      onClick={() => {
                        if (a.is_active) return;
                        setEditingAssignment(a);
                        setIsEditing(true);
                        setShowForm(true);
                        setStep(1);
  
                        const enrolledUsers = a.enrolled_users || [];
  
                        // Derive locations and roles from enrolled users
                        const derivedLocationIds = [...new Set(
                          enrolledUsers
                            .map(u => locations.find(l => l.name === u.location)?.id)
                            .filter(Boolean)
                        )];
                        const derivedRoles = [...new Set(enrolledUsers.map(u => u.role))];
  
                        setFilters({ location_ids: derivedLocationIds, roles: derivedRoles });
                        setForm({
                          course_id:       String(a.course_id),
                          assignment_type: a.assignment_type,
                          mandatory:       a.mandatory,
                         due_at:          a.due_at ? a.due_at.split('T')[0] : '',
                        });
                        setPreviewUsers(enrolledUsers);
                        setSelectedUsers(enrolledUsers.map(u => u.id));
                      }}
                    >
                  <Edit size={14} />
                </button>
                    <button
                      title={a.is_active ? 'Disable assignment' : 'Enable assignment'}
                      style={S.iconBtn(a.is_active ? '#fefce8' : '#f0fdf4', a.is_active ? '#d97706' : '#059669', a.is_active ? '#fde68a' : '#bbf7d0')}
                      onClick={() => handleToggle(a)}
                    >
                      {a.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>
                    <button
                      title="Delete assignment"
                      style={S.iconBtn('#fef2f2', '#ef4444', '#fecaca')}
                      onClick={() => handleDelete(a)}
                    >
                      <Trash2 size={14} />
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