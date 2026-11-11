import { MaterialCommunityIcons } from '@expo/vector-icons';

// Type for valid MaterialCommunityIcons names
export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

// Mapping of string names to valid icon names
export const iconMappings: Record<string, IconName> = {
  // Navigation icons
  'home': 'home',
  'settings': 'cog',
  'thermometer': 'thermometer',
  'tune': 'tune',
  'cog': 'cog',
  
  // Action icons
  'check': 'check',
  'close': 'close',
  'pencil': 'pencil',
  'edit': 'pencil',
  'chevron-right': 'chevron-right',
  'chevron-left': 'chevron-left',
  'arrow-left': 'arrow-left',
  'arrow-right': 'arrow-right',
  
  // Status icons
  'alert-circle': 'alert-circle',
  'alert': 'alert',
  'information': 'information',
  'check-circle': 'check-circle',
  'help-circle': 'help-circle',
  
  // Device icons
  'water-boiler': 'water-boiler',
  'identifier': 'identifier',
  'crown': 'crown',
  'account-group': 'account-group',
  
  // Feature icons
  'star': 'star',
  'calendar': 'calendar',
  'calendar-clock': 'calendar-clock',
  'clock': 'clock',
  'bell': 'bell',
  'bell-off': 'bell-off',
  'bell-outline': 'bell-outline',
  'wifi': 'wifi',
  'wifi-off': 'wifi-off',
  'battery': 'battery',
  'battery-charging': 'battery-charging',
  'thermometer-high': 'thermometer-high',
  'thermometer-low': 'thermometer-low',
  'home-outline': 'home-outline',
  'cog-outline': 'cog-outline',
  
  // Energy icons
  'lightning-bolt': 'lightning-bolt',
  'fire': 'fire',
  'snowflake': 'snowflake',
  'water': 'water',
  
  // Maintenance icons
  'wrench': 'wrench',
  'tools': 'tools',
  'hammer': 'hammer',
  'screwdriver': 'screwdriver',
  
  // Feedback icons
  'message': 'message',
  'email': 'email',
  'phone': 'phone',
  'chat': 'chat',
  
  // Support icons
  'headphones': 'headphones',
  'lifebuoy': 'lifebuoy',
  'book-open': 'book-open',
  'video': 'video',
  
  // Default fallback
  'default': 'pencil'
};

// Helper function to get a valid icon name
export const getIconName = (name: string): IconName => {
  return iconMappings[name] || iconMappings['default'];
};
