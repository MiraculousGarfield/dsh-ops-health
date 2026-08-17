# dsh-ops-health

[![Awesome](https://awesome.re/badge.svg)](https://awesome.re) · [Awesome DeepSeek Harness Plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)

DeepSeek Harness 一键健康检查插件：侧边栏「🩺 健康检查」按钮 → 纯 HTTP 路由
`/ops/health` → 隐藏窗口跑 `check-health.ps1`（8 项体检）→ 结构化报告卡片。

- 按钮配色跟随主题（`--dsw-alias-brand-primary`，皮肤覆盖时跟随皮肤）
- 路由直接注册在 webServer 上，**不经过工具注册表**：agent 工具调用崩了按钮仍可用；
  进程级故障时按钮同样不可用，兜底仍是独立脚本（见 dsh-ops 工具箱）
- 体检逻辑是 PowerShell，**仅支持 Windows**；其他平台按钮会显示"通道不可用"提示

## 安装

```powershell
dsh plugin --profile web add github:MiraculousGarfield/dsh-ops-health
# 重启 dsh 服务（bundles 是启动期组合的），刷新页面即可看到按钮
```

## 卸载

```powershell
dsh plugin --profile web remove dsh-ops-health
# 重启 dsh 服务生效
```

## 结构

| 文件 | 说明 |
|---|---|
| `lib/index.js` | host 面：注册 `/ops/health` 路由，spawn PowerShell（隐藏窗口、60s 超时） |
| `lib/client.js` | 浏览器面：侧边栏按钮（流内插入设置区上方）+ 报告卡片，可逆清理 |
| `scripts/check-health.ps1` | 体检脚本副本（自包含；源在 dsh-ops 仓库根 `scripts/`） |
| `cordis.patch.yml` | bundle patch：一行 `insert` 挂载插件行 |

## 注意

- 官方 `dsh plugin add` 在 Windows 下**路径含空格会炸**（cmd 按空格拆参数）：
  用 git URL 无此问题；本地路径安装需用 8.3 短路径（形如 `C:\Users\SHORTNA~1\...`）
- 卸载后 node_modules 可能留死目录（pnpm 惰性清理），不影响运行

MIT License
