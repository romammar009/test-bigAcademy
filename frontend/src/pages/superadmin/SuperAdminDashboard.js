import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import ManageUsers from './ManageUsers';
import UnlockRequests from './UnlockRequests';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout/');
    } catch (err) {}
    logout();
    navigate('/login');
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-danger px-4">
        <span className="navbar-brand fw-bold">Big Academy — Super Admin</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <span className="text-white">
            {user.first_name} {user.last_name}
          </span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Tabs */}
      <div className="container mt-4">
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Unlock Requests
            </button>
          </li>
        </ul>

        {activeTab === 'users'    && <ManageUsers />}
        {activeTab === 'requests' && <UnlockRequests />}
      </div>
    </div>
  );
}