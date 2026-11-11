import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

interface ProfileAvatarProps {
  source?: ImageSourcePropType;
  name?: string;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
  showBorder?: boolean;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  source,
  name,
  size = 48,
  borderColor = theme.colors.primary,
  borderWidth = 2,
  showBorder = false,
}) => {
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarStyle = [
    styles.avatar,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: showBorder ? borderWidth : 0,
      borderColor: showBorder ? borderColor : 'transparent',
    },
  ];

  if (source) {
    return <Image source={source} style={avatarStyle} />;
  }

  return (
    <View style={[avatarStyle, styles.placeholder]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
        {name ? getInitials(name) : '?'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: theme.colors.card,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  initials: {
    color: theme.colors.text,
    fontWeight: '600',
  },
});