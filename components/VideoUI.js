// components/VideoUI.js
// This is where all the interactive UI elements for the video live: the slider, buttons, etc.
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';

const VideoUI = ({
  initialValue,
  onSlidingComplete,
  onSubmit,
  isSubmitted,
  isSubmitting,
}) => {
  // We keep track of the slider and political choice values right here.
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [politicalValue, setPoliticalValue] = useState(null); // null: unanswered, 0: No, 1: Yes

  // When the video changes, we need to reset the UI.
  useEffect(() => {
    setCurrentValue(initialValue);
    setPoliticalValue(null);
  }, [initialValue]);

  const rating = Math.round(currentValue);

  // Simple handler for the political choice buttons.
  const handlePoliticalChoice = (choice) => {
    if (!isSubmitted) {
      setPoliticalValue(choice);
    }
  };

  return (
    <View style={styles.uiOverlay}>
      {/* Political Choice Section */}
      <View style={styles.choiceContainer}>
        <Text style={styles.choiceQuestion}>Does this seem Political?</Text>
        <View style={styles.choiceButtonRow}>
          <TouchableOpacity
            style={[
              styles.choiceButton,
              politicalValue === 1 && styles.choiceButtonSelected,
              isSubmitted && styles.choiceButtonDisabled,
            ]}
            onPress={() => handlePoliticalChoice(1)}
            disabled={isSubmitted}
          >
            <Text style={styles.choiceButtonText}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.choiceButton,
              politicalValue === 0 && styles.choiceButtonSelected,
              isSubmitted && styles.choiceButtonDisabled,
            ]}
            onPress={() => handlePoliticalChoice(0)}
            disabled={isSubmitted}
          >
            <Text style={styles.choiceButtonText}>No</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Offensive/Interesting Slider Section */}
      <View style={styles.sliderContainer}>
        <Slider
          style={{ width: '90%', height: 40 }}
          minimumValue={0}
          maximumValue={100}
          value={currentValue}
          onSlidingComplete={onSlidingComplete}
          minimumTrackTintColor="#F44336"
          maximumTrackTintColor="#4CAF50"
          thumbTintColor={isSubmitted ? 'gray' : '#FFF'}
          disabled={isSubmitted}
        />
        <View style={styles.sliderLabelRow}>
          <Text style={styles.sliderLabel}>Offensive</Text>
          <Text style={styles.sliderValue}>{rating}</Text>
          <Text style={styles.sliderLabel}>Interesting</Text>
        </View>
      </View>

      {/* Submit Button: We only show the submit button if the rating hasn't been sent yet.*/}
      <View style={styles.buttonContainer}>
        {isSubmitted ? (
          <Text style={styles.submittedText}>✅ Rating Submitted</Text>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || politicalValue === null) && styles.submitButtonDisabled,
            ]}
            onPress={() => onSubmit({ rating, political: politicalValue })}
            disabled={isSubmitting || politicalValue === null}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Using React.memo here is a good performance boost.
export default React.memo(VideoUI);

const styles = StyleSheet.create({
  uiOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 20 },
  // New styles for the choice section
  choiceContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 10,
    marginBottom: 10, // Space between the two sections
  },
  choiceQuestion: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  choiceButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
  },
  choiceButton: {
    backgroundColor: '#555',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  choiceButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#222',
  },
  choiceButtonDisabled: {
    backgroundColor: '#333',
  },
  choiceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Existing styles
  sliderContainer: { width: '100%', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 10 },
  sliderLabelRow: { flexDirection: 'row', justifyContent: 'space-between', width: '90%', paddingHorizontal: 10, marginTop: 5 },
  sliderLabel: { color: '#ccc', fontSize: 12 },
  sliderValue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  buttonContainer: { alignItems: 'center', marginTop: 15 },
  submitButton: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  submitButtonDisabled: { backgroundColor: '#555' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  submittedText: { color: 'lightgreen', fontSize: 16, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 8 },
});