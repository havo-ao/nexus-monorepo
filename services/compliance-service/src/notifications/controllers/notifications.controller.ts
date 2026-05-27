import { Body, Controller, Get, Post, Query, Logger } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationAttemptResponseDto } from '../dto/notification-attempt-response.dto';
import { NotificationEventDto } from '../dto/notification-event.dto';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import {
  notificationTemplateDescriptions,
  SendNotificationDto,
} from '../dto/send-notification.dto';
import {
  NotificationAttemptFilters,
  NotificationCategory,
  NotificationDeliveryStatus,
} from '../entities/notification-attempt.entity';
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
      'Sends a personalized Acciones ElBosque transactional email using a supported templateName value.',
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
    this.logger.log(
      `Incoming email notification request: ${JSON.stringify(dto)}`,
    );
    return this.notificationsService.sendEmailNotification(dto);
  }

  @Post('events')
  @ApiOperation({
    summary: 'Process a compliance notification event',
    description:
      'Records notification evidence and sends an email when recipient data is provided.',
  })
  @ApiCreatedResponse({ type: NotificationAttemptResponseDto })
  processEvent(@Body() dto: NotificationEventDto) {
    return this.notificationsService.processNotificationEvent(dto);
  }

  @Get('attempts')
  @ApiOperation({ summary: 'Query notification delivery attempts' })
  @ApiOkResponse({ type: NotificationAttemptResponseDto, isArray: true })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'deliveryStatus', required: false })
  @ApiQuery({ name: 'recipientEmail', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  findAttempts(@Query() query: Record<string, string>) {
    const filters: NotificationAttemptFilters = {
      category: query.category as NotificationCategory | undefined,
      deliveryStatus: query.deliveryStatus as
        | NotificationDeliveryStatus
        | undefined,
      recipientEmail: query.recipientEmail,
      entityId: query.entityId,
    };
    return this.notificationsService.findAttempts(filters);
  }
}
