# Deploy Web App to AWS S3 + CloudFront

This guide shows you how to automatically deploy the OtherShorts web app to AWS S3 using a deployment script.

---

## Prerequisites

1. **AWS Account** - Sign up at https://aws.amazon.com
2. **AWS CLI installed** - Download from https://aws.amazon.com/cli/
3. **Web app built** - Run `npx expo export --platform web` (creates `dist/` folder)

---

## Step 1: Install AWS CLI

### Windows:
Download and install from: https://awscli.amazonaws.com/AWSCLIV2.msi

### Mac:
```bash
brew install awscli
```

### Linux:
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Verify installation:**
```bash
aws --version
```

---

## Step 2: Configure AWS Credentials

### A. Create IAM User for Deployment

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Add users**
3. **User name**: `othershorts-deployer`
4. **Access type**: ✅ Access key - Programmatic access
5. Click **Next: Permissions**
6. Click **Attach existing policies directly**
7. Search and select:
   - `AmazonS3FullAccess` (for S3 uploads)
   - `CloudFrontFullAccess` (optional, for cache invalidation)
8. Click **Next** → **Create user**
9. **IMPORTANT**: Download the CSV with:
   - Access Key ID
   - Secret Access Key

### B. Configure AWS CLI

Run this command and enter your credentials:

```bash
aws configure
```

**Enter when prompted:**
```
AWS Access Key ID: [YOUR_ACCESS_KEY_ID]
AWS Secret Access Key: [YOUR_SECRET_ACCESS_KEY]
Default region name: us-east-1
Default output format: json
```

**Verify configuration:**
```bash
aws s3 ls
```

---

## Step 3: Create S3 Bucket

### A. Create Bucket via AWS CLI

```bash
aws s3 mb s3://othershorts.com --region us-east-1
```

### B. Enable Static Website Hosting

```bash
aws s3 website s3://othershorts.com --index-document index.html --error-document index.html
```

### C. Set Bucket Policy (Make Public)

Create a file `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::othershorts.com/*"
    }
  ]
}
```

Apply the policy:

```bash
aws s3api put-bucket-policy --bucket othershorts.com --policy file://bucket-policy.json
```

### D. Configure CORS (Optional, for API calls)

Create `cors-config.json`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply CORS:

```bash
aws s3api put-bucket-cors --bucket othershorts.com --cors-configuration file://cors-config.json
```

---

## Step 4: Run Deployment Script

### On Windows (PowerShell):

```powershell
.\deploy-web-to-s3.ps1
```

### On Mac/Linux:

```bash
chmod +x deploy-web-to-s3.sh
./deploy-web-to-s3.sh
```

### What the script does:

1. ✅ Checks if AWS CLI is installed
2. ✅ Builds web app if `dist/` folder doesn't exist
3. ✅ Syncs all files to S3 with proper cache headers
4. ✅ Sets `index.html` to no-cache (always fresh)
5. ✅ (Optional) Invalidates CloudFront cache
6. ✅ Verifies deployment

---

## Step 5: (Optional) Set Up CloudFront CDN

CloudFront provides:
- **Global CDN** (faster load times worldwide)
- **HTTPS support** (SSL certificate)
- **Custom domain** (othershorts.com)

### A. Create CloudFront Distribution

1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Click **Create Distribution**
3. **Origin Settings**:
   - **Origin Domain**: `othershorts.com.s3-website-us-east-1.amazonaws.com`
   - **Name**: `othershorts-s3-origin`
4. **Default Cache Behavior**:
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP Methods**: GET, HEAD, OPTIONS
   - **Cache Policy**: CachingOptimized
5. **Settings**:
   - **Alternate Domain Names (CNAMEs)**: `othershorts.com`, `www.othershorts.com`
   - **SSL Certificate**:
     - Request certificate from ACM (AWS Certificate Manager)
     - Or use default CloudFront certificate
6. Click **Create Distribution**

### B. Request SSL Certificate

1. Go to [ACM Console](https://console.aws.amazon.com/acm/) (in **us-east-1** region)
2. Click **Request certificate**
3. **Domain names**:
   - `othershorts.com`
   - `www.othershorts.com`
4. **Validation**: DNS validation (recommended)
5. Add the CNAME records to your domain's DNS
6. Wait for validation (5-30 minutes)

### C. Update DNS Records

Point your domain to CloudFront:

```
Type    Name                Value
A       othershorts.com     [CloudFront distribution domain]
CNAME   www                 [CloudFront distribution domain]
```

**CloudFront distribution domain** looks like: `d1234567890.cloudfront.net`

### D. Add CloudFront ID to Deployment Script

Edit `deploy-web-to-s3.ps1` or `deploy-web-to-s3.sh`:

```bash
CLOUDFRONT_DISTRIBUTION_ID="E1234567890ABC"  # Your distribution ID
```

Find your distribution ID in CloudFront console.

---

## Step 6: Update package.json Scripts

Add deployment commands to `package.json`:

```json
{
  "scripts": {
    "start": "expo start",
    "start:server": "node server/server.js",
    "build:web": "npx expo export --platform web",
    "deploy:web": "npm run build:web && ./deploy-web-to-s3.sh",
    "deploy:web:windows": "npm run build:web && powershell -ExecutionPolicy Bypass -File .\\deploy-web-to-s3.ps1"
  }
}
```

**Now you can deploy with:**

```bash
# Mac/Linux
npm run deploy:web

# Windows
npm run deploy:web:windows
```

---

## Testing Your Deployment

After deployment, test your site:

```bash
# S3 direct URL (no HTTPS)
http://othershorts.com.s3-website-us-east-1.amazonaws.com

# CloudFront URL (with HTTPS)
https://d1234567890.cloudfront.net

# Custom domain (after DNS propagation)
https://othershorts.com
```

---

## Troubleshooting

### "Access Denied" when accessing S3 URL

**Problem**: Bucket policy not set correctly

**Solution**:
```bash
aws s3api put-bucket-policy --bucket othershorts.com --policy file://bucket-policy.json
```

### "aws: command not found"

**Problem**: AWS CLI not installed or not in PATH

**Solution**:
- Windows: Reinstall AWS CLI and restart terminal
- Mac: `brew install awscli`
- Linux: Follow installation steps above

### CloudFront shows old content

**Problem**: Cache not invalidated

**Solution**:
```bash
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

### DNS not resolving

**Problem**: DNS propagation takes time

**Solution**:
- Wait 5-30 minutes for DNS changes
- Check DNS with: `nslookup othershorts.com`
- Use CloudFront URL directly while waiting

---

## Cost Estimate

### S3 Storage:
- **Storage**: $0.023/GB/month
- **Data Transfer Out**: $0.09/GB
- **Requests**: ~$0.005/1000 requests

**Estimate for OtherShorts (1000 visitors/month)**:
- Storage (50 MB): ~$0.01/month
- Transfer (50 GB): ~$4.50/month
- Requests: ~$0.01/month
- **Total**: ~$5/month

### CloudFront:
- **Data Transfer**: $0.085/GB (first 10 TB)
- **Requests**: $0.0075/10,000 requests
- **Free Tier**: 1 TB transfer, 10M requests/month (12 months)

**Estimate with CloudFront (1000 visitors/month)**:
- Within free tier for first year
- After: ~$3-5/month

---

## Automation with GitHub Actions (Optional)

For automatic deployment on every push to GitHub:

Create `.github/workflows/deploy-web.yml`:

```yaml
name: Deploy Web to S3

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build web app
        run: npx expo export --platform web

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://othershorts.com/ \
            --delete \
            --cache-control "public, max-age=31536000, immutable" \
            --exclude "index.html" \
            --exclude "metadata.json"

          aws s3 cp dist/index.html s3://othershorts.com/index.html \
            --cache-control "no-cache, no-store, must-revalidate"

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

**Add secrets in GitHub**:
1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Add:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `CLOUDFRONT_DISTRIBUTION_ID`

---

## Summary

**Manual Deployment:**
```bash
npm run build:web
.\deploy-web-to-s3.ps1  # Windows
# or
./deploy-web-to-s3.sh   # Mac/Linux
```

**Automatic Deployment:**
- Push to GitHub → GitHub Actions deploys automatically

**Your app will be live at:**
- S3: http://othershorts.com.s3-website-us-east-1.amazonaws.com
- CloudFront: https://othershorts.com

---

**Questions?** Check AWS documentation:
- S3 Static Hosting: https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html
- CloudFront: https://docs.aws.amazon.com/cloudfront/
