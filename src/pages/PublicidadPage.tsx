import React, { useState } from 'react';
import { Wand2, History, Settings, Palette, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
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

const PublicidadPage = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [collapsed, setCollapsed] = useState(false);
  const [reuseData, setReuseData] = useState<any>(null);
  const { signOut, user } = useAuth();

  const handleReuse = (record: any) => {
    setReuseData(record);
    setActiveTab('generate');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shrink-0`}>
        {/* Logo */}
        <div className={`p-4 border-b border-gray-200 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-[#ff5c02] rounded-lg flex items-center justify-center shrink-0">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <span className="font-bold text-lg">DosmiAds</span>}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-[#ff5c02] text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-2 border-t border-gray-200 space-y-1">
          {/* User */}
          {!collapsed && user && (
            <div className="px-3 py-2 text-xs text-gray-500 truncate">{user.email}</div>
          )}

          {/* Sign out */}
          <button
            onClick={signOut}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors`}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Colapsar</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {activeTab === 'generate' && (
            <GenerateWorkspace reuseData={reuseData} onReuseConsumed={() => setReuseData(null)} />
          )}
          {activeTab === 'brand' && <BrandGuidePanel />}
          {activeTab === 'history' && <GenerationHistory onReuse={handleReuse} />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </main>
    </div>
  );
};

export default PublicidadPage;
