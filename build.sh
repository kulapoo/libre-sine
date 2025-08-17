#!/bin/bash

# Build script for libre-sine deployment

echo "Building frontend assets..."
cd frontend
npm install
npm run build
cd ..

echo "Frontend build complete. Checking output..."
if [ -d "frontend/dist" ]; then
    echo "✓ frontend/dist directory created"
    echo "Contents:"
    ls -la frontend/dist/
else
    echo "✗ frontend/dist directory not found!"
    exit 1
fi