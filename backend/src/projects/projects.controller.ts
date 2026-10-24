import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SessionGuard } from '../auth/session.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ProjectsService } from './projects.service';
import { SubmitProjectDto } from './projects.dto';
@Controller('projects')
@UseGuards(SessionGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}
  @Get('submissions') submissions(@Req() req: AuthenticatedRequest) {
    return this.projects.submissions(req.user.id);
  }
  @Post(':id/submit')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  submit(
    @Req() req: AuthenticatedRequest,
    @Param('id') projectId: string,
    @Body() dto: SubmitProjectDto,
  ) {
    return this.projects.submit(req.user.id, projectId, dto.url);
  }
}
