# Setup Local D1 Databases for Development
# Run this script once to create local D1 databases for all services

Write-Host "Setting up local D1 databases..." -ForegroundColor Cyan
Write-Host ""

# Content Service Database
Write-Host "Creating content-service database..." -ForegroundColor Yellow
cd workers\content-service

# Create the local D1 database
wrangler d1 create content-db --local

# Execute schema
wrangler d1 execute content-db --local --file=schema.sql

Write-Host "✓ Content service database created and initialized" -ForegroundColor Green
Write-Host ""

cd ..\..

# Forms Service Database
Write-Host "Creating forms-service database..." -ForegroundColor Yellow
cd workers\forms-service

# Create the local D1 database
wrangler d1 create forms-db --local

# Execute schema
wrangler d1 execute forms-db --local --file=schema.sql

Write-Host "✓ Forms service database created and initialized" -ForegroundColor Green
Write-Host ""

cd ..\..

Write-Host ""
Write-Host "All databases set up successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: These are LOCAL databases only (.wrangler folder)" -ForegroundColor Gray
Write-Host "For production, you'll need to create remote D1 databases" -ForegroundColor Gray
Write-Host ""
