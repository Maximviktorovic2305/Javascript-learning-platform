import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  Equals,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { LEGAL_VERSION } from './legal.constants';
export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @IsString() @MinLength(10) @MaxLength(128) password!: string;
}
export class RegisterDto extends LoginDto {
  @Equals(true)
  termsAccepted!: boolean;
  @Equals(true)
  dataConsent!: boolean;
  @Equals(LEGAL_VERSION)
  legalVersion!: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/\S/)
  name!: string;
}
