import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SessionGuard } from '../auth/session.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { AuthService } from '../auth/auth.service';
import { ProfileService } from './profile.service';
import { PasswordDto, ProfileDto, TimezoneDto } from './profile.dto';
@Controller('profile')
@UseGuards(SessionGuard)
export class ProfileController {
  constructor(
    private readonly profile: ProfileService,
    private readonly auth: AuthService,
  ) {}
  @Get('progress') progress(@Req() req: AuthenticatedRequest) {
    return this.profile.progress(req.user.id, req.user.timezone);
  }
  @Patch() update(@Req() req: AuthenticatedRequest, @Body() dto: ProfileDto) {
    return this.profile.update(req.user.id, dto);
  }
  @Patch('timezone')
  syncTimezone(@Req() req: AuthenticatedRequest, @Body() dto: TimezoneDto) {
    return this.profile.syncTimezone(req.user.id, dto.timezone);
  }
  @Post('password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  password(@Req() req: AuthenticatedRequest, @Body() dto: PasswordDto) {
    return this.auth.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.nextPassword,
    );
  }
}
