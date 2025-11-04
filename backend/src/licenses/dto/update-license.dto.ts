import { IsString, IsEnum, IsOptional, IsDateString, IsDecimal } from 'class-validator';

export enum LicenseStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export class UpdateLicenseDto {
  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsEnum(LicenseStatus)
  status?: LicenseStatus;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  licenseType?: string;
}

export class AdjustBalanceDto {
  @IsDecimal()
  amount: string; // 正数为增加，负数为减少

  @IsString()
  reason: string; // 调整原因
}
