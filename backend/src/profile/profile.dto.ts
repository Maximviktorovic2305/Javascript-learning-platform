import { IsIn, IsInt, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
export class ProfileDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Введите имя.' })
  @MinLength(2, { message: 'Имя должно содержать не менее 2 символов.' })
  @MaxLength(60, { message: 'Имя должно содержать не более 60 символов.' })
  name!: string;
  @IsString({ message: 'Укажите часовой пояс.' })
  @MaxLength(80, {
    message: 'Часовой пояс должен содержать не более 80 символов.',
  })
  timezone!: string;
  @IsInt({ message: 'Выберите дневную цель.' })
  @IsIn([30, 50, 100], { message: 'Выберите цель: 30, 50 или 100 XP.' })
  dailyGoal!: number;
}
export class PasswordDto {
  @IsString({ message: 'Введите текущий пароль.' })
  @MinLength(10, {
    message: 'Текущий пароль должен содержать не менее 10 символов.',
  })
  @MaxLength(128, {
    message: 'Текущий пароль должен содержать не более 128 символов.',
  })
  currentPassword!: string;
  @IsString({ message: 'Введите новый пароль.' })
  @MinLength(10, {
    message: 'Новый пароль должен содержать не менее 10 символов.',
  })
  @MaxLength(128, {
    message: 'Новый пароль должен содержать не более 128 символов.',
  })
  nextPassword!: string;
}
