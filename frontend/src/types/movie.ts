export interface Movie {
  id?: number;
  name: string;
  movie_url: string;
  image_url: string;
  description: string;
  rating: number;
  genres: string[];
  director: string;
  actors: string[];
  storage_type: 'indexedDB' | 'serverDB';
  created_at: string;
  updated_at: string;
}

export interface MovieList {
  movies: Movie[];
  total: number;
  serverCount?: number;
  localCount?: number;
  page: number;
  limit: number;
}

export interface CreateMovie {
  name: string;
  movie_url: string;
  image_url: string;
  description: string;
  rating: number;
  genres: string[];
  director: string;
  actors: string[];
}

export interface UpdateMovie {
  name?: string;
  movie_url?: string;
  image_url?: string;
  description?: string;
  rating?: number;
  genres?: string[];
  director?: string;
  actors?: string[];
}

export interface MovieCollection {
  id: number;
  name: string;
  url: string;
  is_default: boolean;
  created_at: string;
}

export interface MovieCollectionList {
  collections: MovieCollection[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateMovieCollection {
  name: string;
  url: string;
  is_default?: boolean;
}

export interface UpdateMovieCollection {
  name?: string;
  url?: string;
  is_default?: boolean;
}