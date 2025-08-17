# Movie Streaming Platform - Implementation Guide

## Tech Stack
- **Backend**: Rust + Actix-web + SQLite
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + IndexedDB
- **Hosting**: Shuttle.rs (All-in-one hosting for both backend + frontend)

## Core Features
1. **Movies CRUD**: Full CRUD operations for managing movies
2. **Dual Storage System**: 
   - ServerDB (SQLite): Read-only movie storage
   - IndexedDB: Client-side storage for user's personal movie collection
3. **Movie Management**: 
   - READ: Aggregated from both ServerDB and IndexedDB
   - WRITE (add/edit/delete): Only available in IndexedDB
4. **Favorites**: Browser localStorage storage
5. **Movie Search**: Search across both storage sources

## Project Structure

```
movie-streaming-platform/
├── backend/
│   ├── src/
│   │   ├── main.rs
│   │   ├── models/movie.rs
│   │   ├── handlers/movies.rs
│   │   ├── services/{database.rs, validator.rs}
│   │   └── middleware/{cors.rs, rate_limit.rs}
│   └── Cargo.toml
└── frontend/
    ├── src/
    │   ├── components/{MovieCard, MovieGrid, MovieForm, SearchBar}
    │   ├── pages/{HomePage, MoviesPage, FavoritesPage}
    │   ├── services/{api.ts, indexedDB.ts, localStorage.ts}
    │   ├── store/movieStore.ts
    │   └── App.tsx
    └── package.json
```

## Database Schema

### ServerDB (SQLite)
```sql
CREATE TABLE movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    movie_url TEXT NOT NULL,
    image_url TEXT,
    description TEXT,
    rating REAL,
    genres TEXT,
    director TEXT,
    actors TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_movies_name ON movies(name);
CREATE INDEX idx_movies_rating ON movies(rating);
```

### IndexedDB Schema
```typescript
interface Movie {
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
```

## API Endpoints

```
# Movies (ServerDB - Read Only)
GET    /api/v1/movies?page=1&limit=20&search=query
GET    /api/v1/movies/{id}

# Aggregated Movies (ServerDB + IndexedDB)
GET    /api/v1/movies/all?page=1&limit=20&search=query
```

## Backend Implementation (Rust)

### Cargo.toml
```toml
[dependencies]
actix-web = "4"
actix-cors = "0.7"
sqlx = { version = "0.7", features = ["runtime-tokio-native-tls", "sqlite"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
chrono = { version = "0.4", features = ["serde"] }
validator = "0.16"
```

### Models
```rust
#[derive(Serialize, Deserialize, sqlx::FromRow)]
struct Movie {
    id: i32,
    name: String,
    movie_url: String,
    image_url: String,
    description: String,
    rating: f32,
    genres: String,
    director: String,
    actors: String,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl Movie {
    fn with_storage_type(mut self) -> MovieWithStorage {
        MovieWithStorage {
            id: self.id,
            name: self.name,
            movie_url: self.movie_url,
            image_url: self.image_url,
            description: self.description,
            rating: self.rating,
            genres: self.genres.split(',').map(String::from).collect(),
            director: self.director,
            actors: self.actors.split(',').map(String::from).collect(),
            storage_type: "serverDB".to_string(),
            created_at: self.created_at,
            updated_at: self.updated_at,
        }
    }
}

#[derive(Serialize, Deserialize)]
struct MovieWithStorage {
    id: i32,
    name: String,
    movie_url: String,
    image_url: String,
    description: String,
    rating: f32,
    genres: Vec<String>,
    director: String,
    actors: Vec<String>,
    storage_type: String,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}
```

### Main Server Setup
```rust
use actix_web::{web, App, HttpServer};
use sqlx::SqlitePool;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let pool = SqlitePool::connect("sqlite://movies.db").await?;

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .configure(configure_routes)
            .wrap(configure_cors())
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
```

## Frontend Implementation (React with Hooks)

### package.json
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "dexie": "^4.0.0",
    "dexie-react-hooks": "^1.1.0",
    "@headlessui/react": "^1.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0"
  }
}
```

### IndexedDB Service (using Dexie)
```typescript
import Dexie, { Table } from 'dexie';

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

class MoviesDatabase extends Dexie {
  movies!: Table<Movie>;

  constructor() {
    super('MoviesDB');
    this.version(1).stores({
      movies: '++id, name, rating, *genres, director, created_at'
    });
  }

  async addMovie(movie: Omit<Movie, 'id' | 'storage_type'>) {
    return await this.movies.add({
      ...movie,
      storage_type: 'indexedDB',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  async updateMovie(id: number, updates: Partial<Movie>) {
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
    return await this.movies
      .filter(movie => 
        movie.name.toLowerCase().includes(query.toLowerCase()) ||
        movie.description.toLowerCase().includes(query.toLowerCase())
      )
      .toArray();
  }
}

export const db = new MoviesDatabase();
```

### Custom Hooks

```typescript
// hooks/useMovies.ts
import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import axios from 'axios';
import { db, Movie } from '../services/indexedDB';

export const useMovies = (page: number = 1, search: string = '') => {
  const [serverMovies, setServerMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const indexedDBMovies = useLiveQuery(
    async () => {
      if (search) {
        return await db.searchMovies(search);
      }
      return await db.getAllMovies();
    },
    [search]
  );

  const fetchServerMovies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/v1/movies`, {
        params: { page, search, limit: 20 }
      });
      setServerMovies(response.data.movies.map((m: any) => ({
        ...m,
        storage_type: 'serverDB'
      })));
      setError(null);
    } catch (err) {
      setError('Failed to fetch server movies');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchServerMovies();
  }, [fetchServerMovies]);

  const aggregatedMovies = [
    ...(indexedDBMovies || []),
    ...serverMovies
  ].sort((a, b) => a.name.localeCompare(b.name));

  return { 
    movies: aggregatedMovies, 
    loading, 
    error, 
    refetch: fetchServerMovies 
  };
};

// hooks/useMovieActions.ts
import { useCallback } from 'react';
import { db } from '../services/indexedDB';

export const useMovieActions = () => {
  const addMovie = useCallback(async (movie: Omit<Movie, 'id' | 'storage_type'>) => {
    try {
      const id = await db.addMovie(movie);
      return { success: true, id };
    } catch (error) {
      return { success: false, error };
    }
  }, []);

  const updateMovie = useCallback(async (id: number, updates: Partial<Movie>) => {
    try {
      await db.updateMovie(id, updates);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, []);

  const deleteMovie = useCallback(async (id: number) => {
    try {
      await db.deleteMovie(id);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, []);

  return { addMovie, updateMovie, deleteMovie };
};

// hooks/useFavorites.ts
import { useState, useEffect } from 'react';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('favorites');
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  const toggleFavorite = (movieId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(movieId)
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId];

      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const isFavorite = (movieId: string) => favorites.includes(movieId);

  return { favorites, toggleFavorite, isFavorite };
};

// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

### Main Components

```tsx
// components/MovieCard.tsx
import React, { useState, memo } from 'react';

export const MovieCard = memo(({ movie, isFavorite, onToggleFavorite, onEdit, onDelete }) => {
  const [imageError, setImageError] = useState(false);
  const canEdit = movie.storage_type === 'indexedDB';

  return (
    <div className="bg-white rounded-lg shadow p-4 relative">
      {movie.storage_type === 'indexedDB' && (
        <span className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 text-xs rounded">
          Personal
        </span>
      )}
      <img
        src={imageError ? '/placeholder.jpg' : movie.image_url}
        alt={movie.name}
        onError={() => setImageError(true)}
        className="w-full h-48 object-cover rounded"
      />
      <h3 className="font-bold mt-2">{movie.name}</h3>
      <p className="text-gray-600 text-sm mt-1">{movie.director}</p>
      <div className="flex items-center mt-2">
        <span className="text-yellow-500">★ {movie.rating}</span>
      </div>
      <div className="flex justify-between mt-4">
        <button onClick={() => onToggleFavorite(movie.id)}>
          {isFavorite ? '❤️' : '🤍'}
        </button>
        <div className="flex gap-2">
          {canEdit && (
            <>
              <button 
                onClick={() => onEdit(movie)}
                className="text-blue-500 hover:text-blue-700"
              >
                Edit
              </button>
              <button 
                onClick={() => onDelete(movie.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </>
          )}
          <a href={movie.movie_url} target="_blank" className="text-blue-500">
            Watch
          </a>
        </div>
      </div>
    </div>
  );
});

// components/MovieForm.tsx
import React, { useState } from 'react';

export const MovieForm = ({ movie, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: movie?.name || '',
    movie_url: movie?.movie_url || '',
    image_url: movie?.image_url || '',
    description: movie?.description || '',
    rating: movie?.rating || 0,
    genres: movie?.genres?.join(', ') || '',
    director: movie?.director || '',
    actors: movie?.actors?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      rating: parseFloat(formData.rating),
      genres: formData.genres.split(',').map(g => g.trim()),
      actors: formData.actors.split(',').map(a => a.trim())
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        placeholder="Movie Name"
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="url"
        value={formData.movie_url}
        onChange={(e) => setFormData({...formData, movie_url: e.target.value})}
        placeholder="Movie URL"
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="url"
        value={formData.image_url}
        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
        placeholder="Image URL"
        className="w-full p-2 border rounded"
      />
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        placeholder="Description"
        className="w-full p-2 border rounded"
        rows={3}
      />
      <input
        type="number"
        step="0.1"
        min="0"
        max="10"
        value={formData.rating}
        onChange={(e) => setFormData({...formData, rating: e.target.value})}
        placeholder="Rating"
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        value={formData.genres}
        onChange={(e) => setFormData({...formData, genres: e.target.value})}
        placeholder="Genres (comma separated)"
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        value={formData.director}
        onChange={(e) => setFormData({...formData, director: e.target.value})}
        placeholder="Director"
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        value={formData.actors}
        onChange={(e) => setFormData({...formData, actors: e.target.value})}
        placeholder="Actors (comma separated)"
        className="w-full p-2 border rounded"
      />
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {movie ? 'Update' : 'Add'} Movie
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
};

// components/SearchBar.tsx
import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';

export const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search movies..."
      className="w-full p-2 border rounded"
    />
  );
};

// components/MovieGrid.tsx
import React, { useState } from 'react';
import { MovieCard } from './MovieCard';
import { MovieForm } from './MovieForm';
import { useMovies } from '../hooks/useMovies';
import { useMovieActions } from '../hooks/useMovieActions';
import { useFavorites } from '../hooks/useFavorites';

export const MovieGrid = ({ search }) => {
  const { movies, loading, error } = useMovies(1, search);
  const { addMovie, updateMovie, deleteMovie } = useMovieActions();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [editingMovie, setEditingMovie] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setShowAddForm(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this movie?')) {
      await deleteMovie(id);
    }
  };

  const handleSubmit = async (movieData) => {
    if (editingMovie) {
      await updateMovie(editingMovie.id, movieData);
      setEditingMovie(null);
    } else {
      await addMovie(movieData);
      setShowAddForm(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button 
        onClick={() => setShowAddForm(true)}
        className="mb-4 bg-green-500 text-white px-4 py-2 rounded"
      >
        Add Personal Movie
      </button>

      {(showAddForm || editingMovie) && (
        <div className="mb-4 p-4 border rounded">
          <MovieForm 
            movie={editingMovie}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowAddForm(false);
              setEditingMovie(null);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {movies.map(movie => (
          <MovieCard
            key={`${movie.storage_type}-${movie.id}`}
            movie={movie}
            isFavorite={isFavorite(`${movie.storage_type}-${movie.id}`)}
            onToggleFavorite={() => toggleFavorite(`${movie.storage_type}-${movie.id}`)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};
```

### Page Components

```tsx
// pages/HomePage.tsx
import React, { useState, useCallback } from 'react';
import { SearchBar } from '../components/SearchBar';
import { MovieGrid } from '../components/MovieGrid';

export const HomePage = () => {
  const [search, setSearch] = useState('');

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">LibreSine</h1>
      <SearchBar onSearch={handleSearch} />
      <div className="mt-6">
        <MovieGrid search={search} />
      </div>
    </div>
  );
};

// pages/FavoritesPage.tsx
import React, { useMemo } from 'react';
import { useMovies } from '../hooks/useMovies';
import { useFavorites } from '../hooks/useFavorites';
import { MovieCard } from '../components/MovieCard';

export const FavoritesPage = () => {
  const { movies, loading } = useMovies();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const favoriteMovies = useMemo(() => {
    return movies.filter(movie => 
      favorites.includes(`${movie.storage_type}-${movie.id}`)
    );
  }, [movies, favorites]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Favorites</h1>
      {favoriteMovies.length === 0 ? (
        <p>No favorites yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favoriteMovies.map(movie => (
            <MovieCard
              key={`${movie.storage_type}-${movie.id}`}
              movie={movie}
              isFavorite={true}
              onToggleFavorite={() => toggleFavorite(`${movie.storage_type}-${movie.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

### App.tsx
```tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/HomePage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
```

## Shuttle.rs Full-Stack Deployment

### Project Structure for Shuttle
```
libresine/
├── Cargo.toml
├── Shuttle.toml
├── src/
│   └── main.rs
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
└── static/
```

### Shuttle Configuration (Shuttle.toml)
```toml
name = "libresine"
assets = ["static"]
```

### Backend Implementation with Static File Serving

```rust
use actix_files::Files;
use actix_web::{middleware, web, App, HttpServer};
use shuttle_actix_web::ShuttleActixWeb;
use shuttle_runtime::CustomError;
use sqlx::{Executor, PgPool, SqlitePool};

#[shuttle_runtime::main]
async fn main(
    #[shuttle_shared_db::Postgres] pool: PgPool,
) -> ShuttleActixWeb<impl FnOnce(&mut web::ServiceConfig) + Send + Clone + 'static> {
    pool.execute(include_str!("../migrations/schema.sql"))
        .await
        .map_err(CustomError::new)?;

    let pool = web::Data::new(pool);

    let config = move |cfg: &mut web::ServiceConfig| {
        cfg.app_data(pool.clone())
            .service(
                web::scope("/api/v1")
                    .route("/movies", web::get().to(list_movies))
                    .route("/movies/{id}", web::get().to(get_movie))
            )
            .service(Files::new("/", "./static")
                .index_file("index.html")
                .default_handler(actix_files::NamedFile::open("./static/index.html").unwrap())
            );
    };

    Ok(config.into())
}
```

### Frontend Vite Configuration for Shuttle

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../static',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
});
```

### Deployment Script (deploy.sh)
```bash
#!/bin/bash

cd frontend
npm install
npm run build
cd ..

cargo shuttle deploy --allow-dirty
```

## Quick Start Commands

```bash
cargo install cargo-shuttle
cargo shuttle login

cargo shuttle init --template actix-web libresine
cd libresine

npx create-vite@latest frontend -- --template react-ts
cd frontend
npm install axios react-router-dom tailwindcss @headlessui/react dexie dexie-react-hooks
cd ..

cargo shuttle run

cd frontend && npm run dev

cd frontend && npm run build && cd ..
cargo shuttle deploy
```

## Key Implementation Notes
- Movies have dual storage: ServerDB (read-only) and IndexedDB (full CRUD)
- IndexedDB uses Dexie for robust offline-first functionality
- All write operations (add/edit/delete) are client-side only via IndexedDB
- Aggregation combines both storage sources for unified movie display
- Each movie displays its storage type for clarity
- Favorites use localStorage with composite IDs (storage_type-id)
- Search works across both storage sources
- ServerDB movies cannot be edited or deleted by users
- IndexedDB movies persist across browser sessions
- Add proper error handling for IndexedDB operations
- Implement data sync strategies if needed in future