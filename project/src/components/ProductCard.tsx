import React from 'react';
import { Edit, Trash2, Barcode, Key, CheckSquare, Square, Ruler, Calculator } from 'lucide-react';
import { Pieza } from '../types';
import { LazyImage } from './LazyImage';
import { departamentos } from '../data/departamentos';
import { useAuth } from '../contexts/AuthContext';

interface ProductCardProps {
  pieza: Pieza;
  onEdit: (pieza: Pieza) => void;
  onDelete: (pieza: Pieza) => void;
  onClick?: (pieza: Pieza) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  showSelection?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  pieza,
  onEdit,
  onDelete,
  onClick,
  isSelected = false,
  onSelect,
  showSelection = false,
}) => {
  const { hasPermission } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);
  };

  const departamento = departamentos.find(d => d.id === pieza.departamento);

  const handleCardClick = (e: React.MouseEvent) => {
    // Solo activar selección si se hace click en el área de selección
    if (showSelection && onSelect && (e.target as HTMLElement).closest('.selection-area')) {
      e.preventDefault();
      e.stopPropagation();
      onSelect(pieza.id);
      return;
    }
    
    // Si hay onClick definido, ejecutarlo
    if (onClick) {
      onClick(pieza);
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 group relative cursor-pointer transform hover:-translate-y-1 ${
        isSelected ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200 hover:border-red-300'
      }`}
      onClick={handleCardClick}
    >
      {/* Checkbox de selección */}
      {showSelection && (
        <div className="selection-area absolute top-3 left-3 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.(pieza.id);
            }}
            className="p-1 bg-white bg-opacity-90 rounded-md shadow-sm hover:bg-opacity-100 transition-all"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-red-600" />
            ) : (
              <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>
      )}

      {/* Imagen */}
      <div className="aspect-square relative overflow-hidden">
        <LazyImage
          src={pieza.imagen}
          alt={pieza.nombre}
          className="w-full h-full"
        />
        
        {/* Overlay con acciones - solo visible si hay permisos y no hay selección activa */}
        {!showSelection && hasPermission('edit') && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(pieza);
                }}
                className="p-3 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-colors shadow-lg"
                title="Editar"
              >
                <Edit className="w-5 h-5" />
              </button>
              {hasPermission('delete') && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(pieza);
                  }}
                  className="p-3 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors shadow-lg"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Botones de acción fijos cuando hay selección activa */}
        {showSelection && hasPermission('edit') && (
          <div className="absolute bottom-3 right-3 flex gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(pieza);
              }}
              className="p-2 bg-white bg-opacity-90 text-blue-600 rounded-full hover:bg-opacity-100 transition-all shadow-sm"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>
            {hasPermission('delete') && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(pieza);
                }}
                className="p-2 bg-white bg-opacity-90 text-red-600 rounded-full hover:bg-opacity-100 transition-all shadow-sm"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Badge de departamento */}
        <div className="absolute top-3 right-3">
          <span className="inline-block bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            {departamento?.nombre || pieza.departamento}
          </span>
        </div>
      </div>

      {/* Información del producto */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-red-700 transition-colors">
          {pieza.nombre}
        </h3>
        
        {/* Precio principal */}
        <div className="mb-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-red-600">
              {formatPrice(pieza.precio)}
            </span>
            <span className="text-sm text-gray-500">/ {pieza.unidadVenta}</span>
          </div>
          
          {/* Precio por metro para azulejos */}
          {pieza.precioMetro && pieza.precioMetro > 0 && (
            <div className="mt-1">
              <span className="text-lg font-semibold text-blue-600">
                {formatPrice(pieza.precioMetro)}
              </span>
              <span className="text-sm text-gray-500 ml-1">/ m²</span>
            </div>
          )}
        </div>

        {/* Información técnica compacta */}
        <div className="space-y-2 text-sm">
          {/* Medida para azulejos */}
          {pieza.medida && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Ruler className="w-4 h-4 text-gray-400" />
              <span>{pieza.medida} cm</span>
            </div>
          )}

          {/* Metros por caja para azulejos */}
          {pieza.metrosPorCaja && pieza.metrosPorCaja > 0 && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Calculator className="w-4 h-4 text-purple-500" />
              <span>{pieza.metrosPorCaja} m² por caja</span>
            </div>
          )}

          {/* Códigos - Solo mostrar si tienen valor */}
          {pieza.clave && (
            <div className="flex items-center space-x-2 text-orange-600">
              <Key className="w-4 h-4" />
              <span className="font-mono text-xs">{pieza.clave}</span>
            </div>
          )}

          {pieza.codigoBarras && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Barcode className="w-4 h-4" />
              <span className="font-mono text-xs">{pieza.codigoBarras}</span>
            </div>
          )}
        </div>

        {/* Indicador de click para ver detalles */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center group-hover:text-red-600 transition-colors">
            Click para ver detalles completos
          </p>
        </div>
      </div>
    </div>
  );
};