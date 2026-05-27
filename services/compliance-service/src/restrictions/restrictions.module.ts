import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { RestrictionsController } from './controllers/restrictions.controller';
import { RestrictionsRepository } from './repositories/restrictions.repository';
import { RestrictionsService } from './services/restrictions.service';

@Module({
  imports: [AuditModule],
  controllers: [RestrictionsController],
  providers: [RestrictionsRepository, RestrictionsService],
  exports: [RestrictionsService],
})
export class RestrictionsModule {}
