import { Injectable } from '@nestjs/common';
import type {
  SendTradingNotificationCommand,
  TradingNotificationClient,
  TradingNotificationResult,
} from './trading-notification.client';

@Injectable()
export class ComplianceNotificationClient implements TradingNotificationClient {
  async sendOrderExecuted(
    command: SendTradingNotificationCommand,
  ): Promise<TradingNotificationResult> {
    if (!command.recipient) {
      return {
        delivered: false,
        reason: 'Notification recipient was not provided',
      };
    }

    const baseUrl = process.env.NOTIFICATION_SERVICE_URL?.trim();
    if (!baseUrl) {
      return {
        delivered: false,
        recipientEmail: command.recipient.email,
        reason: 'NOTIFICATION_SERVICE_URL is not configured',
      };
    }

    try {
      const response = await fetch(
        `${baseUrl.replace(/\/+$/, '')}/api/v1/notifications/email`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            templateName: 'ORDER_EXECUTED',
            email: command.recipient.email,
            name: command.recipient.name,
            surname: command.recipient.surname,
            username: command.recipient.username,
            occurredAt: command.occurredAt,
          }),
        },
      );

      if (!response.ok) {
        return {
          delivered: false,
          recipientEmail: command.recipient.email,
          reason: `Notification service returned ${response.status}`,
        };
      }

      return {
        delivered: true,
        recipientEmail: command.recipient.email,
      };
    } catch (error) {
      return {
        delivered: false,
        recipientEmail: command.recipient.email,
        reason:
          error instanceof Error
            ? error.message
            : 'Notification service failed unexpectedly',
      };
    }
  }
}
