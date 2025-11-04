# EAS Build Guide - Building with Expo Application Services

EAS Build is a cloud service that builds your React Native app without needing Android Studio or Xcode locally.

---

## Prerequisites

- [x] EAS CLI installed (v16.2.0 ✅)
- [ ] Expo account (create at https://expo.dev/)
- [ ] Logged into EAS CLI

---

## Step 1: Login to EAS

```bash
eas login
```

**Enter your Expo credentials** or create an account at https://expo.dev/

**Verify login:**
```bash
eas whoami
```

---

## Step 2: Configure Project

EAS needs to know about your project:

```bash
# Initialize EAS (if not done)
eas build:configure
```

This creates/updates `eas.json` (already configured ✅)

---

## Step 3: Build for Android

### Build AAB (Google Play Store):

```bash
eas build --platform android --profile production
```

**Build Process:**
1. Uploads code to Expo servers
2. Installs dependencies
3. Runs Android Gradle build
4. Signs with your keystore (or generates new one)
5. Returns download link for AAB file

**Time**: 10-20 minutes

### Build APK (Direct Install):

```bash
eas build --platform android --profile preview
```

**Use APK for:**
- Testing on devices before Google Play submission
- Internal distribution
- Side-loading

---

## Step 4: Build for Web

Web doesn't need EAS - build locally:

```bash
npx expo export --platform web
```

Output: `dist/` folder ready to deploy

---

## 🔑 Keystore Management

### First Build - EAS Generates Keystore:

On first Android build, EAS will ask:

```
? Generate a new Android Keystore? (Y/n)
```

**Choose**: `Y` (Yes)

EAS will:
- Generate a secure keystore
- Store it securely in Expo servers
- Use it for all future builds
- You can download it later if needed

### Using Existing Keystore:

If you already have a keystore (my-upload-key.keystore):

```bash
eas credentials
```

Select:
1. Android
2. Production
3. "Set up a new keystore"
4. Upload your .keystore file

---

## 📦 Build Profiles (eas.json)

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"  // For testing
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"  // For Google Play
      }
    }
  }
}
```

---

## 🎯 Build Commands Reference

```bash
# Production AAB (Google Play)
eas build --platform android --profile production

# Preview APK (testing)
eas build --platform android --profile preview

# Check build status
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Download build
# Go to: https://expo.dev/accounts/YOUR_USERNAME/projects/othershorts/builds
```

---

## 🚀 Submit to Google Play

After building AAB:

```bash
eas submit --platform android --latest
```

**Requirements:**
- Google Play Developer account ($25 one-time)
- Service account JSON key from Google Play Console

---

## 💰 Pricing

**EAS Build:**
- **Free tier**: 30 builds/month for personal accounts
- **Production**: Paid plans if you need more

**For this project**: Free tier is sufficient!

---

## 🐛 Troubleshooting

### Build Fails with "Gradle build failed"

Check build logs:
```bash
eas build:view [BUILD_ID]
```

Common issues:
- Missing dependencies
- Gradle configuration error
- Out of memory

**Solution**: Check logs and fix errors in code

### "Build timed out"

**Solution**: Try again, sometimes cloud is slow

### "Authentication error"

```bash
eas logout
eas login
```

---

## ✅ Build Checklist

Before building:

- [ ] All code committed to git
- [ ] `eas.json` configured
- [ ] `app.json` has correct package name and version
- [ ] `.env` not committed (secrets safe)
- [ ] Logged into EAS CLI
- [ ] Ready to wait 10-20 minutes

---

## 📱 Testing the Build

### APK (Preview Build):

```bash
# After build completes, download APK
# Install on Android device:
adb install app-preview.apk

# Or drag and drop onto emulator
```

### AAB (Production Build):

1. Upload to Google Play Console
2. Create Internal Testing track
3. Add yourself as tester
4. Install via Play Store link

---

## 🔄 Build Workflow

```
Code Changes
    ↓
Commit to Git
    ↓
eas build (cloud builds)
    ↓
Download APK/AAB
    ↓
Test
    ↓
Deploy to Google Play
```

---

## Next Steps

After successful build:

1. **Download AAB** from build dashboard
2. **Test APK** on physical device
3. **Upload to Google Play Console** (Internal Testing first)
4. **Proceed to Step 5**: Test on production environment

---

## 📚 Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Dashboard](https://expo.dev/accounts/YOUR_USERNAME/projects)
- [Expo Forums](https://forums.expo.dev/)
