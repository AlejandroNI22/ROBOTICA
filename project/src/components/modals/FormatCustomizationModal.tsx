import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, FileSpreadsheet, Edit3, GripVertical } from 'lucide-react';
import { getColorClasses } from '../../data/excelFormats';

interface FormatField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: string[];
}

interface FormatCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (format: any) => void;
  format?: any;
  marcaId: string;
  marcaNombre: string;
}

export const FormatCustomizationModal: React.FC<FormatCustomizationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  format,
  marcaId,
  marcaNombre,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'red',
    fields: [] as FormatField[],
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (format) {
      setFormData({
        name: format.name,
        description: format.description,
        color: format.color,
        fields: format.fields.map((field: any, index: number) => ({
          ...field,
          id: field.id || `field_${index}`,
        })),
      });
    } else {
      // Formato nuevo con campos básicos
      setFormData({
        name: `Formato ${marcaNombre}`,
        description: `Formato personalizado para productos de ${marcaNombre}`,
        color: 'red',
        fields: [
          {
            id: 'field_1',
            name: 'nombre',
            label: 'NOMBRE',
            type: 'text',
            required: true,
          },
          {
            id: 'field_2',
            name: 'precio',
            label: 'PRECIO',
            type: 'number',
            required: true,
          },
        ],
      });
    }
  }, [format, marcaNombre, isOpen]);

  const addField = () => {
    const newField: FormatField = {
      id: `field_${Date.now()}`,
      name: '',
      label: '',
      type: 'text',
      required: false,
    };
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
  };

  const updateField = (index: number, updates: Partial<FormatField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === index ? { ...field, ...updates } : field
      ),
    }));
  };

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const newFields = [...prev.fields];
      const [movedField] = newFields.splice(fromIndex, 1);
      newFields.splice(toIndex, 0, movedField);
      return { ...prev, fields: newFields };
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveField(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.fields.length === 0) {
      alert('Debe agregar al menos un campo');
      return;
    }

    const hasEmptyFields = formData.fields.some(field => !field.name.trim() || !field.label.trim());
    if (hasEmptyFields) {
      alert('Todos los campos deben tener nombre y etiqueta');
      return;
    }

    const formatToSave = {
      id: format?.id || `custom_${marcaId}_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      color: formData.color,
      marcaId: marcaId,
      fields: formData.fields,
      isCustom: true,
      createdAt: format?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(formatToSave);
    onClose();
  };

  const downloadTemplate = () => {
    if (formData.fields.length === 0) return;
    
    const headers = formData.fields.map(field => field.label);
    const csvContent = headers.join(',');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_${formData.name.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const colorClasses = getColorClasses(formData.color);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${colorClasses.bg} rounded-xl flex items-center justify-center shadow-lg`}>
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {format ? 'Editar Formato' : 'Crear Formato Personalizado'}
                </h2>
                <p className="text-gray-600 mt-1">
                  Para {marcaNombre}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Nombre del Formato *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  placeholder="Ej: Formato URREA Herramientas"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Color del Formato
                </label>
                <div className="flex gap-3">
                  {['red', 'orange', 'blue', 'purple', 'green', 'gray'].map((color) => {
                    const classes = getColorClasses(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-10 h-10 rounded-xl ${classes.bg} ${
                          formData.color === color ? 'ring-4 ring-offset-2 ' + classes.ring : 'hover:scale-105'
                        } transition-all shadow-md`}
                        title={color}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                placeholder="Descripción del formato..."
              />
            </div>

            {/* Campos del formato */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Campos del Excel</h3>
                <button
                  type="button"
                  onClick={addField}
                  className={`flex items-center gap-2 px-4 py-2 ${colorClasses.bg} ${colorClasses.bgHover} text-white rounded-xl transition-colors shadow-lg`}
                >
                  <Plus className="w-4 h-4" />
                  Agregar Campo
                </button>
              </div>

              <div className="space-y-4">
                {formData.fields.map((field, index) => (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`border-2 rounded-xl p-4 transition-all cursor-move ${
                      draggedIndex === index ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Handle para arrastrar */}
                      <div className="flex-shrink-0 mt-3">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>

                      {/* Campos del formulario */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre Interno *
                          </label>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(index, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                            placeholder="codigo, nombre, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Etiqueta en Excel *
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                            placeholder="CÓDIGO, NOMBRE, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(index, { type: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
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
                              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            />
                            Requerido
                          </label>
                          <button
                            type="button"
                            onClick={() => removeField(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar campo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Opciones para campos tipo select */}
                    {field.type === 'select' && (
                      <div className="mt-4 ml-9">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Opciones (separadas por coma)
                        </label>
                        <input
                          type="text"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => updateField(index, { 
                            options: e.target.value.split(',').map(o => o.trim()).filter(o => o) 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                          placeholder="Opción 1, Opción 2, Opción 3"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {formData.fields.length === 0 && (
                  <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No hay campos configurados</p>
                    <p className="text-sm">Agrega campos para definir la estructura del Excel</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vista previa de la estructura */}
            {formData.fields.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Vista Previa del Excel</h4>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Descargar Plantilla
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                    <thead>
                      <tr className={`${colorClasses.bg} text-white`}>
                        {formData.fields.map((field, index) => (
                          <th key={index} className="border border-gray-300 px-4 py-3 text-left font-semibold">
                            {field.label}
                            {field.required && <span className="text-red-200 ml-1">*</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-gray-50">
                        {formData.fields.map((field, index) => (
                          <td key={index} className="border border-gray-300 px-4 py-3 text-xs text-gray-500 italic">
                            {field.type === 'number' ? '123.45' : 
                             field.type === 'select' ? field.options?.[0] || 'Opción' :
                             'Texto ejemplo'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={formData.fields.length === 0}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 ${colorClasses.bg} ${colorClasses.bgHover} text-white rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none`}
              >
                <Save className="w-5 h-5" />
                {format ? 'Actualizar' : 'Crear'} Formato
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};