import React, { useState } from 'react';
import { User, LogOut, Shield, Edit, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const UserProfile: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const getRoleIcon = () => {
    switch (user.role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-600" />;
      case 'editor':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-green-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case 'admin':
        return 'Administrador';
      case 'editor':
        return 'Editor';
      case 'viewer':
        return 'Visualizador';
      default:
        return user.role;
    }
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-left flex-1">
          <div className="font-medium">{user.name}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {getRoleIcon()}
            {getRoleLabel()}
          </div>
        </div>
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            {/* Botón de cerrar sesión prominente */}
            <div className="p-2 border-b border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>
            </div>

            {/* Información del usuario */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">@{user.username}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                {getRoleIcon()}
                <span className="font-medium text-sm">{getRoleLabel()}</span>
              </div>
              <div className="text-xs text-gray-500">
                {user.role === 'admin' && 'Acceso completo al sistema'}
                {user.role === 'editor' && 'Puede crear y editar productos'}
                {user.role === 'viewer' && 'Solo puede visualizar el catálogo'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};