import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../common/database/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { LoginDto, RegisterDto } from './auth.dto';
import { publicUserSelect, SESSION_TTL } from './auth.types';
import { LEGAL_VERSION } from './legal.constants';

@Injectable()
export class AuthService {
  constructor(private readonly db: PrismaService) {}
  private digest(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
  private async session(userId: string, credentialVersion = 0) {
    const token = randomBytes(32).toString('hex');
    await this.db.$transaction([
      this.db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      this.db.session.create({
        data: {
          tokenHash: this.digest(token),
          userId,
          credentialVersion,
          expiresAt: new Date(Date.now() + SESSION_TTL),
        },
      }),
    ]);
    return token;
  }
  async register(dto: RegisterDto) {
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });
    try {
      const user = await this.db.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          timezone: dto.timezone ?? 'UTC',
          timezoneAuto: true,
          passwordHash,
          termsAcceptedAt: new Date(),
          dataConsentAt: new Date(),
          legalVersion: LEGAL_VERSION,
        },
        select: publicUserSelect,
      });
      return { user, token: await this.session(user.id) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException(
          'Не удалось создать аккаунт. Попробуйте войти.',
        );
      throw error;
    }
  }
  async login(dto: LoginDto) {
    const account = await this.db.user.findUnique({
      where: { email: dto.email },
    });
    if (!account) {
      await argon2.hash(dto.password);
      throw new UnauthorizedException('Неверная почта или пароль.');
    }
    if (!(await argon2.verify(account.passwordHash, dto.password)))
      throw new UnauthorizedException('Неверная почта или пароль.');
    const user = await this.db.user.findUniqueOrThrow({
      where: { id: account.id },
      select: publicUserSelect,
    });
    return {
      user,
      token: await this.session(user.id, account.credentialVersion),
    };
  }
  async authenticate(token: unknown) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token))
      throw new UnauthorizedException('Войдите в аккаунт.');
    const session = await this.db.session.findUnique({
      where: { tokenHash: this.digest(token) },
      include: {
        user: { select: { ...publicUserSelect, credentialVersion: true } },
      },
    });
    if (
      !session ||
      session.expiresAt.getTime() <= Date.now() ||
      session.credentialVersion !== session.user.credentialVersion
    )
      throw new UnauthorizedException('Сессия завершена. Войдите снова.');
    const { credentialVersion: _version, ...user } = session.user;
    return user;
  }
  async logout(token: unknown) {
    if (typeof token === 'string')
      await this.db.session.deleteMany({
        where: { tokenHash: this.digest(token) },
      });
  }
  async changePassword(
    userId: string,
    currentPassword: string,
    nextPassword: string,
  ) {
    const account = await this.db.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!(await argon2.verify(account.passwordHash, currentPassword)))
      throw new UnauthorizedException('Неверный текущий пароль.');
    const passwordHash = await argon2.hash(nextPassword, {
      type: argon2.argon2id,
    });
    await this.db.$transaction([
      this.db.user.update({
        where: { id: userId },
        data: { passwordHash, credentialVersion: { increment: 1 } },
      }),
      this.db.session.deleteMany({ where: { userId } }),
    ]);
    return { ok: true };
  }
}
