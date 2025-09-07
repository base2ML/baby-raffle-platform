#!/bin/bash
set -e

echo "Starting Next.js production server..."
npm run build
npm start