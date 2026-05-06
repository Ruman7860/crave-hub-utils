import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class PresignUrlDto {
  @IsString()
  key: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(60)
  @Max(604800) // 7 days maximum
  expiresIn?: number;
}
