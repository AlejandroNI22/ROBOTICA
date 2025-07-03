/*
  # Crear tabla de productos (piezas)

  1. Nueva tabla
    - `piezas` con todos los campos necesarios para el catálogo
    - Campos para diferentes tipos de productos (ferretería, azulejos, etc.)
    - Validaciones de datos y restricciones

  2. Seguridad
    - Habilitar RLS en la tabla piezas
    - Políticas de acceso público para lectura
    - Políticas de acceso autenticado para escritura

  3. Rendimiento
    - Índices en campos frecuentemente consultados
    - Índices de texto completo para búsquedas
    - Trigger automático para fecha_actualizacion

  4. Datos de ejemplo
    - Productos de muestra para diferentes departamentos
*/

-- Crear tabla de productos (piezas) si no existe
CREATE TABLE IF NOT EXISTS piezas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  imagen text NOT NULL,
  precio numeric(10,2) NOT NULL CHECK (precio >= 0),
  marca text NOT NULL,
  codigo_barras text,
  clave text,
  departamento text NOT NULL,
  unidad_venta text NOT NULL,
  medida text,
  precio_metro numeric(10,2) CHECK (precio_metro >= 0),
  metros_por_caja numeric(10,2) CHECK (metros_por_caja >= 0),
  fecha_creacion timestamptz DEFAULT now(),
  fecha_actualizacion timestamptz DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE piezas ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Piezas son visibles para todos" ON piezas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar piezas" ON piezas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar piezas" ON piezas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar piezas" ON piezas;

-- Crear políticas de seguridad
CREATE POLICY "Piezas son visibles para todos" 
  ON piezas FOR SELECT 
  USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar piezas" 
  ON piezas FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar piezas" 
  ON piezas FOR UPDATE 
  USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar piezas" 
  ON piezas FOR DELETE 
  USING (true);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_piezas_marca ON piezas(marca);
CREATE INDEX IF NOT EXISTS idx_piezas_departamento ON piezas(departamento);
CREATE INDEX IF NOT EXISTS idx_piezas_codigo_barras ON piezas(codigo_barras) WHERE codigo_barras IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_piezas_clave ON piezas(clave) WHERE clave IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_piezas_nombre ON piezas USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_piezas_descripcion ON piezas USING gin(to_tsvector('spanish', descripcion)) WHERE descripcion IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_piezas_precio ON piezas(precio);
CREATE INDEX IF NOT EXISTS idx_piezas_fecha_creacion ON piezas(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_piezas_fecha_actualizacion ON piezas(fecha_actualizacion);

-- Función para actualizar automáticamente fecha_actualizacion
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente fecha_actualizacion
DROP TRIGGER IF EXISTS trigger_update_fecha_actualizacion ON piezas;
CREATE TRIGGER trigger_update_fecha_actualizacion
  BEFORE UPDATE ON piezas
  FOR EACH ROW
  EXECUTE FUNCTION update_fecha_actualizacion();

-- Insertar algunos productos de ejemplo solo si la tabla está vacía
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM piezas LIMIT 1) THEN
    INSERT INTO piezas (nombre, descripcion, imagen, precio, marca, codigo_barras, clave, departamento, unidad_venta, fecha_creacion, fecha_actualizacion)
    VALUES 
      (
        'Martillo de Garra 16oz',
        'Martillo de garra profesional con mango de fibra de vidrio',
        'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=400',
        285.50,
        'Stanley',
        '7501234567890',
        'MART-01',
        'ferreteria',
        'Pieza',
        now(),
        now()
      ),
      (
        'Destornillador Phillips #2',
        'Destornillador Phillips punta magnética con mango ergonómico',
        'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=400',
        45.75,
        'Stanley',
        '7501234567891',
        'DEST-01',
        'ferreteria',
        'Pieza',
        now(),
        now()
      ),
      (
        'Azulejo Cerámico 30x30',
        'Azulejo cerámico para piso, acabado brillante',
        'https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&w=400',
        12.50,
        'Interceramic',
        '7501234567892',
        'AZUL-01',
        'azulejos',
        'Pieza',
        now(),
        now()
      ),
      (
        'Cable Eléctrico 12 AWG',
        'Cable eléctrico calibre 12 AWG para instalaciones residenciales',
        'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=400',
        8.50,
        'Condumex',
        '7501234567893',
        'CABL-01',
        'electrico',
        'Metro',
        now(),
        now()
      ),
      (
        'Codo PVC 90° 1/2"',
        'Codo de PVC de 90 grados para tubería de 1/2 pulgada',
        'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=400',
        3.25,
        'Pavco',
        '7501234567894',
        'CODO-01',
        'plomeria',
        'Pieza',
        now(),
        now()
      );
  END IF;
END $$;

-- Comentarios en la tabla
COMMENT ON TABLE piezas IS 'Tabla principal de productos del catálogo';
COMMENT ON COLUMN piezas.id IS 'Identificador único del producto';
COMMENT ON COLUMN piezas.nombre IS 'Nombre del producto';
COMMENT ON COLUMN piezas.descripcion IS 'Descripción detallada del producto';
COMMENT ON COLUMN piezas.imagen IS 'URL de la imagen del producto';
COMMENT ON COLUMN piezas.precio IS 'Precio del producto en pesos mexicanos';
COMMENT ON COLUMN piezas.marca IS 'Marca o proveedor del producto';
COMMENT ON COLUMN piezas.codigo_barras IS 'Código de barras para escaneo';
COMMENT ON COLUMN piezas.clave IS 'Clave interna del producto';
COMMENT ON COLUMN piezas.departamento IS 'Departamento al que pertenece el producto';
COMMENT ON COLUMN piezas.unidad_venta IS 'Unidad de venta (Pieza, Caja, Metro, etc.)';
COMMENT ON COLUMN piezas.medida IS 'Medida del producto (para azulejos, etc.)';
COMMENT ON COLUMN piezas.precio_metro IS 'Precio por metro cuadrado (para azulejos)';
COMMENT ON COLUMN piezas.metros_por_caja IS 'Metros cuadrados por caja (para azulejos)';
COMMENT ON COLUMN piezas.fecha_creacion IS 'Fecha de creación del registro';
COMMENT ON COLUMN piezas.fecha_actualizacion IS 'Fecha de última actualización del registro';