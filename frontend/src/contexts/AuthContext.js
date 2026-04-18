import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '@/api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      // Llamar al endpoint de logout para limpiar la cookie httpOnly
      await authAPI.logout();
    } catch (error) {
      // Error silencioso en logout
    } finally {
      // Limpiar localStorage
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Verificar si hay usuario guardado en localStorage (solo para UI)
    const loadUser = () => {
      const savedUser = localStorage.getItem('user');

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          // Error parseando usuario guardado - limpiar
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [logout]);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { user: userData } = response.data;

      // Solo guardar info del usuario en localStorage (para UI)
      // El token está en cookie httpOnly (seguro contra XSS)
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al iniciar sesión',
      };
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token: null, // Ya no exponemos el token (está en cookie httpOnly)
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
