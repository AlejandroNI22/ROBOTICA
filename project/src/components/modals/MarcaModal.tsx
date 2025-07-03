import React, { useState, useEffect } from 'react';
import { X, Upload, Building2, Edit3, Image, Link } from 'lucide-react';
import { Marca } from '../../types';
import { departamentos } from '../../data/departamentos';

interface MarcaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (marca: Omit<Marca, 'id' | 'fechaCreacion'>) => void;
  marca?: Marca | null;
}

export const MarcaModal: React.FC<MarcaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  marca,
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    departamentos: [] as string[],
    imagen: '',
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageMethod, setImageMethod] = useState<'upload' | 'url'>('upload');

  useEffect(() => {
    if (marca) {
      setFormData({
        nombre: marca.nombre,
        departamentos: marca.departamentos,
        imagen: marca.imagen || '',
      });
      setImagePreview(marca.imagen || '');
    } else {
      setFormData({
        nombre: '',
        departamentos: [],
        imagen: '',
      });
      setImagePreview('');
    }
  }, [marca, isOpen]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, imagen: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, imagen: url }));
    setImagePreview(url);
  };

  const handleDepartamentoToggle = (departamentoId: string) => {
    setFormData(prev => ({
      ...prev,
      departamentos: prev.departamentos.includes(departamentoId)
        ? prev.departamentos.filter(id => id !== departamentoId)
        : [...prev.departamentos, departamentoId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-8">
          {/* Header rediseñado */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {marca ? 'Editar Marca' : 'Nueva Marca'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {marca ? 'Modifica la información de la marca' : 'Crea una nueva marca para organizar productos'}
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
            {/* Imagen de la marca rediseñada */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Imagen de la Marca
              </label>
              
              {/* Selector de método */}
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setImageMethod('upload')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                    imageMethod === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Subir Archivo
                </button>
                <button
                  type="button"
                  onClick={() => setImageMethod('url')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                    imageMethod === 'url'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Link className="w-4 h-4" />
                  URL de Imagen
                </button>
              </div>
              
              {/* Preview de imagen mejorado */}
              <div className="mb-6">
                {imagePreview ? (
                  <div className="relative w-full h-40 bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-200">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setFormData(prev => ({ ...prev, imagen: '' }));
                      }}
                      className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">Sin imagen seleccionada</p>
                      <p className="text-sm text-gray-400">La imagen aparecerá aquí</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Opciones para agregar imagen */}
              {imageMethod === 'upload' ? (
                <div>
                  <input
                    type="file"
                    id="imagen-upload"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="imagen-upload"
                    className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 cursor-pointer transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <Upload className="w-5 h-5" />
                    Seleccionar Imagen
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Formatos soportados: JPG, PNG (máx. 5MB)
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de la imagen:
                  </label>
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={formData.imagen}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Ingresa la URL completa de la imagen
                  </p>
                </div>
              )}
            </div>

            {/* Nombre de la marca */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Nombre de la Marca *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
                placeholder="Ej: URREA, Stanley, Interceramic"
              />
            </div>

            {/* Departamentos rediseñados */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Departamentos *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto border border-gray-200 rounded-2xl p-4 bg-gray-50">
                {departamentos.map((departamento) => (
                  <label
                    key={departamento.id}
                    className="flex items-start gap-4 p-4 hover:bg-white rounded-xl cursor-pointer transition-all border border-transparent hover:border-gray-200 hover:shadow-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formData.departamentos.includes(departamento.id)}
                      onChange={() => handleDepartamentoToggle(departamento.id)}
                      className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{departamento.nombre}</div>
                      {departamento.descripcion && (
                        <div className="text-sm text-gray-600 mt-1">{departamento.descripcion}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {formData.departamentos.length === 0 && (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  ⚠️ Selecciona al menos un departamento
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Seleccionados: {formData.departamentos.length} departamento(s)
              </p>
            </div>

            {/* Botones rediseñados */}
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
                disabled={formData.departamentos.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
              >
                {marca ? 'Actualizar' : 'Crear'} Marca
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};