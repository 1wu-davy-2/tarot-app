# 命运之镜 · Mirror of Fate

塔罗牌 AI 解读网站，支持每日指引和多种牌阵，融合东西方智慧诠释。

## 技术栈

- **前端**: Next.js 16 (App Router) + Tailwind CSS v4 + Framer Motion
- **后端**: Python FastAPI + SQLAlchemy + Redis + JWT
- **AI**: DeepSeek Chat API（SSE 流式解读）
- **数据库**: MariaDB / MySQL
- **牌图**: Rider-Waite 塔罗牌（公共领域）
- **部署**: Vercel / Docker / systemd

## 快速开始（本地开发）

```bash
# 1. 前端
npm install
npm run dev          # http://localhost:5200

# 2. 后端
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8188
```

## 环境变量

### 前端

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | `http://localhost:8188` |

### 后端 (`backend/.env`)

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `db_host` | 数据库地址 | `localhost` |
| `db_password` | 数据库密码 | - |
| `redis_password` | Redis 密码 | - |
| `jwt_secret` | JWT 签名密钥 | - |
| `email_mode` | 邮件模式 `smtp` / `console` | `console` |
| `smtp_*` | SMTP 邮件配置 | QQ 邮箱 |
| `deepseek_api_key` | DeepSeek API Key | - |
| `cors_origins` | 跨域白名单 | `*` |

## 功能

| 功能 | 说明 |
|------|------|
| 每日指引 | 日期哈希固定每日一牌 |
| 三牌阵 | 过去·现在·未来 |
| 凯尔特十字 | 10 张牌全维度分析 |
| 牌库浏览 | 78 张牌完整图鉴 |
| 标准解读 | 5 维度离线解读 |
| AI 深度解读 | DeepSeek 流式打字机效果 |
| 用户系统 | 注册登录 + 邮箱验证 + 每日签到 |
| AI 额度 | 基础 2 次 + 签到奖励 |

## 项目结构

```
tarot-app/
├── app/
│   ├── page.tsx              # 首页
│   ├── daily/page.tsx        # 每日指引
│   ├── spread/page.tsx       # 牌阵解读
│   ├── history/page.tsx      # 解读记录
│   ├── library/page.tsx      # 牌库浏览
│   ├── login/page.tsx        # 登录注册
│   ├── profile/page.tsx      # 个人中心
│   └── api/
│       ├── daily-reading/    # 每日牌 API
│       └── interpret/        # AI 解读 API（SSE）
├── components/
│   ├── TarotCard.tsx         # 3D 翻牌
│   ├── CardDrawAnimation.tsx # 扇形抽牌动画
│   ├── CardInterpretation.tsx# 标准/AI 双面板
│   ├── ShareButton.tsx       # 分享截图
│   ├── LoginModal.tsx        # 登录弹窗
│   └── ...
├── lib/
│   ├── tarot-data.ts         # 78 张牌数据
│   ├── api-client.ts         # 后端 API 客户端
│   └── ...
├── backend/
│   ├── main.py               # FastAPI 入口
│   ├── routers/              # API 路由
│   ├── models.py             # 数据库模型
│   ├── email_utils.py        # 邮件发送
│   ├── redis_utils.py        # Redis 缓存
│   ├── Dockerfile            # 后端镜像
│   └── .env.example          # 环境变量模板
├── docker-compose.yml        # 后端 + Redis 编排
├── scripts/
│   └── tarot-api.service     # systemd 服务文件
└── public/
```

---

## 生产部署

### 后端 — Docker（推荐）

```bash
# 服务器上
cd /opt/tarot-app
cp backend/.env.docker backend/.env
# 编辑 .env 填入真实数据库密码

docker compose up -d --build
curl http://localhost:8188/api/health
```

> MariaDB 使用外部数据库，Redis 使用宿主机已有服务。Docker 容器通过 `network_mode: host` 共享宿主机网络。

### 后端 — systemd（裸跑）

```bash
pip3 install -r backend/requirements.txt
cp scripts/tarot-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now tarot-api
```

---

### 前端 — Standalone 打包部署

Next.js 生产构建很吃内存（需 1-2GB），低配服务器无法直接 `next build`。解决方案：本地构建，上传 standalone 包。

```bash
# ===== 本地 Windows =====
cd E:/devTools/tarot-app

# 1. 构建（编译时内嵌 API 地址）
NEXT_PUBLIC_API_URL=http://你的服务器IP:8188 npm run build

# 2. 打包 standalone 版本
rm -rf /tmp/tarot-standalone tarot-standalone.tar.gz
cp -r .next/standalone /tmp/tarot-standalone
mkdir -p /tmp/tarot-standalone/.next
cp -r .next/static /tmp/tarot-standalone/.next/
cp -r public /tmp/tarot-standalone/
cd /tmp && tar -czf tarot-standalone.tar.gz tarot-standalone
mv tarot-standalone.tar.gz /e/devTools/tarot-app/

# 3. 上传到服务器
scp tarot-standalone.tar.gz root@你的服务器IP:/opt/

# ===== 服务器 =====
cd /opt
rm -rf tarot-standalone
tar -xzf tarot-standalone.tar.gz
cd tarot-standalone

# 启动（后台运行，端口 5200）
PORT=5200 nohup node server.js > /var/log/tarot-web.log 2>&1 &

# 验证
netstat -tlnp | grep 5200
curl http://localhost:5200
```

#### 更新前端

```bash
# 本地重新构建 → 打包 → 上传
NEXT_PUBLIC_API_URL=http://IP:8188 npm run build
# ... 打包步骤同上 ...
scp tarot-standalone.tar.gz root@IP:/opt/

# 服务器重启
cd /opt
tar -xzf tarot-standalone.tar.gz
pkill -f "server.js"
cd /opt/tarot-standalone
PORT=5200 nohup node server.js > /var/log/tarot-web.log 2>&1 &
```

#### 开机自启（systemd）

```bash
cat > /etc/systemd/system/tarot-web.service << 'EOF'
[Unit]
Description=Tarot Web Frontend
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/tarot-standalone
ExecStart=/usr/bin/node server.js
Environment=PORT=5200
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now tarot-web
```

---

### 防火墙 / 安全组

| 端口 | 协议 | 用途 |
|------|------|------|
| 5200 | TCP | 前端页面 |
| 8188 | TCP | 后端 API |

云服务器需在安全组放行对应端口；本地 firewalld / iptables 同理。

---

## 管理员

注册时使用邮箱 `admin@tarot-app.com` 即为管理员；或后端启动时自动创建默认管理员：

> 用户名: `admin` / 密码: `admin@123`
