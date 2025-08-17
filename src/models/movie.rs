use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Movie {
    pub id: i32,
    pub name: String,
    pub movie_url: String,
    pub image_url: String,
    pub description: String,
    pub rating: f32,
    pub genres: String,
    pub director: String,
    pub actors: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MovieWithStorage {
    pub id: i32,
    pub name: String,
    pub movie_url: String,
    pub image_url: String,
    pub description: String,
    pub rating: f32,
    pub genres: Vec<String>,
    pub director: String,
    pub actors: Vec<String>,
    pub storage_type: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Movie {
    pub fn with_storage_type(self) -> MovieWithStorage {
        MovieWithStorage {
            id: self.id,
            name: self.name,
            movie_url: self.movie_url,
            image_url: self.image_url,
            description: self.description,
            rating: self.rating,
            genres: self.genres.split(',').map(|s| s.trim().to_string()).collect(),
            director: self.director,
            actors: self.actors.split(',').map(|s| s.trim().to_string()).collect(),
            storage_type: "serverDB".to_string(),
            created_at: self.created_at,
            updated_at: self.updated_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct MovieList {
    pub movies: Vec<MovieWithStorage>,
    pub total: i64,
    pub page: i32,
    pub limit: i32,
}

#[derive(Debug, Deserialize)]
pub struct QueryParams {
    pub page: Option<i32>,
    pub limit: Option<i32>,
    pub search: Option<String>,
}