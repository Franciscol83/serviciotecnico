import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Users, Calendar, FileText, Package, DollarSign, MessageSquare, BarChart3, Clock } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'supervisor':
        return <SupervisorDashboard />;
      case 'asesor':
        return <AsesorDashboard />;
      case 'tecnico':
        return <TecnicoDashboard />;
      default:
        return <div>Rol no reconocido</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {getDashboardContent()}
      </div>
    </div>
  );
};

// Dashboard para Admin
const AdminDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { name: 'Total Usuarios', value: '0', icon: Users, color: 'bg-blue-500', route: '/users' },
    { name: 'Servicios Activos', value: '0', icon: FileText, color: 'bg-green-500', route: '/services' },
    { name: 'Técnicos Disponibles', value: '0', icon: Users, color: 'bg-purple-500', route: '/users' },
    { name: 'Inventario', value: '0', icon: Package, color: 'bg-orange-500', route: '/inventory' },
  ];

  const menuItems = [
    { name: 'Gestión de Usuarios', icon: Users, route: '/users', description: 'Crear y administrar usuarios del sistema' },
    { name: 'Servicios', icon: FileText, route: '/services', description: 'Ver y gestionar todos los servicios' },
    { name: 'Calendario', icon: Calendar, route: '/calendar', description: 'Ver agenda de todos los técnicos' },
    { name: 'Inventario', icon: Package, route: '/inventory', description: 'Gestionar materiales y herramientas' },
    { name: 'Reportes', icon: BarChart3, route: '/reports', description: 'Estadísticas y reportes del sistema' },
    { name: 'Chat', icon: MessageSquare, route: '/chat', description: 'Mensajería del equipo' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administrador</h1>
        <p className="text-gray-600 mt-2">Bienvenido al sistema de gestión técnica</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            onClick={() => navigate(stat.route)}
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            data-testid={`stat-${stat.name.toLowerCase().replace(/\s/g, '-')}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Menu Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div
            key={item.name}
            onClick={() => navigate(item.route)}
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
            data-testid={`menu-${item.name.toLowerCase().replace(/\s/g, '-')}`}
          >
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <item.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Dashboard para Supervisor
const SupervisorDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { name: 'Servicios Pendientes', value: '0', icon: Clock, color: 'bg-yellow-500' },
    { name: 'En Proceso', value: '0', icon: FileText, color: 'bg-blue-500' },
    { name: 'Completados Hoy', value: '0', icon: BarChart3, color: 'bg-green-500' },
    { name: 'Técnicos Activos', value: '0', icon: Users, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Supervisor</h1>
        <p className="text-gray-600 mt-2">Gestiona y supervisa los servicios técnicos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/services/new')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Crear Servicio</p>
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Ver Calendario</p>
          </button>
          <button
            onClick={() => navigate('/users')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Ver Técnicos</p>
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard para Asesor
const AsesorDashboard = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Asesor de Ventas</h1>
        <p className="text-gray-600 mt-2">Gestiona tus clientes y agenda servicios</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mis Servicios</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes Aprobación</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/services/new')}
            className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <FileText className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-gray-700">Crear Nuevo Servicio</p>
            <p className="text-sm text-gray-500 mt-1">Agendar servicio con cliente</p>
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Calendar className="w-10 h-10 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-gray-700">Ver Calendario</p>
            <p className="text-sm text-gray-500 mt-1">Disponibilidad de técnicos</p>
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard para Técnico
const TecnicoDashboard = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Técnico</h1>
        <p className="text-gray-600 mt-2">Tus servicios y agenda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Servicios Hoy</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Proceso</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Próximos Servicios</h2>
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No tienes servicios agendados para hoy</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
