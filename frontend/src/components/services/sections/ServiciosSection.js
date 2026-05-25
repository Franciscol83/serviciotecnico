import React from 'react';
import { Package, Plus, X, FileText } from 'lucide-react';

export const ServiciosSection = ({
  formData,
  serviceTypes,
  agregarServicioItem,
  eliminarServicioItem,
  actualizarServicioItem,
}) => (
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
        <div
          key={`servicio-${index}-${servicio.tipo_servicio_id || 'new'}`}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
        >
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
);

export const RecomendacionesSection = ({ formData, setFormData }) => (
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
);

export const AgregarServicioForm = ({ formData, setFormData, serviceTypes }) => (
  <>
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
);
