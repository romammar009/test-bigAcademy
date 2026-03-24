import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import AdminCourses from './AdminCourses';
import AdminStaff from './AdminStaff';
import AdminReports from './AdminReports';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');
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
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4">
        <span className="navbar-brand fw-bold">Big Academy — Admin</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <span className="text-white">
            {user.first_name} {user.last_name}
          </span>
          <span className="badge bg-light text-primary">{user.location}</span>
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
              className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              Courses
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              Staff
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reports
            </button>
          </li>
        </ul>

        {activeTab === 'courses' && <AdminCourses />}
        {activeTab === 'staff'   && <AdminStaff />}
        {activeTab === 'reports' && <AdminReports />}
      </div>
    </div>
  );
}