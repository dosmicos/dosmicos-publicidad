import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TERMS_SECTIONS, TERMS_SUMMARY_POINTS } from "@/lib/terms-content";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Shield,
  Heart,
} from "lucide-react";

interface Props {
  creatorName: string;
  onAccept: () => void;
}

export default function TermsConsentPage({ creatorName, onAccept }: Props) {
  const [expandedTerms, setExpandedTerms] = useState(false);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const [checkLicense, setCheckLicense] = useState(false);
  const [checkMinor, setCheckMinor] = useState(false);
  const [checkData, setCheckData] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);

  const allChecked = checkLicense && checkMinor && checkData;

  // Detect if user has scrolled through terms
  useEffect(() => {
    if (!expandedTerms) return;

    const el = termsRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 40) {
        setHasScrolledTerms(true);
      }
    };

    el.addEventListener("scroll", handleScroll);
    // Also check if content is short enough to not need scrolling
    if (el.scrollHeight <= el.clientHeight + 40) {
      setHasScrolledTerms(true);
    }

    return () => el.removeEventListener("scroll", handleScroll);
  }, [expandedTerms]);

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar con logo */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <img src="/logo-dosmicos.png" alt="Dosmicos" className="h-7" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto">
            <Shield className="h-6 w-6 text-gray-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Antes de subir tus videos
          </h1>
          <p className="text-sm text-gray-500">
            {creatorName}, necesitamos tu autorización para poder usar tu
            contenido.
          </p>
        </div>

        {/* Resumen visual — lo que están aceptando */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            En resumen
          </p>
          {TERMS_SUMMARY_POINTS.map((point, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">{point}</p>
            </div>
          ))}
        </div>

        {/* Términos expandibles */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setExpandedTerms(!expandedTerms)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>
              {expandedTerms
                ? "Términos y condiciones completos"
                : "Ver términos y condiciones completos"}
            </span>
            {expandedTerms ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {expandedTerms && (
            <div
              ref={termsRef}
              className="max-h-[50vh] overflow-y-auto px-4 pb-4 border-t border-gray-100"
            >
              <div className="pt-4 space-y-5">
                <div className="text-center pb-2">
                  <h2 className="text-base font-bold text-gray-900">
                    Autorización de Licencia de Contenido y Uso de Imagen
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    DOSMICOS S.A.S. — Última actualización: Febrero 2026
                  </p>
                </div>

                {TERMS_SECTIONS.map((section, i) => (
                  <div key={i} className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-gray-800">
                      {section.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>

              {!hasScrolledTerms && (
                <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-2 text-center">
                  <p className="text-xs text-gray-400 animate-pulse">
                    ↓ Desplaza para leer todo el documento
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          {/* Checkbox 1: Licencia de contenido */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={checkLicense}
                onChange={(e) => setCheckLicense(e.target.checked)}
                className="sr-only peer"
              />
              <div
                className={`
                w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                ${
                  checkLicense
                    ? "bg-black border-black"
                    : "border-gray-300 group-hover:border-gray-400"
                }
              `}
              >
                {checkLicense && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-700">
              Acepto la{" "}
              <strong>licencia de contenido</strong> y autorizo a Dosmicos a
              usar, publicar, editar y promocionar mis videos en sus canales y
              publicidad.
            </span>
          </label>

          {/* Checkbox 2: Menores de edad */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={checkMinor}
                onChange={(e) => setCheckMinor(e.target.checked)}
                className="sr-only peer"
              />
              <div
                className={`
                w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                ${
                  checkMinor
                    ? "bg-black border-black"
                    : "border-gray-300 group-hover:border-gray-400"
                }
              `}
              >
                {checkMinor && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-700">
              Si aparecen menores de edad en los videos, confirmo que soy su{" "}
              <strong>madre, padre o representante legal</strong> y autorizo el
              uso de su imagen.
            </span>
          </label>

          {/* Checkbox 3: Datos personales */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={checkData}
                onChange={(e) => setCheckData(e.target.checked)}
                className="sr-only peer"
              />
              <div
                className={`
                w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                ${
                  checkData
                    ? "bg-black border-black"
                    : "border-gray-300 group-hover:border-gray-400"
                }
              `}
              >
                {checkData && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-700">
              Autorizo el{" "}
              <strong>tratamiento de mis datos personales</strong> conforme a la
              Ley 1581 de 2012.
            </span>
          </label>
        </div>

        {/* Botón de aceptar */}
        <Button
          onClick={onAccept}
          disabled={!allChecked}
          className={`
            w-full gap-2 h-12 text-base rounded-xl transition-all
            ${
              allChecked
                ? "bg-black hover:bg-gray-800"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
          size="lg"
        >
          <Heart className="h-4 w-4" />
          Acepto y quiero subir mis videos
        </Button>

        {!allChecked && (
          <p className="text-xs text-center text-gray-400">
            Marca las tres casillas para continuar
          </p>
        )}

        {/* Footer */}
        <div className="pt-4 pb-8 text-center space-y-1">
          <p className="text-xs text-gray-300">Powered by Sewdle</p>
        </div>
      </div>
    </div>
  );
}
