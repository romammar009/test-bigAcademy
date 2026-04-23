import React from 'react';
import EducatorDashboard from './pages/educator/EducatorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import HRDashboard from './pages/hr/HRDashboard';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './pages/auth/Login';
import LandingPage from './LandingPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/bigacademy-login2026" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/bigacademy-login2026" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* The Decoy: Any standard entry point leads to Maintenance */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Navigate to="/" />} />

          {/* Secret Entry Point: Replace 'big-staff-access-2026' with your own secret string */}
          <Route path="/bigacademy-login2026" element={<Login />} />

          {/* Educator */}
          <Route path="/educator/*" element={
            <ProtectedRoute allowedRoles={['educator']}>
              <EducatorDashboard />
            </ProtectedRoute>
          } />

          {/* Branch Manager */}
          <Route path="/branch-manager/*" element={
            <ProtectedRoute allowedRoles={['branch_manager']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Area Manager */}
          <Route path="/area-manager/*" element={
            <ProtectedRoute allowedRoles={['area_manager']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />

          {/* HR */}
          <Route path="/hr/*" element={
           <ProtectedRoute allowedRoles={['hr', 'executive_hr']}>
              <HRDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;