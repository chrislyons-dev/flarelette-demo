#!/bin/bash
set -e

echo "🗄️  Setting up D1 databases for local development..."

# Create D1 databases (local)
echo ""
echo "Creating content-db..."
cd workers/content-service
wrangler d1 create content-db --local || echo "Database may already exist"
wrangler d1 execute content-db --local --file=./schema.sql
wrangler d1 execute content-db --local --file=./seed.sql
echo "✅ Content database initialized with sample data"
cd ../..

echo ""
echo "Creating forms-db..."
cd workers/forms-service
wrangler d1 create forms-db --local || echo "Database may already exist"
wrangler d1 execute forms-db --local --file=./schema.sql
echo "✅ Forms database initialized"
cd ../..

echo ""
echo "📋 Next steps:"
echo "   1. Update database_id in wrangler.toml files with the IDs shown above"
echo "   2. For production, run the same commands without --local flag"
echo "   3. Run: pnpm dev"
