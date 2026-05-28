import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller({ version: '1' })
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Portfolio service health check' })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        service: 'portfolio-service',
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      service: 'portfolio-service',
    };
  }
}
