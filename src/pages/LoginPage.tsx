import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, AlertCircle, Mail, Lock, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { signIn } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);

    // Detect dark mode from <html> class
    const checkDark = () =>
      setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      clearTimeout(t);
      observer.disconnect();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: isDark ? '#0a0a0c' : undefined }}
    >
      {/* ── Light mode: mesh gradient background ── */}
      {!isDark && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(255,92,2,0.06) 0%, transparent 60%),' +
              'radial-gradient(ellipse 60% 80% at 80% 70%, rgba(255,138,61,0.05) 0%, transparent 60%),' +
              'radial-gradient(ellipse 100% 100% at 50% 50%, #fff8f2 0%, #ffffff 100%)',
          }}
        />
      )}

      {/* ── Dark mode: glowing aurora orbs ── */}
      {isDark && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 50% 40% at 25% 20%, rgba(255,92,2,0.07) 0%, transparent 70%),' +
                'radial-gradient(ellipse 40% 50% at 75% 75%, rgba(255,92,2,0.05) 0%, transparent 70%),' +
                'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,138,61,0.03) 0%, transparent 80%)',
            }}
          />
          <div
            className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,92,2,0.08) 0%, transparent 60%)',
              filter: 'blur(80px)',
              animation: 'floatA 14s ease-in-out infinite',
            }}
          />
          <div
            className="absolute bottom-[10%] right-[5%] w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,92,2,0.06) 0%, transparent 60%)',
              filter: 'blur(100px)',
              animation: 'floatB 18s ease-in-out infinite',
            }}
          />
          <div
            className="absolute top-[60%] left-[50%] w-[300px] h-[300px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,138,61,0.05) 0%, transparent 60%)',
              filter: 'blur(60px)',
              animation: 'floatA 10s ease-in-out infinite reverse',
            }}
          />
        </>
      )}

      {/* ── Light mode floating shapes ── */}
      {!isDark && (
        <>
          <div
            className="absolute top-1/4 -left-20 w-72 h-72 rounded-full opacity-[0.12]"
            style={{
              background: 'radial-gradient(circle, #ff5c02 0%, transparent 70%)',
              filter: 'blur(40px)',
              animation: 'floatA 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full opacity-[0.08]"
            style={{
              background: 'radial-gradient(circle, #ff5c02 0%, transparent 70%)',
              filter: 'blur(50px)',
              animation: 'floatB 10s ease-in-out infinite',
            }}
          />
        </>
      )}

      {/* ── Card container ── */}
      <div
        className="relative z-10 w-full max-w-md px-4"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition:
            'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <Card
          className="border-0 overflow-hidden"
          style={{
            background: isDark
              ? 'rgba(26,26,31,0.8)'
              : 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(24px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
            boxShadow: isDark
              ? '0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(255,92,2,0.04)'
              : '0 8px 40px rgba(255,92,2,0.08), 0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(255,255,255,0.6), inset 0 1px 0 rgba(255,255,255,0.7)',
            borderRadius: '20px',
          }}
        >
          <CardHeader className="text-center pb-2 pt-10">
            {/* Logo with glow */}
            <div className="flex justify-center mb-5">
              <div
                className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(135deg, #ff5c02 0%, #ff8a3d 100%)',
                  boxShadow: isDark
                    ? '0 8px 32px rgba(255,92,2,0.4), 0 0 60px rgba(255,92,2,0.15)'
                    : '0 8px 32px rgba(255,92,2,0.3), 0 0 40px rgba(255,92,2,0.08)',
                }}
              >
                <Wand2 className="w-9 h-9 text-white" strokeWidth={2} />
              </div>
            </div>

            {/* Title with gradient text */}
            <CardTitle
              className="text-3xl font-extrabold tracking-tight"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                  : 'linear-gradient(135deg, #1a1a1a 0%, #ff5c02 120%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              DosmiAds
            </CardTitle>

            {/* Tagline with delayed fade-in */}
            <p
              className="text-sm mt-2"
              style={{
                color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(8px)',
                transition:
                  'opacity 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s',
              }}
            >
              Genera imagenes con IA para productos y publicidad
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8 pt-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium"
                  style={{ color: isDark ? 'rgba(255,255,255,0.65)' : '#374151' }}
                >
                  Correo electronico
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11 transition-colors"
                    style={{
                      background: isDark ? '#1f1f24' : 'rgba(255,255,255,0.8)',
                      border: isDark
                        ? '1px solid rgba(255,255,255,0.08)'
                        : '1px solid #e5e7eb',
                      color: isDark ? '#ffffff' : '#111827',
                      borderRadius: '10px',
                    }}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium"
                  style={{ color: isDark ? 'rgba(255,255,255,0.65)' : '#374151' }}
                >
                  Contrasena
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }}
                  />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Tu contrasena"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-11 transition-colors"
                    style={{
                      background: isDark ? '#1f1f24' : 'rgba(255,255,255,0.8)',
                      border: isDark
                        ? '1px solid rgba(255,255,255,0.08)'
                        : '1px solid #e5e7eb',
                      color: isDark ? '#ffffff' : '#111827',
                      borderRadius: '10px',
                    }}
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm"
                  style={{
                    background: isDark
                      ? 'rgba(239,68,68,0.12)'
                      : 'rgba(239,68,68,0.08)',
                    border: isDark
                      ? '1px solid rgba(239,68,68,0.2)'
                      : '1px solid rgba(239,68,68,0.15)',
                  }}
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span style={{ color: isDark ? '#fca5a5' : '#b91c1c' }}>
                    {error}
                  </span>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-12 text-sm font-semibold text-white border-0 cursor-pointer"
                style={{
                  background: loading
                    ? '#cc4a02'
                    : 'linear-gradient(135deg, #ff5c02 0%, #ff7a2e 100%)',
                  boxShadow: isDark
                    ? '0 4px 20px rgba(255,92,2,0.35), 0 0 40px rgba(255,92,2,0.1)'
                    : '0 4px 16px rgba(255,92,2,0.25)',
                  borderRadius: '10px',
                  transition: 'all 0.2s ease',
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Iniciar Sesion
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Powered by AI */}
        <div
          className="flex items-center justify-center gap-1.5 mt-6 text-xs"
          style={{ color: isDark ? 'rgba(255,255,255,0.25)' : '#9ca3af' }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Powered by AI</span>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.05); }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 25px) scale(1.08); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
