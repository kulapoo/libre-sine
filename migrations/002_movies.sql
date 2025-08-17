CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    movie_url TEXT NOT NULL,
    image_url TEXT,
    description TEXT DEFAULT '',
    rating REAL DEFAULT 0.0,
    genres TEXT DEFAULT '',
    director TEXT DEFAULT '',
    actors TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movies_name ON movies(name);
CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at DESC);