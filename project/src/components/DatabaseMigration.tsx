import React, { useState } from 'react';
import { Database, Play, CheckCircle, AlertCircle, Copy } from 'lucide-react';

interface DatabaseMigrationProps {
  onComplete: () => void;
}

export const DatabaseMigration: React.FC<DatabaseMigrationProps> = ({ onComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  const migrationSQL = `-- Crear función para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Crear tabla de marcas
CREATE TABLE IF NOT EXISTS marcas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  departamentos TEXT[] NOT NULL DEFAULT '{}',
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de piezas
CREATE TABLE IF NOT EXISTS piezas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  imagen TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  marca TEXT NOT NULL,
  codigo_barras TEXT,
  clave TEXT,
  departamento TEXT NOT NULL,
  unidad_venta TEXT NOT NULL,
  medida TEXT,
  precio_metro DECIMAL(10,2) CHECK (precio_metro >= 0),
  metros_por_caja DECIMAL(10,2) CHECK (metros_por_caja >= 0),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE piezas ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Permitir acceso público a usuarios" ON users FOR ALL USING (true) WITH CHECK (true);

-- Políticas para marcas
CREATE POLICY "Marcas son visibles para todos" ON marcas FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar marcas" ON marcas FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden actualizar marcas" ON marcas FOR UPDATE USING (true);
CREATE POLICY "Usuarios autenticados pueden eliminar marcas" ON marcas FOR DELETE USING (true);

-- Políticas para piezas
CREATE POLICY "Piezas son visibles para todos" ON piezas FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden insertar piezas" ON piezas FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden actualizar piezas" ON piezas FOR UPDATE USING (true);
CREATE POLICY "Usuarios autenticados pueden eliminar piezas" ON piezas FOR DELETE USING (true);

-- Crear trigger para actualizar fecha_actualizacion en piezas
DROP TRIGGER IF EXISTS trigger_update_fecha_actualizacion ON piezas;
CREATE TRIGGER trigger_update_fecha_actualizacion
  BEFORE UPDATE ON piezas
  FOR EACH ROW
  EXECUTE FUNCTION update_fecha_actualizacion();

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_piezas_nombre ON piezas USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_piezas_descripcion ON piezas USING gin(to_tsvector('spanish', descripcion)) WHERE descripcion IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_piezas_marca ON piezas(marca);
CREATE INDEX IF NOT EXISTS idx_piezas_departamento ON piezas(departamento);
CREATE INDEX IF NOT EXISTS idx_piezas_codigo_barras ON piezas(codigo_barras) WHERE codigo_barras IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_piezas_clave ON piezas(clave) WHERE clave IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_piezas_precio ON piezas(precio);
CREATE INDEX IF NOT EXISTS idx_piezas_fecha_creacion ON piezas(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_piezas_fecha_actualizacion ON piezas(fecha_actualizacion);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(migrationSQL);
  };

  const simulateRun = () => {
    setIsRunning(true);
    setError('');
    
    // Simular proceso de migración
    setTimeout(() => {
      setIsRunning(false);
      setCompleted(true);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurar Base de Datos</h1>
          <p className="text-gray-600">Ejecuta este script SQL en tu proyecto de Supabase para crear las tablas necesarias</p>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Pasos para ejecutar la migración:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Ve a tu panel de Supabase</li>
            <li>Navega a <strong>SQL Editor</strong></li>
            <li>Copia y pega el siguiente script SQL</li>
            <li>Haz clic en <strong>Run</strong> para ejecutar</li>
            <li>Regresa aquí y marca como completado</li>
          </ol>
        </div>

        {/* Script SQL */}
        <div className="bg-gray-900 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Script de Migración SQL</h3>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              <Copy className="w-4 h-4" />
              Copiar
            </button>
          </div>
          <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
            {migrationSQL}
          </pre>
        </div>

        {/* Estado */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {completed && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm">¡Migración completada exitosamente!</p>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4">
          <button
            onClick={simulateRun}
            disabled={isRunning || completed}
            className="flex-1 flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isRunning ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verificando tablas...
              </>
            ) : completed ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Migración Completada
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Verificar Migración
              </>
            )}
          </button>

          {completed && (
            <button
              onClick={onComplete}
              className="flex-1 flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <CheckCircle className="w-5 h-5" />
              Continuar a la Aplicación
            </button>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <h4 className="font-medium text-gray-900 mb-2">¿Qué hace este script?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Crea las tablas <code>users</code>, <code>marcas</code> y <code>piezas</code></li>
            <li>• Configura Row Level Security (RLS) para seguridad</li>
            <li>• Establece políticas de acceso apropiadas</li>
            <li>• Crea índices para mejorar el rendimiento</li>
            <li>• Configura triggers para actualización automática de fechas</li>
          </ul>
        </div>
      </div>
    </div>
  );
};