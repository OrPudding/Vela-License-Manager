#!/bin/bash

# VelaOS License Manager - CLI 管理工具

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目目录
PROJECT_DIR="/opt/vela-license-manager"

# 切换到项目目录
cd "$PROJECT_DIR" 2>/dev/null || {
    echo -e "${RED}错误: 找不到项目目录 $PROJECT_DIR${NC}"
    echo "请确保系统已正确安装"
    exit 1
}

# 显示帮助信息
show_help() {
    cat << EOF
VelaOS License Manager - 命令行管理工具

用法: vela-cli <命令> [参数]

可用命令:
  status              显示所有服务的运行状态
  start               启动所有服务
  stop                停止所有服务
  restart             重启所有服务
  logs [service]      查看日志 (service: backend, frontend, postgres)
  reset-password      重置超级管理员密码
  backup              备份数据库
  restore <file>      从备份文件恢复数据库
  update              更新系统到最新版本
  version             显示系统版本信息

示例:
  vela-cli status
  vela-cli logs backend
  vela-cli reset-password admin newpassword123
  vela-cli backup

EOF
}

# 显示服务状态
show_status() {
    echo -e "${BLUE}=== 服务状态 ===${NC}"
    docker-compose ps
}

# 启动服务
start_services() {
    echo -e "${BLUE}正在启动服务...${NC}"
    docker-compose up -d
    echo -e "${GREEN}服务已启动${NC}"
}

# 停止服务
stop_services() {
    echo -e "${BLUE}正在停止服务...${NC}"
    docker-compose stop
    echo -e "${GREEN}服务已停止${NC}"
}

# 重启服务
restart_services() {
    echo -e "${BLUE}正在重启服务...${NC}"
    docker-compose restart
    echo -e "${GREEN}服务已重启${NC}"
}

# 查看日志
show_logs() {
    local service="${1:-backend}"
    echo -e "${BLUE}=== $service 日志 ===${NC}"
    docker-compose logs -f "$service"
}

# 重置管理员密码
reset_password() {
    local username="${1}"
    local new_password="${2}"
    
    if [ -z "$username" ] || [ -z "$new_password" ]; then
        echo -e "${RED}错误: 用法: vela-cli reset-password <用户名> <新密码>${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}警告: 即将重置用户 '$username' 的密码${NC}"
    read -p "确认继续? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}操作已取消${NC}"
        exit 0
    fi
    
    # 在 Docker 容器中执行密码重置脚本
    docker-compose exec -T backend node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcrypt');
    
    async function resetPassword() {
      const prisma = new PrismaClient();
      try {
        const hashedPassword = await bcrypt.hash('$new_password', 10);
        await prisma.admin.update({
          where: { username: '$username' },
          data: { password: hashedPassword }
        });
        console.log('密码已成功重置');
      } catch (error) {
        console.error('错误:', error.message);
        process.exit(1);
      } finally {
        await prisma.\$disconnect();
      }
    }
    
    resetPassword();
    "
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}密码重置成功！${NC}"
    else
        echo -e "${RED}密码重置失败，请检查用户名是否正确${NC}"
        exit 1
    fi
}

# 备份数据库
backup_database() {
    local backup_dir="$PROJECT_DIR/backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/backup_$timestamp.sql"
    
    mkdir -p "$backup_dir"
    
    echo -e "${BLUE}正在备份数据库...${NC}"
    
    docker-compose exec -T postgres pg_dump -U vela vela_license > "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}备份成功: $backup_file${NC}"
        
        # 压缩备份文件
        gzip "$backup_file"
        echo -e "${GREEN}已压缩: ${backup_file}.gz${NC}"
    else
        echo -e "${RED}备份失败${NC}"
        exit 1
    fi
}

# 恢复数据库
restore_database() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        echo -e "${RED}错误: 用法: vela-cli restore <备份文件>${NC}"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}错误: 备份文件不存在: $backup_file${NC}"
        exit 1
    fi
    
    echo -e "${RED}警告: 恢复数据库将覆盖当前所有数据！${NC}"
    read -p "确认继续? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}操作已取消${NC}"
        exit 0
    fi
    
    echo -e "${BLUE}正在恢复数据库...${NC}"
    
    # 如果是 .gz 文件，先解压
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker-compose exec -T postgres psql -U vela vela_license
    else
        cat "$backup_file" | docker-compose exec -T postgres psql -U vela vela_license
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}数据库恢复成功${NC}"
    else
        echo -e "${RED}数据库恢复失败${NC}"
        exit 1
    fi
}

# 更新系统
update_system() {
    echo -e "${BLUE}正在检查更新...${NC}"
    
    # 拉取最新代码
    git pull origin main
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}无法自动更新，请手动拉取最新代码${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}正在重新构建镜像...${NC}"
    docker-compose build
    
    echo -e "${BLUE}正在重启服务...${NC}"
    docker-compose up -d
    
    echo -e "${GREEN}系统已更新到最新版本${NC}"
}

# 显示版本信息
show_version() {
    echo "VelaOS License Manager"
    echo "Version: 1.0.0"
    echo "Project: https://github.com/your-repo/vela-license-manager"
}

# 主函数
main() {
    case "${1:-help}" in
        status)
            show_status
            ;;
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs "${2:-backend}"
            ;;
        reset-password)
            reset_password "$2" "$3"
            ;;
        backup)
            backup_database
            ;;
        restore)
            restore_database "$2"
            ;;
        update)
            update_system
            ;;
        version)
            show_version
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}错误: 未知命令 '$1'${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
