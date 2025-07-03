import React from 'react';
import { Wrench, Zap, Droplets, Building, Palette, Sparkles, Grid3x3, Bath, DivideIcon as LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Wrench,
  Zap,
  Droplets,
  Building,
  Palette,
  Sparkles,
  Grid3x3,
  Bath,
};

export const getDynamicIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Wrench;
};