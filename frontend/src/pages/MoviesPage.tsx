import React, { useState } from 'react';
import { PlusIcon, InformationCircleIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useMovies } from '../hooks/useMovies';
import { useMovieActions } from '../hooks/useMovieActions';
import { useFavorites } from '../hooks/useFavorites';
import { usePersistedState } from '../hooks/usePersistedState';
import { MovieCard } from '../components/MovieCard';
import { MovieForm } from '../components/MovieForm';
import { MovieImportModal } from '../components/MovieImportModal';
import { SearchBar } from '../components/SearchBar';
import type { Movie, CreateMovie } from '../types/movie';

export const MoviesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = usePersistedState<string>(
    'movie-filter-genre',
    'all',
    (value) => typeof value === 'string'
  );
  const [sortBy, setSortBy] = usePersistedState<'name' | 'rating' | 'recent' | 'favorites' | 'created_at'>(
    'movie-sort-by',
    'name',
    (value) => ['name', 'rating', 'recent', 'favorites', 'created_at'].includes(value as string)
  );
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | undefined>();

  const { data, isLoading, refetch } = useMovies({
    search,
    page,
    limit: 20
  });

  const { addMovie, updateMovie, deleteMovie, importMovies, exportMovies } = useMovieActions();
  const { favorites, toggleFavorite } = useFavorites();

  const movies = React.useMemo(() => data?.movies || [], [data?.movies]);
  console.log(movies);
  const filteredMovies = React.useMemo(() => {
    let filtered = [...movies];

    if (selectedGenre !== 'all') {
      filtered = filtered.filter(movie =>
        movie.genres?.includes(selectedGenre)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_at':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'favorites': {
          const aId = `${a.storage_type}-${a.id}`;
          const bId = `${b.storage_type}-${b.id}`;
          const aFav = favorites.includes(aId) ? 1 : 0;
          const bFav = favorites.includes(bId) ? 1 : 0;
          if (bFav !== aFav) return bFav - aFav;
          return a.name.localeCompare(b.name);
        }
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [movies, selectedGenre, sortBy, favorites]);

  const allGenres = React.useMemo(() => {
    const genreSet = new Set<string>();
    movies.forEach(movie => {
      movie.genres?.forEach(genre => genreSet.add(genre));
    });
    return Array.from(genreSet).sort();
  }, [movies]);

  const handleAddMovie = async (movieData: CreateMovie) => {
    const result = await addMovie(movieData);
    if (result.success) {
      toast.success(`Successfully added "${movieData.name}"`);
      setShowForm(false);
      refetch();
    } else {
      toast.error('Failed to add movie. Please try again.');
    }
  };

  const handleUpdateMovie = async (movieData: CreateMovie) => {
    if (!editingMovie?.id) return;

    const result = await updateMovie(editingMovie.id, movieData);
    if (result.success) {
      toast.success(`Successfully updated "${movieData.name}"`);
      setEditingMovie(undefined);
      refetch();
    } else {
      toast.error('Failed to update movie. Please try again.');
    }
  };

  const handleDeleteMovie = async (movie: Movie) => {
    if (!movie.id) return;

    if (confirm(`Are you sure you want to delete "${movie.name}"?`)) {
      const result = await deleteMovie(movie.id);
      if (result.success) {
        toast.success(`Successfully deleted "${movie.name}"`);
        refetch();
      } else {
        toast.error('Failed to delete movie. Please try again.');
      }
    }
  };

  const handleToggleFavorite = (movie: Movie) => {
    const movieId = `${movie.storage_type}-${movie.id}`;
    toggleFavorite(movieId);
  };

  const isFavorite = (movie: Movie) => {
    const movieId = `${movie.storage_type}-${movie.id}`;
    return favorites.includes(movieId);
  };

  const handleImportMovies = async (movies: CreateMovie[]) => {
    const result = await importMovies(movies);
    if (result.success) {
      toast.success(`Successfully imported ${movies.length} movie${movies.length !== 1 ? 's' : ''}!`);
      setShowImport(false);
      refetch();
    } else {
      toast.error('Failed to import movies. Please try again.');
    }
  };

  const handleExportMovies = async () => {
    const result = await exportMovies();
    if (result.success) {
      toast.success('Movies exported successfully!');
    } else {
      toast.error('Failed to export movies. Please try again.');
    }
  };

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Movie Directory
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              Import JSON
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Add Personal Movie
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 max-w-lg">
            <SearchBar onSearch={setSearch} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Genres</option>
              {allGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'recent' | 'favorites' | 'created_at')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="rating">Sort by Rating</option>
              <option value="favorites">Sort by Favorites</option>
              <option value="created_at">Sort by Date (Old First)</option>
              <option value="recent">Sort by Date (New First)</option>
            </select>
          </div>
        </div>

        {filteredMovies.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-800">{filteredMovies.length}</span> of <span className="font-semibold text-gray-800">{data?.total || 0}</span> movies
                {data?.page && data.page > 1 && ` (Page ${data.page})`}
              </p>
              <div className="flex items-center gap-3">
                {data?.serverCount ? (
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                    {data.serverCount} from library
                  </span>
                ) : null}
                {data?.localCount ? (
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                    {data.localCount} personal
                  </span>
                ) : null}
              </div>
            </div>

            {!!data?.localCount && data.localCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm flex-1">
                    <p className="text-blue-800 font-medium mb-1">Personal Movie Storage Notice</p>
                    <p className="text-blue-700 mb-3">
                      Your personal movies are stored locally in this browser using IndexedDB.
                      This data is browser-specific and may be lost if you clear browser data or use a different browser.
                      We recommend regularly exporting your saved movies to keep a backup.
                    </p>
                    <button
                      onClick={handleExportMovies}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      Export Movies
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredMovies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 xl:gap-10">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={`${movie.storage_type}-${movie.id}`}
              movie={movie}
              isFavorite={isFavorite(movie)}
              onToggleFavorite={handleToggleFavorite}
              onEdit={movie.storage_type === 'indexedDB' ? setEditingMovie : undefined}
              onDelete={movie.storage_type === 'indexedDB' ? handleDeleteMovie : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No movies found</p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {data && data.total > 20 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {Math.ceil(data.total / 20)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(data.total / 20)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {(showForm || editingMovie) && (
        <MovieForm
          movie={editingMovie}
          onSubmit={editingMovie ? handleUpdateMovie : handleAddMovie}
          onCancel={() => {
            setShowForm(false);
            setEditingMovie(undefined);
          }}
        />
      )}

      {showImport && (
        <MovieImportModal
          onImport={handleImportMovies}
          onCancel={() => setShowImport(false)}
        />
      )}
    </div>
  );
};