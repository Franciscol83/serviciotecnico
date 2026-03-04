import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { serviceTypesAPI } from '@/api/client';
import { Plus, Edit, Trash2, CheckCircle, AlertCircle, Package } from 'lucide-react';

const ServiceTypes = () => {
  const { user: currentUser } = useAuth();
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedType, setSelectedType] = useState(null);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true,
  });

  useEffect(() => {
    loadServiceTypes();
  }, []);

  const loadServiceTypes = async () => {
    try {
      setLoading(true);
      const response = await serviceTypesAPI.getAll();
      setServiceTypes(response.data);
    } catch (error) {
      console.error('Error al cargar tipos de servicios:', error);
      showMessage('Error al cargar tipos de servicios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreate = () => {
    setModalType('create');
    setFormData({
      nombre: '',
      descripcion: '',
      activo: true,
    });
    setShowModal(true);
  };

  const handleEdit = (serviceType) => {
    setModalType('edit');
    setSelectedType(serviceType);
    setFormData({
      nombre: serviceType.nombre,
      descripcion: serviceType.descripcion,
      activo: serviceType.activo,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalType === 'create') {
        await serviceTypesAPI.create(formData);
        showMessage('Tipo de servicio creado exitosamente', 'success');
      } else {
        await serviceTypesAPI.update(selectedType.id, formData);
        showMessage('Tipo de servicio actualizado exitosamente', 'success');
      }

      setShowModal(false);
      loadServiceTypes();
    } catch (error) {
      console.error('Error:', error);
      showMessage(error.response?.data?.detail || 'Error al guardar tipo de servicio', 'error');
    }
  };

  const handleDelete = async (typeId) => {
    if (!window.confirm('¿Estás seguro de eliminar este tipo de servicio? Solo se puede eliminar si no tiene servicios asociados.')) {
      return;
    }

    try {
      await serviceTypesAPI.delete(typeId);
      showMessage('Tipo de servicio eliminado exitosamente', 'success');
      loadServiceTypes();
    } catch (error) {
      console.error('Error:', error);
      showMessage(error.response?.data?.detail || 'Error al eliminar tipo de servicio', 'error');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tipos de Servicios</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Catálogo estándar de servicios técnicos</p>
          </div>
          {['admin', 'supervisor'].includes(currentUser?.role) && (
            <button
              onClick={handleCreate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="create-service-type-button"
            >
              <Plus className="w-5 h-5" />
              <span>Crear Tipo de Servicio</span>
            </button>
          )}
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
                message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                ¿Para qué sirve el catálogo?
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Estandariza los nombres de servicios. En lugar de escribir "instalacion camaras" cada vez, 
                todos seleccionan "Instalación de Cámaras" del catálogo. Mejora reportes y búsquedas.
              </p>
            </div>
          </div>
        </div>

        {/* Service Types Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : serviceTypes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No hay tipos de servicios creados</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Crea el primer tipo de servicio estándar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceTypes.map((type) => (
              <div
                key={type.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{type.nombre}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{type.descripcion}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      type.activo
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {type.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <p>Creado por: {type.creado_por_nombre}</p>
                  <p>{new Date(type.fecha_creacion).toLocaleDateString()}</p>
                </div>

                {['admin', 'supervisor'].includes(currentUser?.role) && (
                  <div className="flex space-x-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleEdit(type)}
                      className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm"
                      data-testid={`edit-type-${type.id}`}
                    >
                      <Edit className="w-4 h-4 inline mr-1" />
                      Editar
                    </button>
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-sm"
                        data-testid={`delete-type-${type.id}`}
                      >
                        <Trash2 className="w-4 h-4 inline mr-1" />
                        Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {modalType === 'create' ? 'Crear Tipo de Servicio' : 'Editar Tipo de Servicio'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Tipo de Servicio *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: Instalación de Cámaras"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: Instalación completa de sistema CCTV"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="activo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Tipo de servicio activo
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {modalType === 'create' ? 'Crear' : 'Guardar'}
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

export default ServiceTypes;
