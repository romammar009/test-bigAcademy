import React, { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

// Role → dashboard path mapping
const ROLE_REDIRECTS = {
  'educator':   '/educator',
  'admin':      '/admin',
  'super_admin': '/superadmin',
  'hr_tier1':   '/hr',
  'hr_tier2':   '/hr',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const getRedirectPath = (role) => {
    return ROLE_REDIRECTS[role] || '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, getRedirectPath }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}