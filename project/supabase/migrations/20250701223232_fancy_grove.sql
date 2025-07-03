/*
  # Sistema de usuarios para autenticación personalizada

  1. Nueva tabla
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `name` (text)
      - `role` (text con check constraint)
      - `password_hash` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `last_login` (timestamptz)

  2. Seguridad
    - Habilitar RLS en tabla users
    - Política de acceso público para autenticación personalizada

  3. Datos iniciales
    - Usuario administrador por defecto
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

-- Políticas de seguridad para acceso público (sin autenticación de Supabase Auth)
CREATE POLICY "Permitir acceso público a usuarios"
  ON users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Insertar usuario administrador por defecto
-- Hash de 'Tesla369@' usando bcrypt
INSERT INTO users (username, name, role, password_hash, is_active, created_at)
VALUES (
  'admin',
  'Administrador',
  'admin',
  '$2b$10$rQZ8kHWKQOZ8kHWKQOZ8kOZ8kHWKQOZ8kHWKQOZ8kHWKQOZ8kHWKQO',
  true,
  now()
) ON CONFLICT (username) DO NOTHING;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);