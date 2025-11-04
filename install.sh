#!/bin/bash

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 用户或 sudo 运行此脚本"
        exit 1
    fi
}

# 检查操作系统
check_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        print_error "无法检测操作系统版本"
        exit 1
    fi

    if [[ ! "$OS" =~ "Ubuntu" ]]; then
        print_warning "此脚本主要为 Ubuntu 设计，在其他系统上可能需要手动调整"
    fi
}

# 生成随机密钥
generate_secret() {
    openssl rand -base64 $1
}

# 主函数
main() {
    clear
    echo "================================================="
    echo "  VelaOS License Manager - 安装程序"
    echo "  通用的小米 VelaOS 智能穿戴快应用后台管理系统"
    echo "================================================="
    echo ""

    check_root
    check_os

    print_info "开始安装..."
    echo ""

    # 步骤 1: 更新系统并安装依赖
    print_info "[1/6] 更新系统并安装依赖..."
    apt-get update -qq
    apt-get install -y docker.io docker-compose git curl openssl > /dev/null 2>&1
    systemctl start docker
    systemctl enable docker
    print_success "依赖安装完成"

    # 步骤 2: 下载源代码
    print_info "[2/6] 下载源代码..."
    INSTALL_DIR="/opt/vela-license-manager"
    
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "目录 $INSTALL_DIR 已存在"
        read -p "是否删除并重新安装? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$INSTALL_DIR"
        else
            print_error "安装已取消"
            exit 1
        fi
    fi

    # 这里假设代码已经在 GitHub 上，实际部署时需要替换为真实的仓库地址
    # git clone https://github.com/your-username/vela-license-manager.git "$INSTALL_DIR"
    
    # 临时方案：如果在本地开发，直接复制
    if [ -d "/home/ubuntu/vela-license-manager" ]; then
        cp -r /home/ubuntu/vela-license-manager "$INSTALL_DIR"
        print_success "源代码已复制到 $INSTALL_DIR"
    else
        print_error "源代码不存在，请先克隆仓库"
        exit 1
    fi

    cd "$INSTALL_DIR"

    # 步骤 3: 配置环境变量
    print_info "[3/6] 配置环境变量..."
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        
        # 生成随机密钥
        DB_PASSWORD=$(generate_secret 32)
        JWT_SECRET=$(generate_secret 64)
        MASTER_KEY=$(generate_secret 32)
        
        # 替换环境变量
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${DB_PASSWORD}/" .env
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
        sed -i "s/MASTER_ENCRYPTION_KEY=.*/MASTER_ENCRYPTION_KEY=${MASTER_KEY}/" .env
        
        print_success "环境变量已配置"
    else
        print_warning ".env 文件已存在，跳过配置"
    fi

    # 步骤 4: 构建并启动服务
    print_info "[4/6] 构建 Docker 镜像并启动服务..."
    print_warning "这可能需要几分钟时间，请耐心等待..."
    
    docker-compose up -d --build
    
    print_success "服务已启动"

    # 步骤 5: 等待服务就绪
    print_info "[5/6] 等待服务就绪..."
    sleep 10
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        print_success "服务运行正常"
    else
        print_error "服务启动失败，请检查日志: docker-compose logs"
        exit 1
    fi

    # 步骤 6: 创建 CLI 工具软链接
    print_info "[6/6] 配置命令行工具..."
    chmod +x "$INSTALL_DIR/cli.sh"
    ln -sf "$INSTALL_DIR/cli.sh" /usr/local/bin/vela-cli
    print_success "命令行工具已安装: vela-cli"

    # 完成
    echo ""
    echo "================================================="
    print_success "安装完成！"
    echo "================================================="
    echo ""
    echo "📋 下一步操作："
    echo ""
    echo "1. 访问 Web 管理界面完成 OOBE 初始化："
    echo "   ${GREEN}http://$(hostname -I | awk '{print $1}'):3000${NC}"
    echo ""
    echo "2. 使用命令行工具管理系统："
    echo "   ${GREEN}vela-cli status${NC}       # 查看服务状态"
    echo "   ${GREEN}vela-cli logs${NC}         # 查看日志"
    echo "   ${GREEN}vela-cli restart${NC}      # 重启服务"
    echo ""
    echo "3. 查看详细文档："
    echo "   ${GREEN}cat $INSTALL_DIR/README.md${NC}"
    echo ""
    echo "================================================="
}

main "$@"
