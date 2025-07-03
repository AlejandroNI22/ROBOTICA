import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Download, Upload, AlertCircle, RefreshCw, Settings, Plus, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { Marca } from '../types';
import { departamentos } from '../data/departamentos';
import { defaultExcelFormats, getColorClasses } from '../data/excelFormats';
import { FormatCustomizationModal } from './modals/FormatCustomizationModal';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, targetMarca?: string, targetDepartamento?: string) => void;
  marcas: Marca[];
  marcaPreseleccionada?: string;
  mode?: 'new' | 'update';
  onConfigureFormats?: () => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  onImport,
  marcas,
  marcaPreseleccionada,
  mode = 'new',
  onConfigureFormats,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [customFormats, setCustomFormats] = useState<any[]>([]);
  const [showFormatMenu, setShowFormatMenu] = useState<string | null>(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [editingFormat, setEditingFormat] = useState<any>(null);

  // Cargar formatos personalizados del localStorage
  useEffect(() => {
    const savedFormats = localStorage.getItem(`custom_formats_${marcaPreseleccionada}`);
    if (savedFormats) {
      try {
        setCustomFormats(JSON.parse(savedFormats));
      } catch (error) {
        console.error('Error loading custom formats:', error);
      }
    }
  }, [marcaPreseleccionada]);

  // Guardar formatos personalizados en localStorage
  const saveCustomFormats = (formats: any[]) => {
    if (marcaPreseleccionada) {
      localStorage.setItem(`custom_formats_${marcaPreseleccionada}`, JSON.stringify(formats));
      setCustomFormats(formats);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onImport(files[0]);
      onClose();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onImport(files[0]);
      onClose();
    }
  };

  const downloadTemplate = () => {
    if (!selectedFormat) return;
    
    const format = [...defaultExcelFormats, ...customFormats].find(f => f.id === selectedFormat);
    if (!format) return;
    
    const headers = format.fields.map(field => field.label);
    const csvContent = headers.join(',');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_${format.name.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const marcaActual = marcaPreseleccionada ? marcas.find(m => m.id === marcaPreseleccionada) : null;

  // Filtrar formatos específicos por marca
  const formatosDisponibles = React.useMemo(() => {
    if (!marcaPreseleccionada || !marcaActual) return [];
    
    const marcaLower = marcaActual.nombre.toLowerCase();
    const formatosEspecificos = defaultExcelFormats.filter(format => {
      if (marcaLower.includes('urrea') && format.id === 'urrea') return true;
      if (marcaLower.includes('truper') && format.id === 'truper') return true;
      if (marcaLower.includes('malla') && format.id === 'mallas') return true;
      // Permitir MALLAS para cualquier marca que contenga "construccion" o "material"
      if ((marcaLower.includes('construccion') || marcaLower.includes('material')) && format.id === 'mallas') return true;
      return false;
    });

    // Agregar formatos personalizados de esta marca
    const formatosPersonalizados = customFormats.filter(format => 
      format.marcaId === marcaPreseleccionada
    );

    return [...formatosEspecificos, ...formatosPersonalizados];
  }, [marcaPreseleccionada, marcaActual, customFormats]);

  // Detectar automáticamente el formato según la marca preseleccionada
  useEffect(() => {
    if (marcaPreseleccionada && marcaActual) {
      const marcaLower = marcaActual.nombre.toLowerCase();
      if (marcaLower.includes('truper')) {
        setSelectedFormat('truper');
      } else if (marcaLower.includes('urrea')) {
        setSelectedFormat('urrea');
      } else if (marcaLower.includes('malla') || marcaLower.includes('construccion') || marcaLower.includes('material')) {
        setSelectedFormat('mallas');
      }
    }
  }, [marcaPreseleccionada, marcaActual]);

  const handleCreateNewFormat = () => {
    setEditingFormat(null);
    setShowCustomizationModal(true);
  };

  const handleCustomizeFormat = (formatId: string) => {
    const format = [...defaultExcelFormats, ...customFormats].find(f => f.id === formatId);
    if (format) {
      // Crear una copia personalizable del formato
      const customizableFormat = {
        ...format,
        id: `custom_${marcaPreseleccionada}_${Date.now()}`,
        name: `${format.name} Personalizado`,
        isCustom: true,
        marcaId: marcaPreseleccionada,
      };
      setEditingFormat(customizableFormat);
      setShowCustomizationModal(true);
    }
    setShowFormatMenu(null);
  };

  const handleEditFormat = (formatId: string) => {
    const format = customFormats.find(f => f.id === formatId);
    if (format) {
      setEditingFormat(format);
      setShowCustomizationModal(true);
    }
    setShowFormatMenu(null);
  };

  const handleDeleteFormat = (formatId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este formato personalizado?')) {
      const updatedFormats = customFormats.filter(f => f.id !== formatId);
      saveCustomFormats(updatedFormats);
      
      if (selectedFormat === formatId) {
        setSelectedFormat('');
      }
    }
    setShowFormatMenu(null);
  };

  const handleSaveCustomFormat = (format: any) => {
    const existingIndex = customFormats.findIndex(f => f.id === format.id);
    let updatedFormats;
    
    if (existingIndex >= 0) {
      // Actualizar formato existente
      updatedFormats = customFormats.map(f => f.id === format.id ? format : f);
    } else {
      // Agregar nuevo formato
      updatedFormats = [...customFormats, format];
    }
    
    saveCustomFormats(updatedFormats);
    setSelectedFormat(format.id);
    setShowCustomizationModal(false);
    setEditingFormat(null);
  };

  const handleFormatMenuToggle = (formatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFormatMenu(showFormatMenu === formatId ? null : formatId);
  };

  // Función mejorada para determinar si un formato es personalizado/eliminable
  const isCustomFormat = (formatId: string) => {
    // Verificar si está en la lista de formatos personalizados
    const isInCustomFormats = customFormats.some(cf => cf.id === formatId);
    
    // Verificar si NO es un formato predeterminado
    const isNotDefaultFormat = !['urrea', 'truper', 'mallas'].includes(formatId);
    
    // Es personalizado si está en customFormats O si no es un formato predeterminado
    return isInCustomFormats || isNotDefaultFormat;
  };

  if (!isOpen) return null;

  const isUpdateMode = mode === 'update';
  const currentFormat = [...defaultExcelFormats, ...customFormats].find(f => f.id === selectedFormat);
  const formatColorClasses = currentFormat ? getColorClasses(currentFormat.color) : getColorClasses('gray');

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
          <div className="p-8">
            {/* Header rediseñado */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${isUpdateMode ? 'bg-purple-600' : 'bg-green-600'} rounded-xl flex items-center justify-center shadow-lg`}>
                  {isUpdateMode ? (
                    <RefreshCw className="w-6 h-6 text-white" />
                  ) : (
                    <FileSpreadsheet className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {isUpdateMode ? 'Actualizar Catálogo' : 'Importar desde Excel'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {marcaActual?.nombre && `Configurado para ${marcaActual.nombre}`}
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

            {/* Información del modo */}
            {isUpdateMode && (
              <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl">
                <div className="flex items-start gap-4">
                  <RefreshCw className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-purple-900 text-lg">Modo Actualización de Catálogo</h3>
                    <p className="text-purple-800 mt-2">
                      Los productos existentes se actualizarán por código de barras o clave, 
                      <strong> manteniendo sus imágenes actuales</strong>. Los productos nuevos se agregarán al catálogo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Panel izquierdo - Configuración de formatos */}
              <div className="space-y-8">
                {/* Configuración de formatos específicos por marca */}
                <div className={`border-2 rounded-2xl p-6 ${
                  currentFormat ? formatColorClasses.bgLight + ' ' + formatColorClasses.border : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold ${
                      currentFormat ? formatColorClasses.text : 'text-gray-900'
                    }`}>
                      Formatos para {marcaActual?.nombre}
                    </h3>
                    
                    {/* Botón para crear nuevo formato */}
                    <button
                      onClick={handleCreateNewFormat}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shadow-lg"
                      title="Crear nuevo formato personalizado"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo Formato
                    </button>
                  </div>
                  
                  {/* Selector de formato específico por marca */}
                  <div className="space-y-4">
                    {formatosDisponibles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No hay formatos disponibles para {marcaActual?.nombre}</p>
                        <p className="text-sm mt-1">Crea un formato personalizado para esta marca</p>
                      </div>
                    ) : (
                      formatosDisponibles.map((format) => {
                        const colorClasses = getColorClasses(format.color);
                        const formatIsCustom = isCustomFormat(format.id);
                        
                        return (
                          <div key={format.id} className="relative">
                            {/* Botón de menú con tres puntos */}
                            <div className="absolute top-2 right-2 z-20">
                              <button
                                onClick={(e) => handleFormatMenuToggle(format.id, e)}
                                className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg shadow-sm transition-all hover:shadow-md"
                                title="Opciones del formato"
                              >
                                <MoreHorizontal className="w-4 h-4 text-gray-600" />
                              </button>

                              {/* Menú desplegable */}
                              {showFormatMenu === format.id && (
                                <>
                                  {/* Overlay para cerrar */}
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setShowFormatMenu(null)}
                                  />
                                  
                                  {/* Menú de opciones */}
                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-30 overflow-hidden">
                                    <div className="py-2">
                                      {/* Personalizar - Disponible para todos */}
                                      <button
                                        onClick={() => handleCustomizeFormat(format.id)}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                      >
                                        <Settings className="w-4 h-4" />
                                        Personalizar
                                      </button>
                                      
                                      {/* Editar y Eliminar - Solo para formatos personalizados */}
                                      {formatIsCustom && (
                                        <>
                                          <button
                                            onClick={() => handleEditFormat(format.id)}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                          >
                                            <Edit className="w-4 h-4" />
                                            Editar
                                          </button>
                                          
                                          <div className="border-t border-gray-100">
                                            <button
                                              onClick={() => handleDeleteFormat(format.id)}
                                              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                              Eliminar
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                            
                            {/* Tarjeta del formato */}
                            <button
                              type="button"
                              onClick={() => setSelectedFormat(format.id)}
                              className={`w-full p-4 pr-12 rounded-xl border-2 transition-all text-left ${
                                selectedFormat === format.id
                                  ? `${colorClasses.border} ${colorClasses.bgLight} ${colorClasses.text} shadow-lg`
                                  : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-base font-semibold">{format.name}</div>
                                {formatIsCustom && (
                                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                    Personalizado
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">{format.fields.length} columnas</div>
                              <div className="text-xs text-gray-500">{format.description}</div>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Información del formato seleccionado */}
                  {currentFormat && (
                    <div className="mt-6 space-y-4">
                      <h4 className={`font-semibold ${formatColorClasses.text}`}>
                        Detalles del Formato {currentFormat.name}
                      </h4>
                      
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Nombre del formato:</span>
                            <span className={`font-semibold ${formatColorClasses.text}`}>{currentFormat.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Columnas:</span>
                            <span className="text-gray-900">{currentFormat.fields.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Campos requeridos:</span>
                            <span className="text-gray-900">{currentFormat.fields.filter(f => f.required).length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Específico para:</span>
                            <span className="text-gray-900">{marcaActual?.nombre}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Estructura del Excel */}
                {currentFormat && (
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Estructura del Excel - {currentFormat.name}
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className={`${formatColorClasses.bg} text-white`}>
                            {currentFormat.fields.map((field, index) => (
                              <th key={index} className="border border-gray-300 px-3 py-2 text-left font-semibold">
                                {field.label}
                                {field.required && <span className="text-red-200 ml-1">*</span>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white">
                            {currentFormat.fields.map((field, index) => (
                              <td key={index} className="border border-gray-300 px-3 py-2 text-xs text-gray-500 italic">
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

                {/* Botón de plantilla */}
                {currentFormat && (
                  <div className="text-center">
                    <button
                      onClick={downloadTemplate}
                      className={`flex items-center justify-center gap-3 px-8 py-4 ${formatColorClasses.bg} ${formatColorClasses.bgHover} text-white rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 mx-auto text-lg font-semibold`}
                    >
                      <Download className="w-6 h-6" />
                      Descargar Plantilla {currentFormat.name}
                    </button>
                    <p className="text-sm text-gray-600 mt-3">
                      {currentFormat.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Panel derecho - Zona de subida */}
              <div className="space-y-8">
                {/* Zona de subida mejorada */}
                <div
                  className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FileSpreadsheet className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Arrastra tu archivo aquí
                    </h3>
                    <p className="text-gray-600">
                      O selecciona un archivo desde tu computadora
                    </p>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileInput}
                      className="hidden"
                      id="excel-upload"
                      disabled={!selectedFormat}
                    />
                    <label
                      htmlFor="excel-upload"
                      className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                        selectedFormat
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Upload className="w-5 h-5" />
                      Seleccionar Archivo
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Formatos soportados: CSV, XLSX, XLS (máx. 10MB)
                  </p>
                </div>

                {/* Advertencias */}
                {!selectedFormat && (
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-yellow-900 text-lg">Formato requerido</h4>
                        <p className="text-yellow-800 mt-2">
                          Selecciona un formato específico para {marcaActual?.nombre} antes de {isUpdateMode ? 'actualizar' : 'importar'}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Proceso de importación/actualización */}
                {currentFormat && (
                  <div className={`border-2 rounded-2xl p-6 ${
                    isUpdateMode ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200' : `${formatColorClasses.bgLight} ${formatColorClasses.border}`
                  }`}>
                    <h4 className={`font-semibold text-lg mb-4 ${
                      isUpdateMode ? 'text-purple-900' : formatColorClasses.text
                    }`}>
                      Proceso de {isUpdateMode ? 'Actualización' : 'Importación'}:
                    </h4>
                    <ol className={`list-decimal list-inside space-y-2 text-sm ${
                      isUpdateMode ? 'text-purple-800' : formatColorClasses.text
                    }`}>
                      <li>Se valida la estructura según el formato {currentFormat.name}</li>
                      <li><strong>Se asigna automáticamente a {marcaActual?.nombre}</strong></li>
                      {isUpdateMode ? (
                        <>
                          <li><strong>Se buscan productos existentes por código de barras o clave</strong></li>
                          <li><strong>Se actualizan precios y datos, manteniendo las imágenes</strong></li>
                          <li>Los productos no encontrados se agregan como nuevos</li>
                        </>
                      ) : (
                        <>
                          <li>Se autocompletan departamento y unidades</li>
                          <li>Se generan códigos de barras si faltan</li>
                        </>
                      )}
                      <li>Se asignan imágenes por defecto a productos nuevos</li>
                      <li><strong>Los campos vacíos se sustituyen automáticamente (0 para números, "NA" para texto)</strong></li>
                    </ol>
                  </div>
                )}

                {/* Información adicional */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6">
                  <h4 className="font-semibold text-blue-900 text-lg mb-4">Notas importantes:</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
                    <li><strong>Los datos vacíos se sustituyen automáticamente para evitar errores</strong></li>
                    <li>Los precios deben estar en formato numérico (se asigna 0 si están vacíos)</li>
                    <li><strong>Los códigos de barras deben ser formato numérico</strong></li>
                    <li><strong>Las imágenes se gestionan individualmente en cada producto</strong></li>
                    <li><strong>Cada formato es específico para {marcaActual?.nombre}</strong></li>
                    {currentFormat?.id === 'mallas' && (
                      <li><strong>MALLAS: Formato para productos de construcción y materiales</strong></li>
                    )}
                    {isUpdateMode && (
                      <li><strong>En modo actualización, las imágenes existentes se conservan</strong></li>
                    )}
                    <li>Puedes editar los productos después de {isUpdateMode ? 'actualizar' : 'importar'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de personalización de formato */}
      {showCustomizationModal && marcaActual && (
        <FormatCustomizationModal
          isOpen={showCustomizationModal}
          onClose={() => {
            setShowCustomizationModal(false);
            setEditingFormat(null);
          }}
          onSave={handleSaveCustomFormat}
          format={editingFormat}
          marcaId={marcaPreseleccionada!}
          marcaNombre={marcaActual.nombre}
        />
      )}
    </>
  );
};