import React, { useState } from 'react';
import { Database, Settings, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface SupabaseSetupProps {
  onComplete: (url: string, key: string) => void;
}

export const SupabaseSetup: React.FC<SupabaseSetupProps> = ({ onComplete }) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const validateAndSave = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setError('Por favor completa ambos campos');
      return;
    }

    if (!supabaseUrl.includes('supabase.co')) {
      setError('La URL debe ser de Supabase (debe contener "supabase.co")');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Validar la conexión
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (response.ok) {
        onComplete(supabaseUrl, supabaseKey);
      } else {
        setError('No se pudo conectar con Supabase. Verifica tus credenciales.');
      }
    } catch (err) {
      setError('Error de conexión. Verifica la URL y la clave.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conectar Supabase</h1>
          <p className="text-gray-600">Configura tu base de datos para comenzar a usar la aplicación</p>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Pasos para obtener tus credenciales:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Ve a tu <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">panel de Supabase <ExternalLink className="w-3 h-3" /></a></li>
            <li>Selecciona tu proyecto</li>
            <li>Ve a <strong>Settings → API</strong></li>
            <li>Copia la <strong>Project URL</strong> y la <strong>anon public key</strong></li>
          </ol>
        </div>

        {/* Formulario */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project URL *
            </label>
            <input
              type="url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://tu-proyecto.supabase.co"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              disabled={isValidating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anon Key *
            </label>
            <textarea
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              disabled={isValidating}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={validateAndSave}
            disabled={isValidating || !supabaseUrl.trim() || !supabaseKey.trim()}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isValidating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Validando conexión...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Conectar Supabase
              </>
            )}
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <h4 className="font-medium text-gray-900 mb-2">¿Necesitas ayuda?</h4>
          <p className="text-sm text-gray-600 mb-3">
            Si es tu primera vez usando Supabase, necesitarás crear las tablas de la base de datos.
          </p>
          <a
            href="https://supabase.com/docs/guides/getting-started"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            Ver documentación de Supabase
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};