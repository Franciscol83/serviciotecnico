import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { reportesAPI, servicesAPI } from '@/api/client';
import { FileText, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import ReporteModal from '@/components/reportes/ReporteModal';

const INITIAL_FORM = {
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
};

const INITIAL_MATERIAL = {
  nombre: '',
  cantidad: '',
  unidad: 'unidades',
  observaciones: '',
};

const Reportes = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState(null);
  const signatureRef = useRef(null);

  const [searchServicio, setSearchServicio] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [materialTemp, setMaterialTemp] = useState(INITIAL_MATERIAL);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadServicios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getAll();
      const disponibles = response.data.filter(
        (s) => s.estado === 'aprobado' || s.estado === 'en_proceso'
      );
      setServicios(disponibles);
    } catch (error) {
      showMessage('Error al cargar servicios disponibles', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServicios();
  }, [loadServicios]);

  const serviciosFiltrados = servicios.filter((servicio) => {
    if (filtroEstado !== 'todos' && servicio.estado !== filtroEstado) return false;
    if (searchServicio.trim()) {
      const search = searchServicio.toLowerCase();
      const nombreCliente =
        `${servicio.cliente.primer_nombre} ${servicio.cliente.segundo_nombre || ''} ${servicio.cliente.primer_apellido} ${servicio.cliente.segundo_apellido || ''}`.toLowerCase();
      return (
        nombreCliente.includes(search) ||
        servicio.caso_numero.toLowerCase().includes(search) ||
        servicio.tipo_servicio_nombre.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleCreate = () => {
    setFormData(INITIAL_FORM);
    setMaterialTemp(INITIAL_MATERIAL);
    if (signatureRef.current) signatureRef.current.clear();
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
        setFormData((prev) => ({
          ...prev,
          fotos: [
            ...prev.fotos,
            { url: reader.result, descripcion: '', timestamp: new Date().toISOString() },
          ],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFoto = (index) => {
    setFormData((prev) => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== index) }));
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
    setFormData((prev) => ({
      ...prev,
      materiales_consumidos: [
        ...prev.materiales_consumidos,
        {
          nombre: materialTemp.nombre,
          cantidad: parseFloat(materialTemp.cantidad),
          unidad: materialTemp.unidad,
          observaciones: materialTemp.observaciones,
        },
      ],
    }));
    setMaterialTemp(INITIAL_MATERIAL);
  };

  const removeMaterial = (index) => {
    setFormData((prev) => ({
      ...prev,
      materiales_consumidos: prev.materiales_consumidos.filter((_, i) => i !== index),
    }));
  };

  const saveSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      setFormData((prev) => ({
        ...prev,
        firma_cliente_base64: signatureRef.current.toDataURL(),
      }));
      showMessage('Firma capturada correctamente', 'success');
    } else {
      showMessage('Por favor dibuje la firma del cliente', 'error');
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) signatureRef.current.clear();
    setFormData((prev) => ({ ...prev, firma_cliente_base64: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.servicio_id) return showMessage('Debe seleccionar un servicio', 'error');
    if (!formData.trabajo_realizado)
      return showMessage('Debe describir el trabajo realizado', 'error');
    if (!formData.firma_cliente_base64)
      return showMessage('Debe capturar la firma del cliente', 'error');
    if (!formData.cliente_firma_nombre)
      return showMessage('Debe ingresar el nombre de quien firma', 'error');

    try {
      setLoading(true);
      await reportesAPI.create({
        servicio_id: formData.servicio_id,
        observaciones_tecnico: formData.observaciones_tecnico,
        tiempo_dedicado_horas: formData.tiempo_dedicado_horas
          ? parseFloat(formData.tiempo_dedicado_horas)
          : null,
        problemas_encontrados: formData.problemas_encontrados,
        trabajo_realizado: formData.trabajo_realizado,
        recomendaciones: formData.recomendaciones,
        materiales_consumidos: formData.materiales_consumidos,
        fotos: formData.fotos,
        firma_cliente_base64: formData.firma_cliente_base64,
        cliente_firma_nombre: formData.cliente_firma_nombre,
      });
      showMessage('Reporte técnico creado exitosamente', 'success');
      setShowModal(false);
      loadServicios();
    } catch (error) {
      console.error('Error:', error);
      showMessage(error.response?.data?.detail || 'Error al crear el reporte', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="reportes-page">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reportes Técnicos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Crear reportes de servicios completados
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            data-testid="crear-reporte-button"
          >
            <Plus className="w-5 h-5" />
            <span>Crear Reporte</span>
          </button>
        </div>

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

        {showModal && (
          <ReporteModal
            formData={formData}
            setFormData={setFormData}
            loading={loading}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            searchServicio={searchServicio}
            setSearchServicio={setSearchServicio}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            servicios={servicios}
            serviciosFiltrados={serviciosFiltrados}
            materialTemp={materialTemp}
            setMaterialTemp={setMaterialTemp}
            addMaterial={addMaterial}
            removeMaterial={removeMaterial}
            handleImageUpload={handleImageUpload}
            removeFoto={removeFoto}
            updateFotoDescripcion={updateFotoDescripcion}
            signatureRef={signatureRef}
            saveSignature={saveSignature}
            clearSignature={clearSignature}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Reportes;
