use actix_web::{web, App, HttpServer, middleware};
use actix_files::Files;
use sqlx::{Executor, PgPool};
use std::env;
use std::path::Path;
use std::sync::Arc;

use libresine::handlers::{get_movie, list_movies};
use libresine::middleware::cors::configure_cors;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::dotenv().ok();

    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:password@localhost/libre_sine".to_string());

    println!("Connecting to database: {}", database_url);

    let pool = Arc::new(
        PgPool::connect(&database_url)
            .await
            .expect("Failed to connect to database")
    );

    pool.execute(include_str!("../../migrations/002_movies.sql"))
        .await
        .expect("Failed to run migrations");

    if !Path::new("frontend/dist").exists() {
        println!("⚠️  frontend/dist not found!");
        println!("   For development: Run 'npm run dev' in frontend/ folder (recommended)");
        println!("   For production mode: Run 'npm run build' in frontend/ folder first");
        println!("");
    }

    println!("🚀 Backend API running at http://127.0.0.1:8080");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(configure_cors())
            .wrap(middleware::Logger::default())
            .service(
                web::scope("/api/v1")
                    .route("/movies", web::get().to(list_movies))
                    .route("/movies/{id}", web::get().to(get_movie))
            )
            .service(Files::new("/", "frontend/dist").index_file("index.html"))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await?;

    Ok(())
}
