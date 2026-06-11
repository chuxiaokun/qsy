# 去水印工具箱

一款微信小程序，帮助用户从主流短视频/社交平台链接中解析无水印内容，并提供 Live Photo 保存、格式转换、图片压缩等实用工具。

| 项目 | 说明 |
|------|------|
| 小程序 AppID | `wx69d8ada06130a2ad` |
| 线上 API | `https://kit.baimengyan.cn` |
| 技术栈 | 微信小程序 + 微信云开发 + 自建 Node API |

---

## 功能概览

### 去水印解析

粘贴分享链接，一键解析并预览高清视频或图集，支持保存到相册。

| 平台 | 说明 |
|------|------|
| 抖音 | 视频 / 图集 |
| 快手 | 视频 / 图集 |
| 小红书 | 视频 / 图集 |
| 微博 | 视频 / 图集 |
| B 站 | 视频 |
| 微视 | 视频 |

解析流程：用户输入链接 → 调用三方解析接口 → 展示预览 → 下载保存。解析成功后自动写入处理记录，支持收藏。

### 工具箱

| 功能 | 路径 | 说明 |
|------|------|------|
| Live Photo 保存 | `pages/live-photo/` | 从历史记录中提取含 Live 封面的图集项，保存动态照片 |
| 格式转换 | `pages/format-convert/` | HEIC 转 JPG；本地视频转 GIF（可调时长与帧率） |
| 图片压缩 | `pages/image-compress/` | 按质量与最大边长压缩图片，减小体积 |

### 用户与权益

- **微信登录**：优先走自建 API（`POST /api/login`），未配置 `API_BASE` 时回退云函数 `login`
- **邮箱绑定**：通过云函数发送验证码并绑定，便于账号找回
- **VIP 会员**：会员免广告，直接使用去水印功能
- **激励广告解锁**：非会员观看激励视频广告后，当日可解锁去水印
- **处理记录**：本地 + 服务端同步（登录后），最多保留 50 条
- **我的收藏**：收藏解析结果，方便再次查看
- **消息通知**：拉取系统公告与运营消息

### 其他

- 隐私政策、用户协议页面
- 美团 / 京东外卖红包入口（跳转对应小程序领券）
- 邀请分享（可选开启）

---

## 三仓架构

本项目为 **三仓协作** 中的小程序端，与 API、管理后台独立维护、分别提交 Git。

```
Documents/  （或 kunkit/）
├── qsy/              ← 本仓库：微信小程序
├── xiaoe-api/        ← Node API：登录、用户、历史、管理接口
└── kunkit-admin/     ← Next.js 管理后台
```

| 仓库 | 职责 |
|------|------|
| **qsy**（本仓） | 小程序页面、工具逻辑、云函数、`utils/config.js` |
| **xiaoe-api** | Express 后端、MySQL、JWT 鉴权、管理端 API |
| **kunkit-admin** | 用户管理、VIP 配置、公告、数据统计 |

统一响应格式：`{ "code": number, "msg"?: string, "data"?: T }`，成功时 `code === 200`。

后端详情见 [BACKEND.md](./BACKEND.md) 与 `xiaoe-api` 仓库内的 README。

---

## 目录结构

```
qsy/
├── app.js / app.json / app.wxss    # 小程序入口与全局配置
├── pages/                          # 页面
│   ├── index/                      # 首页（去水印 / 工具箱 / 我的）
│   ├── history/                    # 处理记录列表
│   ├── history-detail/             # 记录详情与再次保存
│   ├── favorites/                  # 我的收藏
│   ├── notifications/              # 消息通知
│   ├── live-photo/                 # Live Photo 保存
│   ├── format-convert/             # 格式转换
│   ├── image-compress/             # 图片压缩
│   ├── bind-email/                 # 邮箱绑定
│   ├── invite/                     # 邀请好友
│   ├── feedback/                   # 意见反馈
│   ├── privacy/                    # 隐私政策
│   └── terms/                      # 用户协议
├── utils/                          # 公共模块
│   ├── config.js                   # API、云环境、解析接口、广告位等配置
│   ├── auth.js                     # 登录、Token、API 请求封装
│   ├── parse.js                    # 三方视频链接解析
│   ├── history.js                  # 处理记录（本地 + 云端）
│   ├── favorites.js                # 收藏
│   ├── entitlement.js              # VIP / 每日广告解锁权益
│   ├── unlock-gate.js              # 解锁弹窗与广告流程
│   ├── rewarded-ad.js              # 激励式视频广告
│   ├── media.js                    # 相册授权、下载、保存
│   ├── notifications.js            # 系统通知
│   └── version.js                  # 版本号（可由脚本生成）
├── cloudfunctions/                 # 微信云函数
│   ├── login/                      # 登录（API 不可用时的回退）
│   ├── bindEmail/                  # 邮箱绑定
│   ├── sendEmailCode/              # 发送邮箱验证码
│   ├── parseVideo/                 # 视频解析（已迁移为小程序直连三方）
│   └── adminApi/                   # 管理相关云函数代理
├── assets/                         # 图标与品牌资源
├── styles/                         # 全局子页面样式
├── scripts/
│   └── gen-version.js              # 根据三仓 Git 生成 version.js
└── project.config.json             # 微信开发者工具项目配置
```

---

## 快速开始

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（建议基础库 ≥ 3.16）
- 已开通的微信小程序与云开发环境
- （可选）本地 `xiaoe-api` 服务，用于联调登录与用户接口

### 1. 克隆与打开

```bash
git clone <本仓库地址> qsy
```

用微信开发者工具导入项目根目录，确认 `project.config.json` 中的 AppID 与云开发环境正确。

### 2. 配置 `utils/config.js`

```js
const CLOUD_ENV = "你的云环境 ID"
const API_BASE = "https://kit.baimengyan.cn"   // 本地调试可改为 http://127.0.0.1:端口
const PARSE_API = "https://..."                // 三方解析接口
const PARSE_APP_ID = "..."
const PARSE_APP_KEY = "..."
const REWARDED_VIDEO_AD_UNIT = "adunit-..."    // 激励视频广告位
```

| 配置项 | 说明 |
|--------|------|
| `CLOUD_ENV` | 微信云开发环境 ID，邮箱绑定等能力依赖 |
| `API_BASE` | 自建 API 根地址；留空则登录走云函数 |
| `PARSE_*` | 视频解析三方接口，须在公众平台配置 **request 合法域名** |
| `REWARDED_VIDEO_AD_UNIT` | 微信流量主激励视频广告单元 ID |

### 3. 启动 API（可选）

```bash
cd ../xiaoe-api
cp .env.example .env
npm install
npm run dev
```

将 `API_BASE` 指向本地地址即可联调。

### 4. 云函数

在微信开发者工具中右键 `cloudfunctions/` 各目录，选择「上传并部署：云端安装依赖」。

### 5. 生成版本号（可选）

```bash
node scripts/gen-version.js
```

会读取本仓、`xiaoe-api`、`kunkit-admin` 的 Git 信息，写入 `utils/version.js`。

---

## 核心流程

### 去水印解析

```
用户粘贴链接
    → entitlement 检查 VIP / 今日是否已广告解锁
    → parse.js 请求三方解析 API
    → 展示视频 / 图集预览
    → media.js 下载并保存到相册
    → history.js 写入处理记录
```

### 登录鉴权

```
App.onLaunch
    → wx.cloud.init
    → auth.ensureLogin()
        → 有 API_BASE：wx.login → POST /api/login → 存 Token
        → 无 API_BASE：云函数 login
```

后续需鉴权请求在 `auth.requestApi` 中自动附带 `Authorization: Bearer <token>`。

---

## 页面一览

| 页面 | 路由 | 功能 |
|------|------|------|
| 首页 | `pages/index/index` | 去水印、工具箱入口、个人中心 |
| 处理记录 | `pages/history/history` | 历史解析列表 |
| 记录详情 | `pages/history-detail/history-detail` | 查看 / 再次保存 |
| 我的收藏 | `pages/favorites/favorites` | 收藏的解析结果 |
| 消息通知 | `pages/notifications/notifications` | 系统消息 |
| Live Photo | `pages/live-photo/live-photo` | 保存 Live 动态图 |
| 格式转换 | `pages/format-convert/format-convert` | HEIC / GIF 转换 |
| 图片压缩 | `pages/image-compress/image-compress` | 图片体积压缩 |
| 绑定邮箱 | `pages/bind-email/bind-email` | 邮箱验证绑定 |
| 隐私政策 | `pages/privacy/privacy` | 隐私说明 |
| 用户协议 | `pages/terms/terms` | 服务条款 |

---

## 开发说明

### 接口约定

- 小程序登录：`POST /api/login`，body `{ code }`（`wx.login` 返回的 code）
- 管理端鉴权：Bearer Token 或 `X-Admin-Token` / `X-Admin-Key`（见 API 仓库）
- 改接口时需同步检查：`utils/auth.js`、API `src/routes/`、管理端 `admin-api.ts`

### 注意事项

- 三仓各自独立 Git，一次提交不会覆盖全部仓库
- 勿将 `.env`、密钥等提交到版本库
- `server/` 目录已废弃，后端请使用 `xiaoe-api`
- 解析接口域名、API 域名均需在小程序后台配置合法域名
- 保存相册需用户授权 `scope.writePhotosAlbum`

### 相关文档

- [BACKEND.md](./BACKEND.md) — API 独立仓库说明与本地启动
- `xiaoe-api/README.md` — 接口列表、数据库、部署
- `.cursor/rules/project.mdc` — 三仓协作与改动指引（Cursor 规则）

---

## 许可证

私有项目，未经授权请勿分发或商用。
