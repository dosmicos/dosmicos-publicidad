import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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

export default function UploadFlowPage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<FlowStep>("loading");
  const [validation, setValidation] = useState<TokenValidation | null>(null);

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
          // Check localStorage if terms were already accepted for this token
          const acceptedKey = `dosmicos_terms_${token}`;
          const alreadyAccepted = localStorage.getItem(acceptedKey);

          if (alreadyAccepted) {
            setStep("upload");
          } else {
            setStep("terms");
          }
        } else {
          setStep("invalid");
        }
      }
    }

    validateToken();
  }, [token]);

  // Handle terms acceptance
  const handleAcceptTerms = () => {
    if (token) {
      const acceptedKey = `dosmicos_terms_${token}`;
      localStorage.setItem(acceptedKey, new Date().toISOString());
    }
    setStep("upload");
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
