export const TRADING_NOTIFICATION_CLIENT = Symbol(
  'TRADING_NOTIFICATION_CLIENT',
);

export type TradingNotificationRecipient = {
  email: string;
  name: string;
  surname: string;
  username: string;
};

export type SendTradingNotificationCommand = {
  orderReference: string;
  recipient?: TradingNotificationRecipient;
  occurredAt: string;
};

export type TradingNotificationResult = {
  delivered: boolean;
  recipientEmail?: string;
  reason?: string;
};

export interface TradingNotificationClient {
  sendOrderExecuted(
    command: SendTradingNotificationCommand,
  ): Promise<TradingNotificationResult>;
}
