import { ApiProperty } from '@nestjs/swagger';
import type { NotificationTemplateName } from './send-notification.dto';

export class NotificationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Email notification sent successfully.' })
  message!: string;

  @ApiProperty({ example: 'LOGIN_SUCCESS' })
  templateName!: NotificationTemplateName;
}
