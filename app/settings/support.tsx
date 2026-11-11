import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkCard } from '../../components/DarkCard';
import { GradientButton } from '../../components/GradientButton';
import { getIconName } from '../../constants/iconMappings';
import { gradients, theme } from '../../constants/theme';

const SupportScreen = () => {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [supportMessage, setSupportMessage] = useState('');

  const supportOptions = [
    {
      id: 'email',
      title: 'Email Support',
      description: 'Send us an email',
      icon: 'email',
      color: theme.colors.secondary,
      action: () => Linking.openURL('mailto:support@smarthome.example.com'),
    },
    {
      id: 'phone',
      title: 'Phone Support',
      description: 'Call our support line',
      icon: 'phone',
      color: theme.colors.accent,
      action: () => Linking.openURL('tel:+1-800-SUPPORT'),
    },
  ];

  const faqData = [
    {
      id: 1,
      question: 'How do I reset my geyser settings?',
      answer: 'Go to Settings > Reset Options and select "Factory Reset". This will restore all settings to default values.',
    },
    {
      id: 2,
      question: 'Why is my geyser not heating water?',
      answer: 'Check if the geyser is turned on, verify the temperature setting, and ensure there are no error messages. If the issue persists, contact support.',
    },
    {
      id: 3,
      question: 'How can I reduce energy consumption?',
      answer: 'Enable Eco Mode, use smart scheduling, lower the temperature by 5°C, and ensure regular maintenance for optimal efficiency.',
    },
    {
      id: 4,
      question: 'Can I control multiple geysers?',
      answer: 'Yes, you can add multiple devices in the app settings. Each geyser can be controlled independently with separate schedules.',
    },
    {
      id: 5,
      question: 'What should I do if the app crashes?',
      answer: 'Try restarting the app, ensure you have the latest version, restart your device, and clear the app cache if needed.',
    },
  ];

  const troubleshootingSteps = [
    {
      title: 'Check Power Connection',
      description: 'Ensure the geyser is properly connected to power',
      icon: 'power-plug',
    },
    {
      title: 'Verify Network Connection',
      description: 'Make sure your device is connected to WiFi',
      icon: 'wifi',
    },
    {
      title: 'Update App Version',
      description: 'Check for app updates in your app store',
      icon: 'update',
    },
    {
      title: 'Restart Device',
      description: 'Turn off and on your geyser device',
      icon: 'restart',
    },
  ];

  const handleFaqToggle = (faqId: number) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const handleSendMessage = () => {
    if (!supportMessage.trim()) {
      Alert.alert('Error', 'Enter your message');
      return;
    }
    
    Alert.alert('Success', 'Message sent!');
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
            <Text style={styles.title}>Help & Support</Text>
          </View>
          <MaterialCommunityIcons name="help-circle" size={24} color={theme.colors.primary} />
        </View>

        {/* Support Options */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          <View style={styles.supportGrid}>
            {supportOptions.map((option) => (
              <Pressable
                key={option.id}
                style={styles.supportOption}
                onPress={option.action}
              >
                <View style={[styles.supportIcon, { backgroundColor: option.color + '20' }]}>
                  <MaterialCommunityIcons name={getIconName(option.icon)} size={24} color={option.color} />
                </View>
                <Text style={styles.supportTitle}>{option.title}</Text>
                <Text style={styles.supportDesc}>{option.description}</Text>
              </Pressable>
            ))}
          </View>
        </DarkCard>

        {/* Quick Message */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Support Message</Text>
          <Text style={styles.sectionSubtitle}>
            Describe your issue and we'll get back to you soon
          </Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Describe your issue or question..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={4}
            value={supportMessage}
            onChangeText={setSupportMessage}
            textAlignVertical="top"
          />
          <GradientButton
            title="Send Message"
            onPress={handleSendMessage}
            colors={gradients.primary}
            size="medium"
          />
        </DarkCard>

        {/* Troubleshooting */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Troubleshooting</Text>
          <View style={styles.troubleshootingList}>
            {troubleshootingSteps.map((step, index) => (
              <View key={index} style={styles.troubleshootingItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <MaterialCommunityIcons name={getIconName(step.icon)} size={20} color={theme.colors.primary} />
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </DarkCard>

        {/* FAQ Section */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {faqData.map((faq) => (
              <View key={faq.id} style={styles.faqItem}>
                <Pressable
                  style={styles.faqQuestion}
                  onPress={() => handleFaqToggle(faq.id)}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <MaterialCommunityIcons
                    name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </Pressable>
                {expandedFaq === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </DarkCard>

        {/* Contact Information */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactList}>
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="email" size={20} color={theme.colors.secondary} />
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>support@smarthome.example.com</Text>
              </View>
            </View>
            
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="phone" size={20} color={theme.colors.accent} />
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>+1-800-SUPPORT (24/7)</Text>
              </View>
            </View>
            
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="web" size={20} color={theme.colors.primary} />
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>www.smarthome.example.com</Text>
              </View>
            </View>
            
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="clock" size={20} color={theme.colors.warning} />
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Support Hours</Text>
                <Text style={styles.contactValue}>24/7 Online • Mon-Fri 9AM-6PM Phone</Text>
              </View>
            </View>
          </View>
        </DarkCard>

        {/* Emergency Support */}
        <DarkCard style={styles.sectionCard}>
          <View style={styles.emergencyHeader}>
            <MaterialCommunityIcons name="alert-circle" size={24} color={theme.colors.error} />
            <Text style={styles.emergencyTitle}>Emergency Support</Text>
          </View>
          <Text style={styles.emergencyDesc}>
            For urgent issues that pose safety risks, contact our emergency support line immediately.
          </Text>
          <GradientButton
            title="Call Emergency Support"
            onPress={() => Linking.openURL('tel:+1-800-EMERGENCY')}
            colors={[theme.colors.error, theme.colors.warning]}
            size="large"
          />
        </DarkCard>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SupportScreen;

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
    marginBottom: theme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  supportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  supportOption: {
    width: '45%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  supportDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  messageInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 100,
    marginBottom: theme.spacing.md,
  },
  troubleshootingList: {
    gap: theme.spacing.md,
  },
  troubleshootingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.background,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  faqList: {
    gap: theme.spacing.sm,
  },
  faqItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  faqAnswer: {
    padding: theme.spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
  },
  faqAnswerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  contactList: {
    gap: theme.spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  contactText: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
  emergencyDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
});