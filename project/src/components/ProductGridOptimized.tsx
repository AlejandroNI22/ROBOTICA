import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Pieza, Marca } from '../types';
import { ProductCard } from './ProductCard';
import { ProductModal } from './ProductModal';
import { ImportExcelModal } from './ImportExcelModal';
import { DeleteModal } from './modals/DeleteModal';
import { Plus, Filter, X, ChevronLeft, ChevronRight, Package, Upload, Download, RefreshCw, CheckSquare, Square, Trash2 } from 'lucide-react';
import { departamentos } from '../data/departamentos';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../hooks/useSupabase';
import { parseExcelFile } from '../utils/excelParser';

interface ProductGridOptimizedProps {
  marcaSeleccionada: string | null;
  marcas: Marca[];
  searchTerm: string;
  onEdit: (pieza: Pieza) => void;
  onDelete: (pieza: Pieza) => void;
  onNuevaPieza: () => void;
}

export const ProductGridOptimized: React.FC<ProductGridOptimizedProps> = ({
  marcaSeleccionada,
  marcas,
  searchTerm,
  onEdit,
  onDelete,
  onNuevaPieza,
}) => {
  const { hasPermission } = useAuth();
  const { getPiezasPaginated, getPiezaDetails, createPieza, deletePieza } = useSupabase();
  
  // Estados para datos
  const [piezas, setPiezas] = useState<Pieza[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para filtros
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para paginación - 4 productos por página
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  
  // Estado para modal de producto
  const [selectedProduct, setSelectedProduct] = useState<Pieza | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Estados para importación
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'new' | 'update'>('new');

  // Estados para selección múltiple
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const marca = marcaSeleccionada 
    ? marcas.find(m => m.id === marcaSeleccionada)
    : null;

  // Obtener departamentos disponibles para la marca
  const departamentosDisponibles = useMemo(() => {
    if (!marca) return [];
    return departamentos.filter(d => marca.departamentos.includes(d.id));
  }, [marca]);

  // Función para cargar productos con filtros
  const loadProducts = useCallback(async (page: number = 1, resetData: boolean = true) => {
    if (!marca) return;

    setIsLoading(true);
    
    try {
      const filters = {
        marca: marca.nombre,
        departamento: selectedDepartamento || undefined,
        search: searchTerm.trim() || undefined,
        precioMin: priceRange.min ? parseFloat(priceRange.min) : undefined,
        precioMax: priceRange.max ? parseFloat(priceRange.max) : undefined,
      };

      const result = await getPiezasPaginated(page, itemsPerPage, filters);
      
      setPiezas(result.data);
      setTotalCount(result.totalCount);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Error cargando productos:', error);
      setPiezas([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [marca, selectedDepartamento, searchTerm, priceRange, itemsPerPage, getPiezasPaginated]);

  // Cargar productos cuando cambia la marca o filtros
  useEffect(() => {
    if (marca) {
      setCurrentPage(1);
      setSelectedItems(new Set()); // Limpiar selección al cambiar filtros
      loadProducts(1, true);
    } else {
      setPiezas([]);
      setTotalCount(0);
      setSelectedItems(new Set());
    }
  }, [marca, selectedDepartamento, priceRange, searchTerm]);

  // Escuchar eventos de recarga forzada
  useEffect(() => {
    const handleForceReload = () => {
      if (marca) {
        setSelectedItems(new Set()); // Limpiar selección al recargar
        loadProducts(currentPage, true);
      }
    };

    window.addEventListener('force_products_reload', handleForceReload);
    return () => {
      window.removeEventListener('force_products_reload', handleForceReload);
    };
  }, [marca, currentPage, loadProducts]);

  // Funciones de paginación
  const goToPage = (page: number) => {
    if (page !== currentPage && !isLoading) {
      setSelectedItems(new Set()); // Limpiar selección al cambiar página
      loadProducts(page, true);
    }
  };

  // Funciones de selección múltiple
  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === piezas.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(piezas.map(p => p.id)));
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Función para eliminar productos seleccionados
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      setIsLoading(true);
      
      // Eliminar cada producto seleccionado
      for (const productId of selectedItems) {
        await deletePieza(productId);
      }
      
      // Limpiar selección y recargar
      setSelectedItems(new Set());
      setShowBulkDeleteModal(false);
      
      // Recargar productos
      await loadProducts(currentPage, true);
      
      alert(`Se eliminaron ${selectedItems.size} productos exitosamente`);
    } catch (error) {
      console.error('Error eliminando productos:', error);
      alert('Error al eliminar algunos productos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = async (pieza: Pieza) => {
    try {
      // Cargar detalles completos del producto
      const piezaCompleta = await getPiezaDetails(pieza.id);
      if (piezaCompleta) {
        setSelectedProduct(piezaCompleta);
      } else {
        setSelectedProduct(pieza);
      }
      setShowProductModal(true);
    } catch (error) {
      console.error('Error cargando detalles del producto:', error);
      setSelectedProduct(pieza);
      setShowProductModal(true);
    }
  };

  // Handler para importar Excel
  const handleImportExcel = async (file: File, targetMarca?: string, targetDepartamento?: string) => {
    try {
      if (!marca) {
        alert('Error: No hay marca seleccionada');
        return;
      }

      const result = await parseExcelFile(file, marca.nombre, targetDepartamento);
      
      if (result.success && result.data) {
        if (importMode === 'update') {
          // Modo actualización - por ahora simplificamos y agregamos como nuevos
          for (const pieza of result.data) {
            await createPieza(pieza);
          }
          
          const mensaje = `¡Actualización exitosa! Se procesaron ${result.data.length} productos`;
          alert(mensaje);
        } else {
          // Modo normal: agregar todos como productos nuevos
          for (const pieza of result.data) {
            await createPieza(pieza);
          }
          
          const mensaje = `¡Importación exitosa! Se agregaron ${result.data.length} productos a ${marca.nombre}`;
          alert(mensaje);
        }
        
        if (result.warnings && result.warnings.length > 0) {
          console.warn('Advertencias durante la importación:', result.warnings);
        }
        
        setShowImportModal(false);
        // Recargar productos
        loadProducts(1, true);
      } else {
        const errores = result.errors?.join('\n') || 'Error desconocido durante la importación';
        alert(`Error en la importación:\n\n${errores}`);
      }
    } catch (error) {
      console.error('Error durante la importación:', error);
      alert(`Error inesperado durante la importación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleImportarNuevo = () => {
    setImportMode('new');
    setShowImportModal(true);
  };

  const handleActualizarCatalogo = () => {
    setImportMode('update');
    setShowImportModal(true);
  };

  // Función para exportar catálogo
  const handleExportarCatalogo = () => {
    if (!marca || totalCount === 0) {
      alert('No hay productos para exportar en esta marca');
      return;
    }

    // Crear datos CSV básicos
    const headers = ['Total de productos', 'Marca', 'Filtros aplicados'];
    const filterInfo = [
      totalCount.toString(),
      marca.nombre,
      `Departamento: ${selectedDepartamento || 'Todos'}, Búsqueda: ${searchTerm || 'Ninguna'}`
    ];

    const csvContent = [headers, filterInfo]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogo_${marca.nombre.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    alert(`¡Catálogo exportado! Total de productos: ${totalCount}`);
  };

  const clearFilters = () => {
    setSelectedDepartamento('');
    setPriceRange({ min: '', max: '' });
  };

  const hasActiveFilters = selectedDepartamento || priceRange.min || priceRange.max;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const isAllSelected = selectedItems.size > 0 && selectedItems.size === piezas.length;
  const isPartiallySelected = selectedItems.size > 0 && selectedItems.size < piezas.length;

  // Estado inicial: No hay marca seleccionada
  if (!marcaSeleccionada) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Selecciona una marca
          </h3>
          <p className="text-gray-600 text-lg">
            Elige una marca para ver su catálogo completo de productos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header de la marca seleccionada */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {marca?.nombre.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{marca?.nombre}</h2>
              <p className="text-gray-600">
                {isLoading ? 'Cargando...' : `${totalCount.toLocaleString()} productos disponibles`}
              </p>
            </div>
          </div>
          
          {/* Botones de acción rediseñados con colores corporativos Ceramicasa */}
          <div className="flex items-center space-x-2">
            {/* Botón Importar Excel - Gris elegante */}
            {hasPermission('create') && (
              <button
                onClick={handleImportarNuevo}
                className="group relative overflow-hidden bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Importar Excel</span>
                </div>
              </button>
            )}
            
            {/* Botón Actualizar - Rojo degradado corporativo */}
            {hasPermission('create') && (
              <button
                onClick={handleActualizarCatalogo}
                className="group relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm">Actualizar</span>
                </div>
              </button>
            )}
            
            {/* Botón Exportar - Gris claro */}
            <button
              onClick={handleExportarCatalogo}
              disabled={totalCount === 0}
              className="group relative overflow-hidden bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span className="text-sm">Exportar</span>
              </div>
            </button>
            
            {/* Botón Filtros - Dinámico según estado */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`group relative overflow-hidden px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${
                showFilters || hasActiveFilters
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                  : 'bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filtros</span>
                {hasActiveFilters && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                )}
              </div>
            </button>
            
            {/* Botón Nuevo Producto - Rojo corporativo principal */}
            {hasPermission('create') && (
              <button
                onClick={onNuevaPieza}
                className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Nuevo Producto</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Barra de selección múltiple */}
        {piezas.length > 0 && hasPermission('delete') && (
          <div className="mb-4 flex items-center justify-between bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              {/* Checkbox para seleccionar todo */}
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-5 h-5 text-red-600" />
                ) : isPartiallySelected ? (
                  <div className="w-5 h-5 border-2 border-red-600 rounded bg-red-100 flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-600 rounded-sm"></div>
                  </div>
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-sm font-medium">
                  {selectedItems.size > 0 
                    ? `${selectedItems.size} seleccionado(s)`
                    : 'Seleccionar todos'
                  }
                </span>
              </button>

              {/* Acciones para productos seleccionados */}
              {selectedItems.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar seleccionados
                  </button>
                  
                  <button
                    onClick={clearSelection}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Información de selección */}
            <div className="text-sm text-gray-600">
              {selectedItems.size > 0 && (
                <span>
                  {selectedItems.size} de {piezas.length} productos seleccionados en esta página
                </span>
              )}
            </div>
          </div>
        )}

        {/* Panel de filtros */}
        {showFilters && (
          <div className="mt-4 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Filtro por departamento */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Departamento
                </label>
                <select
                  value={selectedDepartamento}
                  onChange={(e) => setSelectedDepartamento(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
                >
                  <option value="">Todos los departamentos</option>
                  {departamentosDisponibles.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por precio mínimo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Precio mínimo
                </label>
                <input
                  type="number"
                  placeholder="$0.00"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
                />
              </div>

              {/* Filtro por precio máximo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Precio máximo
                </label>
                <input
                  type="number"
                  placeholder="$999.00"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
                />
              </div>
            </div>

            {/* Botones de acción de filtros */}
            {hasActiveFilters && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 text-sm text-red-600 hover:text-red-700 font-semibold transition-colors hover:bg-red-50 rounded-lg"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid de productos */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando productos...</p>
            </div>
          </div>
        ) : piezas.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || hasActiveFilters 
                  ? 'No se encontraron productos'
                  : 'No hay productos registrados'
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || hasActiveFilters
                  ? 'Intenta ajustar los filtros o términos de búsqueda'
                  : `${marca?.nombre} no tiene productos registrados`
                }
              </p>
              {!searchTerm && !hasActiveFilters && hasPermission('create') && (
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onNuevaPieza}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Agregar primer producto
                  </button>
                  <button
                    onClick={handleImportarNuevo}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Importar desde Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Grid de productos - 4 por página */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {piezas.map((pieza) => (
                <ProductCard
                  key={pieza.id}
                  pieza={pieza}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onClick={() => handleProductClick(pieza)}
                  isSelected={selectedItems.has(pieza.id)}
                  onSelect={handleSelectItem}
                  showSelection={hasPermission('delete')}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Números de página */}
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        disabled={isLoading}
                        className={`px-3 py-2 border rounded-lg transition-colors disabled:opacity-50 ${
                          currentPage === pageNumber
                            ? 'bg-red-600 text-white border-red-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Información de página */}
                <div className="ml-4 text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de producto */}
      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={selectedProduct}
      />

      {/* Modal de importación */}
      {hasPermission('create') && (
        <ImportExcelModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportExcel}
          marcas={marcas}
          marcaPreseleccionada={marcaSeleccionada || undefined}
          mode={importMode}
        />
      )}

      {/* Modal de confirmación para eliminación masiva */}
      {hasPermission('delete') && (
        <DeleteModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={handleBulkDelete}
          title="Eliminar Productos Seleccionados"
          message={`¿Estás seguro de que quieres eliminar ${selectedItems.size} producto(s)? Esta acción no se puede deshacer.`}
          itemName={`${selectedItems.size} productos`}
        />
      )}
    </div>
  );
};