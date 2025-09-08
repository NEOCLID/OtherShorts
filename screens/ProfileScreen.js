// screens/ProfileScreen.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../UserContext';
import { clearUser } from '../storage'; 

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { user, setUser } = useContext(UserContext);

    const handleLogout = async () => {
        await clearUser();
        setUser(null);
        navigation.replace('SignIn');
    };

    return (
        <View style={styles.container}>
            {user ? (
                <View style={styles.profileSection}>
                    <Text style={styles.name}>User Profile</Text>
                    <Text style={styles.info}>Age: {user.age || 'N/A'}</Text>
                    <Text style={styles.info}>Gender: {user.gender || 'N/A'}</Text>
                </View>
            ) : null}
            
            <TouchableOpacity style={styles.button} onPress={() => user && navigation.navigate('UploadTakeout', { userId: user.id })} disabled={!user}>
                <Text style={styles.buttonText}>Upload Watch History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { backgroundColor: '#c0392b' }]} onPress={handleLogout}>
                <Text style={styles.buttonText}>Log Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' },
    profileSection: { alignItems: 'center', marginBottom: 30, padding: 20, backgroundColor: 'white', borderRadius: 10, width: '90%' },
    name: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    info: { fontSize: 16, color: '#333', marginBottom: 5 },
    button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginTop: 15, width: '90%', alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});