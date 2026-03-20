import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Organization { id: string; name: string; }
interface OrganizationContextType { currentOrganization: Organization | null; loading: boolean; }
const OrganizationContext = createContext<OrganizationContextType>({} as OrganizationContextType);
export const useOrganization = () => useContext(OrganizationContext);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrg = async () => {
      if (!user) { setCurrentOrganization(null); setLoading(false); return; }
      try {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
        if (profile?.organization_id) {
          const { data: org } = await supabase.from('organizations').select('id, name').eq('id', profile.organization_id).single();
          setCurrentOrganization(org || null);
        }
      } catch (err) { console.error('Error fetching org:', err); }
      finally { setLoading(false); }
    };
    fetchOrg();
  }, [user]);

  return <OrganizationContext.Provider value={{ currentOrganization, loading }}>{children}</OrganizationContext.Provider>;
};
