// screens/SignInScreen.js
import React, { useEffect, useContext, useState } from 'react';
import { Button, StyleSheet, Text, View, Image, Platform, ActivityIndicator } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../UserContext';
import { retrieveUser, storeUser } from '../server/storage'; 
import { API_IP } from '../config';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
    const navigation = useNavigation();
    const { setUser } = useContext(UserContext);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSavedUser = async () => {
            const savedUser = await retrieveUser();
            if (savedUser) {
                setUser(savedUser);
                const needsProfile = savedUser.age == null || savedUser.gender == null || savedUser.country_id == null;
                if (needsProfile) {
                    navigation.replace('ProfileSetup');
                } else {
                    // FIX: Navigate to the tab container
                    navigation.replace('MainApp');
                }
            } else {
                setIsLoading(false);
            }
        };
        checkSavedUser();
    }, []);
    
    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: '140681675069-noq0r6udh39lnmijqp3evje0c4cocm3m.apps.googleusercontent.com',
        webClientId: '140681675069-g7rlgiqs9tfjktbsqfd9nabd8oqbcl6f.apps.googleusercontent.com',
        androidClientId: '140681675069-ka222qfd442ccfd254e628dociefo87g.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        redirectUri: makeRedirectUri({ useProxy: true }),
    });

    useEffect(() => {
        if (response?.type === 'success') {
            setIsLoading(true);
            fetchUserInfo(response.authentication.accessToken);
        } else if (response?.type === 'error' || response?.type === 'cancel') {
            setIsLoading(false);
        }
    }, [response]);

    const fetchUserInfo = async (token) => {
        try {
            const googleResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', { headers: { Authorization: `Bearer ${token}` } });
            const googleUser = await googleResponse.json();
            if (!googleUser?.id) throw new Error("Failed to get Google user info.");

            const backendResponse = await fetch(`${API_IP}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ googleId: googleUser.id })
            });
            if (!backendResponse.ok) throw new Error(await backendResponse.text());

            const appUser = await backendResponse.json();
            await storeUser(appUser);
            setUser(appUser);

            const needsProfile = appUser.age == null || appUser.gender == null || appUser.country_id == null;
            if (needsProfile) {
                navigation.replace('ProfileSetup');
            } else {
                // FIX: Navigate to the tab container
                navigation.replace('MainApp'); 
            }
        } catch (err) { 
            console.error('fetchUserInfo ERROR:', err); 
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <View style={styles.container}><ActivityIndicator size="large" /></View>;
    }

    return (
        <View style={styles.container}>
            <Image source={require('../assets/youtube_logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>OtherShorts</Text>
            <Button title="Sign in with Google" disabled={!request} onPress={() => { setIsLoading(true); promptAsync(); }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    logo: { width: 120, height: 120, marginBottom: 20 },
    title: { fontSize: 24, marginBottom: 40 },
});