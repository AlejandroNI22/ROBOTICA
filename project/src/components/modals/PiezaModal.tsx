import React, { useState, useEffect } from 'react';
import { X, Upload, Barcode, Key, Ruler } from 'lucide-react';
import { Pieza, Marca } from '../../types';
import { departamentos } from '../../data/departamentos';

interface PiezaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pieza: Omit<Pieza, 'id' | 'fechaCreacion' | 'fechaActualizacion'>) => void;
  marcas: Marca[];
  pieza?: Pieza | null;
  marcaPreseleccionada?: string;
}

export const PiezaModal: React.FC<PiezaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  marcas,
  pieza,
  marcaPreseleccionada,
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    imagen: '',
    precio: 0,
    marca: '',
    codigoBarras: '',
    clave: '',
    departamento: '',
    unidadVenta: '',
    // Campos específicos para azulejos
    medidaAncho: '',
    medidaLargo: '',
    precioMetro: '',
    metrosPorCaja: '',
  });

  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (pieza) {
      // Separar la medida si existe (formato "30x30" -> ancho: "30", largo: "30")
      let medidaAncho = '';
      let medidaLargo = '';
      
      if (pieza.medida) {
        const medidaParts = pieza.medida.split('x');
        if (medidaParts.length === 2) {
          medidaAncho = medidaParts[0].trim();
          medidaLargo = medidaParts[1].trim();
        } else {
          medidaAncho = pieza.medida;
        }
      }

      setFormData({
        nombre: pieza.nombre,
        descripcion: pieza.descripcion || '',
        imagen: pieza.imagen,
        precio: pieza.precio,
        marca: pieza.marca,
        codigoBarras: pieza.codigoBarras || '',
        clave: pieza.clave || '',
        departamento: pieza.departamento,
        unidadVenta: pieza.unidadVenta,
        medidaAncho,
        medidaLargo,
        precioMetro: pieza.precioMetro ? pieza.precioMetro.toString() : '',
        metrosPorCaja: pieza.metrosPorCaja ? pieza.metrosPorCaja.toString() : '',
      });
      setImagePreview(pieza.imagen);
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        imagen: '',
        precio: 0,
        marca: marcaPreseleccionada || '',
        codigoBarras: '',
        clave: '',
        departamento: '',
        unidadVenta: '',
        medidaAncho: '',
        medidaLargo: '',
        precioMetro: '',
        metrosPorCaja: '',
      });
      setImagePreview('');
    }
  }, [pieza, marcaPreseleccionada, isOpen]);

  const departamentoActual = departamentos.find(d => d.id === formData.departamento);
  
  // Filtrar marcas disponibles para el departamento seleccionado
  const marcasDisponibles = React.useMemo(() => {
    if (!formData.departamento) return marcas;
    return marcas.filter(m => m.departamentos.includes(formData.departamento));
  }, [marcas, formData.departamento]);

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

  const handleDepartamentoChange = (departamentoId: string) => {
    const departamento = departamentos.find(d => d.id === departamentoId);
    setFormData(prev => ({
      ...prev,
      departamento: departamentoId,
      unidadVenta: departamento?.unidadesVenta[0] || '',
      // Solo resetear marca si no está preseleccionada
      marca: marcaPreseleccionada ? prev.marca : '',
      // Limpiar campos específicos según el departamento
      clave: departamento?.requiereClave ? prev.clave : '',
      medidaAncho: departamento?.requiereMedida ? prev.medidaAncho : '',
      medidaLargo: departamento?.requiereMedida ? prev.medidaLargo : '',
      precioMetro: departamento?.id === 'azulejos' ? prev.precioMetro : '',
      metrosPorCaja: departamento?.id === 'azulejos' ? prev.metrosPorCaja : '',
    }));
  };

  const handleNombreChange = (nombre: string) => {
    // Convertir a formato de oración (primera letra mayúscula, resto minúscula)
    const nombreFormateado = nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
    setFormData(prev => ({ ...prev, nombre: nombreFormateado }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas solo para campos obligatorios
    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    
    if (!formData.departamento) {
      alert('El departamento es obligatorio');
      return;
    }
    
    if (!formData.marca.trim()) {
      alert('La marca es obligatoria');
      return;
    }
    
    if (!formData.unidadVenta) {
      alert('La unidad de venta es obligatoria');
      return;
    }
    
    if (formData.precio <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }
    
    // Combinar medidas para azulejos
    let medidaCombinada = '';
    if (departamentoActual?.requiereMedida && (formData.medidaAncho || formData.medidaLargo)) {
      if (formData.medidaAncho && formData.medidaLargo) {
        medidaCombinada = `${formData.medidaAncho}x${formData.medidaLargo}`;
      } else if (formData.medidaAncho) {
        medidaCombinada = formData.medidaAncho;
      }
    }
    
    // Preparar datos para guardar - convertir strings vacíos a undefined
    const dataToSave = {
      ...formData,
      // Convertir campos numéricos
      precioMetro: formData.precioMetro ? parseFloat(formData.precioMetro) : undefined,
      metrosPorCaja: formData.metrosPorCaja ? parseFloat(formData.metrosPorCaja) : undefined,
      // Solo incluir campos de texto si tienen valor
      clave: formData.clave.trim() || undefined,
      codigoBarras: formData.codigoBarras.trim() || undefined,
      medida: medidaCombinada || undefined,
      descripcion: formData.descripcion.trim() || undefined,
      // Remover campos temporales
      medidaAncho: undefined,
      medidaLargo: undefined,
    };
    
    onSave(dataToSave);
    onClose();
  };

  const generarCodigoBarras = () => {
    const codigo = Math.floor(Math.random() * 900000000000) + 100000000000;
    setFormData(prev => ({ ...prev, codigoBarras: codigo.toString() }));
  };

  const generarClave = () => {
    const nombre = formData.nombre.substring(0, 4).toUpperCase();
    const numero = Math.floor(Math.random() * 99) + 1;
    const claveGenerada = `${nombre}-${numero.toString().padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, clave: claveGenerada }));
  };

  if (!isOpen) return null;

  const isAzulejos = departamentoActual?.id === 'azulejos';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {pieza ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen del Producto
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover mx-auto rounded-lg"
                    />
                    <div className="flex gap-3 justify-center">
                      <input
                        type="file"
                        id="imagen"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="imagen"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Cambiar Imagen
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div className="flex gap-3 justify-center">
                      <input
                        type="file"
                        id="imagen"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="imagen"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Subir Imagen
                      </label>
                    </div>
                    <p className="text-sm text-gray-500">
                      Sube una imagen JPEG, JPG o PNG
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del producto"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se formateará automáticamente en tipo oración
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento *
                </label>
                <select
                  required
                  value={formData.departamento}
                  onChange={(e) => handleDepartamentoChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar departamento</option>
                  {departamentos.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Marca y unidad de venta */}
            {departamentoActual && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca *
                  </label>
                  <select
                    required
                    value={formData.marca}
                    onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!!marcaPreseleccionada}
                  >
                    <option value="">Seleccionar marca</option>
                    {marcasDisponibles.map((marca) => (
                      <option key={marca.id} value={marca.nombre}>
                        {marca.nombre}
                      </option>
                    ))}
                  </select>
                  {marcaPreseleccionada && (
                    <p className="text-xs text-gray-500 mt-1">
                      Marca preseleccionada del catálogo actual
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad de Venta *
                  </label>
                  <select
                    required
                    value={formData.unidadVenta}
                    onChange={(e) => setFormData(prev => ({ ...prev, unidadVenta: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar unidad</option>
                    {departamentoActual.unidadesVenta.map((unidad) => (
                      <option key={unidad} value={unidad}>
                        {unidad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Campos específicos para azulejos */}
            {isAzulejos && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Medida dividida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medida
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.medidaAncho}
                      onChange={(e) => setFormData(prev => ({ ...prev, medidaAncho: e.target.value }))}
                      className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                      placeholder="30"
                    />
                    <span className="text-lg font-bold text-gray-600">×</span>
                    <input
                      type="text"
                      value={formData.medidaLargo}
                      onChange={(e) => setFormData(prev => ({ ...prev, medidaLargo: e.target.value }))}
                      className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                      placeholder="30"
                    />
                    <div className="flex items-center px-2 py-2 bg-gray-100 rounded-lg">
                      <Ruler className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Medida del azulejo en centímetros (ancho × largo)
                  </p>
                </div>

                {/* Metros por caja */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metros por Caja
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.metrosPorCaja}
                      onChange={(e) => setFormData(prev => ({ ...prev, metrosPorCaja: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder=""
                    />
                    <div className="flex items-center px-3 py-2 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-600">m²</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cantidad de metros cuadrados que contiene una caja
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción del producto..."
              />
            </div>

            {/* Precios */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isAzulejos ? `Precio ${formData.unidadVenta} (MXN) *` : 'Precio (MXN) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData(prev => ({ ...prev, precio: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {isAzulejos ? `Precio por ${formData.unidadVenta.toLowerCase()}` : 'Precio principal del producto'}
                  </p>
                </div>

                {/* Campo precio metro para azulejos */}
                {isAzulejos && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Metro (MXN)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.precioMetro}
                      onChange={(e) => setFormData(prev => ({ ...prev, precioMetro: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder=""
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Precio por metro cuadrado (opcional)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Códigos */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Código de barras */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Barras
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.codigoBarras}
                      onChange={(e) => setFormData(prev => ({ ...prev, codigoBarras: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      placeholder="Escanear o ingresar código (opcional)"
                    />
                    <button
                      type="button"
                      onClick={generarCodigoBarras}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Barcode className="w-4 h-4" />
                      Generar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Código de barras para escaneo en punto de venta (opcional)
                  </p>
                </div>

                {/* Campo de clave */}
                {departamentoActual?.requiereClave && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clave
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.clave}
                        onChange={(e) => setFormData(prev => ({ ...prev, clave: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                        placeholder="Ej: MART-01 (opcional)"
                      />
                      <button
                        type="button"
                        onClick={generarClave}
                        disabled={!formData.nombre}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        title="Generar clave basada en el nombre"
                      >
                        <Key className="w-4 h-4" />
                        Auto
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Clave específica para productos de {departamentoActual.nombre.toLowerCase()} (opcional)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Botones */}
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {pieza ? 'Actualizar' : 'Crear'} Producto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};