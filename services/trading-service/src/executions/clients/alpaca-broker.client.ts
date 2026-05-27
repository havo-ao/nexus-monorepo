import { Injectable } from '@nestjs/common';
import type {
  BrokerOrderResponse,
  ExternalBrokerClient,
  SendBrokerOrderCommand,
} from './external-broker.client';

@Injectable()
export class AlpacaBrokerClient implements ExternalBrokerClient {
  sendOrder(command: SendBrokerOrderCommand): Promise<BrokerOrderResponse> {
    const brokerName = process.env.BROKER_NAME?.trim() || 'ALPACA';
    const externalOrderId = `${brokerName.toLowerCase()}-${command.orderReference}`;

    return Promise.resolve({
      brokerName,
      externalOrderId,
      brokerStatus: 'ACCEPTED',
      requestSummary: `${command.side} ${command.quantity} ${command.symbol} ${command.orderType}`,
      responseSummary: `Broker accepted order ${externalOrderId}`,
    });
  }
}
