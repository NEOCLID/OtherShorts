#!/bin/bash
# Deploy OtherShorts Web App to AWS S3
# Usage: ./deploy-web-to-s3.sh

set -e  # Exit on error

echo "======================================"
echo "OtherShorts Web Deployment to S3"
echo "======================================"
echo ""

# Configuration
S3_BUCKET="othershorts.com"
CLOUDFRONT_DISTRIBUTION_ID=""  # Optional: Add your CloudFront distribution ID here

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}dist/ folder not found. Building web app...${NC}"
    npx expo export --platform web
fi

echo -e "${GREEN}[1/4] Uploading files to S3...${NC}"
aws s3 sync dist/ s3://${S3_BUCKET}/ \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html" \
    --exclude "metadata.json"

# Upload index.html with no-cache (always fetch latest)
echo -e "${GREEN}[2/4] Uploading index.html (no cache)...${NC}"
aws s3 cp dist/index.html s3://${S3_BUCKET}/index.html \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html"

# Upload metadata.json with no-cache
aws s3 cp dist/metadata.json s3://${S3_BUCKET}/metadata.json \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "application/json"

echo -e "${GREEN}[3/4] Verifying deployment...${NC}"
aws s3 ls s3://${S3_BUCKET}/ --recursive --human-readable --summarize | tail -n 2

# Invalidate CloudFront cache (optional)
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${GREEN}[4/4] Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
        --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
        --paths "/*"
    echo -e "${GREEN}✅ CloudFront cache invalidated${NC}"
else
    echo -e "${YELLOW}[4/4] Skipping CloudFront invalidation (no distribution ID set)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Your app is now live at:"
echo "  https://${S3_BUCKET}"
echo ""
