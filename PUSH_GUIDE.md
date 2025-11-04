# 推送到 GitHub 指南

## 修复内容

本次更新修复了以下问题：

1. **install.sh** - 修复密钥生成中的换行符问题
2. **backend/Dockerfile** - 使 pnpm-lock.yaml 可选
3. **backend/.dockerignore** - 添加 Docker 忽略文件
4. **frontend/.dockerignore** - 添加 Docker 忽略文件

## 推送命令

在您的 Arch Linux 系统上执行：

```bash
# 进入项目目录（替换为您下载项目的实际路径）
cd /path/to/vela-license-manager

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 创建首次提交
git commit -m "Initial commit: VelaOS License Manager v1.0.0

- Complete backend with NestJS
- Complete frontend with Vue 3 + Vuetify 3
- Docker deployment configuration
- One-click installation script
- CLI management tool
- Full documentation"

# 重命名分支为 main
git branch -M main

# 添加远程仓库
git remote add origin git@github.com:OrPudding/Vela-License-Manager.git

# 推送到 GitHub
git push -u origin main
```

## 一键执行

```bash
cd /path/to/vela-license-manager && \
git init && \
git add . && \
git commit -m "Initial commit: VelaOS License Manager v1.0.0" && \
git branch -M main && \
git remote add origin git@github.com:OrPudding/Vela-License-Manager.git && \
git push -u origin main
```

## 推送后测试

推送完成后，在服务器上重新运行安装脚本：

```bash
# 清理旧的安装
sudo rm -rf /opt/vela-license-manager

# 重新运行安装脚本
sudo bash install.sh
```

## 注意事项

1. 确保您的 SSH 密钥已添加到 GitHub
2. 如果提示冲突，可能需要先 `git pull` 或使用 `git push -f`
3. 推送完成后，访问 https://github.com/OrPudding/Vela-License-Manager 确认
