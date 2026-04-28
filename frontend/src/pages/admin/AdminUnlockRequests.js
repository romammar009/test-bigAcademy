import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { Unlock, CheckCircle, XCircle, Clock, X, AlertTriangle } from 'lucide-react';

export default function AdminUnlockRequests() {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [message, setMessage]     = useState({ text: '', type: '' });
  const [denyModal, setDenyModal] = useState(null);
  const [denyNote, setDenyNote]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = () => {
    API.get('/unlock-requests/')
      .then(res => setRequests(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleApprove = async (requestId) => {
    try {
      await API.patch(`/unlock-requests/${requestId}/`, { status: 'approved', review_note: 'Approved by Branch Manager.' });
      setMessage({ text: 'Request approved. The user has been notified.', type: 'success' });
      fetchRequests();
    } catch {
      setMessage({ text: 'Could not process request. Please try again.', type: 'error' });
    }
  };

  const handleDeny = async () => {
    if (!denyNote.trim()) return;
    setSubmitting(true);
    try {
      await API.patch(`/unlock-requests/${denyModal.id}/`, { status: 'denied', review_note: denyNote });
      setMessage({ text: 'Request denied. The user has been notified.', type: 'success' });
      setDenyModal(null);
      setDenyNote('');
      fetchRequests();
    } catch {
      setMessage({ text: 'Could not process request. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const S = {
    title:      { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' },
    toast:      (t) => ({ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: '500', background: t === 'success' ? '#f0fdf4' : '#fef2f2', color: t === 'success' ? '#059669' : '#ef4444', border: `1px solid ${t === 'success' ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '8px' }),
    emptyCard:  { background: '#fff', borderRadius: '12px', padding: '48px 24px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    emptyText:  { fontSize: '0.9rem', color: '#94a3b8', marginTop: '12px' },
    table:      { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    th:         { padding: '12px 16px', fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' },
    td:         { padding: '14px 16px', fontSize: '0.875rem', color: '#334155', borderBottom: '1px solid #f8fafc' },
    approveBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: '600', background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' },
    denyBtn:    { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: '600', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' },
    overlay:    { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
    modal:      { background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' },
    modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
    modalTitle: { fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' },
    modalSub:   { fontSize: '0.82rem', color: '#64748b', marginTop: '4px' },
    closeBtn:   { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex' },
    textarea:   { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#334155', resize: 'vertical', minHeight: '100px', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' },
    modalBtns:  { display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' },
    cancelBtn:  { padding: '9px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', color: '#64748b', cursor: 'pointer' },
    confirmBtn: { padding: '9px 20px', background: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', color: '#fff', cursor: 'pointer' },
  };

  if (loading) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading requests...</p>;

  return (
    <div>
      <div style={S.title}><Unlock size={18} />Quiz Unlock Requests</div>

      {message.text && (
        <div style={S.toast(message.type)}>
          {message.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {message.text}
          <button onClick={() => setMessage({ text: '', type: '' })} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem' }}>×</button>
        </div>
      )}

      {requests.length === 0 ? (
        <div style={S.emptyCard}>
          <Unlock size={36} color="#cbd5e1" />
          <div style={S.emptyText}>No pending unlock requests at this time.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>{['Staff Member', 'Quiz', 'Reason', 'Requested', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td style={{ ...S.td, fontWeight: '600', color: '#0f172a' }}>{req.user_name}</td>
                  <td style={S.td}>{req.quiz_title}</td>
                  <td style={{ ...S.td, color: '#64748b', fontSize: '0.82rem', maxWidth: '220px' }}>{req.reason}</td>
                  <td style={S.td}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.8rem' }}>
                      <Clock size={12} />{new Date(req.requested_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={S.td}>
                    <button style={S.approveBtn} onClick={() => handleApprove(req.id)}><CheckCircle size={13} /> Approve</button>
                    <button style={S.denyBtn} onClick={() => { setDenyModal(req); setDenyNote(''); }}><XCircle size={13} /> Deny</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Deny modal */}
      {denyModal && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setDenyModal(null)}>
          <div style={S.modal}>
            <div style={S.modalHeader}>
              <div>
                <div style={S.modalTitle}>Deny Unlock Request</div>
                <div style={S.modalSub}>
                  {denyModal.user_name} — <em>{denyModal.quiz_title}</em>
                </div>
              </div>
              <button style={S.closeBtn} onClick={() => setDenyModal(null)}><X size={18} /></button>
            </div>
            <textarea
              style={S.textarea}
              placeholder="Provide a reason for the denial so the user understands the decision…"
              value={denyNote}
              onChange={e => setDenyNote(e.target.value)}
              autoFocus
            />
            <div style={S.modalBtns}>
              <button style={S.cancelBtn} onClick={() => setDenyModal(null)}>Cancel</button>
              <button style={S.confirmBtn} onClick={handleDeny} disabled={!denyNote.trim() || submitting}>
                {submitting ? 'Submitting…' : 'Confirm Denial'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
