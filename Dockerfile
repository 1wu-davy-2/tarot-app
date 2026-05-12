# 前端 Dockerfile — 多阶段构建
# 构建阶段：npm run build（NEXT_PUBLIC_API_URL 在此内嵌到客户端 JS）
# 运行阶段：仅包含 standalone 输出，极简镜像

# ── Stage 1: Build ─────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Build arg：后端 API 地址（客户端直连，需写入 JS bundle）
ARG NEXT_PUBLIC_API_URL=http://localhost:8188
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 安装依赖（含 devDependencies，构建需要 TypeScript/ESLint）
COPY package*.json ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# ── Stage 2: Runtime ───────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

ENV PORT=5200
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

# ENCRYPTION_KEY 运行时注入（仅服务端使用，不入客户端 JS）
ENV ENCRYPTION_KEY=""

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 5200

CMD ["node", "server.js"]
