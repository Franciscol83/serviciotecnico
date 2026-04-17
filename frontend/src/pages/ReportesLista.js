import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { reportesAPI } from '@/api/client';
import { Plus, Eye, FileDown, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';

const ReportesLista = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [filterEstado, setFilterEstado] = useState('');

  useEffect(() => {
    loadReportes();
  }, []);

  const loadReportes = async () => {
    try {
      setLoading(true);
      const response = await reportesAPI.getAll();
      setReportes(response.data);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      showMessage('Error al cargar reportes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleDownloadPDF = async (reporte) => {
    try {
      showMessage('Generando PDF...', 'success');
      // TODO: Implementar generación de PDF
      console.log('Descargar PDF para reporte:', reporte.id);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      showMessage('Error al generar PDF', 'error');
    }
  };

  const getEstadoBadge = (completado) => {
    if (completado) {
      return (
        <span className="flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completado
        </span>
      );
    }
    return (
      <span className="flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        En Proceso
      </span>
    );
  };

  const reportesFiltrados = filterEstado
    ? reportes.filter(r => {
        if (filterEstado === 'completado') return r.completado;
        if (filterEstado === 'en_proceso') return !r.completado;
        return true;
      })
    : reportes;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reportes Técnicos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestionar reportes de servicios completados
            </p>
          </div>
          <button
            onClick={() => navigate('/reportes/crear')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Crear Reporte</span>
          </button>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <p
              className={`text-sm font-medium ${
                message.type === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6 flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos los estados</option>
            <option value="completado">Completados</option>
            <option value="en_proceso">En Proceso</option>
          </select>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {reportesFiltrados.length} reporte{reportesFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tabla de Reportes */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : reportesFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <div className="flex flex-col items-center">
              <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No hay reportes técnicos
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Crea tu primer reporte técnico para comenzar
              </p>
              <button
                onClick={() => navigate('/reportes/crear')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Crear Reporte</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Técnico
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportesFiltrados.map((reporte) => (
                    <tr key={reporte.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {reporte.servicio_id}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {reporte.trabajo_realizado?.substring(0, 50)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {reporte.tecnico_nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(reporte.fecha_creacion).toLocaleDateString('es-CO')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(reporte.fecha_creacion).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(reporte.completado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => navigate(`/reportes/${reporte.id}`)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            title="Ver detalle"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(reporte)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                            title="Descargar PDF"
                          >
                            <FileDown className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ReportesLista;
