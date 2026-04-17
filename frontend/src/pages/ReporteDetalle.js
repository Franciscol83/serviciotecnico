import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { reportesAPI, servicesAPI } from '@/api/client';
import { 
  ArrowLeft, FileDown, CheckCircle, Clock, User, Calendar, 
  Package, Camera, FileSignature, AlertCircle, Edit 
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReporteDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [reporte, setReporte] = useState(null);
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadReporte();
  }, [id]);

  const loadReporte = async () => {
    try {
      setLoading(true);
      const response = await reportesAPI.getById(id);
      setReporte(response.data);
      
      // Cargar información del servicio
      if (response.data.servicio_id) {
        const servicioResponse = await servicesAPI.getById(response.data.servicio_id);
        setServicio(servicioResponse.data);
      }
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      showMessage('Error al cargar el reporte', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleDownloadPDF = async () => {
    try {
      setGenerandoPDF(true);
      showMessage('Generando PDF...', 'success');

      const element = document.getElementById('reporte-content');
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`reporte_tecnico_${servicio?.numero_caso || reporte.id}.pdf`);
      showMessage('PDF descargado exitosamente', 'success');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      showMessage('Error al generar el PDF', 'error');
    } finally {
      setGenerandoPDF(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!reporte) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mb-2" />
            <p className="text-red-800 dark:text-red-200">Reporte no encontrado</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/reportes')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detalle del Reporte</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Reporte técnico #{reporte.id.substring(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={generandoPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-5 h-5" />
            <span>{generandoPDF ? 'Generando...' : 'Descargar PDF'}</span>
          </button>
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
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Contenido del Reporte (para PDF) */}
        <div id="reporte-content" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 space-y-8">
          {/* Encabezado del PDF */}
          <div className="border-b-2 border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tecno Nacho SAS</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Reporte Técnico de Servicio</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {servicio?.numero_caso || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fecha: {new Date(reporte.fecha_creacion).toLocaleDateString('es-CO')}
                </p>
              </div>
            </div>
            
            {servicio && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Tipo de Servicio:</p>
                  <p className="font-medium text-gray-900 dark:text-white">{servicio.tipo_servicio_nombre}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Asesor Comercial:</p>
                  <p className="font-medium text-gray-900 dark:text-white">{servicio.creado_por_nombre || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Estado */}
          <div className="flex items-center space-x-2">
            {reporte.completado ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 dark:text-green-400 font-medium">Reporte Completado</span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-700 dark:text-yellow-400 font-medium">En Proceso</span>
              </>
            )}
          </div>

          {/* Información del Técnico */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Técnico Asignado
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{reporte.tecnico_nombre}</p>
            {reporte.tiempo_dedicado_horas && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Tiempo dedicado: {reporte.tiempo_dedicado_horas} horas
              </p>
            )}
          </div>

          {/* Trabajo Realizado */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Trabajo Realizado</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reporte.trabajo_realizado}</p>
          </div>

          {/* Observaciones */}
          {reporte.observaciones_tecnico && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Observaciones del Técnico</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reporte.observaciones_tecnico}</p>
            </div>
          )}

          {/* Problemas Encontrados */}
          {reporte.problemas_encontrados && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-3">Problemas Encontrados</h3>
              <p className="text-red-700 dark:text-red-300 whitespace-pre-wrap">{reporte.problemas_encontrados}</p>
            </div>
          )}

          {/* Recomendaciones */}
          {reporte.recomendaciones && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">Recomendaciones</h3>
              <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap">{reporte.recomendaciones}</p>
            </div>
          )}

          {/* Materiales Consumidos */}
          {reporte.materiales_consumidos && reporte.materiales_consumidos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Materiales Consumidos
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Material
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Unidad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reporte.materiales_consumidos.map((material, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{material.nombre}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{material.cantidad}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{material.unidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fotos del Trabajo */}
          {reporte.fotos && reporte.fotos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Fotos del Trabajo ({reporte.fotos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {reporte.fotos.map((foto, index) => (
                  <div key={index} className="space-y-2">
                    <img
                      src={foto.url}
                      alt={foto.descripcion || `Foto ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    {foto.descripcion && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">{foto.descripcion}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Firma del Cliente */}
          {reporte.firma_cliente_base64 && (
            <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <FileSignature className="w-5 h-5 mr-2" />
                Firma del Cliente
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 inline-block">
                <img
                  src={reporte.firma_cliente_base64}
                  alt="Firma del cliente"
                  className="h-32 border-b-2 border-gray-400"
                />
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-3">
                  {reporte.cliente_firma_nombre}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fecha: {new Date(reporte.fecha_creacion).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ReporteDetalle;
