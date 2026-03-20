import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, X, Image as ImageIcon, ZoomIn, AlertCircle } from 'lucide-react';

interface GeneratedImage {
  image_url: string;
  generation_id: string;
}

interface ImagePreviewProps {
  images: GeneratedImage[];
  generating: boolean;
  onDownload: (url: string) => void;
  onClear: () => void;
}

const ImagePreview = ({ images, generating, onDownload, onClear }: ImagePreviewProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [hovering, setHovering] = useState(false);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const handleImageLoad = (index: number) => {
    setImageLoaded((prev) => ({ ...prev, [index]: true }));
  };

  if (generating) {
    return (
      <Card className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl p-6">
        <div className="flex flex-col items-center justify-center py-12 space-y-5">
          {/* Animated skeleton that looks like an image loading */}
          <div className="w-full max-w-[280px] aspect-square rounded-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 dark:from-[#252529] dark:via-[#2a2a2f] dark:to-[#252529] animate-pulse relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,92,2,0.08) 50%, transparent 100%)',
                animation: 'shimmer 1.8s ease-in-out infinite',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Generando imagenes...</p>
            <p className="text-xs text-gray-400 dark:text-gray-600">Esto puede tomar unos segundos</p>
          </div>
          {/* Animated dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#ff5c02]"
                style={{
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  opacity: 0.4,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.3; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.1); }
            }
          `}</style>
        </div>
      </Card>
    );
  }

  if (images.length > 0) {
    const currentImage = images[selectedIndex] || images[0];
    const currentIndex = images[selectedIndex] ? selectedIndex : 0;
    const hasError = imageErrors[currentIndex];

    return (
      <div className="space-y-3">
        {/* Main selected image */}
        <Card className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 shadow-md dark:shadow-none rounded-2xl overflow-hidden">
          <div className="p-3 space-y-3">
            <div
              className="relative rounded-xl overflow-hidden bg-gray-50 dark:bg-[#0f0f11]"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              {hasError ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-red-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Error al cargar la imagen</p>
                    <p className="text-xs mt-1 text-gray-400">La URL puede haber expirado</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Loading skeleton shown until image loads */}
                  {!imageLoaded[currentIndex] && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#252529] dark:to-[#2a2a2f] animate-pulse flex items-center justify-center z-10">
                      <ImageIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  <img
                    src={currentImage.image_url}
                    alt={`Imagen generada ${currentIndex + 1}`}
                    className="w-full max-h-[520px] object-contain rounded-xl transition-transform duration-300 ease-out"
                    style={{
                      transform: hovering ? 'scale(1.02)' : 'scale(1)',
                      opacity: imageLoaded[currentIndex] ? 1 : 0,
                      transition: 'opacity 0.4s ease, transform 0.3s ease',
                    }}
                    onError={() => handleImageError(currentIndex)}
                    onLoad={() => handleImageLoad(currentIndex)}
                  />
                  {/* Zoom indicator on hover */}
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200"
                    style={{ opacity: hovering && imageLoaded[currentIndex] ? 1 : 0 }}
                  >
                    <div className="bg-black/40 backdrop-blur-sm rounded-full p-3">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </>
              )}
              {/* Counter badge */}
              {images.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onDownload(currentImage.image_url)}
                className="flex-1 bg-[#ff5c02] text-white hover:bg-[#e55200] shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </Button>
              <Button
                onClick={onClear}
                variant="outline"
                size="icon"
                className="text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Thumbnails grid */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, index) => {
              const thumbError = imageErrors[index];
              return (
                <div
                  key={img.generation_id || index}
                  onClick={() => setSelectedIndex(index)}
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    index === selectedIndex
                      ? 'border-[#ff5c02] ring-2 ring-[#ff5c02]/20 shadow-md scale-[1.03]'
                      : 'border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20 hover:shadow-sm hover:scale-[1.02]'
                  }`}
                >
                  {thumbError ? (
                    <div className="w-full aspect-square bg-gray-100 dark:bg-[#252529] flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-300" />
                    </div>
                  ) : (
                    <img
                      src={img.image_url}
                      alt={`Opcion ${index + 1}`}
                      className="w-full aspect-square object-cover transition-opacity duration-300"
                      onError={() => handleImageError(index)}
                      onLoad={() => handleImageLoad(index)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl p-6">
      <div className="flex flex-col items-center justify-center py-14 space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-2xl flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-[#ff5c02]/60" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-gray-500">Tus imagenes generadas apareceran aqui</p>
          <p className="text-xs text-gray-400">Se generaran 4 opciones para elegir</p>
        </div>
      </div>
    </Card>
  );
};

export default ImagePreview;
