import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check compliance-service health' })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        service: 'compliance-service',
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      service: 'compliance-service',
    };
  }
}
