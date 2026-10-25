import { IsUrl, MaxLength } from 'class-validator';
export class SubmitProjectDto {
  @IsUrl(
    { protocols: ['https'], require_protocol: true, require_tld: true },
    { message: 'Введите полную HTTPS-ссылку на репозиторий или демо.' },
  )
  @MaxLength(2000, {
    message: 'Ссылка должна содержать не более 2000 символов.',
  })
  url!: string;
}
