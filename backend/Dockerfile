FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json ./

# 安装依赖
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

# 复制依赖文件
COPY package.json ./

# 只安装生产依赖
RUN pnpm install --prod

# 从构建阶段复制编译后的代码和 Prisma Client
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/prisma ./prisma

# 暴露端口
EXPOSE 3001

# 启动命令（包含数据库迁移）
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main"]
