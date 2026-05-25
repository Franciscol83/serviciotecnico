import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { servicesAPI, usersAPI, serviceTypesAPI } from '@/api/client';
import { Plus, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import ServiceCard from '@/components/services/ServiceCard';
import ServiceFilters from '@/components/services/ServiceFilters';
import ServiceModal from '@/components/services/ServiceModal';
import { getNombreCompletoCliente } from '@/components/services/serviceHelpers';

const INITIAL_FORM = {
  cliente_primer_nombre: '',
  cliente_segundo_nombre: '',
  cliente_primer_apellido: '',
  cliente_segundo_apellido: '',
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
};

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
  const [formData, setFormData] = useState(INITIAL_FORM);

  const filteredServices = services.filter((s) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const nombreCompleto = getNombreCompletoCliente(s.cliente).toLowerCase();
    return (
      s.caso_numero?.toLowerCase().includes(search) ||
      nombreCompleto.includes(search) ||
      s.cliente?.email?.toLowerCase().includes(search) ||
      s.tecnico_asignado_nombre?.toLowerCase().includes(search) ||
      s.tipo_servicio_nombre?.toLowerCase().includes(search)
    );
  });

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterEstado) params.estado = filterEstado;
      const response = await servicesAPI.getAll(params);
      setServices(response.data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al cargar servicios:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [filterEstado]);

  const loadTecnicos = useCallback(async () => {
    try {
      const response = await usersAPI.getAll();
      setTecnicos(response.data.filter((u) => u.role === 'tecnico' && u.activo));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al cargar técnicos:', error);
      }
    }
  }, []);

  const loadServiceTypes = useCallback(async () => {
    try {
      const response = await serviceTypesAPI.getAll({ activo: true });
      setServiceTypes(response.data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al cargar tipos de servicios:', error);
      }
    }
  }, []);

  useEffect(() => {
    loadServices();
    loadTecnicos();
    loadServiceTypes();
  }, [loadServices, loadTecnicos, loadServiceTypes]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreate = () => {
    setModalType('create');
    setFormData(INITIAL_FORM);
    setShowModal(true);
  };

  const handleAgregarServicio = (service) => {
    setModalType('agregar');
    setSelectedService(service);
    setFormData({ tipo_servicio_id: '', observaciones: '' });
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
    setFormData({ ...formData, servicios: formData.servicios.filter((_, i) => i !== index) });
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
        if (formData.servicios.some((s) => !s.tipo_servicio_id)) {
          showMessage('Debes seleccionar el tipo para todos los servicios', 'error');
          return;
        }
        if (formData.ubicacion_servicio === 'por_fuera' && !formData.fecha_agendada) {
          showMessage('La fecha agendada es requerida para servicios por fuera del local', 'error');
          return;
        }
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
            primer_nombre: formData.cliente_primer_nombre,
            segundo_nombre: formData.cliente_segundo_nombre || null,
            primer_apellido: formData.cliente_primer_apellido,
            segundo_apellido: formData.cliente_segundo_apellido || null,
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

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="services-page">
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

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200'
            }`}
            data-testid="services-message"
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p
              className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <ServiceFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterEstado={filterEstado}
          setFilterEstado={setFilterEstado}
          count={filteredServices.length}
        />

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
              <ServiceCard
                key={service.id}
                service={service}
                currentUser={currentUser}
                onAgregar={handleAgregarServicio}
                onAprobar={handleAprobar}
                onAnular={handleAnular}
              />
            ))}
          </div>
        )}

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

export default Services;
