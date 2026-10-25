import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SessionGuard } from '../auth/session.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { LearningService } from './learning.service';
import { CodeDto, QuizDto } from './learning.dto';
@Controller('learning')
@UseGuards(SessionGuard)
export class LearningController {
  constructor(private readonly learning: LearningService) {}
  @Post(':id/read') read(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.learning.read(req.user.id, id);
  }
  @Post(':id/quiz')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  quiz(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: QuizDto,
  ) {
    return this.learning.quiz(req.user.id, id, dto.answers);
  }
  @Post(':id/submit')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  code(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CodeDto,
  ) {
    return this.learning.code(req.user.id, id, dto);
  }
  @Post(':id/examples')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  examples(@Param('id') id: string, @Body() dto: CodeDto) {
    return this.learning.examples(id, dto);
  }
}
