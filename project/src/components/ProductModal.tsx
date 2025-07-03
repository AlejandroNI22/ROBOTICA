import React from 'react';
import { X, Package, Barcode, Key, Ruler, Calculator, Tag, Building2 } from 'lucide-react';
import { Pieza } from '../types';
import { departamentos } from '../data/departamentos';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Pieza | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  if (!isOpen || !product) return null;

  const departamento = departamentos.find(d => d.id === product.departamento);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);
  };

  const specifications = [
    { label: 'Marca', value: product.marca, icon: Building2 },
    { label: 'Departamento', value: departamento?.nombre || product.departamento, icon: Package },
    { label: 'Unidad de Venta', value: product.unidadVenta, icon: Tag },
    ...(product.medida ? [{ label: 'Medida', value: `${product.medida} cm`, icon: Ruler }] : []),
    ...(product.metrosPorCaja ? [{ label: 'Metros por Caja', value: `${product.metrosPorCaja} m²`, icon: Calculator }] : []),
    ...(product.clave ? [{ label: 'Clave', value: product.clave, icon: Key }] : []),
    ...(product.codigoBarras ? [{ label: 'Código de Barras', value: product.codigoBarras, icon: Barcode }] : []),
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold pr-12">{product.nombre}</h2>
          <p className="text-red-100 mt-1">Ficha Técnica del Producto</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Imagen del producto */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                <img
                  src={product.imagen}
                  alt={product.nombre}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Precios destacados */}
              <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                <h3 className="text-lg font-semibold text-red-800 mb-4">Información de Precios</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Precio por {product.unidadVenta}:</span>
                    <span className="text-2xl font-bold text-red-600">{formatPrice(product.precio)}</span>
                  </div>
                  
                  {product.precioMetro && (
                    <div className="flex justify-between items-center pt-2 border-t border-red-200">
                      <span className="text-gray-700">Precio por Metro²:</span>
                      <span className="text-xl font-semibold text-red-600">{formatPrice(product.precioMetro)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información del producto */}
            <div className="space-y-6">
              {/* Descripción */}
              {product.descripcion && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {product.descripcion}
                  </p>
                </div>
              )}

              {/* Especificaciones técnicas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Especificaciones Técnicas</h3>
                <div className="space-y-3">
                  {specifications.map((spec, index) => {
                    const IconComponent = spec.icon;
                    return (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-shrink-0">
                          <IconComponent className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                          <span className="font-medium text-gray-700">{spec.label}:</span>
                          <span className="text-gray-900 font-semibold">{spec.value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Información Adicional</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Producto registrado el {product.fechaCreacion.toLocaleDateString('es-MX')}</p>
                  <p>• Última actualización: {product.fechaActualizacion.toLocaleDateString('es-MX')}</p>
                  {departamento && (
                    <p>• Categoría: {departamento.nombre}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};