import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Pieza, Marca } from '../types';

interface PaginatedResult {
  data: Pieza[];
  totalCount: number;
  hasMore: boolean;
}

interface ProductFilters {
  marca?: string;
  departamento?: string;
  search?: string;
  precioMin?: number;
  precioMax?: number;
}

export const useSupabase = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
    setupRealtimeSubscriptions();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from('marcas').select('count').limit(1);
      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST116') {
          setIsConnected(true);
          setError('Tables need to be created');
        } else {
          throw error;
        }
      } else {
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      setIsConnected(false);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const marcasSubscription = supabase
      .channel('marcas_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'marcas' },
        (payload) => {
          console.log('Cambio en marcas:', payload);
          window.dispatchEvent(new CustomEvent('marcas_updated', { detail: payload }));
        }
      )
      .subscribe();

    const piezasSubscription = supabase
      .channel('piezas_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'piezas' },
        (payload) => {
          console.log('Cambio en piezas:', payload);
          window.dispatchEvent(new CustomEvent('piezas_updated', { detail: payload }));
        }
      )
      .subscribe();

    const usersSubscription = supabase
      .channel('users_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('Cambio en usuarios:', payload);
          window.dispatchEvent(new CustomEvent('users_updated', { detail: payload }));
        }
      )
      .subscribe();

    return () => {
      marcasSubscription.unsubscribe();
      piezasSubscription.unsubscribe();
      usersSubscription.unsubscribe();
    };
  };

  // Funciones para marcas
  const getMarcas = async (): Promise<Marca[]> => {
    const { data, error } = await supabase
      .from('marcas')
      .select('*')
      .order('nombre');

    if (error) throw error;

    return data.map(marca => ({
      id: marca.id,
      nombre: marca.nombre,
      departamentos: marca.departamentos,
      imagen: marca.imagen || undefined,
      fechaCreacion: new Date(marca.fecha_creacion),
    }));
  };

  const createMarca = async (marca: Omit<Marca, 'id' | 'fechaCreacion'>): Promise<Marca> => {
    const { data, error } = await supabase
      .from('marcas')
      .insert({
        nombre: marca.nombre,
        departamentos: marca.departamentos,
        imagen: marca.imagen || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nombre: data.nombre,
      departamentos: data.departamentos,
      imagen: data.imagen || undefined,
      fechaCreacion: new Date(data.fecha_creacion),
    };
  };

  const updateMarca = async (id: string, marca: Partial<Marca>): Promise<Marca> => {
    const { data, error } = await supabase
      .from('marcas')
      .update({
        nombre: marca.nombre,
        departamentos: marca.departamentos,
        imagen: marca.imagen || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nombre: data.nombre,
      departamentos: data.departamentos,
      imagen: data.imagen || undefined,
      fechaCreacion: new Date(data.fecha_creacion),
    };
  };

  const deleteMarca = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('marcas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  // FUNCIÓN OPTIMIZADA: Obtener productos paginados con filtros
  const getPiezasPaginated = async (
    page: number = 1,
    limit: number = 4, // Cambiado a 4 productos por página
    filters: ProductFilters = {}
  ): Promise<PaginatedResult> => {
    console.log(`🔍 Cargando página ${page} con ${limit} productos por página`);
    
    const offset = (page - 1) * limit;
    
    try {
      // Usar la función optimizada de PostgreSQL
      const { data, error } = await supabase.rpc('get_productos_paginated', {
        p_marca: filters.marca || null,
        p_departamento: filters.departamento || null,
        p_search: filters.search || null,
        p_precio_min: filters.precioMin || null,
        p_precio_max: filters.precioMax || null,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.error('Error en consulta paginada:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          data: [],
          totalCount: 0,
          hasMore: false
        };
      }

      const totalCount = data[0]?.total_count || 0;
      
      const piezas = data.map((item: any) => ({
        id: item.id,
        nombre: item.nombre,
        descripcion: item.descripcion || undefined,
        imagen: item.imagen,
        precio: item.precio,
        marca: item.marca,
        codigoBarras: item.codigo_barras || undefined,
        clave: item.clave || undefined,
        departamento: item.departamento,
        unidadVenta: item.unidad_venta,
        medida: item.medida || undefined,
        precioMetro: item.precio_metro || undefined,
        metrosPorCaja: item.metros_por_caja || undefined,
        fechaCreacion: new Date(item.fecha_creacion),
        fechaActualizacion: new Date(item.fecha_actualizacion),
      }));

      console.log(`✅ Página ${page} cargada: ${piezas.length} productos de ${totalCount} totales`);

      return {
        data: piezas,
        totalCount: parseInt(totalCount.toString()),
        hasMore: offset + piezas.length < totalCount
      };

    } catch (error) {
      console.error('Error en getPiezasPaginated:', error);
      throw error;
    }
  };

  // FUNCIÓN: Búsqueda rápida por código
  const searchProductByCode = async (code: string): Promise<Pieza | null> => {
    try {
      const { data, error } = await supabase.rpc('search_producto_by_code', {
        p_code: code
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const item = data[0];
      return {
        id: item.id,
        nombre: item.nombre,
        descripcion: item.descripcion || undefined,
        imagen: item.imagen,
        precio: item.precio,
        marca: item.marca,
        codigoBarras: item.codigo_barras || undefined,
        clave: item.clave || undefined,
        departamento: item.departamento,
        unidadVenta: item.unidad_venta,
        medida: item.medida || undefined,
        precioMetro: item.precio_metro || undefined,
        metrosPorCaja: item.metros_por_caja || undefined,
        fechaCreacion: new Date(item.fecha_creacion),
        fechaActualizacion: new Date(item.fecha_actualizacion),
      };
    } catch (error) {
      console.error('Error en búsqueda por código:', error);
      return null;
    }
  };

  // FUNCIÓN: Obtener detalles completos de un producto
  const getPiezaDetails = async (id: string): Promise<Pieza | null> => {
    const { data, error } = await supabase
      .from('piezas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error obteniendo detalles del producto:', error);
      return null;
    }

    return {
      id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      imagen: data.imagen,
      precio: data.precio,
      marca: data.marca,
      codigoBarras: data.codigo_barras || undefined,
      clave: data.clave || undefined,
      departamento: data.departamento,
      unidadVenta: data.unidad_venta,
      medida: data.medida || undefined,
      precioMetro: data.precio_metro || undefined,
      metrosPorCaja: data.metros_por_caja || undefined,
      fechaCreacion: new Date(data.fecha_creacion),
      fechaActualizacion: new Date(data.fecha_actualizacion),
    };
  };

  const createPieza = async (pieza: Omit<Pieza, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Pieza> => {
    const { data, error } = await supabase
      .from('piezas')
      .insert({
        nombre: pieza.nombre,
        descripcion: pieza.descripcion || null,
        imagen: pieza.imagen,
        precio: pieza.precio,
        marca: pieza.marca,
        codigo_barras: pieza.codigoBarras || null,
        clave: pieza.clave || null,
        departamento: pieza.departamento,
        unidad_venta: pieza.unidadVenta,
        medida: pieza.medida || null,
        precio_metro: pieza.precioMetro || null,
        metros_por_caja: pieza.metrosPorCaja || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      imagen: data.imagen,
      precio: data.precio,
      marca: data.marca,
      codigoBarras: data.codigo_barras || undefined,
      clave: data.clave || undefined,
      departamento: data.departamento,
      unidadVenta: data.unidad_venta,
      medida: data.medida || undefined,
      precioMetro: data.precio_metro || undefined,
      metrosPorCaja: data.metros_por_caja || undefined,
      fechaCreacion: new Date(data.fecha_creacion),
      fechaActualizacion: new Date(data.fecha_actualizacion),
    };
  };

  const updatePieza = async (id: string, pieza: Partial<Pieza>): Promise<Pieza> => {
    const { data, error } = await supabase
      .from('piezas')
      .update({
        nombre: pieza.nombre,
        descripcion: pieza.descripcion || null,
        imagen: pieza.imagen,
        precio: pieza.precio,
        marca: pieza.marca,
        codigo_barras: pieza.codigoBarras || null,
        clave: pieza.clave || null,
        departamento: pieza.departamento,
        unidad_venta: pieza.unidadVenta,
        medida: pieza.medida || null,
        precio_metro: pieza.precioMetro || null,
        metros_por_caja: pieza.metrosPorCaja || null,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      imagen: data.imagen,
      precio: data.precio,
      marca: data.marca,
      codigoBarras: data.codigo_barras || undefined,
      clave: data.clave || undefined,
      departamento: data.departamento,
      unidadVenta: data.unidad_venta,
      medida: data.medida || undefined,
      precioMetro: data.precio_metro || undefined,
      metrosPorCaja: data.metros_por_caja || undefined,
      fechaCreacion: new Date(data.fecha_creacion),
      fechaActualizacion: new Date(data.fecha_actualizacion),
    };
  };

  const deletePieza = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('piezas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  return {
    isConnected,
    isLoading,
    error,
    checkConnection,
    // Marcas
    getMarcas,
    createMarca,
    updateMarca,
    deleteMarca,
    // Piezas - FUNCIONES OPTIMIZADAS
    getPiezasPaginated,
    searchProductByCode,
    getPiezaDetails,
    // Piezas - Funciones CRUD
    createPieza,
    updatePieza,
    deletePieza,
  };
};