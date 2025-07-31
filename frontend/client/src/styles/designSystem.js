// Design System for Sygnify BI Platform
// Professional color palette optimized for white backgrounds

export const colors = {
  // Primary Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Neutral Colors
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
};

export const buttonStyles = {
  // Primary Button
  primary: {
    base: 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    enabled: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md',
    disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm',
    loading: 'bg-blue-600 text-white cursor-wait',
  },
  
  // Secondary Button
  secondary: {
    base: 'inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    enabled: 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500 shadow-sm hover:shadow-md',
    disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200',
  },
  
  // Ghost Button
  ghost: {
    base: 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    enabled: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-blue-500',
    disabled: 'text-gray-400 cursor-not-allowed',
  },
  
  // Danger Button
  danger: {
    base: 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    enabled: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
    disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm',
  },
  
  // Success Button
  success: {
    base: 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    enabled: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm hover:shadow-md',
    disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm',
  },
};

export const cardStyles = {
  // Default Card
  default: {
    base: 'bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200',
    hover: 'hover:shadow-md hover:border-gray-300',
    selected: 'ring-2 ring-blue-500 border-blue-300 bg-blue-50',
  },
  
  // Elevated Card
  elevated: {
    base: 'bg-white rounded-lg border border-gray-200 shadow-md transition-all duration-200',
    hover: 'hover:shadow-lg hover:border-gray-300',
    selected: 'ring-2 ring-blue-500 border-blue-300 bg-blue-50 shadow-lg',
  },
  
  // Interactive Card
  interactive: {
    base: 'bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200 cursor-pointer',
    hover: 'hover:shadow-md hover:border-gray-300 hover:bg-gray-50',
    selected: 'ring-2 ring-blue-500 border-blue-300 bg-blue-50 shadow-md',
  },
  
  // Feature Card
  feature: {
    base: 'bg-white rounded-xl border border-gray-200 shadow-lg transition-all duration-200',
    hover: 'hover:shadow-xl hover:border-gray-300',
  },
};

export const textStyles = {
  // Headings
  h1: 'text-4xl font-bold text-gray-900',
  h2: 'text-3xl font-semibold text-gray-900',
  h3: 'text-2xl font-semibold text-gray-900',
  h4: 'text-xl font-semibold text-gray-900',
  h5: 'text-lg font-semibold text-gray-900',
  h6: 'text-base font-semibold text-gray-900',
  
  // Body Text
  body: {
    large: 'text-lg text-gray-700',
    medium: 'text-base text-gray-700',
    small: 'text-sm text-gray-600',
    xs: 'text-xs text-gray-500',
  },
  
  // Status Text
  status: {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  },
};

export const tabStyles = {
  base: 'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-transparent',
  active: 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm',
  inactive: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50',
  disabled: 'text-gray-400 cursor-not-allowed',
};

export const inputStyles = {
  base: 'block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
  error: 'border-red-300 focus:ring-red-500 focus:border-red-500',
  success: 'border-green-300 focus:ring-green-500 focus:border-green-500',
};

export const badgeStyles = {
  base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  primary: 'bg-blue-100 text-blue-800',
  secondary: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
};

// Utility function to combine styles
export const combineStyles = (...styles) => styles.filter(Boolean).join(' ');

// Component-specific style generators
export const getButtonStyle = (variant = 'primary', state = 'enabled') => {
  const style = buttonStyles[variant];
  return combineStyles(style.base, style[state]);
};

export const getCardStyle = (variant = 'default', state = 'base') => {
  const style = cardStyles[variant];
  return combineStyles(style.base, style[state]);
};

export const getTabStyle = (isActive = false, isDisabled = false) => {
  if (isDisabled) return combineStyles(tabStyles.base, tabStyles.disabled);
  return combineStyles(tabStyles.base, isActive ? tabStyles.active : tabStyles.inactive);
}; 