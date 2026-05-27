import { Module } from '@nestjs/common';
import { AlpacaBrokerClient } from './clients/alpaca-broker.client';
import { EXTERNAL_BROKER_CLIENT } from './clients/external-broker.client';
import { BrokerExecutionController } from './controllers/broker-execution.controller';
import { BROKER_EXECUTION_REPOSITORY } from './repositories/broker-execution.repository';
import { InMemoryBrokerExecutionRepository } from './repositories/in-memory-broker-execution.repository';
import { TypeOrmBrokerExecutionRepository } from './repositories/typeorm-broker-execution.repository';
import { BrokerExecutionService } from './services/broker-execution.service';

const brokerExecutionRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryBrokerExecutionRepository
    : TypeOrmBrokerExecutionRepository;

@Module({
  controllers: [BrokerExecutionController],
  providers: [
    BrokerExecutionService,
    {
      provide: BROKER_EXECUTION_REPOSITORY,
      useClass: brokerExecutionRepository,
    },
    {
      provide: EXTERNAL_BROKER_CLIENT,
      useClass: AlpacaBrokerClient,
    },
  ],
})
export class ExecutionsModule {}
