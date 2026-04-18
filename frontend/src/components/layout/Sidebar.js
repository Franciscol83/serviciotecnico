import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Package,
  BarChart3,
  MessageSquare,
  LogOut,
  Moon,
  Sun,
  Settings,
  Menu,
  X,
  Briefcase
} from 'lucide-react';

const Sidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  // Menú según rol
  const getMenuItems = () => {
    const baseItems = [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { 
        name: user?.role === 'tecnico' ? 'Mis Servicios' : 'Servicios', 
        icon: Briefcase, 
        path: '/services' 
      },
      { name: 'Calendario', icon: Calendar, path: '/calendar' },
    ];

    const roleSpecificItems = {
      admin: [
        { name: 'Usuarios', icon: Users, path: '/users' },
        { name: 'Tipos de Servicio', icon: Settings, path: '/service-types' },
        { name: 'Inventario', icon: Package, path: '/inventory' },
        { name: 'Reportes', icon: BarChart3, path: '/reportes' },
        { name: 'Chat', icon: MessageSquare, path: '/chat' },
        { name: 'Configuración', icon: Settings, path: '/configuracion' },
      ],
      supervisor: [
        { name: 'Usuarios', icon: Users, path: '/users' },
        { name: 'Tipos de Servicio', icon: Settings, path: '/service-types' },
        { name: 'Inventario', icon: Package, path: '/inventory' },
        { name: 'Reportes', icon: BarChart3, path: '/reportes' },
        { name: 'Chat', icon: MessageSquare, path: '/chat' },
      ],
      asesor: [
        { name: 'Chat', icon: MessageSquare, path: '/chat' },
      ],
      tecnico: [
        { name: 'Reportes Técnicos', icon: BarChart3, path: '/reportes' },
        { name: 'Chat', icon: MessageSquare, path: '/chat' },
      ],
    };

    return [...baseItems, ...(roleSpecificItems[user?.role] || [])];
  };

  const menuItems = getMenuItems();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Header con Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 dark:bg-gray-800 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/logo-tecnonacho.png" alt="TecnoNacho" className="h-8 w-8" />
          <span className="font-bold text-lg">TecnoNacho</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay para móvil */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gray-900 dark:bg-gray-800 text-white z-40
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
          w-64 flex flex-col
        `}
      >
        {/* Logo - Solo desktop */}
        <div className="hidden lg:flex items-center gap-3 p-6 border-b border-gray-700">
          <img src="/logo-tecnonacho.png" alt="TecnoNacho" className="h-10 w-10" />
          <div>
            <h1 className="font-bold text-xl">TecnoNacho</h1>
            <p className="text-xs text-gray-400">Tu mejor opción</p>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-700 mt-16 lg:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {user?.nombre_completo?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.nombre_completo}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  closeMobileMenu();
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                  ${active 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          {/* Toggle Theme */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-5 h-5" />
                <span className="text-sm">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                <span className="text-sm">Modo Oscuro</span>
              </>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
