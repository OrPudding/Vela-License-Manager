import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ClientService } from './client.service';
import { Public } from '../auth/decorators/public.decorator';
import { ActivateDeviceDto } from './dto/activate.dto';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  /**
   * 设备激活
   */
  @Public()
  @Post('activate')
  async activate(@Body() dto: ActivateDeviceDto) {
    return this.clientService.activateDevice(dto);
  }

  /**
   * 获取云控配置
   */
  @Public()
  @Get('config/:productId')
  async getConfig(@Param('productId', ParseIntPipe) productId: number) {
    return this.clientService.getCloudConfig(productId);
  }

  /**
   * 获取公告
   */
  @Public()
  @Get('announcements/:productId')
  async getAnnouncements(@Param('productId', ParseIntPipe) productId: number) {
    return this.clientService.getAnnouncements(productId);
  }

  /**
   * 获取历史公钥
   */
  @Public()
  @Get('public-key/:keyId')
  async getPublicKey(@Param('keyId', ParseIntPipe) keyId: number) {
    return this.clientService.getPublicKey(keyId);
  }

  /**
   * 获取当前活跃公钥
   */
  @Public()
  @Get('public-key')
  async getCurrentPublicKey() {
    return this.clientService.getCurrentPublicKey();
  }
}
