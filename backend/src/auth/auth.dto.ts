import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  Equals,
  IsOptional,
  IsTimeZone,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { LEGAL_VERSION } from './legal.constants';
export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Введите корректный адрес электронной почты.' })
  @MaxLength(254, {
    message: 'Электронная почта должна содержать не более 254 символов.',
  })
  email!: string;
  @IsString({ message: 'Введите пароль.' })
  @MinLength(10, { message: 'Пароль должен содержать не менее 10 символов.' })
  @MaxLength(128, { message: 'Пароль должен содержать не более 128 символов.' })
  password!: string;
}
export class RegisterDto extends LoginDto {
  @IsOptional()
  @IsTimeZone({ message: 'Выберите существующий часовой пояс.' })
  timezone?: string;
  @Equals(true, { message: 'Примите условия использования.' })
  termsAccepted!: boolean;
  @Equals(true, { message: 'Дайте согласие на обработку персональных данных.' })
  dataConsent!: boolean;
  @Equals(LEGAL_VERSION, {
    message: 'Обновите страницу и ознакомьтесь с текущей версией документов.',
  })
  legalVersion!: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Введите имя.' })
  @MinLength(2, { message: 'Имя должно содержать не менее 2 символов.' })
  @MaxLength(60, { message: 'Имя должно содержать не более 60 символов.' })
  @Matches(/\S/, { message: 'Имя не должно состоять только из пробелов.' })
  name!: string;
}
