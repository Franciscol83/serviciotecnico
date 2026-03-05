import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { servicesAPI, usersAPI } from '@/api/client';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { Calendar as CalendarIcon, User, MapPin, Package, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const Calendar = () => {
  const { user: currentUser } = useAuth();
  const calendarRef = useRef(null);
  const [services, setServices] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState(null);
  const [filterTecnico, setFilterTecnico] = useState('');
  const [view, setView] = useState('timeGridWeek'); // Vista inicial: Semanal

  useEffect(() => {
    loadData();
  }, [filterTecnico]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Cargar todos los servicios
      const servicesResponse = await servicesAPI.getAll();
      const allServices = servicesResponse.data;
      
      // Filtrar servicios aprobados, en proceso o completados CON fecha agendada
      let serviciosConFecha = allServices.filter(s => 
        s.fecha_agendada && 
        (s.estado === 'aprobado' || s.estado === 'en_proceso' || s.estado === 'completado')
      );
      
      // Filtrar por técnico si está seleccionado
      if (filterTecnico) {
        serviciosConFecha = serviciosConFecha.filter(s => s.tecnico_asignado_id === filterTecnico);
      }
      
      setServices(serviciosConFecha);

      // Cargar técnicos
      const usersResponse = await usersAPI.getAll();
      const tecnicosOnly = usersResponse.data.filter(u => u.role === 'tecnico' && u.activo);
      setTecnicos(tecnicosOnly);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showMessage('Error al cargar datos del calendario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Convertir servicios a eventos de FullCalendar
  const getEvents = () => {
    return services.map(service => {
      // TODOS los eventos del mismo color (azul)
      const color = '#3b82f6'; // Azul uniforme para todos los servicios

      // Formatear hora
      const fecha = new Date(service.fecha_agendada);
      const hora = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });

      // Título más descriptivo con técnico
      const tecnico = tecnicos.find(t => t.id === service.tecnico_asignado_id);
      const tecnicoNombre = tecnico ? tecnico.nombre_completo : 'Sin asignar';
      const titulo = `${hora} - ${service.caso_numero}\n${service.cliente.nombre}\n${tecnicoNombre}`;

      return {
        id: service.id,
        title: titulo,
        start: service.fecha_agendada,
        end: service.fecha_agendada,
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff',
        extendedProps: {
          service: service,
        },
      };
    });
  };

  // Obtener técnicos ocupados en el rango visible del calendario
  const getTecnicosOcupados = () => {
    const tecnicosOcupadosIds = new Set(services.map(s => s.tecnico_asignado_id));
    return tecnicos.filter(t => tecnicosOcupadosIds.has(t.id));
  };

  // Obtener técnicos disponibles
  const getTecnicosDisponibles = () => {
    const tecnicosOcupadosIds = new Set(services.map(s => s.tecnico_asignado_id));
    return tecnicos.filter(t => !tecnicosOcupadosIds.has(t.id));
  };

  // Manejar clic en evento
  const handleEventClick = (info) => {
    const service = info.event.extendedProps.service;
    setSelectedService(service);
    setShowModal(true);
  };

  // Manejar cambio de vista
  const handleViewChange = (newView) => {
    setView(newView);
    const calendarApi = calendarRef.current.getApi();
    calendarApi.changeView(newView);
  };

  // Navegar en el calendario
  const handleNavigate = (action) => {
    const calendarApi = calendarRef.current.getApi();
    if (action === 'prev') calendarApi.prev();
    else if (action === 'next') calendarApi.next();
    else if (action === 'today') calendarApi.today();
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      aprobado: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', text: 'Aprobado' },
      en_proceso: {
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        text: 'En Proceso',
      },
      completado: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Completado' },
    };
    const badge = badges[estado] || badges.aprobado;
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <CalendarIcon className="w-8 h-8 mr-3" />
                Calendario de Servicios
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Vista de agendamiento de servicios y disponibilidad de técnicos
              </p>
            </div>
          </div>
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

        {/* Controles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Filtro por técnico */}
            <div className="flex items-center space-x-4">
              <User className="text-gray-400 w-5 h-5" />
              <select
                value={filterTecnico}
                onChange={(e) => setFilterTecnico(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos los técnicos</option>
                {tecnicos.map((tecnico) => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.nombre_completo}
                  </option>
                ))}
              </select>
            </div>

            {/* Navegación */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleNavigate('prev')}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                ◀ Anterior
              </button>
              <button
                onClick={() => handleNavigate('today')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={() => handleNavigate('next')}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Siguiente ▶
              </button>
            </div>

            {/* Selector de vista */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleViewChange('dayGridMonth')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  view === 'dayGridMonth'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => handleViewChange('timeGridWeek')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  view === 'timeGridWeek'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => handleViewChange('timeGridDay')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  view === 'timeGridDay'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Día
              </button>
            </div>
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={view}
              locale={esLocale}
              headerToolbar={false} // Usamos nuestros propios controles
              events={getEvents()}
              eventClick={handleEventClick}
              height="auto"
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              allDaySlot={false}
              expandRows={true}
              nowIndicator={true}
              slotDuration="01:00:00"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
              }}
              // Estilos para tema oscuro
              themeSystem="standard"
            />
          )}
        </div>

        {/* Leyenda de técnicos: Ocupados vs Disponibles */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Estado de Técnicos:</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Técnicos Ocupados */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ocupados ({getTecnicosOcupados().length})
                </span>
              </div>
              <div className="space-y-2">
                {getTecnicosOcupados().length > 0 ? (
                  getTecnicosOcupados().map((tecnico) => (
                    <div key={tecnico.id} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-3 h-3" />
                      <span>{tecnico.nombre_completo}</span>
                      {tecnico.profile?.codigo_worldoffice && (
                        <span className="text-xs text-gray-500">({tecnico.profile.codigo_worldoffice})</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-500 italic">Ningún técnico ocupado</p>
                )}
              </div>
            </div>

            {/* Técnicos Disponibles */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Disponibles ({getTecnicosDisponibles().length})
                </span>
              </div>
              <div className="space-y-2">
                {getTecnicosDisponibles().length > 0 ? (
                  getTecnicosDisponibles().map((tecnico) => (
                    <div key={tecnico.id} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-3 h-3" />
                      <span>{tecnico.nombre_completo}</span>
                      {tecnico.profile?.codigo_worldoffice && (
                        <span className="text-xs text-gray-500">({tecnico.profile.codigo_worldoffice})</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-500 italic">Todos los técnicos ocupados</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Detalles */}
        {showModal && selectedService && (
          <ServiceDetailModal service={selectedService} onClose={() => setShowModal(false)} />
        )}
      </div>
    </MainLayout>
  );
};

// Modal de Detalles del Servicio
const ServiceDetailModal = ({ service, onClose }) => {
  const getTotalServicios = () => {
    return 1 + (service.items_servicio?.length || 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{service.caso_numero}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Creado el {new Date(service.fecha_creacion).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Estado */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                service.estado === 'aprobado'
                  ? 'bg-blue-100 text-blue-800'
                  : service.estado === 'en_proceso'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {service.estado === 'aprobado' && 'Aprobado'}
              {service.estado === 'en_proceso' && 'En Proceso'}
              {service.estado === 'completado' && 'Completado'}
            </span>
          </div>

          {/* Cliente */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Cliente
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nombre</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{service.cliente.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{service.cliente.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Teléfono</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{service.cliente.telefono}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dirección</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{service.cliente.direccion}</p>
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Servicios ({getTotalServicios()})
            </h3>
            <div className="space-y-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {service.tipo_servicio_nombre}
                </p>
                {service.observaciones && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">{service.observaciones}</p>
                )}
              </div>
              {service.items_servicio?.map((item, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.tipo_servicio_nombre}</p>
                  {item.observaciones && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">{item.observaciones}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Asignación */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Asignación
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Técnico Asignado</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{service.tecnico_asignado_nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fecha y Hora Agendada</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(service.fecha_agendada).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ubicación</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {service.ubicacion_servicio === 'en_local' ? 'En el Local' : 'Por Fuera del Local'}
                </p>
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          {service.recomendaciones && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recomendaciones</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">{service.recomendaciones}</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
