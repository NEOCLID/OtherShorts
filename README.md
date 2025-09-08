# OtherShorts

OtherShorts is a mobile application built with React Native and Expo that appears to be a client or viewer for YouTube Shorts and other video content, with additional features for user profiles, ratings, and watch history analysis.

## Features

- **Video Feed:** Browse and watch short-form videos.
- **User Authentication:** Sign in to a personal account.
- **Profile Management:** Set up and manage your user profile.
- **Video Interaction:** View comments and ratings for videos.
- **Watch History:** Upload and analyze your YouTube Takeout history.
- **Word Cloud:** Visualize your watch history as a word cloud.

## Tech Stack

- **Frontend:** React Native, Expo
- **Backend (assumed):** Node.js, Express, PostgreSQL
- **Navigation:** React Navigation
- **API Communication:** Fetch API

## Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- Expo Go app on your mobile device (for development) or a configured Android/iOS emulator.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/othershortsapp.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd othershortsapp
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

## Running the Application

To start the development server, run:

```bash
npm start
```

This will open the Metro Bundler. You can then run the app:

-   On an Android emulator/device by selecting "Run on Android device/emulator".
-   On an iOS simulator/device by selecting "Run on iOS simulator".
-   In a web browser by selecting "Run in web browser".

## Configuration

The application connects to a backend API. The API endpoint is configured in `config.js`. For development, it's set to `http://localhost:3000`. Ensure your local backend server is running and accessible at this address.
