import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateSuperAdminDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class ConfigureAfdianDto {
  @IsString()
  userId: string;

  @IsString()
  token: string;
}

export class CreateFirstProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
