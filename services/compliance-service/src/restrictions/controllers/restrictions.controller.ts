import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UpsertRestrictionDto } from '../dto/upsert-restriction.dto';
import { ValidateOperationDto } from '../dto/validate-operation.dto';
import { RestrictionsService } from '../services/restrictions.service';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('restrictions')
@Controller({ path: 'restrictions', version: '1' })
export class RestrictionsController {
  constructor(private readonly restrictionsService: RestrictionsService) {}

  @Post('traders/:traderId')
  @Roles('ADMIN', 'LEGAL_USER')
  @ApiOperation({ summary: 'Create or update a trader compliance status' })
  @ApiCreatedResponse({ description: 'Compliance restriction updated' })
  upsert(
    @Param('traderId') traderId: string,
    @Body() dto: UpsertRestrictionDto,
  ) {
    return this.restrictionsService.upsert(traderId, dto);
  }

  @Get('traders/:traderId')
  @Roles('ADMIN', 'LEGAL_USER', 'TRADER')
  @ApiOperation({ summary: 'Get trader compliance restriction status' })
  @ApiOkResponse({ description: 'Compliance restriction status' })
  findByTraderId(@Param('traderId') traderId: string) {
    return this.restrictionsService.findByTraderId(traderId);
  }

  @Post('validate-operation')
  @ApiOperation({ summary: 'Validate whether a trader operation is allowed' })
  @ApiCreatedResponse({ description: 'Operation compliance decision' })
  validateOperation(@Body() dto: ValidateOperationDto) {
    return this.restrictionsService.validateOperation(dto);
  }
}
