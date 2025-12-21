
export const hexToRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 99, g: 102, b: 241 }; // fallback Indigo 500
};

export const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
};

export const hslToRgb = (h: number, s: number, l: number) => {
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    h /= 360;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

export const adjustBrightness = (col: {r:number, g:number, b:number}, percent: number) => {
    let R, G, B;

    if (percent > 0) {
        // Tint: Mix with White
        // percent 100 = full white, 0 = original
        // Using formula: color + (255 - color) * percentage
        const factor = percent / 100;
        R = col.r + (255 - col.r) * factor;
        G = col.g + (255 - col.g) * factor;
        B = col.b + (255 - col.b) * factor;
    } else {
        // Shade: Mix with Black
        // percent -100 = full black, 0 = original
        // Using formula: color * (1 + percent/100) -> since percent is negative, it reduces
        const factor = 1 + (percent / 100);
        R = col.r * factor;
        G = col.g * factor;
        B = col.b * factor;
    }

    R = Math.round(Math.max(0, Math.min(255, R)));
    G = Math.round(Math.max(0, Math.min(255, G)));
    B = Math.round(Math.max(0, Math.min(255, B)));
    
    return `${R} ${G} ${B}`;
};

export const getDynamicColorStyle = (color: string) => ({ backgroundColor: color });
