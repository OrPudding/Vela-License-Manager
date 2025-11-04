import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto, AdjustBalanceDto } from './dto/update-license.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LicensesService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
  ) {}

  /**
   * 创建许可证（手动创建，不依赖支付）
   */
  async create(createLicenseDto: CreateLicenseDto, adminId: number) {
    // 检查产品是否存在
    const product = await this.prisma.product.findUnique({
      where: { id: createLicenseDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 查找或创建用户
    let user = await this.prisma.user.findUnique({
      where: { deviceId: createLicenseDto.deviceId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { deviceId: createLicenseDto.deviceId },
      });
    }

    // 创建许可证
    const license = await this.prisma.license.create({
      data: {
        productId: createLicenseDto.productId,
        userId: user.id,
        licenseType: createLicenseDto.licenseType,
        status: 'active',
        expiresAt: createLicenseDto.expiresAt ? new Date(createLicenseDto.expiresAt) : null,
        deviceInfo: createLicenseDto.deviceInfo || {},
        activatedAt: new Date(),
      },
      include: {
        product: true,
        user: true,
      },
    });

    // 记录操作日志
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'license:create',
        details: {
          licenseId: license.id,
          deviceId: createLicenseDto.deviceId,
          productId: createLicenseDto.productId,
        },
      },
    });

    return license;
  }

  /**
   * 查询许可证列表（支持复杂筛选）
   */
  async findAll(query: {
    productId?: number;
    status?: string;
    licenseType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { productId, status, licenseType, search, page = 1, limit = 20 } = query;

    const where: Prisma.LicenseWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (status) {
      where.status = status;
    }

    if (licenseType) {
      where.licenseType = licenseType;
    }

    if (search) {
      where.OR = [
        { user: { deviceId: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [licenses, total] = await Promise.all([
      this.prisma.license.findMany({
        where,
        include: {
          product: true,
          user: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.license.count({ where }),
    ]);

    return {
      data: licenses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取单个许可证详情
   */
  async findOne(id: number) {
    const license = await this.prisma.license.findUnique({
      where: { id },
      include: {
        product: true,
        user: {
          include: {
            orders: true,
          },
        },
      },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    return license;
  }

  /**
   * 更新许可证信息（支持修改设备ID、状态、到期时间等）
   */
  async update(id: number, updateLicenseDto: UpdateLicenseDto, adminId: number) {
    const license = await this.findOne(id);

    const updateData: Prisma.LicenseUpdateInput = {};

    // 如果修改了设备ID，需要更新或创建对应的用户
    if (updateLicenseDto.deviceId && updateLicenseDto.deviceId !== license.user.deviceId) {
      let user = await this.prisma.user.findUnique({
        where: { deviceId: updateLicenseDto.deviceId },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: { deviceId: updateLicenseDto.deviceId },
        });
      }

      updateData.user = { connect: { id: user.id } };
    }

    if (updateLicenseDto.status) {
      updateData.status = updateLicenseDto.status;
    }

    if (updateLicenseDto.expiresAt !== undefined) {
      updateData.expiresAt = updateLicenseDto.expiresAt ? new Date(updateLicenseDto.expiresAt) : null;
    }

    if (updateLicenseDto.licenseType) {
      updateData.licenseType = updateLicenseDto.licenseType;
    }

    const updatedLicense = await this.prisma.license.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
        user: true,
      },
    });

    // 记录操作日志
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'license:update',
        details: {
          licenseId: id,
          changes: updateLicenseDto,
        },
      },
    });

    return updatedLicense;
  }

  /**
   * 吊销许可证
   */
  async revoke(id: number, adminId: number) {
    const license = await this.prisma.license.update({
      where: { id },
      data: { status: 'revoked' },
      include: {
        product: true,
        user: true,
      },
    });

    // 记录操作日志
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'license:revoke',
        details: {
          licenseId: id,
          deviceId: license.user.deviceId,
        },
      },
    });

    return license;
  }

  /**
   * 删除许可证
   */
  async remove(id: number, adminId: number) {
    const license = await this.findOne(id);

    await this.prisma.license.delete({
      where: { id },
    });

    // 记录操作日志
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'license:delete',
        details: {
          licenseId: id,
          deviceId: license.user.deviceId,
        },
      },
    });

    return { message: 'License deleted successfully' };
  }

  /**
   * 调整用户余额
   */
  async adjustBalance(userId: number, adjustBalanceDto: AdjustBalanceDto, adminId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const amount = parseFloat(adjustBalanceDto.amount);
    const newBalance = parseFloat(user.balance.toString()) + amount;

    if (newBalance < 0) {
      throw new BadRequestException('Insufficient balance');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    });

    // 记录操作日志
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'balance:adjust',
        details: {
          userId,
          amount: adjustBalanceDto.amount,
          reason: adjustBalanceDto.reason,
          oldBalance: user.balance.toString(),
          newBalance: newBalance.toString(),
        },
      },
    });

    return updatedUser;
  }

  /**
   * 批量延期
   */
  async batchExtend(licenseIds: number[], days: number, adminId: number) {
    const licenses = await this.prisma.license.findMany({
      where: { id: { in: licenseIds } },
    });

    const updates = licenses.map((license) => {
      const currentExpiry = license.expiresAt || new Date();
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + days);

      return this.prisma.license.update({
        where: { id: license.id },
        data: { expiresAt: newExpiry },
      });
    });

    await Promise.all(updates);

    // 记录操作日志
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'license:batch_extend',
        details: {
          licenseIds,
          days,
        },
      },
    });

    return { message: `Extended ${licenseIds.length} licenses by ${days} days` };
  }
}
