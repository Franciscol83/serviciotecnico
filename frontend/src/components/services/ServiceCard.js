import React from 'react';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Package,
  Building,
  Home,
  Plus,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  getEstadoBadge,
  canAgregarServicio,
  canAprobar,
  canAnular,
  getTotalServicios,
  getNombreCompletoCliente,
} from './serviceHelpers';

const ServiceCard = ({ service, currentUser, onAgregar, onAprobar, onAnular }) => {
  const badge = getEstadoBadge(service.estado);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid={`service-caso-${service.id}`}>
            {service.caso_numero}
          </h3>
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
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
            {badge.text}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start space-x-2">
          <User className="w-4 h-4 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {getNombreCompletoCliente(service.cliente)}
            </p>
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

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Servicios ({getTotalServicios(service)})
            </p>
          </div>

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
        {canAgregarServicio(service, currentUser) && (
          <button
            onClick={() => onAgregar(service)}
            className="flex-1 px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 transition-colors text-sm"
            data-testid={`btn-agregar-servicio-${service.id}`}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Agregar Servicio
          </button>
        )}
        {canAprobar(service, currentUser) && (
          <button
            onClick={() => onAprobar(service.id)}
            className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors text-sm"
            data-testid={`btn-aprobar-${service.id}`}
          >
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Aprobar
          </button>
        )}
        {canAnular(service, currentUser) && (
          <button
            onClick={() => onAnular(service.id)}
            className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors text-sm"
            data-testid={`btn-anular-${service.id}`}
          >
            <XCircle className="w-4 h-4 inline mr-1" />
            Anular
          </button>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
