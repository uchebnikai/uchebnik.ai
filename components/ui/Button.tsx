import React from 'react';
import { BUTTON_BASE, BUTTON_VARIANTS } from '../../styles/ui';

export const Button = ({ children, onClick, className, variant = 'primary', icon: Icon, disabled }: any) => {
  return (
    <button onClick={onClick} disabled={disabled} className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant as keyof typeof BUTTON_VARIANTS]} ${className}`}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};