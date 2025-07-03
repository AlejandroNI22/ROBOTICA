/*
  # Agregar campo imagen a tabla marcas

  1. Cambios
    - Agregar columna `imagen` a la tabla `marcas`
    - La columna es opcional (nullable)
    - Permite almacenar URLs de imágenes o datos base64

  2. Seguridad
    - Mantener las políticas existentes
    - No requiere cambios en RLS
*/

-- Agregar columna imagen a la tabla marcas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marcas' AND column_name = 'imagen'
  ) THEN
    ALTER TABLE marcas ADD COLUMN imagen TEXT;
  END IF;
END $$;

-- Comentario en la nueva columna
COMMENT ON COLUMN marcas.imagen IS 'URL de la imagen representativa de la marca';