import Dexie, { type Table } from 'dexie';

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

export interface Favorite {
  id?: number;
  movieId: string;
  addedAt: string;
}

class MoviesDatabase extends Dexie {
  movies!: Table<Movie>;
  favorites!: Table<Favorite>;

  constructor() {
    super('MoviesDB');
    this.version(1).stores({
      movies: '++id, name, rating, *genres, director, created_at'
    });
    this.version(2).stores({
      movies: '++id, name, rating, *genres, director, created_at',
      favorites: '++id, &movieId, addedAt'
    });
  }

  async addMovie(movie: Omit<Movie, 'id' | 'storage_type' | 'created_at' | 'updated_at'>) {
    return await this.movies.add({
      ...movie,
      storage_type: 'indexedDB',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  async updateMovie(id: number, updates: Partial<Omit<Movie, 'id' | 'storage_type' | 'created_at'>>) {
    return await this.movies.update(id, {
      ...updates,
      updated_at: new Date().toISOString()
    });
  }

  async deleteMovie(id: number) {
    return await this.movies.delete(id);
  }

  async getAllMovies(): Promise<Movie[]> {
    return await this.movies.toArray();
  }

  async searchMovies(query: string): Promise<Movie[]> {
    const lowerQuery = query.toLowerCase();
    return await this.movies
      .filter(movie =>
        movie.name.toLowerCase().includes(lowerQuery) ||
        movie.description.toLowerCase().includes(lowerQuery) ||
        movie.director.toLowerCase().includes(lowerQuery) ||
        movie.actors.some(actor => actor.toLowerCase().includes(lowerQuery))
      )
      .toArray();
  }

  async getMovieById(id: number): Promise<Movie | undefined> {
    return await this.movies.get(id);
  }

  async clearAllMovies() {
    return await this.movies.clear();
  }

  async importMovies(movies: Omit<Movie, 'id' | 'storage_type' | 'created_at' | 'updated_at'>[]) {
    const moviesToImport: Movie[] = [];
    
    for (const movie of movies) {
      const exists = await this.checkMovieExists(movie.name, movie.movie_url);
      if (!exists) {
        moviesToImport.push({
          ...movie,
          storage_type: 'indexedDB' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    if (moviesToImport.length === 0) {
      throw new Error('No new movies to import - all movies already exist');
    }

    return await this.movies.bulkAdd(moviesToImport);
  }

  async checkMovieExists(name: string, movieUrl: string, excludeId?: number): Promise<boolean> {
    const movies = await this.movies.toArray();
    return movies.some(movie => 
      (movie.id !== excludeId) && 
      (movie.name.toLowerCase() === name.toLowerCase() && movie.movie_url === movieUrl)
    );
  }

  async exportMovies(): Promise<void> {
    const movies = await this.getAllMovies();
    const exportData = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      movies: movies.map(movie => ({
        name: movie.name,
        movie_url: movie.movie_url,
        image_url: movie.image_url,
        description: movie.description,
        rating: movie.rating,
        genres: movie.genres,
        director: movie.director,
        actors: movie.actors,
        created_at: movie.created_at,
        updated_at: movie.updated_at
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `libre-sine-movies-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async getAllFavorites(): Promise<string[]> {
    const favorites = await this.favorites.toArray();
    return favorites.map(f => f.movieId);
  }

  async addFavorite(movieId: string): Promise<number> {
    const existing = await this.favorites.where('movieId').equals(movieId).first();
    if (existing) {
      return existing.id!;
    }
    return await this.favorites.add({
      movieId,
      addedAt: new Date().toISOString()
    });
  }

  async removeFavorite(movieId: string): Promise<void> {
    await this.favorites.where('movieId').equals(movieId).delete();
  }

  async isFavorite(movieId: string): Promise<boolean> {
    const count = await this.favorites.where('movieId').equals(movieId).count();
    return count > 0;
  }

  async toggleFavorite(movieId: string): Promise<boolean> {
    const isFav = await this.isFavorite(movieId);
    if (isFav) {
      await this.removeFavorite(movieId);
      return false;
    } else {
      await this.addFavorite(movieId);
      return true;
    }
  }

  async migrateFavoritesFromLocalStorage(): Promise<void> {
    const stored = localStorage.getItem('favorites');
    if (stored) {
      try {
        const favorites = JSON.parse(stored) as string[];
        for (const movieId of favorites) {
          await this.addFavorite(movieId);
        }
        localStorage.removeItem('favorites');
      } catch (error) {
        console.error('Failed to migrate favorites from localStorage:', error);
      }
    }
  }
}

export const db = new MoviesDatabase();