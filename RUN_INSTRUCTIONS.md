# Running LibreSine

## Prerequisites
- Rust (latest stable)
- PostgreSQL (for local development)
- Node.js & npm (for frontend)

## Setup Database

### Option 1: Using Docker (Recommended for local development)
```bash
docker run -d \
  --name libre-sine-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=libre_sine \
  postgres:15
```

### Option 2: Using existing PostgreSQL
Update the `.env` file with your database credentials:
```
DATABASE_URL=postgres://username:password@localhost/libre_sine
SQLX_OFFLINE=true
```

## Running Locally (without Shuttle)

```bash
# Run the local development server
cargo run --bin local

# The server will start at http://localhost:8080
```

## Running with Shuttle (for deployment simulation)

```bash
# Make sure PostgreSQL is running
cargo shuttle run --port 8000
```

## Deploying to Shuttle.rs (Production)

```bash
# Login to Shuttle (uses GitHub authentication)
cargo shuttle login

# Deploy to production
cargo shuttle deploy

# Your app will be available at:
# https://libresine.shuttleapp.rs
```

## Troubleshooting

### "Runtime Resource Initialization phase failed" Error
This error occurs when Shuttle can't connect to a database locally. Solutions:
1. Make sure PostgreSQL is running (use Docker command above)
2. Use the local binary instead: `cargo run --bin local`
3. Deploy directly to Shuttle cloud: `cargo shuttle deploy`

### Database Connection Issues
- Check if PostgreSQL is running: `docker ps`
- Verify connection string in `.env` file
- Ensure database `libre_sine` exists

### Build Errors
- Run `export SQLX_OFFLINE=true` before building
- Clear cargo cache: `cargo clean`
- Rebuild: `cargo build`

## Frontend Development

```bash
cd frontend
npm install
npm run dev
# Frontend will be at http://localhost:5173
```

## Building for Production

```bash
# Build frontend
cd frontend
npm run build
cd ..

# Deploy to Shuttle
cargo shuttle deploy
```