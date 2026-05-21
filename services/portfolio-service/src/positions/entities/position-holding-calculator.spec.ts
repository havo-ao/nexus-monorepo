import {
  calculateHoldingAfterBuy,
  calculateHoldingAfterSell,
} from './position-holding-calculator';

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

describe('calculateHoldingAfterSell', () => {
  it('reduces the holding cost basis after a partial executed sell', () => {
    expect(
      calculateHoldingAfterSell(
        {
          quantity: 10,
          totalInvested: 1523.5,
        },
        {
          quantity: 4,
        },
      ),
    ).toEqual({
      quantity: 6,
      totalInvested: 914.1,
      averageBuyPrice: 152.35,
      closed: false,
    });
  });

  it('closes the holding after selling the full quantity', () => {
    expect(
      calculateHoldingAfterSell(
        {
          quantity: 10,
          totalInvested: 1523.5,
        },
        {
          quantity: 10,
        },
      ),
    ).toEqual({
      quantity: 0,
      totalInvested: 0,
      averageBuyPrice: 0,
      closed: true,
    });
  });
});
