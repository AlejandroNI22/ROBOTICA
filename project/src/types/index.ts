export interface Pieza {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen: string;
  precio: number; // en pesos mexicanos
  marca: string;
  codigoBarras?: string; // Ahora opcional
  clave?: string; // Campo adicional específico para ferretería (opcional)
  departamento: string;
  unidadVenta: string;
  // Campos específicos para azulejos
  medida?: string; // Medida del azulejo (ej: "30x30", "60x60")
  precioMetro?: number; // Precio por metro cuadrado (opcional)
  metrosPorCaja?: number; // Cantidad de metros cuadrados que contiene una caja
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface Marca {
  id: string;
  nombre: string;
  departamentos: string[]; // Departamentos donde está disponible la marca
  imagen?: string; // Nueva propiedad para imagen de la marca
  fechaCreacion: Date;
}

export interface Departamento {
  id: string;
  nombre: string;
  descripcion?: string;
  icono: string;
  unidadesVenta: string[];
  requiereClave?: boolean; // Indica si el departamento requiere campo de clave
  requiereMedida?: boolean; // Indica si el departamento requiere campo de medida
}

export interface FiltrosBusqueda {
  nombre?: string;
  departamento?: string;
  marca?: string;
  precioMin?: number;
  precioMax?: number;
  codigoBarras?: string;
  clave?: string;
}

// Nuevos tipos para el sistema de formatos Excel
export interface ExcelFormatField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: string[]; // Para campos tipo select
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ExcelFormat {
  id: string;
  name: string;
  description: string;
  marcaId?: string; // Si está asociado a una marca específica
  color: string; // Color temático del formato
  fields: ExcelFormatField[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExcelFormatTemplate {
  id: string;
  name: string;
  description: string;
  color: string;
  fields: Omit<ExcelFormatField, 'id'>[];
}