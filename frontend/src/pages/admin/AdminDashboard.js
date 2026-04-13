import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import AdminCourses from './AdminCourses';
import AdminStaff from './AdminStaff';
import AdminReports from './AdminReports';
import AdminQuizGrading from './AdminQuizGrading';
import AdminUnlockRequests from './AdminUnlockRequests';
import AdminAssignments from './AdminAssignments';
import NotificationBell from '../../components/NotificationBell';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab]           = useState('courses');
  const [pendingGrading, setPendingGrading] = useState(0);
  const [pendingUnlocks, setPendingUnlocks] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/attempts/pending-grading/')
      .then(res => setPendingGrading(res.data.length))
      .catch(() => {});
    API.get('/unlock-requests/')
      .then(res => setPendingUnlocks(res.data.length))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await API.post('/auth/logout/'); } catch (err) {}
    logout();
    navigate('/login');
  };

  const roleLabel = user.role === 'branch_manager' ? 'Branch Manager' : 'Admin';

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4">
        <span className="navbar-brand fw-bold">Big Academy — {roleLabel}</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <span className="text-white">{user.first_name} {user.last_name}</span>
          <span className="badge bg-light text-primary">{roleLabel}</span>
          <NotificationBell />
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="container mt-4">
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}>
              Courses
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}>
              Staff
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'assignments' ? 'active' : ''}`}
              onClick={() => setActiveTab('assignments')}>
              📋 Assignments
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'grading' ? 'active' : ''}`}
              onClick={() => setActiveTab('grading')}>
              Quiz Grading
              {pendingGrading > 0 && <span className="badge bg-danger ms-2">{pendingGrading}</span>}
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'unlocks' ? 'active' : ''}`}
              onClick={() => setActiveTab('unlocks')}>
              🔓 Unlock Requests
              {pendingUnlocks > 0 && <span className="badge bg-warning text-dark ms-2">{pendingUnlocks}</span>}
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}>
              Reports
            </button>
          </li>
        </ul>

        {activeTab === 'courses'     && <AdminCourses />}
        {activeTab === 'staff'       && <AdminStaff />}
        {activeTab === 'assignments' && <AdminAssignments />}
        {activeTab === 'grading'     && <AdminQuizGrading />}
        {activeTab === 'unlocks'     && <AdminUnlockRequests />}
        {activeTab === 'reports'     && <AdminReports />}
      </div>
    </div>
  );
}