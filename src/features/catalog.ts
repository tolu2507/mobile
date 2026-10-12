import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Catalog, EducationLevel } from '@/types/api';

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    staleTime: Infinity,
    queryFn: async () => (await api.get<Catalog>('/catalog')).data,
  });
}

export const levelLabel = (catalog: Catalog | undefined, level: EducationLevel) =>
  catalog?.levels.find((l) => l.level === level)?.label ?? level;
