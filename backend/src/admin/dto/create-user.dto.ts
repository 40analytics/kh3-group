import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  name: string;

  @IsEnum(['CEO', 'ADMIN', 'MANAGER', 'SALES'])
  role: string;

  @IsOptional()
  @IsString()
  teamName?: string; // Deprecated

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  managerId?: string;
}
