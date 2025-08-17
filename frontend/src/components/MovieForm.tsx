import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Movie, CreateMovie } from '../types/movie';
import { validateMovieUrl, validateImageUrl } from '../utils/validation';
import { db } from '../services/indexedDB';

interface MovieFormProps {
  movie?: Movie;
  onSubmit: (data: CreateMovie) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  movie_url?: string;
  image_url?: string;
}

export const MovieForm: React.FC<MovieFormProps> = ({ movie, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateMovie>({
    name: '',
    movie_url: '',
    image_url: '',
    description: '',
    rating: 5,
    genres: [],
    director: '',
    actors: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (movie) {
      setFormData({
        name: movie.name,
        movie_url: movie.movie_url,
        image_url: movie.image_url,
        description: movie.description,
        rating: movie.rating,
        genres: movie.genres,
        director: movie.director,
        actors: movie.actors
      });
    }
  }, [movie]);

  const validateForm = async (): Promise<boolean> => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Movie name is required';
    }
    
    const movieUrlError = validateMovieUrl(formData.movie_url);
    if (movieUrlError) {
      newErrors.movie_url = movieUrlError;
    }
    
    const imageUrlError = validateImageUrl(formData.image_url);
    if (imageUrlError) {
      newErrors.image_url = imageUrlError;
    }
    
    if (!newErrors.name && !newErrors.movie_url) {
      const exists = await db.checkMovieExists(formData.name, formData.movie_url, movie?.id);
      if (exists) {
        newErrors.name = 'A movie with this name or URL already exists';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const isValid = await validateForm();
    if (isValid) {
      onSubmit(formData);
    }
    
    setIsSubmitting(false);
  };

  const handleGenresChange = (value: string) => {
    const genres = value.split(',').map(g => g.trim()).filter(g => g);
    setFormData({ ...formData, genres });
  };

  const handleActorsChange = (value: string) => {
    const actors = value.split(',').map(a => a.trim()).filter(a => a);
    setFormData({ ...formData, actors });
  };

  const handleFieldChange = (field: keyof CreateMovie, value: CreateMovie[keyof CreateMovie]) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field as keyof FormErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {movie ? 'Edit Movie' : 'Add Personal Movie'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Movie Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Movie URL *
            </label>
            <input
              type="text"
              value={formData.movie_url}
              onChange={(e) => handleFieldChange('movie_url', e.target.value)}
              className={`w-full px-3 py-2 border ${errors.movie_url ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
            {errors.movie_url && (
              <p className="text-red-500 text-sm mt-1">{errors.movie_url}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => handleFieldChange('image_url', e.target.value)}
              className={`w-full px-3 py-2 border ${errors.image_url ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.image_url && (
              <p className="text-red-500 text-sm mt-1">{errors.image_url}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <select
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Genres (comma separated)
            </label>
            <input
              type="text"
              value={formData.genres.join(', ')}
              onChange={(e) => handleGenresChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Action, Adventure, Sci-Fi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Director
            </label>
            <input
              type="text"
              value={formData.director}
              onChange={(e) => setFormData({ ...formData, director: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actors (comma separated)
            </label>
            <input
              type="text"
              value={formData.actors.join(', ')}
              onChange={(e) => handleActorsChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Actor 1, Actor 2, Actor 3"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {isSubmitting ? 'Processing...' : (movie ? 'Update Movie' : 'Add Movie')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};