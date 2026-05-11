# 新闻自动更新说明

## 当前策略

CounterUAVHub 是静态导出站点，新闻自动化采用“多来源定时抓取候选新闻 -> 更新静态 JSON -> 验证构建 -> 自动提交 main -> Cloudflare Pages 自动部署”的方式。

这样可以让新闻页无人值守更新，同时保留 Cloudflare Pages 的静态部署优势。

## 本地运行

在 `web/` 目录执行：

```bash
npm run update-news
```

这会执行 dry run，只打印候选新闻，不写入文件。

确认候选内容后可写入：

```bash
npm run update-news -- --write --max-new=8 --limit=80
```

如果外部新闻源临时失败，但希望命令保留现有数据并正常退出：

```bash
npm run update-news -- --write --allow-fetch-failure --max-new=8 --limit=80
```

线上 GitHub Actions 不使用 `--allow-fetch-failure`。如果所有新闻源都失败，workflow 会失败，避免把“抓取失败”误判为“没有新闻更新”。

## 自动化运行

GitHub Actions 文件：

```text
.github/workflows/update-news.yml
```

触发方式：

- 每天北京时间 06:15 自动运行
- GitHub Actions 页面手动 `workflow_dispatch`

自动化流程：

1. 安装依赖
2. 运行新闻更新脚本，聚合 GDELT 多查询和 Google News RSS 多查询
3. 运行新闻脚本测试
4. 运行 lint
5. 运行静态构建
6. 如 `web/data/news.json` 有变化，则直接提交到 main
7. Cloudflare Pages 监听 main 分支变化并自动部署

## 数据文件

- `web/data/news.json`：机器可写新闻数据
- `web/data/news.ts`：向页面导出类型化数据
- `web/app/news/page.tsx`：新闻列表页面

## 自动发布注意事项

由于当前策略会自动发布，建议定期抽查线上新闻页：

- 标题是否确实和 counter-UAS、drone detection、RF、Remote ID、机场/关键基础设施安全相关
- 来源 URL 是否可打开
- 摘要是否只是概括线索，没有复制原文大段内容
- 分类是否合理

如果某天没有自动提交，先检查 Actions 日志里的每个 `News source ...` 输出，区分“所有来源失败”“部分来源失败但无新增”“确实没有匹配新闻”。

如果需要重新改回人工审核，可以把 `.github/workflows/update-news.yml` 的最后一步换回创建 PR。
