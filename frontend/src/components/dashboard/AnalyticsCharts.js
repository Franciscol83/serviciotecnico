import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart,
} from 'recharts';
import { TrendingUp, Activity, Users, Clock, Award, AlertTriangle, BarChart3, Package } from 'lucide-react';
import { analyticsAPI } from '@/api/client';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const ESTADO_COLOR = {
  pendiente_aprobacion: '#f59e0b',
  aprobado: '#3b82f6',
  en_proceso: '#8b5cf6',
  completado: '#10b981',
  cancelado: '#94a3b8',
  anulado: '#ef4444',
};

const formatFecha = (fechaStr) => {
  if (!fechaStr) return '';
  const d = new Date(fechaStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

const formatHora = (h) => `${String(h).padStart(2, '0')}:00`;

const StatCard = ({ icon: Icon, label, value, color, subValue }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subValue && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subValue}</p>
        )}
      </div>
      <Icon className={`w-8 h-8 ${color}`} />
    </div>
  </div>
);

const ChartCard = ({ title, icon: Icon, children, extra }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
        {Icon && <Icon className="w-4 h-4 mr-2 text-blue-500" />}
        {title}
      </h3>
      {extra}
    </div>
    {children}
  </div>
);

const AnalyticsCharts = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState(30);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: d } = await analyticsAPI.getDashboard(dias);
      setData(d);
      setError(null);
    } catch (e) {
      if (e.response?.status === 403) {
        setError('Solo admin y supervisor pueden ver analytics avanzadas');
      } else {
        setError('Error al cargar analytics');
      }
    } finally {
      setLoading(false);
    }
  }, [dias]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const ordenesData = (data.ordenes_por_dia || []).map((d) => ({
    fecha: formatFecha(d.fecha),
    Órdenes: d.count,
  }));

  const estadoData = (data.ordenes_por_estado || []).map((d) => ({
    name: d.estado.replace(/_/g, ' '),
    value: d.count,
    color: ESTADO_COLOR[d.estado] || '#94a3b8',
  }));

  const horasData = (data.actividad_por_hora || []).map((h) => ({
    hora: formatHora(h.hora),
    Eventos: h.count,
  }));

  const tipoData = (data.ordenes_por_tipo || []).map((t) => ({
    tipo: t.tipo,
    Cantidad: t.count,
  }));

  const tecnicosData = (data.top_tecnicos || []).slice(0, 5);

  return (
    <div className="space-y-6" data-testid="analytics-section">
      {/* Header con selector de rango */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
            Analytics Avanzado
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tendencias y métricas operativas en tiempo real
          </p>
        </div>
        <div className="flex gap-2" data-testid="analytics-range-selector">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                dias === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50'
              }`}
              data-testid={`analytics-range-${d}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Servicios"
          value={data.resumen.total_servicios}
          color="text-blue-500"
        />
        <StatCard
          icon={Activity}
          label="Total Reportes"
          value={data.resumen.total_reportes}
          color="text-green-500"
        />
        <StatCard
          icon={Package}
          label="Materiales activos"
          value={data.resumen.total_materiales}
          color="text-purple-500"
          subValue={`${data.resumen.materiales_stock_bajo} con stock bajo`}
        />
        <StatCard
          icon={AlertTriangle}
          label="Alertas stock bajo"
          value={data.resumen.materiales_stock_bajo}
          color={data.resumen.materiales_stock_bajo > 0 ? 'text-red-500' : 'text-gray-400'}
        />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={`Órdenes creadas (últimos ${dias} días)`} icon={TrendingUp}>
          {ordenesData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No hay órdenes en este período</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={ordenesData}>
                <defs>
                  <linearGradient id="colorOrdenes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="fecha" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Órdenes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrdenes)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Distribución por estado" icon={Activity}>
          {estadoData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={estadoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                  fontSize={11}
                >
                  {estadoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top técnicos por reportes" icon={Award}>
          {tecnicosData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Sin reportes en este período</p>
          ) : (
            <div className="space-y-3">
              {tecnicosData.map((t, i) => {
                const max = Math.max(...tecnicosData.map((x) => x.reportes));
                const pct = max > 0 ? (t.reportes / max) * 100 : 0;
                return (
                  <div key={t.tecnico_id || i} className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold mr-3">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900 dark:text-white truncate">{t.tecnico_nombre}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          {t.reportes} <span className="text-xs">({t.horas}h)</span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Actividad por hora del día" icon={Clock}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={horasData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hora" stroke="#94a3b8" fontSize={10} interval={2} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="Eventos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Servicios por tipo" icon={BarChart3} extra={null}>
          {tipoData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={tipoData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="tipo" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip />
                <Bar dataKey="Cantidad" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
