import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, LoginCredentials, CreateUserData } from '../types/auth';
import bcrypt from 'bcryptjs';

// Usuario administrador local (respaldo)
const LOCAL_ADMIN: User = {
  id: 'local-admin-001',
  username: 'admin',
  name: 'Administrador Local',
  role: 'admin',
  createdAt: new Date('2024-01-01'),
  isActive: true,
};

const LOCAL_ADMIN_PASSWORD = 'Tesla369@';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionData = localStorage.getItem('catalog_session');
      if (sessionData) {
        const { userId, isLocal } = JSON.parse(sessionData);
        
        if (isLocal) {
          // Usuario administrador local
          setUser({ ...LOCAL_ADMIN, lastLogin: new Date() });
          setIsAuthenticated(true);
        } else {
          // Usuario de Supabase
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .eq('is_active', true)
            .single();

          if (data && !error) {
            const userData: User = {
              id: data.id,
              username: data.username,
              name: data.name,
              role: data.role,
              createdAt: new Date(data.created_at),
              lastLogin: data.last_login ? new Date(data.last_login) : undefined,
              isActive: data.is_active,
            };
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('catalog_session');
          }
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      localStorage.removeItem('catalog_session');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Primero verificar si es el administrador local
      if (credentials.username === LOCAL_ADMIN.username && credentials.password === LOCAL_ADMIN_PASSWORD) {
        const userData = { ...LOCAL_ADMIN, lastLogin: new Date() };
        setUser(userData);
        setIsAuthenticated(true);
        
        // Guardar sesión local
        localStorage.setItem('catalog_session', JSON.stringify({ 
          userId: LOCAL_ADMIN.id, 
          isLocal: true 
        }));
        
        setIsLoading(false);
        return true;
      }

      // Si no es el admin local, buscar en Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', credentials.username)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setIsLoading(false);
        return false;
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(credentials.password, data.password_hash);
      
      if (!isValidPassword) {
        setIsLoading(false);
        return false;
      }

      // Actualizar último login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      const userData: User = {
        id: data.id,
        username: data.username,
        name: data.name,
        role: data.role,
        createdAt: new Date(data.created_at),
        lastLogin: new Date(),
        isActive: data.is_active,
      };

      setUser(userData);
      setIsAuthenticated(true);
      
      // Guardar sesión de Supabase
      localStorage.setItem('catalog_session', JSON.stringify({ 
        userId: data.id, 
        isLocal: false 
      }));
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error during login:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('catalog_session');
  };

  const createUser = async (userData: CreateUserData): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Solo los administradores pueden crear usuarios');
    }

    try {
      // Verificar que el username no exista en Supabase
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', userData.username)
        .single();

      if (existingUser) {
        throw new Error('El nombre de usuario ya existe');
      }

      // Verificar que no sea el username del admin local
      if (userData.username === LOCAL_ADMIN.username) {
        throw new Error('Este nombre de usuario está reservado');
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(userData.password, 10);

      const { error } = await supabase
        .from('users')
        .insert({
          username: userData.username,
          name: userData.name,
          role: userData.role,
          password_hash: passwordHash,
          is_active: true,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
    if (!user || (user.role !== 'admin' && user.id !== userId)) {
      throw new Error('No tienes permisos para actualizar este usuario');
    }

    // No permitir actualizar el usuario administrador local
    if (userId === LOCAL_ADMIN.id) {
      throw new Error('No se puede modificar el administrador local');
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: userData.name,
          role: userData.role,
        })
        .eq('id', userId);

      if (error) throw error;

      // Si se actualiza el usuario actual, actualizar el estado local
      if (user.id === userId) {
        setUser(prev => prev ? { ...prev, ...userData } : null);
      }

      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Solo los administradores pueden eliminar usuarios');
    }

    // No permitir eliminar el usuario administrador local
    if (userId === LOCAL_ADMIN.id) {
      throw new Error('No se puede eliminar el administrador local');
    }

    try {
      // Verificar que no sea el último admin (incluyendo el local)
      const { data: adminUsers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .eq('is_active', true);

      const { data: userToDelete } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      // Contar admins: los de Supabase + el local
      const totalAdmins = (adminUsers?.length || 0) + 1; // +1 por el admin local

      if (userToDelete?.role === 'admin' && totalAdmins <= 2) {
        throw new Error('Debe haber al menos un administrador además del administrador local');
      }

      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    if (!user || user.role !== 'admin') {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const supabaseUsers = data.map(userData => ({
        id: userData.id,
        username: userData.username,
        name: userData.name,
        role: userData.role,
        createdAt: new Date(userData.created_at),
        lastLogin: userData.last_login ? new Date(userData.last_login) : undefined,
        isActive: userData.is_active,
      }));

      // Incluir el administrador local al principio de la lista
      return [LOCAL_ADMIN, ...supabaseUsers];
    } catch (error) {
      console.error('Error fetching users:', error);
      // En caso de error, al menos devolver el admin local
      return [LOCAL_ADMIN];
    }
  };

  const hasPermission = (action: 'create' | 'edit' | 'delete' | 'admin'): boolean => {
    if (!user) return false;

    switch (action) {
      case 'admin':
        return user.role === 'admin';
      case 'create':
        return ['admin', 'editor'].includes(user.role);
      case 'edit':
        return ['admin', 'editor'].includes(user.role);
      case 'delete':
        return user.role === 'admin';
      default:
        return false;
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    createUser,
    updateUser,
    deleteUser,
    getAllUsers,
    hasPermission,
  };
};