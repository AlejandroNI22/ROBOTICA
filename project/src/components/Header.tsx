import React, { useState } from 'react';
import { Search, Scan, Plus, User, Package, Users, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.jpg'; // Ruta relativa corregida

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onScanCode: () => void;
  onNewMarca: () => void;
  onViewChange: (view: 'catalog' | 'users') => void;
  currentView: 'catalog' | 'users';
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  onSearchChange,
  onScanCode,
  onNewMarca,
  onViewChange,
  currentView
}) => {
  const { user, logout, hasPermission } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [imageError, setImageError] = useState(false); // Estado para manejar el error de imagen

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white shadow-lg border-b-4 border-red-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Ceramicasa */}
          <div className="flex items-center">
            <div className="h-16 w-auto flex items-center">
              {!imageError ? (
                <img 
                  src={logo}
                  alt="Ceramicasa - Sistema de Catálogo"
                  className="h-full w-auto object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="h-16 w-48 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl font-black tracking-wider">CERAMICASA</div>
                    <div className="text-xs font-medium opacity-90 tracking-wide">SISTEMA DE CATÁLOGO</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buscador central */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar productos, códigos, marcas..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg shadow-sm"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  onClick={onScanCode}
                  className="h-full px-3 text-gray-400 hover:text-red-600 focus:outline-none focus:text-red-600 transition-colors"
                  title="Escanear código de barras"
                >
                  <Scan className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Botones de acción y menú usuario */}
          <div className="flex items-center space-x-4">
            {/* Botón Nueva Marca */}
            {hasPermission('create') && (
              <button
                onClick={onNewMarca}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Marca
              </button>
            )}

            {/* Menú de usuario */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 p-3 hover:bg-gray-50 transition-colors shadow-sm border border-gray-200"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold shadow-md">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                  <div className="text-xs text-red-600 font-medium">{user?.role}</div>
                </div>
              </button>

              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-20 border border-gray-100">
                    <div className="py-2">
                      {/* Información del usuario */}
                      <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-red-100">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold shadow-md">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                            <div className="text-xs text-gray-600">@{user?.username}</div>
                            <div className="text-xs text-red-600 font-medium">{user?.role}</div>
                          </div>
                        </div>
                      </div>

                      {/* Navegación */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            onViewChange('catalog');
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm flex items-center space-x-3 hover:bg-red-50 transition-colors ${
                            currentView === 'catalog' ? 'bg-red-50 text-red-700 border-r-2 border-red-600' : 'text-gray-700'
                          }`}
                        >
                          <Package className="h-5 w-5" />
                          <span className="font-medium">Catálogo de Productos</span>
                        </button>

                        {hasPermission('admin') && (
                          <button
                            onClick={() => {
                              onViewChange('users');
                              setShowUserMenu(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center space-x-3 hover:bg-red-50 transition-colors ${
                              currentView === 'users' ? 'bg-red-50 text-red-700 border-r-2 border-red-600' : 'text-gray-700'
                            }`}
                          >
                            <Users className="h-5 w-5" />
                            <span className="font-medium">Gestión de Usuarios</span>
                          </button>
                        )}
                      </div>

                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors font-medium"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
