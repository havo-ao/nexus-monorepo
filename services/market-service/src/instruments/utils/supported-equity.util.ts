const SUPPORTED_ASSET_TYPES = new Set(['stock', 'common stock']);
const SUPPORTED_SYMBOL_PATTERN = /^[A-Z][A-Z.]{0,9}$/;
const UNSUPPORTED_SECURITY_NAME_PATTERNS = [
  /\bwarrants?\b/i,
  /\bunits?\b/i,
  /\brights?\b/i,
  /\bpreferred\b/i,
  /\bpreference\b/i,
  /\bdepositary\b/i,
  /\bnotes?\b/i,
  /\bbonds?\b/i,
  /\bdebentures?\b/i,
  /\betfs?\b/i,
  /\betns?\b/i,
  /\bfunds?\b/i,
  /\bclo\b/i,
  /\bdirexion\b/i,
  /\bdaily\b.*\b(bull|bear)\b/i,
  /\b(bull|bear)\b.*\bdaily\b/i,
  /\bleveraged\b/i,
  /\binverse\b/i,
  /\bacquisition corp(?:oration)?\b/i,
  /\bspecial purpose acquisition\b/i,
] as const;

export interface SupportedEquityCandidate {
  symbol?: string | null;
  name: string;
  assetType?: string | null;
}

export function isSupportedEquity(
  candidate: SupportedEquityCandidate,
): boolean {
  const symbol = candidate.symbol?.trim().toUpperCase();
  const assetType = candidate.assetType?.trim().toLowerCase();

  if (symbol && !SUPPORTED_SYMBOL_PATTERN.test(symbol)) {
    return false;
  }

  if (assetType && !SUPPORTED_ASSET_TYPES.has(assetType)) {
    return false;
  }

  return !UNSUPPORTED_SECURITY_NAME_PATTERNS.some((pattern) =>
    pattern.test(candidate.name),
  );
}
