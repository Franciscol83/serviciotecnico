import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { inventarioAPI } from '@/api/client';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Package,
  AlertTriangle,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  X,
  Save,
} from 'lucide-react';

const Inventario = () => {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [alertasStockBajo, setAlertasStockBajo] = useState([]);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'consumible',
    cantidad: 0,
    unidad_medida: 'unidad',
    stock_minimo: 5,
    precio_unitario: 0,
    url_producto_web: '',
    notas: '',
  });

  // Filtrar items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = !filterTipo || item.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await inventarioAPI.getAll();
      setItems(response.data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al cargar inventario:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAlertasStockBajo = useCallback(async () => {
    try {
      const response = await inventarioAPI.getAlertasStockBajo();
      setAlertasStockBajo(response.data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al cargar alertas:', error);
      }
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadAlertasStockBajo();
  }, [loadItems, loadAlertasStockBajo]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreate = () => {
    setModalType('create');
    setFormData({
      nombre: '',
      descripcion: '',
      tipo: 'consumible',
      cantidad: 0,
      unidad_medida: 'unidad',
      stock_minimo: 5,
      precio_unitario: 0,
      url_producto_web: '',
      notas: '',
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalType('edit');
    setSelectedItem(item);
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      tipo: item.tipo,
      cantidad: item.cantidad,
      unidad_medida: item.unidad_medida,
      stock_minimo: item.stock_minimo,
      precio_unitario: item.precio_unitario || 0,
      url_producto_web: item.url_producto_web || '',
      notas: item.notas || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalType === 'create') {
        await inventarioAPI.create(formData);
        showMessage('Item creado exitosamente');
      } else {
        await inventarioAPI.update(selectedItem.id, formData);
        showMessage('Item actualizado exitosamente');
      }
      setShowModal(false);
      loadItems();
      loadAlertasStockBajo();
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Error al guardar item', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este item?')) return;

    try {
      await inventarioAPI.delete(id);
      showMessage('Item eliminado exitosamente');
      loadItems();
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Error al eliminar item', 'error');
    }
  };

  const handleAjustarStock = async (itemId, tipo) => {
    const cantidad = prompt(
      tipo === 'entrada' ? 'Cantidad a agregar:' : 'Cantidad a restar:',
      '1'
    );
    if (!cantidad) return;

    const motivo = prompt('Motivo del ajuste:', '');
    if (!motivo) return;

    try {
      const cantidadAjuste = tipo === 'entrada' ? parseInt(cantidad) : -parseInt(cantidad);
      await inventarioAPI.ajustarStock(itemId, cantidadAjuste, motivo);
      showMessage('Stock ajustado exitosamente');
      loadItems();
      loadAlertasStockBajo();
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Error al ajustar stock', 'error');
    }
  };

  const canManageInventory = () => {
    return ['admin', 'supervisor'].includes(currentUser?.role);
  };

  const getStockBadge = (item) => {
    if (item.cantidad <= 0) {
      return (
        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium">
          Sin Stock
        </span>
      );
    }
    if (item.cantidad <= item.stock_minimo) {
      return (
        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-medium">
          Stock Bajo
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
        Stock OK
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventario</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gestión de materiales y herramientas
            </p>
          </div>
          {canManageInventory() && (
            <button
              onClick={handleCreate}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Item
            </button>
          )}
        </div>

        {/* Alertas de Stock Bajo */}
        {alertasStockBajo.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Alertas de Stock Bajo ({alertasStockBajo.length})
                </h3>
                <div className="space-y-1">
                  {alertasStockBajo.slice(0, 3).map((item) => (
                    <p key={item.id} className="text-sm text-yellow-700 dark:text-yellow-300">
                      • {item.nombre}: {item.cantidad} {item.unidad_medida} (mínimo:{' '}
                      {item.stock_minimo})
                    </p>
                  ))}
                  {alertasStockBajo.length > 3 && (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 italic">
                      ... y {alertasStockBajo.length - 3} más
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos los tipos</option>
                <option value="consumible">Consumibles</option>
                <option value="herramienta">Herramientas</option>
              </select>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <Filter className="w-4 h-4 inline mr-1" />
            Mostrando {filteredItems.length} item(s)
          </div>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No se encontraron items</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm
                ? 'Intenta con otro término de búsqueda'
                : 'Los items del inventario aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {item.descripcion}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.tipo === 'consumible' ? (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                        Consumible
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                        Herramienta
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Stock:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {item.cantidad} {item.unidad_medida}
                      </span>
                      {getStockBadge(item)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Mínimo:</span>
                    <span className="text-gray-900 dark:text-white">
                      {item.stock_minimo} {item.unidad_medida}
                    </span>
                  </div>

                  {item.precio_unitario > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Precio:</span>
                      <span className="text-gray-900 dark:text-white">
                        ${item.precio_unitario.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {item.url_producto_web && (
                    <a
                      href={item.url_producto_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver en catálogo web
                    </a>
                  )}
                </div>

                {canManageInventory() && (
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleAjustarStock(item.id, 'entrada')}
                      className="flex-1 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Entrada
                    </button>
                    <button
                      onClick={() => handleAjustarStock(item.id, 'salida')}
                      className="flex-1 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <TrendingDown className="w-4 h-4" />
                      Salida
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal Create/Edit */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {modalType === 'create' ? 'Nuevo Item' : 'Editar Item'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo *
                    </label>
                    <select
                      required
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="consumible">Consumible</option>
                      <option value="herramienta">Herramienta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unidad de Medida *
                    </label>
                    <select
                      required
                      value={formData.unidad_medida}
                      onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="unidad">Unidad</option>
                      <option value="kg">Kilogramo</option>
                      <option value="litro">Litro</option>
                      <option value="metro">Metro</option>
                      <option value="caja">Caja</option>
                      <option value="paquete">Paquete</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cantidad Inicial *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.cantidad}
                      onChange={(e) =>
                        setFormData({ ...formData, cantidad: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stock Mínimo *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.stock_minimo}
                      onChange={(e) =>
                        setFormData({ ...formData, stock_minimo: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Precio Unitario
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.precio_unitario}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          precio_unitario: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL Producto Web (Catálogo externo)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.url_producto_web}
                      onChange={(e) =>
                        setFormData({ ...formData, url_producto_web: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enlace al producto en WooCommerce u otro catálogo
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notas
                    </label>
                    <textarea
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {modalType === 'create' ? 'Crear Item' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Inventario;
