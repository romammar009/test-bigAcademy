import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

// Role → dashboard path mapping
const ROLE_REDIRECTS = {
  'educator':       '/educator',
  'branch_manager': '/branch-manager',
  'area_manager':   '/area-manager',
  'hr':             '/hr',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    // Check if saved exists AND is not the string "undefined"
    if (saved && saved !== "undefined") {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
        return null;
      }
    }
    return null;
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