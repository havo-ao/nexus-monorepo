export interface HoldingSnapshot {
  quantity: number;
  totalInvested: number;
}

export interface ExecutedBuySnapshot {
  quantity: number;
  executionPrice: number;
}

export interface ExecutedSellSnapshot {
  quantity: number;
}

export interface HoldingAfterBuy {
  quantity: number;
  totalInvested: number;
  averageBuyPrice: number;
}

export interface HoldingAfterSell {
  quantity: number;
  totalInvested: number;
  averageBuyPrice: number;
  closed: boolean;
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

export function calculateHoldingAfterSell(
  currentHolding: HoldingSnapshot,
  executedSell: ExecutedSellSnapshot,
): HoldingAfterSell {
  const remainingQuantity = currentHolding.quantity - executedSell.quantity;

  if (remainingQuantity === 0) {
    return {
      quantity: 0,
      totalInvested: 0,
      averageBuyPrice: 0,
      closed: true,
    };
  }

  const averageBuyPrice =
    currentHolding.totalInvested / currentHolding.quantity;
  const soldCostBasis = roundMoney(averageBuyPrice * executedSell.quantity);
  const totalInvested = roundMoney(
    currentHolding.totalInvested - soldCostBasis,
  );

  return {
    quantity: remainingQuantity,
    totalInvested,
    averageBuyPrice: roundMoney(totalInvested / remainingQuantity),
    closed: false,
  };
}

export function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export function toMoneyString(value: number): string {
  return roundMoney(value).toFixed(2);
}
