import { Departamento } from '../types';

export const departamentos: Departamento[] = [
  {
    id: 'ferreteria',
    nombre: 'Ferretería',
    descripcion: 'Herramientas y accesorios para trabajo manual',
    icono: 'Wrench',
    unidadesVenta: ['Pieza', 'Caja', 'Bolsa', 'Kilogramo'],
    requiereClave: true,
  },
  {
    id: 'electrico',
    nombre: 'Eléctrico',
    descripcion: 'Componentes y accesorios eléctricos',
    icono: 'Zap',
    unidadesVenta: ['Pieza', 'Metro', 'Rollo', 'Caja'],
    requiereClave: true,
  },
  {
    id: 'plomeria',
    nombre: 'Plomería',
    descripcion: 'Tuberías, conexiones y accesorios hidráulicos',
    icono: 'Droplets',
    unidadesVenta: ['Pieza', 'Metro', 'Tramo'],
    requiereClave: true,
  },
  {
    id: 'construccion',
    nombre: 'Materiales para Construcción',
    descripcion: 'Cemento, arena, grava, materiales básicos y mallas',
    icono: 'Building',
    unidadesVenta: ['Saco', 'Metro Cúbico', 'Tonelada', 'Pieza', 'Rollo', 'Metro'],
    requiereClave: true,
  },
  {
    id: 'pinturas',
    nombre: 'Pinturas',
    descripcion: 'Pinturas, barnices y productos de acabado',
    icono: 'Palette',
    unidadesVenta: ['Litro', 'Galón', 'Cubeta', 'Bote'],
    requiereClave: true,
  },
  {
    id: 'limpieza',
    nombre: 'Limpieza y Mantenimiento',
    descripcion: 'Productos de limpieza y mantenimiento',
    icono: 'Sparkles',
    unidadesVenta: ['Pieza', 'Litro', 'Kilogramo', 'Paquete'],
  },
  {
    id: 'azulejos',
    nombre: 'Azulejos',
    descripcion: 'Azulejos, pisos y recubrimientos cerámicos',
    icono: 'Grid3x3',
    unidadesVenta: ['Pieza', 'Caja'],
    requiereClave: true,
    requiereMedida: true,
  },
  {
    id: 'sanitarios',
    nombre: 'Muebles para Baño',
    descripcion: 'Sanitarios, lavabos, llaves y regaderas',
    icono: 'Bath',
    unidadesVenta: ['Pieza', 'Juego'],
  }
];