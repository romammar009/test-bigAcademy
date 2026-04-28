import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

const QUICK_LOGINS = [
  { label: 'Billy (HR Exec)',  email: 'billy.hr@bigchildcare.com.au',             password: 'Test1234!', color: 'danger' },
  { label: 'Rob (HR)',         email: 'rob.hr@bigchildcare.com.au',               password: 'Test1234!', color: 'danger' },
  { label: 'Sean (HR)',        email: 'sean.hr@bigchildcare.com.au',              password: 'Test1234!', color: 'danger' },
  { label: 'Alex (Area Mgr)',  email: 'alex.areamanager@bigchildcare.com.au',     password: 'Test1234!', color: 'warning' },
  { label: 'Emma (Area Mgr)',  email: 'emma.areamanager@bigchildcare.com.au',     password: 'Test1234!', color: 'warning' },
  { label: 'David (Area Mgr)', email: 'david.areamanager@bigchildcare.com.au',    password: 'Test1234!', color: 'warning' },
  { label: 'Priya (Branch)',   email: 'priya.manager@bigchildcare.com.au',        password: 'Test1234!', color: 'primary' },
  { label: 'Tom (Branch)',     email: 'tom.manager@bigchildcare.com.au',          password: 'Test1234!', color: 'primary' },
  { label: 'Lisa (Branch)',    email: 'lisa.manager@bigchildcare.com.au',         password: 'Test1234!', color: 'primary' },
  { label: 'Amy (Educator)',   email: 'amy.educator@bigchildcare.com.au',         password: 'Test1234!', color: 'success' },
  { label: 'Jake (Educator)',  email: 'jake.educator@bigchildcare.com.au',        password: 'Test1234!', color: 'success' },
  { label: 'Ben (Educator)',   email: 'ben.educator@bigchildcare.com.au',         password: 'Test1234!', color: 'success' },
];

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login, getRedirectPath } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login/', { email, password });
      if (res.data.must_change_password) {
        navigate('/change-password', { state: { token: res.data.token, user: res.data.user } });
        return;
      }
      login(res.data.user, res.data.token);
      navigate(getRedirectPath(res.data.user.role));
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '480px' }}>

        <div className="text-center mb-4">
          <h2 className="fw-bold text-success">Big Academy</h2>
          <p className="text-muted">Sign in to your account</p>
        </div>

        {/* Quick Login — Demo Only */}
        <div className="mb-4">
          <p className="text-muted small text-center mb-2">
            🔧 <strong>Demo Quick Login</strong>
          </p>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            {QUICK_LOGINS.map(account => (
              <button
                key={account.email}
                type="button"
                className={`btn btn-outline-${account.color} btn-sm`}
                onClick={() => handleQuickLogin(account)}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>

        <hr className="mb-4" />

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@bigchildcare.com.au"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-success w-100" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
}