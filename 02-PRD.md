# 产品需求文档（PRD）

## 产品定位

**CounterUAVHub** 是一个面向英文市场的反无人机技术综合资源平台，提供无人机信号参数查询工具、技术分析文章和行业资讯。目标用户是工程师、安防从业者和研究人员。

---

## 用户类型与核心场景

| 用户类型 | 进站关键词 | 核心需求 |
|---------|-----------|---------|
| 设备选购者 | best counter drone jammer, anti drone system | 选购决策，需要对比和建议 |
| 系统配置者 | DJI Mavic 3 frequency, drone signal specs | 查具体型号参数，配置探测/反制设备 |
| 方案设计者 | drone jamming frequency range, RF detection | 出方案需要技术依据 |
| 学习研究者 | how drone jammers work, UAV frequency bands | 理解原理，延伸阅读 |

---

## MVP 功能模块

### 1. 首页

- 平台简介（一句话说清楚这个站是干什么的）
- 核心工具入口
- 最新收录型号（回访驱动）
- 最新文章列表
- SEO 优化的 meta 信息

### 2. 核心工具：Drone Signal Database

**功能描述：**
双向查询设计——既可以从型号查频率，也可以从频段查型号。

**正向查询（型号 → 参数）：**
用户已知无人机型号，查询其完整信号参数。

**反向查询（频段 → 型号）：**
用户已知频段，查询有哪些无人机型号在该频段运行。适合配置探测系统和制定反制方案。

**筛选维度：**
- 按频段：433MHz / 900MHz / 1.2GHz / 2.4GHz / 5.8GHz / GPS
- 按类别：消费级 / 工业级 / FPV / 军用
- 按品牌：DJI / Autel / Parrot / 其他
- 关键词搜索型号

**输出内容（每条记录）：**
- 无人机型号名称
- 控制频率
- 图传协议（OcuSync / Lightbridge / WiFi 等）
- 图传频率
- GPS 频段
- 最大发射功率
- 建议反制频率范围
- 场景引导：
  - 如果你在选购干扰设备 → 需要覆盖的频段
  - 如果你在配置 RF 探测 → 建议扫描范围
  - 相关文章内链
- 数据来源标注 + 可信级别（官方文档 / FCC 数据库 / 第三方测试）

**数据说明：**
- MVP 覆盖约 25-30 个主流型号，覆盖范围：
  - DJI 消费级：Mavic 4 Pro、Mavic 3 Pro/Classic、Air 3S、Mini 4 Pro、Mini 5 Pro、Mini 3/Mini 3 Pro、DJI FPV（7个）
  - DJI 工业级：Matrice 4T/4E、Matrice 400、Matrice 350 RTK、Matrice 300 RTK、Matrice 30/30T（5个）
  - Autel：EVO Max 4T/4N、EVO II Pro V3、EVO Lite/Lite+（3个）
  - Parrot：ANAFI、ANAFI USA、ANAFI Ai、ANAFI UKR（4个）
  - Skydio：X10、X10D（2个）
  - FPV（按协议收录）：ExpressLRS、TBS Crossfire、DJI O3 Air Unit、HDZero、Walksnail Avatar、模拟图传（6个）
- 每条记录有明确数据来源
- 页面显著位置注明：Data sourced from official specifications and public records. Always verify before deployment.

**数据来源优先级：**
1. DJI / 厂商官方规格页（最高可信）
2. FCC 数据库
3. 第三方测试报告（标注来源）

### 3. 页面结构

```
/tools/drone-signal-database           总览 + 双向筛选导航
/tools/drone-signal-database/2-4ghz    按频段聚合页（SEO，自动生成）
/tools/drone-signal-database/5-8ghz
/drones/dji-mavic-3                    型号详情页（SEO，每型号独立页）
/drones/dji-mini-4-pro
```

### 4. 内容模块：Blog

**MVP 上线 3 篇文章：**

| 文章 | 目标关键词 | 对应用户 |
|------|-----------|---------|
| What frequencies do drones use? | drone frequency, what frequency do drones use | 学习研究者 |
| How drone jammers work | drone jammer frequency, how drone jammers work | 方案设计者 |
| Counter-drone RF detection guide | RF drone detection, counter drone detection | 系统配置者 |

**文章规格：**
- 每篇 1500-2500 字
- 结构化标题（H1/H2/H3）
- 至少 1 个内链指向工具页
- schema markup（Article）

**后续内容节奏（MVP 后）：**
- 固定：每月 2 篇 SEO 文章（关键词驱动，AI 辅助生成，人工审核）
- 趋势：发现相关热点 → 48小时内发文（监控渠道：Google Alerts / Twitter / 行业媒体 RSS）
- 趋势内容第二阶段自动化：Agent 监控 → Telegram 推送 → 人工确认 → AI 生成初稿 → 审核发布

### 5. 行业新闻模块：News

**定位：** 新闻聚合 + 事件分析双轨并行

**5.1 新闻聚合（自动化，回访驱动）**

自动抓取行业媒体的新闻标题和链接，按时间排列展示，点击跳转原文。

- 数据来源：FlightGlobal、The War Zone、Drone DJ、sUAS News 等 RSS 源
- 更新频率：自动每日抓取
- 展示内容：标题、来源、发布时间、摘要、原文链接
- 不转载全文，只做聚合导航

**5.2 事件分析文章（内容核心，SEO 价值高）**

重要事件发生时，发布一篇从技术角度深度解读的原创文章。

触发条件（满足任一即触发）：
- 重大无人机安全事件（机场、军事设施、能源设施）
- 新型号发布（主流品牌新产品）
- 重要法规更新（各国无人机/反制法规）
- 新反制技术突破

生产流程：
```
监控渠道触发（Google Alerts / Twitter / RSS）
        ↓
Telegram 推送提醒（人工判断是否值得写）
        ↓
AI 生成英文分析文章初稿
        ↓
人工审核技术准确性（15-20分钟）
        ↓
发布到 /blog/[slug]
```

监控渠道：
- Google Alerts（关键词：counter drone / UAV security / drone incident）
- Twitter/X（#counterUAS / #antidrone / #dronedefense）
- 行业媒体 RSS（FlightGlobal / The War Zone / Drone DJ）
- Reddit（r/drones / r/cybersecurity 热帖）

**MVP 阶段：** 手动执行，第二阶段接入 Agent 自动化（需验证内容方向有流量后再投入）

### 6. 基础设施

- Google Analytics 4 接入
- Google Search Console 接入
- sitemap.xml 自动生成
- robots.txt 配置

---

## 完整页面结构

```
/                                      首页
/tools/drone-signal-database           工具总览
/tools/drone-signal-database/[band]   频段聚合页（自动生成）
/drones/[slug]                         型号详情页
/blog                                  文章列表
/blog/[slug]                           文章详情
/news                                  新闻聚合页
/about                                 关于页面
```

---

## 后期扩展模块（非 MVP）

按优先级排列，有流量后逐步添加：

| 模块 | 描述 | 触发条件 |
|------|------|---------|
| 设备对比页 | 反制/探测设备横向对比 | 有稳定 SEO 流量 |
| 干扰器覆盖范围计算工具 | 输入功率和频段，输出有效范围 | 工具页有用户 |
| 各国法规查询 | 无人机管制 + 反制合法性 | 内容积累到一定量 |
| 产品数据库 | 主流反制设备参数 | 联盟变现准备好后 |

---

## 变现路径

### 阶段一：Google AdSense（上线即准备）

- 流量达到 500 UV/月后申请
- 广告位：文章页侧边栏 + 文章内嵌
- 预期收益：$5-20/月（500 UV）→ $50-150/月（5000 UV）

### 阶段二：联盟营销（3-6 个月后）

最适合本站的变现方式，单次转化价值高。

| 联盟方向 | 平台 | 佣金估算 |
|---------|------|---------|
| 反无人机设备 | DroneShield、Amazon | 设备单价 $500-50,000，佣金 3-8% |
| 无线电/频谱分析设备 | Amazon Associates | 单价 $200-2000，佣金 3-5% |
| 专业课程 | Udemy、Coursera | 单价 $50-200，佣金 10-30% |

实施方式：在型号详情页和文章页嵌入"推荐设备"区块，附联盟链接。

### 阶段三：付费功能（6 个月后，视流量决定）

- 完整数据库导出（CSV）：$9-19/次
- 高级筛选和对比功能：$9-29/月订阅
- 定制化频率报告（TO B）：按需报价

### 收益预测

| 时间节点 | UV/月 | 预计月收益 |
|---------|-------|---------|
| 第3-4个月 | 500 | $5-20 |
| 第6个月 | 1000-3000 | $20-80 |
| 第12个月 | 5000-15000 | $100-400 |
| 第18个月 | 持续增长 | $200-600（含联盟） |

---

## 非功能需求

- 页面加载速度：核心页面 LCP < 2.5s
- 移动端适配：响应式设计，移动端优先
- SEO：每个页面有独立 title / description / canonical
