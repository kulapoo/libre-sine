use actix_web::{web, HttpResponse, Result};
use sqlx::PgPool;
use serde_json::json;
use std::sync::Arc;

use crate::models::{MovieList, MovieWithStorage, QueryParams};
use crate::services::database;

pub async fn list_movies(
    pool: web::Data<Arc<PgPool>>,
    query: web::Query<QueryParams>,
) -> Result<HttpResponse> {
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(20).min(100).max(1);
    let search = query.search.as_deref().unwrap_or("");
    let offset = (page - 1) * limit;

    match database::get_movies(pool.as_ref().as_ref(), search, limit, offset).await {
        Ok(movies) => {
            let total = database::count_movies(pool.as_ref().as_ref(), search).await.unwrap_or(0);
            let movies_with_storage: Vec<MovieWithStorage> = movies
                .into_iter()
                .map(|m| m.with_storage_type())
                .collect();
            
            let result = MovieList {
                movies: movies_with_storage,
                total,
                page,
                limit,
            };
            Ok(HttpResponse::Ok().json(result))
        }
        Err(e) => {
            tracing::error!("Failed to fetch movies: {}", e);
            Ok(HttpResponse::InternalServerError().json(json!({
                "error": "Failed to fetch movies"
            })))
        }
    }
}

pub async fn get_movie(
    pool: web::Data<Arc<PgPool>>,
    movie_id: web::Path<i32>,
) -> Result<HttpResponse> {
    match database::get_movie_by_id(pool.as_ref().as_ref(), movie_id.into_inner()).await {
        Ok(Some(movie)) => {
            Ok(HttpResponse::Ok().json(movie.with_storage_type()))
        }
        Ok(None) => {
            Ok(HttpResponse::NotFound().json(json!({
                "error": "Movie not found"
            })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch movie: {}", e);
            Ok(HttpResponse::InternalServerError().json(json!({
                "error": "Failed to fetch movie"
            })))
        }
    }
}