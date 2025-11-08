# Deploy OtherShorts Web App to AWS S3 (PowerShell version for Windows)
# Usage: .\deploy-web-to-s3.ps1

# Configuration
$S3_BUCKET = "othershorts"
$AWS_REGION = "ap-southeast-2"  # Sydney region
$CLOUDFRONT_DISTRIBUTION_ID = ""  # Optional: Add your CloudFront distribution ID here

# Files to preserve (won't be deleted during sync)
$PRESERVE_FILES = @("delete.html", "privacy.html")

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

# Build exclude parameters for preserved files
$excludeParams = @("--exclude", "index.html", "--exclude", "metadata.json")
foreach ($file in $PRESERVE_FILES) {
    $excludeParams += "--exclude"
    $excludeParams += $file
}

# Sync files with exclusions
aws s3 sync dist/ s3://$S3_BUCKET/ `
    --region $AWS_REGION `
    --delete `
    --cache-control "public, max-age=31536000, immutable" `
    @excludeParams

# Upload index.html with no-cache (always fetch latest)
Write-Host "[2/4] Uploading index.html (no cache)..." -ForegroundColor Green
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html `
    --region $AWS_REGION `
    --cache-control "no-cache, no-store, must-revalidate" `
    --content-type "text/html"

# Upload metadata.json with no-cache
aws s3 cp dist/metadata.json s3://$S3_BUCKET/metadata.json `
    --region $AWS_REGION `
    --cache-control "no-cache, no-store, must-revalidate" `
    --content-type "application/json"

Write-Host "[3/4] Verifying deployment..." -ForegroundColor Green
aws s3 ls s3://$S3_BUCKET/ --region $AWS_REGION --recursive --human-readable --summarize

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
Write-Host "  http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Preserved files (not modified):" -ForegroundColor Yellow
foreach ($file in $PRESERVE_FILES) {
    Write-Host "  - $file" -ForegroundColor Yellow
}
Write-Host ""
