#!/bin/bash

# Run Shuttle locally with a test database
export SQLX_OFFLINE=true
cargo shuttle run --port 8000