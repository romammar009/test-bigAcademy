import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, X, UserMinus, Pencil, AlertTriangle, CheckCircle, KeyRound } from 'lucide-react';

const BLANK_FORM = { email: '', first_name: '', last_name: '', role: 'educator', phone_number: '', location_id: '', location_ids: [] };
const ROLE_LABELS = { hr: 'HR', area_manager: 'Area Manager', branch_manager: 'Branch Manager', educator: 'Educator' };
const ROLE_STYLE  = {
  hr:             { bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
  area_manager:   { bg: '#fefce8', color: '#d97706', border: '#fde68a' },
  branch_manager: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  educator:       { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0' },
};

export default function HRManageUsers({ isExecutive }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers]         = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [message, setMessage]     = useState({ text: '', type: '' });
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(BLANK_FORM);

  // Edit modal
  const [editUser, setEditUser]   = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Offboard confirm modal
  const [offboardTarget, setOffboardTarget] = useState(null);

  // Reset password confirm modal
  const [resetTarget, setResetTarget]     = useState(null);
  const [resetLoading, setResetLoading]   = useState(false);

  useEffect(() => {
    fetchUsers();
    API.get('/locations/').then(res => setLocations(res.data)).catch(() => {});
  }, []);

  const fetchUsers = () => {
    API.get('/users/')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  // ── Onboard ──────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    const payload = { email: form.email, first_name: form.first_name, last_name: form.last_name, role: form.role, phone_number: form.phone_number };
    if (form.role === 'area_manager') payload.location_ids = form.location_ids;
    else if (form.location_id) payload.location = form.location_id;
    try {
      await API.post('/users/register/', payload);
      setMessage({ text: 'User onboarded — a temporary password has been emailed to them.', type: 'success' });
      setShowForm(false);
      setForm(BLANK_FORM);
      fetchUsers();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Registration failed.', type: 'error' });
    }
  };

  const toggleLocationId = (id) => setForm(f => ({
    ...f,
    location_ids: f.location_ids.includes(id) ? f.location_ids.filter(x => x !== id) : [...f.location_ids, id],
  }));

  // ── Edit ─────────────────────────────────────────────────
  const openEdit = (u) => {
    setEditUser(u);
    setEditError('');
    setEditForm({
      first_name:   u.first_name,
      last_name:    u.last_name,
      phone_number: u.phone_number || '',
      role:         u.role,
      status:       u.status,
      location_id:  u.location?.id || '',
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    try {
      const res = await API.patch(`/users/${editUser.id}/update/`, editForm);
      setUsers(prev => prev.map(u => u.id === editUser.id ? res.data : u));
      setMessage({ text: `${res.data.first_name} ${res.data.last_name} updated successfully.`, type: 'success' });
      setEditUser(null);
    } catch (err) {
      setEditError(err.response?.data?.error || 'Could not save changes.');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Reset Password ────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetLoading(true);
    try {
      await API.post(`/users/${resetTarget.id}/reset-password/`);
      setMessage({ text: `A new temporary password has been emailed to ${resetTarget.email}.`, type: 'success' });
      setResetTarget(null);
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Could not reset password.', type: 'error' });
      setResetTarget(null);
    } finally {
      setResetLoading(false);
    }
  };

  // ── Offboard ─────────────────────────────────────────────
  const handleOffboard = async () => {
    if (!offboardTarget) return;
    try {
      await API.patch(`/users/${offboardTarget.id}/offboard/`, { offboard_type: 'disabled' });
      setMessage({ text: `${offboardTarget.first_name} ${offboardTarget.last_name} has been offboarded.`, type: 'success' });
      setOffboardTarget(null);
      fetchUsers();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Could not offboard user.', type: 'error' });
      setOffboardTarget(null);
    }
  };

  const canEdit     = (u) => !(u.role === 'hr' && !isExecutive) && u.email !== currentUser.email;
  const canOffboard = (u) => u.email !== currentUser.email && !(u.role === 'hr' && !isExecutive);

  const RoleBadge = ({ role }) => {
    const c = ROLE_STYLE[role] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    return <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{ROLE_LABELS[role] || role}</span>;
  };

  const S = {
    header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title:      { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' },
    onboardBtn: (open) => ({ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', border: 'none', background: open ? '#f1f5f9' : '#1a1f8c', color: open ? '#64748b' : '#fff' }),
    toast:      (t) => ({ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: '500', background: t === 'success' ? '#f0fdf4' : '#fef2f2', color: t === 'success' ? '#059669' : '#ef4444', border: `1px solid ${t === 'success' ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '8px' }),
    formCard:   { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', marginBottom: '20px' },
    formTitle:  { fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '18px' },
    formRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' },
    formGroup:  { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
    label:      { fontSize: '0.78rem', fontWeight: '600', color: '#374151' },
    input:      { padding: '9px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
    select:     { padding: '9px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b', outline: 'none', fontFamily: 'inherit', background: '#fff', width: '100%', boxSizing: 'border-box' },
    submitBtn:  { padding: '9px 20px', background: '#1a1f8c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
    table:      { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    th:         { padding: '12px 16px', fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' },
    td:         { padding: '12px 16px', fontSize: '0.875rem', color: '#334155', borderBottom: '1px solid #f8fafc' },
    nameCell:   { fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' },
    execBadge:  { fontSize: '0.62rem', fontWeight: '700', padding: '2px 6px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' },
    statusBadge:(active) => ({ fontSize: '0.72rem', fontWeight: '600', padding: '3px 9px', borderRadius: '20px', background: active ? '#f0fdf4' : '#f8fafc', color: active ? '#059669' : '#94a3b8', border: `1px solid ${active ? '#bbf7d0' : '#e2e8f0'}` }),
    editBtn:    { padding: '5px 10px', fontSize: '0.78rem', fontWeight: '600', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '6px' },
    offBtn:     { padding: '5px 10px', fontSize: '0.78rem', fontWeight: '600', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '6px' },
    resetBtn:   { padding: '5px 10px', fontSize: '0.78rem', fontWeight: '600', background: '#fefce8', color: '#d97706', border: '1px solid #fde68a', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' },
    // Modal shared
    overlay:    { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
    modal:      { background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' },
    modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
    modalTitle: { fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' },
    modalSub:   { fontSize: '0.82rem', color: '#64748b', marginTop: '3px' },
    closeBtn:   { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex', alignItems: 'center' },
    modalBtns:  { display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' },
    cancelBtn:  { padding: '9px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', color: '#64748b', cursor: 'pointer' },
    saveBtn:    { padding: '9px 20px', background: '#1a1f8c', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', color: '#fff', cursor: 'pointer' },
    dangerBtn:  { padding: '9px 20px', background: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', color: '#fff', cursor: 'pointer' },
    errBox:     { padding: '10px 13px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '0.82rem', marginBottom: '14px' },
  };

  if (loading) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading users...</p>;

  return (
    <div>
      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.title}><Users size={18} color="#1a1f8c" />Users</div>
        <button style={S.onboardBtn(showForm)} onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Onboard User</>}
        </button>
      </div>

      {message.text && (
        <div style={S.toast(message.type)}>
          {message.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {message.text}
          <button onClick={() => setMessage({ text: '', type: '' })} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── Onboard form ── */}
      {showForm && (
        <div style={S.formCard}>
          <div style={S.formTitle}>Onboard New User</div>
          <form onSubmit={handleRegister}>
            <div style={S.formRow}>
              <div style={S.formGroup}><label style={S.label}>First Name</label><input style={S.input} value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required /></div>
              <div style={S.formGroup}><label style={S.label}>Last Name</label><input style={S.input} value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required /></div>
            </div>
            <div style={S.formGroup}><label style={S.label}>Email</label><input type="email" style={S.input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Role</label>
                <select style={S.select} value={form.role} onChange={e => setForm({ ...form, role: e.target.value, location_id: '', location_ids: [] })}>
                  <option value="educator">Educator</option>
                  <option value="branch_manager">Branch Manager</option>
                  <option value="area_manager">Area Manager</option>
                  <option value="hr">HR</option>
                </select>
              </div>
              <div style={S.formGroup}><label style={S.label}>Phone Number</label><input style={S.input} value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} /></div>
            </div>
            {form.role === 'area_manager' ? (
              <div style={S.formGroup}>
                <label style={S.label}>Locations (select all that apply)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '7px', background: '#fafafa', maxHeight: '160px', overflowY: 'auto' }}>
                  {locations.map(loc => (
                    <label key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', background: form.location_ids.includes(loc.id) ? '#eff6ff' : 'transparent', border: form.location_ids.includes(loc.id) ? '1px solid #bfdbfe' : '1px solid transparent' }}>
                      <input type="checkbox" checked={form.location_ids.includes(loc.id)} onChange={() => toggleLocationId(loc.id)} />
                      {loc.name}{loc.state ? ` (${loc.state})` : ''}
                    </label>
                  ))}
                  {locations.length === 0 && <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>No locations available</span>}
                </div>
              </div>
            ) : (
              <div style={S.formGroup}>
                <label style={S.label}>Location</label>
                <select style={S.select} value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value ? parseInt(e.target.value) : '' })}>
                  <option value="">— Select location —</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}{loc.state ? ` (${loc.state})` : ''}</option>)}
                </select>
              </div>
            )}
            <div style={{ padding: '9px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', fontSize: '0.82rem', color: '#059669', marginBottom: '14px' }}>
              A temporary password will be auto-generated and emailed to the user. They will be prompted to set a new password on first login.
            </div>
            <button type="submit" style={S.submitBtn}>Onboard User</button>
          </form>
        </div>
      )}

      {/* ── Users table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr>{['Name', 'Email', 'Role', 'Location', 'Last Login', 'Status', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={S.td}>
                  <div style={S.nameCell}>
                    {u.first_name} {u.last_name}
                    {u.role === 'hr' && u.is_hr_executive && <span style={S.execBadge}>Executive</span>}
                  </div>
                </td>
                <td style={{ ...S.td, color: '#64748b', fontSize: '0.82rem' }}>{u.email}</td>
                <td style={S.td}><RoleBadge role={u.role} /></td>
                <td style={{ ...S.td, color: '#64748b' }}>{u.location ? u.location.name : '—'}</td>
                <td style={{ ...S.td, color: '#64748b' }}>{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}</td>
                <td style={S.td}><span style={S.statusBadge(u.status === 'active')}>{u.status}</span></td>
                <td style={S.td}>
                  {canEdit(u) && <button style={S.editBtn} onClick={() => openEdit(u)}><Pencil size={12} /> Edit</button>}
                  {canOffboard(u) && <button style={S.offBtn} onClick={() => setOffboardTarget(u)}><UserMinus size={12} /> Offboard</button>}
                  {canEdit(u) && <button style={S.resetBtn} onClick={() => setResetTarget(u)}><KeyRound size={12} /> Change Password</button>}
                  {!canEdit(u) && !canOffboard(u) && <span style={{ color: '#cbd5e1' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Edit modal ── */}
      {editUser && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setEditUser(null)}>
          <div style={S.modal}>
            <div style={S.modalHeader}>
              <div>
                <div style={S.modalTitle}>Edit User</div>
                <div style={S.modalSub}>{editUser.email}</div>
              </div>
              <button style={S.closeBtn} onClick={() => setEditUser(null)}><X size={18} /></button>
            </div>

            {editError && <div style={S.errBox}>{editError}</div>}

            <form onSubmit={handleEdit}>
              <div style={S.formRow}>
                <div style={S.formGroup}><label style={S.label}>First Name</label><input style={S.input} value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} required /></div>
                <div style={S.formGroup}><label style={S.label}>Last Name</label><input style={S.input} value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} required /></div>
              </div>
              <div style={S.formRow}>
                <div style={S.formGroup}>
                  <label style={S.label}>Role</label>
                  <select style={S.select} value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                    <option value="educator">Educator</option>
                    <option value="branch_manager">Branch Manager</option>
                    <option value="area_manager">Area Manager</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Status</label>
                  <select style={S.select} value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
              <div style={S.formRow}>
                <div style={S.formGroup}><label style={S.label}>Phone Number</label><input style={S.input} value={editForm.phone_number} onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })} /></div>
                <div style={S.formGroup}>
                  <label style={S.label}>Location</label>
                  <select style={S.select} value={editForm.location_id} onChange={e => setEditForm({ ...editForm, location_id: e.target.value ? parseInt(e.target.value) : '' })}>
                    <option value="">— No location —</option>
                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}{loc.state ? ` (${loc.state})` : ''}</option>)}
                  </select>
                </div>
              </div>
              <div style={S.modalBtns}>
                <button type="button" style={S.cancelBtn} onClick={() => setEditUser(null)}>Cancel</button>
                <button type="submit" style={S.saveBtn} disabled={editSaving}>{editSaving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset password confirm modal ── */}
      {resetTarget && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setResetTarget(null)}>
          <div style={{ ...S.modal, maxWidth: '400px' }}>
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <KeyRound size={26} color="#d97706" />
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Reset Password?</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' }}>
                A new temporary password will be generated and emailed to <strong>{resetTarget.first_name} {resetTarget.last_name}</strong> at <strong>{resetTarget.email}</strong>.<br /><br />
                They will be required to change it on next login.
              </div>
            </div>
            <div style={S.modalBtns}>
              <button style={S.cancelBtn} onClick={() => setResetTarget(null)} disabled={resetLoading}>Cancel</button>
              <button
                style={{ ...S.saveBtn, background: '#d97706', opacity: resetLoading ? 0.7 : 1 }}
                onClick={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading ? 'Sending…' : 'Yes, Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Offboard confirm modal ── */}
      {offboardTarget && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setOffboardTarget(null)}>
          <div style={{ ...S.modal, maxWidth: '400px' }}>
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={26} color="#ef4444" />
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Offboard User?</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' }}>
                You are about to offboard <strong>{offboardTarget.first_name} {offboardTarget.last_name}</strong>.<br />
                Their account will be disabled and they will lose access immediately.
              </div>
            </div>
            <div style={S.modalBtns}>
              <button style={S.cancelBtn} onClick={() => setOffboardTarget(null)}>Cancel</button>
              <button style={S.dangerBtn} onClick={handleOffboard}>Yes, Offboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
