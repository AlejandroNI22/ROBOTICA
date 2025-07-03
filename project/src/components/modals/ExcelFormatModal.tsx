import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Settings, Save, FileSpreadsheet } from 'lucide-react';
import { ExcelFormat, ExcelFormatField, Marca } from '../../types';
import { defaultExcelFormats, getColorClasses } from '../../data/excelFormats';

interface ExcelFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (format: Omit<ExcelFormat, 'id' | 'createdAt' | 'updatedAt'>) => void;
  format?: ExcelFormat | null;
  marcas: Marca[];
}

export const ExcelFormatModal: React.FC<ExcelFormatModalProps> = ({
  isOpen,
  onClose,
  onSave,
  format,
  marcas
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    marcaId: '',
    color: 'gray',
    fields: [] as Omit<ExcelFormatField, 'id'>[],
    isActive: true
  });

  useEffect(() => {
    if (format) {
      setFormData({
        name: format.name,
        description: format.description,
        marcaId: format.marcaId || '',
        color: format.color,
        fields: format.fields.map(({ id, ...field }) => field),
        isActive: format.isActive
      });
    } else {
      setFormData({
        name: '',
        description: '',
        marcaId: '',
        color: 'gray',
        fields: [],
        isActive: true
      });
    }
  }, [format, isOpen]);

  const addField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, {
        name: '',
        label: '',
        type: 'text',
        required: false
      }]
    }));
  };

  const updateField = (index: number, field: Partial<Omit<ExcelFormatField, 'id'>>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...field } : f)
    }));
  };

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const loadTemplate = (templateId: string) => {
    const template = defaultExcelFormats.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: template.name,
        description: template.description,
        color: template.color,
        fields: [...template.fields]
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.fields.length === 0) {
      alert('Debe agregar al menos un campo');
      return;
    }

    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const colorClasses = getColorClasses(formData.color);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${colorClasses.bg} rounded-lg flex items-center justify-center`}>
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {format ? 'Editar Formato Excel' : 'Nuevo Formato Excel'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Formato *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: URREA, TRUPER, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca Asociada (Opcional)
                </label>
                <select
                  value={formData.marcaId}
                  onChange={(e) => setFormData(prev => ({ ...prev, marcaId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sin marca específica</option>
                  {marcas.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción del formato..."
              />
            </div>

            {/* Color del formato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color del Formato
              </label>
              <div className="flex gap-2">
                {['orange', 'blue', 'purple', 'green', 'red', 'gray'].map((color) => {
                  const classes = getColorClasses(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full ${classes.bg} ${
                        formData.color === color ? 'ring-2 ring-offset-2 ' + classes.ring : ''
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Plantillas predefinidas */}
            <div className={`${colorClasses.bgLight} ${colorClasses.border} border rounded-lg p-4`}>
              <h3 className={`font-semibold ${colorClasses.text} mb-3`}>Plantillas Predefinidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {defaultExcelFormats.map((template) => {
                  const templateClasses = getColorClasses(template.color);
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => loadTemplate(template.id)}
                      className={`p-2 ${templateClasses.bgLight} ${templateClasses.border} border rounded-lg hover:${templateClasses.bg} hover:text-white transition-colors text-sm`}
                    >
                      {template.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campos del formato */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Campos del Excel</h3>
                <button
                  type="button"
                  onClick={addField}
                  className={`flex items-center gap-2 px-3 py-2 ${colorClasses.bg} ${colorClasses.bgHover} text-white rounded-lg transition-colors`}
                >
                  <Plus className="w-4 h-4" />
                  Agregar Campo
                </button>
              </div>

              <div className="space-y-4">
                {formData.fields.map((field, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre Interno
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(index, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="codigo, nombre, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Etiqueta en Excel
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="CÓDIGO, NOMBRE, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, { type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="text">Texto</option>
                          <option value="number">Número</option>
                          <option value="select">Selección</option>
                        </select>
                      </div>

                      <div className="flex items-end gap-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          Requerido
                        </label>
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Opciones para campos tipo select */}
                    {field.type === 'select' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Opciones (separadas por coma)
                        </label>
                        <input
                          type="text"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => updateField(index, { 
                            options: e.target.value.split(',').map(o => o.trim()).filter(o => o) 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Opción 1, Opción 2, Opción 3"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {formData.fields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay campos configurados</p>
                    <p className="text-sm">Agrega campos para definir la estructura del Excel</p>
                  </div>
                )}
              </div>
            </div>

            {/* Estado activo */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Formato activo
              </label>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={formData.fields.length === 0}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 ${colorClasses.bg} ${colorClasses.bgHover} text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed`}
              >
                <Save className="w-4 h-4" />
                {format ? 'Actualizar' : 'Crear'} Formato
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};