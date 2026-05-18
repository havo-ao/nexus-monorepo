import { BadRequestException } from '@nestjs/common';

export function normalizeQuoteSymbol(symbol: string): string {
  if (typeof symbol !== 'string' || !symbol.trim()) {
    throw new BadRequestException('Symbol must be a non-empty string');
  }

  return symbol.trim().toUpperCase();
}
