import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import {
  notificationTemplateNames,
  notificationTemplateDescriptions,
  type NotificationTemplateName,
  SendNotificationDto,
} from '../dto/send-notification.dto';
import { NotificationResponseDto } from '../dto/notification-response.dto';

interface MailTemplateDefinition {
  subject: string;
  template: string;
  headline: string;
  intro: string;
  supportMessage: string;
}

const mailTemplateDefinitions: Record<
  NotificationTemplateName,
  MailTemplateDefinition
> = {
  LOGIN_SUCCESS: {
    subject: 'Nexus: successful sign-in to your investment account',
    template: 'login-success',
    headline: 'Sign-in confirmed',
    intro:
      'We detected a successful sign-in to your Nexus account. You can now monitor your portfolio, review the market, and continue buying stocks.',
    supportMessage:
      'If you do not recognize this sign-in, change your password and contact the Nexus security team immediately.',
  },
  LOGIN_FAILED: {
    subject: 'Nexus: multiple failed sign-in attempts detected',
    template: 'login-failed',
    headline: 'Your Nexus access was protected',
    intro:
      'We detected 5 failed sign-in attempts in less than 10 minutes on your Nexus account. For your security, you must wait 10 minutes before trying again.',
    supportMessage:
      'If you do not recognize this activity, change your password and contact the Nexus security team as soon as possible.',
  },
  USER_REGISTERED: {
    subject: 'Nexus: your account is ready to invest',
    template: 'user-registered',
    headline: 'Welcome to Nexus',
    intro:
      'Your registration was completed successfully. You can now explore listed companies, follow the market, and get ready to buy stocks from one platform.',
    supportMessage:
      'Our compliance team will support you so your investment experience on Nexus remains safe and transparent.',
  },
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendEmailNotification(
    dto: SendNotificationDto,
  ): Promise<NotificationResponseDto> {
    const normalizedDto = this.normalizeDto(dto ?? {});
    this.validateMailerConfiguration();
    const mailTemplate = this.getMailTemplateDefinition(
      normalizedDto.templateName,
    );

    try {
      await this.mailerService.sendMail({
        to: normalizedDto.email,
        from: this.getMailFrom(),
        subject: mailTemplate.subject,
        template: mailTemplate.template,
        context: this.buildTemplateContext(normalizedDto, mailTemplate),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown mailer error';
      throw new InternalServerErrorException(
        `email delivery failed: ${message}`,
      );
    }

    return {
      success: true,
      message: 'Email notification sent successfully.',
      templateName: normalizedDto.templateName,
    };
  }

  private getMailTemplateDefinition(
    templateName: NotificationTemplateName,
  ): MailTemplateDefinition {
    const mailTemplate = mailTemplateDefinitions[templateName];

    if (!mailTemplate) {
      throw new BadRequestException('unsupported templateName value');
    }

    return mailTemplate;
  }

  private buildTemplateContext(
    dto: SendNotificationDto,
    mailTemplate: MailTemplateDefinition,
  ): Record<string, string> {
    const fullName = `${dto.name} ${dto.surname}`.trim();

    return {
      appName: 'Nexus',
      previewText: notificationTemplateDescriptions[dto.templateName],
      headline: mailTemplate.headline,
      intro: mailTemplate.intro,
      fullName,
      username: dto.username,
      recipientEmail: dto.email,
      occurredAt: dto.occurredAt,
      occurredAtDisplay: this.formatEventDate(dto.occurredAt),
      supportMessage: mailTemplate.supportMessage,
      year: new Date().getFullYear().toString(),
    };
  }

  private getMailFrom(): string {
    const from = process.env.MAIL_FROM;

    if (!from || !from.trim()) {
      throw new InternalServerErrorException('MAIL_FROM is not configured');
    }

    return from.trim();
  }

  private validateMailerConfiguration(): void {
    const mailUser = process.env.MAIL_USER;
    const mailPass = process.env.MAIL_PASS;

    if (!mailUser || !mailUser.trim()) {
      throw new InternalServerErrorException('MAIL_USER is not configured');
    }

    if (!mailPass || !mailPass.trim()) {
      throw new InternalServerErrorException('MAIL_PASS is not configured');
    }
  }

  private normalizeDto(dto: SendNotificationDto): SendNotificationDto {
    if (dto === null || typeof dto !== 'object' || Array.isArray(dto)) {
      throw new BadRequestException('request body must be a JSON object');
    }

    const templateName = this.normalizeTemplateName(dto.templateName);

    return {
      templateName,
      email: this.normalizeNonEmptyString(dto.email, 'email'),
      name: this.normalizeNonEmptyString(dto.name, 'name'),
      surname: this.normalizeNonEmptyString(dto.surname, 'surname'),
      username: this.normalizeNonEmptyString(dto.username, 'username'),
      occurredAt: this.normalizeIsoDateTime(dto.occurredAt, 'occurredAt'),
    };
  }

  private normalizeTemplateName(value: unknown): NotificationTemplateName {
    if (typeof value !== 'string') {
      this.logger.error(`Validation failed: templateName must be a string, but got ${typeof value}`);
      throw new BadRequestException('templateName must be a string');
    }

    const normalized = value.trim().toUpperCase() as NotificationTemplateName;

    if (!notificationTemplateNames.includes(normalized)) {
      this.logger.error(`Validation failed: unsupported templateName '${normalized}'`);
      throw new BadRequestException(
        `templateName must be one of: ${notificationTemplateNames.join(', ')}`,
      );
    }

    return normalized;
  }

  private normalizeNonEmptyString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      this.logger.error(`Validation failed: ${field} must be a non-empty string, but got ${typeof value}`);
      throw new BadRequestException(`${field} must be a non-empty string`);
    }

    return value.trim();
  }

  private normalizeIsoDateTime(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      this.logger.error(`Validation failed: ${field} must be a non-empty string, but got ${typeof value}`);
      throw new BadRequestException(`${field} must be a non-empty string`);
    }

    const normalized = value.trim();
    const parsedDate = new Date(normalized);

    if (Number.isNaN(parsedDate.getTime())) {
      this.logger.error(`Validation failed: ${field} must be a valid ISO 8601 datetime string, but got '${normalized}'`);
      throw new BadRequestException(
        `${field} must be a valid ISO 8601 datetime string`,
      );
    }

    return parsedDate.toISOString();
  }

  private formatEventDate(occurredAt: string): string {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(new Date(occurredAt));
  }
}
