import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  placeholder?: React.ReactNode;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  onLoad,
  placeholder,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Cargar imágenes 50px antes de que sean visibles
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    console.error('Error cargando imagen:', src);
    setHasError(true);
    setIsLoaded(false);
  };

  const handleRetry = () => {
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      setHasError(false);
      setIsLoaded(false);
      
      // Forzar recarga de la imagen
      if (imgRef.current) {
        imgRef.current.src = '';
        setTimeout(() => {
          if (imgRef.current) {
            imgRef.current.src = src;
          }
        }, 100);
      }
    }
  };

  // Detectar si es un enlace de Google Drive
  const isGoogleDriveLink = src.includes('drive.google.com');

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {(!isInView || !isLoaded || hasError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {hasError ? (
            <div className="text-center p-4">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
              <p className="text-sm text-red-600 mb-2">Error al cargar imagen</p>
              {isGoogleDriveLink && (
                <div className="text-xs text-gray-500 mb-3">
                  <p>Verifica que la imagen de Google Drive:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Tenga permisos públicos</li>
                    <li>Sea un enlace directo válido</li>
                  </ul>
                </div>
              )}
              {retryCount < 2 && (
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors mx-auto"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reintentar ({retryCount + 1}/3)
                </button>
              )}
            </div>
          ) : placeholder ? (
            placeholder
          ) : (
            <div className="text-gray-400 text-center">
              <ImageIcon className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">
                {!isInView ? 'Cargando...' : isGoogleDriveLink ? 'Cargando desde Google Drive...' : 'Cargando...'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};