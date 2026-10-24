import { IsIn, IsInt, IsString, MaxLength, MinLength } from 'class-validator';
export class ProfileDto {
  @IsString() @MinLength(2) @MaxLength(60) name!: string;
  @IsString() @MaxLength(80) timezone!: string;
  @IsInt() @IsIn([30, 50, 100]) dailyGoal!: number;
}
export class PasswordDto {
  @IsString() @MinLength(10) @MaxLength(128) currentPassword!: string;
  @IsString() @MinLength(10) @MaxLength(128) nextPassword!: string;
}
