mod handlers;
mod middleware;
mod models;
mod services;

use actix_web::{web, middleware as actix_middleware};
use actix_files::Files;
use shuttle_runtime::CustomError;
use sqlx::{Executor, PgPool};
use std::{env, path::Path, sync::Arc};

use crate::handlers::{get_movie, list_movies};
use crate::middleware::cors::configure_cors;

pub fn create_app(
    pool: Arc<PgPool>,
) -> impl FnOnce(&mut web::ServiceConfig) + Send + Clone + 'static {
    move |cfg: &mut web::ServiceConfig| {
        cfg.app_data(web::Data::new(pool.clone()))
            .service(
                web::scope("/api/v1")
                    .wrap(configure_cors())
                    .wrap(actix_middleware::Logger::default())
                    .route("/movies", web::get().to(list_movies))
                    .route("/movies/{id}", web::get().to(get_movie))
            )
            .service(Files::new("/", "./frontend/dist").index_file("index.html"));
    }
}

#[shuttle_runtime::main]
async fn main(
    #[shuttle_shared_db::Postgres] db: String,
) -> shuttle_actix_web::ShuttleActixWeb<impl FnOnce(&mut web::ServiceConfig) + Send + Clone + 'static> {
    let pool = Arc::new(
        PgPool::connect(&db)
            .await
            .map_err(CustomError::new)?
    );

    pool.execute(include_str!("../migrations/002_movies.sql"))
        .await
        .map_err(CustomError::new)?;

    if let Ok(cwd) = env::current_dir() {
        println!("Deployment directory: {:?}", cwd);
    }

    // Check both relative paths that might be used
    let static_paths = ["./frontend/dist", "frontend/dist"];
    let mut found = false;
    
    for path in &static_paths {
        if Path::new(path).exists() {
            println!("Found static directory at: {}", path);
            if Path::new(&format!("{}/index.html", path)).exists() {
                println!("✓ index.html found at: {}/index.html", path);
                found = true;
            }
            if Path::new(&format!("{}/assets", path)).exists() {
                println!("✓ assets directory found at: {}/assets", path);
            }
        }
    }
    
    if !found {
        println!("⚠️ Warning: Static files not found. Ensure 'npm run build' was run in frontend/");
    }

    Ok(create_app(pool).into())
}