# VelaOS License Manager

> 通用的小米 VelaOS 智能穿戴快应用后台验证管理系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 项目简介

VelaOS License Manager 是一个开源的、生产级的许可证管理系统，专为小米 VelaOS 智能穿戴快应用开发者设计。它提供了完整的用户认证、支付集成、许可证管理和云控配置功能。

### 核心特性

- 🔐 **安全的许可证管理** - 基于 RSA-2048 签名的设备激活机制
- 💰 **爱发电支付集成** - 完整的 Webhook 和 API 支持
- 👥 **多管理员权限系统** - 基于 RBAC 的细粒度权限控制
- 📦 **多产品支持** - 在一个后台管理多个快应用
- ☁️ **云控配置** - 无需发版即可动态调整应用行为
- 📢 **公告系统** - 向用户推送重要通知
- 🎨 **Material Design 3** - 现代化的管理界面
- 🚀 **一键部署** - 完整的安装脚本和 OOBE 引导
- 🛠️ **命令行工具** - 强大的系统管理 CLI

## 技术栈

### 后端
- **NestJS** 10.x - 企业级 Node.js 框架
- **PostgreSQL** 15.x - 关系型数据库
- **Prisma** 5.x - 现代化 ORM
- **JWT** - 身份认证
- **bcrypt** - 密码加密

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **Vuetify 3** - Material Design 3 组件库
- **Vue Router** - 路由管理
- **Pinia** - 状态管理
- **Axios** - HTTP 客户端

### 部署
- **Docker** - 容器化
- **Docker Compose** - 多容器编排
- **Nginx** - Web 服务器

## 快速开始

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

### 手动安装

```bash
# 1. 克隆仓库
git clone https://github.com/your-repo/vela-license-manager.git
cd vela-license-manager

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库密码、JWT 密钥等

# 3. 启动服务
docker-compose up -d

# 4. 访问 Web UI
# http://your-server-ip:3000
```

### OOBE 引导

首次访问系统时，会自动进入 OOBE（开箱即用体验）引导：

1. **创建超级管理员** - 设置用户名和密码
2. **配置爱发电** - 输入 User ID 和 API Token
3. **创建第一个产品** - 设置产品名称和描述
4. **完成** - 获取 RSA 公钥，用于客户端集成

## 使用指南

### CLI 命令行工具

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

# 重置管理员密码
vela-cli reset-password admin new_password_123

# 备份数据库
vela-cli backup

# 恢复数据库
vela-cli restore /path/to/backup.sql.gz

# 更新系统
vela-cli update
```

### 客户端集成

#### 1. 设备激活

```javascript
// 客户端代码示例（VelaOS 快应用）
const deviceId = device.getDeviceId()

const response = await fetch('https://your-server.com/api/client/activate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 1,
    deviceId: deviceId,
    deviceInfo: {
      model: device.getModel(),
      osVersion: device.getOSVersion(),
    }
  })
})

const { payload, signature, publicKey } = await response.json()

// 保存许可证到本地
storage.set('license.json', JSON.stringify({ payload, signature }))
```

#### 2. 验证许可证

```javascript
function verifyLicense() {
  const license = JSON.parse(storage.get('license.json'))
  const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`
  
  const payload = JSON.stringify(license.payload)
  return crypto.verify(payload, license.signature, publicKey)
}
```

#### 3. 获取云控配置

```javascript
const response = await fetch('https://your-server.com/api/client/config/1')
const { config } = await response.json()

// 根据配置调整应用行为
if (config.features.newFeature) {
  enableNewFeature()
}
```

## 项目结构

```
vela-license-manager/
├── backend/                 # NestJS 后端
│   ├── src/
│   │   ├── auth/           # 认证模块
│   │   ├── oobe/           # OOBE 引导模块
│   │   ├── licenses/       # 许可证管理模块
│   │   ├── webhook/        # 爱发电 Webhook
│   │   ├── client/         # 客户端接口
│   │   ├── crypto/         # 加密服务
│   │   └── prisma/         # 数据库服务
│   ├── prisma/
│   │   └── schema.prisma   # 数据库模型
│   └── Dockerfile
├── frontend/                # Vue 3 前端
│   ├── src/
│   │   ├── views/          # 页面组件
│   │   ├── layouts/        # 布局组件
│   │   ├── stores/         # Pinia 状态管理
│   │   ├── router/         # 路由配置
│   │   └── plugins/        # Vuetify 配置
│   └── Dockerfile
├── docker-compose.yml       # Docker 编排
├── install.sh               # 一键安装脚本
├── cli.sh                   # CLI 管理工具
├── DOCS.md                  # 详细文档
└── README.md                # 本文件
```

## 功能列表

### 已完成功能

- [x] 用户认证（JWT）
- [x] RBAC 权限系统
- [x] OOBE 引导流程
- [x] 许可证 CRUD
- [x] 爱发电 Webhook 集成
- [x] 客户端激活接口
- [x] 云控配置
- [x] 公告系统
- [x] 密钥管理（支持历史密钥）
- [x] 操作审计日志
- [x] 一键安装脚本
- [x] CLI 管理工具
- [x] Material Design 3 界面

### 开发中功能

- [ ] 数据统计和可视化仪表盘
- [ ] 邮件通知
- [ ] API 文档（Swagger）
- [ ] 单元测试和集成测试

## 安全最佳实践

1. **定期更换密钥** - 建议每年重新生成一次密钥对
2. **备份数据库** - 使用 `vela-cli backup` 定期备份
3. **限制 SSH 访问** - 仅允许特定 IP 访问服务器
4. **启用 HTTPS** - 在生产环境中使用 SSL 证书
5. **监控日志** - 定期检查操作日志，发现异常行为

## 常见问题

### Q: 如何重置超级管理员密码？

```bash
vela-cli reset-password admin new_password_123
```

### Q: 如何备份数据库？

```bash
vela-cli backup
# 备份文件保存在: /opt/vela-license-manager/backups/
```

### Q: 密钥轮换后旧版客户端还能用吗？

可以。系统保留了历史密钥，旧版客户端会自动从服务器获取对应的历史公钥进行验签。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 开源协议

MIT License

## 联系方式

- GitHub: https://github.com/your-repo/vela-license-manager
- Issues: https://github.com/your-repo/vela-license-manager/issues

## 致谢

感谢所有为本项目做出贡献的开发者！
