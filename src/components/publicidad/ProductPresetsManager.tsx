import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, RotateCcw, ShoppingBag, User, Baby, Users, Heart, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_PRODUCT_PRESETS, type ProductPreset } from './ProductEditor';

const ICON_OPTIONS = [
  { value: 'product', label: 'Producto', icon: ShoppingBag },
  { value: 'baby', label: 'Nino/Nina', icon: Baby },
  { value: 'adult', label: 'Adulto', icon: User },
  { value: 'family', label: 'Familia', icon: Users },
  { value: 'lifestyle', label: 'Lifestyle', icon: ImageIcon },
  { value: 'couple', label: 'Pareja', icon: Heart },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  product: <ShoppingBag className="w-4 h-4" />,
  baby: <Baby className="w-4 h-4" />,
  adult: <User className="w-4 h-4" />,
  family: <Users className="w-4 h-4" />,
  lifestyle: <ImageIcon className="w-4 h-4" />,
  couple: <Heart className="w-4 h-4" />,
};

const STORAGE_KEY = 'dosmicos_product_presets';

const ProductPresetsManager = () => {
  const { toast } = useToast();
  const [presets, setPresets] = useState<ProductPreset[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PRODUCT_PRESETS;
    } catch { return DEFAULT_PRODUCT_PRESETS; }
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<ProductPreset | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('product');
  const [promptText, setPromptText] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  const openCreateDialog = () => {
    setEditingPreset(null);
    setName('');
    setIcon('product');
    setPromptText('');
    setDialogOpen(true);
  };

  const openEditDialog = (preset: ProductPreset) => {
    setEditingPreset(preset);
    setName(preset.name);
    setIcon(preset.icon);
    setPromptText(preset.prompt);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim() || !promptText.trim()) {
      toast({ title: 'Campos requeridos', description: 'Nombre y prompt son obligatorios.', variant: 'destructive' });
      return;
    }

    if (editingPreset) {
      setPresets(prev => prev.map(p =>
        p.id === editingPreset.id ? { ...p, name: name.trim(), icon, prompt: promptText.trim() } : p
      ));
      toast({ title: 'Preset actualizado' });
    } else {
      const newPreset: ProductPreset = {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        icon,
        prompt: promptText.trim(),
      };
      setPresets(prev => [...prev, newPreset]);
      toast({ title: 'Preset creado' });
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setPresetToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (presetToDelete) {
      setPresets(prev => prev.filter(p => p.id !== presetToDelete));
      toast({ title: 'Preset eliminado' });
    }
    setDeleteConfirmOpen(false);
    setPresetToDelete(null);
  };

  const handleResetDefaults = () => {
    setPresets(DEFAULT_PRODUCT_PRESETS);
    localStorage.removeItem(STORAGE_KEY);
    toast({ title: 'Presets restaurados', description: 'Se restauraron los presets por defecto.' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Presets de Producto</h3>
          <p className="text-xs text-gray-500 mt-0.5">Estilos predefinidos para la seccion Productos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetDefaults} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Restaurar
          </Button>
          <Button onClick={openCreateDialog} className="bg-[#ff5c02] text-white text-xs" size="sm">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nuevo Preset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {presets.map((preset) => (
          <Card
            key={preset.id}
            className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#ff5c02]/10 flex items-center justify-center shrink-0 text-[#ff5c02]">
                {ICON_MAP[preset.icon] || <ImageIcon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{preset.name}</h4>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditDialog(preset)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => handleDeleteClick(preset.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2 leading-relaxed">{preset.prompt}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {presets.length === 0 && (
        <Card className="bg-white dark:bg-[#1a1a1f] border border-dashed border-gray-300 dark:border-white/15 rounded-xl p-8 text-center">
          <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No hay presets. Agrega uno o restaura los defaults.</p>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPreset ? 'Editar Preset' : 'Nuevo Preset'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Bebe con producto" />
              </div>
              <div className="space-y-2">
                <Label>Icono</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <opt.icon className="w-4 h-4" />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prompt (en ingles para mejor resultado)</Label>
              <Textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Professional product photo with..."
                rows={5}
                className="text-sm"
              />
              <p className="text-[11px] text-gray-400">{promptText.length} caracteres</p>
            </div>

            <Button onClick={handleSave} disabled={!name.trim() || !promptText.trim()} className="w-full">
              {editingPreset ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar preset?</AlertDialogTitle>
            <AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductPresetsManager;
