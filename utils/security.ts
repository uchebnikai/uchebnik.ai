const SECRET_SALT = "UCH_2025_SECURE_SALT_VS";

export const generateChecksum = (core: string): string => {
  let hash = 0;
  const str = core + SECRET_SALT;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and take last 4 chars
  return Math.abs(hash).toString(16).substring(0, 4).toUpperCase().padStart(4, '0');
};

export const isValidKey = (key: string): boolean => {
  // Master Key
  if (key === "UCH-PRO-2025") return true;

  // Algorithmic Key: UCH-{CORE}-{CHECKSUM}
  const parts = key.split('-');
  if (parts.length !== 3) return false;
  if (parts[0] !== 'UCH') return false;
  
  const core = parts[1];
  const checksum = parts[2];
  
  return generateChecksum(core) === checksum;
};