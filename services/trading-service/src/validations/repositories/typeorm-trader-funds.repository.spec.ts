import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { FundsValidationEvent } from '../entities/funds-validation-event.entity';
import { TypeOrmTraderFundsRepository } from './typeorm-trader-funds.repository';

describe('TypeOrmTraderFundsRepository', () => {
  let repository: TypeOrmTraderFundsRepository;
  let dataSource: jest.Mocked<Pick<DataSource, 'transaction'>>;
  let walletRepository: jest.Mocked<
    Pick<Repository<Wallet>, 'findOne' | 'save'>
  >;
  let eventRepository: jest.Mocked<
    Pick<Repository<FundsValidationEvent>, 'save'>
  >;

  beforeEach(async () => {
    walletRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    eventRepository = {
      save: jest.fn(),
    };

    const entityManager = {
      getRepository: jest.fn((entity: unknown) =>
        entity === Wallet ? walletRepository : eventRepository,
      ),
    } as unknown as EntityManager;

    dataSource = {
      transaction: jest.fn(<T>(callback: (manager: EntityManager) => T) =>
        callback(entityManager),
      ),
    } as unknown as jest.Mocked<Pick<DataSource, 'transaction'>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmTraderFundsRepository,
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmTraderFundsRepository>(
      TypeOrmTraderFundsRepository,
    );
  });

  it('reserves funds and stores an approval event when the wallet has enough available balance', async () => {
    walletRepository.findOne.mockResolvedValue({
      traderId: '10',
      availableBalance: '1250.75',
      reservedBalance: '100.00',
    } as Wallet);

    const result = await repository.reserveBuyFunds('10', 250.75);

    expect(result).toEqual({
      approved: true,
      traderId: '10',
      availableAmount: 1250.75,
      requiredAmount: 250.75,
      reservedAmount: 350.75,
    });
    expect(walletRepository.findOne.mock.calls[0]).toEqual([
      {
        where: { traderId: '10' },
        lock: { mode: 'pessimistic_write' },
      },
    ]);
    expect(walletRepository.save.mock.calls[0][0]).toMatchObject({
      availableBalance: '1000.00',
      reservedBalance: '350.75',
    });
    expect(eventRepository.save.mock.calls[0][0]).toMatchObject({
      traderId: '10',
      validationType: 'BUY_FUNDS_RESERVATION',
      approved: true,
      requiredAmount: '250.75',
      availableAmount: '1250.75',
      reservedAmount: '350.75',
      reason: undefined,
    });
  });

  it('stores a rejection event and does not update the wallet when funds are insufficient', async () => {
    walletRepository.findOne.mockResolvedValue({
      traderId: '10',
      availableBalance: '100.00',
      reservedBalance: '25.00',
    } as Wallet);

    const result = await repository.reserveBuyFunds('10', 250);

    expect(result).toEqual({
      approved: false,
      traderId: '10',
      availableAmount: 100,
      requiredAmount: 250,
      reservedAmount: 25,
      reason: 'Insufficient available funds',
    });
    expect(walletRepository.save.mock.calls).toHaveLength(0);
    expect(eventRepository.save.mock.calls[0][0]).toMatchObject({
      traderId: '10',
      approved: false,
      requiredAmount: '250.00',
      availableAmount: '100.00',
      reservedAmount: '25.00',
      reason: 'Insufficient available funds',
    });
  });

  it('stores a rejection event when the trader has no wallet', async () => {
    walletRepository.findOne.mockResolvedValue(null);

    const result = await repository.reserveBuyFunds('99', 10);

    expect(result).toEqual({
      approved: false,
      traderId: '99',
      availableAmount: 0,
      requiredAmount: 10,
      reservedAmount: 0,
      reason: 'Insufficient available funds',
    });
    expect(walletRepository.save.mock.calls).toHaveLength(0);
    expect(eventRepository.save.mock.calls[0][0]).toMatchObject({
      traderId: '99',
      approved: false,
      requiredAmount: '10.00',
      availableAmount: '0.00',
      reservedAmount: '0.00',
      reason: 'Insufficient available funds',
    });
  });
});
