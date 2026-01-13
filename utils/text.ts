export const cleanMathText = (text: string): string => {
  if (!text) return "";
  
  // 1. Remove Markdown bold/italic wrappers if they break math
  let clean = text.replace(/\*\*/g, "").replace(/\*/g, "");

  // 2. Remove LaTeX delimiters
  clean = clean.replace(/\$/g, "");

  // 3. Common LaTeX/Math to Unicode Mappings
  const replacements: Record<string, string> = {
    '\\times': '×',
    '\\cdot': '·',
    '\\div': '÷',
    '\\le': '≤',
    '\\ge': '≥',
    '\\neq': '≠',
    '\\approx': '≈',
    '\\infty': '∞',
    '\\pm': '±',
    '\\pi': 'π',
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\Delta': '∆',
    '\\theta': 'θ',
    '\\sqrt': '√',
    'sqrt': '√',
    '\\circ': '°',
    '^2': '²',
    '^3': '³',
    '^0': '⁰',
    '^1': '¹',
    '^4': '⁴',
    '^5': '⁵',
    '^6': '⁶',
    '^7': '⁷',
    '^8': '⁸',
    '^9': '⁹',
    '^o': '°',
    '<=': '≤',
    '>=': '≥',
    '!=': '≠',
  };

  // Replace superscripts first
  clean = clean.replace(/\^(\d)/g, (match, p1) => {
      const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
      return map[p1] || match;
  });

  // Replace known latex commands
  Object.keys(replacements).forEach(key => {
     // Escape special regex chars in key if needed (like ^ or \)
     const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
     const regex = new RegExp(escapedKey, 'g');
     clean = clean.replace(regex, replacements[key]);
  });

  // Handle \sqrt{...} specially to just remove braces if simple
  clean = clean.replace(/√\{([^}]+)\}/g, "√$1");
  
  return clean;
};