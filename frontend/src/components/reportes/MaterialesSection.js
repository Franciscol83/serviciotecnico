import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const MaterialesSection = ({
  materialTemp,
  setMaterialTemp,
  materialesConsumidos,
  addMaterial,
  removeMaterial,
}) => (
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
        data-testid="material-nombre-input"
      />
      <input
        type="number"
        step="0.1"
        placeholder="Cantidad"
        value={materialTemp.cantidad}
        onChange={(e) => setMaterialTemp({ ...materialTemp, cantidad: e.target.value })}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        data-testid="material-cantidad-input"
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
        data-testid="material-add-btn"
      >
        <Plus className="w-4 h-4 mr-1" />
        Agregar
      </button>
    </div>

    {materialesConsumidos.length > 0 && (
      <div className="space-y-2 mt-4">
        {materialesConsumidos.map((material, index) => (
          <div
            key={`material-${material.nombre}-${index}`}
            className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
          >
            <div>
              <span className="font-medium text-gray-900 dark:text-white">{material.nombre}</span>
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
);

export default MaterialesSection;
