import type { 
  Movie, 
  MovieList, 
  MovieCollection, 
  MovieCollectionList,
  CreateMovieCollection,
  UpdateMovieCollection,
  QueryParams 
} from '../types';

const API_BASE = '/api/v1';

class ApiError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }
  return response.json();
}

export const api = {
  movies: {
    list: async (params?: QueryParams): Promise<MovieList> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      
      const response = await fetch(`${API_BASE}/movies?${searchParams}`);
      return handleResponse<MovieList>(response);
    },
    
    get: async (id: number): Promise<Movie> => {
      const response = await fetch(`${API_BASE}/movies/${id}`);
      return handleResponse<Movie>(response);
    }
  },

  movieCollections: {
    list: async (params?: QueryParams): Promise<MovieCollectionList> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      
      const response = await fetch(`${API_BASE}/movie-collections?${searchParams}`);
      return handleResponse<MovieCollectionList>(response);
    },

    get: async (id: number): Promise<MovieCollection> => {
      const response = await fetch(`${API_BASE}/movie-collections/${id}`);
      return handleResponse<MovieCollection>(response);
    },

    create: async (collection: CreateMovieCollection): Promise<MovieCollection> => {
      const response = await fetch(`${API_BASE}/movie-collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collection),
      });
      return handleResponse<MovieCollection>(response);
    },

    update: async (id: number, collection: UpdateMovieCollection): Promise<MovieCollection> => {
      const response = await fetch(`${API_BASE}/movie-collections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collection),
      });
      return handleResponse<MovieCollection>(response);
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${API_BASE}/movie-collections/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new ApiError(response.status, error.error || 'Request failed');
      }
    },

    fetchMovies: async (url: string): Promise<Movie[]> => {
      const response = await fetch(url);
      return handleResponse<Movie[]>(response);
    }
  }
};