#!/bin/bash
# 命运之镜 · Mirror of Fate — 云服务器一键部署
# 在服务器上执行: bash setup-server.sh

set -e

echo "=== 1. 检查环境 ==="
python3 --version
mysql --version
echo "✓ 环境检查通过"

echo ""
echo "=== 2. 安装 Redis ==="
if command -v redis-server &>/dev/null; then
    echo "Redis 已安装"
else
    yum install -y redis || apt-get install -y redis-server
    systemctl enable redis
    systemctl start redis
    echo "✓ Redis 安装完成"
fi

echo ""
echo "=== 3. 创建数据库 ==="
read -sp "请输入 MariaDB root 密码: " MYSQL_PWD
echo ""
mysql -u root -p"$MYSQL_PWD" -e "CREATE DATABASE IF NOT EXISTS tarot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
echo "✓ 数据库 tarot 已创建"

echo ""
echo "=== 4. 安装 Python 依赖 ==="
cd "$(dirname "$0")/../backend"
pip3 install -r requirements.txt
echo "✓ Python 依赖安装完成"

echo ""
echo "=== 5. 配置 .env ==="
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠ 请编辑 backend/.env 填入真实配置："
    echo "  - db_password (MariaDB 密码)"
    echo "  - jwt_secret (随机字符串)"
    echo "  - deepseek_api_key (DeepSeek API Key)"
    echo "  - cors_origins (前端域名)"
else
    echo "✓ .env 已存在"
fi

echo ""
echo "=== 6. 测试启动 ==="
echo "启动开发服务器测试..."
echo "运行: cd backend && uvicorn main:app --host 0.0.0.0 --port 8000"
echo ""
echo "部署完成！"
echo "生产环境运行: cd backend && nohup uvicorn main:app --host 0.0.0.0 --port 8000 &"
