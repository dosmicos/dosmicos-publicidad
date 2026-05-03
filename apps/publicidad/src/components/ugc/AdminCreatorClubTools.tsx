import { useState, type ReactNode } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  KeyRound,
  Lightbulb,
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

type Tone = 'club' | 'upload' | 'ideas' | 'gray';
type ActiveSection = 'club' | 'upload' | 'toolkits';

const toneClasses: Record<Tone, {
  dot: string;
  pill: string;
  button: string;
  buttonActive: string;
  icon: string;
  panel: string;
  row: string;
  primary: string;
}> = {
  club: {
    dot: 'bg-indigo-500',
    pill: 'bg-indigo-50 text-indigo-700',
    button: 'border-indigo-100 bg-indigo-50/70 text-indigo-900 hover:border-indigo-200 hover:bg-indigo-50',
    buttonActive: 'border-indigo-300 bg-indigo-100 text-indigo-950 shadow-sm ring-1 ring-indigo-200',
    icon: 'text-indigo-600',
    panel: 'border-indigo-200 bg-indigo-50/50',
    row: 'bg-indigo-50 text-indigo-950',
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  },
  upload: {
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700',
    button: 'border-emerald-100 bg-emerald-50/70 text-emerald-900 hover:border-emerald-200 hover:bg-emerald-50',
    buttonActive: 'border-emerald-300 bg-emerald-100 text-emerald-950 shadow-sm ring-1 ring-emerald-200',
    icon: 'text-emerald-600',
    panel: 'border-emerald-200 bg-emerald-50/50',
    row: 'bg-emerald-50 text-emerald-950',
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
  },
  ideas: {
    dot: 'bg-amber-500',
    pill: 'bg-amber-50 text-amber-700',
    button: 'border-amber-100 bg-amber-50/70 text-amber-900 hover:border-amber-200 hover:bg-amber-50',
    buttonActive: 'border-amber-300 bg-amber-100 text-amber-950 shadow-sm ring-1 ring-amber-200',
    icon: 'text-amber-600',
    panel: 'border-amber-200 bg-amber-50/50',
    row: 'bg-amber-50 text-amber-950',
    primary: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  gray: {
    dot: 'bg-gray-300',
    pill: 'bg-gray-100 text-gray-500',
    button: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
    buttonActive: 'border-gray-900 bg-white text-gray-950 shadow-sm',
    icon: 'text-gray-500',
    panel: 'border-gray-200 bg-white',
    row: 'bg-gray-50 text-gray-700',
    primary: 'bg-gray-950 text-white hover:bg-gray-800',
  },
};

function MiniStatus({ active, label, tone }: { active: boolean; label: string; tone: Tone }) {
  const classes = active ? toneClasses[tone] : toneClasses.gray;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${classes.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? toneClasses[tone].dot : toneClasses.gray.dot}`} />
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
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:text-gray-900 disabled:opacity-40 ${danger ? 'hover:border-red-200 hover:text-red-600' : ''}`}
    >
      {children}
    </button>
  );
}

function OpenSectionButton({
  icon,
  title,
  detail,
  active,
  tone,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  active?: boolean;
  tone: Exclude<Tone, 'gray'>;
  onClick: () => void;
}) {
  const classes = toneClasses[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 rounded-xl border px-2 py-2 text-left transition ${active ? classes.buttonActive : classes.button}`}
    >
      <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold">
        {icon}
        <span className="truncate">{title}</span>
      </span>
      <span className="mt-0.5 block truncate text-[10px] opacity-70">{detail}</span>
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
  const [activeSection, setActiveSection] = useState<ActiveSection>('club');
  const [showToolkitForm, setShowToolkitForm] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [toolkitUrl, setToolkitUrl] = useState('');
  const [toolkitLabel, setToolkitLabel] = useState('Idea de contenido');
  const [lastClubUrl, setLastClubUrl] = useState('');
  const [lastUploadUrl, setLastUploadUrl] = useState('');

  const existingClubUrl = creator.portal_link?.portal_url || '';
  const visibleClubUrl = lastClubUrl || existingClubUrl;
  const uploadUrl = creator.upload_token?.token
    ? `https://club.dosmicos.com/upload/${creator.upload_token.token}`
    : '';
  const toolkits = creator.toolkits || [];
  const hasClubLink = !!creator.portal_link;
  const hasVisibleClubUrl = !!visibleClubUrl;
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
        setActiveSection('club');
        await handleCopy('club', url);
      }
    });

  const handleGenerateUpload = () =>
    runAction('upload', async () => {
      const url = await onGenerateUploadLink(creator.id);
      if (url) {
        setLastUploadUrl(url);
        setExpanded(true);
        setActiveSection('upload');
        await handleCopy('upload', url);
      }
    });

  const handleAddToolkit = () =>
    runAction('toolkit', async () => {
      await onAddToolkit(creator.id, toolkitUrl, toolkitLabel);
      setToolkitUrl('');
      setToolkitLabel('Idea de contenido');
      setShowToolkitForm(false);
      setExpanded(true);
      setActiveSection('toolkits');
    });

  const openSection = (section: ActiveSection) => {
    setActiveSection(section);
    setExpanded(true);
    if (section === 'toolkits' && toolkitCount === 0) {
      setShowToolkitForm(true);
    }
  };

  const copyIcon = (key: string) => copied === key ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
            <KeyRound className="h-3.5 w-3.5 text-gray-500" /> Links UGC
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            <MiniStatus active={hasClubLink} tone="club" label={hasClubLink ? 'Club' : 'Sin Club'} />
            <MiniStatus active={hasUploadLink} tone="upload" label={hasUploadLink ? 'Upload' : 'Sin upload'} />
            <MiniStatus active={toolkitCount > 0} tone="ideas" label={`${toolkitCount} idea${toolkitCount === 1 ? '' : 's'}`} />
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

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <OpenSectionButton
          tone="club"
          icon={<KeyRound className={`h-3.5 w-3.5 ${toneClasses.club.icon}`} />}
          title="Club"
          detail={hasVisibleClubUrl ? 'copiar' : hasClubLink ? 'legacy' : 'crear'}
          active={expanded && activeSection === 'club'}
          onClick={() => openSection('club')}
        />
        <OpenSectionButton
          tone="upload"
          icon={<Upload className={`h-3.5 w-3.5 ${toneClasses.upload.icon}`} />}
          title="Upload"
          detail={hasUploadLink ? 'copiar' : 'crear'}
          active={expanded && activeSection === 'upload'}
          onClick={() => openSection('upload')}
        />
        <OpenSectionButton
          tone="ideas"
          icon={<Lightbulb className={`h-3.5 w-3.5 ${toneClasses.ideas.icon}`} />}
          title="Ideas"
          detail={toolkitCount > 0 ? `${toolkitCount}` : 'agregar'}
          active={expanded && activeSection === 'toolkits'}
          onClick={() => openSection('toolkits')}
        />
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
          <p>Queda guardado para copiarlo siempre desde este admin.</p>
        </div>
      )}

      {expanded && (
        <div className="mt-2 border-t border-gray-100 pt-2">
          {activeSection === 'club' && (
            <div className={`rounded-xl border p-2 transition ${toneClasses.club.panel}`}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-950">
                  <KeyRound className="h-3.5 w-3.5 text-indigo-600" /> Club privado
                </p>
                <MiniStatus active={hasClubLink} tone="club" label={hasClubLink ? `••••${creator.portal_link?.token_last4}` : 'Sin link'} />
              </div>
              {visibleClubUrl ? (
                <div className={`flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1.5 ${toneClasses.club.row}`}>
                  <span className="min-w-0 flex-1 truncate text-[11px]">{visibleClubUrl}</span>
                  <IconButton title="Copiar Club" onClick={() => handleCopy('club', visibleClubUrl)}>{copyIcon('club')}</IconButton>
                  <IconButton title="Abrir Club" onClick={() => window.open(visibleClubUrl, '_blank', 'noopener,noreferrer')}><ExternalLink className="h-3.5 w-3.5" /></IconButton>
                </div>
              ) : hasClubLink ? (
                <p className="text-[11px] leading-snug text-amber-700">Link antiguo sin URL guardada. Recrea una vez y quedará visible siempre.</p>
              ) : (
                <p className="text-[11px] text-indigo-800/70">Sin link Club.</p>
              )}
              <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-1.5">
                <button type="button" onClick={handleGenerateClub} disabled={loadingAction === 'club'} className={`h-8 rounded-lg px-2 text-[11px] font-semibold disabled:opacity-50 ${toneClasses.club.primary}`}>
                  {hasVisibleClubUrl ? 'Regenerar' : hasClubLink ? 'Recrear' : 'Generar'}
                </button>
                <button type="button" onClick={() => runAction('revoke-club', () => onRevokeClubLink(creator.id))} disabled={!hasClubLink || loadingAction === 'revoke-club'} className="h-8 rounded-lg border border-indigo-200 bg-white px-2 text-[11px] font-medium text-indigo-500 disabled:opacity-40">
                  Revocar
                </button>
              </div>
            </div>
          )}

          {activeSection === 'upload' && (
            <div className={`rounded-xl border p-2 transition ${toneClasses.upload.panel}`}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-950">
                  <Upload className="h-3.5 w-3.5 text-emerald-600" /> Upload
                </p>
                <MiniStatus active={hasUploadLink} tone="upload" label={hasUploadLink ? 'Activo' : 'Sin link'} />
              </div>
              {(lastUploadUrl || uploadUrl) ? (
                <div className={`flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1.5 ${toneClasses.upload.row}`}>
                  <span className="min-w-0 flex-1 truncate text-[11px]">{lastUploadUrl || uploadUrl}</span>
                  <IconButton title="Copiar upload" onClick={() => handleCopy('upload', lastUploadUrl || uploadUrl)}>{copyIcon('upload')}</IconButton>
                  <IconButton title="Abrir upload" onClick={() => window.open(lastUploadUrl || uploadUrl, '_blank', 'noopener,noreferrer')}><ExternalLink className="h-3.5 w-3.5" /></IconButton>
                </div>
              ) : (
                <p className="text-[11px] text-emerald-800/70">Sin upload.</p>
              )}
              <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-1.5">
                <button type="button" onClick={handleGenerateUpload} disabled={loadingAction === 'upload'} className={`h-8 rounded-lg px-2 text-[11px] font-semibold disabled:opacity-50 ${toneClasses.upload.primary}`}>
                  {hasUploadLink ? 'Regenerar' : 'Generar'}
                </button>
                <button type="button" onClick={() => runAction('deactivate-upload', () => onDeactivateUploadLink(creator.upload_token!.id))} disabled={!creator.upload_token || loadingAction === 'deactivate-upload'} className="h-8 rounded-lg border border-emerald-200 bg-white px-2 text-[11px] font-medium text-emerald-600 disabled:opacity-40">
                  Desactivar
                </button>
              </div>
            </div>
          )}

          {activeSection === 'toolkits' && (
            <div className={`rounded-xl border p-2 transition ${toneClasses.ideas.panel}`}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-950">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-600" /> Ideas / toolkits
                </p>
                <MiniStatus active={toolkitCount > 0} tone="ideas" label={`${toolkitCount}`} />
              </div>
              {toolkits.length > 0 && (
                <div className="mb-1.5 space-y-1">
                  {toolkits.map((toolkit) => (
                    <div key={toolkit.id} className={`flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1.5 ${toneClasses.ideas.row}`}>
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium">{toolkit.label || 'Idea de contenido'}</span>
                      <IconButton title="Copiar toolkit" onClick={() => handleCopy(`toolkit-copy-${toolkit.id}`, toolkit.toolkit_url)}>{copyIcon(`toolkit-copy-${toolkit.id}`)}</IconButton>
                      <IconButton title="Abrir toolkit" onClick={() => window.open(toolkit.toolkit_url, '_blank', 'noopener,noreferrer')}><ExternalLink className="h-3.5 w-3.5" /></IconButton>
                      <IconButton danger title="Desactivar toolkit" onClick={() => runAction(`toolkit-${toolkit.id}`, () => onDeactivateToolkit(toolkit.id))}><X className="h-3.5 w-3.5" /></IconButton>
                    </div>
                  ))}
                </div>
              )}

              {showToolkitForm && (
                <div className="mb-1.5 grid gap-1.5 sm:grid-cols-[0.8fr_1.2fr]">
                  <input
                    value={toolkitLabel}
                    onChange={(event) => setToolkitLabel(event.target.value)}
                    placeholder="Nombre botón"
                    className="h-8 rounded-lg border border-amber-200 bg-white px-2 text-xs outline-none focus:border-amber-400"
                  />
                  <input
                    value={toolkitUrl}
                    onChange={(event) => setToolkitUrl(event.target.value)}
                    placeholder="https://link-del-toolkit"
                    className="h-8 rounded-lg border border-amber-200 bg-white px-2 text-xs outline-none focus:border-amber-400"
                  />
                </div>
              )}
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={loadingAction === 'toolkit' || (showToolkitForm && !toolkitUrl.trim())}
                  onClick={showToolkitForm ? handleAddToolkit : () => setShowToolkitForm(true)}
                  className={`h-8 flex-1 rounded-lg px-2 text-[11px] font-semibold disabled:opacity-50 ${toneClasses.ideas.primary}`}
                >
                  {showToolkitForm ? 'Guardar' : 'Agregar toolkit'}
                </button>
                {showToolkitForm && (
                  <button type="button" onClick={() => setShowToolkitForm(false)} className="h-8 rounded-lg border border-amber-200 bg-white px-2 text-[11px] text-amber-700">
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
