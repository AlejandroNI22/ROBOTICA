/*
  # Add PostgreSQL functions for optimized product operations

  1. Functions
    - `get_productos_paginated` - Efficient pagination with filters
    - `search_producto_by_code` - Fast product lookup by barcode or code

  2. Performance
    - Uses proper indexing for fast queries
    - Supports full-text search in Spanish
    - Returns total count for pagination UI
*/

-- Drop existing functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS get_productos_paginated(text,text,text,numeric,numeric,integer,integer);
DROP FUNCTION IF EXISTS search_producto_by_code(text);

-- Function to get paginated products with filters
CREATE OR REPLACE FUNCTION get_productos_paginated(
    p_marca TEXT DEFAULT NULL,
    p_departamento TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_precio_min NUMERIC DEFAULT NULL,
    p_precio_max NUMERIC DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    descripcion TEXT,
    imagen TEXT,
    precio NUMERIC,
    marca TEXT,
    codigo_barras TEXT,
    clave TEXT,
    departamento TEXT,
    unidad_venta TEXT,
    medida TEXT,
    precio_metro NUMERIC,
    metros_por_caja NUMERIC,
    fecha_creacion TIMESTAMPTZ,
    fecha_actualizacion TIMESTAMPTZ,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    search_query TEXT;
BEGIN
    -- Prepare search query for tsvector
    IF p_search IS NOT NULL AND p_search != '' THEN
        search_query := REPLACE(p_search, ' ', ' & ');
    END IF;

    RETURN QUERY
    WITH filtered_piezas AS (
        SELECT
            piezas.*,
            COUNT(*) OVER() AS full_count
        FROM
            piezas
        WHERE
            (p_marca IS NULL OR piezas.marca = p_marca)
            AND (p_departamento IS NULL OR piezas.departamento = p_departamento)
            AND (p_search IS NULL OR p_search = '' OR 
                 to_tsvector('spanish', piezas.nombre || ' ' || 
                            COALESCE(piezas.descripcion, '') || ' ' || 
                            COALESCE(piezas.codigo_barras, '') || ' ' || 
                            COALESCE(piezas.clave, '')) @@ to_tsquery('spanish', search_query))
            AND (p_precio_min IS NULL OR piezas.precio >= p_precio_min)
            AND (p_precio_max IS NULL OR piezas.precio <= p_precio_max)
    )
    SELECT
        fp.id,
        fp.nombre,
        fp.descripcion,
        fp.imagen,
        fp.precio,
        fp.marca,
        fp.codigo_barras,
        fp.clave,
        fp.departamento,
        fp.unidad_venta,
        fp.medida,
        fp.precio_metro,
        fp.metros_por_caja,
        fp.fecha_creacion,
        fp.fecha_actualizacion,
        fp.full_count
    FROM
        filtered_piezas fp
    ORDER BY
        fp.fecha_actualizacion DESC, fp.id
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to search for a product by code (barcode or clave)
CREATE OR REPLACE FUNCTION search_producto_by_code(
    p_code TEXT
)
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    descripcion TEXT,
    imagen TEXT,
    precio NUMERIC,
    marca TEXT,
    codigo_barras TEXT,
    clave TEXT,
    departamento TEXT,
    unidad_venta TEXT,
    medida TEXT,
    precio_metro NUMERIC,
    metros_por_caja NUMERIC,
    fecha_creacion TIMESTAMPTZ,
    fecha_actualizacion TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        piezas.id,
        piezas.nombre,
        piezas.descripcion,
        piezas.imagen,
        piezas.precio,
        piezas.marca,
        piezas.codigo_barras,
        piezas.clave,
        piezas.departamento,
        piezas.unidad_venta,
        piezas.medida,
        piezas.precio_metro,
        piezas.metros_por_caja,
        piezas.fecha_creacion,
        piezas.fecha_actualizacion
    FROM
        piezas
    WHERE
        piezas.codigo_barras = p_code OR piezas.clave = p_code
    ORDER BY
        piezas.fecha_actualizacion DESC
    LIMIT 1;
END;
$$;

-- Add additional indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_piezas_marca_departamento ON piezas(marca, departamento);
CREATE INDEX IF NOT EXISTS idx_piezas_marca_precio ON piezas(marca, precio);
CREATE INDEX IF NOT EXISTS idx_piezas_departamento_precio ON piezas(departamento, precio);
CREATE INDEX IF NOT EXISTS idx_piezas_fecha_desc ON piezas(fecha_actualizacion DESC, id);

-- Partial indexes for better performance on non-null values
CREATE INDEX IF NOT EXISTS idx_piezas_codigo_barras_partial ON piezas(codigo_barras) WHERE codigo_barras IS NOT NULL AND codigo_barras != '';
CREATE INDEX IF NOT EXISTS idx_piezas_clave_partial ON piezas(clave) WHERE clave IS NOT NULL AND clave != '';

-- Combined search index for full-text search
CREATE INDEX IF NOT EXISTS idx_piezas_search_combined ON piezas USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '') || ' ' || COALESCE(clave, '') || ' ' || COALESCE(codigo_barras, '')));