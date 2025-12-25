import { IsOptional, IsString, IsUrl, MaxLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'AwesomeRabbit',
    description: 'A new non-unique display name for the website',
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({
    example: 'rabbit-the-great',
    description: 'A unique profile URL slug. Only letters, numbers, and dashes. Must be unique.',
    maxLength: 50,
    pattern: '^[a-zA-Z0-9-]+$'
  })
  @Transform(({ value }) => (value?.trim() === '' ? null : value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9-]+$/, {
    message: 'Profile slug can only contain letters, numbers, and dashes.',
  })
  profile_slug?: string | null;
  @ApiPropertyOptional({
    example: 'A seasoned player looking for a team!',
    description: 'An updated short user description',
    maxLength: 70
  })
  @IsOptional()
  @IsString()
  @MaxLength(70)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://mynewdomain.com/path/to/profile_pic.png',
    description: 'URL to a new profile picture'
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(100)
  pfp_url?: string;

  @ApiPropertyOptional({
    example: 'https://mynewdomain.com/path/to/banner_image.png',
    description: 'URL to a new banner image'
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(100)
  banner_url?: string;
}