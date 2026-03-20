import React, { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  History,
  Settings,
  Palette,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import GenerateWorkspace from '@/components/publicidad/GenerateWorkspace';
import GenerationHistory from '@/components/publicidad/GenerationHistory';
import SettingsPanel from '@/components/publicidad/SettingsPanel';
import BrandGuidePanel from '@/components/publicidad/BrandGuidePanel';

const navItems = [
  { id: 'generate', label: 'Generar', icon: Wand2 },
  { id: 'brand', label: 'Marca', icon: Palette },
  { id: 'history', label: 'Historial', icon: History },
  { id: 'settings', label: 'Ajustes', icon: Settings },
];

const sectionTitles: Record<string, { title: string; description: string }> = {
  generate: { title: 'Generar', description: 'Crea imagenes publicitarias con IA' },
  brand: { title: 'Guia de Marca', description: 'Configura tu identidad visual' },
  history: { title: 'Historial', description: 'Generaciones anteriores' },
  settings: { title: 'Ajustes', description: 'Configuracion de la aplicacion' },
};

const PublicidadPage = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [collapsed, setCollapsed] = useState(false);
  const [reuseData, setReuseData] = useState<any>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { signOut, user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);

  const handleReuse = (record: any) => {
    setReuseData(record);
    setActiveTab('generate');
  };

  // Close mobile nav on tab change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeTab]);

  const userInitial = user?.email?.charAt(0)?.toUpperCase() || '?';

  const currentSection = sectionTitles[activeTab] || sectionTitles.generate;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/80">
      {/* ===== Desktop Sidebar ===== */}
      <aside
        className="hidden md:flex flex-col shrink-0 relative z-20"
        style={{
          width: collapsed ? 68 : 224,
          transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1)',
          background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)',
          boxShadow: '2px 0 12px rgba(0,0,0,0.04), 1px 0 0 rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center shrink-0"
          style={{
            padding: collapsed ? '16px 0' : '16px 20px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? 0 : 12,
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #ff5c02 0%, #ff7a2e 100%)',
              boxShadow: '0 4px 12px rgba(255,92,2,0.25)',
            }}
          >
            <Wand2 className="w-[18px] h-[18px] text-white" />
          </div>
          <span
            className="font-bold text-lg text-gray-900 whitespace-nowrap"
            style={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : 'auto',
              overflow: 'hidden',
              transition: 'opacity 0.2s ease, width 0.3s ease',
            }}
          >
            DosmiAds
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2.5 space-y-1 overflow-hidden">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="w-full flex items-center rounded-lg text-sm font-medium relative group"
                style={{
                  padding: collapsed ? '10px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? 0 : 12,
                  background: isActive ? 'rgba(255,92,2,0.08)' : 'transparent',
                  color: isActive ? '#ff5c02' : '#6b7280',
                  transition: 'all 0.15s ease',
                  borderLeft: isActive ? '3px solid #ff5c02' : '3px solid transparent',
                  marginLeft: collapsed ? 0 : -2,
                }}
                title={collapsed ? label : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                    e.currentTarget.style.color = '#1f2937';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span
                  className="whitespace-nowrap"
                  style={{
                    opacity: collapsed ? 0 : 1,
                    width: collapsed ? 0 : 'auto',
                    overflow: 'hidden',
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {label}
                </span>

                {/* Tooltip on collapsed */}
                {collapsed && (
                  <span
                    className="absolute left-full ml-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-white bg-gray-800 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50"
                    style={{ transition: 'opacity 0.15s ease' }}
                  >
                    {label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div
          className="px-2.5 pb-3 pt-2 space-y-1"
          style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
        >
          {/* User avatar + email */}
          {!collapsed && user && (
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #ff5c02 0%, #ff8a3d 100%)',
                }}
              >
                {userInitial}
              </div>
              <span className="text-xs text-gray-500 truncate">{user.email}</span>
            </div>
          )}

          {/* Collapsed: avatar only */}
          {collapsed && user && (
            <div className="flex justify-center py-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, #ff5c02 0%, #ff8a3d 100%)',
                }}
                title={user.email || ''}
              >
                {userInitial}
              </div>
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={signOut}
            className="w-full flex items-center rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            style={{
              padding: collapsed ? '8px 0' : '8px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 10,
              transition: 'all 0.15s ease',
            }}
            title={collapsed ? 'Cerrar sesion' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span
              style={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : 'auto',
                overflow: 'hidden',
                transition: 'opacity 0.2s ease',
              }}
            >
              Cerrar sesion
            </span>
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center rounded-lg text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            style={{
              padding: collapsed ? '8px 0' : '8px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 10,
              transition: 'all 0.15s ease',
            }}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
            <span
              style={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : 'auto',
                overflow: 'hidden',
                transition: 'opacity 0.2s ease',
              }}
            >
              Colapsar
            </span>
          </button>
        </div>
      </aside>

      {/* ===== Main content ===== */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header
          className="shrink-0 flex items-center justify-between px-6 md:px-8"
          style={{
            height: 56,
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              <PanelLeft className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 hidden sm:inline">DosmiAds</span>
              <span className="text-gray-300 hidden sm:inline">/</span>
              <span className="font-semibold text-gray-900">{currentSection.title}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 hidden sm:block">{currentSection.description}</p>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto" ref={contentRef}>
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {activeTab === 'generate' && (
              <GenerateWorkspace
                reuseData={reuseData}
                onReuseConsumed={() => setReuseData(null)}
              />
            )}
            {activeTab === 'brand' && <BrandGuidePanel />}
            {activeTab === 'history' && <GenerationHistory onReuse={handleReuse} />}
            {activeTab === 'settings' && <SettingsPanel />}
          </div>
        </div>
      </main>

      {/* ===== Mobile bottom nav ===== */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch"
        style={{
          height: 64,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.04)',
        }}
      >
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative"
              style={{
                color: isActive ? '#ff5c02' : '#9ca3af',
                transition: 'color 0.15s ease',
              }}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: '#ff5c02' }}
                />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile bottom padding to avoid content behind nav */}
      <style>{`
        @media (max-width: 767px) {
          main { padding-bottom: 64px; }
        }
      `}</style>
    </div>
  );
};

export default PublicidadPage;
