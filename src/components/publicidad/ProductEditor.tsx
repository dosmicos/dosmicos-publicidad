import React, { useState, useCallback, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, Plus, ShoppingBag, User, Baby, Users, Heart, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ProductPreset {
  id: string;
  name: string;
  icon: string;
  prompt: string;
}

// Bump this version whenever default prompts are updated — forces localStorage refresh
export const PRESETS_VERSION = 2;

export const DEFAULT_PRODUCT_PRESETS: ProductPreset[] = [
  {
    id: 'solo-product',
    name: 'Solo producto',
    icon: 'product',
    prompt: 'Transform this into a premium e-commerce product photo. Remove the existing background completely and replace it with a pure clean white seamless studio backdrop. Keep the product exactly as it is with every detail, texture, color and shape perfectly preserved. Add professional studio lighting with a soft key light from the upper left, fill light from the right, and a subtle rim light to separate the product from the background. Add a very soft natural shadow beneath the product on the white surface. The product must be perfectly centered, sharp, and in crisp focus. Ultra high quality, 8K commercial product photography, no text, no watermarks, no logos added.',
  },
  {
    id: 'child-product',
    name: 'Nino/nina con producto',
    icon: 'baby',
    prompt: 'Create a heartwarming commercial lifestyle photograph featuring an adorable happy child (3-5 years old) naturally interacting with and using the exact product shown in the uploaded image. The product must look identical to the original - same colors, shape, design, and all details preserved perfectly. Place them in a bright, warm, naturally lit playroom or living room environment with soft bokeh background. The child should have a genuine joyful expression, looking natural and not posed. Soft golden hour window lighting, shallow depth of field with the child and product in sharp focus. Professional family brand advertising photography style, warm color tones, high-end commercial quality. No text, no watermarks.',
  },
  {
    id: 'adult-product',
    name: 'Adulto con producto',
    icon: 'adult',
    prompt: 'Create a high-end commercial photograph featuring an attractive adult model (25-35 years old) confidently and naturally using or holding the exact product shown in the uploaded image. The product must be perfectly preserved with all its original details, colors, textures and design intact. Place the scene in a modern, aspirational lifestyle environment - a stylish apartment, trendy cafe, or contemporary workspace with soft natural lighting. The model should look authentic and relatable with a natural confident expression. Professional fashion-commercial hybrid photography style, shallow depth of field, product clearly visible and in sharp focus alongside the model. Warm natural tones, magazine-quality advertising photo. No text, no watermarks.',
  },
  {
    id: 'mother-child',
    name: 'Madre e hijo',
    icon: 'family',
    prompt: 'Create an emotionally compelling commercial photograph showing a beautiful young mother and her small child (2-4 years old) sharing a tender moment together while naturally interacting with the exact product from the uploaded image. The product must retain all its original details, colors, and design perfectly. Set the scene in a cozy, warm home environment - a sunlit living room or bedroom with soft furnishings. Both should have genuine, loving expressions showing real emotional connection. Soft golden hour lighting streaming through windows, warm color palette, shallow depth of field. The product should be naturally integrated into their interaction, clearly visible. High-end family lifestyle brand photography, emotionally resonant, advertisement quality. No text, no watermarks.',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    icon: 'lifestyle',
    prompt: 'Create a stunning Instagram-worthy lifestyle flat lay or styled product scene featuring the exact product from the uploaded image as the hero centerpiece. The product must be perfectly preserved with all original details, colors, textures and branding intact. Arrange it in a beautifully curated aesthetic composition surrounded by complementary lifestyle props (fresh flowers, textured fabrics, artisanal items, natural elements like eucalyptus or dried flowers) on a premium surface - marble, light wood, or linen. Shot from directly above (flat lay) or at a 45-degree angle. Soft diffused natural lighting, warm earthy and neutral tones with subtle pops of color. Professional content creator photography style, editorial quality, highly aesthetic. No text, no watermarks.',
  },
  {
    id: 'couple',
    name: 'Pareja',
    icon: 'couple',
    prompt: 'Create a romantic and aspirational commercial photograph featuring a happy young couple (25-35 years old) naturally enjoying and using the exact product shown in the uploaded image together. The product must retain all its original details, colors, and design perfectly. Set the scene in a beautiful romantic setting - a cozy home evening, scenic outdoor location, or stylish restaurant with warm ambient lighting. The couple should show genuine chemistry and natural interaction, laughing or sharing a tender moment with the product integrated naturally into the scene. Golden hour or warm artificial lighting, cinematic shallow depth of field, the product clearly visible and in focus. High-end lifestyle brand advertising photography, warm inviting tones, aspirational feel. No text, no watermarks.',
  },
];

const PRESET_ICONS: Record<string, React.ReactNode> = {
  product: <ShoppingBag className="w-5 h-5" />,
  baby: <Baby className="w-5 h-5" />,
  adult: <User className="w-5 h-5" />,
  family: <Users className="w-5 h-5" />,
  lifestyle: <ImageIcon className="w-5 h-5" />,
  couple: <Heart className="w-5 h-5" />,
};

interface ProductEditorProps {
  productImages: string[];
  onProductImagesChange: (images: string[]) => void;
  selectedPresetId: string | null;
  onPresetSelect: (preset: ProductPreset) => void;
  presets: ProductPreset[];
  editablePrompt?: string;
  onPromptChange?: (prompt: string) => void;
}

// Compress image using Canvas to keep base64 payload small for the API
const compressImage = (file: File, maxDimension = 1536, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, width, height);

      // Always output as JPEG for smaller base64
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));

    const reader = new FileReader();
    reader.onloadend = () => { img.src = reader.result as string; };
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsDataURL(file);
  });
};

const ProductEditor = ({
  productImages,
  onProductImagesChange,
  selectedPresetId,
  onPresetSelect,
  presets,
  editablePrompt,
  onPromptChange,
}: ProductEditorProps) => {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Tipo de archivo no valido', description: 'Solo JPG, PNG y WEBP.', variant: 'destructive' });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'Archivo muy grande', description: 'Maximo 20MB por imagen.', variant: 'destructive' });
      return;
    }

    try {
      setCompressing(true);
      // Compress to max 1536px and JPEG quality 0.85 — keeps base64 under ~500KB
      const compressed = await compressImage(file, 1536, 0.85);
      onProductImagesChange([...productImages, compressed]);
    } catch (err: any) {
      toast({ title: 'Error procesando imagen', description: err.message || 'Intenta con otra imagen.', variant: 'destructive' });
    } finally {
      setCompressing(false);
    }
  };

  const handleMultipleFiles = (files: FileList) => {
    Array.from(files).forEach(handleFileSelect);
  };

  const removeImage = (index: number) => {
    onProductImagesChange(productImages.filter((_, i) => i !== index));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleMultipleFiles(e.dataTransfer.files);
  }, [productImages]);

  const activePresets = presets.length > 0 ? presets : DEFAULT_PRODUCT_PRESETS;

  return (
    <div className="space-y-5">
      {/* Step 1: Upload product photos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#ff5c02] text-white text-xs font-bold flex items-center justify-center">1</div>
            <Label className="text-sm font-semibold">Sube tus fotos de producto</Label>
          </div>
          {productImages.length > 0 && (
            <span className="text-xs text-gray-400">{productImages.length} foto{productImages.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Image grid + upload */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {productImages.map((img, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
              <img src={img} alt={`Producto ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Upload button */}
          <div
            className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragActive
                ? 'border-[#ff5c02] bg-[#ff5c02]/5'
                : 'border-gray-300 dark:border-white/15 hover:border-[#ff5c02]/50 hover:bg-gray-50 dark:hover:bg-white/5'
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
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                if (e.target.files?.length) handleMultipleFiles(e.target.files);
              }}
            />
            {compressing ? (
              <Loader2 className="w-5 h-5 text-[#ff5c02] animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-[10px] text-gray-400 mt-1">{compressing ? 'Procesando...' : 'Agregar'}</span>
          </div>
        </div>
      </div>

      {/* Step 2: Select style preset */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#ff5c02] text-white text-xs font-bold flex items-center justify-center">2</div>
          <Label className="text-sm font-semibold">Elige el estilo de foto</Label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {activePresets.map((preset) => {
            const isActive = selectedPresetId === preset.id;
            const icon = PRESET_ICONS[preset.icon] || <ImageIcon className="w-5 h-5" />;
            return (
              <button
                key={preset.id}
                onClick={() => onPresetSelect(preset)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-[#ff5c02]/5 dark:bg-[#ff5c02]/10 border-[#ff5c02]/40 text-[#ff5c02]'
                    : 'bg-white dark:bg-[#1a1a1f] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/15 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-[#ff5c02]/15' : 'bg-gray-100 dark:bg-[#252529]'
                }`}>
                  {icon}
                </div>
                <span className="text-xs font-semibold leading-tight">{preset.name}</span>
              </button>
            );
          })}
        </div>

        {selectedPresetId && editablePrompt !== undefined && (
          <div className="space-y-1.5">
            <Label className="text-[11px] text-gray-400">Prompt (puedes editarlo antes de generar):</Label>
            <textarea
              value={editablePrompt}
              onChange={(e) => onPromptChange?.(e.target.value)}
              rows={4}
              className="w-full text-[11px] text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#0f0f11] rounded-lg px-3 py-2 border border-gray-200 dark:border-white/10 resize-y leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#ff5c02]/30 focus:border-[#ff5c02]/40"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductEditor;
