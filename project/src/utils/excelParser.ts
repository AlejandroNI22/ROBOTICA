import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Pieza } from '../types';
import { departamentos } from '../data/departamentos';

export interface ExcelRow {
  // Campos para ferretería
  clave?: string;
  codigoBarras?: string;
  descripcion?: string;
  precio?: string;
  
  // Campos para mallas
  producto?: string;
  medida?: string;

  // Campos para URREA
  codigoDeBarras?: string;
  marca?: string;
  acabadoColor?: string;

  // Campos para TRUPER (formato específico)
  codigo?: string;
  nombre?: string;
  precioPublico?: string;
}

export interface ImportResult {
  success: boolean;
  data?: Pieza[];
  errors?: string[];
  warnings?: string[];
}

// Función para limpiar y validar datos
const cleanAndValidateData = (value: any, fieldType: 'text' | 'number', fieldName: string): any => {
  // Si el valor está vacío, null o undefined
  if (value === null || value === undefined || value === '' || 
      (typeof value === 'string' && value.trim() === '')) {
    
    if (fieldType === 'number') {
      return 0; // Sustituir por 0 para campos numéricos
    } else {
      return 'NA'; // Sustituir por 'NA' para campos de texto
    }
  }

  // Si es un campo numérico, validar y limpiar
  if (fieldType === 'number') {
    const cleanValue = value.toString().replace(/[$,\s]/g, '').replace(/[^\d.]/g, '').trim();
    const numericValue = parseFloat(cleanValue);
    
    if (isNaN(numericValue)) {
      console.warn(`Valor numérico inválido en campo ${fieldName}: "${value}" - Sustituyendo por 0`);
      return 0;
    }
    
    return numericValue;
  }

  // Para campos de texto, limpiar y validar
  const cleanText = value.toString().trim();
  if (cleanText === '') {
    return 'NA';
  }

  return cleanText;
};

export const parseExcelFile = async (
  file: File,
  targetMarca: string,
  targetDepartamento?: string
): Promise<ImportResult> => {
  try {
    const data = await readFile(file);
    const rows = parseData(data, file.type);
    
    if (!rows || rows.length === 0) {
      return {
        success: false,
        errors: ['El archivo está vacío o no se pudo leer correctamente']
      };
    }

    const result = processRows(rows, targetMarca, targetDepartamento);
    return result;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return {
      success: false,
      errors: [`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`]
    };
  }
};

const readFile = (file: File): Promise<string | ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || '');
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

const parseData = (data: string | ArrayBuffer, fileType: string): ExcelRow[] => {
  if (fileType.includes('csv') || typeof data === 'string') {
    const result = Papa.parse(data as string, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      transformHeader: (header) => normalizeHeader(header)
    });
    return result.data as ExcelRow[];
  } else {
    const workbook = XLSX.read(data, { 
      type: 'array',
      codepage: 65001
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false
    }) as string[][];
    
    if (jsonData.length < 2) {
      return [];
    }
    
    const headers = jsonData[0].map(h => normalizeHeader(h.toString()));
    const rows = jsonData.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] ? row[index].toString().trim() : '';
      });
      return obj;
    });
    
    return rows as ExcelRow[];
  }
};

const normalizeHeader = (header: string): string => {
  return header
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/ç/g, 'c');
};

const detectarTipoProducto = (row: ExcelRow, targetMarca: string): 'ferreteria' | 'mallas' | 'urrea' | 'truper' => {
  const normalizedRow = normalizeRowFields(row);
  const marcaLower = targetMarca.toLowerCase();
  
  // Detectar por marca específica primero
  if (marcaLower.includes('truper')) {
    // Verificar si tiene campos específicos de TRUPER
    if (normalizedRow.codigo && normalizedRow.nombre && normalizedRow.precioPublico) {
      return 'truper';
    }
  }
  
  if (marcaLower.includes('urrea')) {
    // Verificar si tiene campos específicos de URREA
    if (normalizedRow.codigoDeBarras && normalizedRow.marca && normalizedRow.acabadoColor) {
      return 'urrea';
    }
  }
  
  // Si tiene campos específicos de mallas
  if (normalizedRow.producto && normalizedRow.medida) {
    return 'mallas';
  }
  
  // Si tiene campos específicos de ferretería
  if (normalizedRow.clave && normalizedRow.codigoBarras) {
    return 'ferreteria';
  }
  
  // Detectar por contenido
  const texto = `${normalizedRow.producto || ''} ${normalizedRow.descripcion || ''} ${normalizedRow.nombre || ''}`.toLowerCase();
  
  if (texto.includes('malla') || texto.includes('ciclón') || texto.includes('gallinero') || 
      texto.includes('alambre') || texto.includes('cerca')) {
    return 'mallas';
  }
  
  return 'ferreteria';
};

const processRows = (
  rows: ExcelRow[],
  targetMarca: string,
  targetDepartamento?: string
): ImportResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const processedData: Pieza[] = [];
  
  if (rows.length === 0) {
    return { success: false, errors: ['No hay datos para procesar'] };
  }
  
  // Detectar tipo de producto basado en la primera fila y marca
  const tipoProducto = detectarTipoProducto(rows[0], targetMarca);
  warnings.push(`Tipo de producto detectado: ${getTipoProductoLabel(tipoProducto)}`);
  
  // Validar headers según el tipo
  const sampleRow = rows[0];
  const availableFields = Object.keys(sampleRow).map(k => normalizeHeader(k));
  
  let requiredFields: string[] = [];
  if (tipoProducto === 'truper') {
    requiredFields = ['codigo', 'nombre', 'preciopublico'];
  } else if (tipoProducto === 'mallas') {
    requiredFields = ['producto', 'medida', 'precio'];
  } else if (tipoProducto === 'urrea') {
    requiredFields = ['codigodebarras', 'clave', 'descripcion', 'marca', 'acabadocolor', 'precio'];
  } else {
    requiredFields = ['clave', 'codigobarras', 'descripcion', 'precio'];
  }
  
  const missingFields = requiredFields.filter(field => {
    const variations = [
      field,
      field.replace('codigobarras', 'codigodebarras'),
      field.replace('codigobarras', 'codigo_barras'),
      field.replace('preciopublico', 'precio_publico'),
    ];
    return !variations.some(variation => availableFields.includes(variation));
  });
  
  if (missingFields.length > 0) {
    errors.push(`Faltan columnas obligatorias para ${getTipoProductoLabel(tipoProducto)}: ${missingFields.join(', ')}`);
    errors.push(`Columnas encontradas: ${availableFields.join(', ')}`);
    return { success: false, errors };
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    
    try {
      const normalizedRow = normalizeRowFields(row);
      
      if (tipoProducto === 'truper') {
        // Procesar TRUPER con validación de datos
        const codigo = cleanAndValidateData(normalizedRow.codigo, 'text', 'CÓDIGO');
        const nombre = cleanAndValidateData(normalizedRow.nombre, 'text', 'NOMBRE');
        const precioPublico = cleanAndValidateData(normalizedRow.precioPublico, 'number', 'PRECIO PÚBLICO');
        
        // Validaciones básicas (solo para campos críticos)
        if (codigo === 'NA') {
          warnings.push(`Fila ${rowNumber}: CÓDIGO vacío, se asignó 'NA'`);
        }
        
        if (nombre === 'NA') {
          warnings.push(`Fila ${rowNumber}: NOMBRE vacío, se asignó 'NA'`);
        }
        
        if (precioPublico === 0) {
          warnings.push(`Fila ${rowNumber}: PRECIO PÚBLICO vacío o inválido, se asignó 0`);
        }
        
        // Imagen por defecto para TRUPER
        const imagenUrl = 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=400';
        
        // Detectar departamento
        const departamento = targetDepartamento || detectarDepartamento(nombre, nombre);
        const departamentoInfo = departamentos.find(d => d.id === departamento);
        
        // Crear producto TRUPER
        const nuevaPieza: Pieza = {
          id: `import_${Date.now()}_${index}`,
          nombre: formatearNombre(nombre),
          descripcion: nombre,
          imagen: imagenUrl,
          precio: precioPublico,
          marca: targetMarca,
          codigoBarras: codigo, // Usar código como código de barras
          clave: codigo,
          departamento: departamento,
          unidadVenta: departamentoInfo?.unidadesVenta[0] || 'Pieza',
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
        };
        
        processedData.push(nuevaPieza);
        
      } else if (tipoProducto === 'urrea') {
        // Procesar URREA con validación de datos
        const codigoDeBarras = cleanAndValidateData(normalizedRow.codigoDeBarras, 'text', 'CÓDIGO DE BARRAS');
        const clave = cleanAndValidateData(normalizedRow.clave, 'text', 'CLAVE');
        const descripcion = cleanAndValidateData(normalizedRow.descripcion, 'text', 'DESCRIPCIÓN');
        const marca = cleanAndValidateData(normalizedRow.marca, 'text', 'MARCA');
        const acabadoColor = cleanAndValidateData(normalizedRow.acabadoColor, 'text', 'ACABADO/COLOR');
        const precio = cleanAndValidateData(normalizedRow.precio, 'number', 'PRECIO');
        
        // Validaciones específicas para URREA
        if (codigoDeBarras === 'NA') {
          warnings.push(`Fila ${rowNumber}: CÓDIGO DE BARRAS vacío, se asignó 'NA'`);
        }
        
        if (precio === 0) {
          warnings.push(`Fila ${rowNumber}: PRECIO vacío o inválido, se asignó 0`);
        }
        
        // Imagen por defecto para URREA
        const imagenUrl = 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=400';
        
        // Generar nombre desde descripción
        const nombreGenerado = generarNombreDesdeDescripcion(descripcion, clave);
        
        // Detectar departamento
        const departamento = targetDepartamento || detectarDepartamento(nombreGenerado, descripcion);
        const departamentoInfo = departamentos.find(d => d.id === departamento);
        
        // Crear producto URREA
        const nuevaPieza: Pieza = {
          id: `import_${Date.now()}_${index}`,
          nombre: nombreGenerado,
          descripcion: `${descripcion} - ${acabadoColor}`,
          imagen: imagenUrl,
          precio: precio,
          marca: marca, // Usar la marca del archivo, no la targetMarca
          codigoBarras: codigoDeBarras,
          clave: clave,
          departamento: departamento,
          unidadVenta: departamentoInfo?.unidadesVenta[0] || 'Pieza',
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
        };
        
        processedData.push(nuevaPieza);
        
      } else if (tipoProducto === 'mallas') {
        // Procesar mallas con validación de datos
        const producto = cleanAndValidateData(normalizedRow.producto, 'text', 'PRODUCTO');
        const medida = cleanAndValidateData(normalizedRow.medida, 'text', 'MEDIDA');
        const precio = cleanAndValidateData(normalizedRow.precio, 'number', 'PRECIO');
        
        // Validaciones
        if (producto === 'NA') {
          warnings.push(`Fila ${rowNumber}: PRODUCTO vacío, se asignó 'NA'`);
        }
        
        if (medida === 'NA') {
          warnings.push(`Fila ${rowNumber}: MEDIDA vacía, se asignó 'NA'`);
        }
        
        if (precio === 0) {
          warnings.push(`Fila ${rowNumber}: PRECIO vacío o inválido, se asignó 0`);
        }
        
        const imagenUrl = 'https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&w=400';
        
        const nuevaPieza: Pieza = {
          id: `import_${Date.now()}_${index}`,
          nombre: formatearNombre(producto),
          descripcion: `${producto} - ${medida}`,
          imagen: imagenUrl,
          precio: precio,
          marca: targetMarca,
          codigoBarras: generarCodigoBarras(),
          clave: generarClaveDesdeProducto(producto),
          departamento: targetDepartamento || 'construccion',
          unidadVenta: 'Rollo',
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
        };
        
        processedData.push(nuevaPieza);
        
      } else {
        // Procesar ferretería con validación de datos
        const clave = cleanAndValidateData(normalizedRow.clave, 'text', 'CLAVE');
        const descripcion = cleanAndValidateData(normalizedRow.descripcion, 'text', 'DESCRIPCION');
        const codigoBarras = cleanAndValidateData(normalizedRow.codigoBarras, 'text', 'CODIGO DE BARRAS');
        const precio = cleanAndValidateData(normalizedRow.precio, 'number', 'PRECIO');
        
        // Validaciones
        if (clave === 'NA') {
          warnings.push(`Fila ${rowNumber}: CLAVE vacía, se asignó 'NA'`);
        }
        
        if (descripcion === 'NA') {
          warnings.push(`Fila ${rowNumber}: DESCRIPCION vacía, se asignó 'NA'`);
        }
        
        if (codigoBarras === 'NA') {
          warnings.push(`Fila ${rowNumber}: CODIGO DE BARRAS vacío, se generará automáticamente`);
        }
        
        if (precio === 0) {
          warnings.push(`Fila ${rowNumber}: PRECIO vacío o inválido, se asignó 0`);
        }
        
        const imagenUrl = 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=400';
        const nombreGenerado = generarNombreDesdeDescripcion(descripcion, clave);
        const departamento = targetDepartamento || detectarDepartamento(nombreGenerado, descripcion);
        const departamentoInfo = departamentos.find(d => d.id === departamento);
        
        const nuevaPieza: Pieza = {
          id: `import_${Date.now()}_${index}`,
          nombre: nombreGenerado,
          descripcion: descripcion,
          imagen: imagenUrl,
          precio: precio,
          marca: targetMarca,
          codigoBarras: codigoBarras === 'NA' ? generarCodigoBarras() : codigoBarras,
          clave: clave,
          departamento: departamento,
          unidadVenta: departamentoInfo?.unidadesVenta[0] || 'Pieza',
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
        };
        
        processedData.push(nuevaPieza);
      }
      
    } catch (error) {
      errors.push(`Fila ${rowNumber}: Error - ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  });
  
  // Siempre retornar éxito, pero con advertencias si hay datos sustituidos
  return {
    success: true,
    data: processedData,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

const getTipoProductoLabel = (tipo: string): string => {
  switch (tipo) {
    case 'truper': return 'TRUPER';
    case 'urrea': return 'URREA';
    case 'mallas': return 'MALLAS';
    default: return 'Ferretería';
  }
};

const normalizeRowFields = (row: any): ExcelRow => {
  const normalized: any = {};
  
  Object.keys(row).forEach(key => {
    const normalizedKey = normalizeHeader(key);
    
    if (normalizedKey.includes('clave')) {
      normalized.clave = row[key];
    } else if (normalizedKey.includes('codigo') && (normalizedKey.includes('barra') || normalizedKey.includes('bar'))) {
      normalized.codigoBarras = row[key];
      normalized.codigoDeBarras = row[key]; // Para URREA
    } else if (normalizedKey.includes('codigo') && !normalizedKey.includes('barra')) {
      normalized.codigo = row[key]; // Para TRUPER
    } else if (normalizedKey.includes('descripcion')) {
      normalized.descripcion = row[key];
    } else if (normalizedKey.includes('precio') && !normalizedKey.includes('publico')) {
      normalized.precio = row[key];
    } else if (normalizedKey.includes('precio') && normalizedKey.includes('publico')) {
      normalized.precioPublico = row[key]; // Para TRUPER
    } else if (normalizedKey.includes('producto')) {
      normalized.producto = row[key];
    } else if (normalizedKey.includes('medida')) {
      normalized.medida = row[key];
    } else if (normalizedKey.includes('marca')) {
      normalized.marca = row[key];
    } else if (normalizedKey.includes('acabado') || normalizedKey.includes('color')) {
      normalized.acabadoColor = row[key];
    } else if (normalizedKey.includes('nombre')) {
      normalized.nombre = row[key]; // Para TRUPER
    }
  });
  
  return normalized as ExcelRow;
};

const generarCodigoBarras = (): string => {
  return Math.floor(Math.random() * 9000000000000 + 1000000000000).toString();
};

const generarClaveDesdeProducto = (producto: string): string => {
  const palabras = producto.trim().split(' ');
  const iniciales = palabras.map(p => p.charAt(0).toUpperCase()).join('');
  const numero = Math.floor(Math.random() * 99) + 1;
  return `${iniciales.substring(0, 4)}-${numero.toString().padStart(2, '0')}`;
};

const generarNombreDesdeDescripcion = (descripcion: string, clave: string): string => {
  const descripcionLimpia = descripcion
    .trim()
    .replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜ]/g, ' ')
    .replace(/\s+/g, ' ');
  
  const palabras = descripcionLimpia.split(' ');
  
  if (palabras.length <= 3) {
    return formatearNombre(descripcionLimpia);
  }
  
  const palabrasSignificativas = palabras.filter(palabra => 
    palabra.length > 2 && 
    !['de', 'del', 'la', 'el', 'con', 'para', 'por', 'en', 'y', 'o', 'tipo', 'color'].includes(palabra.toLowerCase())
  );
  
  if (palabrasSignificativas.length >= 2) {
    return formatearNombre(palabrasSignificativas.slice(0, 3).join(' '));
  }
  
  return formatearNombre(clave.replace(/[-_]/g, ' '));
};

const detectarDepartamento = (nombre: string, descripcion: string): string => {
  const texto = `${nombre} ${descripcion}`.toLowerCase();
  
  const keywords = {
    construccion: ['placa', 'módulo', 'modulo', 'abs', 'oslo', 'blanco', 'construcción', 'construccion', 'material', 'malla', 'ciclón', 'ciclon'],
    ferreteria: ['martillo', 'destornillador', 'llave', 'tornillo', 'clavo', 'herramienta', 'taladro', 'sierra', 'multicontacto'],
    electrico: ['cable', 'interruptor', 'contacto', 'foco', 'lámpara', 'lampara', 'eléctrico', 'electrico', 'voltaje', 'corriente'],
    plomeria: ['tubería', 'tuberia', 'llave', 'regadera', 'codo', 'tee', 'válvula', 'valvula', 'agua', 'hidráulico', 'hidraulico', 'pvc'],
    pinturas: ['pintura', 'barniz', 'esmalte', 'primer', 'brocha', 'rodillo', 'color', 'acabado', 'aerosol'],
    limpieza: ['detergente', 'jabón', 'jabon', 'limpiador', 'desinfectante', 'cloro', 'limpieza'],
    azulejos: ['azulejo', 'piso', 'cerámica', 'ceramica', 'porcelanato', 'mosaico', 'baldosa'],
    sanitarios: ['inodoro', 'lavabo', 'regadera', 'tina', 'sanitario', 'wc']
  };
  
  for (const [dept, words] of Object.entries(keywords)) {
    if (words.some(word => texto.includes(word))) {
      return dept;
    }
  }
  
  return 'ferreteria';
};

const formatearNombre = (nombre: string): string => {
  return nombre
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(' ');
};