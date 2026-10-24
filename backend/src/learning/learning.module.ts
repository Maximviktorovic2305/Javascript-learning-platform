import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { LearningService } from './learning.service';
import { LearningController } from './learning.controller';
import { RunnerService } from './runner.service';
@Module({
  imports: [AuthModule, CatalogModule],
  providers: [LearningService, RunnerService],
  controllers: [LearningController],
})
export class LearningModule {}
