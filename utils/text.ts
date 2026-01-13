export const cleanMathText = (text: string): string => {
  if (!text) return "";
  
  // 1. Remove Markdown bold/italic wrappers if they break math
  let clean = text.replace(/\*\*/g, "").replace(/\*/g, "");

  // 2. Remove LaTeX delimiters
  clean = clean.replace(/\$\$/g, "").replace(/\$/g, "");

  // 3. Handle Fractions: \frac{num}{den} -> (num/den)
  clean = clean.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1/$2)");

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
    '\\degree': '°',
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
    '\\dots': '...',
    '\\cdots': '...',
    '\\angle': '∠',
    '\\parallel': '||',
    '\\perp': '⊥',
    '\\rightarrow': '→',
    '\\implies': '⇒',
    '\\iff': '⇔',
  };

  // Replace known latex commands
  Object.keys(replacements).forEach(key => {
     const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
     const regex = new RegExp(escapedKey, 'g');
     clean = clean.replace(regex, replacements[key]);
  });

  // Handle superscripts with braces ^{123} -> ¹²³
  clean = clean.replace(/\^\{([^}]*)\}/g, (match, p1) => {
    const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', 'n': 'ⁿ' };
    return p1.split('').map((char: string) => map[char] || char).join('');
  });

  // Handle simple superscripts ^1
  clean = clean.replace(/\^(\d)/g, (match, p1) => {
      const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
      return map[p1] || match;
  });

  // Handle subscripts _{123} -> ₁₂₃
  clean = clean.replace(/_\{([^}]*)\}/g, (match, p1) => {
    const map: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
    return p1.split('').map((char: string) => map[char] || char).join('');
  });

  // Clean up remaining braces from things like \sqrt{...}
  clean = clean.replace(/√\{([^}]+)\}/g, "√$1");
  clean = clean.replace(/\{([^}]*)\}/g, "$1");
  
  return clean;
};