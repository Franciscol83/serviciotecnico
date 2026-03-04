import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { servicesAPI, usersAPI } from '@/api/client';
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
} from 'lucide-react';

const Services = () => {
  const { user: currentUser } = useAuth();
  const [services, setServices] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadServices();
    loadTecnicos();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getAll({});
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

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Servicios</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Administrar servicios técnicos</p>
          </div>
        </div>

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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No se encontraron servicios</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Los servicios creados aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {service.caso_numero}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(service.fecha_creacion).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      service.estado === 'pendiente_aprobacion'
                        ? 'bg-yellow-100 text-yellow-800'
                        : service.estado === 'aprobado'
                        ? 'bg-blue-100 text-blue-800'
                        : service.estado === 'en_proceso'
                        ? 'bg-purple-100 text-purple-800'
                        : service.estado === 'completado'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {service.estado.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {service.cliente.nombre}
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

                  {service.tipo_servicio_nombre && (
                    <div className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Tipo:</span> {service.tipo_servicio_nombre}
                      </p>
                    </div>
                  )}

                  {service.observaciones && (
                    <div className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">{service.observaciones}</p>
                    </div>
                  )}

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
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Services;
