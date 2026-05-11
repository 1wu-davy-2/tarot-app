# 前端 Dockerfile — 多阶段构建（本地构建，镜像只含运行时）
FROM node:22-alpine

WORKDIR /app

# 只复制 standalone 运行时文件
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

ENV PORT=5200
ENV NODE_ENV=production

EXPOSE 5200

CMD ["node", "server.js"]
