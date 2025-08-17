import { useCallback } from 'react';
import { db } from '../services/indexedDB';
import type { CreateMovie, UpdateMovie } from '../types/movie';

export const useMovieActions = () => {
  const addMovie = useCallback(async (movie: CreateMovie) => {
    try {
      const id = await db.addMovie(movie);
      return { success: true, id };
    } catch (error) {
      console.error('Failed to add movie:', error);
      return { success: false, error };
    }
  }, []);

  const updateMovie = useCallback(async (id: number, updates: UpdateMovie) => {
    try {
      await db.updateMovie(id, updates);
      return { success: true };
    } catch (error) {
      console.error('Failed to update movie:', error);
      return { success: false, error };
    }
  }, []);

  const deleteMovie = useCallback(async (id: number) => {
    try {
      await db.deleteMovie(id);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete movie:', error);
      return { success: false, error };
    }
  }, []);

  const importMovies = useCallback(async (movies: CreateMovie[]) => {
    try {
      await db.importMovies(movies);
      return { success: true };
    } catch (error) {
      console.error('Failed to import movies:', error);
      return { success: false, error };
    }
  }, []);

  const exportMovies = useCallback(async () => {
    try {
      await db.exportMovies();
      return { success: true };
    } catch (error) {
      console.error('Failed to export movies:', error);
      return { success: false, error };
    }
  }, []);

  return { addMovie, updateMovie, deleteMovie, importMovies, exportMovies };
};