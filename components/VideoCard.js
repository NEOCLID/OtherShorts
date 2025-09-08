// components/VideoCard.js
// This component is all about displaying the YouTube video. It handles both web and native platforms.
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Text, Platform, AppState } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { useIsFocused } from '@react-navigation/native';

// A little helper function to pull the video ID from a YouTube URL.
const getYoutubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/w\/|embed\/|watch\?v=|&v=|\/shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const VideoCard = React.memo(({ videoUrl, isCurrent, isPaused, onVideoUnavailable }) => {
  const isFocused = useIsFocused();
  const videoId = getYoutubeVideoId(videoUrl);
  
  // We need to know if the app is active or in the background.
  const appState = useRef(AppState.currentState);
  const [appStateStatus, setAppStateStatus] = useState(appState.current);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
      setAppStateStatus(appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // The video should only play if it's the current one, not paused, the screen is focused, AND the app is active.
  const shouldPlay = isCurrent && !isPaused && isFocused && appStateStatus === 'active';

  if (!videoId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid Video URL</Text>
      </View>
    );
  }

  // NATIVE (iOS/Android)
  // On mobile, we use the 'react-native-youtube-iframe' library.
  if (Platform.OS !== 'web') {
    const playerRef = useRef(null);
    const onStateChange = useCallback((state) => {
      // When the video ends, we can seek it back to the beginning.
      if (state === 'ended') {
        playerRef.current?.seekTo(0, true);
      }
    }, []);

    return (
      <View style={styles.container}>
        <YoutubeIframe
          ref={playerRef}
          height={StyleSheet.absoluteFill.height}
          width={StyleSheet.absoluteFill.width}
          videoId={videoId}
          play={shouldPlay}
          onChangeState={onStateChange}
          onError={(e) => {
            if (e.error === 'player_error' && e.reason === 'Video unavailable') {
              onVideoUnavailable(videoUrl);
            }
          }}
          initialPlayerParams={{ controls: 0, modestbranding: 1, rel: 0, loop: 1, playlist: videoId }}
          mute={false}
        />
        {/* A little pause icon so you know what's up. */}
        {isCurrent && isPaused && (
           <View style={styles.pauseOverlay}>
             <Text style={styles.pauseText}>⏸️</Text>
           </View>
        )}
      </View>
    );
  }

  // WEB
  // On the web, we use a standard iframe and control it with postMessage.
  const playerRef = useRef(null);

  useEffect(() => {
    if (playerRef.current) {
      const command = shouldPlay ? 'playVideo' : 'pauseVideo';
      playerRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: '' }), '*');
    }
  }, [shouldPlay]);
  
  // Add `enablejsapi=1` to the iframe source to allow controlling it with JavaScript.
  const iframeSource = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&mute=0&controls=0&rel=0&showinfo=0&modestbranding=1&loop=1&playlist=${videoId}`;

  return (
    <View style={styles.container}>
      <iframe
        ref={playerRef}
        key={videoUrl} // The key should not change, so the iframe doesn't get re-created.
        src={iframeSource}
        title="YouTube video player"
        frameBorder="0"
        allow="autoplay; encrypted-media; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        style={{ width: '100%', height: '100%' }}
      />
       {isCurrent && isPaused && (
           <View style={styles.pauseOverlay}>
             <Text style={styles.pauseText}>⏸️</Text>
           </View>
        )}
    </View>
  );
});''

export default VideoCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { color: 'white', fontSize: 18 },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseText: {
    fontSize: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});