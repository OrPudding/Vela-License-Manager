import { Controller, Get, Post, Body } from '@nestjs/common';
import { OobeService } from './oobe.service';
import { Public } from '../auth/decorators/public.decorator';
import {
  CreateSuperAdminDto,
  ConfigureAfdianDto,
  CreateFirstProductDto,
} from './dto/oobe.dto';

@Controller('oobe')
export class OobeController {
  constructor(private readonly oobeService: OobeService) {}

  @Public()
  @Get('status')
  async checkStatus() {
    return this.oobeService.checkOobeStatus();
  }

  @Public()
  @Post('create-super-admin')
  async createSuperAdmin(@Body() dto: CreateSuperAdminDto) {
    return this.oobeService.createSuperAdmin(dto);
  }

  @Public()
  @Post('configure-afdian')
  async configureAfdian(@Body() dto: ConfigureAfdianDto) {
    return this.oobeService.configureAfdian(dto);
  }

  @Public()
  @Post('create-first-product')
  async createFirstProduct(@Body() dto: CreateFirstProductDto) {
    return this.oobeService.createFirstProduct(dto);
  }

  @Public()
  @Post('complete')
  async complete() {
    return this.oobeService.completeOobe();
  }
}
