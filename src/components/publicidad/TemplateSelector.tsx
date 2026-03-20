import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { useAiTemplates } from '@/hooks/useAiTemplates';

interface TemplateSelectorProps {
  onSelect: (template: any) => void;
  selectedTemplateId: string | null;
}

const TemplateSelector = ({ onSelect, selectedTemplateId }: TemplateSelectorProps) => {
  const { templates, loading } = useAiTemplates();

  const productTemplates = templates.filter((t) => t.category === 'product');
  const adTemplates = templates.filter((t) => t.category === 'advertising');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-[#2a2a2f] rounded w-24 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-white/10 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-[#2a2a2f] rounded w-3/4 mb-3" />
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-100 dark:bg-[#252529] rounded-full w-10" />
                  <div className="h-5 bg-gray-100 dark:bg-[#252529] rounded-full w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderTemplateGrid = (templateList: any[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {templateList.map((template) => {
        const isSelected = selectedTemplateId === template.id;
        return (
          <Card
            key={template.id}
            className={`relative p-4 cursor-pointer transition-all duration-200 rounded-xl ${
              isSelected
                ? 'border-2 border-[#ff5c02] bg-[#ff5c02]/5 shadow-md ring-2 ring-[#ff5c02]/10'
                : 'border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-sm dark:hover:shadow-none hover:bg-gray-50/50 dark:hover:bg-white/5'
            }`}
            onClick={() => onSelect(template)}
          >
            {/* Selected check indicator */}
            {isSelected && (
              <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#ff5c02] rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
            <div className="space-y-2.5">
              <h4 className={`text-sm font-semibold pr-6 ${isSelected ? 'text-[#ff5c02]' : 'text-gray-900 dark:text-gray-100'}`}>
                {template.name}
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs ${isSelected ? 'border-[#ff5c02]/30 text-[#ff5c02]' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  {template.resolution || '1K'}
                </Badge>
                {template.dimensions && (
                  <Badge
                    variant="secondary"
                    className={`text-xs ${isSelected ? 'bg-[#ff5c02]/10 text-[#ff5c02]' : 'bg-gray-100 dark:bg-[#252529] text-gray-600 dark:text-gray-400'}`}
                  >
                    {template.dimensions}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {productTemplates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-[#ff5c02] rounded-full" />
            <Label className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Producto</Label>
            <span className="text-xs text-gray-400">{productTemplates.length}</span>
          </div>
          {renderTemplateGrid(productTemplates)}
        </div>
      )}

      {adTemplates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-500 rounded-full" />
            <Label className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Publicidad</Label>
            <span className="text-xs text-gray-400">{adTemplates.length}</span>
          </div>
          {renderTemplateGrid(adTemplates)}
        </div>
      )}

      {productTemplates.length === 0 && adTemplates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No hay templates disponibles.</p>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
