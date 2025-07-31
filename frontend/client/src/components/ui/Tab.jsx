import React from 'react';
import { getTabStyle } from '../../styles/designSystem';

const Tab = ({ 
  children, 
  active = false, 
  disabled = false,
  onClick,
  icon: Icon,
  className = '',
  ...props 
}) => {
  const tabStyle = getTabStyle(active, disabled);
  const finalClassName = `${tabStyle} ${className}`;

  return (
    <button
      className={finalClassName}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

export default Tab; 