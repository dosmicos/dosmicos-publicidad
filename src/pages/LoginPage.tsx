import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle, Mail, Lock, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#07070c' }}
    >
      {/* Background glow orbs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 20% 15%, rgba(255,92,2,0.07) 0%, transparent 65%),' +
            'radial-gradient(ellipse 45% 55% at 80% 80%, rgba(255,92,2,0.05) 0%, transparent 65%)',
        }}
      />
      <div
        className="absolute top-[10%] left-[5%] w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,92,2,0.07) 0%, transparent 65%)',
          filter: 'blur(90px)',
          animation: 'floatA 16s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-[5%] right-[5%] w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,92,2,0.05) 0%, transparent 65%)',
          filter: 'blur(110px)',
          animation: 'floatB 20s ease-in-out infinite',
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm px-4"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(16,16,22,0.9)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.6), 0 0 100px rgba(255,92,2,0.04)',
          }}
        >
          {/* Top accent bar */}
          <div
            className="h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, transparent 0%, #ff5c02 50%, transparent 100%)' }}
          />

          <div className="px-8 pt-8 pb-9">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: 'linear-gradient(135deg, #ff5c02 0%, #ff8a3d 100%)',
                  boxShadow: '0 8px 28px rgba(255,92,2,0.35), 0 0 60px rgba(255,92,2,0.12)',
                }}
              >
                <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <h1
                className="text-2xl font-extrabold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Panel Admin
              </h1>
              <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                DosmiAds · Acceso restringido
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-medium"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  Correo
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  />
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@dosmicos.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,92,2,0.5)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-medium"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,92,2,0.5)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.18)',
                  }}
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span style={{ color: '#fca5a5' }}>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{
                  background: 'linear-gradient(135deg, #ff5c02 0%, #ff7a2e 100%)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(255,92,2,0.3)',
                }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {loading ? 'Iniciando sesión…' : 'Entrar al Panel'}
              </button>
            </form>
          </div>
        </div>

        {/* Back to public */}
        <div className="text-center mt-5">
          <a
            href="/"
            className="text-xs transition-colors"
            style={{ color: 'rgba(255,255,255,0.2)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
          >
            ← Ver dashboard de creadoras
          </a>
        </div>
      </div>

      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -25px) scale(1.04); }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 20px) scale(1.06); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
