import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Pieza, Marca } from '../types';
import { ProductCard } from './ProductCard';
import { Plus, Building2, Search, Filter, X, Barcode, FileSpreadsheet, Download, CheckSquare, Square, Trash2, ArrowRight, MoreHorizontal, RefreshCw, Loader2 } from 'lucide-react';
import { departamentos } from '../data/departamentos';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../hooks/useSupabase';

interface ProductGridProps {
  marcaSeleccionada: string | null;
  marcas: Marca[];
  onEdit: (pieza: Pieza) => void;
  onDelete: (pieza: Pieza) => void;
  onNuevaPieza: () => void;
  onImportarExcel: () => void;
  onBulkDelete: (piezaIds: string[]) => void;
  onBulkMove: (piezaIds: string[], targetMarca: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  marcaSeleccionada,
  marcas,
  onEdit,
  onDelete,
  onNuevaPieza,
  onImportarExcel,
  onBulkDelete,
  onBulkMove,
}) => {
  const { hasPermission } = useAuth();
  const { getPiezasPaginated, searchProductByCode } = useSupabase();
  
  // Estados para datos
  const [piezas, setPiezas] = useState<Pieza[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para paginación - REDUCIDO A 10 PRODUCTOS
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Cambiado de 20 a 10 productos por página
  
  // Estados para selección múltiple
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetMarca, setTargetMarca] = useState('');

  // Debounce para búsqueda
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

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

      console.log(`🔍 Cargando productos - Página: ${page}, Filtros:`, filters);

      const result = await getPiezasPaginated(page, itemsPerPage, filters);
      
      if (resetData) {
        setPiezas(result.data);
      } else {
        setPiezas(prev => [...prev, ...result.data]);
      }
      
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      setCurrentPage(page);
      
      console.log(`✅ Productos cargados: ${result.data.length} de ${result.totalCount} totales`);
      
    } catch (error) {
      console.error('Error cargando productos:', error);
      setPiezas([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [marca, selectedDepartamento, searchTerm, priceRange, itemsPerPage, getPiezasPaginated]);

  // Cargar productos cuando cambia la marca o filtros
  useEffect(() => {
    if (marca) {
      setCurrentPage(1);
      setSelectedItems(new Set());
      loadProducts(1, true);
    } else {
      setPiezas([]);
      setTotalCount(0);
      setHasMore(false);
    }
  }, [marca, selectedDepartamento, priceRange]);

  // Debounce para búsqueda por texto
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timeout = setTimeout(() => {
      if (marca) {
        setCurrentPage(1);
        setSelectedItems(new Set());
        loadProducts(1, true);
      }
    }, 300); // 300ms de debounce

    setSearchDebounce(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchTerm]);

  // Búsqueda rápida por código de barras
  const handleQuickSearch = async (code: string) => {
    if (!code.trim()) return;
    
    try {
      const product = await searchProductByCode(code.trim());
      if (product) {
        // Si encuentra el producto, mostrarlo
        setPiezas([product]);
        setTotalCount(1);
        setHasMore(false);
        setCurrentPage(1);
      } else {
        // Si no encuentra, hacer búsqueda normal
        setSearchTerm(code);
      }
    } catch (error) {
      console.error('Error en búsqueda rápida:', error);
      setSearchTerm(code);
    }
  };

  // Detectar si es un código de barras (solo números)
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    // Si parece un código de barras (solo números, más de 8 dígitos)
    if (/^\d{8,}$/.test(value.trim())) {
      handleQuickSearch(value);
    }
  };

  // Funciones de paginación
  const loadNextPage = () => {
    if (hasMore && !isLoading) {
      loadProducts(currentPage + 1, false);
    }
  };

  const goToPage = (page: number) => {
    if (page !== currentPage && !isLoading) {
      setSelectedItems(new Set());
      loadProducts(page, true);
    }
  };

  // Funciones de selección
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
    setShowBulkActions(false);
  };

  // Funciones de acciones masivas
  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;
    
    const confirmMessage = `¿Estás seguro de que quieres eliminar ${selectedItems.size} producto(s)? Esta acción no se puede deshacer.`;
    
    if (window.confirm(confirmMessage)) {
      onBulkDelete(Array.from(selectedItems));
      clearSelection();
      // Recargar página actual
      loadProducts(currentPage, true);
    }
  };

  const handleBulkMove = () => {
    if (selectedItems.size === 0 || !targetMarca) return;
    
    const targetMarcaName = marcas.find(m => m.id === targetMarca)?.nombre;
    const confirmMessage = `¿Mover ${selectedItems.size} producto(s) a ${targetMarcaName}?`;
    
    if (window.confirm(confirmMessage)) {
      onBulkMove(Array.from(selectedItems), targetMarcaName || '');
      clearSelection();
      setShowMoveModal(false);
      setTargetMarca('');
      // Recargar página actual
      loadProducts(currentPage, true);
    }
  };

  // Función para exportar productos
  const handleExportarProductos = () => {
    if (totalCount === 0) {
      alert('No hay productos para exportar en esta marca');
      return;
    }

    // Crear datos CSV básicos (sin cargar todos los productos)
    const headers = ['Total de productos', 'Marca', 'Filtros aplicados'];
    const filterInfo = [
      totalCount.toString(),
      marca?.nombre || '',
      `Departamento: ${selectedDepartamento || 'Todos'}, Búsqueda: ${searchTerm || 'Ninguna'}`
    ];

    const csvContent = [headers, filterInfo]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumen_productos_${marca?.nombre.toLowerCase().replace(/\s+/g, '_') || 'marca'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    alert(`¡Resumen exportado! Total de productos: ${totalCount}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartamento('');
    setPriceRange({ min: '', max: '' });
  };

  const hasActiveFilters = selectedDepartamento || priceRange.min || priceRange.max || searchTerm;
  const isAllSelected = selectedItems.size > 0 && selectedItems.size === piezas.length;
  const isPartiallySelected = selectedItems.size > 0 && selectedItems.size < piezas.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Estado inicial: No hay marca seleccionada
  if (!marcaSeleccionada) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecciona una marca o proveedor
          </h3>
          <p className="text-gray-600">
            Elige una marca del menú lateral para ver su catálogo completo de productos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header con búsqueda */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
              {marca?.nombre.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{marca?.nombre}</h2>
              <p className="text-gray-600">
                {isLoading ? 'Cargando...' : `${totalCount.toLocaleString()} productos en total`}
                <span className="text-sm text-blue-600 ml-2">
                  (mostrando {itemsPerPage} por página)
                </span>
              </p>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex gap-2">
            {hasPermission('create') && (
              <>
                <button
                  onClick={onImportarExcel}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Importar Excel
                </button>
                <button
                  onClick={onImportarExcel}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualizar Catálogo
                </button>
              </>
            )}
            
            <button
              onClick={handleExportarProductos}
              disabled={totalCount === 0}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Exportar Resumen
            </button>
            
            {hasPermission('create') && (
              <button
                onClick={onNuevaPieza}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nuevo Producto
              </button>
            )}
          </div>
        </div>

        {/* Barra de búsqueda optimizada */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, código de barras o clave... (escanea códigos directamente)"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por departamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento
                </label>
                <select
                  value={selectedDepartamento}
                  onChange={(e) => setSelectedDepartamento(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  {departamentosDisponibles.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por precio mínimo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio mínimo
                </label>
                <input
                  type="number"
                  placeholder="$0.00"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filtro por precio máximo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio máximo
                </label>
                <input
                  type="number"
                  placeholder="$999.00"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Botones de acción */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* Barra de selección y acciones masivas */}
        {piezas.length > 0 && hasPermission('edit') && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Checkbox para seleccionar todo */}
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : isPartiallySelected ? (
                  <div className="w-5 h-5 border-2 border-blue-600 rounded bg-blue-100 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>
                  </div>
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-sm font-medium">
                  {selectedItems.size > 0 
                    ? `${selectedItems.size} seleccionado(s) en esta página`
                    : 'Seleccionar página'
                  }
                </span>
              </button>

              {/* Acciones masivas */}
              {selectedItems.size > 0 && (
                <div className="flex items-center gap-2">
                  {hasPermission('edit') && (
                    <button
                      onClick={() => setShowMoveModal(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Mover a otra marca
                    </button>
                  )}
                  
                  {hasPermission('delete') && (
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar seleccionados
                    </button>
                  )}
                  
                  <button
                    onClick={clearSelection}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Resultados y paginación */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div>
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount.toLocaleString()} productos
                {searchTerm && (
                  <span className="ml-2">
                    para "<span className="font-medium text-gray-900">{searchTerm}</span>"
                  </span>
                )}
              </div>
              
              {/* Indicador de escáner */}
              <div className="flex items-center gap-2 text-blue-600">
                <Barcode className="w-4 h-4" />
                <span className="text-xs">Listo para escanear códigos</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid de productos */}
      <div className="flex-1 p-6 bg-gray-50">
        {isLoading && piezas.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando productos...</p>
            </div>
          </div>
        ) : piezas.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                {searchTerm || hasActiveFilters ? (
                  <Search className="w-8 h-8 text-gray-400" />
                ) : (
                  <Building2 className="w-8 h-8 text-gray-400" />
                )}
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
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Agregar primer producto
                  </button>
                  <button
                    onClick={onImportarExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Importar desde Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Grid de productos - Optimizado para 10 productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
              {piezas.map((pieza) => (
                <ProductCard
                  key={pieza.id}
                  pieza={pieza}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isSelected={selectedItems.has(pieza.id)}
                  onSelect={handleSelectItem}
                  showSelection={hasPermission('edit')}
                />
              ))}
            </div>

            {/* Indicador de carga para más productos */}
            {isLoading && piezas.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-blue-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Cargando más productos...</span>
                </div>
              </div>
            )}

            {/* Paginación optimizada para 10 productos */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                {/* Números de página optimizados */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 7) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 4) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNumber = totalPages - 6 + i;
                    } else {
                      pageNumber = currentPage - 3 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        disabled={isLoading}
                        className={`px-3 py-2 border rounded-lg transition-colors disabled:opacity-50 ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white border-blue-600'
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
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>

                {/* Información de página actual */}
                <div className="ml-4 text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para mover productos */}
      {showMoveModal && hasPermission('edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mover {selectedItems.size} producto(s)
                </h3>
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca de destino
                </label>
                <select
                  value={targetMarca}
                  onChange={(e) => setTargetMarca(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar marca</option>
                  {marcas
                    .filter(m => m.id !== marcaSeleccionada)
                    .map((marca) => (
                      <option key={marca.id} value={marca.id}>
                        {marca.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkMove}
                  disabled={!targetMarca}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Mover productos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};