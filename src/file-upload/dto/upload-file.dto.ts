import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  folder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  fileName?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }

    return value === 'true';
  })
  @IsBoolean()
  makePublic?: boolean;

  @IsOptional()
  @IsString()
  provider?: string;
}
