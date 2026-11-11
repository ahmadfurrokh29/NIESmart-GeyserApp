import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getIconName } from '../../constants/iconMappings';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkCard } from '../../components/DarkCard';
import { theme } from '../../constants/theme';

const AboutScreen = () => {
  const router = useRouter();

  const appInfo = {
    version: '1.2.0',
    build: '2024.1.15',
    releaseDate: 'January 15, 2024',
    platform: 'React Native',
    developer: 'Smart Home Solutions',
    website: 'https://smarthome.example.com',
    email: 'support@smarthome.example.com',
  };

  const features = [
    { icon: 'thermometer', title: 'Smart Temperature Control', desc: 'Precise temperature management' },
    { icon: 'bell-ring', title: 'Smart Notifications', desc: 'Real-time alerts and updates' },
    { icon: 'chart-line', title: 'Usage Analytics', desc: 'Detailed energy reports' },
    { icon: 'shield-check', title: 'Secure & Reliable', desc: 'Enterprise-grade security' },
  ];

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
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
            <Text style={styles.title}>About App</Text>
          </View>
          <MaterialCommunityIcons name="information" size={24} color={theme.colors.primary} />
        </View>

        {/* App Logo & Info */}
        <DarkCard style={styles.appInfoCard}>
          <View style={styles.appLogoContainer}>
            <View style={styles.appLogo}>
              <MaterialCommunityIcons name="water-boiler" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.appName}>Smart Geyser</Text>
            <Text style={styles.appTagline}>Intelligent Water Heating Control</Text>
          </View>
          
          <View style={styles.versionInfo}>
            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>Version</Text>
              <Text style={styles.versionValue}>{appInfo.version}</Text>
            </View>
            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>Build</Text>
              <Text style={styles.versionValue}>{appInfo.build}</Text>
            </View>
            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>Release Date</Text>
              <Text style={styles.versionValue}>{appInfo.releaseDate}</Text>
            </View>
            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>Platform</Text>
              <Text style={styles.versionValue}>{appInfo.platform}</Text>
            </View>
          </View>
        </DarkCard>

        {/* Features */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                  <MaterialCommunityIcons name={getIconName(feature.icon)} size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </DarkCard>

        {/* Developer Info */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Developer</Text>
          <View style={styles.developerInfo}>
            <View style={styles.developerHeader}>
              <View style={styles.developerLogo}>
                <MaterialCommunityIcons name="domain" size={32} color={theme.colors.secondary} />
              </View>
              <View style={styles.developerText}>
                <Text style={styles.developerName}>{appInfo.developer}</Text>
                <Text style={styles.developerDesc}>Smart Home Technology Solutions</Text>
              </View>
            </View>
            
            <View style={styles.contactInfo}>
              <Pressable 
                style={styles.contactItem}
                onPress={() => handleLinkPress(appInfo.website)}
              >
                <MaterialCommunityIcons name="web" size={20} color={theme.colors.primary} />
                <Text style={styles.contactText}>{appInfo.website}</Text>
                <MaterialCommunityIcons name="open-in-new" size={16} color={theme.colors.textMuted} />
              </Pressable>
              
              <Pressable 
                style={styles.contactItem}
                onPress={() => handleLinkPress(`mailto:${appInfo.email}`)}
              >
                <MaterialCommunityIcons name="email" size={20} color={theme.colors.secondary} />
                <Text style={styles.contactText}>{appInfo.email}</Text>
                <MaterialCommunityIcons name="open-in-new" size={16} color={theme.colors.textMuted} />
              </Pressable>
            </View>
          </View>
        </DarkCard>

        {/* Legal & Privacy */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Legal & Privacy</Text>
          <View style={styles.legalLinks}>
            <Pressable style={styles.legalItem}>
              <MaterialCommunityIcons name="file-document" size={20} color={theme.colors.accent} />
              <Text style={styles.legalText}>Terms of Service</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
            </Pressable>
            
            <Pressable style={styles.legalItem}>
              <MaterialCommunityIcons name="shield-account" size={20} color={theme.colors.success} />
              <Text style={styles.legalText}>Privacy Policy</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
            </Pressable>
            
            <Pressable style={styles.legalItem}>
              <MaterialCommunityIcons name="license" size={20} color={theme.colors.warning} />
              <Text style={styles.legalText}>Open Source Licenses</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        </DarkCard>



        {/* Copyright */}
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>
            © 2024 Smart Home Solutions. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Made with ❤️ for smart home enthusiasts
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;

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
  appInfoCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  appLogoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  appTagline: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  versionInfo: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  versionLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  versionValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
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
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  featureItem: {
    width: '45%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  featureDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  developerInfo: {
    gap: theme.spacing.lg,
  },
  developerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  developerLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  developerText: {
    flex: 1,
  },
  developerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  developerDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  contactInfo: {
    gap: theme.spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.sm,
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  legalLinks: {
    gap: theme.spacing.sm,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.sm,
  },
  legalText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  systemInfo: {
    gap: theme.spacing.sm,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  systemLabel: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  systemValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  copyrightContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  copyrightText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  copyrightSubtext: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});