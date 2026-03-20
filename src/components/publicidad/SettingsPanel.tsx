import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image as ImageIcon, FileText, Zap, Settings } from 'lucide-react';
import SeedImageManager from './SeedImageManager';
import SavedPromptsManager from './SavedPromptsManager';
import SkillsManager from './SkillsManager';

const SettingsPanel = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff5c02]/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#ff5c02]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuracion</h1>
            <p className="text-sm text-gray-500">Gestiona tus semillas, prompts y skills de generacion</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="product-seeds" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-gray-100/80 dark:bg-[#252529] rounded-xl">
          <TabsTrigger
            value="product-seeds"
            className="flex items-center gap-2 py-2.5 px-3 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1f] data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none data-[state=active]:text-[#ff5c02] transition-all"
          >
            <ImageIcon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline text-sm font-medium">Producto</span>
          </TabsTrigger>
          <TabsTrigger
            value="ad-seeds"
            className="flex items-center gap-2 py-2.5 px-3 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1f] data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none data-[state=active]:text-[#ff5c02] transition-all"
          >
            <ImageIcon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline text-sm font-medium">Publicidad</span>
          </TabsTrigger>
          <TabsTrigger
            value="prompts"
            className="flex items-center gap-2 py-2.5 px-3 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1f] data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none data-[state=active]:text-[#ff5c02] transition-all"
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline text-sm font-medium">Prompts</span>
          </TabsTrigger>
          <TabsTrigger
            value="skills"
            className="flex items-center gap-2 py-2.5 px-3 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1f] data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none data-[state=active]:text-[#ff5c02] transition-all"
          >
            <Zap className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline text-sm font-medium">Skills</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="product-seeds" className="mt-8">
          <SeedImageManager type="product" />
        </TabsContent>

        <TabsContent value="ad-seeds" className="mt-8">
          <SeedImageManager type="advertising" />
        </TabsContent>

        <TabsContent value="prompts" className="mt-8">
          <SavedPromptsManager />
        </TabsContent>

        <TabsContent value="skills" className="mt-8">
          <SkillsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPanel;
