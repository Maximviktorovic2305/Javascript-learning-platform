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
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(5)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(2, { each: true })
  answers!: number[];
}
export class CodeDto {
  @IsString() @MinLength(1) @MaxLength(20000) code!: string;
  @IsIn(['javascript', 'typescript']) language!: 'javascript' | 'typescript';
}
