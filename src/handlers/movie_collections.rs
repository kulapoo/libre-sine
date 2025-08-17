use actix_web::{web, HttpResponse, Result};
use sqlx::PgPool;

use crate::models::{MovieCollectionList, CreateMovieCollection, UpdateMovieCollection, QueryParams};
use crate::services::database;

pub async fn list_movie_collections(
    pool: web::Data<PgPool>,
    query: web::Query<QueryParams>,
) -> Result<HttpResponse> {
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(20).min(100).max(1);
    let search = query.search.as_deref().unwrap_or("");
    let offset = (page - 1) * limit;

    match database::get_movie_collections(&pool, search, limit, offset).await {
        Ok(collections) => {
            let total = database::count_movie_collections(&pool, search).await.unwrap_or(0);
            
            let result = MovieCollectionList {
                collections,
                total,
                page,
                limit,
            };
            Ok(HttpResponse::Ok().json(result))
        }
        Err(e) => {
            tracing::error!("Failed to fetch movie collections: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch movie collections"
            })))
        }
    }
}

pub async fn get_movie_collection(
    pool: web::Data<PgPool>,
    collection_id: web::Path<i32>,
) -> Result<HttpResponse> {
    match database::get_movie_collection_by_id(&pool, collection_id.into_inner()).await {
        Ok(Some(collection)) => {
            Ok(HttpResponse::Ok().json(collection))
        }
        Ok(None) => {
            Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Movie collection not found"
            })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch movie collection: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch movie collection"
            })))
        }
    }
}

pub async fn create_movie_collection(
    pool: web::Data<PgPool>,
    collection_data: web::Json<CreateMovieCollection>,
) -> Result<HttpResponse> {
    match database::create_movie_collection(&pool, &collection_data).await {
        Ok(collection) => {
            Ok(HttpResponse::Created().json(collection))
        }
        Err(e) => {
            tracing::error!("Failed to create movie collection: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to create movie collection"
            })))
        }
    }
}

pub async fn update_movie_collection(
    pool: web::Data<PgPool>,
    collection_id: web::Path<i32>,
    collection_data: web::Json<UpdateMovieCollection>,
) -> Result<HttpResponse> {
    let id = collection_id.into_inner();
    
    match database::update_movie_collection(&pool, id, &collection_data).await {
        Ok(Some(collection)) => {
            Ok(HttpResponse::Ok().json(collection))
        }
        Ok(None) => {
            Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Movie collection not found"
            })))
        }
        Err(e) => {
            tracing::error!("Failed to update movie collection: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to update movie collection"
            })))
        }
    }
}

pub async fn delete_movie_collection(
    pool: web::Data<PgPool>,
    collection_id: web::Path<i32>,
) -> Result<HttpResponse> {
    let id = collection_id.into_inner();
    
    match database::delete_movie_collection(&pool, id).await {
        Ok(true) => {
            Ok(HttpResponse::NoContent().finish())
        }
        Ok(false) => {
            Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Movie collection not found or cannot delete default collection"
            })))
        }
        Err(e) => {
            tracing::error!("Failed to delete movie collection: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to delete movie collection"
            })))
        }
    }
}