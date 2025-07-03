import { ExcelFormatTemplate } from '../types';

// Solo los formatos originales específicos por marca
export const defaultExcelFormats: ExcelFormatTemplate[] = [
  {
    id: 'urrea',
    name: 'URREA',
    description: 'Formato específico para productos URREA con 6 columnas',
    color: 'orange',
    fields: [
      {
        name: 'codigoBarras',
        label: 'CÓDIGO DE BARRAS',
        type: 'number',
        required: true,
        validation: { min: 1000000000000, max: 9999999999999999 }
      },
      {
        name: 'clave',
        label: 'CLAVE',
        type: 'text',
        required: true
      },
      {
        name: 'descripcion',
        label: 'DESCRIPCIÓN',
        type: 'text',
        required: true
      },
      {
        name: 'marca',
        label: 'MARCA',
        type: 'text',
        required: true
      },
      {
        name: 'acabadoColor',
        label: 'ACABADO/COLOR',
        type: 'text',
        required: true
      },
      {
        name: 'precio',
        label: 'PRECIO',
        type: 'number',
        required: true,
        validation: { min: 0 }
      }
    ]
  },
  {
    id: 'truper',
    name: 'TRUPER',
    description: 'Formato específico para productos TRUPER con 3 columnas',
    color: 'blue',
    fields: [
      {
        name: 'codigo',
        label: 'CÓDIGO',
        type: 'text',
        required: true
      },
      {
        name: 'nombre',
        label: 'NOMBRE',
        type: 'text',
        required: true
      },
      {
        name: 'precioPublico',
        label: 'PRECIO PÚBLICO',
        type: 'number',
        required: true,
        validation: { min: 0 }
      }
    ]
  },
  {
    id: 'mallas',
    name: 'MALLAS',
    description: 'Formato para productos de mallas y construcción con 3 columnas',
    color: 'green',
    fields: [
      {
        name: 'producto',
        label: 'PRODUCTO',
        type: 'text',
        required: true
      },
      {
        name: 'medida',
        label: 'MEDIDA',
        type: 'text',
        required: true
      },
      {
        name: 'precio',
        label: 'PRECIO',
        type: 'number',
        required: true,
        validation: { min: 0 }
      }
    ]
  }
];

export const getColorClasses = (color: string) => {
  const colorMap = {
    orange: {
      bg: 'bg-orange-600',
      bgHover: 'hover:bg-orange-700',
      bgLight: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900',
      textLight: 'text-orange-600',
      ring: 'ring-orange-500',
      gradient: 'from-orange-500 to-orange-600'
    },
    blue: {
      bg: 'bg-blue-600',
      bgHover: 'hover:bg-blue-700',
      bgLight: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      textLight: 'text-blue-600',
      ring: 'ring-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    purple: {
      bg: 'bg-purple-600',
      bgHover: 'hover:bg-purple-700',
      bgLight: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      textLight: 'text-purple-600',
      ring: 'ring-purple-500',
      gradient: 'from-purple-500 to-purple-600'
    },
    green: {
      bg: 'bg-green-600',
      bgHover: 'hover:bg-green-700',
      bgLight: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      textLight: 'text-green-600',
      ring: 'ring-green-500',
      gradient: 'from-green-500 to-green-600'
    },
    red: {
      bg: 'bg-red-600',
      bgHover: 'hover:bg-red-700',
      bgLight: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      textLight: 'text-red-600',
      ring: 'ring-red-500',
      gradient: 'from-red-500 to-red-600'
    },
    gray: {
      bg: 'bg-gray-600',
      bgHover: 'hover:bg-gray-700',
      bgLight: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-900',
      textLight: 'text-gray-600',
      ring: 'ring-gray-500',
      gradient: 'from-gray-500 to-gray-600'
    }
  };

  return colorMap[color as keyof typeof colorMap] || colorMap.gray;
};