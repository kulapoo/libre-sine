import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { CreateMovieCollection, UpdateMovieCollection, QueryParams } from '../types';

export const useMovieCollections = (params?: QueryParams) => {
  return useQuery({
    queryKey: ['movieCollections', params],
    queryFn: () => api.movieCollections.list(params),
  });
};

export const useMovieCollection = (id: number) => {
  return useQuery({
    queryKey: ['movieCollection', id],
    queryFn: () => api.movieCollections.get(id),
    enabled: !!id,
  });
};

export const useCreateMovieCollection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (collection: CreateMovieCollection) => api.movieCollections.create(collection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movieCollections'] });
    },
  });
};

export const useUpdateMovieCollection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, collection }: { id: number; collection: UpdateMovieCollection }) => 
      api.movieCollections.update(id, collection),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['movieCollections'] });
      queryClient.invalidateQueries({ queryKey: ['movieCollection', id] });
    },
  });
};

export const useDeleteMovieCollection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.movieCollections.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movieCollections'] });
    },
  });
};

export const useMoviesFromCollection = (url: string | undefined) => {
  return useQuery({
    queryKey: ['movies', url],
    queryFn: () => api.movieCollections.fetchMovies(url!),
    enabled: !!url,
    staleTime: 10 * 60 * 1000,
  });
};