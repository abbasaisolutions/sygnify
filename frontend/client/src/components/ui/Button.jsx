import React from 'react';
import { getButtonStyle, combineStyles } from '../../styles/designSystem';

const Button = ({ 
  children, 
  variant = 'primary', 
  disabled = false, 
  loading = false,
  className = '',
  onClick,
  type = 'button',
  size = 'medium',
  icon: Icon,
  ...props 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-1.5 text-xs';
      case 'large':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getState = () => {
    if (disabled) return 'disabled';
    if (loading) return 'loading';
    return 'enabled';
  };

  const baseStyle = getButtonStyle(variant, getState());
  const sizeClasses = getSizeClasses();
  const finalClassName = combineStyles(baseStyle, sizeClasses, className);

  return (
    <button
      type={type}
      className={finalClassName}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {Icon && !loading && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};

export default Button; 