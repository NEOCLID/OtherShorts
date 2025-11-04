// screens/SignInScreen.js
import React, { useEffect, useContext, useState } from 'react';
import { Button, StyleSheet, Text, View, Image, Platform, ActivityIndicator } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../UserContext';
import { retrieveUser, storeUser } from '../server/storage';
import { API_IP, GOOGLE_CLIENT_IDS } from '../config';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
    const navigation = useNavigation();
    const { setUser } = useContext(UserContext);
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSavedUser = async () => {
            try {
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
            } catch (error) {
                console.error("Error in checkSavedUser:", error);
                setIsLoading(false);
            }
        };
        checkSavedUser();
    }, []);
    
    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: GOOGLE_CLIENT_IDS.expoClientId,
        webClientId: GOOGLE_CLIENT_IDS.webClientId,
        androidClientId: GOOGLE_CLIENT_IDS.androidClientId,
        scopes: ['profile', 'email'],
        redirectUri: makeRedirectUri({ useProxy: true }),
        // Force account selection, especially important for web
        prompt: Platform.OS === 'web' ? 'select_account' : 'consent',
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
            <Text style={styles.title}>{t('signIn.title')}</Text>
            <Button title={t('signIn.signInButton')} disabled={!request} onPress={() => { setIsLoading(true); promptAsync(); }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    logo: { width: 120, height: 120, marginBottom: 20 },
    title: { fontSize: 24, marginBottom: 40 },
});