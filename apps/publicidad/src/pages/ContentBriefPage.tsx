import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Film, MessageSquareText, Sparkles } from 'lucide-react';
import { contentBriefs, getContentBriefBySlug } from '@/data/contentBriefs';

function SectionCard({
  title,
  children,
  icon,
}: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100/40">
      <div className="mb-3 flex items-center gap-2 text-orange-700">
        {icon}
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function NotFoundBrief() {
  return (
    <div className="min-h-screen bg-[#fff9f3] px-5 py-12 text-center">
      <div className="mx-auto max-w-lg rounded-3xl border border-orange-100 bg-white p-8 shadow-sm">
        <img src="/logo-dosmicos.png" alt="Dosmicos" className="mx-auto mb-6 h-10 object-contain" />
        <p className="mb-2 text-4xl">🧸</p>
        <h1 className="mb-2 text-xl font-semibold text-gray-950">Idea no encontrada</h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-500">
          El link de esta idea puede estar incompleto o haber cambiado.
        </p>
        <Link to="/" className="inline-flex rounded-2xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white">
          Volver a Club Dosmicos
        </Link>
      </div>
    </div>
  );
}

export default function ContentBriefPage() {
  const { slug } = useParams();
  const brief = getContentBriefBySlug(slug);

  if (!brief) return <NotFoundBrief />;

  const otherBriefs = contentBriefs.filter((item) => item.slug !== brief.slug);

  return (
    <div className="min-h-screen bg-[#fff9f3] text-gray-950">
      <header className="sticky top-0 z-20 border-b border-orange-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Club Dosmicos
          </Link>
          <img src="/logo-dosmicos.png" alt="Dosmicos" className="h-9 object-contain" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-7">
        <section className="mb-5 overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm shadow-orange-100/60">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
              Brief {brief.number}
            </span>
            <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-700">
              {brief.product}
            </span>
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">{brief.title}</h1>
          <p className="text-base leading-relaxed text-gray-600">{brief.idea}</p>
        </section>

        <div className="space-y-5">
          <SectionCard title="Texto en pantalla" icon={<Sparkles className="h-4 w-4" />}>
            <p className="rounded-2xl bg-gray-950 p-4 text-xl font-semibold leading-snug text-white">
              “{brief.onScreenText}”
            </p>
          </SectionCard>

          <SectionCard title="Guion fácil" icon={<MessageSquareText className="h-4 w-4" />}>
            <p className="text-base leading-8 text-gray-700">“{brief.script}”</p>
          </SectionCard>

          <SectionCard title="Puedes empezar con" icon={<Film className="h-4 w-4" />}>
            <div className="grid gap-2">
              {brief.hooks.map((hook) => (
                <div key={hook} className="rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-sm font-medium text-gray-800">
                  “{hook}”
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Muestra" icon={<CheckCircle2 className="h-4 w-4" />}>
            <ul className="space-y-2">
              {brief.shots.map((shot) => (
                <li key={shot} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                  <span>{shot}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          {brief.caption && (
            <SectionCard title="Caption sugerido" icon={<MessageSquareText className="h-4 w-4" />}>
              <p className="rounded-2xl bg-gray-50 p-4 text-sm leading-7 text-gray-700">{brief.caption}</p>
            </SectionCard>
          )}
        </div>

        <section className="mt-6 rounded-3xl border border-orange-100 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-950">Otras ideas disponibles</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {otherBriefs.map((item) => (
              <Link
                key={item.slug}
                to={`/ideas/${item.slug}`}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800"
              >
                Brief {item.number} — {item.title}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
