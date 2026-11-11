import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import { DarkCard } from '../../components/DarkCard';
import { GradientButton } from '../../components/GradientButton';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { gradients, theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

const ProfileScreen = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Debug logging
  console.log('ProfileScreen - user:', user);
  
  // Ensure we have safe default values
  const safeDisplayName = user?.displayName ? String(user.displayName) : 'User';
  const safeEmail = user?.email ? String(user.email) : 'user@example.com';
  
  // Early return if user data is problematic
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title="Profile Settings" 
          showBackButton={true}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const [formData, setFormData] = useState({
    displayName: safeDisplayName,
    email: safeEmail,
    phone: user?.phone || 'Not provided',
  });

  const handleSave = () => {
    // In a real app, this would update the user profile in Firebase
            Alert.alert('Success', 'Profile updated!');
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      displayName: user?.displayName || 'User',
      email: user?.email || 'user@example.com',
      phone: user?.phone || 'Not provided',
    });
    setIsEditing(false);
  };

  const renderField = (
    label: string,
    value: string,
    key: keyof typeof formData,
    icon: any,
    editable: boolean = true,
    multiline: boolean = false,
    shouldFade: boolean = false
  ) => {
    const isFieldFaded = isEditing && shouldFade;
    return (
      <View style={[styles.fieldContainer, isFieldFaded && styles.fadedField]}>
        <Text style={[styles.fieldLabel, isFieldFaded && styles.fadedText]}>{label}</Text>
        <View style={[styles.inputContainer, isFieldFaded && styles.fadedContainer]}>
          <MaterialCommunityIcons 
            name={icon} 
            size={20} 
            color={isFieldFaded ? theme.colors.textMuted + '50' : theme.colors.textMuted} 
          />
          <TextInput
            style={[
              styles.input, 
              multiline && styles.multilineInput,
              isFieldFaded && styles.fadedInput
            ]}
            value={value}
            onChangeText={(text) => setFormData(prev => ({ ...prev, [key]: text }))}
            editable={isEditing && editable}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        title="Profile Settings" 
        showBackButton={true}
        rightIcon={isEditing ? "close" : "pencil"}
        onRightIconPress={isEditing ? handleCancel : () => setIsEditing(true)}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <DarkCard style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <ProfileAvatar 
              name={safeDisplayName} 
              size={100} 
              showBorder={true}
              borderColor={theme.colors.primary}
              borderWidth={3}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{safeDisplayName}</Text>
              <Text style={styles.profileEmail}>{safeEmail}</Text>
              <View style={styles.statusBadge}>
                <MaterialCommunityIcons name="crown" size={12} color={theme.colors.primary} />
                <Text style={styles.statusText}>Premium Member</Text>
              </View>
            </View>
          </View>
        </DarkCard>

        {/* Profile Form */}
        <DarkCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {renderField('Full Name', formData.displayName, 'displayName', 'account')}
          {renderField('Email Address', formData.email, 'email', 'email', false, false, true)}
          {renderField('Phone Number', user?.phone || 'Not provided', 'phone', 'phone', false, false, true)}
        </DarkCard>



        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <GradientButton
              title="Save Changes"
              onPress={handleSave}
              colors={gradients.primary}
              size="large"
            />
            <GradientButton
              title="Cancel"
              onPress={handleCancel}
              colors={[theme.colors.surface, theme.colors.surface]}
              size="large"
              textStyle={{ color: theme.colors.textSecondary }}
            />
          </View>
        )}


      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileHeader: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  formCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  fieldContainer: {
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  statsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  actionButtons: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  dangerCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  dangerDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  dangerActions: {
    alignItems: 'flex-start',
  },
  fadedField: {
    opacity: 0.4,
  },
  fadedText: {
    opacity: 0.4,
  },
  fadedContainer: {
    opacity: 0.4,
  },
  fadedInput: {
    opacity: 0.4,
  },
});

export default ProfileScreen;