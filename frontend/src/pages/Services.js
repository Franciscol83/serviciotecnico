import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { servicesAPI, usersAPI, serviceTypesAPI } from '@/api/client';
import {
  Plus,
  Edit,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Package,
  X,
  Clock,
  Building,
  Home,
} from 'lucide-react';

const Services = () => {
  const { user: currentUser } = useAuth();
  const [services, setServices] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedService, setSelectedService] = useState(null);
  const [message, setMessage] = useState(null);
  const [filterEstado, setFilterEstado] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar servicios por búsqueda
  const filteredServices = services.filter(s => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      s.caso_numero?.toLowerCase().includes(search) ||
      s.cliente?.nombre?.toLowerCase().includes(search) ||
      s.cliente?.email?.toLowerCase().includes(search) ||
      s.tecnico_asignado_nombre?.toLowerCase().includes(search) ||
      s.tipo_servicio_nombre?.toLowerCase().includes(search)
    );
  });

  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    cliente_direccion: '',
    cliente_tipo_documento: '',
    cliente_numero_documento: '',
    cliente_medio_pago: '',
    cliente_codigo_worldoffice: '',
    recomendaciones: '',
    ubicacion_servicio: 'por_fuera',
    servicios: [{ tipo_servicio_id: '', observaciones: '' }],
    tecnico_asignado_id: '',
    fecha_agendada: '',
  });

  useEffect(() => {
    loadServices();
    loadTecnicos();
    loadServiceTypes();
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

  const loadServiceTypes = async () => {
    try {
      const response = await serviceTypesAPI.getAll({ activo: true });
      setServiceTypes(response.data);
    } catch (error) {
      console.error('Error al cargar tipos de servicios:', error);
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
      cliente_tipo_documento: '',
      cliente_numero_documento: '',
      cliente_medio_pago: '',
      cliente_codigo_worldoffice: '',
      recomendaciones: '',
      ubicacion_servicio: 'por_fuera',
      servicios: [{ tipo_servicio_id: '', observaciones: '' }],
      tecnico_asignado_id: '',
      fecha_agendada: '',
    });
    setShowModal(true);
  };

  const handleAgregarServicio = (service) => {
    setModalType('agregar');
    setSelectedService(service);
    setFormData({
      tipo_servicio_id: '',
      observaciones: '',
    });
    setShowModal(true);
  };

  const agregarServicioItem = () => {
    setFormData({
      ...formData,
      servicios: [...formData.servicios, { tipo_servicio_id: '', observaciones: '' }],
    });
  };

  const eliminarServicioItem = (index) => {
    if (formData.servicios.length === 1) {
      showMessage('Debe haber al menos un servicio', 'error');
      return;
    }
    const nuevosServicios = formData.servicios.filter((_, i) => i !== index);
    setFormData({ ...formData, servicios: nuevosServicios });
  };

  const actualizarServicioItem = (index, campo, valor) => {
    const nuevosServicios = [...formData.servicios];
    nuevosServicios[index][campo] = valor;
    setFormData({ ...formData, servicios: nuevosServicios });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalType === 'create') {
        // Validar que todos los servicios tengan tipo seleccionado
        const serviciosIncompletos = formData.servicios.filter((s) => !s.tipo_servicio_id);
        if (serviciosIncompletos.length > 0) {
          showMessage('Debes seleccionar el tipo para todos los servicios', 'error');
          return;
        }

        // Validar fecha agendada si es "por fuera"
        if (formData.ubicacion_servicio === 'por_fuera' && !formData.fecha_agendada) {
          showMessage('La fecha agendada es requerida para servicios por fuera del local', 'error');
          return;
        }

        // Validar datos de facturación (obligatorios siempre excepto medio_pago)
        if (!formData.cliente_tipo_documento) {
          showMessage('El tipo de documento es requerido', 'error');
          return;
        }
        if (!formData.cliente_numero_documento) {
          showMessage('El número de documento es requerido', 'error');
          return;
        }

        const [primerServicio, ...serviciosAdicionales] = formData.servicios;

        const payload = {
          cliente: {
            nombre: formData.cliente_nombre,
            telefono: formData.cliente_telefono,
            email: formData.cliente_email,
            direccion: formData.cliente_direccion,
            tipo_documento: formData.cliente_tipo_documento,
            numero_documento: formData.cliente_numero_documento,
            medio_pago: formData.cliente_medio_pago || null,
            codigo_worldoffice: formData.cliente_codigo_worldoffice || null,
          },
          tipo_servicio_id: primerServicio.tipo_servicio_id,
          observaciones: primerServicio.observaciones,
          recomendaciones: formData.recomendaciones,
          ubicacion_servicio: formData.ubicacion_servicio,
          tecnico_asignado_id: formData.tecnico_asignado_id,
          fecha_agendada: formData.fecha_agendada || null,
          items_adicionales: serviciosAdicionales,
        };

        await servicesAPI.create(payload);
        showMessage(
          `Orden creada exitosamente con ${formData.servicios.length} servicio(s)`,
          'success'
        );
      } else if (modalType === 'agregar') {
        // Agregar servicio a orden existente
        if (!formData.tipo_servicio_id) {
          showMessage('Debes seleccionar el tipo de servicio', 'error');
          return;
        }

        await servicesAPI.agregarItem(selectedService.id, {
          tipo_servicio_id: formData.tipo_servicio_id,
          observaciones: formData.observaciones,
        });
        showMessage('Servicio agregado exitosamente a la orden', 'success');
      }

      setShowModal(false);
      loadServices();
    } catch (error) {
      console.error('Error:', error);
      showMessage(error.response?.data?.detail || 'Error al guardar', 'error');
    }
  };

  const handleAprobar = async (serviceId) => {
    if (!window.confirm('¿Aprobar esta orden?')) return;

    try {
      await servicesAPI.aprobar(serviceId);
      showMessage('Orden aprobada exitosamente', 'success');
      loadServices();
    } catch (error) {
      console.error('Error:', error);
      showMessage(error.response?.data?.detail || 'Error al aprobar orden', 'error');
    }
  };

  const handleAnular = async (serviceId) => {
    const razon = window.prompt('Ingresa la razón de anulación:');
    if (!razon) return;

    try {
      await servicesAPI.anular(serviceId, { razon_anulacion: razon });
      showMessage('Orden anulada exitosamente', 'success');
      loadServices();
    } catch (error) {
      console.error('Error:', error);
      showMessage(error.response?.data?.detail || 'Error al anular orden', 'error');
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente_aprobacion: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        text: 'Pendiente',
      },
      aprobado: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', text: 'Aprobado' },
      en_proceso: {
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        text: 'En Proceso',
      },
      completado: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Completado' },
      cancelado: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', text: 'Cancelado' },
      anulado: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Anulado' },
    };
    const badge = badges[estado] || badges.aprobado;
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
  };

  const canAgregarServicio = (service) => {
    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') return true;
    if (
      currentUser.role === 'asesor' &&
      service.creado_por_id === currentUser.id &&
      service.estado === 'pendiente_aprobacion'
    )
      return true;
    return false;
  };

  const canAprobar = (service) => {
    return (
      (currentUser.role === 'admin' || currentUser.role === 'supervisor') &&
      service.estado === 'pendiente_aprobacion'
    );
  };

  const canAnular = (service) => {
    return (currentUser.role === 'admin' || currentUser.role === 'supervisor') && service.estado !== 'anulado';
  };

  const getTotalServicios = (service) => {
    return 1 + (service.items_servicio?.length || 0);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Órdenes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Administrar órdenes de servicio</p>
          </div>
          {['admin', 'supervisor', 'asesor'].includes(currentUser?.role) && (
            <button
              onClick={handleCreate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="create-service-button"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Orden</span>
            </button>
          )}
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por caso, cliente, técnico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Estado Filter */}
            <div className="sm:w-48">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <Filter className="w-4 h-4 inline mr-1" />
            Mostrando {filteredServices.length} orden(es)
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
            <p className="text-gray-500 dark:text-gray-400">No se encontraron órdenes</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm ? 'Intenta con otro término de búsqueda' : 'Las órdenes creadas aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{service.caso_numero}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(service.fecha_creacion).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.ubicacion_servicio === 'en_local' ? (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        En Local
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        Por Fuera
                      </span>
                    )}
                    {getEstadoBadge(service.estado)}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{service.cliente.nombre}</p>
                      <p className="text-xs text-gray-500">{service.cliente.email}</p>
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

                  {/* Servicios en esta orden */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Servicios ({getTotalServicios(service)})
                      </p>
                    </div>

                    {/* Servicio principal */}
                    <div className="mb-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      <div className="flex items-start space-x-2">
                        <Package className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {service.tipo_servicio_nombre}
                          </p>
                          {service.observaciones && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                              {service.observaciones}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Servicios adicionales */}
                    {service.items_servicio?.map((item, idx) => (
                      <div key={idx} className="mb-2 bg-gray-50 dark:bg-gray-700/30 p-2 rounded">
                        <div className="flex items-start space-x-2">
                          <Package className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {item.tipo_servicio_nombre}
                            </p>
                            {item.observaciones && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                                {item.observaciones}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Agregado por {item.agregado_por_nombre}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  {canAgregarServicio(service) && (
                    <button
                      onClick={() => handleAgregarServicio(service)}
                      className="flex-1 px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Agregar Servicio
                    </button>
                  )}
                  {canAprobar(service) && (
                    <button
                      onClick={() => handleAprobar(service.id)}
                      className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Aprobar
                    </button>
                  )}
                  {canAnular(service) && (
                    <button
                      onClick={() => handleAnular(service.id)}
                      className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      <XCircle className="w-4 h-4 inline mr-1" />
                      Anular
                    </button>
                  )}
                </div>
              </div>
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
            serviceTypes={serviceTypes}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            agregarServicioItem={agregarServicioItem}
            eliminarServicioItem={eliminarServicioItem}
            actualizarServicioItem={actualizarServicioItem}
          />
        )}
      </div>
    </MainLayout>
  );
};

// Componente ServiceModal
const ServiceModal = ({
  modalType,
  formData,
  setFormData,
  tecnicos,
  serviceTypes,
  onClose,
  onSubmit,
  agregarServicioItem,
  eliminarServicioItem,
  actualizarServicioItem,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {modalType === 'create' ? 'Nueva Orden de Servicio' : 'Agregar Servicio a Orden'}
      </h2>

      <form onSubmit={onSubmit} className="space-y-6">
        {modalType === 'create' ? (
          <>
            {/* Información del Cliente */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Información del Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.cliente_nombre}
                    onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.cliente_telefono}
                    onChange={(e) => setFormData({ ...formData, cliente_telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={formData.cliente_direccion}
                    onChange={(e) => setFormData({ ...formData, cliente_direccion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Ubicación del Servicio - Mostrar primero para condicionar otros campos */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Ubicación del Servicio
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ubicación del Servicio *
                </label>
                <select
                  value={formData.ubicacion_servicio}
                  onChange={(e) => setFormData({ ...formData, ubicacion_servicio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="por_fuera">Por Fuera del Local</option>
                  <option value="en_local">En el Local</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.ubicacion_servicio === 'en_local'
                    ? 'No requiere fecha agendada ni datos de facturación'
                    : 'Requiere fecha agendada y datos de facturación'}
                </p>
              </div>
            </div>

            {/* Datos de Facturación - Siempre visibles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Datos de Facturación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Documento *
                  </label>
                  <select
                    value={formData.cliente_tipo_documento}
                    onChange={(e) => setFormData({ ...formData, cliente_tipo_documento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="cedula">Cédula de Ciudadanía</option>
                    <option value="nit">NIT</option>
                    <option value="cedula_extranjeria">Cédula de Extranjería</option>
                    <option value="pasaporte">Pasaporte</option>
                    <option value="registro_civil">Registro Civil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    value={formData.cliente_numero_documento}
                    onChange={(e) => setFormData({ ...formData, cliente_numero_documento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: 1234567890"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Código WorldOffice
                  </label>
                  <input
                    type="text"
                    value={formData.cliente_codigo_worldoffice}
                    onChange={(e) => setFormData({ ...formData, cliente_codigo_worldoffice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: WO-12345"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Código interno del cliente en WorldOffice
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Medio de Pago
                  </label>
                  <select
                    value={formData.cliente_medio_pago}
                    onChange={(e) => setFormData({ ...formData, cliente_medio_pago: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Seleccionar (Opcional)...</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta_debito">Tarjeta Débito</option>
                    <option value="tarjeta_credito">Tarjeta Crédito</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="credito">Crédito</option>
                    <option value="garantia">Garantía</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Puede registrarse posteriormente
                  </p>
                </div>
              </div>
            </div>

            {/* Asignación */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Asignación
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Técnico Asignado *
                  </label>
                  <select
                    value={formData.tecnico_asignado_id}
                    onChange={(e) => setFormData({ ...formData, tecnico_asignado_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Seleccionar técnico...</option>
                    {tecnicos.map((tecnico) => (
                      <option key={tecnico.id} value={tecnico.id}>
                        {tecnico.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.ubicacion_servicio === 'por_fuera' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha Agendada *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.fecha_agendada}
                      onChange={(e) => setFormData({ ...formData, fecha_agendada: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required={formData.ubicacion_servicio === 'por_fuera'}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Servicios */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Servicios a Realizar
                </h3>
                <button
                  type="button"
                  onClick={agregarServicioItem}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Servicio
                </button>
              </div>

              <div className="space-y-4">
                {formData.servicios.map((servicio, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Servicio {index + 1}
                      </span>
                      {formData.servicios.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarServicioItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tipo de Servicio *
                        </label>
                        <select
                          value={servicio.tipo_servicio_id}
                          onChange={(e) => actualizarServicioItem(index, 'tipo_servicio_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          required
                        >
                          <option value="">Seleccionar tipo...</option>
                          {serviceTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Observaciones Específicas
                        </label>
                        <textarea
                          value={servicio.observaciones}
                          onChange={(e) => actualizarServicioItem(index, 'observaciones', e.target.value)}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Detalles específicos de este servicio..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recomendaciones */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Recomendaciones
              </h3>
              <textarea
                value={formData.recomendaciones}
                onChange={(e) => setFormData({ ...formData, recomendaciones: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ej: Cliente prefiere horario matutino. Requiere instalación urgente..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Notas internas, recomendaciones del asesor o detalles importantes para el supervisor
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Agregar servicio a orden existente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Servicio *
              </label>
              <select
                value={formData.tipo_servicio_id}
                onChange={(e) => setFormData({ ...formData, tipo_servicio_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Seleccionar tipo...</option>
                {serviceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observaciones Específicas
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Detalles específicos de este servicio..."
              />
            </div>
          </>
        )}

        <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
            {modalType === 'create' ? 'Crear Orden' : 'Agregar Servicio'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default Services;
