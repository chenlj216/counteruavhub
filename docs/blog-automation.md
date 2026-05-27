# CounterUAVHub 博客自动草稿与人工审核

## 当前策略

博客技术文章采用“服务器定时触发 -> OpenClaw 北斗 Agent 生成英文技术草稿 -> 项目脚本校验 -> 写入状态文件并在服务器日志中输出审核摘要”的方式。

当前版本暂时放弃 Telegram 推送，只生成草稿、状态文件和日志摘要，不自动发布到 `main`，也不修改 OpenClaw gateway、agent systemd 配置。

## 服务器路径

当前服务器项目路径：

```text
/root/.openclaw/workspace/projects/counteruavhub
```

该路径在 OpenClaw workspace 下，但本自动化只修改 CounterUAVHub 项目内部文件，不写入 OpenClaw 顶层工作区配置。

## 本地模块

- `web/scripts/blog-context-builder.mjs`：读取 `news.json`、`drones.json` 和现有博客，生成候选选题上下文。
- `web/scripts/blog-draft-validator.mjs`：校验 Markdown frontmatter、重复 slug、安全边界和站内链接。
- `scripts/server/blog-draft-review-runner.py`：服务器侧编排脚本，负责调用 OpenClaw `main`（北斗）Agent、写草稿、校验、构建、写状态文件和输出审核摘要。

## 安全边界

自动草稿只允许：

- 公开资料层面的 counter-UAS 技术科普
- RF detection、Remote ID、sensor fusion、source confidence、合规和系统设计
- 防御性、教育性、系统规划表达

禁止自动输出：

- 具体干扰参数配置
- 可操作 jamming / spoofing 步骤
- 绕过、规避、攻击或对抗执法的细节
- 把推断数据伪装成官方事实

## 本地验证

在 `web/` 目录运行：

```bash
npm run test:blog-automation
npm run blog-context
```

校验某篇草稿：

```bash
npm run validate-blog-draft -- content/blog/example.md
```

## 服务器 dry run

dry run 不调用北斗 Agent、不写草稿：

```bash
cd /root/.openclaw/workspace/projects/counteruavhub
python3 scripts/server/blog-draft-review-runner.py --dry-run --skip-agent --skip-build
```

## 服务器实际运行

实际运行会生成草稿、执行校验和构建，写入状态文件，并在标准输出中打印审核摘要：

```bash
cd /root/.openclaw/workspace/projects/counteruavhub
python3 scripts/server/blog-draft-review-runner.py
```

如想先跳过构建，只验证草稿格式：

```bash
python3 scripts/server/blog-draft-review-runner.py --skip-build
```

## 状态检查

每次运行都会写入：

```text
var/blog-automation/status.json
var/blog-automation/history.jsonl
```

`status.json` 是最近一次运行状态，核心字段包括：

- `status`：`running` / `success` / `failed` / `dry_run`
- `stage`：当前或结束阶段
- `draftPath`：生成的 Markdown 草稿路径
- `title` / `slug`：文章标题和 slug
- `validation`：字数、站内链接、安全校验结果
- `buildChecked`：是否执行了 `npm run lint` 和 `npm run build`
- `error`：失败原因摘要

服务器上可直接查看：

```bash
cd /root/.openclaw/workspace/projects/counteruavhub
cat var/blog-automation/status.json
tail -n 20 var/blog-automation/history.jsonl
```

## systemd 定时任务

仓库内提供了服务器侧 systemd 模板：

- `scripts/server/systemd/counteruavhub-blog-review.service`
- `scripts/server/systemd/counteruavhub-blog-review.timer`
- `scripts/server/install-blog-review-systemd.sh`

安装方式：

```bash
cd /root/.openclaw/workspace/projects/counteruavhub
chmod +x scripts/server/install-blog-review-systemd.sh
sudo scripts/server/install-blog-review-systemd.sh
```

当前版本不需要 Telegram 凭据。安装脚本只安装 systemd service/timer：

```text
counteruavhub-blog-review.service
counteruavhub-blog-review.timer
```

安装后启动定时器：

```bash
sudo systemctl start counteruavhub-blog-review.timer
sudo systemctl list-timers counteruavhub-blog-review.timer
```

手动触发一次：

```bash
sudo systemctl start counteruavhub-blog-review.service
sudo journalctl -u counteruavhub-blog-review.service -n 80 --no-pager
```

默认频率为每周一、周四 09:30 左右触发一次，额外有 30 分钟随机延迟，避免与其他任务同时运行。

## 审核内容

服务日志中的审核摘要包含：

- 文章标题
- 摘要和正文预览
- 风险等级
- 选题理由
- frontmatter / slug / 字数 / 站内链接校验结果
- 是否执行构建
- 服务器草稿路径

查看日志后先审核 Markdown 内容，再决定是否修改、删除或发布。

```bash
sudo journalctl -u counteruavhub-blog-review.service -n 120 --no-pager
```

如果以后恢复 Telegram 推送，需要重新接入通知分支，并在运行环境中提供相应 Bot 凭据。
