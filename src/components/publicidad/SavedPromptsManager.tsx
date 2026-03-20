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
import { Plus, Pencil, Copy, Trash2, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSavedPrompts } from '@/hooks/useSavedPrompts';

const SavedPromptsManager = () => {
  const { prompts, loading, createPrompt, updatePrompt, deletePrompt } = useSavedPrompts();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [promptText, setPromptText] = useState('');
  const [category, setCategory] = useState('producto');
  const [saving, setSaving] = useState(false);

  const openCreateDialog = () => {
    setEditingPrompt(null);
    setName('');
    setPromptText('');
    setCategory('producto');
    setDialogOpen(true);
  };

  const openEditDialog = (prompt: any) => {
    setEditingPrompt(prompt);
    setName(prompt.name);
    setPromptText(prompt.prompt);
    setCategory(prompt.category || 'producto');
    setDialogOpen(true);
  };

  const handleDuplicate = async (prompt: any) => {
    try {
      await createPrompt({
        name: `${prompt.name} (copia)`,
        prompt: prompt.prompt,
        category: prompt.category,
      });
      toast({ title: 'Prompt duplicado', description: 'Se ha creado una copia del prompt.' });
    } catch (error: any) {
      toast({
        title: 'Error al duplicar',
        description: error.message || 'Hubo un problema al duplicar el prompt.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !promptText.trim()) {
      toast({
        title: 'Campos requeridos',
        description: 'Debes ingresar un nombre y un prompt.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        prompt: promptText.trim(),
        category,
      };

      if (editingPrompt) {
        await updatePrompt(editingPrompt.id, data);
        toast({ title: 'Prompt actualizado', description: 'El prompt se ha actualizado exitosamente.' });
      } else {
        await createPrompt(data);
        toast({ title: 'Prompt creado', description: 'El prompt se ha guardado exitosamente.' });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error al guardar',
        description: error.message || 'Hubo un problema al guardar el prompt.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setPromptToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!promptToDelete) return;
    try {
      await deletePrompt(promptToDelete);
      toast({ title: 'Prompt eliminado', description: 'El prompt ha sido eliminado.' });
    } catch (error: any) {
      toast({
        title: 'Error al eliminar',
        description: error.message || 'Hubo un problema al eliminar el prompt.',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmOpen(false);
      setPromptToDelete(null);
    }
  };

  const categoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'producto':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/30';
      case 'publicidad':
        return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/30';
      default:
        return '';
    }
  };

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'producto':
        return '📦';
      case 'publicidad':
        return '📢';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Prompts Guardados</h3>
            <p className="text-sm text-gray-500 mt-0.5">Prompts reutilizables para agilizar la generacion</p>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Prompts Guardados</h3>
            {prompts.length > 0 && (
              <Badge variant="secondary" className="bg-gray-100 dark:bg-[#252529] text-gray-600 dark:text-gray-400 font-medium">
                {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Prompts reutilizables para agilizar la generacion</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-[#ff5c02] hover:bg-[#e55502] text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Prompt
        </Button>
      </div>

      {prompts.length === 0 ? (
        <Card className="bg-white dark:bg-[#1a1a1f] border border-dashed border-gray-300 dark:border-white/15 rounded-2xl">
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-[#ff5c02]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[#ff5c02]/60" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">No hay prompts guardados</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Crea prompts reutilizables para agilizar la generacion de imagenes.
            </p>
            <Button
              onClick={openCreateDialog}
              variant="outline"
              className="mt-6 border-[#ff5c02] text-[#ff5c02] hover:bg-[#ff5c02]/5"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear primer prompt
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prompts.map((prompt) => (
            <Card
              key={prompt.id}
              className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none transition-shadow duration-200 overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {/* Header row: name + actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{prompt.name}</h4>
                    <Badge variant="outline" className={`text-xs ${categoryBadgeColor(prompt.category)}`}>
                      <span className="mr-1">{categoryIcon(prompt.category)}</span>
                      {prompt.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700"
                      onClick={() => openEditDialog(prompt)}
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700"
                      onClick={() => handleDuplicate(prompt)}
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                      onClick={() => handleDeleteClick(prompt.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Prompt text preview */}
                <div className="bg-gray-50 dark:bg-[#0f0f11] rounded-lg px-3 py-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {prompt.prompt}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para crear/editar prompt */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingPrompt ? 'Editar Prompt' : 'Nuevo Prompt'}</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              {editingPrompt ? 'Modifica el prompt existente' : 'Crea un prompt reutilizable para generaciones'}
            </p>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nombre</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del prompt"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="producto">📦 Producto</SelectItem>
                  <SelectItem value="publicidad">📢 Publicidad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Prompt</Label>
              <Textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Escribe el prompt..."
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-gray-400">{promptText.length} caracteres</p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !name.trim() || !promptText.trim()}
              className="w-full h-10 bg-[#ff5c02] hover:bg-[#e55502] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : editingPrompt ? (
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
            <AlertDialogTitle>Eliminar prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El prompt sera eliminado permanentemente.
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

export default SavedPromptsManager;
