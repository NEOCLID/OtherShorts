import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../UserContext';
import { fetchCountries, updateUserProfile } from '../server/serverApi';

const isWeb = Platform.OS === 'web';

const storeUser = async (user) => {
  if (!user) return; // Don't store null/undefined
  const userString = JSON.stringify(user);
  if (isWeb) {
    localStorage.setItem('user', userString);
  } else {
    await AsyncStorage.setItem('user', userString);
  }
};

const SegmentedControl = ({ options, selectedOption, onSelectOption }) => (
    <View style={styles.segmentedControlContainer}>
        {options.map(option => (
            <TouchableOpacity
                key={option}
                style={[
                    styles.segmentedButton,
                    selectedOption === option && styles.segmentedButtonActive
                ]}
                onPress={() => onSelectOption(option)}
            >
                <Text style={[
                    styles.segmentedButtonText,
                    selectedOption === option && styles.segmentedButtonTextActive
                ]}>
                    {option}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
);

export default function ProfileSetupScreen() {
    const navigation = useNavigation();
    const { user, setUser } = useContext(UserContext);
    const { t } = useTranslation();

    const [age, setAge] = useState(user?.age ? String(user.age) : '');
    const [gender, setGender] = useState(user?.gender || 'Male'); // Store English value in DB
    const [countryId, setCountryId] = useState(user?.country_id);

    // Map between display labels and database values
    const genderOptions = [
        { label: t('profileSetup.male'), value: 'Male' },
        { label: t('profileSetup.female'), value: 'Female' },
        { label: t('profileSetup.other'), value: 'Other' }
    ];
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [countries, setCountries] = useState([]);

    useEffect(() => {
        setLoading(true);
        fetchCountries().then(list => {
            setCountries(list);
            if (countryId === undefined && list.length > 0) setCountryId(list[0].id);
        }).catch(err => setError(t('profileSetup.loadError'))).finally(()=> setLoading(false));
    }, [t]);

    const handleSave = async () => {
        const ageNum = parseInt(age, 10);
        if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
            setError(t('profileSetup.ageError'));
            return;
        }
        if (!countryId) {
            setError(t('profileSetup.countryError'));
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const updatedUser = await updateUserProfile({ id: user.id, age: ageNum, gender, countryId });
            setUser(updatedUser);
            await storeUser(updatedUser);
            // Navigate to Takeout upload screen as per spec, passing the user ID
            navigation.replace('UploadTakeout', { userId: updatedUser.id });
        } catch (e) {
            setError(t('profileSetup.saveError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.innerContainer}>
                    <Text style={styles.title}>{t('profileSetup.title')}</Text>
                    <Text style={styles.guidanceText}>
                        {t('profileSetup.guidanceText')}
                    </Text>

                    {error && <Text style={styles.errorText}>{error}</Text>}

                    <Text style={styles.label}>{t('profileSetup.age')}</Text>
                    <TextInput
                        style={styles.input}
                        value={age}
                        onChangeText={setAge}
                        keyboardType="number-pad"
                        placeholder={t('profileSetup.agePlaceholder')}
                    />

                    <Text style={styles.label}>{t('profileSetup.gender')}</Text>
                    <SegmentedControl
                        options={genderOptions.map(g => g.label)}
                        selectedOption={genderOptions.find(g => g.value === gender)?.label || genderOptions[0].label}
                        onSelectOption={(label) => {
                            const selected = genderOptions.find(g => g.label === label);
                            if (selected) setGender(selected.value);
                        }}
                    />

                    <Text style={styles.label}>{t('profileSetup.country')}</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={countryId}
                            onValueChange={(itemValue) => setCountryId(itemValue)}
                            enabled={!loading && countries.length > 0}
                        >
                            {countries.map(c => <Picker.Item key={c.id} label={c.name} value={c.id} />)}
                        </Picker>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{t('profileSetup.saveButton')}</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollContainer: { flexGrow: 1, justifyContent: 'center' },
    innerContainer: { padding: 24 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#111' },
    guidanceText: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 30,
        color: '#666',
        lineHeight: 22,
    },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 20,
        justifyContent: 'center',
    },
    segmentedControlContainer: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 20,
    },
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
    },
    segmentedButtonTextActive: {
        color: '#fff',
    },
    button: {
        backgroundColor: '#FF0000',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    errorText: {
        color: 'red',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
});