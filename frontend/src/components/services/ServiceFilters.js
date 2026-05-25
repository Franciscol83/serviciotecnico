import React from 'react';
import { Search, Filter } from 'lucide-react';

const ServiceFilters = ({ searchTerm, setSearchTerm, filterEstado, setFilterEstado, count }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por caso, cliente, técnico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            data-testid="services-search-input"
          />
        </div>
      </div>

      <div className="sm:w-48">
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          data-testid="services-filter-estado"
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
      Mostrando {count} orden(es)
    </div>
  </div>
);

export default ServiceFilters;
