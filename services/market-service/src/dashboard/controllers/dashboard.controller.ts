import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardResponseDto } from '../dto/dashboard-response.dto';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('dashboard')
@Controller({
  path: 'dashboard',
  version: '1',
})
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get market dashboard summary',
    description:
      'Historia NEX-73: entrega informacion general agregada del mercado para alimentar el dashboard principal. Trazabilidad: EC-REND-03, EC-MOD-02, ASR-19, ASR-24.',
  })
  @ApiOkResponse({ type: DashboardResponseDto })
  getDashboard(): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboard();
  }
}
