export interface HoldingSnapshot {
  quantity: number;
  totalInvested: number;
}

export interface ExecutedBuySnapshot {
  quantity: number;
  executionPrice: number;
}

export interface HoldingAfterBuy {
  quantity: number;
  totalInvested: number;
  averageBuyPrice: number;
}

export function calculateHoldingAfterBuy(
  currentHolding: HoldingSnapshot | null,
  executedBuy: ExecutedBuySnapshot,
): HoldingAfterBuy {
  const currentQuantity = currentHolding?.quantity ?? 0;
  const currentInvested = currentHolding?.totalInvested ?? 0;
  const buyAmount = roundMoney(
    executedBuy.quantity * executedBuy.executionPrice,
  );
  const quantity = currentQuantity + executedBuy.quantity;
  const totalInvested = roundMoney(currentInvested + buyAmount);

  return {
    quantity,
    totalInvested,
    averageBuyPrice: roundMoney(totalInvested / quantity),
  };
}

export function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export function toMoneyString(value: number): string {
  return roundMoney(value).toFixed(2);
}
