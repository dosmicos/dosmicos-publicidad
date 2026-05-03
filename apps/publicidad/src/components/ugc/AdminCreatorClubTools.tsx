import { useState } from 'react';
import { Check, Copy, ExternalLink, KeyRound, Lightbulb, Loader2, Upload, X } from 'lucide-react';
import type { CreatorWithLink } from '@/hooks/useAdminDashboard';

interface AdminCreatorClubToolsProps {
  creator: CreatorWithLink;
  onGenerateClubLink: (creatorId: string) => Promise<string | undefined>;
  onRevokeClubLink: (creatorId: string) => Promise<void>;
  onGenerateUploadLink: (creatorId: string) => Promise<string | undefined>;
  onDeactivateUploadLink: (tokenId: string) => Promise<void>;
  onAddToolkit: (creatorId: string, toolkitUrl: string, label?: string) => Promise<void>;
  onDeactivateToolkit: (toolkitId: string) => Promise<void>;
}

const copyToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

export default function AdminCreatorClubTools({
  creator,
  onGenerateClubLink,
  onRevokeClubLink,
  onGenerateUploadLink,
  onDeactivateUploadLink,
  onAddToolkit,
  onDeactivateToolkit,
}: AdminCreatorClubToolsProps) {
  const [expanded, setExpanded] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [toolkitUrl, setToolkitUrl] = useState('');
  const [toolkitLabel, setToolkitLabel] = useState('Idea de contenido');
  const [lastClubUrl, setLastClubUrl] = useState('');
  const [lastUploadUrl, setLastUploadUrl] = useState('');

  const uploadUrl = creator.upload_token?.token
    ? `https://club.dosmicos.com/upload/${creator.upload_token.token}`
    : '';
  const toolkitCount = creator.toolkits?.length || 0;

  const runAction = async (key: string, action: () => Promise<void>) => {
    setLoadingAction(key);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la acción');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCopy = async (key: string, value: string) => {
    if (!value) return;
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    }
  };

  return (
    <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-3 space-y-3">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="text-xs font-semibold text-orange-800 flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" /> Club Dosmicos
          </p>
          <p className="text-[11px] text-orange-700/80 mt-0.5">
            Link único {creator.portal_link ? 'activo' : 'sin generar'} · Upload {creator.upload_token ? 'activo' : 'sin link'} · {toolkitCount} toolkit{toolkitCount === 1 ? '' : 's'}
          </p>
        </div>
        <span className="text-[11px] font-semibold text-orange-700 bg-white border border-orange-100 rounded-lg px-2 py-1">
          {expanded ? 'Ocultar' : 'Gestionar'}
        </span>
      </button>

      {expanded && (
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500 bg-white border border-red-100 rounded-lg px-2 py-1.5">{error}</p>}

          <div className="rounded-xl bg-white border border-orange-100 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Link Club</p>
              {creator.portal_link && <span className="text-[10px] text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">Activo · ••••{creator.portal_link.token_last4}</span>}
            </div>
            {lastClubUrl && (
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5">
                <span className="text-[11px] text-gray-500 truncate flex-1">{lastClubUrl}</span>
                <button type="button" onClick={() => handleCopy('club', lastClubUrl)} className="text-gray-400 hover:text-gray-700">
                  {copied === 'club' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                disabled={loadingAction === 'club'}
                onClick={() => runAction('club', async () => {
                  const url = await onGenerateClubLink(creator.id);
                  if (url) {
                    setLastClubUrl(url);
                    await handleCopy('club', url);
                  }
                })}
                className="rounded-lg bg-gray-900 text-white text-[11px] font-semibold px-2.5 py-1.5 disabled:opacity-50"
              >
                {loadingAction === 'club' ? <Loader2 className="h-3 w-3 animate-spin" /> : creator.portal_link ? 'Regenerar' : 'Generar'}
              </button>
              {creator.portal_link && (
                <button
                  type="button"
                  disabled={loadingAction === 'revoke-club'}
                  onClick={() => runAction('revoke-club', () => onRevokeClubLink(creator.id))}
                  className="rounded-lg border border-gray-200 text-gray-500 text-[11px] font-semibold px-2.5 py-1.5 disabled:opacity-50"
                >
                  Revocar
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white border border-orange-100 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Link de subida</p>
              {creator.upload_token && <span className="text-[10px] text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">Activo</span>}
            </div>
            {(uploadUrl || lastUploadUrl) && (
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5">
                <span className="text-[11px] text-gray-500 truncate flex-1">{lastUploadUrl || uploadUrl}</span>
                <button type="button" onClick={() => handleCopy('upload', lastUploadUrl || uploadUrl)} className="text-gray-400 hover:text-gray-700">
                  {copied === 'upload' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                disabled={loadingAction === 'upload'}
                onClick={() => runAction('upload', async () => {
                  const url = await onGenerateUploadLink(creator.id);
                  if (url) {
                    setLastUploadUrl(url);
                    await handleCopy('upload', url);
                  }
                })}
                className="rounded-lg bg-gray-900 text-white text-[11px] font-semibold px-2.5 py-1.5 disabled:opacity-50"
              >
                {loadingAction === 'upload' ? <Loader2 className="h-3 w-3 animate-spin" /> : creator.upload_token ? 'Regenerar' : 'Generar'}
              </button>
              {creator.upload_token && (
                <button
                  type="button"
                  disabled={loadingAction === 'deactivate-upload'}
                  onClick={() => runAction('deactivate-upload', () => onDeactivateUploadLink(creator.upload_token!.id))}
                  className="rounded-lg border border-gray-200 text-gray-500 text-[11px] font-semibold px-2.5 py-1.5 disabled:opacity-50"
                >
                  Desactivar
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white border border-orange-100 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Toolkits</p>
            {(creator.toolkits || []).map((toolkit) => (
              <div key={toolkit.id} className="flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5">
                <span className="text-[11px] text-gray-600 truncate flex-1">{toolkit.label || 'Idea de contenido'}</span>
                <button type="button" onClick={() => window.open(toolkit.toolkit_url, '_blank', 'noopener,noreferrer')} className="text-gray-400 hover:text-gray-700">
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => runAction(`toolkit-${toolkit.id}`, () => onDeactivateToolkit(toolkit.id))} className="text-gray-400 hover:text-red-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <input
              value={toolkitLabel}
              onChange={(event) => setToolkitLabel(event.target.value)}
              placeholder="Texto del botón"
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-gray-400"
            />
            <input
              value={toolkitUrl}
              onChange={(event) => setToolkitUrl(event.target.value)}
              placeholder="https://link-del-toolkit"
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-gray-400"
            />
            <button
              type="button"
              disabled={loadingAction === 'toolkit' || !toolkitUrl.trim()}
              onClick={() => runAction('toolkit', async () => {
                await onAddToolkit(creator.id, toolkitUrl, toolkitLabel);
                setToolkitUrl('');
              })}
              className="rounded-lg bg-gray-900 text-white text-[11px] font-semibold px-2.5 py-1.5 disabled:opacity-50"
            >
              Agregar toolkit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
