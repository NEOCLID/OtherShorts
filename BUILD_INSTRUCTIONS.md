# Build Instructions for OtherShorts

## ⚠️ CRITICAL: Before Building

### 1. Configure Google OAuth for Production

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

**Add these Authorized Redirect URIs:**
```
https://othershorts.com
https://api.othershorts.com
https://auth.expo.io/@neosa/othershorts
```

**Add these Authorized JavaScript Origins:**
```
https://othershorts.com
https://api.othershorts.com
```

**For Android - Add SHA-1 Fingerprint:**
```bash
# Get your release keystore SHA-1:
cd android
keytool -list -v -keystore app/my-upload-key.keystore -alias my-key-alias

# Copy the SHA-1 fingerprint and add it to Google Console
```

---

## 🌐 Web Build

### Build Command
```bash
# Clean previous builds
rm -rf dist/

# Build for web (production)
npx expo export --platform web

# Output will be in: dist/
```

###Deploy to Hosting

**Option 1: Vercel**
```bash
npm install -g vercel
vercel --prod
# Point domain othershorts.com to Vercel
```

**Option 2: Netlify**
```bash
npm install -g netlify-cli
netlify deploy --dir=dist --prod
# Point domain othershorts.com to Netlify
```

**Option 3: AWS S3 + CloudFront**
```bash
# Install AWS CLI first
aws s3 sync dist/ s3://othershorts.com --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

---

## 📱 Android Build

### Method 1: Local Build (Recommended for Testing)

**Build APK (for testing):**
```bash
cd android
./gradlew clean
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

**Build AAB (for Google Play):**
```bash
cd android
./gradlew clean
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Method 2: EAS Build (Cloud Build)

**Prerequisites:**
```bash
npm install -g eas-cli
eas login
eas build:configure
```

**Build AAB for Production:**
```bash
# Build in the cloud (requires Expo account)
eas build --platform android --profile production

# This will create an AAB file and upload to Expo servers
# You can submit directly to Google Play with:
eas submit --platform android --latest
```

---

## 🔐 Release Signing Setup

### Check if Keystore Exists

```bash
# Check if you have the keystore configured
cat android/gradle.properties | grep MYAPP_UPLOAD

# If missing, generate a new keystore:
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Update gradle.properties

Create/edit `android/gradle.properties`:
```properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=YOUR_KEYSTORE_PASSWORD
MYAPP_UPLOAD_KEY_PASSWORD=YOUR_KEY_PASSWORD

android.enableProguardInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true
android.enablePngCrunchInReleaseBuilds=true
```

**⚠️ IMPORTANT**: Never commit `gradle.properties` to git! It's already in `.gitignore`.

---

## 🧪 Testing Builds

### Test APK Locally
```bash
# Install on connected device or emulator
adb install android/app/build/outputs/apk/release/app-release.apk

# Or drag and drop the APK file onto an emulator
```

### Test Web Build Locally
```bash
# Install a simple HTTP server
npm install -g serve

# Serve the dist folder
serve dist

# Open http://localhost:3000 in browser
```

---

## 📦 File Sizes (Approximate)

- **Web build**: ~5-10 MB (dist folder)
- **Android APK**: ~25-35 MB
- **Android AAB**: ~15-25 MB (Google Play optimizes delivery)

---

## 🚀 Build Checklist

Before building for production:

- [ ] Update version in `android/app/build.gradle` (versionCode & versionName)
- [ ] Update version in `app.json`
- [ ] Test app thoroughly in development mode
- [ ] Check all environment variables are set
- [ ] Google OAuth redirect URIs configured
- [ ] Production API server is running
- [ ] Database is set up and accessible
- [ ] SSL certificates configured
- [ ] Create release notes
- [ ] Test build on physical device
- [ ] Check app works offline (partially)
- [ ] Verify all Korean translations display correctly

---

## 🐛 Common Build Errors

### Error: "Release keystore not found"
**Solution**: Create keystore using keytool command above

### Error: "Execution failed for task :app:bundleRelease"
**Solution**: Clean and rebuild
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

### Error: "expo export" fails
**Solution**: Clear cache and try again
```bash
npx expo start -c
# Then in another terminal:
npx expo export --platform web
```

### Error: "Module not found" during build
**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Build Artifacts

After successful builds, you'll have:

**Web:**
- `dist/_expo/static/` - Static assets
- `dist/index.html` - Main HTML file
- `dist/assets/` - Images and fonts

**Android:**
- `android/app/build/outputs/apk/release/app-release.apk` - APK file
- `android/app/build/outputs/bundle/release/app-release.aab` - AAB file
- `android/app/build/outputs/mapping/release/` - ProGuard mapping files (keep these!)

---

## 🔄 Update Process

When releasing an update:

1. **Increment versions:**
   - `android/app/build.gradle`: versionCode (e.g., 3 → 4)
   - `android/app/build.gradle`: versionName (e.g., "1.0.2" → "1.0.3")
   - `app.json`: version

2. **Build new version:**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew bundleRelease
   ```

3. **Upload to Google Play Console**

4. **Deploy web build** to hosting

---

## 📝 Build Notes

- **First build** takes longer (~5-15 minutes)
- **Subsequent builds** are faster (~2-5 minutes)
- **AAB files** are smaller than APK because Google Play optimizes them
- **ProGuard** is enabled for release builds (code obfuscation + shrinking)
- **Keep mapping files** - you'll need them to debug crash reports

---

## ✅ Build Complete - Next Steps

1. Test the build thoroughly
2. Upload AAB to Google Play Console (Internal Testing track first)
3. Deploy web build to othershorts.com
4. Configure production API server at api.othershorts.com
5. Test on production environment
6. Promote to production when ready
