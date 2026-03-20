import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Zap, Loader2, LayoutTemplate, Type, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAiSkills } from '@/hooks/useAiSkills';
import { useAiTemplates } from '@/hooks/useAiTemplates';
import { useSeedImages } from '@/hooks/useSeedImages';

const SkillsManager = () => {
  const { skills, loading, createSkill, updateSkill, deleteSkill } = useAiSkills();
  const { templates } = useAiTemplates();
  const { seedImages } = useSeedImages('product');
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [mode, setMode] = useState<string>('template');
  const [templateId, setTemplateId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState('1K');
  const [selectedSeedIds, setSelectedSeedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName('');
    setMode('template');
    setTemplateId('');
    setPrompt('');
    setResolution('1K');
    setSelectedSeedIds([]);
  };

  const openCreateDialog = () => {
    setEditingSkill(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (skill: any) => {
    setEditingSkill(skill);
    setName(skill.name);
    setMode(skill.mode || 'template');
    setTemplateId(skill.template_id || '');
    setPrompt(skill.prompt || '');
    setResolution(skill.resolution || '1K');
    setSelectedSeedIds(skill.seed_image_ids || []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Campo requerido', description: 'Debes ingresar un nombre.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        mode,
        template_id: mode === 'template' ? templateId || undefined : undefined,
        prompt: prompt.trim(),
        resolution,
        seed_image_ids: selectedSeedIds,
      };

      if (editingSkill) {
        await updateSkill(editingSkill.id, data);
        toast({ title: 'Skill actualizado', description: 'El skill se ha actualizado exitosamente.' });
      } else {
        await createSkill(data);
        toast({ title: 'Skill creado', description: 'El skill se ha guardado exitosamente.' });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error al guardar',
        description: error.message || 'Hubo un problema al guardar el skill.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSkillToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!skillToDelete) return;
    try {
      await deleteSkill(skillToDelete);
      toast({ title: 'Skill eliminado', description: 'El skill ha sido eliminado.' });
    } catch (error: any) {
      toast({
        title: 'Error al eliminar',
        description: error.message || 'Hubo un problema al eliminar el skill.',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmOpen(false);
      setSkillToDelete(null);
    }
  };

  const toggleSeedImage = (id: string) => {
    setSelectedSeedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const modeBadgeColor = (m: string) => {
    switch (m) {
      case 'template':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/30';
      case 'free':
        return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30';
      case 'edit':
        return 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/30';
      default:
        return '';
    }
  };

  const modeLabel = (m: string) => {
    switch (m) {
      case 'template':
        return 'Template';
      case 'free':
        return 'Prompt Libre';
      case 'edit':
        return 'Edicion';
      default:
        return m;
    }
  };

  const modeIcon = (m: string) => {
    switch (m) {
      case 'template':
        return <LayoutTemplate className="w-3 h-3" />;
      case 'free':
        return <Type className="w-3 h-3" />;
      case 'edit':
        return <ImageIcon className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Skills</h3>
            <p className="text-sm text-gray-500 mt-0.5">Combinaciones preconfiguradas de templates, prompts y semillas</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#ff5c02] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Skills</h3>
            {skills.length > 0 && (
              <Badge variant="secondary" className="bg-gray-100 dark:bg-[#252529] text-gray-600 dark:text-gray-400 font-medium">
                {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Combinaciones preconfiguradas de templates, prompts y semillas</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-[#ff5c02] hover:bg-[#e55502] text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Skill
        </Button>
      </div>

      {skills.length === 0 ? (
        <Card className="bg-white dark:bg-[#1a1a1f] border border-dashed border-gray-300 dark:border-white/15 rounded-2xl">
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-[#ff5c02]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-[#ff5c02]/60" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">No hay skills configurados</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Crea skills para combinar templates, prompts e imagenes semilla en un solo flujo.
            </p>
            <Button
              onClick={openCreateDialog}
              variant="outline"
              className="mt-6 border-[#ff5c02] text-[#ff5c02] hover:bg-[#ff5c02]/5"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear primer skill
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill) => (
            <Card
              key={skill.id}
              className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm dark:shadow-none overflow-hidden hover:shadow-md dark:hover:shadow-none transition-all duration-200 group hover:border-[#ff5c02]/30"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#ff5c02]/10 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-[#ff5c02]" />
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate">{skill.name}</h4>
                    </div>
                    <div className="flex items-center gap-2 pl-10">
                      <Badge variant="outline" className={`text-xs ${modeBadgeColor(skill.mode)}`}>
                        <span className="mr-1">{modeIcon(skill.mode)}</span>
                        {modeLabel(skill.mode)}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-[#0f0f11] text-gray-600 dark:text-gray-400">
                        {skill.resolution || '1K'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700"
                      onClick={() => openEditDialog(skill)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                      onClick={() => handleDeleteClick(skill.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {skill.prompt && (
                  <div className="bg-gray-50 dark:bg-[#0f0f11] rounded-lg px-3 py-2 ml-10">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {skill.prompt}
                    </p>
                  </div>
                )}

                {skill.seed_image_ids && skill.seed_image_ids.length > 0 && (
                  <div className="flex items-center ml-10">
                    <div className="flex -space-x-2">
                      {skill.seed_image_ids.slice(0, 5).map((seedId: string, index: number) => {
                        const seed = seedImages.find((s) => s.id === seedId);
                        return seed ? (
                          <img
                            key={seedId}
                            src={seed.image_url}
                            alt={seed.name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-[#1a1a1f] shadow-sm dark:shadow-none"
                            style={{ zIndex: 5 - index }}
                            title={seed.name}
                          />
                        ) : null;
                      })}
                    </div>
                    {skill.seed_image_ids.length > 5 && (
                      <span className="ml-2 text-xs text-gray-500 font-medium bg-gray-100 dark:bg-[#252529] rounded-full px-2 py-0.5">
                        +{skill.seed_image_ids.length - 5}
                      </span>
                    )}
                    <span className="ml-2 text-xs text-gray-400">
                      {skill.seed_image_ids.length} {skill.seed_image_ids.length === 1 ? 'semilla' : 'semillas'}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para crear/editar skill */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg">{editingSkill ? 'Editar Skill' : 'Nuevo Skill'}</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              {editingSkill ? 'Modifica la configuracion del skill' : 'Configura un nuevo skill de generacion'}
            </p>
          </DialogHeader>
          <div className="space-y-5 pt-2 overflow-y-auto flex-1 pr-1">
            {/* Basic info section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del skill" className="h-10" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Modo</Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="free">Prompt Libre</SelectItem>
                      <SelectItem value="edit">Edicion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Resolucion</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1K">1K (1024px)</SelectItem>
                      <SelectItem value="2K">2K (2048px)</SelectItem>
                      <SelectItem value="4K">4K (4096px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {mode === 'template' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Template</Label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Seleccionar template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Prompt</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Escribe el prompt del skill..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Seed images section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Imagenes Semilla
                {selectedSeedIds.length > 0 && (
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    {selectedSeedIds.length} seleccionadas
                  </span>
                )}
              </Label>
              {seedImages.length === 0 ? (
                <div className="text-center py-4 bg-gray-50 dark:bg-[#0f0f11] rounded-lg">
                  <p className="text-sm text-gray-500">No hay imagenes semilla disponibles.</p>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1">
                  {seedImages.map((seed) => (
                    <div
                      key={seed.id}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                        selectedSeedIds.includes(seed.id)
                          ? 'border-[#ff5c02] ring-2 ring-[#ff5c02]/20 scale-95'
                          : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/15'
                      }`}
                      onClick={() => toggleSeedImage(seed.id)}
                      title={seed.name}
                    >
                      <img src={seed.image_url} alt={seed.name} className="w-full aspect-square object-cover" />
                      {selectedSeedIds.includes(seed.id) && (
                        <div className="absolute inset-0 bg-[#ff5c02]/20 flex items-center justify-center">
                          <div className="w-5 h-5 bg-[#ff5c02] rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full h-10 bg-[#ff5c02] hover:bg-[#e55502] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : editingSkill ? (
                'Actualizar'
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmar eliminacion */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar skill?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El skill sera eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SkillsManager;
