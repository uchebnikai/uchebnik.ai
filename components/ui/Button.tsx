import React from 'react';

export const Button = ({ children, onClick, className, variant = 'primary', icon: Icon, disabled }: any) => {
  const baseStyle = "flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 border border-indigo-500/20",
    secondary: "glass-button text-gray-700 dark:text-gray-200 hover:bg-white/40 dark:hover:bg-white/10",
    ghost: "text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-white",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};