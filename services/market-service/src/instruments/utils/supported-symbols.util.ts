export const DEFAULT_ALPHA_VANTAGE_SUPPORTED_SYMBOLS = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'META',
  'NVDA',
  'TSLA',
  'AMD',
  'NFLX',
  'DIS',
  'JPM',
  'KO',
  'PEP',
  'WMT',
  'COST',
  'V',
  'MA',
  'UNH',
  'JNJ',
  'PG',
] as const;

export function resolveSupportedSymbols(): Set<string> {
  return new Set(DEFAULT_ALPHA_VANTAGE_SUPPORTED_SYMBOLS);
}

export function isSupportedSymbol(symbol: string): boolean {
  return resolveSupportedSymbols().has(symbol.trim().toUpperCase());
}
