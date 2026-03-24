import React from 'react';
import EducatorDashboard from './pages/educator/EducatorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

import Login from './pages/auth/Login';

// Placeholder pages — we'll build these next
// function EducatorHome() { return <h2 className="p-4">Educator Dashboard — Coming Soon</h2>; }
// function AdminHome()    { return <h2 className="p-4">Admin Dashboard — Coming Soon</h2>; }
// function SuperAdminHome() { return <h2 className="p-4">Super Admin Dashboard — Coming Soon</h2>; }

// Protected route — redirects to login if not logged in
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

          <Route path="/educator/*" element={
            <ProtectedRoute allowedRoles={['educator']}>
              <EducatorDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/superadmin/*" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;