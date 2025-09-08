// screens/SettingsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Linking, Alert } from 'react-native';

export default function SettingsScreen() {
  const [autoplay, setAutoplay] = useState(true);

  const handleFeedback = () => {
    Linking.openURL('mailto:injaerim43@gmail.com?subject=Feedback for OtherShorts');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.setting}>
        <Text style={styles.settingText}>Autoplay Videos</Text>
        <Switch value={autoplay} onValueChange={setAutoplay} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={autoplay ? "#f5dd4b" : "#f4f3f4"} />
      </View>

      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>Contact Us</Text>
        <Text style={styles.contactText}>Have questions or feedback? We'd love to hear from you.</Text>
        <TouchableOpacity style={styles.feedbackButton} onPress={handleFeedback}>
          <Text style={styles.feedbackButtonText}>Send Feedback</Text>
        </TouchableOpacity>
        <Text style={styles.contactText}>You can also open an issue on our GitHub repository.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 40, marginTop: 40 },
  setting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '90%', padding: 15, backgroundColor: 'white', borderRadius: 10, marginBottom: 40 },
  settingText: { fontSize: 18 },
  contactSection: { width: '90%', padding: 20, backgroundColor: 'white', borderRadius: 10 },
  contactTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  contactText: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#555' },
  feedbackButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  feedbackButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});