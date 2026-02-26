import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      supervisor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      asesor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      tecnico: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    const labels = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      asesor: 'Asesor',
      tecnico: 'Técnico',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[role]}`}>
        {labels[role]}
      </span>
    );
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center space-x-4">
            <img 
              src="/logo-tecnonacho.png" 
              alt="Tecno Nacho" 
              className="h-12 w-auto object-contain"
            />
            <div className="border-l border-gray-300 dark:border-gray-600 h-8"></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">Sistema de Gestión Técnica</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Toggle Tema */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              data-testid="theme-toggle"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Info Usuario */}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.nombre_completo}</p>
              <div className="flex items-center justify-end space-x-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                {getRoleBadge(user?.role)}
              </div>
            </div>

            {/* Botón Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
