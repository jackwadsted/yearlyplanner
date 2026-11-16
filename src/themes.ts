import { ThemeId } from './types';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  /** Swatches for the picker: primary, complementary, background */
  swatches: [string, string, string];
}

// Colours here are only for the preview swatches; the live palettes are in tailwind.config.js
export const THEMES: ThemeOption[] = [
  { id: 'default', label: 'Default', swatches: ['#0d9488', '#4f46e5', '#f8fafc'] },
  { id: 'pink', label: 'Pink', swatches: ['#db2777', '#059669', '#f8fafc'] },
  { id: 'orange', label: 'Orange', swatches: ['#ea580c', '#4f46e5', '#f8fafc'] },
  { id: 'black', label: 'Black', swatches: ['#06b6d4', '#d946ef', '#020617'] },
  { id: 'blue', label: 'Blue', swatches: ['#0284c7', '#f97316', '#f8fafc'] },
  { id: 'red', label: 'Red', swatches: ['#dc2626', '#06b6d4', '#f8fafc'] },
];
