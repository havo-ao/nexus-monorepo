import { ApiProperty } from '@nestjs/swagger';

class SettlementNotificationRecipientDto {
  @ApiProperty({ example: 'andy@nexus.local' })
  email!: string;

  @ApiProperty({ example: 'Andy' })
  name!: string;

  @ApiProperty({ example: 'Trader' })
  surname!: string;

  @ApiProperty({ example: 'andytrader5' })
  username!: string;
}

export class SyncOrderSettlementDto {
  @ApiProperty({
    example: '201',
    required: false,
    description:
      'Broker or system actor that triggers the settlement synchronization.',
  })
  actorId?: string;

  @ApiProperty({
    type: SettlementNotificationRecipientDto,
    required: false,
    description:
      'Optional recipient data used to request notification delivery through compliance-service.',
  })
  notificationRecipient?: SettlementNotificationRecipientDto;
}
