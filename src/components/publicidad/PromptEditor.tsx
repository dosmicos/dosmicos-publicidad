import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSavedPrompts } from '@/hooks/useSavedPrompts';
import { useSeedImages } from '@/hooks/useSeedImages';

interface PromptEditorProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  resolution: string;
  onResolutionChange: (value: string) => void;
  selectedSeedIds: string[];
  onSeedIdsChange: (ids: string[]) => void;
}

const PromptEditor = ({
  prompt,
  onPromptChange,
  resolution,
  onResolutionChange,
  selectedSeedIds,
  onSeedIdsChange,
}: PromptEditorProps) => {
  const { prompts: savedPrompts } = useSavedPrompts();
  const { seedImages } = useSeedImages('product');

  const handleSavedPromptSelect = (promptId: string) => {
    const selected = savedPrompts.find((p) => p.id === promptId);
    if (selected) {
      onPromptChange(selected.prompt);
    }
  };

  const toggleSeedImage = (id: string) => {
    if (selectedSeedIds.includes(id)) {
      onSeedIdsChange(selectedSeedIds.filter((s) => s !== id));
    } else {
      onSeedIdsChange([...selectedSeedIds, id]);
    }
  };

  const resolutionDescriptions: Record<string, string> = {
    '1K': '1024px',
    '2K': '2048px',
    '4K': '4096px',
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Prompt</Label>
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe la imagen que quieres generar..."
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-gray-400">{prompt.length} caracteres</p>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex-1 space-y-2">
          <Label className="text-sm font-medium">Prompt guardado</Label>
          <Select onValueChange={handleSavedPromptSelect}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Usar un prompt guardado..." />
            </SelectTrigger>
            <SelectContent>
              {savedPrompts.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40 space-y-2">
          <Label className="text-sm font-medium">Resolucion</Label>
          <Select value={resolution} onValueChange={onResolutionChange}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['1K', '2K', '4K'].map((res) => (
                <SelectItem key={res} value={res}>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{res}</span>
                    <span className="text-xs text-gray-400">{resolutionDescriptions[res]}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Imagenes de referencia</Label>
          {selectedSeedIds.length > 0 && (
            <span className="text-xs text-[#ff5c02] font-medium">
              {selectedSeedIds.length} seleccionadas
            </span>
          )}
        </div>
        {seedImages.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 dark:bg-[#0f0f11] rounded-lg">
            <p className="text-sm text-gray-500">No hay imagenes semilla disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
            {seedImages.map((seed) => {
              const isSelected = selectedSeedIds.includes(seed.id);
              return (
                <div
                  key={seed.id}
                  className="relative group"
                >
                  <div
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                      isSelected
                        ? 'border-[#ff5c02] ring-2 ring-[#ff5c02]/20 scale-95'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/15'
                    }`}
                    onClick={() => toggleSeedImage(seed.id)}
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

export default PromptEditor;
