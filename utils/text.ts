
export const cleanMathText = (text: string): string => {
  if (!text) return "";
  
  // 1. Remove Markdown bold/italic wrappers if they break math
  let clean = text.replace(/\*\*/g, "").replace(/\*/g, "");

  // 2. Remove LaTeX delimiters for plain text export
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
    '^°': '°',
    '<=': '≤',
    '>=': '≥',
    '!=': '≠',
    '\\triangle': '△',
    '\\angle': '∠',
    '\\degree': '°',
  };

  // Replace superscripts first
  clean = clean.replace(/\^(\d)/g, (match, p1) => {
      const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
      return map[p1] || match;
  });

  // Remove \text{...} wrappers but keep content
  clean = clean.replace(/\\text\{([^}]+)\}/g, "$1");

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

// Helper to inject delimiters for ReactMarkdown if missing
export const preprocessLatex = (text: string): string => {
    if (!text) return "";
    let processed = text;

    // Detect if text already has $ delimiters
    const hasDelimiters = text.includes('$');

    if (!hasDelimiters) {
        // Naive fix for common missing delimiters
        // Wraps isolated latex commands in $...$
        // e.g. \triangle -> $\triangle$
        // e.g. \angle A -> $\angle$ A (works for rendering symbols)
        
        const commands = [
            '\\\\triangle', '\\\\angle', '\\\\sqrt', '\\\\frac', '\\\\cdot', 
            '\\\\alpha', '\\\\beta', '\\\\gamma', '\\\\pi', '\\\\theta', 
            '\\\\infty', '\\\\approx', '\\\\neq', '\\\\le', '\\\\ge'
        ];
        
        const regex = new RegExp(`(${commands.join('|')})`, 'g');
        processed = processed.replace(regex, '$$$1$$');
        
        // Fix superscripts like ^° or ^2 if they aren't in math mode
        processed = processed.replace(/(\^°|\^\d+)/g, '$$$1$$');
    }
    
    return processed;
};
