import { useState, type ReactNode } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  KeyRound,
  Lightbulb,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
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
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  }
};

function StatusPill({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
        active
          ? 'bg-green-50 text-green-700 border-green-100'
          : 'bg-gray-50 text-gray-400 border-gray-100'
      }`}
    >
      {children}
    </span>
  );
}

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
  const toolkits = creator.toolkits || [];
  const toolkitCount = toolkits.length;
  const hasClubLink = !!creator.portal_link;
  const hasUploadLink = !!creator.upload_token;

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
    } else {
      setError('No pude copiar automáticamente. Selecciona el link y cópialo manualmente.');
    }
  };

  const handleGenerateClub = () =>
    runAction('club', async () => {
      const url = await onGenerateClubLink(creator.id);
      if (url) {
        setLastClubUrl(url);
        await handleCopy('club', url);
      }
    });

  const handleGenerateUpload = () =>
    runAction('upload', async () => {
      const url = await onGenerateUploadLink(creator.id);
      if (url) {
        setLastUploadUrl(url);
        await handleCopy('upload', url);
      }
    });

  const handleAddToolkit = () =>
    runAction('toolkit', async () => {
      await onAddToolkit(creator.id, toolkitUrl, toolkitLabel);
      setToolkitUrl('');
      setToolkitLabel('Idea de contenido');
    });

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_1px_8px_rgba(15,23,42,0.04)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-orange-500" /> Club creadora
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <StatusPill active={hasClubLink}>Club {hasClubLink ? `••••${creator.portal_link?.token_last4}` : 'sin link'}</StatusPill>
            <StatusPill active={hasUploadLink}>Upload {hasUploadLink ? 'activo' : 'sin link'}</StatusPill>
            <StatusPill active={toolkitCount > 0}>{toolkitCount} toolkit{toolkitCount === 1 ? '' : 's'}</StatusPill>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-500">
          {expanded ? 'Ocultar' : 'Abrir'}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-3 space-y-3 bg-gray-50/50">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Club link */}
          <section className="rounded-xl border border-gray-100 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-orange-500" /> Link único Club
              </p>
              <StatusPill active={hasClubLink}>{hasClubLink ? `Activo ••••${creator.portal_link?.token_last4}` : 'Sin generar'}</StatusPill>
            </div>

            {lastClubUrl ? (
              <div className="rounded-xl border border-green-100 bg-green-50 p-2 space-y-2">
                <p className="text-[11px] font-semibold text-green-700">Link nuevo generado y copiado</p>
                <div className="flex items-center gap-1.5 rounded-lg bg-white border border-green-100 px-2 py-1.5">
                  <span className="text-[11px] text-gray-600 truncate flex-1">{lastClubUrl}</span>
                  <button type="button" onClick={() => handleCopy('club', lastClubUrl)} className="p-1 text-gray-400 hover:text-gray-700" title="Copiar link Club">
                    {copied === 'club' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button type="button" onClick={() => window.open(lastClubUrl, '_blank', 'noopener,noreferrer')} className="p-1 text-gray-400 hover:text-gray-700" title="Abrir link Club">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : hasClubLink ? (
              <p className="text-[11px] leading-relaxed text-gray-400">
                Por seguridad el link completo solo se muestra al generarlo. Si necesitas dárselo a la creadora, usa “Regenerar y copiar”.
              </p>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loadingAction === 'club'}
                onClick={handleGenerateClub}
                className="rounded-xl bg-gray-900 text-white text-xs font-semibold px-3 py-2 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loadingAction === 'club' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {hasClubLink ? 'Regenerar y copiar' : 'Generar y copiar'}
              </button>
              <button
                type="button"
                disabled={!hasClubLink || loadingAction === 'revoke-club'}
                onClick={() => runAction('revoke-club', () => onRevokeClubLink(creator.id))}
                className="rounded-xl border border-gray-200 bg-white text-gray-500 text-xs font-semibold px-3 py-2 disabled:opacity-40"
              >
                Revocar
              </button>
            </div>
          </section>

          {/* Upload */}
          <section className="rounded-xl border border-gray-100 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-sky-500" /> Link de subida
              </p>
              <StatusPill active={hasUploadLink}>{hasUploadLink ? 'Activo' : 'Sin link'}</StatusPill>
            </div>
            {(lastUploadUrl || uploadUrl) && (
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5">
                <span className="text-[11px] text-gray-500 truncate flex-1">{lastUploadUrl || uploadUrl}</span>
                <button type="button" onClick={() => handleCopy('upload', lastUploadUrl || uploadUrl)} className="p-1 text-gray-400 hover:text-gray-700" title="Copiar link upload">
                  {copied === 'upload' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button type="button" onClick={() => window.open(lastUploadUrl || uploadUrl, '_blank', 'noopener,noreferrer')} className="p-1 text-gray-400 hover:text-gray-700" title="Abrir link upload">
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loadingAction === 'upload'}
                onClick={handleGenerateUpload}
                className="rounded-xl bg-gray-900 text-white text-xs font-semibold px-3 py-2 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loadingAction === 'upload' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {hasUploadLink ? 'Regenerar' : 'Generar'} upload
              </button>
              <button
                type="button"
                disabled={!creator.upload_token || loadingAction === 'deactivate-upload'}
                onClick={() => runAction('deactivate-upload', () => onDeactivateUploadLink(creator.upload_token!.id))}
                className="rounded-xl border border-gray-200 bg-white text-gray-500 text-xs font-semibold px-3 py-2 disabled:opacity-40"
              >
                Desactivar
              </button>
            </div>
          </section>

          {/* Toolkits */}
          <section className="rounded-xl border border-gray-100 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Toolkits
              </p>
              <StatusPill active={toolkitCount > 0}>{toolkitCount} activo{toolkitCount === 1 ? '' : 's'}</StatusPill>
            </div>

            {toolkits.length > 0 && (
              <div className="space-y-1.5">
                {toolkits.map((toolkit) => (
                  <div key={toolkit.id} className="flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5">
                    <span className="text-[11px] text-gray-600 truncate flex-1">{toolkit.label || 'Idea de contenido'}</span>
                    <button type="button" onClick={() => handleCopy(`toolkit-copy-${toolkit.id}`, toolkit.toolkit_url)} className="p-1 text-gray-400 hover:text-gray-700" title="Copiar toolkit">
                      {copied === `toolkit-copy-${toolkit.id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button type="button" onClick={() => window.open(toolkit.toolkit_url, '_blank', 'noopener,noreferrer')} className="p-1 text-gray-400 hover:text-gray-700" title="Abrir toolkit">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => runAction(`toolkit-${toolkit.id}`, () => onDeactivateToolkit(toolkit.id))} className="p-1 text-gray-400 hover:text-red-500" title="Desactivar toolkit">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-2">
              <input
                value={toolkitLabel}
                onChange={(event) => setToolkitLabel(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.preventDefault();
                }}
                placeholder="Texto del botón. Ej: Idea de contenido"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
              />
              <input
                value={toolkitUrl}
                onChange={(event) => setToolkitUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    if (toolkitUrl.trim()) handleAddToolkit();
                  }
                }}
                placeholder="https://link-del-toolkit"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
              />
              <button
                type="button"
                disabled={loadingAction === 'toolkit' || !toolkitUrl.trim()}
                onClick={handleAddToolkit}
                className="rounded-xl bg-gray-900 text-white text-xs font-semibold px-3 py-2 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loadingAction === 'toolkit' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Agregar toolkit
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
