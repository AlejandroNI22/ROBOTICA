import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para la base de datos
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          name: string;
          role: 'admin' | 'editor' | 'viewer';
          password_hash: string;
          is_active: boolean;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          username: string;
          name: string;
          role: 'admin' | 'editor' | 'viewer';
          password_hash: string;
          is_active?: boolean;
          created_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          name?: string;
          role?: 'admin' | 'editor' | 'viewer';
          password_hash?: string;
          is_active?: boolean;
          created_at?: string;
          last_login?: string | null;
        };
      };
      marcas: {
        Row: {
          id: string;
          nombre: string;
          departamentos: string[];
          fecha_creacion: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          departamentos: string[];
          fecha_creacion?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          departamentos?: string[];
          fecha_creacion?: string;
        };
      };
      piezas: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string | null;
          imagen: string;
          precio: number;
          marca: string;
          codigo_barras: string | null;
          clave: string | null;
          departamento: string;
          unidad_venta: string;
          medida: string | null;
          precio_metro: number | null;
          metros_por_caja: number | null;
          fecha_creacion: string;
          fecha_actualizacion: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string | null;
          imagen: string;
          precio: number;
          marca: string;
          codigo_barras?: string | null;
          clave?: string | null;
          departamento: string;
          unidad_venta: string;
          medida?: string | null;
          precio_metro?: number | null;
          metros_por_caja?: number | null;
          fecha_creacion?: string;
          fecha_actualizacion?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string | null;
          imagen?: string;
          precio?: number;
          marca?: string;
          codigo_barras?: string | null;
          clave?: string | null;
          departamento?: string;
          unidad_venta?: string;
          medida?: string | null;
          precio_metro?: number | null;
          metros_por_caja?: number | null;
          fecha_creacion?: string;
          fecha_actualizacion?: string;
        };
      };
    };
  };
};