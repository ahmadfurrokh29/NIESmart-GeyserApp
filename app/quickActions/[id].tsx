import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { theme } from '../../constants/theme';

export default function QuickActionRedirect() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    const routeMap: Record<string, string> = {
      set_temperature: "/set_temp",
      current_temp: "/current_temp",
      select_mode: "/(tabs)/mode",
      geyser_management: "/geyser-management",
      settings: "/settings",
      scheduling: "/settings/scheduling",
      notifications: "/settings/notifications",
    };

    const target = routeMap[id as string];

    if (target) {
      router.replace(target as any);
    } else {
      console.warn("Invalid quick action id:", id);
    }
  }, [id]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.text}>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  text: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});
