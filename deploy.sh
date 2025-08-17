#!/bin/bash

echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Deploying to Shuttle..."
cargo shuttle deploy --allow-dirty

echo "Deployment complete!"