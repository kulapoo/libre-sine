# LibreSine - Movie Collection Management Platform

A responsive web application for managing your movie collections, built with Rust (Actix-web) backend and React frontend, designed for deployment on Shuttle.rs. Works seamlessly on desktop, tablet, and mobile devices.

## Author's Note

This project was created as a personal movie collection manager, initially intended to organize kids' movie libraries in a family-friendly interface. It's also my playground for having fun with Rust and exploring its ecosystem. Perfect for anyone looking to manage their home movie collection or learn from a practical Rust + React application.

## Important: Video Streaming Notice

**LibreSine does not host or stream videos.** The application only manages URLs that redirect to external video sources. Users must ensure:
- Videos are hosted on their own servers or third-party platforms
- Video URLs are publicly accessible
- They have the necessary rights to access and share the video content

## Tech Stack

- **Backend**: Rust + Actix-web + PostgreSQL/SQLite
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Deployment**: Shuttle.rs
- **Database**: PostgreSQL (via Shuttle.rs)

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable version)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Cargo Shuttle](https://docs.shuttle.rs/introduction/installation) CLI tool

## Quick Start

### 1. Install Shuttle CLI

```bash
cargo install cargo-shuttle
cargo shuttle login  # Login with GitHub
```

### 2. Clone and Setup

```bash
git clone <repository-url>
cd libre-sine

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## Running Locally

**Note**: For local development, create a `.env` file in the project root directory with the following content:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:19721/libresine
SQLX_OFFLINE=true
```

You'll need two terminal windows to run both the backend and frontend:

### Terminal 1: Backend Server

```bash
# Run the Shuttle backend locally (includes database)
cargo shuttle run
# Backend will be available at http://localhost:8000
```

### Terminal 2: Frontend Development Server

```bash
cd frontend
npm run dev
# Frontend will be available at http://localhost:5173
```

The frontend is configured to proxy API requests to the backend automatically during development.

## Alternative: Run Backend Without Shuttle

If you prefer to run the backend without Shuttle (using local PostgreSQL):

```bash
# Set up your PostgreSQL connection
export DATABASE_URL="postgresql://username:password@localhost/libresine"

# Run migrations
sqlx migrate run

# Run the local binary
cargo run --bin local
```

## Building for Production

### Build Frontend

```bash
cd frontend
npm run build
# This will build the frontend to the ../static directory
```

### Deploy to Shuttle.rs

```bash
# From the project root
cargo shuttle deploy

# Or use the convenience script
./deploy.sh
```

Your app will be deployed to: `https://libresine.shuttleapp.rs`

## Application Flow

```mermaid
graph TD
    A[User Opens App] --> B[Frontend React App]
    B --> C{Page Router}
    
    C --> D[Movies Page - Currently Working]
    C --> E[Collections Page - Coming Soon]
    C --> F[Settings Page - Coming Soon]
    
    D --> G[IndexedDB Local Storage]
    D --> H[Backend API]
    
    H --> I[Rust Actix Server]
    I --> J[PostgreSQL Database]
    
    G --> L[Offline Movie Data]
    L --> D
    
    style D fill:#90EE90
    style E fill:#FFB6C1
    style F fill:#FFB6C1
```

> **Note**: Currently, only the **Movies** page is fully functional. The Collections and Settings pages are under development.

> **Important**: Your personal movies are stored locally in your browser's IndexedDB. To backup or transfer your movies to another device, use the Import/Export feature on the Movies page to save/load your collection as a JSON file.

## Project Structure

```
libre-sine/
 src/                    # Rust backend source
    main.rs            # Shuttle entry point
    lib.rs             # Library module
    bin/
       local.rs       # Local development binary
    handlers/          # API route handlers
    models/            # Data models
    services/          # Business logic
 frontend/              # React frontend
    src/
       components/    # React components
       pages/         # Page components
       services/      # API services
    package.json       # Frontend dependencies
 static/                # Built frontend (generated)
 migrations/            # Database migrations
    001_movie_collections.sql  # Movie collections schema
 docs/                  # Documentation and schemas
    movie-collection.json  # Collection schema example
    movies.json        # Movies data format example
 Cargo.toml            # Rust dependencies
 Shuttle.toml          # Shuttle configuration
 deploy.sh             # Deployment script
```

## Database Schema

The application uses a PostgreSQL database with the following schema:

```sql
CREATE TABLE movie_collections (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

- `GET /api/v1/movie-collections` - List movie collections with pagination and search
- `GET /api/v1/movie-collections/{id}` - Get a specific movie collection
- `POST /api/v1/movie-collections` - Create a new movie collection
- `PUT /api/v1/movie-collections/{id}` - Update a movie collection (cannot update default collections)
- `DELETE /api/v1/movie-collections/{id}` - Delete a movie collection (cannot delete default collections)

## Environment Variables

For production deployment on Shuttle, set secrets using:

```bash
cargo shuttle secret new ADMIN_PASSWORD
cargo shuttle secret new JWT_SECRET
```

## Development Commands

```bash
# Backend commands
cargo build              # Build the backend
cargo test              # Run tests
cargo fmt               # Format code
cargo clippy            # Run linter

# Frontend commands
cd frontend
npm run dev             # Start development server
npm run build           # Build for production
npm run lint            # Run ESLint
npm run preview         # Preview production build

# Deployment
npm run deploy          # Build frontend and deploy to Shuttle
```



## Data Format

### Movie Collection Format

Each movie collection entry follows this schema:

```json
{
  "id": 1,
  "name": "Collection Name",
  "url": "https://example.com/movies.json",
  "is_default": false,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Movies JSON Format (from collection URL)

The URL in each collection should return a JSON array of movies in this format:

```json
[
  {
    "name": "Movie Title",
    "movie_url": "https://example.com/movie.mp4",
    "image_url": "https://example.com/poster.jpg",
    "created_at": "2023-01-01",
    "updated_at": "2023-01-02",
    "description": "Movie description",
    "rating": 4.5,
    "genres": ["Action", "Adventure"],
    "director": "Director Name",
    "actors": ["Actor 1", "Actor 2"]
  }
]
```

## Troubleshooting

### Port Already in Use

If port 8000 is already in use:
```bash
# Find and kill the process using port 8000
lsof -i :8000
kill -9 <PID>
```

### Database Connection Issues

Ensure PostgreSQL is running if using local development:
```bash
# Check PostgreSQL status
systemctl status postgresql

# Start PostgreSQL if needed
systemctl start postgresql
```

### Frontend Build Issues

Clear cache and reinstall dependencies:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.