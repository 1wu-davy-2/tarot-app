# 命运之镜 · Mirror of Fate

塔罗牌 AI 解读应用，支持每日指引、多种牌阵、星座运势、塔罗日记、性格测试等，融合东西方智慧诠释。Web 端 + Android APK。

## 技术栈

- **前端**: Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + Framer Motion 12 + TypeScript
- **后端**: Python FastAPI + SQLAlchemy + MariaDB + Redis + JWT
- **AI**: DeepSeek Chat API（SSE 流式解读）
- **移动端**: Capacitor 5 打包 Android APK
- **部署**: Vercel / Docker / systemd

## 快速开始

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

### 前端 (`.env.local`)

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | `http://localhost:8188` |
| `ENCRYPTION_KEY` | AI 配置加密密钥 | - |

### 后端 (`backend/.env`)

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `db_host` | 数据库地址 | `localhost` |
| `db_password` | 数据库密码 | - |
| `redis_url` | Redis 连接串 | - |
| `jwt_secret` | JWT 签名密钥 | - |
| `email_mode` | 邮件模式 `smtp` / `console` | `console` |
| `smtp_*` | SMTP 邮件配置 | QQ 邮箱 |
| `deepseek_api_key` | DeepSeek API Key | - |
| `encryption_key` | AI 配置加密密钥 | - |
| `cors_origins` | 跨域白名单 | `*` |

## 功能总览

### 塔罗占卜
| 功能 | 说明 |
|------|------|
| 每日指引 | 日期哈希固定每日一牌，正逆位判定 |
| 三牌阵 | 过去·现在·未来 |
| 凯尔特十字 | 10 张牌全维度深度分析 |
| 关系牌阵 | 7 张牌分析双方关系动态 |
| 是否牌阵 | 5 张牌决策指引 |
| 马蹄铁牌阵 | 7 张牌问题分析脉络 |
| 黄道十二宫 | 12 张牌全方位人生领域解析 |
| 自定义牌阵 | 可视化牌阵编辑器，支持 4 种布局（线性/十字/马蹄/星形） |
| 社区模板 | 牌阵模板上传/分享/导入 |
| 平铺/扇形抽牌 | 两种抽牌布局切换，手机端友好 |

### AI 解读
| 功能 | 说明 |
|------|------|
| 标准解读 | 5 维度离线解读（综合/感情/事业/财运/建议） |
| AI 深度解读 | DeepSeek v4-pro 流式 SSE，打字机效果 |
| 4 种人格风格 | 综合 / 神秘巫师 / 心理顾问 / 实用教练 |
| 追问对话 | 多轮追问，上下文关联 |
| 问题分类 | 自动识别感情/事业/财运/决策/日常，自适应输出 |
| 出生星盘融合 | 结合星座+出生日期+出生时间+出生地解读 |
| 配额系统 | 免费 2 次/天 + 签到奖励，会员 30-50 次/天 |

### 星座运势
| 功能 | 说明 |
|------|------|
| 12 星座日运 | AI 生成，Redis 缓存 24 小时，SSE 流式 |
| 周运/月运/年运 | 多周期运势解读 |
| 星座配对 | 合盘分析，多维度兼容性评分 |
| 缓存预生成 | 后台定时任务每日 00:05 自动生成所有星座缓存 |

### 塔罗日记
| 功能 | 说明 |
|------|------|
| 月历视图 | 每日自动关联当日塔罗牌 |
| 心情记录 | 1-5 级心情评分 |
| 笔记编辑 | 自由书写日记内容 |
| 周报生成 | AI 基于 7 天日记 + 星盘生成周报 |
| 月报生成 | AI 基于全月日记 + 统计生成月报 |
| 月相显示 | 日历标注每日月相 |

### 牌库
| 功能 | 说明 |
|------|------|
| 78 张完整图鉴 | Rider-Waite 塔罗牌 |
| 多牌面主题 | Rider-Waite（免费）/ Marseille SVG / Modern Minimal SVG（会员） |
| 元素/行星/象征 | 每张牌的完整元数据 |
| 学习系统 | 每日推荐学习牌，5 种题型，按花色跟踪进度 |

### 性格测试
| 功能 | 说明 |
|------|------|
| MBTI 测试 | 标准 16 型人格测试 |
| BDSM 倾向测试 | S/M 倾向评估 + 角色判定 |
| Dirty/Sweet Talk | 6 类短语数据库，随机推送 |
| 结果同步 | 登录用户自动同步到服务端 |

### 梦境记录
| 功能 | 说明 |
|------|------|
| 梦境日记 | 记录梦境内容 + 情绪标签 |
| AI 解梦 | DeepSeek 梦境分析 |
| 梦典词典 | 常见梦境符号释义 |

### 用户系统
| 功能 | 说明 |
|------|------|
| 注册/登录 | 邮箱验证码注册，支持用户名/邮箱登录 |
| 密码重置 | 邮箱验证码重置 |
| 每日签到 | 随机奖励 2-10 次 AI 配额 |
| 会员等级 | Free / Basic / Premium 三档 |
| 个人中心 | 出生星盘、MBTI 类型、会员状态 |
| 长期登录 | APK 端 10 年有效期 Token |
| 会话管理 | 24h 超时 + 自动续期 + auth-expired 全局同步 |
| 账户删除 | 自助销户 |

### 其他
| 功能 | 说明 |
|------|------|
| 成就系统 | 12 项成就（签到/牌库/解读/隐藏） |
| 分享截图 | 牌阵解读一键生成分享图 |
| 公告系统 | 全局公告栏，过期自动隐藏 |
| 反馈收集 | 用户反馈 + 邮件通知调度 |
| 邮件再激活 | 未活跃用户自动推送回流邮件 |
| 应用更新检查 | APK 版本检测 + 下载 |
| 新手引导 | 首次使用分步引导 |
| Android APK | Capacitor 5 打包，本地通知支持 |

## 项目结构

```
tarot-app/
├── app/                           # Next.js 16 App Router
│   ├── page.tsx                   # 首页（6 入口卡片）
│   ├── daily/page.tsx             # 每日指引
│   ├── spread/page.tsx            # 牌阵占卜
│   ├── fortune/page.tsx           # 星座运势
│   ├── journal/page.tsx           # 塔罗日记
│   ├── library/page.tsx           # 牌库浏览
│   ├── dreams/page.tsx            # 梦境记录
│   ├── personality/page.tsx       # 性格测试
│   ├── history/page.tsx           # 解读历史
│   ├── login/page.tsx             # 登录注册
│   ├── profile/page.tsx           # 个人中心
│   ├── admin/page.tsx             # 管理后台
│   └── api/                       # API Routes (Vercel 代理)
│       ├── daily-reading/         # 每日牌 API
│       └── interpret/             # AI 解读 API (SSE)
├── components/                    # 30+ 组件
│   ├── TarotCard.tsx              # 3D 翻牌动画
│   ├── CardDrawAnimation.tsx      # 扇形/平铺抽牌动画
│   ├── CardInterpretation.tsx     # 标准/AI 双面板解读
│   ├── CardSpread.tsx             # 牌阵布局渲染
│   ├── SpreadLayoutPreview.tsx    # 牌阵布局可视化编辑
│   ├── ShareButton.tsx            # 分享截图
│   ├── LoginModal.tsx             # 登录弹窗
│   ├── AuthGuard.tsx              # 路由鉴权守卫
│   ├── SessionWatcher.tsx         # 全局会话监听
│   ├── Header.tsx                 # 顶部导航
│   ├── MobileBottomNav.tsx        # 底部导航
│   ├── MysticBackground.tsx       # 星空/星云背景动画
│   ├── DailyReading.tsx           # 每日牌展示
│   ├── FortuneModal.tsx           # 运势弹窗
│   ├── DreamModal.tsx             # 梦境录入弹窗
│   ├── PersonalityTestModal.tsx   # 性格测试弹窗
│   ├── QuizModal.tsx              # 塔罗问答
│   ├── LessonView.tsx             # 学习课程
│   ├── JournalCalendar.tsx        # 日记月历
│   ├── JournalEntrySheet.tsx      # 日记编辑面板
│   ├── WeeklyReport.tsx           # 周报展示
│   ├── MonthlyReport.tsx          # 月报展示
│   ├── BirthChartSection.tsx      # 出生星盘
│   ├── MoonCalendar.tsx           # 月相日历
│   ├── MbtiAvatar.tsx             # MBTI 形象
│   ├── OnboardingGuide.tsx        # 新手引导
│   ├── AchievementToast.tsx       # 成就弹窗
│   ├── FeedbackWidget.tsx         # 反馈组件
│   ├── AppInit.tsx                # 应用初始化
│   └── AppUpdateBanner.tsx        # 更新提示
├── lib/                           # 工具库
│   ├── tarot-data.ts              # 78 张牌完整数据
│   ├── api-client.ts              # 后端 API 客户端 + Auth
│   ├── ai-prompts.ts              # AI 提示词 + 问题分类
│   ├── deck-themes.ts             # 多牌面主题
│   ├── achievements.ts            # 成就系统逻辑
│   ├── fortune-data.ts            # 运势数据 + 幸运物
│   ├── daily-seed.ts              # 每日牌确定性算法
│   ├── personality-tests.ts       # MBTI/BDSM 题库 + 评分
│   ├── quiz-generator.ts          # 塔罗问答生成
│   ├── tarot-lessons.ts           # 学习课程数据
│   ├── dream-dictionary.ts        # 梦境符号词典
│   ├── astro-events.ts            # 月相/行星逆行
│   ├── reading-history.ts         # 本地解读历史
│   ├── journal-local.ts           # 本地日记缓存
│   ├── crypto-client.ts           # 前端加解密
│   ├── auth-utils.ts              # 客户端 Auth 工具
│   ├── export-utils.ts            # HTML 导出
│   └── notification-scheduler.ts  # 本地通知调度
├── backend/                       # Python FastAPI
│   ├── main.py                    # 入口：迁移、Admin 初始化、调度器
│   ├── config.py                  # Pydantic Settings
│   ├── database.py                # SQLAlchemy 引擎 + Session
│   ├── models.py                  # 17 个 ORM 模型
│   ├── schemas.py                 # Pydantic 请求/响应模型
│   ├── auth.py                    # JWT + bcrypt
│   ├── email_utils.py             # HTML 邮件模板
│   ├── email_reengage.py          # 回流邮件调度
│   ├── redis_utils.py             # Redis 验证码缓存
│   ├── routers/
│   │   ├── auth.py                # 注册/登录/验证/密码重置/个人资料
│   │   ├── interpret.py           # AI 解读 SSE（牌阵 + 追问）
│   │   ├── checkin.py             # 每日签到
│   │   ├── quota.py               # AI 配额管理
│   │   ├── readings.py            # 解读历史 CRUD
│   │   ├── fortune.py             # 星座运势 + 配对 + 缓存调度
│   │   ├── journal.py             # 日记 CRUD
│   │   ├── journal_reports.py     # 周报/月报 AI 生成 + 存储
│   │   ├── dream.py               # 梦境记录 + AI 解梦
│   │   ├── personality.py         # 性格测试 + SM 短语
│   │   ├── zodiac.py              # 12 星座日运
│   │   ├── spread_templates.py    # 牌阵模板 CRUD + 社区
│   │   ├── theme_images.py        # 牌面主题图片
│   │   ├── ai_config.py           # AI 配置加密下发
│   │   ├── feedback.py            # 反馈收集 + 邮件调度
│   │   ├── announcement.py        # 公告 CRUD
│   │   ├── app_update.py          # APK 版本检查
│   │   └── admin.py               # 管理后台
│   ├── alembic/                   # 数据库迁移
│   └── Dockerfile
├── android/                       # Capacitor Android 项目
├── capacitor.config.ts            # Capacitor 配置
├── landing/                       # 独立 Landing Page
├── nginx/                         # Nginx 配置
├── scripts/                       # 构建/部署脚本
├── docker-compose.yml
└── public/                        # 静态资源（牌图等）
```

## 生产部署

### 后端 — Docker（推荐）

```bash
cd /opt/tarot-app
cp backend/.env.docker backend/.env
# 编辑 .env 填入真实数据库密码
docker compose up -d --build
curl http://localhost:8188/api/health
```

### 后端 — systemd

```bash
pip3 install -r backend/requirements.txt
cp scripts/tarot-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now tarot-api
```

### 前端 — Standalone 打包

Next.js 生产构建需 1-2GB 内存，低配服务器建议本地构建上传：

```bash
# 本地构建
NEXT_PUBLIC_API_URL=http://你的服务器IP:8188 npm run build

# 打包 standalone
rm -rf /tmp/tarot-standalone tarot-standalone.tar.gz
cp -r .next/standalone /tmp/tarot-standalone
mkdir -p /tmp/tarot-standalone/.next
cp -r .next/static /tmp/tarot-standalone/.next/
cp -r public /tmp/tarot-standalone/
cd /tmp && tar -czf tarot-standalone.tar.gz tarot-standalone

# 上传服务器
scp tarot-standalone.tar.gz root@IP:/opt/

# 服务器启动
cd /opt && tar -xzf tarot-standalone.tar.gz
cd tarot-standalone
PORT=5200 nohup node server.js > /var/log/tarot-web.log 2>&1 &
```

### 防火墙

| 端口 | 协议 | 用途 |
|------|------|------|
| 5200 | TCP | 前端页面 |
| 8188 | TCP | 后端 API |

## 管理员

注册时使用邮箱 `admin@tarot-app.com` 即为管理员；后端启动时自动创建默认管理员：

> 用户名: `admin` / 密码: `admin@123`

## Android APK

```bash
BUILD_TARGET=apk npm run build    # 静态导出到 out/
npx cap sync android              # 同步到 Android 项目
cd android && ./gradlew assembleDebug  # 构建 APK
# 输出: android/app/build/outputs/apk/debug/app-debug.apk
```
