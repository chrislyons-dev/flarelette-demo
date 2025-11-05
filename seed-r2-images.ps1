# Upload cheerleader images to local R2 bucket
# This seeds the image-service with sample images

Write-Host "Uploading cheerleader images to R2..." -ForegroundColor Cyan
Write-Host ""

$imagesPath = "..\..\docs\images"
$images = @(
    "cheer-sarah.jpg",
    "cheer-marcus.jpg",
    "cheer-emma.jpg",
    "cheer-tyler.jpg",
    "cheer-aisha.jpg"
)

cd workers\image-service

foreach ($image in $images) {
    $imagePath = Join-Path $imagesPath $image
    if (Test-Path $imagePath) {
        Write-Host "Uploading $image..." -ForegroundColor Yellow
        npx wrangler r2 object put images/$image --file=$imagePath --local
        Write-Host "  Uploaded $image" -ForegroundColor Green
    } else {
        Write-Host "  Not found: $imagePath" -ForegroundColor Red
    }
}

cd ..\..

Write-Host ""
Write-Host "Images uploaded to local R2 bucket!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: These are LOCAL R2 objects only" -ForegroundColor Gray
Write-Host ""
