import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { servicesAPI, usersAPI } from '@/api/client';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { User, Briefcase, Calendar as CalendarIcon, Search, Filter, X } from 'lucide-react';

const Calendar = () => {
  const { user: currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Filtros
  const [filterTecnico, setFilterTecnico] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadTecnicos = useCallback(async () => {
    try {
      const response = await usersAPI.getAll();
      const tecnicosData = response.data.filter(u => 
        u.roles?.includes('tecnico') || u.role === 'tecnico'
      );
      setTecnicos(tecnicosData);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getAll();
      
      // Filtrar servicios
      let serviciosFiltrados = response.data.filter(s => s.fecha_agendada);
      
      // Aplicar filtros
      if (filterTecnico) {
        serviciosFiltrados = serviciosFiltrados.filter(s => s.tecnico_asignado_id === filterTecnico);
      }
      
      if (filterEstado) {
        serviciosFiltrados = serviciosFiltrados.filter(s => s.estado === filterEstado);
      }
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        serviciosFiltrados = serviciosFiltrados.filter(s => 
          s.numero_caso?.toLowerCase().includes(search) ||
          s.cliente?.nombre?.toLowerCase().includes(search) ||
          s.tipo_servicio_nombre?.toLowerCase().includes(search) ||
          s.tecnico_asignado_nombre?.toLowerCase().includes(search)
        );
      }
      
      // Convertir a formato de eventos de FullCalendar
      const calendarEvents = serviciosFiltrados.map(servicio => {
        // Colores según estado
        const estadoColors = {
          'pendiente_aprobacion': '#f59e0b', // amber
          'aprobado': '#3b82f6', // blue
          'en_proceso': '#8b5cf6', // purple
          'completado': '#10b981', // green
          'anulado': '#ef4444' // red
        };

        return {
          id: servicio.id,
          title: `${servicio.numero_caso}`,
          start: servicio.fecha_agendada,
          backgroundColor: estadoColors[servicio.estado] || '#6b7280',
          borderColor: estadoColors[servicio.estado] || '#6b7280',
          textColor: '#ffffff',
          extendedProps: {
            cliente: servicio.cliente?.nombre || 'Sin cliente',
            tecnico: servicio.tecnico_asignado_nombre || 'Sin asignar',
            tipo_servicio: servicio.tipo_servicio_nombre || 'Sin tipo',
            estado: servicio.estado,
            ubicacion: servicio.ubicacion_servicio,
            telefono: servicio.cliente?.telefono,
            direccion: servicio.cliente?.direccion,
            numero_caso: servicio.numero_caso
          }
        };
      });
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, [filterTecnico, filterEstado, searchTerm]);

  useEffect(() => {
    loadTecnicos();
  }, [loadTecnicos]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleEventClick = (info) => {
    setSelectedEvent({
      ...info.event.extendedProps,
      title: info.event.title,
      start: info.event.start,
    });
    setShowEventModal(true);
  };

  const renderEventContent = (eventInfo) => {
    const { extendedProps } = eventInfo.event;
    
    return (
      <div className="p-1 text-xs overflow-hidden">
        <div className="font-bold truncate">{extendedProps.numero_caso}</div>
        <div className="flex items-center mt-0.5 truncate">
          <User className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="truncate">{extendedProps.tecnico}</span>
        </div>
        <div className="flex items-center truncate">
          <Briefcase className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="truncate">{extendedProps.cliente}</span>
        </div>
        <div className="truncate text-white/80">{extendedProps.tipo_servicio}</div>
      </div>
    );
  };

  const clearFilters = () => {
    setFilterTecnico('');
    setFilterEstado('');
    setSearchTerm('');
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      'pendiente_aprobacion': 'Pendiente',
      'aprobado': 'Aprobado',
      'en_proceso': 'En Proceso',
      'completado': 'Completado',
      'anulado': 'Anulado'
    };
    return labels[estado] || estado;
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <CalendarIcon className="w-8 h-8 mr-3" />
            Calendario de Servicios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Vista de 24 horas con todos los servicios agendados
          </p>
        </div>

        {/* Buscador y Filtros */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Buscador */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por caso, cliente, técnico o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filtro por Técnico */}
            <div className="w-full md:w-64">
              <select
                value={filterTecnico}
                onChange={(e) => setFilterTecnico(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos los técnicos</option>
                {tecnicos.map((tecnico) => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.nombre_completo}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div className="w-full md:w-48">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos los estados</option>
                <option value="pendiente_aprobacion">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="en_proceso">En Proceso</option>
                <option value="completado">Completado</option>
              </select>
            </div>

            {/* Botón Limpiar */}
            {(filterTecnico || filterEstado || searchTerm) && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Limpiar
              </button>
            )}
          </div>

          {/* Contador de resultados */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <Filter className="w-4 h-4 inline mr-1" />
            Mostrando {events.length} servicio{events.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Leyenda */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Leyenda de Estados:</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-amber-500 mr-2"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Pendiente</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-blue-500 mr-2"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Aprobado</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-purple-500 mr-2"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">En Proceso</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Completado</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-red-500 mr-2"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Anulado</span>
            </div>
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <FullCalendar
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale={esLocale}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
              }}
              buttonText={{
                today: 'Hoy',
                week: 'Semana',
                day: 'Día'
              }}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              slotDuration="01:00:00"
              slotLabelInterval="01:00"
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }}
              allDaySlot={false}
              height="auto"
              contentHeight="600px"
              expandRows={true}
              nowIndicator={true}
              events={events}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }}
              dayHeaderFormat={{
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              }}
              scrollTime="08:00:00"
              scrollTimeReset={false}
            />
          )}
        </div>

        {/* Modal de Detalle de Evento */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedEvent.numero_caso}
                  </h3>
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <User className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Técnico</p>
                      <p className="text-gray-900 dark:text-white font-medium">{selectedEvent.tecnico}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Briefcase className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cliente</p>
                      <p className="text-gray-900 dark:text-white font-medium">{selectedEvent.cliente}</p>
                      {selectedEvent.telefono && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.telefono}</p>
                      )}
                      {selectedEvent.direccion && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.direccion}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CalendarIcon className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha y Hora</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {new Date(selectedEvent.start).toLocaleString('es-CO', {
                          dateStyle: 'full',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tipo de Servicio</p>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedEvent.tipo_servicio}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estado</p>
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {getEstadoLabel(selectedEvent.estado)}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ubicación</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {selectedEvent.ubicacion === 'en_local' ? 'En Local' : 'Por Fuera del Local'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Calendar;
