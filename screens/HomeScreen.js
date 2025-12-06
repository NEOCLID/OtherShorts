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
    
    const [submittedRatings, setSubmittedRatings] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(null);

    const seenUsersRef = useRef(new Set());
    const isFetchingRef = useRef(false);
    const currentIndexRef = useRef(0);
    const BATCH_TARGET = 5;
    const MAX_BATCH_REQUESTS = 3;

    // This function is responsible for loading more videos from the server.
    const loadVideos = useCallback(async (retryWithReset = false) => {
        if (!user?.id || isFetchingRef.current) return;

        isFetchingRef.current = true;
        setIsFetchingMore(true);
        try {
            if (retryWithReset) {
                seenUsersRef.current.clear();
            }

            const collected = [];
            const collectedUrls = new Set();
            let attempts = 0;

            while (collected.length < BATCH_TARGET && attempts < MAX_BATCH_REQUESTS) {
                const seenUsers = Array.from(seenUsersRef.current);
                const submitted = Array.from(submittedRatings);
                const data = await fetchBatch(user.id, seenUsers, submitted);
                attempts += 1;

                if (data?.videos?.length > 0) {
                    const uploaderId = data.videos[0]?.uploaderId;
                    if (uploaderId) {
                        seenUsersRef.current.add(uploaderId);
                    }

                    const uniques = data.videos.filter(v => {
                        if (collectedUrls.has(v.url)) return false;
                        collectedUrls.add(v.url);
                        return true;
                    });
                    collected.push(...uniques);
                    // If the uploader has fewer than 5 videos, grab the next uploader immediately
                    if (uniques.length < BATCH_TARGET) {
                        continue;
                    }
                } else if (!retryWithReset && seenUsersRef.current.size > 0) {
                    console.log("No videos found, resetting seen users and retrying...");
                    seenUsersRef.current.clear();
                    retryWithReset = true;
                } else {
                    if (videos.length === 0 && collected.length === 0) {
                        setError("home.errorNoVideos");
                    }
                    break;
                }
            }

            if (collected.length > 0) {
                setVideos(prev => {
                    const existingUrls = new Set(prev.map(v => v.url));
                    const newVideos = collected.filter(v => !existingUrls.has(v.url));
                    return [...prev, ...newVideos];
                });
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
    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length === 0) {
            setCurrentIndex(-1); // Nothing visible, pause everything
            return;
        }
        const sorted = [...viewableItems].sort((a, b) => a.index - b.index);
        const nextIndex = Math.max(sorted[0].index, 0);
        setCurrentIndex(nextIndex);
    }).current;

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

    const handleScroll = useCallback(({ nativeEvent }) => {
        const offsetY = nativeEvent.contentOffset?.y || 0;
        const newIndex = Math.max(Math.round(offsetY / screenHeight), 0);
        if (newIndex !== currentIndexRef.current) {
            setCurrentIndex(newIndex);
        }
    }, []);

    const handleMomentumScrollEnd = useCallback(({ nativeEvent }) => {
        const newIndex = Math.round(nativeEvent.contentOffset.y / screenHeight);
        setCurrentIndex(Math.max(newIndex, 0));
    }, []);

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
    }, [user?.id, submittedRatings]);

    const handleVideoUnavailable = useCallback((url) => {
        setVideos(prevVideos => prevVideos.filter(video => video.url !== url));
    }, []);

    // This function tells the FlatList how to render each video.
    const renderItem = useCallback(({ item, index }) => (
        <VideoCell
            item={item}
            isCurrent={index === currentIndex}
            isPaused={isPaused}
            isSubmitted={submittedRatings.has(item.url)}
            isSubmitting={isSubmitting === item.url}
            onSubmit={handleRatingSubmit}
            onVideoUnavailable={handleVideoUnavailable}
        />
    ), [currentIndex, isPaused, submittedRatings, isSubmitting, handleRatingSubmit, handleVideoUnavailable]);

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
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    pagingEnabled
                    snapToInterval={screenHeight}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    disableIntervalMomentum
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    onEndReached={loadVideos}
                    onEndReachedThreshold={3}
                    removeClippedSubviews
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
