import { useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../utils/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('auth/me')
      .then((res) => {
        // Handles both { user: ... } and direct user object responses from backend
        setUser(res.user || res);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const logout = async () => {
    try {
      await api('auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed on server', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token'); // Clear token locally as well
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}