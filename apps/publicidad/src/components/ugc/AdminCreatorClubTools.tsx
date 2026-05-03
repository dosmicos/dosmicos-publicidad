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
  Plus,
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

function MiniStatus({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      {label}
    </span>
  );
}

function IconButton({
  children,
  onClick,
  title,
  disabled,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:text-gray-900 disabled:opacity-40 ${danger ? 'hover:border-red-200 hover:text-red-600' : ''}`}
    >
      {children}
    </button>
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
  const [showToolkitForm, setShowToolkitForm] = useState(false);
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
  const hasClubLink = !!creator.portal_link;
  const hasUploadLink = !!creator.upload_token;
  const toolkitCount = toolkits.length;

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
      setTimeout(() => setCopied(null), 1600);
    } else {
      setError('No pude copiar automático. Selecciona el link y cópialo manualmente.');
    }
  };

  const handleGenerateClub = () =>
    runAction('club', async () => {
      const url = await onGenerateClubLink(creator.id);
      if (url) {
        setLastClubUrl(url);
        setExpanded(true);
        await handleCopy('club', url);
      }
    });

  const handleGenerateUpload = () =>
    runAction('upload', async () => {
      const url = await onGenerateUploadLink(creator.id);
      if (url) {
        setLastUploadUrl(url);
        setExpanded(true);
        await handleCopy('upload', url);
      }
    });

  const handleAddToolkit = () =>
    runAction('toolkit', async () => {
      await onAddToolkit(creator.id, toolkitUrl, toolkitLabel);
      setToolkitUrl('');
      setToolkitLabel('Idea de contenido');
      setShowToolkitForm(false);
    });

  const copyIcon = (key: string) => copied === key ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />;

  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
            <KeyRound className="h-3.5 w-3.5 text-gray-500" /> Links UGC
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            <MiniStatus active={hasClubLink} label={hasClubLink ? 'Club' : 'Sin Club'} />
            <MiniStatus active={hasUploadLink} label={hasUploadLink ? 'Upload' : 'Sin upload'} />
            <MiniStatus active={toolkitCount > 0} label={`${toolkitCount} idea${toolkitCount === 1 ? '' : 's'}`} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-600 hover:text-gray-900"
        >
          {expanded ? 'Cerrar' : 'Gestionar'}
          <ChevronDown className={`h-3 w-3 transition ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        <button
          type="button"
          disabled={loadingAction === 'club'}
          onClick={handleGenerateClub}
          className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-gray-950 px-2 text-[11px] font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          title={hasClubLink ? 'Regenerar y copiar Club' : 'Generar y copiar Club'}
        >
          {loadingAction === 'club' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="truncate">{hasClubLink ? 'Regenerar Club' : 'Crear Club'}</span>
        </button>
        <button
          type="button"
          disabled={loadingAction === 'upload'}
          onClick={handleGenerateUpload}
          className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-700 transition hover:border-gray-300 disabled:opacity-50"
          title={hasUploadLink ? 'Regenerar y copiar upload' : 'Generar y copiar upload'}
        >
          {loadingAction === 'upload' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          <span className="truncate">{hasUploadLink ? 'Reg. upload' : 'Crear upload'}</span>
        </button>
        <button
          type="button"
          onClick={() => { setExpanded(true); setShowToolkitForm(true); }}
          className="col-span-2 inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-700 transition hover:border-gray-300 sm:col-span-1"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          <span className="truncate">Toolkit</span>
        </button>
      </div>

      {error && (
        <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-red-100 bg-red-50 px-2.5 py-2 text-[11px] text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {(lastClubUrl || lastUploadUrl) && (
        <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-2 text-[11px] text-emerald-800">
          <p className="font-semibold">Link generado y copiado.</p>
          <p>El link completo queda visible abajo solo durante esta sesión.</p>
        </div>
      )}

      {expanded && (
        <div className="mt-2 space-y-2 border-t border-gray-200 pt-2">
          <div className="rounded-xl border border-gray-200 bg-white p-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-gray-900">Club privado</p>
              <MiniStatus active={hasClubLink} label={hasClubLink ? `••••${creator.portal_link?.token_last4}` : 'Sin link'} />
            </div>
            {lastClubUrl ? (
              <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1.5">
                <span className="min-w-0 flex-1 truncate text-[11px] text-emerald-900">{lastClubUrl}</span>
                <IconButton title="Copiar Club" onClick={() => handleCopy('club', lastClubUrl)}>{copyIcon('club')}</IconButton>
                <IconButton title="Abrir Club" onClick={() => window.open(lastClubUrl, '_blank', 'noopener,noreferrer')}><ExternalLink className="h-3.5 w-3.5" /></IconButton>
              </div>
            ) : hasClubLink ? (
              <p className="text-[11px] leading-snug text-amber-700">Existe, pero el link completo solo se ve al regenerar.</p>
            ) : (
              <p className="text-[11px] text-gray-500">Sin link Club.</p>
            )}
            <div className="mt-1.5 flex gap-1.5">
              <button type="button" onClick={handleGenerateClub} disabled={loadingAction === 'club'} className="h-8 flex-1 rounded-lg bg-gray-950 px-2 text-[11px] font-semibold text-white disabled:opacity-50">
                {hasClubLink ? 'Regenerar' : 'Generar'}
              </button>
              <button type="button" onClick={() => runAction('revoke-club', () => onRevokeClubLink(creator.id))} disabled={!hasClubLink || loadingAction === 'revoke-club'} className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-500 disabled:opacity-40">
                Revocar
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-gray-900">Upload</p>
              <MiniStatus active={hasUploadLink} label={hasUploadLink ? 'Activo' : 'Sin link'} />
            </div>
            {(lastUploadUrl || uploadUrl) ? (
              <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5">
                <span className="min-w-0 flex-1 truncate text-[11px] text-gray-700">{lastUploadUrl || uploadUrl}</span>
                <IconButton title="Copiar upload" onClick={() => handleCopy('upload', lastUploadUrl || uploadUrl)}>{copyIcon('upload')}</IconButton>
                <IconButton title="Abrir upload" onClick={() => window.open(lastUploadUrl || uploadUrl, '_blank', 'noopener,noreferrer')}><ExternalLink className="h-3.5 w-3.5" /></IconButton>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">Sin upload.</p>
            )}
            <div className="mt-1.5 flex gap-1.5">
              <button type="button" onClick={handleGenerateUpload} disabled={loadingAction === 'upload'} className="h-8 flex-1 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-700 disabled:opacity-50">
                {hasUploadLink ? 'Regenerar' : 'Generar'}
              </button>
              <button type="button" onClick={() => runAction('deactivate-upload', () => onDeactivateUploadLink(creator.upload_token!.id))} disabled={!creator.upload_token || loadingAction === 'deactivate-upload'} className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-500 disabled:opacity-40">
                Desactivar
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-gray-900">Toolkits</p>
              <MiniStatus active={toolkitCount > 0} label={`${toolkitCount}`} />
            </div>
            {toolkits.length > 0 && (
              <div className="mb-1.5 space-y-1">
                {toolkits.map((toolkit) => (
                  <div key={toolkit.id} className="flex min-w-0 items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-gray-700">{toolkit.label || 'Idea de contenido'}</span>
                    <IconButton title="Copiar toolkit" onClick={() => handleCopy(`toolkit-copy-${toolkit.id}`, toolkit.toolkit_url)}>{copyIcon(`toolkit-copy-${toolkit.id}`)}</IconButton>
                    <IconButton title="Abrir toolkit" onClick={() => window.open(toolkit.toolkit_url, '_blank', 'noopener,noreferrer')}><ExternalLink className="h-3.5 w-3.5" /></IconButton>
                    <IconButton danger title="Desactivar toolkit" onClick={() => runAction(`toolkit-${toolkit.id}`, () => onDeactivateToolkit(toolkit.id))}><X className="h-3.5 w-3.5" /></IconButton>
                  </div>
                ))}
              </div>
            )}

            {showToolkitForm && (
              <div className="mb-1.5 grid gap-1.5">
                <input
                  value={toolkitLabel}
                  onChange={(event) => setToolkitLabel(event.target.value)}
                  placeholder="Nombre botón"
                  className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-gray-400"
                />
                <input
                  value={toolkitUrl}
                  onChange={(event) => setToolkitUrl(event.target.value)}
                  placeholder="https://link-del-toolkit"
                  className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-gray-400"
                />
              </div>
            )}
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={loadingAction === 'toolkit' || (showToolkitForm && !toolkitUrl.trim())}
                onClick={showToolkitForm ? handleAddToolkit : () => setShowToolkitForm(true)}
                className="h-8 flex-1 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-700 disabled:opacity-50"
              >
                {showToolkitForm ? 'Guardar toolkit' : 'Agregar toolkit'}
              </button>
              {showToolkitForm && (
                <button type="button" onClick={() => setShowToolkitForm(false)} className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-[11px] text-gray-500">
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
