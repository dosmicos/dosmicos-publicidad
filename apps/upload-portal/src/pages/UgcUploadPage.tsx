import { useState, useEffect, useCallback, useRef } from "react";
import * as tus from "tus-js-client";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileVideo,
  FileImage,
  Plus,
} from "lucide-react";
import type { TokenValidation } from "./UploadFlowPage";

// ============================================================
// Types
// ============================================================

interface VideoQueueItem {
  id: string;
  file: File;
  platform: string;
  notes: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  errorMessage?: string;
  mediaType: "video" | "photo";
}

// ============================================================
// Constants
// ============================================================

const ALLOWED_MEDIA_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/x-matroska",
  "video/3gpp",
  "video/x-m4v",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

const PLATFORM_OPTIONS = [
  { value: "instagram_reel", label: "Instagram Reel" },
  { value: "instagram_story", label: "Instagram Story" },
  { value: "tiktok", label: "TikTok" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function getMediaType(file: File): "video" | "photo" {
  if (file.type.startsWith("image/")) return "photo";
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext && ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext)
    ? "photo"
    : "video";
}

// ============================================================
// Component
// ============================================================

interface Props {
  token: string;
  validation: TokenValidation;
}

export default function UgcUploadPage({ token, validation }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCampaign, setSelectedCampaign] = useState<string>(() => {
    const campaigns = validation.campaigns || [];
    return campaigns.length === 1 ? campaigns[0].id : "none";
  });
  const [videoQueue, setVideoQueue] = useState<VideoQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [completedVideos, setCompletedVideos] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // File handling — multiple files
  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: VideoQueueItem[] = [];

    Array.from(files).forEach((file) => {
      if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        const allowedExts = ["mp4", "mov", "webm", "avi", "mkv", "3gp", "m4v", "jpg", "jpeg", "png", "webp", "heic", "heif"];
        if (!ext || !allowedExts.includes(ext)) {
          return;
        }
      }

      if (file.size > MAX_FILE_SIZE) {
        return;
      }

      newItems.push({
        id: generateId(),
        file,
        platform: "instagram_reel",
        notes: "",
        status: "pending",
        progress: 0,
        mediaType: getMediaType(file),
      });
    });

    if (newItems.length > 0) {
      setVideoQueue((prev) => [...prev, ...newItems]);
    }
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const removeFromQueue = useCallback((id: string) => {
    setVideoQueue((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const updatePlatform = useCallback((id: string, platform: string) => {
    setVideoQueue((prev) =>
      prev.map((v) => (v.id === id ? { ...v, platform } : v))
    );
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setVideoQueue((prev) =>
      prev.map((v) => (v.id === id ? { ...v, notes } : v))
    );
  }, []);

  // Upload all videos sequentially
  const handleUploadAll = async () => {
    if (!token || !validation?.creator) return;

    const pendingVideos = videoQueue.filter((v) => v.status === "pending");
    if (pendingVideos.length === 0) return;

    setIsUploading(true);

    const campaignId = selectedCampaign && selectedCampaign !== "none" ? selectedCampaign : null;

    for (const video of pendingVideos) {
      setVideoQueue((prev) =>
        prev.map((v) =>
          v.id === video.id
            ? { ...v, status: "uploading" as const, progress: 0 }
            : v
        )
      );

      try {
        const fileExt = video.file.name.split(".").pop() || "mp4";
        const folderCampaign = campaignId || "sin-campana";
        const fileName = `${validation.organization_id}/${validation.creator!.id}/${folderCampaign}/${Date.now()}_${video.id}.${fileExt}`;
        const bucketName = "ugc-videos";

        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Upload file using TUS resumable protocol
        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(video.file, {
            endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
            retryDelays: [0, 1000, 3000, 5000],
            headers: {
              authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
              apikey: SUPABASE_ANON_KEY,
            },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            metadata: {
              bucketName,
              objectName: fileName,
              contentType: video.file.type,
              cacheControl: "3600",
            },
            chunkSize: 6 * 1024 * 1024, // 6MB chunks
            onError: (error) => {
              reject(error);
            },
            onProgress: (bytesUploaded, bytesTotal) => {
              const pct = Math.round((bytesUploaded / bytesTotal) * 90);
              setVideoQueue((prev) =>
                prev.map((v) =>
                  v.id === video.id ? { ...v, progress: pct } : v
                )
              );
            },
            onSuccess: () => {
              resolve();
            },
          });

          // Check for previous uploads to resume
          upload.findPreviousUploads().then((previousUploads) => {
            if (previousUploads.length > 0) {
              upload.resumeFromPreviousUpload(previousUploads[0]);
            }
            upload.start();
          });
        });

        setVideoQueue((prev) =>
          prev.map((v) =>
            v.id === video.id ? { ...v, progress: 92 } : v
          )
        );

        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        const { data: submitResult, error: submitError } = await supabase.rpc(
          "ugc_submit_video",
          {
            p_token: token,
            p_campaign_id: campaignId,
            p_video_url: urlData.publicUrl,
            p_platform: video.platform,
            p_notes: video.notes || null,
            p_media_type: video.mediaType,
            p_original_filename: video.file.name,
            p_file_size_bytes: video.file.size,
            p_mime_type: video.file.type || null,
            p_storage_bucket: bucketName,
            p_storage_path: fileName,
          }
        );

        if (submitError) throw new Error(submitError.message);

        const result = submitResult as unknown as {
          success: boolean;
          error?: string;
        };
        if (!result.success)
          throw new Error(result.error || "Error desconocido");

        setVideoQueue((prev) =>
          prev.map((v) =>
            v.id === video.id
              ? { ...v, status: "success" as const, progress: 100 }
              : v
          )
        );
        setCompletedVideos((prev) => [...prev, video.file.name]);
      } catch (err: any) {
        setVideoQueue((prev) =>
          prev.map((v) =>
            v.id === video.id
              ? {
                  ...v,
                  status: "error" as const,
                  progress: 0,
                  errorMessage: err.message,
                }
              : v
          )
        );
      }
    }

    setIsUploading(false);
  };

  // Computed
  const pendingCount = videoQueue.filter((v) => v.status === "pending").length;
  const successCount = videoQueue.filter((v) => v.status === "success").length;
  const totalInQueue = videoQueue.length;
  const totalSize = videoQueue
    .filter((v) => v.status !== "success")
    .reduce((acc, v) => acc + v.file.size, 0);

  const creator = validation.creator!;
  const campaigns = validation.campaigns || [];

  // ============================================================
  // Render: Main upload page
  // ============================================================
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar con logo */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <img src="/logo-dosmicos.png" alt="Dosmicos" className="h-7" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header con info del creador */}
        <div className="text-center space-y-2">
          {creator.avatar_url && (
            <img
              src={creator.avatar_url}
              alt={creator.name}
              className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-gray-100"
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Hola, {creator.name} 👋
            </h1>
            <p className="text-sm text-gray-500">
              Sube tus videos y fotos en la mejor calidad posible
            </p>
          </div>
        </div>

        {/* Selector de campaña (opcional) */}
        {campaigns.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Campaña <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <Select
              value={selectedCampaign}
              onValueChange={setSelectedCampaign}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecciona una campaña" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin campaña específica</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                    {campaign.agreed_videos
                      ? ` (${campaign.agreed_videos} videos)`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Zona de drop / selección de archivos */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center w-full
            min-h-[160px] rounded-2xl cursor-pointer transition-all duration-200
            border-2 border-dashed
            ${
              isDragOver
                ? "border-black bg-gray-50 scale-[1.01]"
                : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
            }
          `}
        >
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-3">
              <Upload className="h-5 w-5 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Toca para seleccionar videos o fotos
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Puedes seleccionar varios a la vez
            </p>
            <p className="text-xs text-gray-400">
              MP4, MOV, JPG, PNG, WebP — Hasta 1 GB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>

        {/* Cola de videos */}
        {videoQueue.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Archivos ({totalInQueue})
              </h3>
              {totalSize > 0 && (
                <span className="text-xs text-gray-400">
                  {formatFileSize(totalSize)} total
                </span>
              )}
            </div>

            <div className="space-y-2">
              {videoQueue.map((video) => (
                <div
                  key={video.id}
                  className={`
                    rounded-xl border p-3 transition-all
                    ${
                      video.status === "success"
                        ? "bg-green-50 border-green-200"
                        : video.status === "error"
                        ? "bg-red-50 border-red-200"
                        : video.status === "uploading"
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-200"
                    }
                  `}
                >
                  {/* File info row */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center flex-shrink-0">
                      {video.status === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : video.status === "error" ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : video.status === "uploading" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      ) : video.mediaType === "photo" ? (
                        <FileImage className="h-4 w-4 text-gray-400" />
                      ) : (
                        <FileVideo className="h-4 w-4 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {video.file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(video.file.size)}
                      </p>
                    </div>

                    {video.status === "pending" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(video.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}

                    {video.status === "success" && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 text-xs"
                      >
                        Listo
                      </Badge>
                    )}
                  </div>

                  {/* Progress bar */}
                  {video.status === "uploading" && (
                    <div className="mt-2">
                      <Progress value={video.progress} className="h-1.5" />
                      <p className="text-xs text-blue-600 mt-1 text-center">
                        Subiendo... {video.progress}%
                      </p>
                    </div>
                  )}

                  {/* Error message */}
                  {video.status === "error" && video.errorMessage && (
                    <p className="text-xs text-red-600 mt-2">
                      {video.errorMessage}
                    </p>
                  )}

                  {/* Platform selector (only for pending) */}
                  {video.status === "pending" && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-1.5 flex-wrap">
                        {PLATFORM_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePlatform(video.id, opt.value);
                            }}
                            className={`
                              text-xs px-2.5 py-1 rounded-full border transition-colors
                              ${
                                video.platform === opt.value
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                              }
                            `}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <Textarea
                        placeholder="Notas sobre este archivo (opcional)"
                        value={video.notes}
                        onChange={(e) => updateNotes(video.id, e.target.value)}
                        rows={2}
                        className="text-sm resize-none bg-gray-50/50"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Agregar más videos */}
            {!isUploading && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Agregar más archivos
              </button>
            )}
          </div>
        )}

        {/* Botón de subir todos */}
        {pendingCount > 0 && (
          <Button
            onClick={handleUploadAll}
            disabled={isUploading || pendingCount === 0}
            className="w-full gap-2 h-12 text-base bg-black hover:bg-gray-800 rounded-xl"
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Subiendo archivos...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Subir {pendingCount} archivo{pendingCount > 1 ? "s" : ""}
              </>
            )}
          </Button>
        )}

        {/* Resumen de éxito */}
        {successCount > 0 && pendingCount === 0 && !isUploading && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
            <p className="text-sm font-medium text-green-800">
              {successCount === 1
                ? "¡Archivo subido exitosamente!"
                : `¡${successCount} archivos subidos exitosamente!`}
            </p>
            <p className="text-sm text-green-700 font-medium">
              Gracias por ser parte de las mamás Dosmicos 🐒💚
            </p>
            <p className="text-xs text-green-600">
              Nuestro equipo revisará tu contenido pronto y te avisaremos.
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setVideoQueue([]);
                fileInputRef.current?.click();
              }}
              className="mt-2 gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Subir más archivos
            </Button>
          </div>
        )}

        {/* Historial de subidos en esta sesión */}
        {completedVideos.length > 0 &&
          videoQueue.some((v) => v.status === "pending") && (
            <div className="text-xs text-gray-400 text-center">
              {completedVideos.length} archivo
              {completedVideos.length > 1 ? "s" : ""} subido
              {completedVideos.length > 1 ? "s" : ""} en esta sesión
            </div>
          )}

        {/* Footer */}
        <div className="pt-4 pb-8 text-center">
          <p className="text-xs text-gray-300">Powered by Sewdle</p>
        </div>
      </div>
    </div>
  );
}
