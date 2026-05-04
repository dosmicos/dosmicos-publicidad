import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UgcContentTag {
  id: string;
  name: string;
  color: string;
  description: string | null;
  is_active: boolean;
}

export interface UgcContentAsset {
  id: string;
  creator_id: string;
  campaign_id: string | null;
  organization_id: string;
  video_url: string | null;
  status: string;
  platform: string | null;
  feedback: string | null;
  created_at: string;
  media_type: 'video' | 'photo';
  original_filename: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  preview_url: string | null;
  creator: {
    id: string;
    name: string;
    instagram_handle: string | null;
    avatar_url: string | null;
  } | null;
  campaign: {
    id: string;
    name: string;
  } | null;
  tags: UgcContentTag[];
}

interface UgcVideoTagAssignmentRow {
  video_id: string;
  tag_id: string;
}

const normalizeMediaType = (value: unknown): 'video' | 'photo' =>
  value === 'photo' ? 'photo' : 'video';

const normalizeTag = (tag: any): UgcContentTag => ({
  id: tag.id,
  name: tag.name,
  color: tag.color || '#111827',
  description: tag.description ?? null,
  is_active: Boolean(tag.is_active ?? true),
});

async function getSignedPreviewUrls(assets: UgcContentAsset[]) {
  const signedByKey = new Map<string, string>();
  const groups = new Map<string, UgcContentAsset[]>();

  assets.forEach((asset) => {
    if (!asset.storage_bucket || !asset.storage_path) return;
    const group = groups.get(asset.storage_bucket) || [];
    group.push(asset);
    groups.set(asset.storage_bucket, group);
  });

  for (const [bucket, bucketAssets] of groups.entries()) {
    const paths = [...new Set(bucketAssets.map((asset) => asset.storage_path).filter(Boolean) as string[])];
    if (paths.length === 0) continue;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(paths, 60 * 60);

    if (error || !data) continue;

    data.forEach((row, index) => {
      if (row?.signedUrl) signedByKey.set(`${bucket}:${paths[index]}`, row.signedUrl);
    });
  }

  return signedByKey;
}

const cleanFilename = (value: string) =>
  value.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim();

const extensionForAsset = (asset: UgcContentAsset) => {
  const fromName = asset.original_filename?.split('.').pop();
  if (fromName && fromName.length <= 6) return fromName;
  if (asset.mime_type?.includes('png')) return 'png';
  if (asset.mime_type?.includes('webp')) return 'webp';
  if (asset.mime_type?.includes('jpeg') || asset.mime_type?.includes('jpg')) return 'jpg';
  if (asset.mime_type?.includes('quicktime')) return 'mov';
  if (asset.mime_type?.includes('webm')) return 'webm';
  return asset.media_type === 'photo' ? 'jpg' : 'mp4';
};

const fallbackFilename = (asset: UgcContentAsset) => {
  const base = asset.original_filename
    || `${asset.creator?.instagram_handle || asset.creator?.name || 'ugc'}-${asset.created_at?.slice(0, 10) || asset.id}`;
  const cleaned = cleanFilename(base);
  return cleaned.includes('.') ? cleaned : `${cleaned}.${extensionForAsset(asset)}`;
};

export function useUgcContentLibrary() {
  const [assets, setAssets] = useState<UgcContentAsset[]>([]);
  const [tags, setTags] = useState<UgcContentTag[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      const currentOrgId = profile?.organization_id as string | undefined;
      if (!currentOrgId) throw new Error('Organización no disponible');
      setOrgId(currentOrgId);

      const { data: tagRows, error: tagsError } = await (supabase as any)
        .from('ugc_content_tags')
        .select('id, name, color, description, is_active')
        .eq('organization_id', currentOrgId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (tagsError) throw tagsError;

      const normalizedTags: UgcContentTag[] = (tagRows || []).map(normalizeTag);

      const { data: videoRows, error: videosError } = await (supabase as any)
        .from('ugc_videos')
        .select(`
          id,
          creator_id,
          campaign_id,
          organization_id,
          video_url,
          status,
          platform,
          feedback,
          created_at,
          media_type,
          original_filename,
          file_size_bytes,
          mime_type,
          storage_bucket,
          storage_path,
          creator:ugc_creators!ugc_videos_creator_id_fkey (
            id,
            name,
            instagram_handle,
            avatar_url
          ),
          campaign:ugc_campaigns!ugc_videos_campaign_id_fkey (
            id,
            name
          )
        `)
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false });

      if (videosError) throw videosError;

      const baseAssets: UgcContentAsset[] = (videoRows || []).map((row: any) => ({
        id: row.id,
        creator_id: row.creator_id,
        campaign_id: row.campaign_id ?? null,
        organization_id: row.organization_id,
        video_url: row.video_url ?? null,
        status: row.status || 'pendiente',
        platform: row.platform ?? null,
        feedback: row.feedback ?? null,
        created_at: row.created_at,
        media_type: normalizeMediaType(row.media_type),
        original_filename: row.original_filename ?? null,
        file_size_bytes: typeof row.file_size_bytes === 'number' ? row.file_size_bytes : row.file_size_bytes ? Number(row.file_size_bytes) : null,
        mime_type: row.mime_type ?? null,
        storage_bucket: row.storage_bucket ?? null,
        storage_path: row.storage_path ?? null,
        preview_url: null,
        creator: row.creator ? {
          id: row.creator.id,
          name: row.creator.name,
          instagram_handle: row.creator.instagram_handle ?? null,
          avatar_url: row.creator.avatar_url ?? null,
        } : null,
        campaign: row.campaign ? {
          id: row.campaign.id,
          name: row.campaign.name,
        } : null,
        tags: [],
      }));

      const videoIds = baseAssets.map((asset) => asset.id);
      let assignments: UgcVideoTagAssignmentRow[] = [];

      if (videoIds.length > 0) {
        const { data: assignmentRows, error: assignmentsError } = await (supabase as any)
          .from('ugc_video_tag_assignments')
          .select('video_id, tag_id')
          .eq('organization_id', currentOrgId)
          .in('video_id', videoIds);

        if (assignmentsError) throw assignmentsError;
        assignments = assignmentRows || [];
      }

      const tagsById = new Map(normalizedTags.map((tag) => [tag.id, tag]));
      const assignmentsByVideo = new Map<string, UgcContentTag[]>();
      assignments.forEach((assignment) => {
        const tag = tagsById.get(assignment.tag_id);
        if (!tag) return;
        const current = assignmentsByVideo.get(assignment.video_id) || [];
        current.push(tag);
        assignmentsByVideo.set(assignment.video_id, current);
      });

      const signedPreviewUrls = await getSignedPreviewUrls(baseAssets);

      setTags(normalizedTags);
      setAssets(baseAssets.map((asset) => ({
        ...asset,
        preview_url: asset.storage_bucket && asset.storage_path
          ? signedPreviewUrls.get(`${asset.storage_bucket}:${asset.storage_path}`) || asset.video_url
          : asset.video_url,
        tags: assignmentsByVideo.get(asset.id) || [],
      })));
    } catch (err: any) {
      setError(err?.message || 'Error al cargar biblioteca de contenido');
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createTag = async (name: string, color = '#111827', description?: string | null): Promise<UgcContentTag> => {
    const { data, error: rpcError } = await (supabase as any).rpc('create_ugc_content_tag', {
      p_name: name,
      p_color: color,
      p_description: description || null,
    });
    if (rpcError) throw rpcError;

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.id) throw new Error('La etiqueta se creó, pero Supabase no devolvió el ID. Actualiza e inténtalo de nuevo.');

    const createdTag = normalizeTag(row);
    setTags((current) => {
      const withoutDuplicate = current.filter((tag) => tag.id !== createdTag.id);
      return [...withoutDuplicate, createdTag].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    });
    return createdTag;
  };

  const assignTag = async (videoId: string, tagId: string, tagOverride?: UgcContentTag) => {
    const tagToApply = tagOverride || tags.find((tag) => tag.id === tagId);

    if (tagToApply) {
      setAssets((current) => current.map((asset) => {
        if (asset.id !== videoId || asset.tags.some((tag) => tag.id === tagId)) return asset;
        return { ...asset, tags: [...asset.tags, tagToApply] };
      }));
    }

    const { error: rpcError } = await (supabase as any).rpc('assign_ugc_content_tag', {
      p_video_id: videoId,
      p_tag_id: tagId,
    });

    if (rpcError) {
      if (tagToApply) {
        setAssets((current) => current.map((asset) => (
          asset.id === videoId
            ? { ...asset, tags: asset.tags.filter((tag) => tag.id !== tagId) }
            : asset
        )));
      }
      throw rpcError;
    }
  };

  const removeTag = async (videoId: string, tagId: string) => {
    const assetBeforeChange = assets.find((asset) => asset.id === videoId);
    const removedTag = assetBeforeChange?.tags.find((tag) => tag.id === tagId);

    setAssets((current) => current.map((asset) => (
      asset.id === videoId
        ? { ...asset, tags: asset.tags.filter((tag) => tag.id !== tagId) }
        : asset
    )));

    const { error: rpcError } = await (supabase as any).rpc('remove_ugc_content_tag', {
      p_video_id: videoId,
      p_tag_id: tagId,
    });

    if (rpcError) {
      if (removedTag) {
        setAssets((current) => current.map((asset) => {
          if (asset.id !== videoId || asset.tags.some((tag) => tag.id === tagId)) return asset;
          return { ...asset, tags: [...asset.tags, removedTag] };
        }));
      }
      throw rpcError;
    }
  };

  const downloadAsset = async (asset: UgcContentAsset) => {
    if (asset.storage_bucket && asset.storage_path) {
      const { data, error: downloadError } = await supabase.storage
        .from(asset.storage_bucket)
        .download(asset.storage_path);

      if (!downloadError && data) {
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = fallbackFilename(asset);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 2500);
        return;
      }
    }

    if (asset.video_url) {
      window.open(asset.video_url, '_blank', 'noopener,noreferrer');
      return;
    }

    throw new Error('Este asset no tiene archivo descargable ni link público.');
  };

  return {
    assets,
    tags,
    orgId,
    loading,
    error,
    refetch: fetchAll,
    createTag,
    assignTag,
    removeTag,
    downloadAsset,
  };
}
