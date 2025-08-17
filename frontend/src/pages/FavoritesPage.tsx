import React, { useMemo } from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';
import { useMovies } from '../hooks/useMovies';
import { useFavorites } from '../hooks/useFavorites';
import { useMovieActions } from '../hooks/useMovieActions';
import { MovieCard } from '../components/MovieCard';
import { MovieForm } from '../components/MovieForm';
import type { Movie, CreateMovie } from '../types/movie';

export const FavoritesPage: React.FC = () => {
  const [editingMovie, setEditingMovie] = React.useState<Movie | undefined>();
  const { data, isLoading, refetch } = useMovies();
  const { favorites, toggleFavorite } = useFavorites();
  const { updateMovie, deleteMovie } = useMovieActions();

  const favoriteMovies = useMemo(() => {
    if (!data?.movies) return [];
    return data.movies.filter(movie => {
      const movieId = `${movie.storage_type}-${movie.id}`;
      return favorites.includes(movieId);
    });
  }, [data?.movies, favorites]);

  const handleToggleFavorite = (movie: Movie) => {
    const movieId = `${movie.storage_type}-${movie.id}`;
    toggleFavorite(movieId);
  };

  const handleUpdateMovie = async (movieData: CreateMovie) => {
    if (!editingMovie?.id) return;
    
    const result = await updateMovie(editingMovie.id, movieData);
    if (result.success) {
      setEditingMovie(undefined);
      refetch();
    }
  };

  const handleDeleteMovie = async (movie: Movie) => {
    if (!movie.id) return;
    
    if (confirm(`Are you sure you want to delete "${movie.name}"?`)) {
      const result = await deleteMovie(movie.id);
      if (result.success) {
        refetch();
      }
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <HeartIcon className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            My Favorites
          </h1>
        </div>
        <p className="text-gray-600">
          {favoriteMovies.length} {favoriteMovies.length === 1 ? 'movie' : 'movies'} in your favorites
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : favoriteMovies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {favoriteMovies.map((movie) => (
            <MovieCard
              key={`${movie.storage_type}-${movie.id}`}
              movie={movie}
              isFavorite={true}
              onToggleFavorite={handleToggleFavorite}
              onEdit={movie.storage_type === 'indexedDB' ? setEditingMovie : undefined}
              onDelete={movie.storage_type === 'indexedDB' ? handleDeleteMovie : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <HeartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No favorites yet</h2>
          <p className="text-gray-500">
            Start adding movies to your favorites by clicking the star icon on any movie card
          </p>
        </div>
      )}

      {editingMovie && (
        <MovieForm
          movie={editingMovie}
          onSubmit={handleUpdateMovie}
          onCancel={() => setEditingMovie(undefined)}
        />
      )}
    </div>
  );
};