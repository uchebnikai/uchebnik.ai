import { useEffect } from 'react';
import { UserSettings } from '../types';
import { hexToRgb, rgbToHsl, hslToRgb, adjustBrightness } from '../utils/theme';

export const useTheme = (userSettings: UserSettings) => {
  useEffect(() => {
    if (userSettings.themeColor) {
      const rgb = hexToRgb(userSettings.themeColor);
      const root = document.documentElement;
      
      // Update primary palette variables
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

      // Calculate Accent Color (Hue Shift)
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const accentHsl = { ...hsl, h: (hsl.h + 35) % 360 }; // +35 degree shift
      const accentRgb = hslToRgb(accentHsl.h, accentHsl.s, accentHsl.l);

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

    // Toggle custom-bg-active class
    if (userSettings.customBackground) {
      document.body.classList.add('custom-bg-active');
    } else {
      document.body.classList.remove('custom-bg-active');
    }
  }, [userSettings.themeColor, userSettings.customBackground]);
};