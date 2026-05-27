import { Module } from '@nestjs/common';
import { AuditController } from './controllers/audit.controller';
import { AuditEventsRepository } from './repositories/audit-events.repository';
import { AuditService } from './services/audit.service';

@Module({
  controllers: [AuditController],
  providers: [AuditEventsRepository, AuditService],
  exports: [AuditService],
})
export class AuditModule {}
