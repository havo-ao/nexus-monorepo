import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'node:path';
import { AuditModule } from '../audit/audit.module';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationAttemptsRepository } from './repositories/notification-attempts.repository';
import { NotificationsService } from './services/notifications.service';

@Module({
  imports: [
    ConfigModule,
    AuditModule,
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
          port: Number.parseInt(
            configService.get<string>('MAIL_PORT', '587'),
            10,
          ),
          secure:
            configService.get<string>('MAIL_SECURE', 'false').toLowerCase() ===
            'true',
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>('MAIL_FROM'),
        },
        template: {
          dir: join(process.cwd(), 'src', 'notifications', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationAttemptsRepository, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
