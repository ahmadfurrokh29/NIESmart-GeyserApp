import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkCard } from '../../components/DarkCard';
import { GradientButton } from '../../components/GradientButton';
import { getIconName } from '../../constants/iconMappings';
import { gradients, theme } from '../../constants/theme';

const FeedbackScreen = () => {
  const router = useRouter();
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const feedbackTypes = [
    { id: 'bug', label: 'Bug Report', icon: 'bug', color: theme.colors.error },
    { id: 'feature', label: 'Feature Request', icon: 'lightbulb', color: theme.colors.warning },
    { id: 'improvement', label: 'Improvement', icon: 'trending-up', color: theme.colors.primary },
    { id: 'general', label: 'General Feedback', icon: 'message', color: theme.colors.secondary },
  ];

  const handleSubmitFeedback = () => {
    if (!selectedRating || !feedbackType || !feedbackText.trim()) {
      Alert.alert('Error', 'Fill all fields');
      return;
    }

    Alert.alert('Success', 'Feedback sent!');
  };

  const renderStarRating = () => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>How would you rate your experience?</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => setSelectedRating(star)}
              style={styles.starButton}
            >
              <MaterialCommunityIcons
                name={star <= selectedRating ? 'star' : 'star-outline'}
                size={32}
                color={star <= selectedRating ? theme.colors.warning : theme.colors.textMuted}
              />
            </Pressable>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {selectedRating === 0 ? 'Tap to rate' : 
           selectedRating === 1 ? 'Poor' :
           selectedRating === 2 ? 'Fair' :
           selectedRating === 3 ? 'Good' :
           selectedRating === 4 ? 'Very Good' : 'Excellent'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.title}>Feedback</Text>
          </View>
          <MaterialCommunityIcons name="message-star" size={24} color={theme.colors.primary} />
        </View>

        {/* Rating Section */}
        <DarkCard style={styles.sectionCard}>
          {renderStarRating()}
        </DarkCard>

        {/* Feedback Type */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What type of feedback is this?</Text>
          <View style={styles.typeGrid}>
            {feedbackTypes.map((type) => (
              <Pressable
                key={type.id}
                style={[
                  styles.typeButton,
                  feedbackType === type.id && styles.typeButtonSelected
                ]}
                onPress={() => setFeedbackType(type.id)}
              >
                <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                  <MaterialCommunityIcons
                    name={getIconName(type.icon)}
                    size={24}
                    color={feedbackType === type.id ? theme.colors.text : type.color}
                  />
                </View>
                <Text style={[
                  styles.typeLabel,
                  feedbackType === type.id && styles.typeLabelSelected
                ]}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </DarkCard>

        {/* Feedback Text */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tell us more</Text>
          <Text style={styles.sectionSubtitle}>
            Please provide detailed feedback to help us improve your experience.
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Share your thoughts, suggestions, or report issues..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={6}
            value={feedbackText}
            onChangeText={setFeedbackText}
            textAlignVertical="top"
          />
        </DarkCard>

        {/* Contact Information */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact Information (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Leave your email if you'd like us to follow up with you.
          </Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email" size={20} color={theme.colors.textMuted} />
            <TextInput
              style={styles.emailInput}
              placeholder="your.email@example.com"
              placeholderTextColor={theme.colors.textMuted}
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </DarkCard>

        {/* Quick Feedback Options */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Feedback</Text>
          <View style={styles.quickFeedbackContainer}>
            {[
              { text: 'App is easy to use', icon: 'thumb-up' },
              { text: 'Love the dark theme', icon: 'heart' },
              { text: 'Great energy tracking', icon: 'chart-line' },
              { text: 'Notifications are helpful', icon: 'bell' },
            ].map((item, index) => (
              <Pressable key={index} style={styles.quickFeedbackItem}>
                <MaterialCommunityIcons name={getIconName(item.icon)} size={16} color={theme.colors.primary} />
                <Text style={styles.quickFeedbackText}>{item.text}</Text>
                <MaterialCommunityIcons name="plus" size={16} color={theme.colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </DarkCard>

        {/* App Info */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.appInfoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version:</Text>
              <Text style={styles.infoValue}>1.2.0 (Build 2024.1.15)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Platform:</Text>
              <Text style={styles.infoValue}>React Native</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Device:</Text>
              <Text style={styles.infoValue}>Mobile Device</Text>
            </View>
          </View>
        </DarkCard>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Submit Feedback"
            onPress={handleSubmitFeedback}
            colors={gradients.primary}
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FeedbackScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sectionCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  starButton: {
    padding: theme.spacing.xs,
  },
  ratingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  typeButton: {
    width: '45%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.card,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: theme.colors.text,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 120,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emailInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  quickFeedbackContainer: {
    gap: theme.spacing.sm,
  },
  quickFeedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.sm,
  },
  quickFeedbackText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  appInfoContainer: {
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120, // Extra padding to clear the navbar
  },
});