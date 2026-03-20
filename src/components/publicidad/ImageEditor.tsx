import React, { useState, useCallback, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSeedImages } from '@/hooks/useSeedImages';

interface ImageEditorProps {
  baseImage: string | null;
  onBaseImageChange: (value: string | null) => void;
  instructions: string;
  onInstructionsChange: (value: string) => void;
  selectedAdSeedIds: string[];
  onAdSeedIdsChange: (ids: string[]) => void;
}

const ImageEditor = ({
  baseImage,
  onBaseImageChange,
  instructions,
  onInstructionsChange,
  selectedAdSeedIds,
  onAdSeedIdsChange,
}: ImageEditorProps) => {
  const { toast } = useToast();
  const { seedImages } = useSeedImages('advertising');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Tipo de archivo no valido',
        description: 'Solo se permiten archivos JPG, PNG y WEBP.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Archivo muy grande',
        description: 'El archivo debe ser menor a 5MB.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onBaseImageChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const toggleAdSeed = (id: string) => {
    if (selectedAdSeedIds.includes(id)) {
      onAdSeedIdsChange(selectedAdSeedIds.filter((s) => s !== id));
    } else {
      onAdSeedIdsChange([...selectedAdSeedIds, id]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Imagen base</Label>
        {baseImage ? (
          <div className="relative w-full max-w-md group">
            <img
              src={baseImage}
              alt="Base"
              className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              onClick={() => onBaseImageChange(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
              dragActive
                ? 'border-[#ff5c02] bg-[#ff5c02]/5 scale-[1.01]'
                : 'border-gray-300 hover:border-[#ff5c02]/50 hover:bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
            />
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#ff5c02]/10 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-[#ff5c02]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Arrastra una imagen o haz clic para seleccionar</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG o WEBP (max. 5MB)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Instrucciones de edicion</Label>
        <Textarea
          value={instructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          placeholder="Ej: Cambiar fondo a playa, agregar luz calida..."
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">Fondos de referencia</Label>
          {selectedAdSeedIds.length > 0 && (
            <span className="text-xs text-[#ff5c02] font-medium">
              {selectedAdSeedIds.length} seleccionados
            </span>
          )}
        </div>
        {seedImages.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">No hay imagenes de publicidad disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
            {seedImages.map((seed) => {
              const isSelected = selectedAdSeedIds.includes(seed.id);
              return (
                <div
                  key={seed.id}
                  className="relative group"
                >
                  <div
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                      isSelected
                        ? 'border-[#ff5c02] ring-2 ring-[#ff5c02]/20 scale-95'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleAdSeed(seed.id)}
                  >
                    <img src={seed.image_url} alt={seed.name} className="w-full aspect-square object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#ff5c02]/20 flex items-center justify-center">
                        <div className="w-5 h-5 bg-[#ff5c02] rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {seed.name}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;
