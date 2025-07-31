import React from 'react';
import { getCardStyle, combineStyles, cardStyles } from '../../styles/designSystem';

const Card = ({ 
  children, 
  variant = 'default', 
  selected = false,
  hover = true,
  className = '',
  onClick,
  ...props 
}) => {
  const getState = () => {
    if (selected) return 'selected';
    return 'base';
  };

  const baseStyle = getCardStyle(variant, getState());
  const hoverStyle = hover && !selected ? cardStyles[variant].hover : '';
  const finalClassName = combineStyles(baseStyle, hoverStyle, className);

  return (
    <div
      className={finalClassName}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card; 