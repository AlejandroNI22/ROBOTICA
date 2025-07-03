import React from 'react';
import { Plus, Settings, FileSpreadsheet, Users, Package } from 'lucide-react';
import { Marca } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from './UserProfile';

interface SidebarProps {
  marcas: Marca[];
  marcaSeleccionada: string | null;
  onMarcaSeleccionada: (marcaId: string | null) => void;
  onNuevaMarca: () => void;
  onImportarExcel: () => void;
  currentView: 'catalog' | 'users';
  onViewChange: (view: 'catalog' | 'users') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  marcas,
  marcaSeleccionada,
  onMarcaSeleccionada,
  onNuevaMarca,
  onImportarExcel,
  currentView,
  onViewChange,
}) => {
  const { hasPermission } = useAuth();

  const handleMarcaClick = (marcaId: string) => {
    onMarcaSeleccionada(marcaSeleccionada === marcaId ? null : marcaId);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Catálogo de Productos</h1>
        <p className="text-sm text-gray-600">Gestión por marcas y proveedores</p>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => onViewChange('catalog')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'catalog'
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="w-4 h-4" />
            Catálogo
          </button>
          
          {hasPermission('admin') && (
            <button
              onClick={() => onViewChange('users')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'users'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Usuarios
            </button>
          )}
        </div>
      </div>

      {/* Acciones principales - Solo mostrar en vista de catálogo */}
      {currentView === 'catalog' && (
        <div className="p-4 border-b border-gray-200 space-y-2">
          {hasPermission('create') && (
            <button
              onClick={onImportarExcel}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Importar desde Excel
            </button>
          )}
          
          {hasPermission('create') && (
            <button
              onClick={onNuevaMarca}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nueva Marca
            </button>
          )}
        </div>
      )}

      {/* Lista de marcas - Solo mostrar en vista de catálogo */}
      {currentView === 'catalog' && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              Marcas y Proveedores
            </h3>
            
            {marcas.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  No hay marcas registradas
                </p>
                {hasPermission('create') && (
                  <button
                    onClick={onNuevaMarca}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Crear primera marca
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {marcas.map((marca) => (
                  <button
                    key={marca.id}
                    onClick={() => handleMarcaClick(marca.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left text-sm font-medium rounded-lg transition-colors ${
                      marcaSeleccionada === marca.id
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                      {marca.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{marca.nombre}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <UserProfile />
      </div>
    </div>
  );
};