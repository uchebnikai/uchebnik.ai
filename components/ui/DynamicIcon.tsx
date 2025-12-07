import React from 'react';
import * as LucideIcons from 'lucide-react';

export const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const Icon = (LucideIcons as any)[name];
  return Icon ? <Icon className={className} /> : <LucideIcons.HelpCircle className={className} />;
};