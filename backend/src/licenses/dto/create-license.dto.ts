import { IsString, IsInt, IsEnum, IsOptional, IsDateString, IsJSON } from 'class-validator';

export enum LicenseType {
  PERMANENT = 'permanent',
  SUBSCRIPTION = 'subscription',
  BALANCE = 'balance',
}

export class CreateLicenseDto {
  @IsInt()
  productId: number;

  @IsString()
  deviceId: string;

  @IsEnum(LicenseType)
  licenseType: LicenseType;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsJSON()
  deviceInfo?: any;
}
