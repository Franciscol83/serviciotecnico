import React from 'react';
import { getNombreCompletoCliente } from '@/components/services/serviceHelpers';

const ServiceSelector = ({
  searchServicio,
  setSearchServicio,
  filtroEstado,
  setFiltroEstado,
  servicios,
  serviciosFiltrados,
  servicioId,
  setServicioId,
}) => (
  <div className="space-y-3">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      Seleccionar Servicio *
    </label>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <input
          type="text"
          placeholder="Buscar por caso (TN-2026-00001), cliente o tipo..."
          value={searchServicio}
          onChange={(e) => setSearchServicio(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          data-testid="reporte-search-input"
        />
        <p className="text-xs text-gray-500 mt-1">
          Ejemplo: TN-2026-00001, Juan Pérez, Configuración PC
        </p>
      </div>

      <select
        value={filtroEstado}
        onChange={(e) => setFiltroEstado(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
        data-testid="reporte-filter-estado"
      >
        <option value="todos">Todos los estados</option>
        <option value="aprobado">Aprobados</option>
        <option value="en_proceso">En Proceso</option>
      </select>
    </div>

    <div className="text-xs text-gray-500 dark:text-gray-400">
      Mostrando {serviciosFiltrados.length} de {servicios.length} servicios
    </div>

    <select
      value={servicioId}
      onChange={(e) => setServicioId(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
      required
      data-testid="reporte-servicio-select"
    >
      <option value="">
        {serviciosFiltrados.length === 0 ? 'No hay servicios disponibles' : 'Seleccionar servicio...'}
      </option>
      {serviciosFiltrados.map((servicio) => (
        <option key={servicio.id} value={servicio.id}>
          {servicio.caso_numero} - {getNombreCompletoCliente(servicio.cliente)} - {servicio.tipo_servicio_nombre}
        </option>
      ))}
    </select>

    {serviciosFiltrados.length === 0 && (
      <p className="text-xs text-amber-600 mt-1">
        No hay servicios que coincidan. Prueba buscar por caso número (ej: TN-2026-00001)
      </p>
    )}
  </div>
);

export default ServiceSelector;
