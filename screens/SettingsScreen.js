// screens/SettingsScreen.js
import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Linking, Alert, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../UserContext';
import { clearUser, storeUser } from '../server/storage';
import { fetchCountries, updateUserProfile } from '../server/serverApi';

export default function SettingsScreen() {
  const [autoplay, setAutoplay] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [countryId, setCountryId] = useState(null);
  const [countries, setCountries] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);
  const { t, i18n } = useTranslation();

  // Map between display labels and database values
  const genderOptions = [
    { label: t('profileSetup.male'), value: 'Male' },
    { label: t('profileSetup.female'), value: 'Female' },
    { label: t('profileSetup.other'), value: 'Other' }
  ];

  useEffect(() => {
    if (user) {
      setAge(user.age ? String(user.age) : '');
      setGender(user.gender || 'Male');
      setCountryId(user.country_id);
    }
    fetchCountries().then(setCountries).catch(err => console.error('Failed to load countries:', err));
  }, [user]);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const handleSaveProfile = async () => {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
      Alert.alert(t('common.error'), t('profileSetup.ageError'));
      return;
    }
    if (!countryId) {
      Alert.alert(t('common.error'), t('profileSetup.countryError'));
      return;
    }
    setIsSaving(true);
    try {
      const updatedUser = await updateUserProfile({ id: user.id, age: ageNum, gender, countryId });
      setUser(updatedUser);
      await storeUser(updatedUser);
      Alert.alert(t('common.ok'), t('settings.profileSaved'));
      setIsEditingProfile(false);
    } catch (e) {
      Alert.alert(t('common.error'), t('profileSetup.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeedback = () => {
    Linking.openURL('mailto:injaerim43@gmail.com?subject=Feedback for OtherShorts');
  };

  const handleLogout = async () => {
    Alert.alert(
      t('settings.signOut'),
      t('settings.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clearUser();
              setUser(null);
              navigation.reset({
                index: 0,
                routes: [{ name: 'SignIn' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(t('common.error'), 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('settings.title')}</Text>

        <View style={styles.setting}>
          <Text style={styles.settingText}>{t('settings.language')}</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[styles.langButton, i18n.language === 'ko' && styles.langButtonActive]}
              onPress={() => changeLanguage('ko')}
            >
              <Text style={[styles.langButtonText, i18n.language === 'ko' && styles.langButtonTextActive]}>
                {t('settings.korean')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langButton, i18n.language === 'en' && styles.langButtonActive]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={[styles.langButtonText, i18n.language === 'en' && styles.langButtonTextActive]}>
                {t('settings.english')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingText}>{t('settings.autoplayVideos')}</Text>
          <Switch value={autoplay} onValueChange={setAutoplay} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={autoplay ? "#f5dd4b" : "#f4f3f4"} />
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Text style={styles.sectionTitle}>{t('settings.profile')}</Text>
            <TouchableOpacity onPress={() => setIsEditingProfile(!isEditingProfile)}>
              <Text style={styles.editButton}>{isEditingProfile ? t('common.cancel') : t('settings.editProfile')}</Text>
            </TouchableOpacity>
          </View>

          {isEditingProfile ? (
            <View style={styles.profileEdit}>
              <Text style={styles.label}>{t('settings.age')}</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                placeholder={t('profileSetup.agePlaceholder')}
              />

              <Text style={styles.label}>{t('settings.gender')}</Text>
              <View style={styles.segmentedControl}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.segmentedButton, gender === option.value && styles.segmentedButtonActive]}
                    onPress={() => setGender(option.value)}
                  >
                    <Text style={[styles.segmentedButtonText, gender === option.value && styles.segmentedButtonTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{t('settings.country')}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={countryId}
                  onValueChange={setCountryId}
                  enabled={countries.length > 0}
                >
                  {countries.map(c => <Picker.Item key={c.id} label={c.name} value={c.id} />)}
                </Picker>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>{t('settings.saveProfile')}</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.profileDisplay}>
              <Text style={styles.profileText}>{t('settings.age')}: {user?.age || t('profile.notAvailable')}</Text>
              <Text style={styles.profileText}>{t('settings.gender')}: {user?.gender || t('profile.notAvailable')}</Text>
              <Text style={styles.profileText}>{t('settings.country')}: {countries.find(c => c.id === user?.country_id)?.name || t('profile.notAvailable')}</Text>
            </View>
          )}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>{t('settings.contactUs')}</Text>
          <Text style={styles.contactText}>{t('settings.contactDescription')}</Text>
          <TouchableOpacity style={styles.feedbackButton} onPress={handleFeedback}>
            <Text style={styles.feedbackButtonText}>{t('settings.sendFeedback')}</Text>
          </TouchableOpacity>
          <Text style={styles.contactText}>{t('settings.githubIssue')}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t('settings.signOut')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, padding: 20, alignItems: 'center', paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 40, marginTop: 40 },
  setting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '90%', padding: 15, backgroundColor: 'white', borderRadius: 10, marginBottom: 20 },
  settingText: { fontSize: 18 },
  languageButtons: { flexDirection: 'row', gap: 10 },
  langButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  langButtonActive: {
    backgroundColor: '#007AFF',
  },
  langButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  langButtonTextActive: {
    color: '#fff',
  },
  profileSection: { width: '90%', padding: 20, backgroundColor: 'white', borderRadius: 10, marginBottom: 20 },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  editButton: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  profileDisplay: { gap: 8 },
  profileText: { fontSize: 16, color: '#333' },
  profileEdit: { gap: 10 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 8 },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  segmentedControl: { flexDirection: 'row', width: '100%' },
  segmentedButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  segmentedButtonActive: {
    backgroundColor: '#007AFF',
  },
  segmentedButtonText: {
    textAlign: 'center',
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  segmentedButtonTextActive: {
    color: '#fff',
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  contactSection: { width: '90%', padding: 20, backgroundColor: 'white', borderRadius: 10, marginBottom: 20 },
  contactTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  contactText: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#555' },
  feedbackButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  feedbackButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutButton: { width: '90%', backgroundColor: '#FF3B30', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  logoutButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});