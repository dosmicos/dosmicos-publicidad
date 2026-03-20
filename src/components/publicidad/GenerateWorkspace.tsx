import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wand2, Sparkles, LayoutTemplate, PenLine, Pencil, CheckCircle2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { useAiSkills } from '@/hooks/useAiSkills';
import { useBrandGuide } from '@/hooks/useBrandGuide';
import TemplateSelector from './TemplateSelector';
import PromptEditor from './PromptEditor';
import ImageEditor from './ImageEditor';
import ImagePreview from './ImagePreview';

interface GenerateWorkspaceProps {
  reuseData?: any;
  onReuseConsumed?: () => void;
}

const GenerateWorkspace = ({ reuseData, onReuseConsumed }: GenerateWorkspaceProps) => {
  const { toast } = useToast();
  const { brandGuide, getPromptPrefix } = useBrandGuide();
  const { generate, generating, generatedImages, rateLimitUsed, rateLimitMax, clearImage, downloadImage } =
    useAiGeneration();
  const { skills } = useAiSkills();

  const [mode, setMode] = useState<'template' | 'free' | 'edit'>('template');
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState('1K');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedSeedIds, setSelectedSeedIds] = useState<string[]>([]);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [editInstructions, setEditInstructions] = useState('');
  const [selectedAdSeedIds, setSelectedAdSeedIds] = useState<string[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');

  // Populate state from reuseData
  useEffect(() => {
    if (reuseData) {
      if (reuseData.mode) setMode(reuseData.mode);
      if (reuseData.prompt) setPrompt(reuseData.prompt);
      if (reuseData.resolution) setResolution(reuseData.resolution);
      if (reuseData.template_id) setSelectedTemplateId(reuseData.template_id);
      if (reuseData.seed_image_ids) setSelectedSeedIds(reuseData.seed_image_ids);
      if (reuseData.base_image) setBaseImage(reuseData.base_image);
      if (reuseData.edit_instructions) setEditInstructions(reuseData.edit_instructions);
      if (reuseData.ad_seed_ids) setSelectedAdSeedIds(reuseData.ad_seed_ids);
      onReuseConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reuseData]);

  const handleSkillSelect = (skillId: string) => {
    setSelectedSkillId(skillId);
    const skill = skills.find((s) => s.id === skillId);
    if (skill) {
      setMode(skill.mode || 'template');
      setPrompt(skill.prompt || '');
      setResolution(skill.resolution || '1K');
      setSelectedTemplateId(skill.template_id || null);
      setSelectedSeedIds(skill.seed_image_ids || []);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplateId(template.id);
    if (template.resolution) setResolution(template.resolution);
  };

  const handleGenerate = async () => {
    const currentPrompt = mode === 'edit' ? editInstructions : prompt;
    if (!currentPrompt.trim() && mode !== 'template') {
      toast({
        title: 'Prompt requerido',
        description: 'Debes ingresar un prompt o instrucciones para generar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Inject brand context if available
      let finalPrompt = mode === 'edit' ? editInstructions : prompt;
      const brandPrefix = getPromptPrefix();
      if (brandPrefix) {
        finalPrompt = `${brandPrefix}\n\n${finalPrompt}`;
      }

      const request = {
        mode,
        prompt: finalPrompt,
        resolution,
        seed_image_ids: mode === 'edit' ? selectedAdSeedIds : selectedSeedIds,
        base_image: mode === 'edit' ? baseImage || undefined : undefined,
        template_id: mode === 'template' ? selectedTemplateId || undefined : undefined,
      };
      await generate(request);
    } catch (error: any) {
      toast({
        title: 'Error al generar',
        description: error.message || 'Hubo un problema al generar la imagen.',
        variant: 'destructive',
      });
    }
  };

  const canGenerate = () => {
    if (generating) return false;
    if (mode === 'template') return !!selectedTemplateId;
    if (mode === 'free') return !!prompt.trim();
    if (mode === 'edit') return !!editInstructions.trim();
    return false;
  };

  const used = rateLimitUsed ?? 0;
  const max = rateLimitMax ?? 50;
  const ratioPercent = max > 0 ? Math.min((used / max) * 100, 100) : 0;

  const modes = [
    { key: 'template' as const, label: 'Templates', icon: LayoutTemplate },
    { key: 'free' as const, label: 'Prompt Libre', icon: PenLine },
    { key: 'edit' as const, label: 'Editar', icon: Pencil },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column - Controls */}
      <div className="lg:col-span-2 space-y-5">
        {/* Skill selector - less prominent */}
        {skills.length > 0 && (
          <div className="flex items-center gap-3">
            <Label className="text-xs text-gray-400 whitespace-nowrap">Skill</Label>
            <Select value={selectedSkillId} onValueChange={handleSkillSelect}>
              <SelectTrigger className="h-8 text-xs border-gray-200 bg-gray-50 max-w-[220px]">
                <SelectValue placeholder="Seleccionar skill..." />
              </SelectTrigger>
              <SelectContent>
                {skills.map((skill) => (
                  <SelectItem key={skill.id} value={skill.id}>
                    {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Mode toggle - segmented control */}
        <div className="bg-gray-100 p-1 rounded-xl inline-flex gap-0.5">
          {modes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Mode-specific content */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          {mode === 'template' && (
            <div className="space-y-4">
              <TemplateSelector onSelect={handleTemplateSelect} selectedTemplateId={selectedTemplateId} />
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Personalizacion (opcional)</Label>
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ajustes al template seleccionado..."
                  className="border-gray-200"
                />
              </div>
            </div>
          )}

          {mode === 'free' && (
            <PromptEditor
              prompt={prompt}
              onPromptChange={setPrompt}
              resolution={resolution}
              onResolutionChange={setResolution}
              selectedSeedIds={selectedSeedIds}
              onSeedIdsChange={setSelectedSeedIds}
            />
          )}

          {mode === 'edit' && (
            <ImageEditor
              baseImage={baseImage}
              onBaseImageChange={setBaseImage}
              instructions={editInstructions}
              onInstructionsChange={setEditInstructions}
              selectedAdSeedIds={selectedAdSeedIds}
              onAdSeedIdsChange={setSelectedAdSeedIds}
            />
          )}
        </Card>

        {/* Generate button + brand guide badge */}
        <div className="space-y-3">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate()}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-base transition-all duration-200 ${
              canGenerate()
                ? 'bg-gradient-to-r from-[#ff5c02] to-[#ff8534] hover:from-[#e55200] hover:to-[#ff5c02] shadow-md hover:shadow-lg hover:shadow-orange-200/50 active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {generating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generar Imagen
              </>
            )}
          </button>

          {/* Brand guide badge - integrated inline */}
          {brandGuide?.extraction_status === 'complete' ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Guia de marca aplicada</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>Sin guia de marca</span>
            </div>
          )}
        </div>
      </div>

      {/* Right column - Preview & Rate limit */}
      <div className="space-y-4">
        {/* Rate limit as progress bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#ff5c02]" />
              <span className="text-xs font-medium text-gray-600">Generaciones hoy</span>
            </div>
            <span className="text-xs font-semibold text-gray-800">
              {used} / {max}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${ratioPercent}%`,
                background:
                  ratioPercent > 80
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(90deg, #ff5c02, #ff8534)',
              }}
            />
          </div>
          {ratioPercent > 80 && (
            <p className="text-[10px] text-amber-600 mt-1.5">Acercandote al limite diario</p>
          )}
        </div>

        <ImagePreview
          images={generatedImages}
          generating={generating}
          onDownload={(url) => downloadImage(url)}
          onClear={clearImage}
        />
      </div>
    </div>
  );
};

export default GenerateWorkspace;
