import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import {
  CreateSuperAdminDto,
  ConfigureAfdianDto,
  CreateFirstProductDto,
} from './dto/oobe.dto';

@Injectable()
export class OobeService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private configService: ConfigService,
  ) {}

  /**
   * 检查 OOBE 是否已完成
   */
  async checkOobeStatus() {
    const oobeCompleted = this.configService.get<string>('OOBE_COMPLETED') === 'true';

    if (oobeCompleted) {
      return { completed: true };
    }

    // 检查是否已有管理员
    const adminCount = await this.prisma.admin.count();

    return {
      completed: false,
      hasAdmin: adminCount > 0,
    };
  }

  /**
   * 步骤 1: 创建超级管理员
   */
  async createSuperAdmin(dto: CreateSuperAdminDto) {
    // 检查是否已有管理员
    const existingAdmin = await this.prisma.admin.findFirst();

    if (existingAdmin) {
      throw new ConflictException('Super admin already exists');
    }

    // 创建超级管理员角色
    let superAdminRole = await this.prisma.role.findUnique({
      where: { name: 'super_admin' },
    });

    if (!superAdminRole) {
      superAdminRole = await this.prisma.role.create({
        data: {
          name: 'super_admin',
          description: 'Super Administrator with full permissions',
        },
      });

      // 创建所有权限
      const permissions = [
        { action: 'admin:create', description: 'Create administrators' },
        { action: 'admin:read', description: 'View administrators' },
        { action: 'admin:update', description: 'Update administrators' },
        { action: 'admin:delete', description: 'Delete administrators' },
        { action: 'product:create', description: 'Create products' },
        { action: 'product:read', description: 'View products' },
        { action: 'product:update', description: 'Update products' },
        { action: 'product:delete', description: 'Delete products' },
        { action: 'license:create', description: 'Create licenses' },
        { action: 'license:read', description: 'View licenses' },
        { action: 'license:update', description: 'Update licenses' },
        { action: 'license:delete', description: 'Delete licenses' },
        { action: 'user:read', description: 'View users' },
        { action: 'user:update', description: 'Update users' },
        { action: 'settings:read', description: 'View settings' },
        { action: 'settings:update', description: 'Update settings' },
        { action: 'logs:read', description: 'View audit logs' },
      ];

      for (const perm of permissions) {
        const permission = await this.prisma.permission.create({
          data: perm,
        });

        await this.prisma.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        });
      }
    }

    // 创建超级管理员账户
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const admin = await this.prisma.admin.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        isActive: true,
      },
    });

    // 分配超级管理员角色
    await this.prisma.adminRole.create({
      data: {
        adminId: admin.id,
        roleId: superAdminRole.id,
      },
    });

    return {
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    };
  }

  /**
   * 步骤 2: 配置爱发电
   */
  async configureAfdian(dto: ConfigureAfdianDto) {
    // 验证爱发电凭据
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const params = {
        user_id: dto.userId,
      };
      const paramsStr = JSON.stringify(params);
      const sign = require('crypto')
        .createHash('md5')
        .update(`${dto.token}${paramsStr}${timestamp}`)
        .digest('hex');

      const response = await axios.post('https://afdian.com/api/open/ping', {
        user_id: dto.userId,
        params: paramsStr,
        ts: timestamp,
        sign: sign,
      });

      if (response.data.ec !== 200) {
        throw new BadRequestException('Invalid Afdian credentials');
      }
    } catch (error) {
      throw new BadRequestException('Failed to verify Afdian credentials: ' + error.message);
    }

    // 保存到系统设置
    await this.prisma.systemSetting.upsert({
      where: { key: 'afdian_user_id' },
      update: { value: dto.userId },
      create: { key: 'afdian_user_id', value: dto.userId },
    });

    await this.prisma.systemSetting.upsert({
      where: { key: 'afdian_token' },
      update: { value: dto.token },
      create: { key: 'afdian_token', value: dto.token },
    });

    // 生成 Webhook URL
    const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3001');
    const webhookUrl = `${baseUrl}/api/webhook/afdian`;

    return {
      success: true,
      webhookUrl,
    };
  }

  /**
   * 步骤 3: 创建第一个产品并生成密钥对
   */
  async createFirstProduct(dto: CreateFirstProductDto) {
    // 生成 RSA 密钥对
    const { publicKey, privateKey } = this.cryptoService.generateKeyPair();

    // 加密私钥
    const encryptedPrivateKey = this.cryptoService.encryptPrivateKey(privateKey);

    // 保存密钥对
    const keyPair = await this.prisma.encryptionKey.create({
      data: {
        publicKey,
        privateKey: encryptedPrivateKey,
        isActive: true,
      },
    });

    // 创建产品
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description || '',
        cloudConfig: {},
      },
    });

    return {
      success: true,
      product: {
        id: product.id,
        name: product.name,
      },
      keyPair: {
        id: keyPair.id,
        publicKey: keyPair.publicKey,
      },
    };
  }

  /**
   * 完成 OOBE
   */
  async completeOobe() {
    // 标记 OOBE 已完成
    await this.prisma.systemSetting.upsert({
      where: { key: 'oobe_completed' },
      update: { value: 'true' },
      create: { key: 'oobe_completed', value: 'true' },
    });

    return {
      success: true,
      message: 'OOBE completed successfully',
    };
  }
}
