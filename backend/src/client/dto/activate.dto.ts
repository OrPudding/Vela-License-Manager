import { IsString, IsInt, IsOptional, IsObject } from 'class-validator';

export class ActivateDeviceDto {
  @IsInt()
  productId: number;

  @IsString()
  deviceId: string;

  @IsOptional()
  @IsObject()
  deviceInfo?: any;
}
