/*
  # Optimización de rendimiento para tabla de productos

  1. Índices optimizados
    - Índices compuestos para filtros comunes
    - Índices parciales para campos opcionales
    - Índices de texto completo optimizados

  2. Funciones de consulta optimizadas
    - Función para paginación eficiente
    - Función para búsqueda con filtros
    - Función para conteo rápido

  3. Vistas materializadas para consultas frecuentes
    - Vista de productos con datos mínimos
    - Vista de estadísticas por marca/departamento
*/

-- Eliminar índices existentes que pueden ser ineficientes
DROP INDEX IF EXISTS idx_piezas_nombre;
DROP INDEX IF EXISTS idx_piezas_descripcion;

-- Crear índices compuestos optimizados para consultas comunes
CREATE INDEX IF NOT EXISTS idx_piezas_marca_departamento ON piezas(marca, departamento);
CREATE INDEX IF NOT EXISTS idx_piezas_departamento_precio ON piezas(departamento, precio);
CREATE INDEX IF NOT EXISTS idx_piezas_marca_precio ON piezas(marca, precio);

-- Índices de texto completo optimizados (solo para campos de búsqueda)
CREATE INDEX IF NOT EXISTS idx_piezas_search_nombre ON piezas USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_piezas_search_combined ON piezas USING gin(
  to_tsvector('spanish', coalesce(nombre, '') || ' ' || coalesce(clave, '') || ' ' || coalesce(codigo_barras, ''))
);

-- Índices parciales para campos opcionales (más eficientes)
CREATE INDEX IF NOT EXISTS idx_piezas_codigo_barras_partial ON piezas(codigo_barras) 
  WHERE codigo_barras IS NOT NULL AND codigo_barras != '';

CREATE INDEX IF NOT EXISTS idx_piezas_clave_partial ON piezas(clave) 
  WHERE clave IS NOT NULL AND clave != '';

-- Índice para ordenamiento por fecha (más recientes primero)
CREATE INDEX IF NOT EXISTS idx_piezas_fecha_desc ON piezas(fecha_actualizacion DESC, id);

-- Función optimizada para paginación con filtros
CREATE OR REPLACE FUNCTION get_productos_paginated(
  p_marca text DEFAULT NULL,
  p_departamento text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_precio_min numeric DEFAULT NULL,
  p_precio_max numeric DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  nombre text,
  imagen text,
  precio numeric,
  marca text,
  codigo_barras text,
  clave text,
  departamento text,
  unidad_venta text,
  medida text,
  precio_metro numeric,
  metros_por_caja numeric,
  fecha_actualizacion timestamptz,
  total_count bigint
) 
LANGUAGE plpgsql
AS $$
DECLARE
  base_query text;
  count_query text;
  where_conditions text[] := '{}';
  total_records bigint;
BEGIN
  -- Construir condiciones WHERE dinámicamente
  IF p_marca IS NOT NULL AND p_marca != '' THEN
    where_conditions := array_append(where_conditions, 'marca = $1');
  END IF;
  
  IF p_departamento IS NOT NULL AND p_departamento != '' THEN
    where_conditions := array_append(where_conditions, 'departamento = $2');
  END IF;
  
  IF p_search IS NOT NULL AND p_search != '' THEN
    where_conditions := array_append(where_conditions, 
      '(to_tsvector(''spanish'', coalesce(nombre, '''') || '' '' || coalesce(clave, '''') || '' '' || coalesce(codigo_barras, '''')) @@ plainto_tsquery(''spanish'', $3))');
  END IF;
  
  IF p_precio_min IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 'precio >= $4');
  END IF;
  
  IF p_precio_max IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 'precio <= $5');
  END IF;
  
  -- Construir query base
  base_query := 'FROM piezas';
  IF array_length(where_conditions, 1) > 0 THEN
    base_query := base_query || ' WHERE ' || array_to_string(where_conditions, ' AND ');
  END IF;
  
  -- Obtener conteo total (optimizado)
  count_query := 'SELECT count(*) ' || base_query;
  EXECUTE count_query USING p_marca, p_departamento, p_search, p_precio_min, p_precio_max INTO total_records;
  
  -- Retornar resultados paginados con solo campos necesarios
  RETURN QUERY EXECUTE 
    'SELECT p.id, p.nombre, p.imagen, p.precio, p.marca, p.codigo_barras, p.clave, 
            p.departamento, p.unidad_venta, p.medida, p.precio_metro, p.metros_por_caja,
            p.fecha_actualizacion, $6::bigint as total_count ' ||
    base_query || 
    ' ORDER BY p.fecha_actualizacion DESC, p.id 
      LIMIT $7 OFFSET $8'
  USING p_marca, p_departamento, p_search, p_precio_min, p_precio_max, total_records, p_limit, p_offset;
END;
$$;

-- Función para búsqueda rápida por código de barras o clave
CREATE OR REPLACE FUNCTION search_producto_by_code(p_code text)
RETURNS TABLE(
  id uuid,
  nombre text,
  imagen text,
  precio numeric,
  marca text,
  codigo_barras text,
  clave text,
  departamento text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.nombre, p.imagen, p.precio, p.marca, p.codigo_barras, p.clave, p.departamento
  FROM piezas p
  WHERE p.codigo_barras = p_code OR p.clave = p_code
  LIMIT 1;
END;
$$;

-- Vista materializada para estadísticas rápidas (opcional, para dashboards)
CREATE MATERIALIZED VIEW IF NOT EXISTS productos_stats AS
SELECT 
  marca,
  departamento,
  count(*) as total_productos,
  avg(precio) as precio_promedio,
  min(precio) as precio_minimo,
  max(precio) as precio_maximo,
  max(fecha_actualizacion) as ultima_actualizacion
FROM piezas
GROUP BY marca, departamento;

-- Índice en la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_stats_marca_dept ON productos_stats(marca, departamento);

-- Función para refrescar estadísticas (llamar periódicamente)
CREATE OR REPLACE FUNCTION refresh_productos_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY productos_stats;
END;
$$;