import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { auditAPI } from '@/api/client';
import {
  Shield,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  User,
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ACCION_LABELS = {
  login_success: { label: 'Login exitoso', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  login_failed: { label: 'Login fallido', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  logout: { label: 'Cierre de sesión', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
  crear_servicio: { label: 'Crear servicio', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  aprobar_servicio: { label: 'Aprobar servicio', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  anular_servicio: { label: 'Anular servicio', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  agregar_item_servicio: { label: 'Agregar item', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  crear_reporte: { label: 'Crear reporte', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
};

const ENTIDAD_OPTIONS = [
  { value: '', label: 'Todas las entidades' },
  { value: 'auth', label: 'Autenticación' },
  { value: 'service', label: 'Servicios' },
  { value: 'reporte', label: 'Reportes' },
  { value: 'user', label: 'Usuarios' },
  { value: 'inventario', label: 'Inventario' },
];

const AuditLogs = () => {
  const { user: currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(50);
  const [accionFilter, setAccionFilter] = useState('');
  const [entidadFilter, setEntidadFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (accionFilter) params.accion = accionFilter;
      if (entidadFilter) params.entidad = entidadFilter;
      const { data } = await auditAPI.getLogs(params);
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.total_pages || 0);
    } catch (e) {
      console.error('Error cargando logs:', e);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, accionFilter, entidadFilter]);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await auditAPI.getStats();
      setStats(data);
    } catch (e) {
      console.error('Error cargando stats:', e);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' });
  };

  const renderAccion = (accion) => {
    const cfg = ACCION_LABELS[accion] || {
      label: accion,
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
    );
  };

  if (!['admin', 'supervisor'].includes(currentUser?.role)) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Solo administradores y supervisores pueden ver los logs.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="audit-logs-page">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Shield className="w-8 h-8 mr-3" />
              Logs de Auditoría
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Historial inmutable de acciones críticas en el sistema
            </p>
          </div>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total de eventos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Top acciones</p>
              <div className="flex flex-wrap gap-1">
                {stats.por_accion.slice(0, 3).map((a) => (
                  <span key={a.accion} className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    {a.accion} ({a.count})
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Top entidades</p>
              <div className="flex flex-wrap gap-1">
                {stats.por_entidad.slice(0, 3).map((e) => (
                  <span key={e.entidad} className="text-xs px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                    {e.entidad} ({e.count})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Acción (ej: crear_servicio, login_success)"
                  value={accionFilter}
                  onChange={(e) => { setAccionFilter(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  data-testid="audit-accion-filter"
                />
              </div>
            </div>
            <select
              value={entidadFilter}
              onChange={(e) => { setEntidadFilter(e.target.value); setPage(1); }}
              className="sm:w-56 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              data-testid="audit-entidad-filter"
            >
              {ENTIDAD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <Filter className="w-4 h-4 inline mr-1" />
            {total} registro(s) • Página {page} de {totalPages || 1}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              No hay registros con los filtros aplicados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acción</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Detalles</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">IP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1 text-gray-400" />
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <div className="font-medium">{log.usuario_nombre || '—'}</div>
                            <div className="text-xs text-gray-500">{log.usuario_role || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{renderAccion(log.accion)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{log.entidad}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate" title={JSON.stringify(log.detalles)}>
                        {log.detalles && Object.keys(log.detalles).length > 0
                          ? Object.entries(log.detalles).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' • ')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{log.ip || '—'}</td>
                      <td className="px-4 py-3">
                        {log.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <span title={log.error_message || 'Error'}>
                            <XCircle className="w-5 h-5 text-red-500" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="audit-prev-page"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="audit-next-page"
            >
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AuditLogs;
