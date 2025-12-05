// components/VideoCell.js
// This component is like a container for a single video post. It holds the video player and the UI for rating.
import React, { useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import VideoCard from './VideoCard';
import VideoUI from './VideoUI';

const { height: screenHeight } = Dimensions.get('window');

const VideoCell = ({
  item,
  isCurrent,
  isPaused,
  isSubmitted,
  isSubmitting,
  onSubmit,
  onVideoUnavailable,
}) => {
  // We wrap this in useCallback to avoid re-creating the function on every render.
  const handleSubmit = useCallback((values) => {
    // Pass the values object containing { rating, political } directly
    onSubmit(item, values);
  }, [item, onSubmit]);

  return (
    <View style={styles.container}>
      <VideoCard
        videoUrl={item.url}
        isCurrent={isCurrent}
        isPaused={isPaused}
        onVideoUnavailable={onVideoUnavailable}
        uploaderAge={item.age}
        uploaderGender={item.gender}
        uploaderCountry={item.country}
      />
      <VideoUI
        videoUrl={item.url}
        onSubmit={handleSubmit}
        isSubmitted={isSubmitted}
        isSubmitting={isSubmitting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: screenHeight,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
});

// React.memo is a performance optimization. If the props haven't changed, it won't re-render.
export default React.memo(VideoCell);
