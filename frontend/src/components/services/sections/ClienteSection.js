import React from 'react';
import { User } from 'lucide-react';

const ClienteSection = ({ formData, setFormData }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
      <User className="w-5 h-5 mr-2" />
      Información del Cliente (WorldOffice)
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Primer Nombre *
        </label>
        <input
          type="text"
          value={formData.cliente_primer_nombre}
          onChange={(e) => setFormData({ ...formData, cliente_primer_nombre: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
          placeholder="Ej: Juan"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Segundo Nombre
        </label>
        <input
          type="text"
          value={formData.cliente_segundo_nombre}
          onChange={(e) => setFormData({ ...formData, cliente_segundo_nombre: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Ej: Carlos (opcional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Primer Apellido *
        </label>
        <input
          type="text"
          value={formData.cliente_primer_apellido}
          onChange={(e) => setFormData({ ...formData, cliente_primer_apellido: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
          placeholder="Ej: Pérez"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Segundo Apellido
        </label>
        <input
          type="text"
          value={formData.cliente_segundo_apellido}
          onChange={(e) => setFormData({ ...formData, cliente_segundo_apellido: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Ej: González (opcional)"
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

      <div className="md:col-span-2">
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
);

export default ClienteSection;
