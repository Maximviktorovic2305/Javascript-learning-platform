import { IsUrl, MaxLength } from 'class-validator';
export class SubmitProjectDto {
  @IsUrl({ protocols: ['https'], require_protocol: true, require_tld: true })
  @MaxLength(2000)
  url!: string;
}
