import React from 'react';
import { MapPin, FileText, Calendar } from 'lucide-react';

export const UbicacionSection = ({ formData, setFormData }) => (
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
);

export const FacturacionSection = ({ formData, setFormData }) => (
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
);

export const AsignacionSection = ({ formData, setFormData, tecnicos }) => (
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
);
