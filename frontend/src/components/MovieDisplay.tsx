import React, { useState } from 'react';
import { PlayIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import type { Movie } from '../types';

interface MovieDisplayProps {
  movie: Movie;
}

export const MovieDisplay: React.FC<MovieDisplayProps> = ({ movie }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <div className="relative h-full flex flex-col bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div className="relative aspect-[2/3] bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-lg overflow-hidden">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <img
          src={imageError ? 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"%3E%3Crect fill="%23e5e7eb" width="300" height="450"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="system-ui" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E' : movie.image_url}
          alt={movie.name}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
          className={`w-full h-full object-cover transition-all duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'} group-hover:scale-110`}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <a
              href={movie.movie_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 font-semibold rounded-lg hover:bg-white transition-all duration-200 transform translate-y-20 group-hover:translate-y-0"
            >
              <PlayIcon className="h-5 w-5" />
              <span>Watch Now</span>
            </a>
          </div>
        </div>
        
        {movie.rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md">
            <StarSolidIcon className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">{movie.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col p-3 sm:p-4 space-y-2">
        <div className="flex-1 space-y-1.5">
          <h3 className="font-bold text-sm sm:text-base lg:text-lg text-gray-900 line-clamp-2 min-h-[2.5rem]">
            {movie.name}
          </h3>
          
          {movie.director && (
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              Directed by {movie.director}
            </p>
          )}
          
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {movie.genres.slice(0, 2).map((genre, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] sm:text-xs font-medium rounded-full"
                >
                  {genre}
                </span>
              ))}
              {movie.genres.length > 2 && (
                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] sm:text-xs font-medium rounded-full">
                  +{movie.genres.length - 2}
                </span>
              )}
            </div>
          )}
          
          {movie.description && (
            <p className="hidden lg:block text-xs text-gray-600 line-clamp-3 mt-2">
              {movie.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};