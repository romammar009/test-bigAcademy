import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function ChangePassword() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, getRedirectPath } = useAuth();

  const state = location.state;
  const token = state?.token;
  const user  = state?.user;

  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirm]     = useState('');
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);

  if (!token || !user) {
    navigate('/bigacademy-login2026');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await API.post(
        '/auth/change-password/',
        { new_password: newPassword },
        { headers: { Authorization: `Token ${token}` } }
      );
      login(user, token);
      navigate(getRedirectPath(user.role));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const S = {
    page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' },
    card:  { background: '#fff', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
    icon:  { fontSize: '2.5rem', textAlign: 'center', marginBottom: '8px' },
    title: { fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: '6px' },
    sub:   { fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginBottom: '28px', lineHeight: '1.5' },
    label: { fontSize: '0.78rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' },
    input: { width: '100%', padding: '10px 13px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#1e293b', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '16px' },
    error: { padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' },
    btn:   { width: '100%', padding: '11px', background: '#1a1f8c', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer' },
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.icon}>🔐</div>
        <div style={S.title}>Set your new password</div>
        <div style={S.sub}>
          Welcome, {user.first_name}! Your account was created with a temporary password.<br />
          Please set a permanent password to continue.
        </div>

        {error && <div style={S.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={S.label}>New Password</label>
          <input
            type="password"
            style={S.input}
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            autoFocus
          />
          <label style={S.label}>Confirm Password</label>
          <input
            type="password"
            style={S.input}
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChange={e => setConfirm(e.target.value)}
            required
          />
          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? 'Saving...' : 'Set Password & Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
