import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/pages/LoginPage';
import UgcDashboardPage from '@/pages/UgcDashboardPage';
import CreatorPortalPage from '@/pages/CreatorPortalPage';
import AdminPage from '@/pages/AdminPage';

const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0f',
    gap: '16px',
  }}>
    <div style={{
      width: 36,
      height: 36,
      borderRadius: '50%',
      border: '3px solid #ff5c02',
      borderTopColor: 'transparent',
      animation: 'spin 0.8s linear infinite',
    }} />
    <p style={{ color: '#4b5563', fontSize: '13px', margin: 0 }}>Cargando DosmiAds…</p>
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
      {/* Public routes */}
      <Route path="/" element={<UgcDashboardPage />} />
      <Route path="/c/:token" element={<CreatorPortalPage />} />
      <Route path="/login" element={user ? <Navigate to="/admin" replace /> : <LoginPage />} />

      {/* Protected admin route */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
