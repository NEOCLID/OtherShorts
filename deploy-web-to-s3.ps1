# Deploy OtherShorts Web App to AWS S3 (PowerShell version for Windows)
# Usage: .\deploy-web-to-s3.ps1

# Configuration
$S3_BUCKET = "othershorts.com"
$CLOUDFRONT_DISTRIBUTION_ID = ""  # Optional: Add your CloudFront distribution ID here

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "OtherShorts Web Deployment to S3" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
} catch {
    Write-Host "Error: AWS CLI is not installed" -ForegroundColor Red
    Write-Host "Install it from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check if dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "dist/ folder not found. Building web app..." -ForegroundColor Yellow
    npx expo export --platform web
}

Write-Host "[1/4] Uploading files to S3..." -ForegroundColor Green
aws s3 sync dist/ s3://$S3_BUCKET/ `
    --delete `
    --cache-control "public, max-age=31536000, immutable" `
    --exclude "index.html" `
    --exclude "metadata.json"

# Upload index.html with no-cache (always fetch latest)
Write-Host "[2/4] Uploading index.html (no cache)..." -ForegroundColor Green
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html `
    --cache-control "no-cache, no-store, must-revalidate" `
    --content-type "text/html"

# Upload metadata.json with no-cache
aws s3 cp dist/metadata.json s3://$S3_BUCKET/metadata.json `
    --cache-control "no-cache, no-store, must-revalidate" `
    --content-type "application/json"

Write-Host "[3/4] Verifying deployment..." -ForegroundColor Green
aws s3 ls s3://$S3_BUCKET/ --recursive --human-readable --summarize

# Invalidate CloudFront cache (optional)
if ($CLOUDFRONT_DISTRIBUTION_ID -ne "") {
    Write-Host "[4/4] Invalidating CloudFront cache..." -ForegroundColor Green
    aws cloudfront create-invalidation `
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID `
        --paths "/*"
    Write-Host "✅ CloudFront cache invalidated" -ForegroundColor Green
} else {
    Write-Host "[4/4] Skipping CloudFront invalidation (no distribution ID set)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is now live at:"
Write-Host "  https://$S3_BUCKET" -ForegroundColor Cyan
Write-Host ""
