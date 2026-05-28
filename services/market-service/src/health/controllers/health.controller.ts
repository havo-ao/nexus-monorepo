import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check market-service health' })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        service: 'market-service',
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      service: 'market-service',
    };
  }
}
