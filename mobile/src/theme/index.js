/**
 * Connectly Design System & Theme Engine
 * Original Identity: Iris Aurora Ambient Palette
 */

export const typography = {
  fontFamily: {
    regular: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    medium: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    bold: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 32
  },
  lineHeight: {
    xs: 15,
    sm: 18,
    md: 22,
    lg: 24,
    xl: 28,
    xxl: 32,
    display: 40
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800'
  }
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999
};

export const darkTheme = {
  isDark: true,
  colors: {
    // Brand Colors (Vibrant Iris & Cyan Aurora)
    primary: '#6366F1',       // Electric Indigo
    primaryHover: '#4F46E5',
    primaryLight: '#818CF8',
    secondary: '#06B6D4',     // Hyper Cyan
    accent: '#EC4899',        // Radiant Magenta / Neon Pink
    success: '#10B981',       // Emerald Mint
    warning: '#F59E0B',       // Amber Flame
    danger: '#EF4444',        // Vivid Rose Red

    // Background & Surfaces
    background: '#0B0F17',    // Obsidian Slate Void
    surface: '#111827',       // Dark Charcoal Card
    surfaceElevated: '#1F2937',// Elevated Modal / Sheet
    surfaceHighlight: '#374151',

    // Text & Content
    textPrimary: '#F9FAFB',   // Ultra Crisp White
    textSecondary: '#9CA3AF', // Muted Gray
    textTertiary: '#6B7280',  // Subdued Gray
    textInverse: '#0B0F17',

    // Borders & Dividers
    border: 'rgba(255, 255, 255, 0.08)',
    borderActive: 'rgba(99, 102, 241, 0.4)',
    borderFocus: '#6366F1',

    // Story Ring Gradients
    storyGradient: ['#EC4899', '#8B5CF6', '#06B6D4'],
    storySeen: 'rgba(156, 163, 175, 0.4)',

    // Chat Message Bubbles
    bubbleSelf: '#6366F1',
    bubbleSelfText: '#FFFFFF',
    bubbleOther: '#1F2937',
    bubbleOtherText: '#F3F4F6',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.75)'
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5
    },
    glow: {
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 8
    }
  }
};

export const lightTheme = {
  isDark: false,
  colors: {
    // Brand Colors
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryLight: '#6366F1',
    secondary: '#0891B2',
    accent: '#DB2777',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',

    // Background & Surfaces
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceHighlight: '#F1F5F9',

    // Text & Content
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textInverse: '#FFFFFF',

    // Borders & Dividers
    border: '#E2E8F0',
    borderActive: 'rgba(79, 70, 229, 0.3)',
    borderFocus: '#4F46E5',

    // Story Ring Gradients
    storyGradient: ['#EC4899', '#8B5CF6', '#06B6D4'],
    storySeen: '#CBD5E1',

    // Chat Message Bubbles
    bubbleSelf: '#4F46E5',
    bubbleSelfText: '#FFFFFF',
    bubbleOther: '#E2E8F0',
    bubbleOtherText: '#0F172A',

    // Overlay
    overlay: 'rgba(15, 23, 42, 0.5)'
  },
  shadows: {
    sm: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1
    },
    md: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 4
    },
    glow: {
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6
    }
  }
};
