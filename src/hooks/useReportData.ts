import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  Armoire,
  ReleveEtude,
  ReleveSysteme,
  Installation,
  InstallationSysteme,
  Verification,
  VerificationSysteme,
  Site,
} from '@/types/database.types';

interface ArmoireWithData extends Armoire {
  site?: Site;
  releve_etudes?: (ReleveEtude & {
    releve_systemes?: ReleveSysteme[];
  })[];
  installations?: (Installation & {
    installation_systemes?: InstallationSysteme[];
  })[];
  verifications?: (Verification & {
    verification_systemes?: VerificationSysteme[];
  })[];
}

export function useReportData(clientId?: string, siteId?: string) {
  return useQuery({
    queryKey: ['report-data', clientId, siteId],
    queryFn: async () => {
      if (!clientId) return null;

      let query = supabase
        .from('armoires')
        .select(
          `
          *,
          site:sites!inner (
            *,
            client:clients!inner (*)
          ),
          releve_etudes (
            *,
            releve_systemes (*)
          ),
          installations (
            *,
            installation_systemes (*)
          ),
          verifications (
            *,
            verification_systemes (*)
          )
        `
        )
        .eq('site.client_id', clientId);

      if (siteId) {
        query = query.eq('site_id', siteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ArmoireWithData[];
    },
    enabled: !!clientId,
  });
}
