# 开发指南

本文档面向希望参与 VelaOS License Manager 开发或进行二次开发的开发者。

## 开发环境搭建

### 前置要求

- Node.js 22.x
- pnpm 10.x
- PostgreSQL 15.x
- Git

### 本地开发

#### 1. 克隆仓库

```bash
git clone https://github.com/your-repo/vela-license-manager.git
cd vela-license-manager
```

#### 2. 后端开发

```bash
cd backend

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等

# 运行数据库迁移
npx prisma migrate dev

# 启动开发服务器
pnpm run start:dev
```

后端服务将在 `http://localhost:3001` 启动。

#### 3. 前端开发

```bash
cd frontend

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置 API 地址

# 启动开发服务器
pnpm run dev
```

前端服务将在 `http://localhost:5173` 启动。

## 项目架构

### 后端架构

```
backend/src/
├── auth/               # 认证模块
│   ├── strategies/     # Passport 策略
│   ├── guards/         # 守卫
│   ├── decorators/     # 装饰器
│   └── dto/            # 数据传输对象
├── oobe/               # OOBE 引导
├── licenses/           # 许可证管理
├── webhook/            # Webhook 处理
├── client/             # 客户端接口
├── crypto/             # 加密服务
├── prisma/             # 数据库服务
└── main.ts             # 应用入口
```

### 前端架构

```
frontend/src/
├── views/              # 页面组件
├── layouts/            # 布局组件
├── components/         # 可复用组件
├── stores/             # Pinia 状态管理
├── router/             # 路由配置
├── plugins/            # 插件配置
└── main.ts             # 应用入口
```

## 数据库

### Prisma 工作流

```bash
# 修改 schema.prisma 后，创建迁移
npx prisma migrate dev --name your_migration_name

# 生成 Prisma Client
npx prisma generate

# 查看数据库
npx prisma studio
```

### 数据库设计原则

1. 所有表都有 `id`、`createdAt`、`updatedAt` 字段
2. 使用 `@db.Text` 存储 JSON 数据
3. 敏感数据（如私钥）必须加密存储
4. 外键关系使用 `onDelete: Cascade` 或 `SetNull`

## API 开发

### 创建新模块

```bash
cd backend
npx nest g module your-module
npx nest g service your-module
npx nest g controller your-module
```

### DTO 验证

使用 `class-validator` 进行输入验证：

```typescript
import { IsString, IsInt, Min } from 'class-validator';

export class CreateItemDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  productId: number;
}
```

### 权限控制

使用 `@RequirePermissions` 装饰器：

```typescript
@RequirePermissions('license:create')
@Post()
async create(@Body() dto: CreateLicenseDto) {
  // ...
}
```

## 前端开发

### 创建新页面

1. 在 `src/views/` 创建 Vue 组件
2. 在 `src/router/index.ts` 添加路由
3. 在 `src/layouts/DefaultLayout.vue` 添加导航项

### 状态管理

使用 Pinia 创建 store：

```typescript
// src/stores/licenses.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLicensesStore = defineStore('licenses', () => {
  const licenses = ref([])

  const fetchLicenses = async () => {
    // API 调用
  }

  return { licenses, fetchLicenses }
})
```

### API 调用

使用 Axios：

```typescript
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const response = await axios.get(`${API_URL}/api/licenses`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
```

## 测试

### 后端测试

```bash
cd backend

# 单元测试
pnpm run test

# E2E 测试
pnpm run test:e2e

# 测试覆盖率
pnpm run test:cov
```

### 前端测试

```bash
cd frontend

# 单元测试
pnpm run test:unit

# E2E 测试
pnpm run test:e2e
```

## 代码规范

### TypeScript

- 使用严格模式
- 避免使用 `any`，优先使用 `unknown`
- 为所有函数添加返回类型

### 命名规范

- 文件名：kebab-case（`user-service.ts`）
- 类名：PascalCase（`UserService`）
- 变量/函数：camelCase（`getUserById`）
- 常量：UPPER_SNAKE_CASE（`MAX_RETRIES`）

### Git 提交规范

使用 Conventional Commits：

```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具链更新
```

## 构建和部署

### 构建 Docker 镜像

```bash
# 构建后端
docker build -t vela-license-backend ./backend

# 构建前端
docker build -t vela-license-frontend ./frontend
```

### 使用 Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 调试技巧

### 后端调试

在 VS Code 中使用 `.vscode/launch.json`：

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to NestJS",
  "port": 9229,
  "restart": true
}
```

启动调试：

```bash
pnpm run start:debug
```

### 前端调试

使用 Vue DevTools 浏览器扩展。

## 常见问题

### Q: Prisma Client 生成失败

```bash
# 删除 node_modules 和 pnpm-lock.yaml
rm -rf node_modules pnpm-lock.yaml
pnpm install
npx prisma generate
```

### Q: 端口冲突

修改 `.env` 文件中的 `PORT` 配置。

### Q: CORS 错误

检查后端 `main.ts` 中的 CORS 配置，确保允许前端域名。

## 贡献流程

1. Fork 项目
2. 创建特性分支
3. 编写代码和测试
4. 提交 Pull Request
5. 等待代码审查

## 资源链接

- [NestJS 文档](https://docs.nestjs.com/)
- [Vue 3 文档](https://vuejs.org/)
- [Vuetify 3 文档](https://vuetifyjs.com/)
- [Prisma 文档](https://www.prisma.io/docs)
