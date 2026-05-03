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

function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`} />
      {label}
    </span>
  );
}

function CopyableLink({
  value,
  copied,
  copyKey,
  onCopy,
  tone = 'gray',
}: {
  value: string;
  copied: string | null;
  copyKey: string;
  onCopy: (key: string, value: string) => void;
  tone?: 'gray' | 'green';
}) {
  if (!value) return null;

  const toneClass = tone === 'green'
    ? 'border-green-200 bg-green-50/80 text-green-900'
    : 'border-gray-200 bg-gray-50 text-gray-700';

  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-2 ${toneClass}`}>
      <span className="min-w-0 flex-1 truncate text-xs">{value}</span>
      <button
        type="button"
        onClick={() => onCopy(copyKey, value)}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/80 text-gray-500 shadow-sm transition hover:text-gray-900"
        title="Copiar link"
      >
        {copied === copyKey ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={() => window.open(value, '_blank', 'noopener,noreferrer')}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/80 text-gray-500 shadow-sm transition hover:text-gray-900"
        title="Abrir link"
      >
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}

function ActionBlock({
  icon,
  title,
  description,
  status,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  status: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-3.5 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gray-100 text-gray-700">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-950">{title}</p>
            <p className="mt-0.5 text-xs leading-snug text-gray-500">{description}</p>
          </div>
        </div>
        <div className="shrink-0">{status}</div>
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
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
  const [showAdvanced, setShowAdvanced] = useState(false);
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
      setShowToolkitForm(false);
    });

  return (
    <div className="rounded-[28px] border border-gray-200 bg-gray-50 p-3 sm:p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black tracking-tight text-gray-950">Links para la creadora</p>
          <p className="text-xs leading-snug text-gray-500">Aquí van los links que se le envían a la UGC. No mezclar con el link de descuento para clientes.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusDot active={hasClubLink} label={hasClubLink ? 'Club listo' : 'Falta Club'} />
          <StatusDot active={hasUploadLink} label={hasUploadLink ? 'Upload listo' : 'Falta upload'} />
          <StatusDot active={toolkitCount > 0} label={`${toolkitCount} idea${toolkitCount === 1 ? '' : 's'}`} />
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-3">
        <ActionBlock
          icon={<KeyRound className="h-5 w-5" />}
          title="1. Link Club privado"
          description="Para que la creadora vea ventas, saldo, subida de contenido e ideas."
          status={<StatusDot active={hasClubLink} label={hasClubLink ? `••••${creator.portal_link?.token_last4}` : 'Sin link'} />}
        >
          {lastClubUrl ? (
            <>
              <div className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2">
                <p className="text-xs font-bold text-green-800">Listo: link nuevo copiado</p>
                <p className="text-[11px] leading-snug text-green-700">Este es el link para enviarle a la creadora ahora.</p>
              </div>
              <CopyableLink value={lastClubUrl} copied={copied} copyKey="club" onCopy={handleCopy} tone="green" />
            </>
          ) : hasClubLink ? (
            <p className="rounded-2xl bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-700">
              Ya existe un Club, pero por seguridad el link completo solo se ve al generarlo. Si necesitas enviarlo, usa “Regenerar y copiar”.
            </p>
          ) : (
            <p className="rounded-2xl bg-gray-50 px-3 py-2 text-xs leading-snug text-gray-500">Todavía no tiene link privado.</p>
          )}

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              disabled={loadingAction === 'club'}
              onClick={handleGenerateClub}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
            >
              {loadingAction === 'club' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              {hasClubLink ? 'Regenerar y copiar Club' : 'Generar y copiar Club'}
            </button>
            <button
              type="button"
              disabled={!hasClubLink || loadingAction === 'revoke-club'}
              onClick={() => runAction('revoke-club', () => onRevokeClubLink(creator.id))}
              className="min-h-11 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-500 transition hover:border-red-200 hover:text-red-600 disabled:opacity-40"
            >
              Revocar
            </button>
          </div>
        </ActionBlock>

        <ActionBlock
          icon={<Upload className="h-5 w-5" />}
          title="2. Link para subir contenido"
          description="Para que la UGC cargue videos/fotos de campaña."
          status={<StatusDot active={hasUploadLink} label={hasUploadLink ? 'Activo' : 'Sin link'} />}
        >
          {(lastUploadUrl || uploadUrl) ? (
            <CopyableLink value={lastUploadUrl || uploadUrl} copied={copied} copyKey="upload" onCopy={handleCopy} />
          ) : (
            <p className="rounded-2xl bg-gray-50 px-3 py-2 text-xs leading-snug text-gray-500">Sin link de subida activo.</p>
          )}
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              disabled={loadingAction === 'upload'}
              onClick={handleGenerateUpload}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 transition hover:border-gray-300 disabled:opacity-50"
            >
              {loadingAction === 'upload' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              {hasUploadLink ? 'Regenerar y copiar upload' : 'Generar y copiar upload'}
            </button>
            <button
              type="button"
              disabled={!creator.upload_token || loadingAction === 'deactivate-upload'}
              onClick={() => runAction('deactivate-upload', () => onDeactivateUploadLink(creator.upload_token!.id))}
              className="min-h-11 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-500 transition hover:border-red-200 hover:text-red-600 disabled:opacity-40"
            >
              Desactivar
            </button>
          </div>
        </ActionBlock>

        <ActionBlock
          icon={<Lightbulb className="h-5 w-5" />}
          title="3. Ideas / toolkit"
          description="Botón de inspiración que verá la creadora dentro del Club."
          status={<StatusDot active={toolkitCount > 0} label={`${toolkitCount} activo${toolkitCount === 1 ? '' : 's'}`} />}
        >
          {toolkits.length > 0 ? (
            <div className="space-y-2">
              {toolkits.map((toolkit) => (
                <div key={toolkit.id} className="flex min-w-0 items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-gray-800">{toolkit.label || 'Idea de contenido'}</p>
                    <p className="truncate text-[11px] text-gray-400">{toolkit.toolkit_url}</p>
                  </div>
                  <button type="button" onClick={() => handleCopy(`toolkit-copy-${toolkit.id}`, toolkit.toolkit_url)} className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-gray-500 shadow-sm hover:text-gray-900" title="Copiar toolkit">
                    {copied === `toolkit-copy-${toolkit.id}` ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => window.open(toolkit.toolkit_url, '_blank', 'noopener,noreferrer')} className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-gray-500 shadow-sm hover:text-gray-900" title="Abrir toolkit">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => runAction(`toolkit-${toolkit.id}`, () => onDeactivateToolkit(toolkit.id))} className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-gray-400 shadow-sm hover:text-red-600" title="Desactivar toolkit">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-gray-50 px-3 py-2 text-xs leading-snug text-gray-500">Sin toolkit asignado. Puedes agregar uno para que aparezca como “Idea de contenido”.</p>
          )}

          {showToolkitForm && (
            <div className="grid gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2">
              <input
                value={toolkitLabel}
                onChange={(event) => setToolkitLabel(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.preventDefault();
                }}
                placeholder="Nombre del botón. Ej: Idea Ruana Vaca Café"
                className="min-h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-400"
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
                className="min-h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-400"
              />
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              disabled={loadingAction === 'toolkit' || (showToolkitForm && !toolkitUrl.trim())}
              onClick={showToolkitForm ? handleAddToolkit : () => setShowToolkitForm(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 transition hover:border-gray-300 disabled:opacity-50"
            >
              {loadingAction === 'toolkit' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {showToolkitForm ? 'Guardar toolkit' : 'Agregar toolkit'}
            </button>
            {showToolkitForm && (
              <button
                type="button"
                onClick={() => setShowToolkitForm(false)}
                className="min-h-11 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-500 transition hover:border-gray-300"
              >
                Cancelar
              </button>
            )}
          </div>
        </ActionBlock>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((value) => !value)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold text-gray-500 transition hover:bg-white hover:text-gray-900"
      >
        {showAdvanced ? 'Ocultar guía' : '¿Qué link debo enviar?'}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-600">
          <p><span className="font-bold text-gray-900">Club:</span> se envía a la creadora para entrar a su portal privado.</p>
          <p><span className="font-bold text-gray-900">Upload:</span> se envía si solo quieres que suba archivos.</p>
          <p><span className="font-bold text-gray-900">Descuento:</span> es el link público para clientes y está arriba en la tarjeta.</p>
        </div>
      )}
    </div>
  );
}
