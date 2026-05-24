import { ApiProperty } from '@nestjs/swagger';

export const notificationTemplateNames = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'USER_REGISTERED',
] as const;

export type NotificationTemplateName =
  (typeof notificationTemplateNames)[number];

export const notificationTemplateDescriptions: Record<
  NotificationTemplateName,
  string
> = {
  LOGIN_SUCCESS:
    'Confirms a successful sign-in to Nexus after the user accesses the stock trading platform and reports when it happened.',
  LOGIN_FAILED:
    'Alerts the user after 5 failed sign-in attempts in less than 10 minutes and reports when the lockout event happened.',
  USER_REGISTERED:
    'Welcomes a new user after finishing registration in Nexus and reports when the account was created.',
};

export const notificationTemplateDescription = notificationTemplateNames
  .map((templateName) => `${templateName}: ${notificationTemplateDescriptions[templateName]}`)
  .join(' ');

export class SendNotificationDto {
  @ApiProperty({
    description: `Template used to define the Nexus email notification type. Possible values: ${notificationTemplateDescription}`,
    enum: notificationTemplateNames,
    enumName: 'NotificationTemplateName',
    example: 'LOGIN_SUCCESS',
  })
  templateName!: NotificationTemplateName;

  @ApiProperty({
    description: 'Recipient email address.',
    example: 'user@nexus.local',
  })
  email!: string;

  @ApiProperty({
    description: 'Recipient first name.',
    example: 'Jane',
  })
  name!: string;

  @ApiProperty({
    description: 'Recipient surname.',
    example: 'Doe',
  })
  surname!: string;

  @ApiProperty({
    description: 'Recipient username.',
    example: 'jdoe',
  })
  username!: string;

  @ApiProperty({
    description:
      'ISO 8601 timestamp indicating when the business event happened.',
    example: '2026-05-23T20:15:00.000Z',
  })
  occurredAt!: string;
}
