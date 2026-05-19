import { calculateHoldingAfterBuy } from './position-holding-calculator';

describe('calculateHoldingAfterBuy', () => {
  it('creates a holding from the first executed buy', () => {
    expect(
      calculateHoldingAfterBuy(null, {
        quantity: 10,
        executionPrice: 152.35,
      }),
    ).toEqual({
      quantity: 10,
      totalInvested: 1523.5,
      averageBuyPrice: 152.35,
    });
  });

  it('calculates weighted average price when the holding already exists', () => {
    expect(
      calculateHoldingAfterBuy(
        {
          quantity: 10,
          totalInvested: 1523.5,
        },
        {
          quantity: 5,
          executionPrice: 180,
        },
      ),
    ).toEqual({
      quantity: 15,
      totalInvested: 2423.5,
      averageBuyPrice: 161.57,
    });
  });
});
