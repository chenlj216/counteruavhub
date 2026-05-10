# 无人机型号数据库自动更新说明

## 当前策略

CounterUAVHub 的无人机型号库采用“来源目录 + 官方页面抓取 + RF profile 兜底 + 静态 JSON 发布”的方式。

目标不是宣称已经覆盖世界上每一架无人机，而是持续扩大可检索型号范围，并优先保证 RF 相关字段能被工具页和计算器稳定使用。

## 自动化运行

GitHub Actions 文件：

```text
.github/workflows/update-drones.yml
```

触发方式：

- 每天北京时间 06:45 自动运行
- GitHub Actions 页面手动 `workflow_dispatch`

自动化流程：

1. 读取 `web/data/drone-source-catalog.json`
2. 尝试访问每个型号的官方或厂商页面
3. 从页面文本中抽取频段、视频链路、GNSS、发射功率线索
4. 如果厂商页面 403、404、超时或网络失败，则使用目录中的 RF profile 兜底
5. 合并到 `web/data/drones.json`
6. 运行测试、类型检查、lint、静态构建
7. 如 `web/data/drones.json` 有变化，则直接提交到 main
8. Cloudflare Pages 自动部署

## 数据文件

- `web/data/drones.json`：网站实际使用的机器可写无人机数据库
- `web/data/drones.ts`：类型定义和导出入口
- `web/data/drone-source-catalog.json`：自动扩容的来源目录
- `web/scripts/drone-updater.mjs`：抓取、抽取、合并逻辑
- `web/scripts/update-drones.mjs`：命令行入口

## 本地运行

在 `web/` 目录执行：

```bash
npm run update-drones
```

写入数据：

```bash
npm run update-drones -- --write --allow-fetch-failure
```

验证：

```bash
npm run test:drones
npx tsc --noEmit
npm run lint
npm run build
```

## 来源覆盖策略

当前目录覆盖这些来源类型：

- 消费级：DJI、Autel、Parrot、Skydio、Yuneec、FIMI、Hubsan、Potensic、Holy Stone、Ruko
- 工业级：DJI Enterprise、Autel Enterprise、Wingtra、senseFly / AgEagle、Freefly、Sony、Teledyne FLIR、Inspired Flight、Percepto、Matternet、Zipline、Flyability
- 军警/战术级：AeroVironment、Quantum-Systems、Teal、Skydio X2D、AgEagle eBee TAC
- FPV/协议级：DJI O3、HDZero、Walksnail、Analog FPV、ELRS/Crossfire 类 Sub-GHz 链路

后续想继续接近“所有已知无人机”，优先扩展 `drone-source-catalog.json`，每次加入一批品牌和型号即可。

## 注意事项

很多厂商官网会对 GitHub Actions 或本机自动访问返回 403、404、超时或反爬失败。脚本会记录失败，并使用目录中的 RF profile 兜底，避免自动更新中断。

字段中涉及 RF 频段、发射功率和链路带宽时，自动抽取只能作为公开资料整理线索。真实部署前仍应以厂商规格书、FCC/CE 文件或实测为准。
