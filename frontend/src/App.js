import React from 'react';
import EducatorDashboard from './pages/educator/EducatorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import HRDashboard from './pages/hr/HRDashboard';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

import Login from './pages/auth/Login';

// Protected route — redirects to login if not logged in or wrong role
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

          {/* Educator — staff taking courses */}
          <Route path="/educator/*" element={
            <ProtectedRoute allowedRoles={['educator']}>
              <EducatorDashboard />
            </ProtectedRoute>
          } />

          {/* Admin — Branch Manager, single location */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Super Admin — Area Manager, multiple locations */}
          <Route path="/superadmin/*" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />

          {/* HR — hr_tier1 (HR Team) and hr_tier2 (HR Head/Owner) */}
          <Route path="/hr/*" element={
            <ProtectedRoute allowedRoles={['hr_tier1', 'hr_tier2']}>
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