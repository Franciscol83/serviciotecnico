import React from 'react';
import ServiceSelector from './ServiceSelector';
import MaterialesSection from './MaterialesSection';
import FotosSection from './FotosSection';
import FirmaSection from './FirmaSection';

const ReporteModal = ({
  formData,
  setFormData,
  loading,
  onClose,
  onSubmit,
  // Selector
  searchServicio,
  setSearchServicio,
  filtroEstado,
  setFiltroEstado,
  servicios,
  serviciosFiltrados,
  // Materiales
  materialTemp,
  setMaterialTemp,
  addMaterial,
  removeMaterial,
  // Fotos
  handleImageUpload,
  removeFoto,
  updateFotoDescripcion,
  // Firma
  signatureRef,
  saveSignature,
  clearSignature,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Crear Reporte Técnico</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          <ServiceSelector
            searchServicio={searchServicio}
            setSearchServicio={setSearchServicio}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            servicios={servicios}
            serviciosFiltrados={serviciosFiltrados}
            servicioId={formData.servicio_id}
            setServicioId={(v) => setFormData({ ...formData, servicio_id: v })}
          />

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
              data-testid="trabajo-realizado-input"
            />
          </div>

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

          <MaterialesSection
            materialTemp={materialTemp}
            setMaterialTemp={setMaterialTemp}
            materialesConsumidos={formData.materiales_consumidos}
            addMaterial={addMaterial}
            removeMaterial={removeMaterial}
          />

          <FotosSection
            fotos={formData.fotos}
            handleImageUpload={handleImageUpload}
            removeFoto={removeFoto}
            updateFotoDescripcion={updateFotoDescripcion}
          />

          <FirmaSection
            signatureRef={signatureRef}
            nombreFirma={formData.cliente_firma_nombre}
            setNombreFirma={(v) => setFormData({ ...formData, cliente_firma_nombre: v })}
            firmaCapturada={formData.firma_cliente_base64}
            saveSignature={saveSignature}
            clearSignature={clearSignature}
          />

          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
              data-testid="reporte-cancel-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              data-testid="reporte-submit-btn"
            >
              {loading ? 'Guardando...' : 'Crear Reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);

export default ReporteModal;
