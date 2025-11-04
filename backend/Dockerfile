FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json ./

# 安装所有依赖（包括开发依赖）
RUN pnpm install

# 复制源代码
COPY . .

# 设置构建时的占位符环境变量（Prisma 生成客户端时需要）
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# 生成 Prisma Client
RUN pnpm prisma generate

# 构建应用
RUN pnpm build

# 生产环境镜像
FROM node:20-alpine

WORKDIR /usr/src/app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件和 Prisma schema
COPY package.json ./
COPY prisma ./prisma

# 先安装生产依赖
RUN pnpm install --prod

# 安装 prisma CLI（用于运行迁移）
RUN pnpm add prisma

# 设置环境变量
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# 生成 Prisma Client（在生产环境中）
RUN pnpm prisma generate

# 从构建阶段复制编译后的代码
COPY --from=builder /usr/src/app/dist ./dist

# 暴露端口
EXPOSE 3001

# 启动命令（包含数据库迁移）
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/src/main"]
