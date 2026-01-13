
export const cleanMathText = (text: string): string => {
  if (!text) return "";
  
  let clean = text;

  // 1. Handle LaTeX \text{...} by extracting the content
  clean = clean.replace(/\\text\s*\{([^}]+)\}/g, "$1");

  // 2. Remove LaTeX delimiters but keep content
  clean = clean.replace(/\$/g, "");

  // 3. Remove Markdown bold/italic wrappers
  clean = clean.replace(/\*\*/g, "").replace(/\*/g, "");

  // 4. Common LaTeX/Math to Unicode Mappings
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

  // Replace exponents with actual unicode characters
  clean = clean.replace(/\^(\d)/g, (match, p1) => {
      const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
      return map[p1] || match;
  });

  // Replace known latex commands
  Object.keys(replacements).forEach(key => {
     const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
     const regex = new RegExp(escapedKey, 'g');
     clean = clean.replace(regex, replacements[key]);
  });

  // Clean up remaining braces from \frac or \sqrt
  clean = clean.replace(/\{([^}]+)\}/g, "$1");
  
  return clean;
};
