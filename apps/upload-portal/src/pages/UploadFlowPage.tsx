import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { TERMS_VERSION } from "@/lib/terms-content";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import TermsConsentPage from "./TermsConsentPage";
import UgcUploadPage from "./UgcUploadPage";

// ============================================================
// Types (shared with UgcUploadPage)
// ============================================================

export interface CreatorInfo {
  id: string;
  name: string;
  instagram_handle: string;
  avatar_url: string;
}

export interface CampaignInfo {
  id: string;
  name: string;
  status: string;
  agreed_videos: number;
}

export interface TokenValidation {
  valid: boolean;
  error?: string;
  creator?: CreatorInfo;
  campaigns?: CampaignInfo[];
  token_id?: string;
  organization_id?: string;
}

// ============================================================
// Flow steps
// ============================================================

type FlowStep = "loading" | "invalid" | "terms" | "upload";

// ============================================================
// Constancia local de la aceptación
// ============================================================
//
// Antes, aceptar los términos solo dejaba una marca en `localStorage`. Es decir,
// en ningún lado: se borra al limpiar el navegador y no existe si la creadora
// entra desde otro teléfono. Cuando alguien preguntara quién autorizó que la
// cara de un niño saliera en una pauta, no había respuesta.
//
// Ahora la constancia se guarda en la base (`public.ugc_upload_consents`, vía el
// RPC `record_ugc_upload_consent`) y `localStorage` queda solo como comodidad:
// evita volver a mostrar la pantalla en el mismo teléfono.
//
// La marca vieja era un string ISO suelto. Solo se salta la pantalla si la marca
// trae `consent_id`, que únicamente existe si el servidor confirmó la fila. Así,
// quien ya había aceptado antes de este cambio vuelve a ver la pantalla una vez
// —un toque— y a cambio queda su constancia de verdad.

const CONSENT_STORAGE_PREFIX = "dosmicos_terms_";

interface StoredConsent {
  consent_id: string;
  terms_version: string;
  accepted_at: string;
}

function readStoredConsent(token: string): StoredConsent | null {
  try {
    const raw = localStorage.getItem(`${CONSENT_STORAGE_PREFIX}${token}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (!parsed?.consent_id) return null;
    if (parsed.terms_version !== TERMS_VERSION) return null;

    return parsed as StoredConsent;
  } catch {
    // Marca vieja (ISO suelto), JSON corrupto o almacenamiento bloqueado.
    // En todos los casos: no hay constancia confirmada, se muestra la pantalla.
    return null;
  }
}

// No todos los fallos se arreglan reintentando, y decirle "revisa tu conexión"
// a alguien cuyo problema es que el servidor no tiene registrada la versión del
// texto la deja tocando un botón que nunca va a funcionar. Peor: nos oculta a
// nosotros que hay un despliegue fuera de orden (el portal salió antes que la
// migración). Estos dos casos se nombran aparte.
function mensajeDeError(e: unknown): string {
  const codigo = e instanceof Error ? e.message : "";

  if (codigo === "unknown_terms_version" || codigo === "no_current_terms_version") {
    return "Hay un problema de nuestro lado con la versión de los términos. No es tu conexión: escríbenos y lo arreglamos hoy mismo.";
  }

  if (codigo === "invalid_token") {
    return "Este enlace ya no está activo. Pídenos uno nuevo y súbelo sin problema.";
  }

  return "No pudimos guardar tu autorización. Revisa tu conexión e intenta de nuevo.";
}

function writeStoredConsent(token: string, consent: StoredConsent): void {
  try {
    localStorage.setItem(
      `${CONSENT_STORAGE_PREFIX}${token}`,
      JSON.stringify(consent)
    );
  } catch {
    // Modo privado o almacenamiento lleno. No importa: la constancia que vale
    // ya quedó en la base. Lo único que se pierde es saltarse la pantalla.
  }
}

export default function UploadFlowPage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<FlowStep>("loading");
  const [validation, setValidation] = useState<TokenValidation | null>(null);
  const [isRecordingConsent, setIsRecordingConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setValidation({ valid: false, error: "No se proporcionó un token" });
        setStep("invalid");
        return;
      }

      const { data, error } = await supabase.rpc("validate_ugc_upload_token", {
        p_token: token,
      });

      if (error) {
        setValidation({ valid: false, error: "Error al validar el enlace" });
        setStep("invalid");
      } else {
        const result = data as unknown as TokenValidation;
        setValidation(result);

        if (result.valid) {
          // Solo se salta la pantalla si en este teléfono hay constancia de una
          // aceptación que el servidor ya confirmó para esta versión del texto.
          setStep(readStoredConsent(token) ? "upload" : "terms");
        } else {
          setStep("invalid");
        }
      }
    }

    validateToken();
  }, [token]);

  // Handle terms acceptance
  //
  // Si no se logra dejar la constancia en la base, NO se pasa a subir. Es la
  // decisión incómoda a propósito: contenido con menores de edad que termina en
  // publicidad pagada no puede entrar sin que quede escrito quién lo autorizó.
  // Un fallo de red cuesta un reintento; una foto sin autorización demostrable
  // cuesta bastante más.
  const handleAcceptTerms = async (checks: {
    license: boolean;
    minor: boolean;
    data: boolean;
  }) => {
    if (!token) return;

    setIsRecordingConsent(true);
    setConsentError(null);

    try {
      const { data, error } = await supabase.rpc("record_ugc_upload_consent", {
        p_token: token,
        p_accepted_content_license: checks.license,
        p_accepted_minor_representation: checks.minor,
        p_accepted_data_processing: checks.data,
        p_terms_version: TERMS_VERSION,
        p_user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
      });

      if (error) throw new Error(error.message);

      const result = data as unknown as {
        success: boolean;
        error?: string;
        consent_id?: string;
        terms_version?: string;
      };

      if (!result?.success || !result.consent_id) {
        throw new Error(result?.error || "unknown_error");
      }

      writeStoredConsent(token, {
        consent_id: result.consent_id,
        terms_version: result.terms_version || TERMS_VERSION,
        accepted_at: new Date().toISOString(),
      });

      setStep("upload");
    } catch (e) {
      setConsentError(mensajeDeError(e));
    } finally {
      setIsRecordingConsent(false);
    }
  };

  // ============================================================
  // Render: Loading
  // ============================================================
  if (step === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logo-dosmicos.png"
            alt="Dosmicos"
            className="h-10 opacity-60"
          />
          <Loader2 className="h-6 w-6 animate-spin text-black/40" />
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: Invalid token
  // ============================================================
  if (step === "invalid") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardContent className="pt-6 text-center space-y-4">
            <img
              src="/logo-dosmicos.png"
              alt="Dosmicos"
              className="h-8 mx-auto opacity-60"
            />
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-semibold">Enlace no válido</h2>
            <p className="text-gray-500">
              {validation?.error || "Este enlace no es válido o ha expirado."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================
  // Render: Terms page
  // ============================================================
  if (step === "terms") {
    return (
      <TermsConsentPage
        creatorName={validation?.creator?.name || ""}
        onAccept={handleAcceptTerms}
        isSubmitting={isRecordingConsent}
        errorMessage={consentError}
      />
    );
  }

  // ============================================================
  // Render: Upload page
  // ============================================================
  return (
    <UgcUploadPage
      token={token!}
      validation={validation!}
    />
  );
}
