import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AfdianWebhookPayload } from './dto/afdian.dto';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * 接收爱发电 Webhook
   */
  @Public()
  @Post('afdian')
  async handleAfdianWebhook(@Body() payload: AfdianWebhookPayload) {
    return this.webhookService.handleAfdianWebhook(payload);
  }

  /**
   * 主动查询爱发电订单（需要登录）
   */
  @UseGuards(JwtAuthGuard)
  @Get('afdian/sync')
  async syncAfdianOrders(@Query('page') page?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    return this.webhookService.queryAfdianOrders(pageNum);
  }
}
