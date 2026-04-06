import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import LoginPage from '@/pages/LoginPage';
import PublicidadPage from '@/pages/PublicidadPage';
import RankingPage from '@/pages/RankingPage';
import CreatorPortalPage from '@/pages/CreatorPortalPage';

const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ffffff',
    gap: '16px',
  }}>
    <div style={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      border: '3px solid #ff5c02',
      borderTopColor: 'transparent',
      animation: 'spin 0.8s linear infinite',
    }} />
    <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Cargando DosmiAds…</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path="/ranking" element={<RankingPage />} />
      <Route path="/creator" element={<CreatorPortalPage />} />

      {/* Protected routes */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<ProtectedRoute><OrganizationProvider><PublicidadPage /></OrganizationProvider></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return <BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>;
}
