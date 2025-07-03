import React, { useState } from 'react';
import { Building2, Edit, FileSpreadsheet, Download, MoreHorizontal, Settings, Palette } from 'lucide-react';
import { Marca } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getColorClasses } from '../data/excelFormats';

interface MarcaCardProps {
  marca: Marca;
  onSelect: (marcaId: string) => void;
  onEdit?: (marca: Marca) => void;
  onImportExcel?: (marcaId: string) => void;
  onExportCatalog?: (marcaId: string) => void;
  onConfigureFormats?: (marcaId: string) => void;
  isSelected: boolean;
}

export const MarcaCard: React.FC<MarcaCardProps> = ({
  marca,
  onSelect,
  onEdit,
  onImportExcel,
  onExportCatalog,
  onConfigureFormats,
  isSelected
}) => {
  const { hasPermission } = useAuth();
  const [showActions, setShowActions] = useState(false);

  // Determinar color de la marca basado en el nombre
  const getMarcaColor = (nombre: string) => {
    const lowerName = nombre.toLowerCase();
    if (lowerName.includes('urrea')) return 'orange';
    if (lowerName.includes('truper')) return 'blue';
    if (lowerName.includes('cenezzia')) return 'purple';
    if (lowerName.includes('stanley')) return 'gray';
    if (lowerName.includes('interceramic')) return 'green';
    return 'red'; // Color por defecto (Ceramicasa)
  };

  const marcaColor = getMarcaColor(marca.nombre);
  const colorClasses = getColorClasses(marcaColor);

  // Usar la imagen de la marca si existe, sino usar imagen por defecto
  const getImageForMarca = (marca: Marca) => {
    if (marca.imagen) {
      return marca.imagen;
    }
    
    // Imagen por defecto basada en el nombre
    const lowerName = marca.nombre.toLowerCase();
    
    if (lowerName.includes('interceramic') || lowerName.includes('ceramic')) {
      return 'https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&w=400';
    } else if (lowerName.includes('stanley') || lowerName.includes('tool')) {
      return 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=400';
    } else if (lowerName.includes('condumex') || lowerName.includes('electric')) {
      return 'https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=400';
    } else if (lowerName.includes('pavco') || lowerName.includes('pvc')) {
      return 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=400';
    } else if (lowerName.includes('urrea')) {
      return 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=400';
    } else if (lowerName.includes('truper')) {
      return 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=400';
    } else if (lowerName.includes('cenezzia')) {
      return 'https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&w=400';
    } else {
      return 'https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&w=400';
    }
  };

  const handleCardClick = () => {
    onSelect(marca.id);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
    setShowActions(false);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(!showActions);
  };

  const handleMenuClose = () => {
    setShowActions(false);
  };

  return (
    <div
      className={`relative group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${
        isSelected 
          ? `ring-4 ring-opacity-50 shadow-2xl ${colorClasses.ring}` 
          : `hover:ring-2 hover:${colorClasses.ring}`
      }`}
    >
      {/* Imagen de fondo - ÁREA PRINCIPAL DE CLICK */}
      <div 
        className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-100 to-gray-200"
        onClick={handleCardClick}
      >
        <img
          src={getImageForMarca(marca)}
          alt={marca.nombre}
          className="w-full h-56 object-cover"
          onError={(e) => {
            // Fallback si la imagen no carga
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&w=400';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>

      {/* Botón de acciones - ÁREA SEPARADA DE CLICK */}
      {hasPermission('edit') && (
        <div className="absolute top-4 right-4 z-20">
          <div className="relative">
            <button
              onClick={handleMenuToggle}
              className={`p-3 bg-white bg-opacity-95 rounded-xl shadow-lg hover:bg-opacity-100 transition-all ${colorClasses.textLight} backdrop-blur-sm hover:scale-105`}
              title="Opciones de marca"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Menú desplegable de acciones */}
            {showActions && (
              <>
                {/* Overlay para cerrar el menú */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={handleMenuClose}
                />
                
                {/* Menú de opciones */}
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-30 overflow-hidden">
                  <div className="py-2">
                    {/* Editar marca */}
                    {hasPermission('edit') && onEdit && (
                      <button
                        onClick={(e) => handleActionClick(e, () => onEdit(marca))}
                        className={`w-full text-left px-4 py-3 text-sm text-gray-700 hover:${colorClasses.bgLight} hover:${colorClasses.textLight} flex items-center space-x-3 transition-colors font-medium`}
                      >
                        <Edit className="w-5 h-5" />
                        <span>Editar Marca</span>
                      </button>
                    )}
                    
                    {/* Importar Excel */}
                    {hasPermission('create') && onImportExcel && (
                      <button
                        onClick={(e) => handleActionClick(e, () => onImportExcel(marca.id))}
                        className={`w-full text-left px-4 py-3 text-sm text-gray-700 hover:${colorClasses.bgLight} hover:${colorClasses.textLight} flex items-center space-x-3 transition-colors font-medium`}
                      >
                        <FileSpreadsheet className="w-5 h-5" />
                        <span>Importar Excel</span>
                      </button>
                    )}
                    
                    {/* Exportar catálogo */}
                    {onExportCatalog && (
                      <button
                        onClick={(e) => handleActionClick(e, () => onExportCatalog(marca.id))}
                        className={`w-full text-left px-4 py-3 text-sm text-gray-700 hover:${colorClasses.bgLight} hover:${colorClasses.textLight} flex items-center space-x-3 transition-colors font-medium`}
                      >
                        <Download className="w-5 h-5" />
                        <span>Exportar Catálogo</span>
                      </button>
                    )}

                    {/* Configurar formatos */}
                    {hasPermission('admin') && onConfigureFormats && (
                      <button
                        onClick={(e) => handleActionClick(e, () => onConfigureFormats(marca.id))}
                        className={`w-full text-left px-4 py-3 text-sm text-gray-700 hover:${colorClasses.bgLight} hover:${colorClasses.textLight} flex items-center space-x-3 transition-colors font-medium border-t border-gray-100`}
                      >
                        <Settings className="w-5 h-5" />
                        <span>Configurar Formatos</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Contenido de la marca - ÁREA PRINCIPAL DE CLICK */}
      <div 
        className="absolute bottom-0 left-0 right-0 p-6 text-white"
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className={`text-2xl font-bold mb-2 group-hover:${colorClasses.textLight} transition-colors`}>
              {marca.nombre}
            </h3>
            <p className="text-sm text-gray-200 font-medium">
              Click para explorar catálogo
            </p>
          </div>
          
          {/* Indicador de selección */}
          {isSelected && (
            <div className="ml-4">
              <div className={`w-10 h-10 ${colorClasses.bg} rounded-xl flex items-center justify-center shadow-lg`}>
                <Building2 className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay de hover con color de marca */}
      <div className={`absolute inset-0 ${colorClasses.bg} bg-opacity-0 group-hover:bg-opacity-15 transition-all duration-300 pointer-events-none`} />
    </div>
  );
};