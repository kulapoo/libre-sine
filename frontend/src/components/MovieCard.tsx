import React, { useState } from 'react';
import { PencilIcon, TrashIcon, StarIcon, PlayIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import type { Movie } from '../types/movie';

interface MovieCardProps {
  movie: Movie;
  isFavorite: boolean;
  onToggleFavorite: (movie: Movie) => void;
  onEdit?: (movie: Movie) => void;
  onDelete?: (movie: Movie) => void;
}

const MoviePosterPlaceholder = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 p-6">
    <svg className="w-20 h-20 text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M3 12h18" />
    </svg>
    <p className="text-slate-400 text-sm font-medium">No Poster</p>
  </div>
);

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isFavorite,
  onToggleFavorite,
  onEdit,
  onDelete
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const canEdit = movie.storage_type === 'indexedDB';

  return (
    <div className="relative group flex flex-col bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
      {movie.storage_type === 'indexedDB' && (
        <div className="absolute top-3 left-3 z-20 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full shadow-lg">
          Personal
        </div>
      )}

      <div className="relative aspect-[5/5] bg-slate-800 overflow-hidden">
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
            <div className="w-10 h-10 border-3 border-slate-600 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {imageError && <MoviePosterPlaceholder />}

        {movie.image_url && (
          <img
            src={movie.image_url}
            alt={movie.name}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            className={`w-full h-full object-cover transition-all duration-700 ${imageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'} ${!imageError ? 'group-hover:scale-105' : ''}`}
            style={{ display: imageError ? 'none' : 'block' }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="absolute inset-x-0 bottom-0 p-5">
            <a
              href={movie.movie_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-all duration-200 transform translate-y-24 group-hover:translate-y-0 shadow-xl"
            >
              <PlayIcon className="h-5 w-5" />
              <span>Watch Now</span>
            </a>
          </div>
        </div>

        <button
          onClick={() => onToggleFavorite(movie)}
          className="absolute top-3 right-3 p-2.5 bg-black/30 backdrop-blur-md rounded-full hover:bg-black/50 transition-all duration-200 group/fav"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <StarSolidIcon className="h-5 w-5 text-yellow-400 drop-shadow-lg group-hover/fav:scale-125 transition-transform" />
          ) : (
            <StarIcon className="h-5 w-5 text-white/90 drop-shadow-lg group-hover/fav:text-yellow-400 group-hover/fav:scale-110 transition-all" />
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col p-5 space-y-3">
        <div className="flex-1 space-y-2">
          <h3 className="font-bold text-base lg:text-lg text-slate-900 line-clamp-2 leading-tight">
            {movie.name}
          </h3>

          {movie.director && (
            <p className="text-sm text-slate-500 truncate">
              Directed by {movie.director}
            </p>
          )}

          {movie.rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <StarSolidIcon
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(movie.rating / 2)
                        ? 'text-yellow-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {movie.rating.toFixed(1)}
              </span>
            </div>
          )}

          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {movie.genres.slice(0, 3).map((genre, index) => (
                <span
                  key={index}
                  className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md"
                >
                  {genre}
                </span>
              ))}
              {movie.genres.length > 3 && (
                <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-md">
                  +{movie.genres.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <a
          href={movie.movie_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md sm:hidden"
        >
          <PlayIcon className="h-4 w-4" />
          <span className="text-sm">Watch</span>
        </a>

        {canEdit && (onEdit || onDelete) && (
          <div className="flex items-center gap-2 pt-3 mt-auto border-t border-slate-100">
            {onEdit && (
              <button
                onClick={() => onEdit(movie)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                title="Edit movie"
              >
                <PencilIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(movie)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                title="Delete movie"
              >
                <TrashIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};