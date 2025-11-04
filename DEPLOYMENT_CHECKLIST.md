# Deployment Checklist for OtherShorts

## ⚠️ CRITICAL SECURITY ISSUES TO FIX

### 1. **REMOVE SECRETS FROM .env FILE**
❌ **NEVER commit `.env` to git!** Your database password and API keys are exposed!

**Action Required:**
```bash
# Remove .env from git if committed
git rm --cached .env
git rm --cached .env.production

# Add to .gitignore if not already
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
echo "!.env.example" >> .gitignore

# Create .env.example template
cp .env .env.example
# Then manually remove sensitive values from .env.example
```

### 2. **UPDATE GOOGLE OAUTH REDIRECT URIs**

You need to configure Google OAuth Console with these redirect URIs:

**For Web:**
- `https://othershorts.com`
- `https://api.othershorts.com`

**For Android:**
- `com.neosa.othershorts:/`

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to APIs & Services > Credentials
4. Edit your OAuth 2.0 Client IDs
5. Add the authorized redirect URIs above
6. Add authorized JavaScript origins:
   - `https://othershorts.com`
   - `https://api.othershorts.com`

### 3. **ROTATE EXPOSED SECRETS**

Since your secrets are in git history:
- ✅ Generate new database password
- ✅ Generate new YouTube API key (or restrict by IP/domain)
- ⚠️ Review Google OAuth client secrets

---

## 📋 Pre-Deployment Checklist

### Configuration Files
- [x] `app.json` created with correct package name and version
- [x] `config.js` updated to use `api.othershorts.com`
- [x] `.env.production` created
- [ ] `.env` removed from git
- [ ] Secrets rotated

### Google OAuth
- [ ] Redirect URIs configured in Google Console
- [ ] Android SHA-1 fingerprint added to Google Console (if needed)
- [ ] Test OAuth flow on production domain

### Database
- [ ] PostgreSQL database set up on production server
- [ ] Schema applied (`database/schema.sql`)
- [ ] Countries data populated (Korea, Others)
- [ ] Database accessible from api.othershorts.com
- [ ] Connection pooling configured (recommended: use `pg.Pool`)

### Backend Server (Node.js/Express)
- [ ] Deploy server to `api.othershorts.com`
- [ ] SSL certificate configured (Let's Encrypt or similar)
- [ ] CORS configured to allow `https://othershorts.com`
- [ ] Environment variables set on server
- [ ] Process manager configured (PM2 recommended)
- [ ] Server starts on boot
- [ ] Health check endpoint working

### Android App
- [ ] Release keystore configured in `android/gradle.properties`
- [ ] Version code incremented (currently: 3)
- [ ] ProGuard rules tested
- [ ] App signing configured

### Web App
- [ ] Build tested locally
- [ ] Static hosting configured (Vercel/Netlify/S3+CloudFront)
- [ ] Domain `othershorts.com` pointed to hosting
- [ ] SSL configured

### Testing
- [ ] Test Google OAuth login on production
- [ ] Test profile setup flow
- [ ] Test Takeout upload (.json and .html)
- [ ] Test video feed loading
- [ ] Test rating submission
- [ ] Test language switching (Korean ↔ English)
- [ ] Test profile editing in Settings

---

## 🚀 Deployment Commands

### 1. Web Deployment

```bash
# Install dependencies
npm install

# Export for web (creates dist folder)
npx expo export --platform web

# The dist folder can be deployed to:
# - Vercel: vercel deploy
# - Netlify: netlify deploy --dir=dist --prod
# - AWS S3: aws s3 sync dist/ s3://othershorts.com
```

### 2. Android AAB (Google Play)

```bash
# Build AAB for Google Play
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### 3. Android APK (Direct Install)

```bash
# Build APK
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔧 Production Server Setup

### Install Dependencies on Server

```bash
# On your api.othershorts.com server:
sudo apt update
sudo apt install nodejs npm postgresql nginx certbot

# Clone repo (use private repo!)
git clone <your-repo> /var/www/othershorts-api
cd /var/www/othershorts-api

# Install dependencies
npm install

# Set environment variables
sudo nano /etc/environment
# Add your production env vars here

# Install PM2
sudo npm install -g pm2

# Start server
pm2 start server/server.js --name othershorts-api
pm2 startup
pm2 save
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.othershorts.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL with Certbot

```bash
sudo certbot --nginx -d api.othershorts.com
```

---

## 📱 Google Play Console

1. Create app listing
2. Upload AAB file
3. Fill out content rating questionnaire
4. Set up pricing (free)
5. Add screenshots (1080x1920 recommended)
6. Write description (Korean + English)
7. Create closed testing track first
8. Test with beta testers
9. Promote to production when ready

---

## 🌐 Domain Configuration

### DNS Records

```
A record:     othershorts.com     → <your-web-hosting-IP>
A record:     api.othershorts.com → <your-server-IP>
CNAME record: www.othershorts.com → othershorts.com
```

---

## ⚡ Performance Optimizations

- [ ] Enable Hermes (already enabled)
- [ ] Enable ProGuard for Android (already configured)
- [ ] Compress images in assets
- [ ] Use CDN for static assets
- [ ] Enable database connection pooling
- [ ] Add Redis caching for API responses (optional)

---

## 📊 Monitoring & Analytics

Recommended tools:
- **Server monitoring**: PM2 monitoring or Datadog
- **Error tracking**: Sentry
- **Analytics**: Google Analytics 4
- **Uptime monitoring**: UptimeRobot

---

## 🔒 Security Hardening

- [ ] Rate limiting on API endpoints
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use parameterized queries - already done ✅)
- [ ] XSS prevention
- [ ] HTTPS only
- [ ] Secure cookies
- [ ] CORS properly configured
- [ ] Database backups automated
- [ ] API key rotation policy

---

## 🐛 Known Issues to Fix Before Production

1. **Gender value mismatch**: Gender values in Korean UI don't match database
   - UI shows: "남성", "여성", "기타"
   - DB expects: "Male", "Female", "Other"
   - **Fix**: Store English values in DB, display translated in UI

2. **Error handling**: Add global error boundary for React

3. **Loading states**: Improve UX with skeleton screens

---

## 📝 Post-Deployment Tasks

- [ ] Monitor server logs for errors
- [ ] Monitor Google Play Console for crash reports
- [ ] Set up automated backups
- [ ] Document API for future reference
- [ ] Create user documentation
- [ ] Set up staging environment for testing

---

**Current Status**: ⚠️ NOT READY FOR PRODUCTION

**Critical Blockers**:
1. Secrets exposed in git
2. Google OAuth not configured for production domain
3. Production server not set up
4. Database not migrated to production

**Estimated Time to Production Ready**: 4-6 hours
