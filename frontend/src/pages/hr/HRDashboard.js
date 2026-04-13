import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import HRManageUsers from './HRManageUsers';
import HRUnlockRequests from './HRUnlockRequests';
import HRReports from './HRReports';
import NotificationBell from '../../components/NotificationBell';

export default function HRDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await API.post('/auth/logout/'); } catch (err) {}
    logout();
    navigate('/login');
  };

  const isExecutive = user.is_hr_executive;

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-danger px-4">
        <span className="navbar-brand fw-bold">
          Big Academy — {isExecutive ? 'HR Executive' : 'HR'}
        </span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <span className="badge bg-light text-danger">
            {isExecutive ? 'HR Executive' : 'HR'}
          </span>
          <span className="text-white">
            {user.first_name} {user.last_name}
          </span>
          <NotificationBell />
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container mt-4">
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 Users
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              🔓 Unlock Requests
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              📊 Reports
            </button>
          </li>
        </ul>

        {activeTab === 'users'    && <HRManageUsers isExecutive={isExecutive} />}
        {activeTab === 'requests' && <HRUnlockRequests />}
        {activeTab === 'reports'  && <HRReports />}
      </div>
    </div>
  );
}