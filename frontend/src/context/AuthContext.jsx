import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token || !savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch (error) {
      console.error('Error parsing saved user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    return Boolean(token && savedUser);
  });
  const [loading] = useState(false);

  const login = async (credentials) => {
    const response = await api.login(credentials);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const register = async (userData) => {
    const response = await api.register(userData);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUserData = useCallback((newUserData) => {
    setUser(prev => {
      const updatedUser = { ...prev, ...newUserData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
    setIsAuthenticated(true);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
