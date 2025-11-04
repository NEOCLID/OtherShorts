// screens/HomeScreen.js
// This is the main screen of the app, where users can watch and rate videos.
import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { View, Dimensions, Text, StyleSheet, ActivityIndicator, FlatList, LogBox } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import VideoCell from '../components/VideoCell';
import { UserContext } from '../UserContext';
import { fetchBatch, submitRating } from '../server/serverApi';

// This is just to ignore a specific warning that's not critical.
LogBox.ignoreLogs([
  'Warning: findDOMNode is deprecated',
]);

const { height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
    const { user } = useContext(UserContext);
    const { t } = useTranslation();
    const [videos, setVideos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [error, setError] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    
    const [videoRatings, setVideoRatings] = useState({});
    const [submittedRatings, setSubmittedRatings] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(null);

    const seenUsersRef = useRef(new Set());
    const isFetchingRef = useRef(false);

    // This function is responsible for loading more videos from the server.
    const loadVideos = useCallback(async (retryWithReset = false) => {
        if (!user?.id || isFetchingRef.current) return;

        isFetchingRef.current = true;
        setIsFetchingMore(true);
        try {
            // If retrying, clear the seen users to allow cycling back
            const seenUsers = retryWithReset ? [] : Array.from(seenUsersRef.current);

            const data = await fetchBatch(user.id, seenUsers, Array.from(submittedRatings));
            if (data?.videos?.length > 0) {
                // If we reset and found videos, clear the seen users set
                if (retryWithReset) {
                    seenUsersRef.current.clear();
                }
                seenUsersRef.current.add(data.videos[0].uploaderId);
                setVideos(prev => {
                    const existingUrls = new Set(prev.map(v => v.url));
                    const newVideos = data.videos.filter(v => !existingUrls.has(v.url));
                    return [...prev, ...newVideos];
                });
            } else {
                // No videos found - try resetting seen users if we haven't already
                if (!retryWithReset && seenUsersRef.current.size > 0) {
                    console.log("No videos found, resetting seen users and retrying...");
                    isFetchingRef.current = false;
                    await loadVideos(true);
                    return;
                } else if (videos.length === 0) {
                    setError("home.errorNoVideos");
                }
            }
        } catch (err) {
            console.error("Failed to load videos:", err);
            setError("home.errorFetch");
        } finally {
            isFetchingRef.current = false;
            setIsFetchingMore(false);
            if (isLoading) setIsLoading(false);
        }
    }, [user?.id, isLoading, videos.length, submittedRatings]);

    // We load the initial set of videos when the component mounts.
    useEffect(() => {
        if (user?.id && videos.length === 0) {
            loadVideos();
        }
    }, [user?.id, videos.length, loadVideos, submittedRatings]);

    // A simple tap on the screen will pause or unpause the video.
    const tapGesture = Gesture.Tap().onEnd(() => setIsPaused(prev => !prev));
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    // This function sends the user's rating to the server.
    const handleRatingSubmit = useCallback(async (video, { rating, political }) => {
        if (!user?.id || !video?.uploaderId || submittedRatings.has(video.url) || political === null) {
            return;
        }
        setIsSubmitting(video.url);
        try {
            // The rating and political values now come directly from the UI, not from state
            await submitRating({ userId: video.uploaderId, reviewerId: user.id, rating, political });
            setSubmittedRatings(prev => new Set(prev).add(video.url));
        } catch (err) {
            console.error("Rating submission failed in HomeScreen:", err);
        } finally {
            setIsSubmitting(null);
        }
    }, [user?.id, submittedRatings]); // Dependency on videoRatings is removed
    
    // When the user is done sliding, we update the rating value.
    const handleSlidingComplete = useCallback((url, value) => {
        setVideoRatings(prev => ({ ...prev, [url]: value }));
    }, []);

    const handleVideoUnavailable = useCallback((url) => {
        setVideos(prevVideos => prevVideos.filter(video => video.url !== url));
    }, []);

    // This function tells the FlatList how to render each video.
    const renderItem = useCallback(({ item, index }) => (
        <VideoCell
            item={item}
            isCurrent={index === currentIndex}
            isPaused={isPaused}
            ratingValue={videoRatings[item.url] ?? 50}
            isSubmitted={submittedRatings.has(item.url)}
            isSubmitting={isSubmitting === item.url}
            onSlidingComplete={handleSlidingComplete}
            onSubmit={handleRatingSubmit}
            onVideoUnavailable={handleVideoUnavailable}
        />
    ), [currentIndex, isPaused, videoRatings, submittedRatings, isSubmitting, handleSlidingComplete, handleRatingSubmit]);

    if (isLoading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#FF0000" /></View>;
    if (error) return <View style={styles.centerContainer}><Text style={styles.errorText}>{t(error)}</Text></View>;

    return (
        <GestureDetector gesture={tapGesture}>
            <View style={styles.container}>
                <FlatList
                    data={videos}
                    renderItem={renderItem}
                    keyExtractor={(item, i) => `${item.url}-${i}`}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    pagingEnabled
                    onEndReached={loadVideos}
                    onEndReachedThreshold={3}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={isFetchingMore ? <ActivityIndicator style={{ margin: 20 }} color="#FFF" /> : null}
                    windowSize={5}
                    initialNumToRender={2}
                    maxToRenderPerBatch={3}
                />
            </View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
    errorText: { color: 'white', fontSize: 18, textAlign: 'center', padding: 20 },
});