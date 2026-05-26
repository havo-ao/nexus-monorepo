import { Body, Controller, Post, Logger } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import {
  notificationTemplateDescriptions,
  SendNotificationDto,
} from '../dto/send-notification.dto';
import { NotificationsService } from '../services/notifications.service';

@ApiTags('notifications')
@Controller({
  path: 'notifications',
  version: '1',
})
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('email')
  @ApiOperation({
    summary: 'Send email notification',
    description:
      'Sends a personalized Nexus transactional email using a supported templateName value.',
  })
  @ApiBody({
    type: SendNotificationDto,
    description: [
      'Supported templateName values:',
      `LOGIN_SUCCESS: ${notificationTemplateDescriptions.LOGIN_SUCCESS}`,
      `LOGIN_FAILED: ${notificationTemplateDescriptions.LOGIN_FAILED}`,
      `USER_REGISTERED: ${notificationTemplateDescriptions.USER_REGISTERED}`,
    ].join(' '),
    examples: {
      loginSuccess: {
        summary: 'Successful sign-in alert',
        value: {
          templateName: 'LOGIN_SUCCESS',
          email: 'user@nexus.local',
          name: 'Jane',
          surname: 'Doe',
          username: 'jdoe',
          occurredAt: '2026-05-23T20:15:00.000Z',
        },
      },
      loginFailed: {
        summary: 'Lockout after repeated failed sign-in attempts',
        value: {
          templateName: 'LOGIN_FAILED',
          email: 'user@nexus.local',
          name: 'Jane',
          surname: 'Doe',
          username: 'jdoe',
          occurredAt: '2026-05-23T20:20:00.000Z',
        },
      },
      userRegistered: {
        summary: 'New investor welcome email',
        value: {
          templateName: 'USER_REGISTERED',
          email: 'new.user@nexus.local',
          name: 'New',
          surname: 'User',
          username: 'newuser',
          occurredAt: '2026-05-23T19:45:00.000Z',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: NotificationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid notification payload' })
  @ApiInternalServerErrorResponse({
    description: 'Email notifications API failed or is not configured',
  })
  sendEmailNotification(
    @Body() dto: SendNotificationDto,
  ): Promise<NotificationResponseDto> {
    this.logger.log(`Incoming email notification request: ${JSON.stringify(dto)}`);
    return this.notificationsService.sendEmailNotification(dto);
  }
}
