import { roundMoney } from './money';

export const PLATFORM_COMMISSION_RATE_BPS = 35;
export const MINIMUM_COMMISSION_AMOUNT = 1;

export function calculatePlatformCommission(grossAmount: number): number {
  const rawCommission = roundMoney(
    (roundMoney(grossAmount) * PLATFORM_COMMISSION_RATE_BPS) / 10000,
  );
  return roundMoney(Math.max(rawCommission, MINIMUM_COMMISSION_AMOUNT));
}
