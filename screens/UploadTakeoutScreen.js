// screens/UploadTakeoutScreen.js
import React, { useState } from 'react';
import { View, Button, Text, Alert, Platform, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { API_IP } from '../config';
import { useNavigation, useRoute } from '@react-navigation/native';

const isWeb = Platform.OS === 'web';

export default function UploadTakeoutScreen() {
  const navigation = useNavigation();
  const { params: { userId } } = useRoute();
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
        if (result.canceled || !result.assets || result.assets.length === 0) return;
        
        const file = result.assets[0];
        setFileName(file.name);
        setIsUploading(true);

        const formData = new FormData();
        const fileData = isWeb ? file.file : { uri: file.uri, name: file.name, type: file.mimeType };
        formData.append('file', fileData);
        formData.append('userId', userId);

        const res = await fetch(`${API_IP}/api/uploadTakeout`, { method: 'POST', body: formData });
        const resBody = await res.json().catch(() => null);

        if (res.ok) {
            Alert.alert('✅ Upload Success', 'Your shorts have been added to the pool.');
            navigation.replace('MainApp');
        } else {
            const errorMessage = resBody?.error || 'Upload failed. The file might be invalid or empty.';
            Alert.alert('❌ Upload Failed', errorMessage);
        }
    } catch (err) {
        console.error("Upload error:", err);
        Alert.alert('❌ Error', 'An unexpected error occurred during upload.');
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Add Your Shorts</Text>
        <Text style={styles.subtitle}>Upload your 'watch-history.json' file to share your shorts.</Text>
        <View style={styles.buttonContainer}>
            <Button title={isUploading ? "Uploading..." : "Upload Takeout File"} onPress={handleUpload} disabled={isUploading} />
            {fileName ? <Text style={styles.fileNameText}>Selected: {fileName}</Text> : null}
        </View>
        <View style={styles.buttonContainer}>
            <Button title="Skip For Now" onPress={() => navigation.replace('MainApp')} color="#888" disabled={isUploading}/>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40, color: '#555' },
    buttonContainer: { width: '80%', marginVertical: 10 },
    fileNameText: { textAlign: 'center', marginTop: 10, color: 'green' }
});