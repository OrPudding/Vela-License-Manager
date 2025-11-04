import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { AfdianWebhookPayload, AfdianOrderData } from './dto/afdian.dto';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
  ) {}

  /**
   * 验证爱发电 Webhook 签名
   */
  private async verifyAfdianSignature(payload: any, signature: string): Promise<boolean> {
    const settings = await this.prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['afdian_user_id', 'afdian_token'],
        },
      },
    });

    const userId = settings.find((s) => s.key === 'afdian_user_id')?.value;
    const token = settings.find((s) => s.key === 'afdian_token')?.value;

    if (!userId || !token) {
      throw new BadRequestException('Afdian credentials not configured');
    }

    // 爱发电签名验证逻辑
    // 注意：实际的签名验证需要根据爱发电官方文档实现
    // 这里提供一个基本框架
    return true; // 临时返回 true，实际需要实现真实的验证逻辑
  }

  /**
   * 处理爱发电 Webhook
   */
  async handleAfdianWebhook(payload: AfdianWebhookPayload) {
    this.logger.log(`Received Afdian webhook: ${JSON.stringify(payload)}`);

    if (payload.ec !== 200) {
      throw new BadRequestException('Invalid webhook payload');
    }

    if (payload.data.type !== 'order') {
      this.logger.warn(`Unknown webhook type: ${payload.data.type}`);
      return { ec: 200, em: 'Ignored' };
    }

    const orderData = payload.data.order;

    // 检查订单是否已处理（幂等性）
    const existingOrder = await this.prisma.order.findUnique({
      where: { outTradeNo: orderData.out_trade_no },
    });

    if (existingOrder) {
      this.logger.log(`Order already processed: ${orderData.out_trade_no}`);
      return { ec: 200, em: 'Already processed' };
    }

    // 处理订单
    await this.processOrder(orderData);

    return { ec: 200, em: 'ok' };
  }

  /**
   * 处理订单并创建许可证
   */
  private async processOrder(orderData: AfdianOrderData) {
    // 查找或创建用户
    let user = await this.prisma.user.findUnique({
      where: { afdianUserId: orderData.user_id },
    });

    if (!user) {
      // 从备注中提取设备ID（如果有）
      const deviceId = orderData.remark || null;

      user = await this.prisma.user.create({
        data: {
          afdianUserId: orderData.user_id,
          deviceId: deviceId,
        },
      });
    }

    // 获取默认产品（第一个产品）
    // 实际应用中可能需要根据 plan_id 映射到不同的产品
    const product = await this.prisma.product.findFirst();

    if (!product) {
      throw new BadRequestException('No product configured');
    }

    // 创建订单记录
    const order = await this.prisma.order.create({
      data: {
        outTradeNo: orderData.out_trade_no,
        productId: product.id,
        userId: user.id,
        afdianUserId: orderData.user_id,
        planId: orderData.plan_id,
        totalAmount: parseFloat(orderData.total_amount),
        status: orderData.status,
        remark: orderData.remark,
        rawData: orderData as any,
      },
    });

    // 根据订单金额和类型创建许可证
    await this.createLicenseFromOrder(order, user, product);

    this.logger.log(`Order processed successfully: ${orderData.out_trade_no}`);
  }

  /**
   * 根据订单创建许可证
   */
  private async createLicenseFromOrder(order: any, user: any, product: any) {
    const amount = parseFloat(order.totalAmount);

    // 这里需要根据您的业务逻辑决定许可证类型
    // 示例逻辑：
    // - 金额 >= 100: 永久许可证
    // - 金额 >= 30: 1年订阅
    // - 其他: 充值余额

    if (amount >= 100) {
      // 创建永久许可证
      await this.prisma.license.create({
        data: {
          productId: product.id,
          userId: user.id,
          licenseType: 'permanent',
          status: user.deviceId ? 'active' : 'pending',
          activatedAt: user.deviceId ? new Date() : null,
        },
      });
    } else if (amount >= 30) {
      // 创建1年订阅
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await this.prisma.license.create({
        data: {
          productId: product.id,
          userId: user.id,
          licenseType: 'subscription',
          status: user.deviceId ? 'active' : 'pending',
          activatedAt: user.deviceId ? new Date() : null,
          expiresAt,
        },
      });
    } else {
      // 充值余额
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });
    }
  }

  /**
   * 主动查询爱发电订单
   */
  async queryAfdianOrders(page: number = 1) {
    const settings = await this.prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['afdian_user_id', 'afdian_token'],
        },
      },
    });

    const userId = settings.find((s) => s.key === 'afdian_user_id')?.value;
    const token = settings.find((s) => s.key === 'afdian_token')?.value;

    if (!userId || !token) {
      throw new BadRequestException('Afdian credentials not configured');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const params = {
      user_id: userId,
      page: page,
    };
    const paramsStr = JSON.stringify(params);
    const sign = crypto
      .createHash('md5')
      .update(`${token}${paramsStr}${timestamp}`)
      .digest('hex');

    try {
      const response = await axios.post('https://afdian.com/api/open/query-order', {
        user_id: userId,
        params: paramsStr,
        ts: timestamp,
        sign: sign,
      });

      if (response.data.ec !== 200) {
        throw new BadRequestException('Failed to query orders from Afdian');
      }

      // 处理每个订单
      const orders = response.data.data.list || [];
      let processedCount = 0;

      for (const orderData of orders) {
        const existing = await this.prisma.order.findUnique({
          where: { outTradeNo: orderData.out_trade_no },
        });

        if (!existing && orderData.status === 2) {
          await this.processOrder(orderData);
          processedCount++;
        }
      }

      return {
        success: true,
        total: orders.length,
        processed: processedCount,
      };
    } catch (error) {
      this.logger.error(`Failed to query Afdian orders: ${error.message}`);
      throw new BadRequestException('Failed to query orders');
    }
  }
}
