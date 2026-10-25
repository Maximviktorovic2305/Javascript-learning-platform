import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
export class QuizDto {
  @IsArray({ message: 'Передайте ответы на вопросы.' })
  @ArrayMinSize(3, { message: 'Ответьте на все вопросы.' })
  @ArrayMaxSize(5, { message: 'Передано слишком много ответов.' })
  @IsInt({ each: true, message: 'Выберите один из предложенных ответов.' })
  @Min(0, { each: true, message: 'Ответьте на все вопросы.' })
  @Max(2, { each: true, message: 'Выберите один из предложенных ответов.' })
  answers!: number[];
}
export class CodeDto {
  @IsString({ message: 'Введите код решения.' })
  @MinLength(1, { message: 'Введите код решения.' })
  @MaxLength(20000, {
    message: 'Решение должно содержать не более 20 000 символов.',
  })
  code!: string;
  @IsIn(['javascript', 'typescript'], {
    message: 'Выберите JavaScript или TypeScript.',
  })
  language!: 'javascript' | 'typescript';
}
