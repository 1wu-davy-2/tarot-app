# 命运之镜 · Mirror of Fate

塔罗牌占卜网站，支持每日卦算和多种牌阵，融合东西方智慧诠释。

## 技术栈

- **前端**: Next.js 16 (App Router) + Tailwind CSS v4 + Framer Motion
- **AI**: DeepSeek Chat API（流式 SSE 解读）
- **牌图**: Rider-Waite 塔罗牌（公共领域，1966 年版权到期）
- **部署**: Vercel / Docker

## 快速开始

```bash
# 安装依赖
npm install

# 配置 DeepSeek API Key
cp .env.local.example .env.local
# 编辑 .env.local，填入 DEEPSEEK_API_KEY

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 功能

| 功能 | 说明 |
|------|------|
| 每日卦算 | 日期哈希固定每日一牌，离线可用 |
| 三牌阵 | 过去·现在·未来，适合日常决策 |
| 凯尔特十字 | 10 张牌全维度深度分析 |
| 标准解读 | 78 张牌自带 5 维度离线解读 |
| AI 深度解读 | DeepSeek 流式打字机效果 |
| 扇形抽牌 | 三阶段动画：洗牌→扇出→飞入 |
| 3D 翻牌 | 呼吸光晕→翻转→金色脉冲 |

## 项目结构

```
tarot-app/
├── app/
│   ├── page.tsx              # 首页
│   ├── daily/page.tsx        # 每日卦算
│   ├── spread/page.tsx       # 牌阵占卜
│   └── api/
│       ├── daily-reading/    # 每日牌 API
│       └── interpret/        # AI 解读 API（SSE 流式）
├── components/
│   ├── TarotCard.tsx         # 3D 翻牌组件
│   ├── CardDrawAnimation.tsx # 扇形抽牌动画
│   ├── CardInterpretation.tsx# 标准/AI 双面板解读
│   ├── MysticBackground.tsx  # 星空粒子背景
│   └── ...
├── lib/
│   ├── tarot-data.ts         # 78 张牌完整数据 + 解读
│   ├── daily-seed.ts         # 每日种子算法
│   └── deepseek.ts           # DeepSeek API 封装
└── public/cards/             # 78 张 Rider-Waite 牌图
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥（https://platform.deepseek.com） |

## 部署

### Vercel

1. Fork / 推送此仓库到 GitHub
2. Vercel 导入项目
3. 设置环境变量 `DEEPSEEK_API_KEY`
4. 部署

### Docker

```bash
docker build -t tarot-app .
docker run -p 3000:3000 -e DEEPSEEK_API_KEY=sk-xxx tarot-app
```
