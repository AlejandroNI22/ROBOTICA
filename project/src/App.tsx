import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Header } from './components/Header';
import { MarcaCard } from './components/MarcaCard';
import { ProductGridOptimized } from './components/ProductGridOptimized';
import { PiezaModal } from './components/modals/PiezaModal';
import { MarcaModal } from './components/modals/MarcaModal';
import { ExcelFormatModal } from './components/modals/ExcelFormatModal';
import { DeleteModal } from './components/modals/DeleteModal';
import { ImportExcelModal } from './components/ImportExcelModal';
import { UserManagement } from './components/auth/UserManagement';
import { SupabaseSetup } from './components/SupabaseSetup';
import { DatabaseMigration } from './components/DatabaseMigration';
import { useSupabase } from './hooks/useSupabase';
import { Pieza, Marca } from './types';
import { parseExcelFile } from './utils/excelParser';
import { Plus } from 'lucide-react';

function AppContent() {
  const {
    isConnected,
    isLoading: supabaseLoading,
    error: supabaseError,
    getMarcas,
    createMarca,
    updateMarca,
    deleteMarca,
    getPiezaDetails,
    createPieza,
    updatePieza,
    deletePieza,
    checkConnection
  } = useSupabase();

  // Estado de la aplicación
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  
  // Estado de la UI
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'catalog' | 'users'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [showPiezaModal, setShowPiezaModal] = useState(false);
  const [showMarcaModal, setShowMarcaModal] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'new' | 'update'>('new');
  const [importMarcaId, setImportMarcaId] = useState<string>('');
  
  // Estado temporal para edición/eliminación
  const [piezaEnEdicion, setPiezaEnEdicion] = useState<Pieza | null>(null);
  const [piezaAEliminar, setPiezaAEliminar] = useState<Pieza | null>(null);
  const [marcaEnEdicion, setMarcaEnEdicion] = useState<Marca | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (isConnected) {
      loadData();
    }
  }, [isConnected]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const handleMarcasUpdate = () => {
      loadMarcas();
    };

    const handlePiezasUpdate = () => {
      // Forzar recarga de productos si hay una marca seleccionada
      if (marcaSeleccionada) {
        // Trigger para que ProductGridOptimized recargue
        window.dispatchEvent(new CustomEvent('force_products_reload'));
      }
    };

    window.addEventListener('marcas_updated', handleMarcasUpdate);
    window.addEventListener('piezas_updated', handlePiezasUpdate);

    return () => {
      window.removeEventListener('marcas_updated', handleMarcasUpdate);
      window.removeEventListener('piezas_updated', handlePiezasUpdate);
    };
  }, [isConnected, marcaSeleccionada]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadingProgress('Iniciando carga de datos...');
      await loadMarcas();
    } catch (error) {
      console.error('Error loading data:', error);
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('relation') && 
            (errorMessage.includes('does not exist') || errorMessage.includes('42p01'))) {
          setNeedsMigration(true);
          return;
        }
      }
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const supabaseError = error as any;
        if (supabaseError.code === '42P01' || supabaseError.code === 'PGRST116') {
          setNeedsMigration(true);
          return;
        }
      }
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
    }
  };

  const loadMarcas = async () => {
    try {
      setLoadingProgress('Cargando marcas...');
      const marcasData = await getMarcas();
      setMarcas(marcasData);
      console.log(`Marcas cargadas: ${marcasData.length}`);
    } catch (error) {
      console.error('Error loading marcas:', error);
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('relation') && 
            (errorMessage.includes('does not exist') || errorMessage.includes('42p01'))) {
          throw error;
        }
      }
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const supabaseError = error as any;
        if (supabaseError.code === '42P01' || supabaseError.code === 'PGRST116') {
          throw error;
        }
      }
      throw error;
    }
  };

  // Handlers para piezas
  const handleNuevaPieza = () => {
    setPiezaEnEdicion(null);
    setShowPiezaModal(true);
  };

  const handleEditarPieza = async (pieza: Pieza) => {
    try {
      const piezaCompleta = await getPiezaDetails(pieza.id);
      if (piezaCompleta) {
        setPiezaEnEdicion(piezaCompleta);
        setShowPiezaModal(true);
      } else {
        setPiezaEnEdicion(pieza);
        setShowPiezaModal(true);
      }
    } catch (error) {
      console.error('Error cargando detalles del producto:', error);
      setPiezaEnEdicion(pieza);
      setShowPiezaModal(true);
    }
  };

  const handleEliminarPieza = (pieza: Pieza) => {
    setPiezaAEliminar(pieza);
    setShowDeleteModal(true);
  };

  const handleSavePieza = async (piezaData: Omit<Pieza, 'id' | 'fechaCreacion' | 'fechaActualizacion'>) => {
    try {
      if (piezaEnEdicion) {
        await updatePieza(piezaEnEdicion.id, {
          ...piezaEnEdicion,
          ...piezaData,
        });
      } else {
        await createPieza(piezaData);
      }
      setShowPiezaModal(false);
      setPiezaEnEdicion(null);
      // Los datos se actualizarán automáticamente por el realtime
    } catch (error) {
      console.error('Error saving pieza:', error);
      alert('Error al guardar el producto');
    }
  };

  const handleConfirmDelete = async () => {
    if (piezaAEliminar) {
      try {
        await deletePieza(piezaAEliminar.id);
        setPiezaAEliminar(null);
        setShowDeleteModal(false);
        // Los datos se actualizarán automáticamente por el realtime
      } catch (error) {
        console.error('Error deleting pieza:', error);
        alert('Error al eliminar el producto');
      }
    }
  };

  // Handlers para marcas
  const handleNuevaMarca = () => {
    setMarcaEnEdicion(null);
    setShowMarcaModal(true);
  };

  const handleEditarMarca = (marca: Marca) => {
    setMarcaEnEdicion(marca);
    setShowMarcaModal(true);
  };

  const handleSaveMarca = async (marcaData: Omit<Marca, 'id' | 'fechaCreacion'>) => {
    try {
      if (marcaEnEdicion) {
        await updateMarca(marcaEnEdicion.id, {
          ...marcaEnEdicion,
          ...marcaData,
        });
      } else {
        await createMarca(marcaData);
      }
      setShowMarcaModal(false);
      setMarcaEnEdicion(null);
      // Los datos se actualizarán automáticamente por el realtime
    } catch (error) {
      console.error('Error saving marca:', error);
      alert('Error al guardar la marca');
    }
  };

  // Handlers para configuración de formatos
  const handleConfigureFormats = (marcaId: string) => {
    setImportMarcaId(marcaId);
    setShowFormatModal(true);
  };

  const handleSaveFormat = (formatData: any) => {
    // Aquí se implementaría la lógica para guardar el formato personalizado
    console.log('Guardando formato:', formatData);
    alert('Formato guardado exitosamente');
  };

  // Handlers para importación por marca
  const handleImportExcelMarca = (marcaId: string) => {
    setImportMarcaId(marcaId);
    setImportMode('new');
    setShowImportModal(true);
  };

  const handleExportCatalogMarca = (marcaId: string) => {
    const marca = marcas.find(m => m.id === marcaId);
    if (!marca) return;

    // Crear datos CSV básicos
    const headers = ['Marca', 'Fecha de exportación'];
    const info = [marca.nombre, new Date().toLocaleDateString('es-MX')];

    const csvContent = [headers, info]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogo_${marca.nombre.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    alert(`¡Catálogo de ${marca.nombre} exportado exitosamente!`);
  };

  // Handler para importar Excel desde modal
  const handleImportExcel = async (file: File, targetMarca?: string, targetDepartamento?: string) => {
    try {
      const marcaTarget = importMarcaId ? marcas.find(m => m.id === importMarcaId) : null;
      if (!marcaTarget && !targetMarca) {
        alert('Error: No se pudo determinar la marca de destino');
        return;
      }

      const marcaNombre = marcaTarget?.nombre || targetMarca;
      if (!marcaNombre) {
        alert('Error: Marca no encontrada');
        return;
      }

      const result = await parseExcelFile(file, marcaNombre, targetDepartamento);
      
      if (result.success && result.data) {
        if (importMode === 'update') {
          // Modo actualización
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
          
          const mensaje = `¡Importación exitosa! Se agregaron ${result.data.length} productos a ${marcaNombre}`;
          alert(mensaje);
        }
        
        if (result.warnings && result.warnings.length > 0) {
          console.warn('Advertencias durante la importación:', result.warnings);
        }
        
        setShowImportModal(false);
        setImportMarcaId('');
        // Los datos se actualizarán automáticamente por el realtime
      } else {
        const errores = result.errors?.join('\n') || 'Error desconocido durante la importación';
        alert(`Error en la importación:\n\n${errores}`);
      }
    } catch (error) {
      console.error('Error durante la importación:', error);
      alert(`Error inesperado durante la importación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Handler para escaneo de código
  const handleScanCode = () => {
    const code = prompt('Ingresa el código de barras o clave del producto:');
    if (code) {
      setSearchTerm(code);
    }
  };

  // Obtener marca seleccionada
  const marcaActual = marcaSeleccionada 
    ? marcas.find(m => m.id === marcaSeleccionada)
    : null;

  // Mostrar pantalla de configuración si no está conectado
  if (supabaseLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando con Supabase...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <SupabaseSetup 
        onComplete={(url, key) => {
          window.location.reload();
        }} 
      />
    );
  }

  if (needsMigration) {
    return (
      <DatabaseMigration 
        onComplete={() => {
          setNeedsMigration(false);
          checkConnection();
          loadData();
        }} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Cargando datos...</p>
          {loadingProgress && (
            <div className="bg-white rounded-lg shadow-sm border p-4 max-w-md">
              <p className="text-sm text-gray-700">{loadingProgress}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onScanCode={handleScanCode}
        onNewMarca={handleNuevaMarca}
        onViewChange={setCurrentView}
        currentView={currentView}
      />

      {/* Contenido principal */}
      {currentView === 'catalog' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!marcaSeleccionada ? (
            // Vista de marcas
            <div>
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">Catálogo de Productos</h1>
                <p className="text-gray-600 text-xl">Selecciona una marca para explorar su catálogo completo</p>
              </div>
              
              {marcas.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Plus className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    No hay marcas registradas
                  </h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    Comienza creando tu primera marca para organizar tu catálogo
                  </p>
                  <button
                    onClick={handleNuevaMarca}
                    className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-lg"
                  >
                    Crear primera marca
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {marcas.map((marca) => (
                    <MarcaCard
                      key={marca.id}
                      marca={marca}
                      onSelect={setMarcaSeleccionada}
                      onEdit={handleEditarMarca}
                      onImportExcel={handleImportExcelMarca}
                      onExportCatalog={handleExportCatalogMarca}
                      onConfigureFormats={handleConfigureFormats}
                      isSelected={marcaSeleccionada === marca.id}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Vista de productos
            <div>
              {/* Breadcrumb */}
              <div className="mb-6">
                <button
                  onClick={() => setMarcaSeleccionada(null)}
                  className="text-red-600 hover:text-red-700 font-semibold text-lg"
                >
                  ← Volver a marcas
                </button>
              </div>
              
              <ProductGridOptimized
                marcaSeleccionada={marcaSeleccionada}
                marcas={marcas}
                searchTerm={searchTerm}
                onEdit={handleEditarPieza}
                onDelete={handleEliminarPieza}
                onNuevaPieza={handleNuevaPieza}
              />
            </div>
          )}
        </div>
      ) : (
        // Vista de usuarios
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProtectedRoute requiredPermission="admin">
            <UserManagement />
          </ProtectedRoute>
        </div>
      )}

      {/* Modales */}
      <ProtectedRoute requiredPermission="create">
        <PiezaModal
          isOpen={showPiezaModal}
          onClose={() => {
            setShowPiezaModal(false);
            setPiezaEnEdicion(null);
          }}
          onSave={handleSavePieza}
          marcas={marcas}
          pieza={piezaEnEdicion}
          marcaPreseleccionada={marcaActual?.nombre}
        />
      </ProtectedRoute>

      <ProtectedRoute requiredPermission="create">
        <MarcaModal
          isOpen={showMarcaModal}
          onClose={() => {
            setShowMarcaModal(false);
            setMarcaEnEdicion(null);
          }}
          onSave={handleSaveMarca}
          marca={marcaEnEdicion}
        />
      </ProtectedRoute>

      <ProtectedRoute requiredPermission="admin">
        <ExcelFormatModal
          isOpen={showFormatModal}
          onClose={() => {
            setShowFormatModal(false);
            setImportMarcaId('');
          }}
          onSave={handleSaveFormat}
          marcas={marcas}
        />
      </ProtectedRoute>

      <ProtectedRoute requiredPermission="delete">
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setPiezaAEliminar(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Eliminar Producto"
          message="Esta acción no se puede deshacer."
          itemName={piezaAEliminar?.nombre || ''}
        />
      </ProtectedRoute>

      {/* Modal de importación desde marcas */}
      <ProtectedRoute requiredPermission="create">
        <ImportExcelModal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setImportMarcaId('');
          }}
          onImport={handleImportExcel}
          marcas={marcas}
          marcaPreseleccionada={importMarcaId || undefined}
          mode={importMode}
          onConfigureFormats={() => setShowFormatModal(true)}
        />
      </ProtectedRoute>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;