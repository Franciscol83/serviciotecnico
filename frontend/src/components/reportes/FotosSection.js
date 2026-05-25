import React from 'react';
import { Camera, Plus, Trash2 } from 'lucide-react';

const FotosSection = ({ fotos, handleImageUpload, removeFoto, updateFotoDescripcion }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fotos del Trabajo</h3>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      <div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
          id="foto-camera"
          data-testid="foto-camera-input"
        />
        <label
          htmlFor="foto-camera"
          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
        >
          <Camera className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Tomar Foto (Móvil)</span>
        </label>
        <p className="text-xs text-gray-500 mt-1 text-center">Funciona solo en celular/tablet</p>
      </div>

      <div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
          id="foto-upload"
          data-testid="foto-upload-input"
        />
        <label
          htmlFor="foto-upload"
          className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
        >
          <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Subir Fotos (PC)</span>
        </label>
        <p className="text-xs text-gray-500 mt-1 text-center">Seleccionar una o varias fotos</p>
      </div>
    </div>

    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
      Tamaño máximo por foto: 5MB. Puedes subir múltiples fotos.
    </p>

    {fotos.length > 0 && (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {fotos.map((foto, index) => (
          <div key={`foto-${foto.timestamp}-${index}`} className="relative group">
            <img src={foto.url} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
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
);

export default FotosSection;
