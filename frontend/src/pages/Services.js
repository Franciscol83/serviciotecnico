import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { servicesAPI, usersAPI } from '@/api/client';
import {
  Plus,
  Edit,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Calendar,
  MapPin,
  Mail,
  Phone,
  DollarSign,
} from 'lucide-react';

const Services = () => {
  const { user: currentUser } = useAuth();
  const [services, setServices] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedService, setSelectedService] = useState(null);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [stats, setStats] = useState(null);

  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    cliente_direccion: '',
    descripcion: '',
    tecnico_asignado_id: '',
    fecha_agendada: '',
  });

  useEffect(() => {
    loadServices();
    loadTecnicos();
    loadStats();
  }, [filterEstado]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterEstado) params.estado = filterEstado;
      const response = await servicesAPI.getAll(params);
      setServices(response.data);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      showMessage('Error al cargar servicios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTecnicos = async () => {
    try {
      const response = await usersAPI.getAll();
      const tecnicosOnly = response.data.filter((u) => u.role === 'tecnico' && u.activo);
      setTecnicos(tecnicosOnly);
    } catch (error) {
      console.error('Error al cargar técnicos:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await servicesAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreate = () => {
    setModalType('create');
    setFormData({
      cliente_nombre: '',
      cliente_telefono: '',
      cliente_email: '',
      cliente_direccion: '',
      descripcion: '',
      tecnico_asignado_id: '',
      fecha_agendada: '',
    });
    setShowModal(true);
  };

  const handleEdit = (service) => {
    setModalType('edit');
    setSelectedService(service);
    setFormData({
      cliente_nombre: service.cliente.nombre,
      cliente_telefono: service.cliente.telefono,
      cliente_email: service.cliente.email,
      cliente_direccion: service.cliente.direccion,
      descripcion: service.descripcion,
      tecnico_asignado_id: service.tecnico_asignado_id,
      fecha_agendada: service.fecha_agendada ? new Date(service.fecha_agendada).toISOString().slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        cliente: {
          nombre: formData.cliente_nombre,
          telefono: formData.cliente_telefono,
          email: formData.cliente_email,
          direccion: formData.cliente_direccion,
        },
        descripcion: formData.descripcion,
        tecnico_asignado_id: formData.tecnico_asignado_id,
        fecha_agendada: formData.fecha_agendada || null,
      };

      if (modalType === 'create') {
        await servicesAPI.create(payload);
        showMessage('Servicio creado exitosamente', 'success');
      } else {
        await servicesAPI.update(selectedService.id, payload);
        showMessage('Servicio actualizado exitosamente', 'success');
      }

      setShowModal(false);
      loadServices();
      loadStats();
    } catch (error) {
      console.error('Error:', error);
      showMessage(error.response?.data?.detail || 'Error al guardar servicio', 'error');
    }
  };

  const handleAprobar = async (serviceId) => {
    if (!window.confirm('¿Aprobar este servicio?')) return;

    try {
      await servicesAPI.aprobar(serviceId);
      showMessage('Servicio aprobado exitosamente', 'success');
      loadServices();
      loadStats();
    } catch (error) {
      console.error('Error:', error);
      showMessage(error.response?.data?.detail || 'Error al aprobar servicio', 'error');
    }
  };

  const handleAnular = async (serviceId) => {
    const razon = window.prompt('Ingresa la razón de anulación:');
    if (!razon) return;

    try {
      await servicesAPI.anular(serviceId, { razon_anulacion: razon });
      showMessage('Servicio anulado exitosamente', 'success');
      loadServices();
      loadStats();
    } catch (error) {
      console.error('Error:', error);
      showMessage(error.response?.data?.detail || 'Error al anular servicio', 'error');
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente_aprobacion: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'Pendiente Aprobación' },
      aprobado: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', text: 'Aprobado' },
      en_proceso: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', text: 'En Proceso' },
      completado: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Completado' },
      cancelado: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', text: 'Cancelado' },
      anulado: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Anulado' },
    };
    const badge = badges[estado] || badges.aprobado;
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
  };

  const filteredServices = services.filter((service) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      service.caso_numero.toLowerCase().includes(searchLower) ||
      service.cliente.nombre.toLowerCase().includes(searchLower) ||
      service.cliente.email.toLowerCase().includes(searchLower) ||
      service.descripcion.toLowerCase().includes(searchLower)
    );
  });

  const canEdit = (service) => {
    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') return true;
    if (currentUser.role === 'asesor' && service.creado_por_id === currentUser.id && service.estado === 'pendiente_aprobacion') return true;
    return false;
  };

  const canAprobar = (service) => {
    return (currentUser.role === 'admin' || currentUser.role === 'supervisor') && service.estado === 'pendiente_aprobacion';
  };

  const canAnular = (service) => {
    return (currentUser.role === 'admin' || currentUser.role === 'supervisor') && service.estado !== 'anulado';
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Servicios</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Administrar servicios técnicos</p>
          </div>
          {['admin', 'supervisor', 'asesor'].includes(currentUser?.role) && (
            <button
              onClick={handleCreate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="create-service-button"
            >
              <Plus className="w-5 h-5" />
              <span>Crear Servicio</span>
            </button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <StatCard label="Total" value={stats.total} color="bg-gray-500" />
            <StatCard label="Pendientes" value={stats.pendiente_aprobacion} color="bg-yellow-500" />
            <StatCard label="Aprobados" value={stats.aprobado} color="bg-blue-500" />
            <StatCard label="En Proceso" value={stats.en_proceso} color="bg-purple-500" />
            <StatCard label="Completados" value={stats.completado} color="bg-green-500" />
            <StatCard label="Cancelados" value={stats.cancelado} color="bg-gray-500" />
            <StatCard label="Anulados" value={stats.anulado} color="bg-red-500" />
          </div>
        )}

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <p
              className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por caso, cliente, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos los estados</option>
                <option value="pendiente_aprobacion">Pendiente Aprobación</option>
                <option value="aprobado">Aprobado</option>
                <option value="en_proceso">En Proceso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
                <option value="anulado">Anulado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No se encontraron servicios</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                canEdit={canEdit(service)}
                canAprobar={canAprobar(service)}
                canAnular={canAnular(service)}
                onEdit={() => handleEdit(service)}
                onAprobar={() => handleAprobar(service.id)}
                onAnular={() => handleAnular(service.id)}
                getEstadoBadge={getEstadoBadge}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <ServiceModal
            modalType={modalType}
            formData={formData}
            setFormData={setFormData}
            tecnicos={tecnicos}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </MainLayout>
  );
};

// Componente StatCard
const StatCard = ({ label, value, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`${color} p-2 rounded-lg`}>
        <FileText className="w-4 h-4 text-white" />
      </div>
    </div>
  </div>
);

// Componente ServiceCard
const ServiceCard = ({ service, canEdit, canAprobar, canAnular, onEdit, onAprobar, onAnular, getEstadoBadge }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{service.caso_numero}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(service.fecha_creacion).toLocaleDateString()}</p>
      </div>
      {getEstadoBadge(service.estado)}
    </div>

    <div className="space-y-3 mb-4">
      <div className="flex items-start space-x-2">
        <User className="w-4 h-4 text-gray-400 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{service.cliente.nombre}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{service.cliente.email}</p>
        </div>
      </div>

      <div className="flex items-start space-x-2">
        <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
        <p className="text-sm text-gray-700 dark:text-gray-300">{service.cliente.telefono}</p>
      </div>

      <div className="flex items-start space-x-2">
        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
        <p className="text-sm text-gray-700 dark:text-gray-300">{service.cliente.direccion}</p>
      </div>

      <div className="flex items-start space-x-2">
        <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
        <p className="text-sm text-gray-700 dark:text-gray-300">{service.descripcion}</p>
      </div>

      <div className="flex items-start space-x-2">
        <User className="w-4 h-4 text-gray-400 mt-0.5" />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">Técnico:</span> {service.tecnico_asignado_nombre}
        </p>
      </div>

      {service.fecha_agendada && (
        <div className="flex items-start space-x-2">
          <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {new Date(service.fecha_agendada).toLocaleString()}
          </p>
        </div>
      )}
    </div>

    <div className="flex space-x-2 pt-4 border-t border-gray-100 dark:border-gray-700">
      {canEdit && (
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm"
        >
          <Edit className="w-4 h-4 inline mr-1" />
          Editar
        </button>
      )}
      {canAprobar && (
        <button
          onClick={onAprobar}
          className="flex-1 px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors text-sm"
        >
          <CheckCircle className="w-4 h-4 inline mr-1" />
          Aprobar
        </button>
      )}
      {canAnular && (
        <button
          onClick={onAnular}
          className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-sm"
        >
          <XCircle className="w-4 h-4 inline mr-1" />
          Anular
        </button>
      )}
    </div>
  </div>
);

// Componente ServiceModal
const ServiceModal = ({ modalType, formData, setFormData, tecnicos, onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {modalType === 'create' ? 'Crear Servicio' : 'Editar Servicio'}
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre del Cliente *</label>
            <input
              type="text"
              value={formData.cliente_nombre}
              onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Teléfono *</label>
            <input
              type="tel"
              value={formData.cliente_telefono}
              onChange={(e) => setFormData({ ...formData, cliente_telefono: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email *</label>
            <input
              type="email"
              value={formData.cliente_email}
              onChange={(e) => setFormData({ ...formData, cliente_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dirección *</label>
            <input
              type="text"
              value={formData.cliente_direccion}
              onChange={(e) => setFormData({ ...formData, cliente_direccion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción del Servicio *</label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Técnico Asignado *</label>
            <select
              value={formData.tecnico_asignado_id}
              onChange={(e) => setFormData({ ...formData, tecnico_asignado_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Seleccionar técnico</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha Agendada</label>
            <input
              type="datetime-local"
              value={formData.fecha_agendada}
              onChange={(e) => setFormData({ ...formData, fecha_agendada: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {modalType === 'create' ? 'Crear' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default Services;
