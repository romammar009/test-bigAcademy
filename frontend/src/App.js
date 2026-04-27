import React from 'react';
import EducatorDashboard from './pages/educator/EducatorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import HRDashboard from './pages/hr/HRDashboard';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />

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
            <ProtectedRoute allowedRoles={['hr']}>
              <HRDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;