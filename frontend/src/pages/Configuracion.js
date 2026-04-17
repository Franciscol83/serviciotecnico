import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Settings, Image, FileText, Save, CheckCircle, AlertCircle } from 'lucide-react';

const Configuracion = () => {
  const { user: currentUser } = useAuth();
  const [message, setMessage] = useState(null);
  const [config, setConfig] = useState({
    nombre_empresa: 'Tecno Nacho SAS',
    direccion: '',
    telefono: '',
    email: 'contacto@tecnonacho.com',
    limite_fotos_reporte: 10,
    logo_url: '',
  });

  useEffect(() => {
    // TODO: Cargar configuración desde el backend
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // Por ahora usamos valores por defecto
      // En el futuro esto vendría del backend
      const savedConfig = localStorage.getItem('app_config');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    try {
      // TODO: Guardar en el backend
      // Por ahora guardamos en localStorage
      localStorage.setItem('app_config', JSON.stringify(config));
      showMessage('Configuración guardada exitosamente', 'success');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      showMessage('Error al guardar la configuración', 'error');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showMessage('El logo debe ser menor a 2MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, logo_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            Configuración
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configuración general de la aplicación y plantillas de reportes
          </p>
        </div>

        {/* Message */}
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
            <p
              className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Información de la Empresa */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Información de la Empresa
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={config.nombre_empresa}
                  onChange={(e) => setConfig({ ...config, nombre_empresa: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={config.direccion}
                    onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Calle 123 #45-67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={config.telefono}
                    onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="(601) 234-5678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Logo de la Empresa */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Logo de la Empresa
            </h2>

            <div className="space-y-4">
              {config.logo_url && (
                <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <img
                    src={config.logo_url}
                    alt="Logo de la empresa"
                    className="max-h-32 object-contain"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subir Logo (máx 2MB)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Formatos aceptados: PNG, JPG, SVG
                </p>
              </div>
            </div>
          </div>

          {/* Configuración de Reportes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Configuración de Reportes
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Límite de fotos por reporte
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={config.limite_fotos_reporte}
                  onChange={(e) =>
                    setConfig({ ...config, limite_fotos_reporte: parseInt(e.target.value) || 10 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Los técnicos podrán subir hasta este número de fotos por reporte
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Nota:</strong> Esta configuración será aplicada a todos los nuevos reportes que se creen a partir de ahora.
                </p>
              </div>
            </div>
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Configuracion;
