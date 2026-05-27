import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuditEventResponseDto } from '../dto/audit-event-response.dto';
import { CreateAuditEventDto } from '../dto/create-audit-event.dto';
import { AuditEventFilters } from '../entities/audit-event.entity';
import { AuditService } from '../services/audit.service';

@ApiTags('audit')
@Controller({ path: 'audit/events', version: '1' })
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  @ApiOperation({ summary: 'Record an auditable compliance event' })
  @ApiCreatedResponse({ type: AuditEventResponseDto })
  record(@Body() dto: CreateAuditEventDto) {
    return this.auditService.record(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Query auditable compliance events' })
  @ApiOkResponse({ type: AuditEventResponseDto, isArray: true })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'sourceService', required: false })
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'correlationId', required: false })
  @ApiQuery({ name: 'critical', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  find(@Query() query: Record<string, string>) {
    const filters: AuditEventFilters = {
      actorId: query.actorId,
      sourceService: query.sourceService,
      eventType: query.eventType,
      entityType: query.entityType,
      entityId: query.entityId,
      correlationId: query.correlationId,
      from: query.from,
      to: query.to,
      critical: query.critical ? query.critical === 'true' : undefined,
    };
    return this.auditService.find(filters);
  }
}
