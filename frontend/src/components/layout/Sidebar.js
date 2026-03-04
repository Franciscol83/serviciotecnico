import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Home,
  Users,
  FileText,
  Calendar,
  Package,
  BarChart3,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Settings,
  DollarSign,
} from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menú según rol
  const getMenuItems = () => {
    const baseItems = [
      { name: 'Dashboard', icon: Home, path: '/dashboard', roles: ['admin', 'supervisor', 'asesor', 'tecnico'] },
    ];

    const roleSpecificItems = {
      admin: [
        { name: 'Usuarios', icon: Users, path: '/users', roles: ['admin', 'supervisor'] },
        { name: 'Tipos de Servicios', icon: Package, path: '/service-types', roles: ['admin', 'supervisor'] },
        { name: 'Servicios', icon: FileText, path: '/services', roles: ['admin', 'supervisor', 'asesor', 'tecnico'] },
        { name: 'Calendario', icon: Calendar, path: '/calendar', roles: ['admin', 'supervisor', 'asesor', 'tecnico'] },
        { name: 'Inventario', icon: Package, path: '/inventory', roles: ['admin', 'supervisor'] },
        { name: 'Reportes', icon: BarChart3, path: '/reports', roles: ['admin', 'supervisor', 'tecnico'] },
        { name: 'Chat', icon: MessageSquare, path: '/chat', roles: ['admin', 'supervisor', 'asesor', 'tecnico'] },
      ],
      supervisor: [
        { name: 'Usuarios', icon: Users, path: '/users', roles: ['admin', 'supervisor'] },
        { name: 'Tipos de Servicios', icon: Package, path: '/service-types', roles: ['admin', 'supervisor'] },
        { name: 'Servicios', icon: FileText, path: '/services', roles: ['admin', 'supervisor', 'asesor', 'tecnico'] },
        { name: 'Calendario', icon: Calendar, path: '/calendar', roles: ['admin', 'supervisor', 'asesor', 'tecnico'] },
        { name: 'Inventario', icon: Package, path: '/inventory', roles: ['admin', 'supervisor'] },
        { name: 'Reportes', icon: BarChart3, path: '/reports', roles: ['admin', 'supervisor', 'tecnico'] },
        { name: 'Chat', icon: MessageSquare, path: '/chat', roles: ['admin', 'supervisor', 'asesor', 'tecnico'] },
      ],
      asesor: [
        { name: 'Servicios', icon: FileText, path: '/services', roles: ['admin', 'supervisor', 'asesor', 'tecnico'] },
        { name: 'Calendario', icon: Calendar, path: '/calendar', roles: ['admin', 'supervisor', 'asesor', 'tecnico'] },
        { name: 'Mis Ventas', icon: DollarSign, path: '/my-sales', roles: ['asesor'] },
        { name: 'Chat', icon: MessageSquare, path: '/chat', roles: ['admin', 'supervisor', 'asesor', 'tecnico'] },
      ],
      tecnico: [
        { name: 'Mis Servicios', icon: FileText, path: '/services', roles: ['admin', 'supervisor', 'asesor', 'tecnico'] },
        { name: 'Calendario', icon: Calendar, path: '/calendar', roles: ['admin', 'supervisor', 'asesor', 'tecnico'] },
        { name: 'Reportes', icon: BarChart3, path: '/reports', roles: ['admin', 'supervisor', 'tecnico'] },
        { name: 'Materiales', icon: Package, path: '/my-materials', roles: ['tecnico'] },
        { name: 'Chat', icon: MessageSquare, path: '/chat', roles: ['admin', 'supervisor', 'asesor', 'tecnico'] },
      ],
    };

    return [...baseItems, ...(roleSpecificItems[user?.role] || [])];
  };

  const menuItems = getMenuItems();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo y Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <img src="/logo-tecnonacho.png" alt="Tecno Nacho" className="h-10 w-auto object-contain" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            data-testid="sidebar-toggle"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.nombre_completo}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role === 'admin' && 'Administrador'}
                  {user?.role === 'supervisor' && 'Supervisor'}
                  {user?.role === 'asesor' && 'Asesor'}
                  {user?.role === 'tecnico' && 'Técnico'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={collapsed ? item.name : ''}
                data-testid={`sidebar-${item.name.toLowerCase().replace(/\s/g, '-')}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {/* Toggle Theme */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={collapsed ? (isDark ? 'Modo Claro' : 'Modo Oscuro') : ''}
            data-testid="sidebar-theme-toggle"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            ) : (
              <Moon className="w-5 h-5 flex-shrink-0" />
            )}
            {!collapsed && <span className="text-sm font-medium">{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title={collapsed ? 'Cerrar Sesión' : ''}
            data-testid="sidebar-logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </div>

      {/* Mobile Overlay cuando el sidebar está abierto */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setCollapsed(true)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
