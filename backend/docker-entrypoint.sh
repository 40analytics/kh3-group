#!/bin/sh
set -e

echo "🔧 Generating Prisma Client..."
npx prisma generate

# Skip migrations on startup - run them separately via Cloud Run Job
# echo "🗄️  Running database migrations..."
# npx prisma migrate deploy

echo "🚀 Starting NestJS application..."
exec node dist/main
