import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateOperationDto {
  @ApiProperty({ example: 'trader-101' })
  @IsString()
  @IsNotEmpty()
  traderId!: string;

  @ApiProperty({ example: 'CREATE_ORDER' })
  @IsString()
  @IsNotEmpty()
  operation!: string;

  @ApiProperty({ example: 'trading-service' })
  @IsString()
  @IsNotEmpty()
  sourceService!: string;
}
