import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Users, Calendar, FileText, Package, MessageSquare } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      supervisor: 'bg-blue-100 text-blue-800',
      asesor: 'bg-green-100 text-green-800',
      tecnico: 'bg-orange-100 text-orange-800',
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
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">Tecno Nacho SAS</h1>
            <span className="ml-4 text-sm text-gray-500">Sistema de Gestión Técnica</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{user?.nombre_completo}</p>
              <div className="flex items-center justify-end space-x-2">
                <p className="text-xs text-gray-500">{user?.email}</p>
                {getRoleBadge(user?.role)}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
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
