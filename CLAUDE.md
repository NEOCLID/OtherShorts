# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OtherShorts is a React Native mobile app (built with Expo) that allows users to watch YouTube Shorts from other users' watch histories and rate both the videos and the political orientation of the content. The app includes a Node.js/Express backend with PostgreSQL for user management, video tracking, and rating collection.

## Development Commands

### Frontend (React Native/Expo)
- **Start dev server**: `npm start`
- **Run on Android**: `npm run android` (requires Android emulator or device)
- **Run on iOS**: `npm run ios` (requires macOS and iOS simulator)
- **Run on Web**: `npm run web`

### Backend (Node.js/Express)
- **Start server**: `npm run start:server` (runs on port 3000 by default)
- **Server location**: `server/server.js`

### Android Build
- **Debug build**: `cd android && ./gradlew assembleDebug`
- **Release build**: `cd android && ./gradlew assembleRelease`
- **Release AAB**: `cd android && ./gradlew bundleRelease`
- Android build outputs are in `android/app/build/outputs/`

## Architecture

### Client-Server Communication

The app uses a dynamic API endpoint configuration (`config.js`):
- **Development (mobile)**: `http://192.168.0.16:3000` (local network IP)
- **Development (web)**: `http://localhost:3000`
- **Production**: `https://othershorts.com`

All API calls go through `server/serverApi.js` which provides typed functions for:
- `fetchBatch()` - Get video batches from other users
- `submitRating()` - Submit ratings for videos
- `fetchCountries()` - Get country list
- `updateUserProfile()` - Update user demographics
- `uploadTakeout()` - Process YouTube Takeout watch history

### Navigation Flow

The app uses React Navigation with a nested structure:
1. **Stack Navigator** (root):
   - SignInScreen (Google OAuth)
   - ProfileSetupScreen (age, gender, country)
   - UploadTakeoutScreen (YouTube watch history upload)
   - MainApp (bottom tab navigator)

2. **Bottom Tab Navigator** (MainApp):
   - Settings
   - Home (default, main feed)
   - Profile

### User Authentication & State

- Google OAuth is implemented via `expo-auth-session`
- User state is managed through `UserContext` (React Context)
- Google IDs are hashed (SHA-256) before storage: `google_hash` is used as the user ID throughout the app
- Raw Google IDs (`google_raw_id`) are stored separately and never exposed to clients

### Video Feed Architecture

The core feature is in `screens/HomeScreen.js`:
- Uses FlatList with pagination for smooth scrolling
- Videos are fetched in batches of ~5 videos per user
- Implements "seen users" tracking to avoid showing the same uploader twice
- Videos auto-play when visible (viewability threshold: 50%)
- Tap gesture to pause/play
- Tracks submitted ratings to prevent duplicate submissions

**Video Component Hierarchy**:
- `VideoCell` - Container managing state for a single video slot
- `VideoCard` - Video player (YouTube iframe wrapper)
- `VideoUI` - Rating slider and submission controls

### Backend API Structure

The Express server (`server/server.js`) provides:

1. **User Management**:
   - `POST /api/users` - Create user (with Google ID hashing)
   - `GET /api/users/:id` - Get user profile
   - `PUT /api/users/:id` - Update user demographics

2. **Video Feed**:
   - `GET /api/batch/:userId?seen=...&submitted=...` - Get batch of videos
     - Excludes the requesting user's videos
     - Excludes previously seen uploaders
     - Excludes already submitted videos
     - Returns 5 videos from one random user with demographics

3. **Ratings**:
   - `POST /api/ratings` - Submit rating (includes content rating + political orientation)

4. **Takeout Processing**:
   - `POST /api/uploadTakeout` - Parse YouTube Takeout JSON
     - Validates video durations using YouTube Data API v3
     - Only stores videos < 61 seconds (Shorts)
     - Processes in batches of 50 to respect API quotas

### Database Schema

PostgreSQL tables (`database/schema.sql`):
- **users**: Stores hashed Google IDs, demographics (age, gender, country_id)
- **videos**: Stores YouTube Short URLs linked to user_id
- **ratings**: Stores ratings with target_user_id, reviewer_id, rating (0-100), political (0-100)
- **countries**: Reference table for country data

**Note**: `user_id`, `target_user_id`, and `reviewer_id` are TEXT fields containing the SHA-256 hash of Google IDs, not actual foreign keys. This is by design for the current implementation.

## Environment Configuration

The app requires a `.env` file in the root directory with:
```
# Google OAuth
EXPO_PUBLIC_EXPO_CLIENT_ID=...
EXPO_PUBLIC_WEB_CLIENT_ID=...
EXPO_PUBLIC_ANDROID_CLIENT_ID=...

# Database
DB_USER=...
DB_HOST=...
DB_NAME=...
DB_PASSWORD=...
DB_PORT=5432

# YouTube API
YOUTUBE_API_KEY=...
```

## Android Release Configuration

Release builds are configured with:
- Keystore file: Referenced in `android/app/build.gradle`
- Credentials stored in `android/gradle.properties` (gitignored)
- Properties: `MYAPP_UPLOAD_STORE_FILE`, `MYAPP_UPLOAD_KEY_ALIAS`, `MYAPP_UPLOAD_STORE_PASSWORD`, `MYAPP_UPLOAD_KEY_PASSWORD`
- ProGuard enabled for release builds
- Current version: 1.0.2 (versionCode 3)

## Key Technical Details

- **React Native Architecture**: New Architecture enabled (`newArchEnabled=true`)
- **JS Engine**: Hermes is enabled
- **Gesture Handling**: Uses `react-native-gesture-handler` for tap gestures
- **Video Player**: `react-native-youtube-iframe` for YouTube playback
- **Security**: Google IDs are hashed with SHA-256 before storage to protect user identity
- **API Rate Limiting**: YouTube API calls are batched (50 videos per request) to respect quotas

## Common Patterns

### Adding a new API endpoint:
1. Add route handler in `server/server.js`
2. Add corresponding function in `server/serverApi.js`
3. Use the function in the appropriate screen/component

### Adding a new screen:
1. Create screen file in `screens/`
2. Import and add to Stack or Tab navigator in `App.js`
3. Use `UserContext` to access authenticated user data

### Modifying the video feed:
- Main logic is in `screens/HomeScreen.js`
- Video batching algorithm is in `server/server.js` (`GET /api/batch/:userId`)
- Video rendering is in `components/VideoCell.js`, `VideoCard.js`, `VideoUI.js`
