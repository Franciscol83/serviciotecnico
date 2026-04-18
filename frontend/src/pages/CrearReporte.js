import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { reportesAPI, servicesAPI } from '@/api/client';
import { Camera, FileText, Trash2, Plus, CheckCircle, AlertCircle, Signature } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

const Reportes = () => {
  const { user: currentUser } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState(null);
  const signatureRef = useRef(null);
  
  // Estados para búsqueda y filtro de servicios
  const [searchServicio, setSearchServicio] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // todos, aprobado, en_proceso

  const [formData, setFormData] = useState({
    servicio_id: '',
    observaciones_tecnico: '',
    tiempo_dedicado_horas: '',
    problemas_encontrados: '',
    trabajo_realizado: '',
    recomendaciones: '',
    materiales_consumidos: [],
    fotos: [],
    firma_cliente_base64: '',
    cliente_firma_nombre: '',
  });

  const [materialTemp, setMaterialTemp] = useState({
    nombre: '',
    cantidad: '',
    unidad: 'unidades',
    observaciones: '',
  });

  useEffect(() => {
    loadServicios();
  }, []);

  const loadServicios = async () => {
    try {
      setLoading(true);
      // Cargar todos los servicios - el backend filtrará según el rol del usuario
      const response = await servicesAPI.getAll();
      // Filtrar solo servicios aprobados o en proceso en el frontend
      const serviciosDisponibles = response.data.filter(
        s => s.estado === 'aprobado' || s.estado === 'en_proceso'
      );
      setServicios(serviciosDisponibles);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      showMessage('Error al cargar servicios disponibles', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar servicios según búsqueda y estado
  const serviciosFiltrados = servicios.filter(servicio => {
    // Filtro por estado
    if (filtroEstado !== 'todos' && servicio.estado !== filtroEstado) {
      return false;
    }
    
    // Filtro por búsqueda
    if (searchServicio.trim()) {
      const search = searchServicio.toLowerCase();
      const nombreCliente = `${servicio.cliente.primer_nombre} ${servicio.cliente.segundo_nombre || ''} ${servicio.cliente.primer_apellido} ${servicio.cliente.segundo_apellido || ''}`.toLowerCase();
      const casoNumero = servicio.caso_numero.toLowerCase();
      const tipoServicio = servicio.tipo_servicio_nombre.toLowerCase();
      
      return nombreCliente.includes(search) || casoNumero.includes(search) || tipoServicio.includes(search);
    }
    
    return true;
  });

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreate = () => {
    setFormData({
      servicio_id: '',
      observaciones_tecnico: '',
      tiempo_dedicado_horas: '',
      problemas_encontrados: '',
      trabajo_realizado: '',
      recomendaciones: '',
      materiales_consumidos: [],
      fotos: [],
      firma_cliente_base64: '',
      cliente_firma_nombre: '',
    });
    setMaterialTemp({
      nombre: '',
      cantidad: '',
      unidad: 'unidades',
      observaciones: '',
    });
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    setShowModal(true);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showMessage('Las imágenes deben ser menores a 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newFoto = {
          url: reader.result, // Base64
          descripcion: '',
          timestamp: new Date().toISOString(),
        };
        setFormData(prev => ({
          ...prev,
          fotos: [...prev.fotos, newFoto]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFoto = (index) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  const updateFotoDescripcion = (index, descripcion) => {
    const newFotos = [...formData.fotos];
    newFotos[index].descripcion = descripcion;
    setFormData({ ...formData, fotos: newFotos });
  };

  const addMaterial = () => {
    if (!materialTemp.nombre || !materialTemp.cantidad) {
      showMessage('Complete los datos del material', 'error');
      return;
    }

    setFormData(prev => ({
      ...prev,
      materiales_consumidos: [
        ...prev.materiales_consumidos,
        {
          nombre: materialTemp.nombre,
          cantidad: parseFloat(materialTemp.cantidad),
          unidad: materialTemp.unidad,
          observaciones: materialTemp.observaciones,
        }
      ]
    }));

    setMaterialTemp({
      nombre: '',
      cantidad: '',
      unidad: 'unidades',
      observaciones: '',
    });
  };

  const removeMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materiales_consumidos: prev.materiales_consumidos.filter((_, i) => i !== index)
    }));
  };

  const saveSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureBase64 = signatureRef.current.toDataURL();
      setFormData(prev => ({ ...prev, firma_cliente_base64: signatureBase64 }));
      showMessage('Firma capturada correctamente', 'success');
    } else {
      showMessage('Por favor dibuje la firma del cliente', 'error');
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    setFormData(prev => ({ ...prev, firma_cliente_base64: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.servicio_id) {
      showMessage('Debe seleccionar un servicio', 'error');
      return;
    }

    if (!formData.trabajo_realizado) {
      showMessage('Debe describir el trabajo realizado', 'error');
      return;
    }

    if (!formData.firma_cliente_base64) {
      showMessage('Debe capturar la firma del cliente', 'error');
      return;
    }

    if (!formData.cliente_firma_nombre) {
      showMessage('Debe ingresar el nombre de quien firma', 'error');
      return;
    }

    try {
      setLoading(true);

      const reporteData = {
        servicio_id: formData.servicio_id,
        observaciones_tecnico: formData.observaciones_tecnico,
        tiempo_dedicado_horas: formData.tiempo_dedicado_horas ? parseFloat(formData.tiempo_dedicado_horas) : null,
        problemas_encontrados: formData.problemas_encontrados,
        trabajo_realizado: formData.trabajo_realizado,
        recomendaciones: formData.recomendaciones,
        materiales_consumidos: formData.materiales_consumidos,
        fotos: formData.fotos,
        firma_cliente_base64: formData.firma_cliente_base64,
        cliente_firma_nombre: formData.cliente_firma_nombre,
      };

      await reportesAPI.create(reporteData);
      showMessage('Reporte técnico creado exitosamente', 'success');
      setShowModal(false);
      loadServicios(); // Recargar para actualizar servicios disponibles
    } catch (error) {
      console.error('Error:', error);
      showMessage(error.response?.data?.detail || 'Error al crear el reporte', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reportes Técnicos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Crear reportes de servicios completados</p>
          </div>
          <button
            onClick={handleCreate}
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
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Documentación de Servicios
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Aquí puedes crear reportes técnicos detallados para los servicios completados. 
                Incluye fotos, materiales consumidos y la firma del cliente.
              </p>
            </div>
          </div>
        </div>

        {/* Modal de Creación */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
              <div className="p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Crear Reporte Técnico
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Selección de Servicio con Búsqueda y Filtro */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Seleccionar Servicio *
                    </label>
                    
                    {/* Búsqueda y Filtro */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="🔍 Buscar por caso, cliente o tipo..."
                        value={searchServicio}
                        onChange={(e) => setSearchServicio(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                      
                      <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="todos">📋 Todos los estados</option>
                        <option value="aprobado">✅ Aprobados</option>
                        <option value="en_proceso">⏳ En Proceso</option>
                      </select>
                    </div>
                    
                    {/* Contador de resultados */}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Mostrando {serviciosFiltrados.length} de {servicios.length} servicios
                    </div>
                    
                    {/* Selector de Servicio */}
                    <select
                      value={formData.servicio_id}
                      onChange={(e) => setFormData({ ...formData, servicio_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Seleccionar servicio...</option>
                      {serviciosFiltrados.map((servicio) => {
                        const nombreCliente = `${servicio.cliente.primer_nombre} ${servicio.cliente.segundo_nombre || ''} ${servicio.cliente.primer_apellido} ${servicio.cliente.segundo_apellido || ''}`.trim();
                        return (
                          <option key={servicio.id} value={servicio.id}>
                            {servicio.caso_numero} - {nombreCliente} - {servicio.tipo_servicio_nombre}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Trabajo Realizado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Trabajo Realizado *
                    </label>
                    <textarea
                      value={formData.trabajo_realizado}
                      onChange={(e) => setFormData({ ...formData, trabajo_realizado: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      rows={3}
                      required
                      placeholder="Describe el trabajo realizado..."
                    />
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Observaciones del Técnico
                    </label>
                    <textarea
                      value={formData.observaciones_tecnico}
                      onChange={(e) => setFormData({ ...formData, observaciones_tecnico: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      rows={3}
                      placeholder="Observaciones adicionales..."
                    />
                  </div>

                  {/* Grid: Tiempo y Problemas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tiempo Dedicado (horas)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.tiempo_dedicado_horas}
                        onChange={(e) => setFormData({ ...formData, tiempo_dedicado_horas: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Ej: 2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Problemas Encontrados
                      </label>
                      <input
                        type="text"
                        value={formData.problemas_encontrados}
                        onChange={(e) => setFormData({ ...formData, problemas_encontrados: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Describe los problemas..."
                      />
                    </div>
                  </div>

                  {/* Recomendaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recomendaciones
                    </label>
                    <textarea
                      value={formData.recomendaciones}
                      onChange={(e) => setFormData({ ...formData, recomendaciones: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      rows={2}
                      placeholder="Recomendaciones para el cliente..."
                    />
                  </div>

                  {/* Materiales Consumidos */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Materiales Consumidos
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Nombre del material"
                        value={materialTemp.nombre}
                        onChange={(e) => setMaterialTemp({ ...materialTemp, nombre: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Cantidad"
                        value={materialTemp.cantidad}
                        onChange={(e) => setMaterialTemp({ ...materialTemp, cantidad: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <select
                        value={materialTemp.unidad}
                        onChange={(e) => setMaterialTemp({ ...materialTemp, unidad: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="unidades">Unidades</option>
                        <option value="metros">Metros</option>
                        <option value="litros">Litros</option>
                        <option value="kilogramos">Kilogramos</option>
                        <option value="cajas">Cajas</option>
                      </select>
                      <button
                        type="button"
                        onClick={addMaterial}
                        className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar
                      </button>
                    </div>

                    {formData.materiales_consumidos.length > 0 && (
                      <div className="space-y-2 mt-4">
                        {formData.materiales_consumidos.map((material, index) => (
                          <div
                            key={`material-${material.nombre}-${index}`}
                            className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                          >
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {material.nombre}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                - {material.cantidad} {material.unidad}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMaterial(index)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fotos */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Fotos del Trabajo
                    </h3>
                    
                    {/* Botones para capturar o subir */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {/* Tomar foto con cámara */}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="foto-camera"
                        />
                        <label
                          htmlFor="foto-camera"
                          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                        >
                          <Camera className="w-5 h-5 mr-2" />
                          <span className="text-sm font-medium">
                            📸 Tomar Foto
                          </span>
                        </label>
                      </div>
                      
                      {/* Subir desde archivo */}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="foto-upload"
                        />
                        <label
                          htmlFor="foto-upload"
                          className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                        >
                          <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            📁 Subir Archivo
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Tamaño máximo por foto: 5MB. Puedes subir múltiples fotos.
                    </p>

                    {formData.fotos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {formData.fotos.map((foto, index) => (
                          <div key={`foto-${foto.timestamp}-${index}`} className="relative group">
                            <img
                              src={foto.url}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeFoto(index)}
                              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <input
                              type="text"
                              placeholder="Descripción de la foto..."
                              value={foto.descripcion}
                              onChange={(e) => updateFotoDescripcion(index, e.target.value)}
                              className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Firma Digital */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Signature className="w-5 h-5 mr-2" />
                      Firma del Cliente *
                    </h3>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre de quien firma *
                      </label>
                      <input
                        type="text"
                        value={formData.cliente_firma_nombre}
                        onChange={(e) => setFormData({ ...formData, cliente_firma_nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                        placeholder="Nombre completo..."
                      />
                    </div>

                    <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 touch-none">
                      <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                          className: 'w-full h-48 sm:h-64',
                        }}
                        backgroundColor="transparent"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      ✍️ Dibuja con tu dedo o stylus en el área blanca
                    </p>
                    
                    <div className="flex space-x-3 mt-3">
                      <button
                        type="button"
                        onClick={saveSignature}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Guardar Firma
                      </button>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Limpiar
                      </button>
                    </div>

                    {formData.firma_cliente_base64 && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Firma capturada correctamente
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : 'Crear Reporte'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Reportes;
