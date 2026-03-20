import React, { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Trash2, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSeedImages } from '@/hooks/useSeedImages';

interface SeedImageManagerProps {
  type: 'product' | 'advertising';
}

const SeedImageManager = ({ type }: SeedImageManagerProps) => {
  const { seedImages, loading, createSeedImage, uploadSeedImage, deleteSeedImage } = useSeedImages(type);
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [seedToDelete, setSeedToDelete] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const title = type === 'product' ? 'Semillas de Producto' : 'Semillas de Publicidad';
  const description = type === 'product'
    ? 'Imagenes de referencia de tus productos para generacion'
    : 'Imagenes de referencia para fondos y estilos publicitarios';

  const handleFileSelect = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Tipo de archivo no valido',
        description: 'Solo se permiten archivos JPG, PNG y WEBP.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Archivo muy grande',
        description: 'El archivo debe ser menor a 5MB.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleSave = async () => {
    if (!selectedFile || !name.trim()) {
      toast({
        title: 'Campos requeridos',
        description: 'Debes ingresar un nombre y seleccionar una imagen.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await uploadSeedImage(selectedFile, type);
      if (!imageUrl) throw new Error('No se pudo subir la imagen');
      await createSeedImage({
        name: name.trim(),
        type,
        category: category.trim() || undefined,
        image_url: imageUrl,
      });
      toast({ title: 'Semilla creada', description: 'La imagen semilla se ha guardado exitosamente.' });
      resetForm();
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error al guardar',
        description: error.message || 'Hubo un problema al guardar la semilla.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleDeleteClick = (id: string) => {
    setSeedToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!seedToDelete) return;
    try {
      await deleteSeedImage(seedToDelete);
      toast({ title: 'Semilla eliminada', description: 'La imagen semilla ha sido eliminada.' });
    } catch (error: any) {
      toast({
        title: 'Error al eliminar',
        description: error.message || 'Hubo un problema al eliminar la semilla.',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmOpen(false);
      setSeedToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {seedImages.length > 0 && (
              <Badge variant="secondary" className="bg-gray-100 dark:bg-[#252529] text-gray-600 dark:text-gray-400 font-medium">
                {seedImages.length} {seedImages.length === 1 ? 'imagen' : 'imagenes'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="bg-[#ff5c02] hover:bg-[#e55502] text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Semilla
        </Button>
      </div>

      {seedImages.length === 0 ? (
        <Card className="bg-white dark:bg-[#1a1a1f] border border-dashed border-gray-300 dark:border-white/15 rounded-2xl">
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-[#ff5c02]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-[#ff5c02]/60" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">No hay semillas configuradas</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Agrega imagenes semilla para usar como referencia en la generacion de contenido.
            </p>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              variant="outline"
              className="mt-6 border-[#ff5c02] text-[#ff5c02] hover:bg-[#ff5c02]/5"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar primera semilla
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {seedImages.map((seed) => (
            <div
              key={seed.id}
              className="group relative bg-white dark:bg-[#1a1a1f] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none overflow-hidden hover:shadow-md dark:hover:shadow-none transition-shadow duration-200"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={seed.image_url}
                  alt={seed.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Hover overlay with delete action */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{seed.name}</p>
                      {seed.category && (
                        <span className="text-xs text-white/80">{seed.category}</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-red-500/80 hover:text-white flex-shrink-0 rounded-full"
                      onClick={() => handleDeleteClick(seed.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {/* Always-visible info below image */}
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{seed.name}</p>
                {seed.category && (
                  <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-[#0f0f11]">
                    {seed.category}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog para agregar semilla */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Agregar Semilla</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Sube una imagen de referencia para usar en generaciones</p>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                dragActive
                  ? 'border-[#ff5c02] bg-[#ff5c02]/5 scale-[1.01]'
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
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                }}
              />
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#ff5c02]/10 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-[#ff5c02]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Arrastra una imagen o haz clic para seleccionar</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG o WEBP (max. 5MB)</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Nombre</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la semilla"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Categoria <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: fondos, productos, texturas"
                className="h-10"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !selectedFile || !name.trim()}
              className="w-full h-10 bg-[#ff5c02] hover:bg-[#e55502] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Semilla'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmar eliminacion */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar semilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La imagen semilla sera eliminada permanentemente.
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

export default SeedImageManager;
