import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { ActivateDeviceDto } from './dto/activate.dto';

@Injectable()
export class ClientService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
  ) {}

  /**
   * 设备激活接口
   */
  async activateDevice(dto: ActivateDeviceDto) {
    // 查找或创建用户
    let user = await this.prisma.user.findUnique({
      where: { deviceId: dto.deviceId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          deviceId: dto.deviceId,
        },
      });
    }

    // 查找该用户的有效许可证
    const license = await this.prisma.license.findFirst({
      where: {
        userId: user.id,
        productId: dto.productId,
        status: {
          in: ['pending', 'active'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!license) {
      throw new NotFoundException('No valid license found for this device');
    }

    // 如果许可证是待激活状态，激活它
    if (license.status === 'pending') {
      await this.prisma.license.update({
        where: { id: license.id },
        data: {
          status: 'active',
          activatedAt: new Date(),
          deviceInfo: dto.deviceInfo || {},
        },
      });
    }

    // 获取当前活跃的密钥对
    const activeKey = await this.prisma.encryptionKey.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeKey) {
      throw new BadRequestException('No encryption key configured');
    }

    // 解密私钥
    const privateKey = this.cryptoService.decryptPrivateKey(activeKey.privateKey);

    // 构建许可证载荷
    const payload = {
      licenseId: license.id,
      productId: dto.productId,
      deviceId: dto.deviceId,
      licenseType: license.licenseType,
      expiresAt: license.expiresAt?.toISOString() || null,
      issuedAt: new Date().toISOString(),
      keyId: activeKey.id,
    };

    // 签名
    const payloadStr = JSON.stringify(payload);
    const signature = this.cryptoService.signData(payloadStr, privateKey);

    // 更新许可证的 keyId
    await this.prisma.license.update({
      where: { id: license.id },
      data: { keyId: activeKey.id },
    });

    return {
      payload,
      signature,
      publicKey: activeKey.publicKey,
    };
  }

  /**
   * 获取产品的云控配置
   */
  async getCloudConfig(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      productId: product.id,
      config: product.cloudConfig,
    };
  }

  /**
   * 获取产品的公告列表
   */
  async getAnnouncements(productId: number) {
    const announcements = await this.prisma.announcement.findMany({
      where: {
        OR: [{ productId }, { productId: null }],
        isPublished: true,
        publishAt: {
          lte: new Date(),
        },
      },
      orderBy: {
        publishAt: 'desc',
      },
      take: 10,
    });

    return announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      publishAt: a.publishAt,
    }));
  }

  /**
   * 获取历史公钥（用于验证旧版签名）
   */
  async getPublicKey(keyId: number) {
    const key = await this.prisma.encryptionKey.findUnique({
      where: { id: keyId },
    });

    if (!key) {
      throw new NotFoundException('Key not found');
    }

    return {
      keyId: key.id,
      publicKey: key.publicKey,
      createdAt: key.createdAt,
    };
  }

  /**
   * 获取当前活跃的公钥
   */
  async getCurrentPublicKey() {
    const activeKey = await this.prisma.encryptionKey.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeKey) {
      throw new NotFoundException('No active key found');
    }

    return {
      keyId: activeKey.id,
      publicKey: activeKey.publicKey,
    };
  }
}
