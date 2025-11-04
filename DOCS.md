# VelaOS License Manager - 完整文档

## 项目概述

VelaOS License Manager 是一个通用的、开源的小米 VelaOS 智能穿戴快应用后台验证管理系统。它为开发者提供了完整的许可证管理、支付集成、云控配置和用户管理功能。

### 核心特性

- ✅ **安全的许可证管理** - 基于 RSA 签名的设备激活机制
- ✅ **爱发电支付集成** - 完整的 Webhook 和 API 支持
- ✅ **多管理员权限系统** - 基于 RBAC 的细粒度权限控制
- ✅ **多产品支持** - 在一个后台管理多个快应用
- ✅ **云控配置** - 无需发版即可动态调整应用行为
- ✅ **公告系统** - 向用户推送重要通知
- ✅ **Material Design 3** - 现代化的管理界面
- ✅ **一键部署** - 完整的安装脚本和 OOBE 引导
- ✅ **命令行工具** - 强大的系统管理 CLI
- ✅ **完整的数据修正能力** - 可随时修改设备ID、余额、到期时间等

---

## 技术架构

### 后端技术栈

- **框架**: NestJS 10.x (TypeScript)
- **数据库**: PostgreSQL 15.x
- **ORM**: Prisma 5.x
- **认证**: JWT + Passport
- **加密**: Node.js Crypto (RSA-2048, AES-256-GCM)

### 前端技术栈

- **框架**: Vue 3 (Composition API)
- **UI 库**: Vuetify 3 (Material Design 3)
- **构建工具**: Vite 5.x
- **状态管理**: Pinia
- **HTTP 客户端**: Axios

### 部署方案

- **容器化**: Docker + Docker Compose
- **Web 服务器**: Nginx (前端静态文件)
- **进程管理**: Docker 容器自动重启

---

## 数据库设计

### 核心表结构

#### 1. 管理员和权限 (RBAC)

- `admins` - 管理员账户
- `roles` - 角色定义
- `permissions` - 权限点定义
- `admin_roles` - 管理员-角色关联
- `role_permissions` - 角色-权限关联

#### 2. 产品和用户

- `products` - 产品信息（支持多产品）
- `users` - 用户信息（设备ID、邮箱、余额等）

#### 3. 许可证管理

- `licenses` - 许可证记录
  - 支持三种类型：永久 (permanent)、订阅 (subscription)、余额 (balance)
  - 状态：待激活 (pending)、已激活 (active)、已过期 (expired)、已吊销 (revoked)

#### 4. 支付和订单

- `orders` - 爱发电订单记录
  - 存储完整的订单数据（rawData 字段）
  - 幂等性保证（outTradeNo 唯一索引）

#### 5. 内容管理

- `announcements` - 公告通知

#### 6. 安全和审计

- `encryption_keys` - RSA 密钥对历史记录
- `audit_logs` - 操作审计日志
- `system_settings` - 系统配置

---

## 核心功能详解

### 1. 许可证管理

#### 手动创建许可证

管理员可以不依赖支付，直接为设备创建许可证。适用于：
- 内部测试
- 用户补偿
- 特殊授权

```typescript
// API: POST /api/licenses
{
  "productId": 1,
  "deviceId": "device_abc_123",
  "licenseType": "permanent",
  "expiresAt": null  // 永久许可证
}
```

#### 修改许可证信息

支持修改的字段：
- **设备ID** - 用户填写错误时可更正
- **许可证类型** - permanent/subscription/balance 之间切换
- **到期时间** - 延期或缩短有效期
- **状态** - active/expired/revoked

```typescript
// API: PATCH /api/licenses/:id
{
  "deviceId": "corrected_device_id",
  "expiresAt": "2025-12-31T23:59:59Z",
  "status": "active"
}
```

#### 调整用户余额

```typescript
// API: POST /api/users/:id/adjust-balance
{
  "amount": "100.00",  // 正数为充值，负数为扣除
  "reason": "补偿用户"
}
```

#### 批量操作

```typescript
// API: POST /api/licenses/batch-extend
{
  "licenseIds": [1, 2, 3, 4, 5],
  "days": 30  // 延长30天
}
```

### 2. 密钥管理

#### 密钥生成和存储

- **OOBE 时自动生成** - 首次启动时生成第一对密钥
- **加密存储** - 私钥使用 AES-256-GCM 加密后存入数据库
- **历史记录** - 所有历史密钥都被保留，确保旧版客户端兼容

#### 重新生成密钥对

在 Web UI 的"系统设置" -> "安全设置"页面：

1. 点击"重新生成密钥对"按钮
2. 阅读警告信息
3. 输入确认短语："确认重新生成密钥对"
4. 系统生成新密钥，旧密钥标记为 `isActive: false` 但保留
5. 将新公钥更新到客户端应用代码中

#### 客户端验签流程

```javascript
// 客户端伪代码
function verifyLicense(license) {
  // 1. 使用内置的最新公钥验签
  if (verify(license.payload, license.signature, BUILTIN_PUBLIC_KEY)) {
    return true;
  }
  
  // 2. 如果失败，从服务器获取历史公钥
  const keyId = license.payload.keyId;
  const historicalKey = await fetch(`/api/client/public-key/${keyId}`);
  
  // 3. 使用历史公钥再次验签
  return verify(license.payload, license.signature, historicalKey);
}
```

### 3. 爱发电集成

#### Webhook 接收

```
POST /api/webhook/afdian
```

- **签名验证** - 使用爱发电公钥验证请求真实性
- **幂等性** - 通过 `outTradeNo` 防止重复处理
- **异步处理** - 立即返回 `{"ec": 200}`，后台异步创建许可证

#### API 主动查询

管理员可在后台点击"从爱发电同步订单"：
- 调用 `query-order` 接口
- 支持按日期范围筛选
- 自动创建缺失的许可证

### 4. 云控配置

每个产品都有独立的 `cloudConfig` 字段（JSON 格式）：

```json
{
  "features": {
    "newFeature": true,
    "betaMode": false
  },
  "apiEndpoint": "https://api.example.com",
  "uiTheme": "dark"
}
```

客户端启动时请求：
```
GET /api/client/config/:productId
```

### 5. 操作审计

所有敏感操作都会记录在 `audit_logs` 表：

- 创建/修改/删除许可证
- 调整余额
- 重新生成密钥
- 修改系统设置

日志包含：
- 操作者（adminId）
- 操作类型（action）
- 详细信息（details JSON）
- IP 地址
- 时间戳

---

## 部署指南

### 系统要求

- Ubuntu 20.04 / 22.04 或更高版本
- 2GB+ RAM
- 10GB+ 磁盘空间
- Root 权限

### 一键安装

```bash
# 下载安装脚本
curl -sSL https://raw.githubusercontent.com/your-repo/vela-license-manager/main/install.sh -o install.sh

# 运行安装
sudo bash install.sh
```

安装脚本会自动：
1. 安装 Docker 和 Docker Compose
2. 下载源代码到 `/opt/vela-license-manager`
3. 生成随机的数据库密码和加密密钥
4. 构建并启动所有服务
5. 创建 CLI 工具软链接

### OOBE 引导

安装完成后，访问 `http://your-server-ip:3000` 开始 OOBE：

#### 步骤 1: 创建超级管理员
- 输入用户名和密码
- 此账户拥有最高权限

#### 步骤 2: 配置爱发电
- 输入爱发电 User ID
- 输入爱发电 API Token
- 系统会调用 `ping` 接口验证凭据

#### 步骤 3: 设置 Webhook
- 复制显示的 Webhook URL
- 粘贴到爱发电开发者后台

#### 步骤 4: 完成
- 系统自动生成 RSA 密钥对
- 显示公钥，供客户端使用
- 重定向到登录页面

---

## CLI 工具使用

### 基本命令

```bash
# 查看服务状态
vela-cli status

# 启动/停止/重启服务
vela-cli start
vela-cli stop
vela-cli restart

# 查看日志
vela-cli logs backend
vela-cli logs frontend
vela-cli logs postgres
```

### 管理员操作

```bash
# 重置超级管理员密码
vela-cli reset-password admin new_password_123
```

### 数据库备份和恢复

```bash
# 备份数据库
vela-cli backup
# 备份文件保存在: /opt/vela-license-manager/backups/

# 恢复数据库
vela-cli restore /opt/vela-license-manager/backups/backup_20250105_120000.sql.gz
```

### 系统更新

```bash
# 更新到最新版本
vela-cli update
```

---

## 客户端集成示例

### 1. 激活流程

```javascript
// 客户端代码示例（VelaOS 快应用）

// 1. 获取设备ID
const deviceId = device.getDeviceId();

// 2. 向服务器请求激活
async function activate() {
  const response = await fetch('https://your-server.com/api/client/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: 'YOUR_PRODUCT_ID',
      deviceId: deviceId,
      deviceInfo: {
        model: device.getModel(),
        osVersion: device.getOSVersion(),
        // ... 其他设备信息
      }
    })
  });
  
  const { license } = await response.json();
  
  // 3. 保存许可证到本地
  storage.set('license.json', JSON.stringify(license));
}

// 4. 验证许可证
function verifyLicense() {
  const license = JSON.parse(storage.get('license.json'));
  const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`;
  
  // 使用内置的公钥验签
  const payload = JSON.stringify(license.payload);
  return crypto.verify(payload, license.signature, publicKey);
}
```

### 2. 云控配置获取

```javascript
async function getCloudConfig() {
  const response = await fetch('https://your-server.com/api/client/config/YOUR_PRODUCT_ID');
  const config = await response.json();
  
  // 根据配置调整应用行为
  if (config.features.newFeature) {
    enableNewFeature();
  }
}
```

---

## 安全最佳实践

1. **定期更换密钥** - 建议每年重新生成一次密钥对
2. **备份数据库** - 使用 `vela-cli backup` 定期备份
3. **限制 SSH 访问** - 仅允许特定 IP 访问服务器
4. **启用 HTTPS** - 在生产环境中使用 Nginx 反向代理并配置 SSL 证书
5. **监控日志** - 定期检查 `audit_logs` 表，发现异常操作

---

## 常见问题

### Q: 如何添加新的管理员？

A: 登录后台，进入"管理员管理"页面，点击"添加管理员"。

### Q: 用户填错了设备ID怎么办？

A: 在"许可证管理"页面找到对应的许可证，点击"编辑"，修改设备ID字段。

### Q: 如何给用户补偿余额？

A: 在"用户管理"页面找到用户，点击"调整余额"，输入金额和原因。

### Q: 密钥轮换后旧版客户端还能用吗？

A: 可以。系统保留了历史密钥，旧版客户端会自动从服务器获取对应的历史公钥进行验签。

---

## 开发路线图

- [ ] 支持更多支付渠道（微信支付、支付宝）
- [ ] 数据统计和可视化仪表盘
- [ ] 邮件通知功能
- [ ] 多语言支持
- [ ] API 文档自动生成（Swagger）
- [ ] 单元测试和集成测试

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 开源协议

MIT License

---

## 联系方式

- GitHub: https://github.com/your-repo/vela-license-manager
- Issues: https://github.com/your-repo/vela-license-manager/issues
