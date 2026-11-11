export const theme = {
    colors: {
        background: '#0A0A0A',
        surface: '#1A1A1A',
        card: '#2A2A2A',
        cardSecondary: '#1F1F1F',
        primary: '#4ADE80',
        secondary: '#60A5FA',
        accent: '#FB923C',
        accentPink: '#F472B6',
        accentPurple: '#A78BFA',
        text: '#FFFFFF',
        textSecondary: '#9CA3AF',
        textMuted: '#6B7280',
        border: '#374151',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
        full: 9999,
    },
    typography: {
        h1: {
            fontSize: 32,
            fontWeight: '700' as const,
            lineHeight: 40,
        },
        h2: {
            fontSize: 24,
            fontWeight: '600' as const,
            lineHeight: 32,
        },
        h3: {
            fontSize: 20,
            fontWeight: '600' as const,
            lineHeight: 28,
        },
        body: {
            fontSize: 16,
            fontWeight: '400' as const,
            lineHeight: 24,
        },
        bodyMedium: {
            fontSize: 16,
            fontWeight: '500' as const,
            lineHeight: 24,
        },
        caption: {
            fontSize: 14,
            fontWeight: '400' as const,
            lineHeight: 20,
        },
        small: {
            fontSize: 12,
            fontWeight: '400' as const,
            lineHeight: 16,
        },
    },
    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
        },
    },
} as const;

export type Theme = typeof theme;

// Utility functions for theme usage
export const getSpacing = (size: keyof typeof theme.spacing) => theme.spacing[size];
export const getBorderRadius = (size: keyof typeof theme.borderRadius) => theme.borderRadius[size];
export const getColor = (color: keyof typeof theme.colors) => theme.colors[color];

// Gradient presets
export const gradients = {
    primary: [theme.colors.primary, theme.colors.secondary],
    secondary: [theme.colors.secondary, theme.colors.accentPurple],
    success: [theme.colors.success, theme.colors.primary],
    warning: [theme.colors.warning, theme.colors.accent],
    accent: [theme.colors.accent, theme.colors.accentPink],
    purple: [theme.colors.accentPurple, theme.colors.secondary],
};