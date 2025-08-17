CREATE TABLE IF NOT EXISTS movie_collections (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movie_collections_name ON movie_collections(name);
CREATE INDEX IF NOT EXISTS idx_movie_collections_created_at ON movie_collections(created_at DESC);