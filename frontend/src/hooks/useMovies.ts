import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { api } from '../services/api';
import { db } from '../services/indexedDB';
import type { QueryParams } from '../types';
import { useMemo } from 'react';

export const useMovies = (params?: QueryParams) => {
  const search = params?.search || '';
  const page = params?.page || 1;
  const limit = params?.limit || 20;

  const serverQuery = useQuery({
    queryKey: ['movies', params],
    queryFn: () => api.movies.list(params),
    staleTime: 5 * 60 * 1000,
  });

  const indexedDBMovies = useLiveQuery(
    async () => {
      if (search) {
        return await db.searchMovies(search);
      }
      return await db.getAllMovies();
    },
    [search]
  );

  const aggregatedData = useMemo(() => {
    const serverMovies = serverQuery.data?.movies || [];
    const localMovies = indexedDBMovies || [];
    
    const allMovies = [...localMovies, ...serverMovies];
    
    allMovies.sort((a, b) => a.name.localeCompare(b.name));
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMovies = allMovies.slice(startIndex, endIndex);
    
    return {
      movies: paginatedMovies,
      total: allMovies.length,
      serverCount: serverMovies.length,
      localCount: localMovies.length,
      page,
      limit,
    };
  }, [serverQuery.data, indexedDBMovies, page, limit]);

  return {
    data: aggregatedData,
    isLoading: serverQuery.isLoading,
    error: serverQuery.error,
    refetch: serverQuery.refetch,
  };
};

export const useServerMovies = (params?: QueryParams) => {
  return useQuery({
    queryKey: ['server-movies', params],
    queryFn: () => api.movies.list(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useIndexedDBMovies = (search?: string) => {
  return useLiveQuery(
    async () => {
      if (search) {
        return await db.searchMovies(search);
      }
      return await db.getAllMovies();
    },
    [search]
  );
};