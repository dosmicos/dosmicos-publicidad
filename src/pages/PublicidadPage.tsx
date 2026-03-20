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
  Sun,
  Moon,
  ChevronsLeft,
  ChevronsRight,
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
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarHover, setSidebarHover] = useState(false);
  const { signOut, user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);

  const handleReuse = (record: any) => {
    setReuseData(record);
    setActiveTab('generate');
  };

  // Dark mode effect
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  // Close mobile nav on tab change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeTab]);

  const userInitial = user?.email?.charAt(0)?.toUpperCase() || '?';

  const currentSection = sectionTitles[activeTab] || sectionTitles.generate;

  // --- Color tokens ---
  const c = {
    sidebarBg: dark
      ? '#161618'
      : '#ffffff',
    sidebarBorder: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    sidebarShadow: dark ? '1px 0 0 rgba(255,255,255,0.04)' : '2px 0 8px rgba(0,0,0,0.03), 1px 0 0 rgba(0,0,0,0.05)',
    navText: dark ? '#8b8b8e' : '#6b7280',
    navTextHover: dark ? '#e4e4e7' : '#1f2937',
    navHoverBg: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    activeBg: dark ? 'rgba(255,92,2,0.12)' : 'rgba(255,92,2,0.07)',
    activeColor: '#ff5c02',
    logoText: dark ? '#f4f4f5' : '#111827',
    headerBg: dark ? 'rgba(22,22,24,0.85)' : 'rgba(255,255,255,0.8)',
    headerBorder: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    breadcrumbMuted: dark ? '#52525b' : '#9ca3af',
    breadcrumbLabel: dark ? '#e4e4e7' : '#111827',
    pageBg: dark ? '#0e0e10' : '#f9fafb',
    mobileBg: dark ? 'rgba(22,22,24,0.95)' : 'rgba(255,255,255,0.92)',
    mobileBorder: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    mobileInactive: dark ? '#52525b' : '#9ca3af',
    avatarBg: 'linear-gradient(135deg, #ff5c02 0%, #ff8a3d 100%)',
    subtleText: dark ? '#52525b' : '#b0b0b5',
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: c.pageBg }}>
      {/* ===== Desktop Sidebar ===== */}
      <aside
        className="hidden md:flex flex-col shrink-0 relative z-20"
        style={{
          width: collapsed ? 52 : 200,
          transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1)',
          background: c.sidebarBg,
          boxShadow: c.sidebarShadow,
        }}
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
      >
        {/* Logo - click to toggle collapse */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center shrink-0 cursor-pointer select-none"
          style={{
            padding: collapsed ? '12px 0' : '12px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? 0 : 10,
            borderBottom: `1px solid ${c.sidebarBorder}`,
            transition: 'padding 0.25s ease',
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #ff5c02 0%, #ff7a2e 100%)',
              boxShadow: '0 2px 8px rgba(255,92,2,0.2)',
            }}
          >
            <Wand2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span
            className="font-semibold text-sm whitespace-nowrap"
            style={{
              color: c.logoText,
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : 'auto',
              overflow: 'hidden',
              transition: 'opacity 0.15s ease, width 0.25s ease',
            }}
          >
            DosmiAds
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-hidden">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="w-full flex items-center rounded-md text-xs font-medium relative group"
                style={{
                  padding: collapsed ? '6px 0' : '6px 8px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? 0 : 8,
                  background: isActive ? c.activeBg : 'transparent',
                  color: isActive ? c.activeColor : c.navText,
                  transition: 'all 0.12s ease',
                }}
                title={collapsed ? label : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = c.navHoverBg;
                    e.currentTarget.style.color = c.navTextHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = c.navText;
                  }
                }}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3 rounded-r-full"
                    style={{ background: c.activeColor }}
                  />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                <span
                  className="whitespace-nowrap"
                  style={{
                    opacity: collapsed ? 0 : 1,
                    width: collapsed ? 0 : 'auto',
                    overflow: 'hidden',
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  {label}
                </span>

                {/* Tooltip on collapsed */}
                {collapsed && (
                  <span
                    className="absolute left-full ml-2 px-2 py-1 rounded-md text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50"
                    style={{
                      background: dark ? '#27272a' : '#18181b',
                      transition: 'opacity 0.12s ease',
                    }}
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
          className="px-1.5 pb-2 pt-1.5"
          style={{ borderTop: `1px solid ${c.sidebarBorder}` }}
        >
          {/* Avatar - click to sign out */}
          {user && (
            <button
              onClick={signOut}
              className="w-full flex items-center rounded-md relative group"
              style={{
                padding: collapsed ? '6px 0' : '6px 8px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? 0 : 8,
                transition: 'all 0.12s ease',
              }}
              title={collapsed ? 'Cerrar sesion' : user.email || 'Cerrar sesion'}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = c.navHoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: c.avatarBg }}
              >
                {userInitial}
              </div>
              <span
                className="text-[11px] truncate"
                style={{
                  color: c.navText,
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : 'auto',
                  overflow: 'hidden',
                  transition: 'opacity 0.15s ease',
                }}
              >
                {user.email}
              </span>
              {/* Sign out icon on expanded */}
              {!collapsed && (
                <LogOut
                  className="w-3 h-3 shrink-0 ml-auto opacity-0 group-hover:opacity-60"
                  style={{ color: c.navText, transition: 'opacity 0.15s ease' }}
                />
              )}

              {/* Tooltip on collapsed */}
              {collapsed && (
                <span
                  className="absolute left-full ml-2 px-2 py-1 rounded-md text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50"
                  style={{
                    background: dark ? '#27272a' : '#18181b',
                    transition: 'opacity 0.12s ease',
                  }}
                >
                  Cerrar sesion
                </span>
              )}
            </button>
          )}

          {/* Collapse toggle chevron - appears on hover at bottom edge */}
          <div
            className="flex justify-center mt-1"
            style={{
              opacity: sidebarHover ? 0.5 : 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded"
              style={{
                color: c.subtleText,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.color = c.navTextHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '';
                e.currentTarget.style.color = c.subtleText;
              }}
            >
              {collapsed ? (
                <ChevronsRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronsLeft className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Main content ===== */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header
          className="shrink-0 flex items-center justify-between px-4 md:px-6"
          style={{
            height: 44,
            background: c.headerBg,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${c.headerBorder}`,
          }}
        >
          <div className="flex items-center gap-2.5">
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1 rounded-md transition-colors"
              style={{ color: c.navText }}
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = c.navHoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs">
              <span style={{ color: c.breadcrumbMuted }} className="hidden sm:inline">
                DosmiAds
              </span>
              <span style={{ color: c.breadcrumbMuted }} className="hidden sm:inline">
                /
              </span>
              <span className="font-semibold" style={{ color: c.breadcrumbLabel }}>
                {currentSection.title}
              </span>
            </div>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(!dark)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: c.navText }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = c.navHoverBg;
              e.currentTarget.style.color = c.navTextHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = c.navText;
            }}
            title={dark ? 'Modo claro' : 'Modo oscuro'}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
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
          height: 56,
          background: c.mobileBg,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: `1px solid ${c.mobileBorder}`,
          boxShadow: dark ? '0 -2px 12px rgba(0,0,0,0.3)' : '0 -2px 12px rgba(0,0,0,0.03)',
        }}
      >
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
              style={{
                color: isActive ? c.activeColor : c.mobileInactive,
                transition: 'color 0.15s ease',
              }}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full"
                  style={{ background: c.activeColor }}
                />
              )}
              <Icon className="w-[18px] h-[18px]" />
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile bottom padding to avoid content behind nav */}
      <style>{`
        @media (max-width: 767px) {
          main { padding-bottom: 56px; }
        }
      `}</style>
    </div>
  );
};

export default PublicidadPage;
