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
  const { signIn } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #fff5ee 0%, #ffe8d6 25%, #ffd4b8 50%, #ffe0cc 75%, #fff8f2 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 12s ease infinite',
        }}
      />

      {/* Subtle floating shapes */}
      <div
        className="absolute top-1/4 -left-20 w-72 h-72 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, #ff5c02 0%, transparent 70%)',
          animation: 'floatA 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, #ff5c02 0%, transparent 70%)',
          animation: 'floatB 10s ease-in-out infinite',
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md px-4"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <Card
          className="border-0 overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow:
              '0 8px 32px rgba(255,92,2,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          <CardHeader className="text-center pb-2 pt-8">
            {/* Logo container */}
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #ff5c02 0%, #ff8a3d 100%)',
                  boxShadow: '0 8px 24px rgba(255,92,2,0.3)',
                }}
              >
                <Wand2 className="w-8 h-8 text-white" />
              </div>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
              DosmiAds
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1.5">
              Genera imagenes con IA para productos y publicidad
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
                  Correo electronico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11 bg-white/60 border-gray-200 focus:border-[#ff5c02] focus:ring-[#ff5c02]/20 transition-colors"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
                  Contrasena
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Tu contrasena"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-11 bg-white/60 border-gray-200 focus:border-[#ff5c02] focus:ring-[#ff5c02]/20 transition-colors"
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.15)',
                  }}
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold text-white border-0 cursor-pointer"
                style={{
                  background: loading
                    ? '#cc4a02'
                    : 'linear-gradient(135deg, #ff5c02 0%, #ff7a2e 100%)',
                  boxShadow: '0 4px 12px rgba(255,92,2,0.25)',
                  transition: 'all 0.2s ease',
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Iniciar Sesion
              </Button>

              {/* Keyboard hint */}
              <p className="text-center text-xs text-gray-400">
                Presiona{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-500 font-mono text-[11px]">
                  Enter
                </kbd>{' '}
                para iniciar sesion
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Powered by AI */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-gray-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Powered by AI</span>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
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
