import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wand2, Sparkles, LayoutTemplate, PenLine, Pencil, CheckCircle2, Zap, RectangleHorizontal, Square, RectangleVertical, Monitor, Smartphone } from 'lucide-react';
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

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', desc: 'Cuadrado', icon: Square, w: 1, h: 1, use: 'Instagram, perfil' },
  { id: '4:5', label: '4:5', desc: 'Retrato', icon: RectangleVertical, w: 4, h: 5, use: 'Instagram feed' },
  { id: '9:16', label: '9:16', desc: 'Story / Reel', icon: Smartphone, w: 9, h: 16, use: 'Stories, TikTok, Reels' },
  { id: '16:9', label: '16:9', desc: 'Panoramico', icon: Monitor, w: 16, h: 9, use: 'YouTube, banners web' },
  { id: '3:2', label: '3:2', desc: 'Foto clasica', icon: RectangleHorizontal, w: 3, h: 2, use: 'Fotografia, anuncios' },
  { id: '2:3', label: '2:3', desc: 'Pinterest', icon: RectangleVertical, w: 2, h: 3, use: 'Pinterest, posters' },
  { id: '4:3', label: '4:3', desc: 'Estandar', icon: RectangleHorizontal, w: 4, h: 3, use: 'Presentaciones' },
  { id: '21:9', label: '21:9', desc: 'Ultra ancho', icon: RectangleHorizontal, w: 21, h: 9, use: 'Hero banners, cine' },
] as const;

const RESOLUTIONS = [
  { id: '1K', label: '1K', px: '1024px', desc: 'Rapido' },
  { id: '2K', label: '2K', px: '2048px', desc: 'Recomendado' },
  { id: '4K', label: '4K', px: '4096px', desc: 'Alta calidad' },
] as const;

const GenerateWorkspace = ({ reuseData, onReuseConsumed }: GenerateWorkspaceProps) => {
  const { toast } = useToast();
  const { brandGuide, getPromptPrefix } = useBrandGuide();
  const { generate, generating, generatedImages, rateLimitUsed, rateLimitMax, clearImage, downloadImage } =
    useAiGeneration();
  const { skills } = useAiSkills();

  const [mode, setMode] = useState<'template' | 'free' | 'edit'>('template');
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState('2K');
  const [aspectRatio, setAspectRatio] = useState('1:1');
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
      setResolution(skill.resolution || '2K');
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
      let finalPrompt = mode === 'edit' ? editInstructions : prompt;
      const brandPrefix = getPromptPrefix();
      if (brandPrefix) {
        finalPrompt = `${brandPrefix}\n\n${finalPrompt}`;
      }

      // Add aspect ratio to prompt context
      const ratioInfo = ASPECT_RATIOS.find(r => r.id === aspectRatio);
      if (ratioInfo && aspectRatio !== '1:1') {
        finalPrompt = `[Aspect ratio: ${aspectRatio}, ${ratioInfo.desc}]\n${finalPrompt}`;
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
    { key: 'template' as const, label: 'Templates', icon: LayoutTemplate, desc: 'Usa una plantilla predefinida' },
    { key: 'free' as const, label: 'Prompt Libre', icon: PenLine, desc: 'Escribe tu propio prompt' },
    { key: 'edit' as const, label: 'Editar', icon: Pencil, desc: 'Modifica una imagen existente' },
  ];

  const selectedRatio = ASPECT_RATIOS.find(r => r.id === aspectRatio) || ASPECT_RATIOS[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column - Controls */}
      <div className="lg:col-span-2 space-y-5">
        {/* Skill selector - compact */}
        {skills.length > 0 && (
          <div className="flex items-center gap-3">
            <Label className="text-xs text-gray-400 dark:text-gray-600 whitespace-nowrap">Skill</Label>
            <Select value={selectedSkillId} onValueChange={handleSkillSelect}>
              <SelectTrigger className="h-8 text-xs border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0f0f11] max-w-[220px]">
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

        {/* Mode toggle - card style */}
        <div className="grid grid-cols-3 gap-2">
          {modes.map(({ key, label, icon: Icon, desc }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-center transition-all duration-200 border ${
                mode === key
                  ? 'bg-[#ff5c02]/5 dark:bg-[#ff5c02]/10 border-[#ff5c02]/30 text-[#ff5c02]'
                  : 'bg-white dark:bg-[#1a1a1f] border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-white/15'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{label}</span>
              <span className="text-[10px] opacity-60 hidden sm:block">{desc}</span>
            </button>
          ))}
        </div>

        {/* Mode-specific content */}
        <Card className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl p-5">
          {mode === 'template' && (
            <div className="space-y-4">
              <TemplateSelector onSelect={handleTemplateSelect} selectedTemplateId={selectedTemplateId} />
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-gray-400">Personalizacion (opcional)</Label>
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej: fondo azul, luz natural, producto centrado..."
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0f0f11] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff5c02]/20 focus:border-[#ff5c02]/50 transition-all"
                />
              </div>
            </div>
          )}

          {mode === 'free' && (
            <PromptEditor
              prompt={prompt}
              onPromptChange={setPrompt}
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

        {/* Aspect Ratio + Resolution - shared across all modes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Aspect Ratio Selector */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Formato</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {ASPECT_RATIOS.map((ratio) => {
                const isActive = aspectRatio === ratio.id;
                const Icon = ratio.icon;
                // Visual preview proportions (max 32px)
                const maxDim = 24;
                const scale = maxDim / Math.max(ratio.w, ratio.h);
                const pw = Math.round(ratio.w * scale);
                const ph = Math.round(ratio.h * scale);
                return (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all duration-150 border ${
                      isActive
                        ? 'bg-[#ff5c02]/5 dark:bg-[#ff5c02]/10 border-[#ff5c02]/40 text-[#ff5c02]'
                        : 'bg-white dark:bg-[#1a1a1f] border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/15 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    title={`${ratio.label} - ${ratio.use}`}
                  >
                    {/* Mini aspect ratio preview */}
                    <div
                      className={`rounded-sm transition-colors ${
                        isActive ? 'bg-[#ff5c02]/20 border border-[#ff5c02]/30' : 'bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ width: pw, height: ph }}
                    />
                    <span className="text-[10px] font-bold leading-none">{ratio.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-600">
              {selectedRatio.desc} · {selectedRatio.use}
            </p>
          </div>

          {/* Resolution Selector */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Calidad</Label>
            <div className="flex gap-2">
              {RESOLUTIONS.map((res) => {
                const isActive = resolution === res.id;
                return (
                  <button
                    key={res.id}
                    onClick={() => setResolution(res.id)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-lg transition-all duration-150 border ${
                      isActive
                        ? 'bg-[#ff5c02]/5 dark:bg-[#ff5c02]/10 border-[#ff5c02]/40 text-[#ff5c02]'
                        : 'bg-white dark:bg-[#1a1a1f] border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/15'
                    }`}
                  >
                    <span className="text-sm font-bold">{res.label}</span>
                    <span className="text-[10px] opacity-60">{res.px}</span>
                    <span className="text-[9px] opacity-40">{res.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Generate button + brand status */}
        <div className="space-y-2">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate()}
            className={`w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-white font-semibold text-base transition-all duration-200 ${
              canGenerate()
                ? 'bg-gradient-to-r from-[#ff5c02] to-[#ff8534] hover:from-[#e55200] hover:to-[#ff5c02] shadow-md hover:shadow-lg hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30 active:scale-[0.98]'
                : 'bg-gray-200 dark:bg-[#2a2a2f] text-gray-400 dark:text-gray-600 cursor-not-allowed'
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
                <span className="text-xs opacity-70 ml-1">({resolution} · {aspectRatio})</span>
              </>
            )}
          </button>

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
        {/* Rate limit */}
        <div className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 rounded-xl p-3 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#ff5c02]" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Generaciones hoy</span>
            </div>
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              {used} / {max}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-[#252529] rounded-full overflow-hidden">
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
