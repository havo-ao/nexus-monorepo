import { Test, TestingModule } from '@nestjs/testing';
import { BrokerOrderExecution } from '../entities/broker-order-execution.entity';
import { BrokerExecutionService } from '../services/broker-execution.service';
import { BrokerExecutionController } from './broker-execution.controller';

describe('BrokerExecutionController', () => {
  let controller: BrokerExecutionController;
  let service: jest.Mocked<Pick<BrokerExecutionService, 'sendOrderToBroker'>>;

  beforeEach(async () => {
    service = {
      sendOrderToBroker: jest
        .fn()
        .mockResolvedValue(
          new BrokerOrderExecution(
            '1',
            'order-reference',
            '101',
            'BUY',
            'MARKET',
            'SENT_TO_BROKER',
            'AAPL',
            1,
            'alpaca-order-reference',
            'ACCEPTED',
            'ALPACA',
            '2026-05-26T14:30:00.000Z',
          ),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrokerExecutionController],
      providers: [
        {
          provide: BrokerExecutionService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(BrokerExecutionController);
  });

  it('delegates broker submission to the service', async () => {
    await expect(controller.send('order-reference')).resolves.toMatchObject({
      orderReference: 'order-reference',
      status: 'SENT_TO_BROKER',
      externalOrderId: 'alpaca-order-reference',
    });
    expect(service.sendOrderToBroker).toHaveBeenCalledWith('order-reference');
  });
});
