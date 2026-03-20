import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles, Wand2, Loader2, Palette, Type, Eye,
  RefreshCw, Save, Check, X, MessageSquare, Shield,
  Copy, CheckCheck, Globe, Megaphone, Users, PenTool,
} from 'lucide-react';
import { useBrandGuide } from '@/hooks/useBrandGuide';

const BrandGuidePanel = () => {
  const { brandGuide, loading, extracting, extractBrand, updateBrandGuide } = useBrandGuide();

  const [siteUrl, setSiteUrl] = useState('https://dosmicos.com');
  const [brandName, setBrandName] = useState('');
  const [tagline, setTagline] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [tone, setTone] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [headingFont, setHeadingFont] = useState('');
  const [bodyFont, setBodyFont] = useState('');
  const [visualStyle, setVisualStyle] = useState('');
  const [promptPrefix, setPromptPrefix] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  useEffect(() => {
    if (brandGuide) {
      setBrandName(brandGuide.brand_name || '');
      setTagline(brandGuide.tagline || '');
      setBrandVoice(brandGuide.brand_voice || '');
      setTone(brandGuide.tone || '');
      setTargetAudience(brandGuide.target_audience || '');
      setHeadingFont(brandGuide.typography?.heading_font || '');
      setBodyFont(brandGuide.typography?.body_font || '');
      setVisualStyle(brandGuide.visual_style || '');
      setPromptPrefix(brandGuide.prompt_prefix || '');
      if (brandGuide.source_url) setSiteUrl(brandGuide.source_url);
    }
  }, [brandGuide]);

  const handleSave = async () => {
    setSaving(true);
    await updateBrandGuide({
      brand_name: brandName || null,
      tagline: tagline || null,
      brand_voice: brandVoice || null,
      tone: tone || null,
      target_audience: targetAudience || null,
      typography: { heading_font: headingFont || undefined, body_font: bodyFont || undefined },
      visual_style: visualStyle || null,
      prompt_prefix: promptPrefix || null,
    });
    setSaving(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleString('es-CO', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const copyColor = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedColor(hex);
      setTimeout(() => setCopiedColor(null), 1500);
    });
  }, []);

  const extractionSteps = [
    { label: 'Conectando al sitio', icon: Globe },
    { label: 'Analizando colores y estilo', icon: Palette },
    { label: 'Extrayendo voz de marca', icon: Megaphone },
    { label: 'Generando lineamientos', icon: Shield },
  ];

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // --- Extraction in progress ---
  if (extracting) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Analizando tu marca...</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Estamos revisando tus productos, colores y estilo. Esto puede tomar hasta 30 segundos.
              </p>
            </div>

            {/* Step indicators */}
            <div className="max-w-sm mx-auto space-y-3">
              {extractionSteps.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-left"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                      i === 0
                        ? 'bg-orange-500 text-white'
                        : 'bg-orange-100 text-orange-400'
                    }`}>
                      {i === 0 ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      i === 0 ? 'text-gray-900 font-medium' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // --- No brand guide yet ---
  if (!brandGuide) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-orange-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-gray-900">Extrae tu Identidad de Marca</h3>
            <p className="text-gray-600 max-w-lg mx-auto">
              Ingresa la URL de tu tienda y analizaremos automaticamente tus productos, colores,
              estilo visual, voz de marca y mas.
            </p>
          </div>
          <div className="max-w-md mx-auto w-full space-y-3">
            <Input
              placeholder="https://tutienda.com"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              className="text-center"
            />
            <Button
              size="lg"
              className="bg-[#ff5c02] hover:bg-[#e55502] text-white w-full"
              onClick={() => extractBrand(siteUrl)}
              disabled={!siteUrl || extracting}
            >
              <Wand2 className="w-5 h-5 mr-2" />
              Extraer Identidad de Marca
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Main brand guide view ---
  const colors = brandGuide.colors;
  const guidelines = brandGuide.guidelines;
  const doList = guidelines?.do || [];
  const dontList = guidelines?.dont || [];

  const colorEntries: { label: string; hex: string }[] = [];
  if (colors?.primary) colorEntries.push({ label: 'Primario', hex: colors.primary });
  if (colors?.secondary) colorEntries.push({ label: 'Secundario', hex: colors.secondary });
  if (colors?.accent) colorEntries.push({ label: 'Acento', hex: colors.accent });
  if (colors?.additional) {
    colors.additional.forEach((c, i) => colorEntries.push({ label: `Extra ${i + 1}`, hex: c }));
  }

  return (
    <div className="space-y-4">
      {/* Brand Identity */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Identidad de Marca
          </CardTitle>
          <Badge variant="secondary" className="text-xs font-normal">
            {brandGuide.source_url ? brandGuide.source_url : 'Manual'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Nombre de marca"
              className="text-2xl font-bold border-none px-0 focus-visible:ring-0 shadow-none"
            />
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Tagline"
              className="text-gray-500 border-none px-0 focus-visible:ring-0 shadow-none"
            />
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5" /> Voz de Marca
              </Label>
              <Input
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                placeholder="Ej: Profesional, cercana"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5" /> Tono
              </Label>
              <Input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Ej: Amigable, confiable"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Audiencia Objetivo
              </Label>
              <Input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ej: Mujeres 25-45"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Color Palette */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-orange-500" /> Paleta de Colores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {colorEntries.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {colorEntries.map(({ label, hex }) => (
                  <button
                    key={hex + label}
                    type="button"
                    onClick={() => copyColor(hex)}
                    className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 cursor-pointer"
                    title={`Copiar ${hex}`}
                  >
                    <div
                      className="w-14 h-14 rounded-xl border border-gray-200 shadow-inner transition-transform duration-200 group-hover:scale-105"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs font-mono text-gray-600 flex items-center gap-1">
                      {copiedColor === hex ? (
                        <>
                          <CheckCheck className="w-3 h-3 text-green-500" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {hex}
                        </>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">Sin colores definidos</p>
            )}
          </CardContent>
        </Card>

        {/* Typography */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Type className="w-5 h-5 text-orange-500" /> Tipografia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Titulos</Label>
              <Input
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
                placeholder="Ej: Montserrat"
              />
              {headingFont && (
                <div
                  className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100"
                  style={{ fontFamily: `"${headingFont}", sans-serif` }}
                >
                  <p className="text-lg font-bold text-gray-800">Aa Bb Cc 123</p>
                  <p className="text-xs text-gray-400 mt-1 font-sans">Vista previa: {headingFont}</p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Cuerpo</Label>
              <Input
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
                placeholder="Ej: Open Sans"
              />
              {bodyFont && (
                <div
                  className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100"
                  style={{ fontFamily: `"${bodyFont}", sans-serif` }}
                >
                  <p className="text-sm text-gray-800">
                    El rapido zorro marron salta sobre el perro perezoso.
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-sans">Vista previa: {bodyFont}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Visual Style */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-500" /> Estilo Visual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={visualStyle}
              onChange={(e) => setVisualStyle(e.target.value)}
              placeholder="Describe el estilo visual de tu marca..."
              rows={3}
            />
            {brandGuide.mood_keywords && brandGuide.mood_keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {brandGuide.mood_keywords.map((kw, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 transition-colors"
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" /> Lineamientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Do */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-green-700">Hacer</p>
                </div>
                {doList.length > 0 ? (
                  <ul className="space-y-1.5">
                    {doList.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700 bg-green-50/60 rounded-lg px-3 py-2 border border-green-100"
                      >
                        <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 py-2">Sin lineamientos</p>
                )}
              </div>

              {/* Don't */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-3 h-3 text-red-600" />
                  </div>
                  <p className="text-sm font-medium text-red-700">Evitar</p>
                </div>
                {dontList.length > 0 ? (
                  <ul className="space-y-1.5">
                    {dontList.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700 bg-red-50/60 rounded-lg px-3 py-2 border border-red-100"
                      >
                        <X className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 py-2">Sin lineamientos</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prompt Prefix */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" /> Contexto de Marca para Generacion
            </CardTitle>
            <Badge
              variant={brandGuide.extraction_status === 'complete' ? 'default' : 'secondary'}
              className={
                brandGuide.extraction_status === 'complete'
                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                  : ''
              }
            >
              {brandGuide.extraction_status === 'complete' ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            Este texto se agrega automaticamente a todos tus prompts de generacion de imagenes.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={promptPrefix}
            onChange={(e) => setPromptPrefix(e.target.value)}
            placeholder="Contexto de marca para generacion..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
        <p className="text-sm text-gray-500">
          Ultima extraccion: {formatDate(brandGuide.extracted_at)}
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => extractBrand(siteUrl)} disabled={extracting}>
            <RefreshCw className="w-4 h-4 mr-2" /> Re-extraer Marca
          </Button>
          <Button
            className="bg-[#ff5c02] hover:bg-[#e55502] text-white min-w-[160px]"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BrandGuidePanel;
