import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/client';

interface ModuleSummary {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  is_active: boolean;
}

export function useModules() {
  return useQuery<ModuleSummary[]>({
    queryKey: ['modules'],
    queryFn: () => fetchWithAuth('/modules/'),
  });
}