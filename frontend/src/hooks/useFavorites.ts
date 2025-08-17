import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/indexedDB';
import toast from 'react-hot-toast';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      await db.migrateFavoritesFromLocalStorage();
      const favs = await db.getAllFavorites();
      setFavorites(favs);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(async (movieId: string) => {
    try {
      const isFavorited = await db.toggleFavorite(movieId);
      
      if (isFavorited) {
        setFavorites(prev => [...prev, movieId]);
        toast.success('Added to favorites', {
          icon: '⭐',
          duration: 2000,
        });
      } else {
        setFavorites(prev => prev.filter(id => id !== movieId));
        toast.success('Removed from favorites', {
          icon: '✨',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorites');
    }
  }, []);

  const isFavorite = useCallback((movieId: string) => {
    return favorites.includes(movieId);
  }, [favorites]);

  return { 
    favorites, 
    toggleFavorite, 
    isFavorite,
    isLoading,
    refetchFavorites: loadFavorites
  };
};