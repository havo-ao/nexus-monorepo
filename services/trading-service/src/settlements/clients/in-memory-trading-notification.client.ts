import { Injectable } from '@nestjs/common';
import type {
  SendTradingNotificationCommand,
  TradingNotificationClient,
  TradingNotificationResult,
} from './trading-notification.client';

@Injectable()
export class InMemoryTradingNotificationClient implements TradingNotificationClient {
  readonly notifications: SendTradingNotificationCommand[] = [];

  sendOrderExecuted(
    command: SendTradingNotificationCommand,
  ): Promise<TradingNotificationResult> {
    this.notifications.push(command);
    return Promise.resolve({
      delivered: Boolean(command.recipient),
      recipientEmail: command.recipient?.email,
      reason: command.recipient
        ? undefined
        : 'Notification recipient was not provided',
    });
  }
}
