import { Injectable } from '@nestjs/common';
import type {
  BrokerOrderResponse,
  ExternalBrokerClient,
  SendBrokerOrderCommand,
} from './external-broker.client';
import { BrokerOrderSubmissionError } from './external-broker.client';

@Injectable()
export class AlpacaBrokerClient implements ExternalBrokerClient {
  sendOrder(command: SendBrokerOrderCommand): Promise<BrokerOrderResponse> {
    const brokerName = process.env.BROKER_NAME?.trim() || 'ALPACA';
    const externalOrderId = `${brokerName.toLowerCase()}-${command.orderReference}`;
    const requestSummary = `${command.side} ${command.quantity} ${command.symbol} ${command.orderType}`;

    if (command.symbol === 'FAIL') {
      return Promise.reject(
        new BrokerOrderSubmissionError(
          brokerName,
          'FAILED',
          requestSummary,
          'Broker rejected the order submission',
        ),
      );
    }

    return Promise.resolve({
      brokerName,
      externalOrderId,
      brokerStatus: 'ACCEPTED',
      requestSummary,
      responseSummary: `Broker accepted order ${externalOrderId}`,
    });
  }
}
