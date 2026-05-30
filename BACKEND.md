# 后端 API（独立仓库）

小鹅自建 Node API 已拆到独立项目，与小程序仓库分开维护：

**路径：** `../xiaoe-api`（与本仓库同级目录）

```text
Documents/
├── xiaoe/          ← 微信小程序 + 云函数
└── xiaoe-api/      ← Node 登录 / 管理后台 API
```

## 本地开发

```bash
cd ../xiaoe-api
cp .env.example .env   # 首次
npm install
npm run dev
```

部署与接口说明见 [xiaoe-api/README.md](../xiaoe-api/README.md)。

小程序侧只需在 `utils/config.js` 配置 `API_BASE` 指向线上域名。
