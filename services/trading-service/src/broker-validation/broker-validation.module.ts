import { Module } from '@nestjs/common';
import { BrokerOrderValidationController } from './controllers/broker-order-validation.controller';
import { BROKER_ORDER_VALIDATION_REPOSITORY } from './repositories/broker-order-validation.repository';
import { InMemoryBrokerOrderValidationRepository } from './repositories/in-memory-broker-order-validation.repository';
import { TypeOrmBrokerOrderValidationRepository } from './repositories/typeorm-broker-order-validation.repository';
import { BrokerOrderValidationService } from './services/broker-order-validation.service';

const brokerOrderValidationRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryBrokerOrderValidationRepository
    : TypeOrmBrokerOrderValidationRepository;

@Module({
  controllers: [BrokerOrderValidationController],
  providers: [
    BrokerOrderValidationService,
    {
      provide: BROKER_ORDER_VALIDATION_REPOSITORY,
      useClass: brokerOrderValidationRepository,
    },
  ],
})
export class BrokerValidationModule {}
