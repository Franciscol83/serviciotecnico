import React from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle, Signature } from 'lucide-react';

const FirmaSection = ({
  signatureRef,
  nombreFirma,
  setNombreFirma,
  firmaCapturada,
  saveSignature,
  clearSignature,
}) => (
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
        value={nombreFirma}
        onChange={(e) => setNombreFirma(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        required
        placeholder="Nombre completo..."
        data-testid="firma-nombre-input"
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
      Dibuja con tu dedo o stylus en el área blanca
    </p>

    <div className="flex space-x-3 mt-3">
      <button
        type="button"
        onClick={saveSignature}
        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        data-testid="firma-save-btn"
      >
        Guardar Firma
      </button>
      <button
        type="button"
        onClick={clearSignature}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        data-testid="firma-clear-btn"
      >
        Limpiar
      </button>
    </div>

    {firmaCapturada && (
      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-sm text-green-800 dark:text-green-200 flex items-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          Firma capturada correctamente
        </p>
      </div>
    )}
  </div>
);

export default FirmaSection;
