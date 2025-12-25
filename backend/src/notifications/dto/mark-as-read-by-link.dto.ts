import { IsNotEmpty, IsString } from 'class-validator';

export class MarkAsReadByLinkDto {
  @IsString()
  @IsNotEmpty()
  link: string;
}