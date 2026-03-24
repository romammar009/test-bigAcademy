import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import BrowseCourses from './AssignedCourses';
import MyLearning from './MyLearning';
import MyCertificates from './MyCertificates';
import API from '../../api/axios';
import { useNavigate } from 'react-router-dom';

export default function EducatorDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
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
      <nav className="navbar navbar-expand-lg navbar-dark bg-success px-4">
        <span className="navbar-brand fw-bold">Big Academy</span>
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
              className={`nav-link ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              Assigned Courses
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'learning' ? 'active' : ''}`}
              onClick={() => setActiveTab('learning')}
            >
              My Learning
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'certificates' ? 'active' : ''}`}
              onClick={() => setActiveTab('certificates')}
            >
              Certificates
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        {activeTab === 'browse'       && <BrowseCourses />}
        {activeTab === 'learning'     && <MyLearning />}
        {activeTab === 'certificates' && <MyCertificates />}
      </div>
    </div>
  );
}