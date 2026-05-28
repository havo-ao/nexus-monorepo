import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportQueryDto } from '../dto/report-query.dto';
import { ReportsService } from '../services/reports.service';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('reports')
@Controller({ path: 'reports', version: '1' })
@Roles('ADMIN', 'LEGAL_USER')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('operational')
  @ApiOperation({ summary: 'Generate an operational compliance report' })
  @ApiOkResponse({ description: 'Operational report summary' })
  operational(@Query() query: ReportQueryDto) {
    return this.reportsService.operational(query);
  }

  @Get('regulatory')
  @ApiOperation({ summary: 'Generate a regulatory compliance report' })
  @ApiOkResponse({ description: 'Regulatory report summary' })
  regulatory(@Query() query: ReportQueryDto) {
    return this.reportsService.regulatory(query);
  }

  @Get('executive')
  @ApiOperation({ summary: 'Generate an executive compliance report' })
  @ApiOkResponse({ description: 'Executive report summary' })
  executive(@Query() query: ReportQueryDto) {
    return this.reportsService.executive(query);
  }
}
