# 命运之镜 · Mirror of Fate — 部署与维护手册

## 项目架构

```
                      ┌──────────────────────────┐
                      │    DeepSeek API (AI)      │
                      └──────────▲───────────────┘
                                 │
  ┌──────────────┐    ┌──────────┴───────────────┐    ┌──────────────┐
  │  浏览器       │───▶│  Next.js 前端 (:5200)      │───▶│  后端 (:8188) │
  │              │    │  /api/interpret (SSE)     │    │  FastAPI     │
  │              │    │  /api/daily-reading       │    │  MariaDB     │
  │              │    └──────────────────────────┘    │  Redis       │
  │              │                                    │  SMTP        │
  │              │──── 客户端 API 直连 ──────────────▶│              │
  └──────────────┘                                    └──────────────┘
```

- **前端**: Next.js 16 App Router，端口 5200
- **后端**: Python FastAPI，端口 8188
- **数据库**: MariaDB，端口 3306（宿主机，非容器）
- **缓存**: Redis，端口 6379（宿主机，非容器）

### 关键环境变量

| 变量 | 位置 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | 前端构建时 | 客户端直连后端地址 |
| `ENCRYPTION_KEY` | 前后端都需要 | AES-256 加密密钥（API KEY 加密传输） |
| `DEEPSEEK_API_KEY` | 后端 | DeepSeek AI API 密钥 |
| `db_*` / `DB_*` | 后端 | 数据库连接配置 |
| `REDIS_URL` | 后端 | Redis 连接串 |
| `JWT_SECRET` | 后端 | JWT 签名密钥 |

---

## 方案 A: Docker 部署（云服务器）

### 适用场景
自有云服务器，Docker 托管全栈。前端直连后端 IP:端口。

### 服务器要求
- Docker 20+ & Docker Compose v2
- 内存 >= 2GB（构建阶段需要 1-2GB）
- 磁盘 >= 2GB

### 安全组 / 防火墙放行
| 端口 | 协议 | 用途 |
|------|------|------|
| 5200 | TCP | 前端 |
| 8188 | TCP | 后端 API |

### 初次部署

```bash
# 1. 克隆代码
cd /opt
git clone https://github.com/1wu-davy-2/tarot-app.git
cd tarot-app

# 2. 创建后端环境变量
cp backend/.env.docker backend/.env
vim backend/.env  # 确认数据库密码等配置

# 3. 创建前端环境变量（docker-compose 自动读取）
echo 'NEXT_PUBLIC_API_URL=http://你的服务器IP:8188' > .env
echo 'ENCRYPTION_KEY=你的加密密钥' >> .env

# 4. 启动
docker compose up -d --build

# 5. 验证
curl http://localhost:5200
curl http://localhost:8188/api/health
```

### 日常更新

```bash
cd /opt/tarot-app

# 拉取最新代码
git pull

# 重新构建并重启（只重建有变化的服务）
docker compose up -d --build

# 或分别操作
docker compose up -d --build web   # 仅前端
docker compose up -d --build api   # 仅后端

# 查看日志
docker logs -f tarot-web
docker logs -f tarot-api
```

### 停止/重启

```bash
docker compose stop        # 停止
docker compose start       # 启动（不重建）
docker compose restart     # 重启
docker compose down        # 停止并删除容器
```

### 常用维护命令

```bash
# 查看运行状态
docker compose ps

# 查看前端日志（最近 50 行）
docker logs --tail 50 tarot-web

# 进入容器调试
docker exec -it tarot-api bash
docker exec -it tarot-web sh

# 清理旧镜像释放空间
docker system prune -a
```

---

## 方案 B: Vercel 部署（前端无服务器）

### 适用场景
前端托管到 Vercel（免费自动 HTTPS、全球 CDN），后端仍在云服务器。

### 前提条件
- GitHub 仓库：https://github.com/1wu-davy-2/tarot-app
- Vercel 账号（用 GitHub 登录）

### 部署步骤

#### 1. 在 Vercel 导入项目

1. 打开 [vercel.com/new](https://vercel.com/new)
2. 选择 GitHub 仓库 `1wu-davy-2/tarot-app`
3. 框架自动识别为 Next.js，无需修改构建设置

#### 2. 配置环境变量

在 Vercel 项目 Settings → Environment Variables 中添加：

| Key | Value | Environments |
|-----|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://14.103.242.161:8188` | Production, Preview |
| `ENCRYPTION_KEY` | `0bX4ANSPpdWnKE5HnujeceygjyybqBaMnG+fst7sCdk=` | Production, Preview |

> `ENCRYPTION_KEY` 与服务器后端 `backend/.env` 中的值必须一致。

#### 3. 部署

- 每次推送到 `dev` 分支，Vercel 自动部署 Preview 环境
- 合并到 `main` 分支，Vercel 自动部署 Production 环境
- 也可在 Vercel Dashboard 手动触发 Redeploy

#### 4. 后端 CORS 确认

后端已配置 `cors_origins=*`，允许所有来源。Vercel 域名自动被允许。

#### 5. 混合内容注意事项

Vercel 默认 HTTPS，后端云服务器是 HTTP。浏览器可能会警告"混合内容"。解决方案：
- **简单方案**：浏览器通常允许从 HTTPS 页面向 HTTP 发 API 请求（非敏感场景）
- **正式方案**：给后端加 Nginx + Let's Encrypt 证书，变成 HTTPS

### Vercel 分支策略建议

```
dev 分支 → Preview 环境（测试）
main 分支 → Production 环境（正式）
```

---

## 环境变量对照表

### 前端（Docker 构建时 / Vercel 环境变量）

| 变量 | Docker (.env) | Vercel | 说明 |
|------|--------------|--------|------|
| `NEXT_PUBLIC_API_URL` | 根目录 `.env` | Vercel Env | 后端 API 完整地址 |
| `ENCRYPTION_KEY` | 根目录 `.env` | Vercel Env | AES 解密密钥（32+ 字符） |

### 后端（`backend/.env`）

| 变量 | 示例值 | 说明 |
|------|--------|------|
| `DB_HOST` | `14.103.242.161` | 数据库 IP |
| `DB_PORT` | `3306` | 数据库端口 |
| `DB_USER` | `root` | 数据库用户 |
| `DB_PASSWORD` | `xxx` | 数据库密码 |
| `DB_NAME` | `tarot` | 数据库名 |
| `REDIS_URL` | `redis://:pwd@host:6379/0` | Redis 连接 |
| `JWT_SECRET` | 随机字符串 | JWT 签名 |
| `EMAIL_MODE` | `smtp` | 邮件模式 |
| `SMTP_HOST` | `smtp.qq.com` | SMTP 服务器 |
| `SMTP_PORT` | `465` | SMTP 端口 |
| `SMTP_USER` | `xxx@qq.com` | 发件邮箱 |
| `SMTP_PASSWORD` | `xxx` | SMTP 授权码 |
| `DEEPSEEK_API_KEY` | `sk-xxx` | DeepSeek API KEY |
| `ENCRYPTION_KEY` | 随机 32+ 字符 | 必须与前端一致 |
| `CHECKIN_MAX_BONUS` | `10` | 签到最大奖励 |
| `CORS_ORIGINS` | `*` | 跨域白名单 |

---

## 故障排查

### 前端 502

```bash
docker logs tarot-web
# 常见原因：
# - .env 不存在或 NEXT_PUBLIC_API_URL 未设置
# - ENCRYPTION_KEY 未设置
# - HOSTNAME 未设为 0.0.0.0
```

### 后端 API 无响应

```bash
docker logs tarot-api
curl http://localhost:8188/api/health
# 常见原因：
# - 数据库连接失败（检查 DB_HOST/DB_PASSWORD）
# - Redis 连接失败
```

### AI 解读报错

```bash
# 检查加密是否正常
curl http://localhost:8188/api/ai-config
# 应返回 {"model":"deepseek-v4-pro","api_key":"..."}
```

### Vercel 部署后 API 调不通

1. 确认 `NEXT_PUBLIC_API_URL` 在 Vercel 中已设置
2. 确认云服务器安全组放行了 8188 端口
3. 确认后端容器在运行：`docker ps | grep tarot-api`

---

## 数据备份

```bash
# MariaDB 备份（在宿主机上）
mysqldump -u root -p tarot > /opt/backups/tarot_$(date +%Y%m%d).sql

# 保留最近 7 天
find /opt/backups -name 'tarot_*.sql' -mtime +7 -delete
```
