import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpdateStageDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  lightColor?: string;

  @IsString()
  @IsOptional()
  border?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  probability?: number;
}
