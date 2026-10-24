import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
@Module({
  imports: [AuthModule, CatalogModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
