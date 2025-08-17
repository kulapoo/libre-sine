use anyhow::Result;
use sqlx::PgPool;

use crate::models::{Movie, MovieCollection, CreateMovieCollection, UpdateMovieCollection};

pub async fn get_movies(
    pool: &PgPool,
    search: &str,
    limit: i32,
    offset: i32,
) -> Result<Vec<Movie>> {
    let movies = if !search.is_empty() {
        let search_pattern = format!("%{}%", search);
        sqlx::query_as::<_, Movie>(
            r#"
            SELECT * FROM movies 
            WHERE name ILIKE $1 OR description ILIKE $1 OR director ILIKE $1
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3
            "#
        )
        .bind(&search_pattern)
        .bind(limit as i64)
        .bind(offset as i64)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, Movie>(
            r#"
            SELECT * FROM movies 
            ORDER BY created_at DESC 
            LIMIT $1 OFFSET $2
            "#
        )
        .bind(limit as i64)
        .bind(offset as i64)
        .fetch_all(pool)
        .await?
    };
    
    Ok(movies)
}

pub async fn count_movies(pool: &PgPool, search: &str) -> Result<i64> {
    let count = if !search.is_empty() {
        let search_pattern = format!("%{}%", search);
        let result: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*) FROM movies 
            WHERE name ILIKE $1 OR description ILIKE $1 OR director ILIKE $1
            "#
        )
        .bind(&search_pattern)
        .fetch_one(pool)
        .await?;
        result.0
    } else {
        let result: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM movies")
            .fetch_one(pool)
            .await?;
        result.0
    };
    
    Ok(count)
}

pub async fn get_movie_by_id(pool: &PgPool, id: i32) -> Result<Option<Movie>> {
    let movie = sqlx::query_as::<_, Movie>(
        "SELECT * FROM movies WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    
    Ok(movie)
}

pub async fn get_movie_collections(
    pool: &PgPool,
    search: &str,
    limit: i32,
    offset: i32,
) -> Result<Vec<MovieCollection>> {
    let collections = if !search.is_empty() {
        let search_pattern = format!("%{}%", search);
        sqlx::query_as::<_, MovieCollection>(
            r#"
            SELECT * FROM movie_collections 
            WHERE name ILIKE $1 OR url ILIKE $1
            ORDER BY is_default DESC, created_at DESC 
            LIMIT $2 OFFSET $3
            "#
        )
        .bind(&search_pattern)
        .bind(limit as i64)
        .bind(offset as i64)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, MovieCollection>(
            r#"
            SELECT * FROM movie_collections 
            ORDER BY is_default DESC, created_at DESC 
            LIMIT $1 OFFSET $2
            "#
        )
        .bind(limit as i64)
        .bind(offset as i64)
        .fetch_all(pool)
        .await?
    };
    
    Ok(collections)
}

pub async fn count_movie_collections(pool: &PgPool, search: &str) -> Result<i64> {
    let count = if !search.is_empty() {
        let search_pattern = format!("%{}%", search);
        let result: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*) FROM movie_collections 
            WHERE name ILIKE $1 OR url ILIKE $1
            "#
        )
        .bind(&search_pattern)
        .fetch_one(pool)
        .await?;
        result.0
    } else {
        let result: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM movie_collections")
            .fetch_one(pool)
            .await?;
        result.0
    };
    
    Ok(count)
}

pub async fn get_movie_collection_by_id(pool: &PgPool, id: i32) -> Result<Option<MovieCollection>> {
    let collection = sqlx::query_as::<_, MovieCollection>(
        "SELECT * FROM movie_collections WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    
    Ok(collection)
}

pub async fn create_movie_collection(
    pool: &PgPool,
    collection_data: &CreateMovieCollection,
) -> Result<MovieCollection> {
    let collection = sqlx::query_as::<_, MovieCollection>(
        r#"
        INSERT INTO movie_collections (name, url, is_default)
        VALUES ($1, $2, $3)
        RETURNING *
        "#
    )
    .bind(&collection_data.name)
    .bind(&collection_data.url)
    .bind(collection_data.is_default.unwrap_or(false))
    .fetch_one(pool)
    .await?;
    
    Ok(collection)
}

pub async fn update_movie_collection(
    pool: &PgPool,
    id: i32,
    collection_data: &UpdateMovieCollection,
) -> Result<Option<MovieCollection>> {
    let collection = sqlx::query_as::<_, MovieCollection>(
        r#"
        UPDATE movie_collections 
        SET 
            name = COALESCE($2, name),
            url = COALESCE($3, url),
            is_default = COALESCE($4, is_default)
        WHERE id = $1
        RETURNING *
        "#
    )
    .bind(id)
    .bind(&collection_data.name)
    .bind(&collection_data.url)
    .bind(collection_data.is_default)
    .fetch_optional(pool)
    .await?;
    
    Ok(collection)
}

pub async fn delete_movie_collection(pool: &PgPool, id: i32) -> Result<bool> {
    let result = sqlx::query(
        "DELETE FROM movie_collections WHERE id = $1 AND is_default = FALSE"
    )
    .bind(id)
    .execute(pool)
    .await?;
    
    Ok(result.rows_affected() > 0)
}