import React, { useState } from 'react';
import { XMarkIcon, DocumentArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { CreateMovie } from '../types/movie';
import { validateMovieUrl, validateImageUrl } from '../utils/validation';
import { db } from '../services/indexedDB';

interface MovieImportModalProps {
  onImport: (movies: CreateMovie[]) => void;
  onCancel: () => void;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  duplicates: Array<{ movie: CreateMovie; index: number }>;
}

interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <div className="flex items-center gap-3 mb-4">
        <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
        <h3 className="text-lg font-semibold">Confirmation Required</h3>
      </div>
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {confirmText}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          {cancelText}
        </button>
      </div>
    </div>
  </div>
);

export const MovieImportModal: React.FC<MovieImportModalProps> = ({ onImport, onCancel }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showLargeImportWarning, setShowLargeImportWarning] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingMovies, setPendingMovies] = useState<CreateMovie[]>([]);

  const validateMovie = (movie: Partial<CreateMovie>, index: number): string[] => {
    const errors: string[] = [];
    
    if (!movie.name || typeof movie.name !== 'string' || !movie.name.trim()) {
      errors.push(`Movie ${index + 1}: Name is required`);
    }
    
    if (!movie.movie_url || typeof movie.movie_url !== 'string') {
      errors.push(`Movie ${index + 1}: Movie URL is required`);
    } else {
      const urlError = validateMovieUrl(movie.movie_url);
      if (urlError) {
        errors.push(`Movie ${index + 1}: ${urlError}`);
      }
    }
    
    if (movie.image_url && typeof movie.image_url === 'string') {
      const imageError = validateImageUrl(movie.image_url);
      if (imageError) {
        errors.push(`Movie ${index + 1}: ${imageError}`);
      }
    }
    
    if (movie.rating !== undefined && (typeof movie.rating !== 'number' || movie.rating < 1 || movie.rating > 10)) {
      errors.push(`Movie ${index + 1}: Rating must be a number between 1 and 10`);
    }
    
    if (movie.genres && !Array.isArray(movie.genres)) {
      errors.push(`Movie ${index + 1}: Genres must be an array`);
    }
    
    if (movie.actors && !Array.isArray(movie.actors)) {
      errors.push(`Movie ${index + 1}: Actors must be an array`);
    }
    
    return errors;
  };

  const validateJsonStructure = async (data: unknown): Promise<ValidationResult> => {
    const errors: string[] = [];
    let movies: unknown[] = [];
    
    if (Array.isArray(data)) {
      movies = data;
    } else if (typeof data === 'object' && data !== null && 'movies' in data && Array.isArray((data as { movies: unknown[] }).movies)) {
      movies = (data as { movies: unknown[] }).movies;
    } else {
      return {
        isValid: false,
        errors: ['Invalid JSON structure. Expected an array of movies or an object with a "movies" array.'],
        duplicates: []
      };
    }
    
    if (movies.length === 0) {
      return {
        isValid: false,
        errors: ['No movies found in the file.'],
        duplicates: []
      };
    }
    
    for (let i = 0; i < movies.length; i++) {
      const movieErrors = validateMovie(movies[i] as Partial<CreateMovie>, i);
      errors.push(...movieErrors);
    }
    
    const duplicates: Array<{ movie: CreateMovie; index: number }> = [];
    
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i] as Partial<CreateMovie>;
      if (movie.name && movie.movie_url) {
        const exists = await db.checkMovieExists(movie.name, movie.movie_url);
        if (exists) {
          duplicates.push({ movie: movie as CreateMovie, index: i });
          break;
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      duplicates
    };
  };

  const parseJsonFile = async (file: File): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch {
          reject(new Error('Invalid JSON file format.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  };

  const normalizeMovies = (data: { movies?: unknown[] } | unknown[]): CreateMovie[] => {
    const movies = Array.isArray(data) ? data : (data as { movies?: unknown[] }).movies || [];
    return movies.map((movie: unknown) => {
      const m = movie as Partial<CreateMovie> & Record<string, unknown>;
      return {
        name: m.name || '',
        movie_url: m.movie_url || '',
        image_url: m.image_url || '',
        description: m.description || '',
        rating: m.rating || 5,
        genres: m.genres || [],
        director: m.director || '',
        actors: m.actors || []
      };
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.includes('json')) {
      setValidationResult({
        isValid: false,
        errors: ['Please select a valid JSON file.'],
        duplicates: []
      });
      return;
    }
    
    setSelectedFile(file);
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      const data = await parseJsonFile(file);
      const result = await validateJsonStructure(data);
      setValidationResult(result);
      
      if (result.isValid) {
        const movies = normalizeMovies(data as { movies?: unknown[] } | unknown[]);
        setPendingMovies(movies);
        
        if (movies.length > 20) {
          setShowLargeImportWarning(true);
          return;
        }
        
        if (result.duplicates.length > 0) {
          setShowDuplicateWarning(true);
          return;
        }
        
        onImport(movies);
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Failed to process file.'],
        duplicates: []
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const proceedWithLargeImport = () => {
    setShowLargeImportWarning(false);
    if (validationResult?.duplicates.length) {
      setShowDuplicateWarning(true);
    } else {
      onImport(pendingMovies);
    }
  };

  const proceedWithDuplicates = () => {
    setShowDuplicateWarning(false);
    onImport(pendingMovies);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Import Movies from JSON</h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop your JSON file here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Upload a JSON file containing movie data to import multiple movies at once.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="json-file-input"
                />
                <label
                  htmlFor="json-file-input"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Select JSON File
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setValidationResult(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {isValidating && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">Validating movies...</span>
                  </div>
                )}

                {validationResult && !isValidating && (
                  <div className="space-y-4">
                    {validationResult.isValid ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-medium">
                          ✓ Validation successful! Ready to import {pendingMovies.length} movies.
                        </p>
                        {validationResult.duplicates.length > 0 && (
                          <p className="text-amber-600 text-sm mt-2">
                            Note: {validationResult.duplicates.length} duplicate(s) detected and will be handled.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 font-medium mb-2">Validation failed:</p>
                        <ul className="text-red-700 text-sm space-y-1">
                          {validationResult.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Expected JSON Format:</h3>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`[
  {
    "name": "Movie Title",
    "movie_url": "https://example.com/movie",
    "image_url": "https://example.com/image.jpg",
    "description": "Movie description",
    "rating": 8.5,
    "genres": ["Action", "Adventure"],
    "director": "Director Name",
    "actors": ["Actor 1", "Actor 2"]
  }
]`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {showLargeImportWarning && (
        <ConfirmationModal
          message={`You're about to import ${pendingMovies.length} movies. This might take some time to process. Do you want to continue?`}
          onConfirm={proceedWithLargeImport}
          onCancel={() => setShowLargeImportWarning(false)}
          confirmText="Continue Import"
        />
      )}

      {showDuplicateWarning && validationResult?.duplicates.length && (
        <ConfirmationModal
          message={`Found duplicate movie "${validationResult.duplicates[0].movie.name}" (same name and URL already exists). Do you want to skip duplicates and continue importing?`}
          onConfirm={proceedWithDuplicates}
          onCancel={() => setShowDuplicateWarning(false)}
          confirmText="Skip Duplicates"
        />
      )}
    </>
  );
};