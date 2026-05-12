# 命运之镜 · 部署手册

## 环境变量一览

| 变量 | 前端/后端 | 说明 |
|------|----------|------|
| `NEXT_PUBLIC_API_URL` | 前端 | 客户端直连后端地址（Docker 必设，Vercel 不设） |
| `ENCRYPTION_KEY` | 前后端 | AES-256 加密密钥，两端必须一致 |
| `BACKEND_URL` | 前端 | Vercel 代理模式下的后端地址 |
| `DEEPSEEK_API_KEY` | 后端 | DeepSeek AI 密钥 |
| `DB_*` | 后端 | 数据库连接 |
| `REDIS_URL` | 后端 | Redis 连接串 |

---

## 方案 A: 云服务器 Docker 部署

```bash
# 1. 克隆
cd /opt
git clone https://github.com/1wu-davy-2/tarot-app.git
cd tarot-app

# 2. 后端配置
cp backend/.env.docker backend/.env
# 按需修改 backend/.env 中的数据库密码等

# 3. 前端配置
echo 'NEXT_PUBLIC_API_URL=http://14.103.242.161:8188' > .env
echo 'ENCRYPTION_KEY=0bX4ANSPpdWnKE5HnujeceygjyybqBaMnG+fst7sCdk=' >> .env

# 4. 启动
docker compose up -d --build

# 5. 验证
curl http://localhost:8188/api/health
curl http://localhost:5200
```

**更新**
```bash
cd /opt/tarot-app
git pull
docker compose up -d --build
```

**安全组放行**：`5200`、`8188`

---

## 方案 B: Vercel 部署

### Vercel 设置

1. [vercel.com/new](https://vercel.com/new) → 导入 GitHub 仓库 `1wu-davy-2/tarot-app`
2. Settings → Environment Variables 添加：

| Key | Value |
|-----|-------|
| `BACKEND_URL` | `http://14.103.242.161:8188` |
| `ENCRYPTION_KEY` | `0bX4ANSPpdWnKE5HnujeceygjyybqBaMnG+fst7sCdk=` |

> **不要**设置 `NEXT_PUBLIC_API_URL`。不设 = 自动走 Vercel 代理模式，避免 HTTPS 混合内容警告。

### Git 配置

Settings → Git → Production Branch 改为 `dev`（推送即自动部署）

### 请求链路

```
浏览器 (HTTPS) → Vercel → /api/[...path] 代理 → 云服务器 :8188 (HTTP)
```

---

## 故障排查

```bash
# Docker 日志
docker logs tarot-web
docker logs tarot-api

# 测试后端
curl http://localhost:8188/api/health

# 测试加密配置
curl http://localhost:8188/api/ai-config

# 重启
docker compose restart
```
