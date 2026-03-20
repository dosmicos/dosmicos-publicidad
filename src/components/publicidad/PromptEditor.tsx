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
import { MessageSquare, BookOpen } from 'lucide-react';
import { useSavedPrompts } from '@/hooks/useSavedPrompts';
import { useSeedImages } from '@/hooks/useSeedImages';

interface PromptEditorProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  selectedSeedIds: string[];
  onSeedIdsChange: (ids: string[]) => void;
}

const PromptEditor = ({
  prompt,
  onPromptChange,
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

  return (
    <div className="space-y-5">
      {/* Saved prompts quick load */}
      {savedPrompts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-gray-400" />
            <Label className="text-xs font-medium text-gray-500 dark:text-gray-500">Cargar prompt guardado</Label>
          </div>
          <Select onValueChange={handleSavedPromptSelect}>
            <SelectTrigger className="h-9 text-sm border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0f0f11]">
              <SelectValue placeholder="Seleccionar prompt..." />
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
      )}

      {/* Prompt textarea */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-[#ff5c02]" />
          <Label className="text-sm font-medium">Describe tu imagen</Label>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Ej: Producto de skincare sobre una mesa de marmol blanco, luz natural suave lateral, fondo minimalista beige, fotografia editorial de alta calidad..."
          rows={5}
          className="resize-none text-sm leading-relaxed"
        />
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-gray-400">Se mas especifico para mejores resultados</p>
          <p className="text-[11px] text-gray-400">{prompt.length} caracteres</p>
        </div>
      </div>

      {/* Reference images */}
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
          <div className="text-center py-4 bg-gray-50 dark:bg-[#0f0f11] rounded-lg border border-dashed border-gray-200 dark:border-white/10">
            <p className="text-xs text-gray-400">No hay imagenes semilla. Agregalas en Ajustes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
            {seedImages.map((seed) => {
              const isSelected = selectedSeedIds.includes(seed.id);
              return (
                <div key={seed.id} className="relative group">
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
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {seed.name}
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
