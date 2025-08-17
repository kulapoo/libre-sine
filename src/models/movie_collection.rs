use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct MovieCollection {
    pub id: i32,
    pub name: String,
    pub url: String,
    pub is_default: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct MovieCollectionList {
    pub collections: Vec<MovieCollection>,
    pub total: i64,
    pub page: i32,
    pub limit: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateMovieCollection {
    pub name: String,
    pub url: String,
    pub is_default: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMovieCollection {
    pub name: Option<String>,
    pub url: Option<String>,
    pub is_default: Option<bool>,
}