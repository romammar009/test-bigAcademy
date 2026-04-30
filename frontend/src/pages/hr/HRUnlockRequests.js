import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { Unlock, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function HRUnlockRequests() {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [message, setMessage]     = useState({ text: '', type: '' });
  const [denyModal, setDenyModal] = useState(null);
  const [denyNote, setDenyNote]   = useState('');
  const [roleFilter, setRoleFilter] = useState('area_manager');

  useEffect(() => { fetchRequests(roleFilter); }, [roleFilter]);

  const fetchRequests = (role = roleFilter) => {
    setLoading(true);
    API.get(`/unlock-requests/?role=${role}`)
      .then(res => setRequests(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleApprove = async (requestId) => {
    try {
      await API.patch(`/unlock-requests/${requestId}/`, { status: 'approved', review_note: 'Approved by HR.' });
      setMessage({ text: 'Request approved successfully.', type: 'success' });
      fetchRequests();
    } catch (err) {
      setMessage({ text: 'Could not process request.', type: 'error' });
    }
  };

  const handleDeny = async () => {
    if (!denyNote.trim()) return;
    try {
      await API.patch(`/unlock-requests/${denyModal}/`, { status: 'denied', review_note: denyNote });
      setMessage({ text: 'Request denied.', type: 'success' });
      setDenyModal(null);
      setDenyNote('');
      fetchRequests();
    } catch (err) {
      setMessage({ text: 'Could not process request.', type: 'error' });
    }
  };

  const S = {
    title:   { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' },
    message: (type) => ({
      padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
      fontSize: '0.85rem', fontWeight: '500',
      background: type === 'success' ? '#f0fdf4' : '#fef2f2',
      color:      type === 'success' ? '#059669' : '#ef4444',
      border:     `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
    }),
    emptyCard: {
      background: '#fff', borderRadius: '12px', padding: '48px 24px',
      textAlign: 'center', border: '1px solid #e2e8f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
    emptyText: { fontSize: '0.9rem', color: '#94a3b8', marginTop: '12px' },
    table:     { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    th:        { padding: '12px 16px', fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' },
    td:        { padding: '14px 16px', fontSize: '0.875rem', color: '#334155', borderBottom: '1px solid #f8fafc' },
    nameTd:    { fontWeight: '600', color: '#0f172a' },
    reasonTd:  { color: '#64748b', fontSize: '0.82rem', maxWidth: '220px' },
    dateTd:    { color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' },
    approveBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '6px 12px', fontSize: '0.78rem', fontWeight: '600',
      background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0',
      borderRadius: '6px', cursor: 'pointer', marginRight: '8px',
    },
    denyBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '6px 12px', fontSize: '0.78rem', fontWeight: '600',
      background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
      borderRadius: '6px', cursor: 'pointer',
    },
    // Modal
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    },
    modal: {
      background: '#fff', borderRadius: '14px', padding: '24px',
      width: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    },
    modalTitle:  { fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '8px' },
    modalSub:    { fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' },
    textarea:    { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#334155', resize: 'vertical', minHeight: '90px', fontFamily: 'inherit', boxSizing: 'border-box' },
    modalBtns:   { display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' },
    cancelBtn:   { padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', cursor: 'pointer' },
    confirmBtn:  { padding: '8px 16px', background: '#ef4444', border: 'none', borderRadius: '7px', fontSize: '0.85rem', fontWeight: '600', color: '#fff', cursor: 'pointer' },
  };

  if (loading) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading requests...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ ...S.title, marginBottom: 0 }}>
        <Unlock size={18} color="#1a1f8c" />
         Quiz Unlock Requests
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{
            padding: '7px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
            fontSize: '0.85rem', color: '#1e293b', background: '#fff',
            fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          <option value="area_manager">Area Manager</option>
          <option value="branch_manager">Branch Manager</option>
          <option value="educator">Educator</option>
          <option value="hr">HR</option>
        </select>
      </div>

      {message.text && <div style={S.message(message.type)}>{message.text}</div>}

      {requests.length === 0 ? (
        <div style={S.emptyCard}>
          <Unlock size={36} color="#cbd5e1" />
          <div style={S.emptyText}>No pending unlock requests at this time.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                {['Staff Member', 'Role', 'Quiz', 'Reason', 'Requested', 'Actions'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td style={{ ...S.td, ...S.nameTd }}>{req.user_name}</td>
                  <td style={S.td}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: '#eef1ff', color: '#1a1f8c', border: '1px solid #c7d2fe' }}>
                      {req.user_role === 'area_manager' ? 'Area Manager' : req.user_role === 'branch_manager' ? 'Branch Manager' : req.user_role === 'hr' ? 'HR' : 'Educator'}
                    </span>
                  </td>
                  <td style={S.td}>{req.quiz_title}</td>
                  <td style={{ ...S.td, ...S.reasonTd }}>{req.reason}</td>
                  <td style={S.td}>
                    <div style={S.dateTd}>
                      <Clock size={12} />
                      {new Date(req.requested_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={S.td}>
                    <button style={S.approveBtn} onClick={() => handleApprove(req.id)}>
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button style={S.denyBtn} onClick={() => { setDenyModal(req.id); setDenyNote(''); }}>
                      <XCircle size={13} /> Deny
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Deny Modal */}
      {denyModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalTitle}>Deny Unlock Request</div>
            <div style={S.modalSub}>Please provide a reason for denial.</div>
            <textarea
              style={S.textarea}
              placeholder="Enter reason..."
              value={denyNote}
              onChange={e => setDenyNote(e.target.value)}
            />
            <div style={S.modalBtns}>
              <button style={S.cancelBtn} onClick={() => setDenyModal(null)}>Cancel</button>
              <button style={S.confirmBtn} onClick={handleDeny}>Confirm Deny</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}