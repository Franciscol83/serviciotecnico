import React from 'react';
import ClienteSection from './sections/ClienteSection';
import {
  UbicacionSection,
  FacturacionSection,
  AsignacionSection,
} from './sections/UbicacionFacturacionSection';
import {
  ServiciosSection,
  RecomendacionesSection,
  AgregarServicioForm,
} from './sections/ServiciosSection';

const ServiceModal = ({
  modalType,
  formData,
  setFormData,
  tecnicos,
  serviceTypes,
  onClose,
  onSubmit,
  agregarServicioItem,
  eliminarServicioItem,
  actualizarServicioItem,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {modalType === 'create' ? 'Nueva Orden de Servicio' : 'Agregar Servicio a Orden'}
      </h2>

      <form onSubmit={onSubmit} className="space-y-6">
        {modalType === 'create' ? (
          <>
            <ClienteSection formData={formData} setFormData={setFormData} />
            <UbicacionSection formData={formData} setFormData={setFormData} />
            <FacturacionSection formData={formData} setFormData={setFormData} />
            <AsignacionSection formData={formData} setFormData={setFormData} tecnicos={tecnicos} />
            <ServiciosSection
              formData={formData}
              serviceTypes={serviceTypes}
              agregarServicioItem={agregarServicioItem}
              eliminarServicioItem={eliminarServicioItem}
              actualizarServicioItem={actualizarServicioItem}
            />
            <RecomendacionesSection formData={formData} setFormData={setFormData} />
          </>
        ) : (
          <AgregarServicioForm
            formData={formData}
            setFormData={setFormData}
            serviceTypes={serviceTypes}
          />
        )}

        <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            data-testid="service-modal-cancel"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            data-testid="service-modal-submit"
          >
            {modalType === 'create' ? 'Crear Orden' : 'Agregar Servicio'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default ServiceModal;
