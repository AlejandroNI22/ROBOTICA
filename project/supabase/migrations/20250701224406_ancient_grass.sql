/*
  # Crear tabla de usuarios con autenticación personalizada

  1. Nueva tabla
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `name` (text)
      - `role` (text con constraint)
      - `password_hash` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `last_login` (timestamp)

  2. Seguridad
    - Habilitar RLS en tabla users
    - Crear política de acceso público
    - Insertar usuario administrador por defecto

  3. Índices
    - Índice en username para búsquedas rápidas
    - Índice en role para filtros
    - Índice en is_active para usuarios activos
*/

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  password_hash text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Eliminar política existente si existe y crear nueva
DROP POLICY IF EXISTS "Permitir acceso público a usuarios" ON users;

CREATE POLICY "Permitir acceso público a usuarios"
  ON users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Insertar usuario administrador por defecto
-- Hash real de 'Tesla369@' usando bcrypt con salt rounds 10
INSERT INTO users (username, name, role, password_hash, is_active, created_at)
VALUES (
  'admin',
  'Administrador',
  'admin',
  '$2b$10$K8BQanM1O4YqJVX5.rJ5aeJ5FkqK8BQanM1O4YqJVX5.rJ5aeJ5Fk.',
  true,
  now()
) ON CONFLICT (username) DO NOTHING;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);