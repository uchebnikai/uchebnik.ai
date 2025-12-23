
import { useEffect } from 'react';
import { UserSettings } from '../types';
import { hexToRgb, rgbToHsl, hslToRgb, adjustBrightness } from '../styles/theme';

export const useTheme = (userSettings: UserSettings) => {
  useEffect(() => {
    // 1. Determine the effective theme color
    // - High Contrast: Black/Yellow (Simulated via high contrast logic below, but we set base here)
    // - Christmas: Red (#ef4444)
    // - Default: User setting or Indigo (#6366f1)
    
    let themeColor = userSettings.themeColor || '#6366f1';
    
    if (userSettings.highContrast) {
        // High contrast overrides most things with very stark colors
        document.body.classList.add('high-contrast');
        themeColor = '#fbbf24'; // Vivid Yellow for interactions in HC mode
    } else {
        document.body.classList.remove('high-contrast');
        if (userSettings.christmasMode) themeColor = '#ef4444';
    }

    // 2. Apply colors to CSS Variables
    if (themeColor) {
      const rgb = hexToRgb(themeColor);
      const root = document.documentElement;
      
      // Update primary palette variables (Shades & Tints)
      root.style.setProperty('--primary-50', adjustBrightness(rgb, 90));
      root.style.setProperty('--primary-100', adjustBrightness(rgb, 80));
      root.style.setProperty('--primary-200', adjustBrightness(rgb, 60));
      root.style.setProperty('--primary-300', adjustBrightness(rgb, 40));
      root.style.setProperty('--primary-400', adjustBrightness(rgb, 20));
      root.style.setProperty('--primary-500', `${rgb.r} ${rgb.g} ${rgb.b}`);
      root.style.setProperty('--primary-600', adjustBrightness(rgb, -10));
      root.style.setProperty('--primary-700', adjustBrightness(rgb, -20));
      root.style.setProperty('--primary-800', adjustBrightness(rgb, -30));
      root.style.setProperty('--primary-900', adjustBrightness(rgb, -40));
      root.style.setProperty('--primary-950', adjustBrightness(rgb, -50));

      // 3. Calculate Accent Color
      let accentRgb;
      if (userSettings.highContrast) {
          accentRgb = hexToRgb('#ffffff');
      } else if (userSettings.christmasMode) {
          accentRgb = hexToRgb('#10b981'); 
      } else {
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          const accentHsl = { ...hsl, h: (hsl.h + 35) % 360 }; 
          accentRgb = hslToRgb(accentHsl.h, accentHsl.s, accentHsl.l);
      }

      // Update accent palette variables
      root.style.setProperty('--accent-50', adjustBrightness(accentRgb, 90));
      root.style.setProperty('--accent-100', adjustBrightness(accentRgb, 80));
      root.style.setProperty('--accent-200', adjustBrightness(accentRgb, 60));
      root.style.setProperty('--accent-300', adjustBrightness(accentRgb, 40));
      root.style.setProperty('--accent-400', adjustBrightness(accentRgb, 20));
      root.style.setProperty('--accent-500', `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}`);
      root.style.setProperty('--accent-600', adjustBrightness(accentRgb, -10));
      root.style.setProperty('--accent-700', adjustBrightness(accentRgb, -20));
      root.style.setProperty('--accent-800', adjustBrightness(accentRgb, -30));
      root.style.setProperty('--accent-900', adjustBrightness(accentRgb, -40));
      root.style.setProperty('--accent-950', adjustBrightness(accentRgb, -50));
    }

    // 4. Handle Body Classes for Backgrounds & Special Modes
    // 'custom-bg-active' handles glass transparency adjustments
    if ((userSettings.customBackground || userSettings.christmasMode) && !userSettings.highContrast) {
      document.body.classList.add('custom-bg-active');
    } else {
      document.body.classList.remove('custom-bg-active');
    }
    
    // 'christmas-mode' handles fonts, snow, etc.
    if (userSettings.christmasMode && !userSettings.highContrast) {
        document.body.classList.add('christmas-mode');
    } else {
        document.body.classList.remove('christmas-mode');
    }

  }, [userSettings.themeColor, userSettings.customBackground, userSettings.christmasMode, userSettings.highContrast]);
};
