# CounterUAVHub

Counter-drone technical reference platform for engineers, security professionals, and researchers.

**Domain:** counteruavhub.com
**Stack:** Next.js 16 · TypeScript · Tailwind CSS · Cloudflare Pages
**Status:** Post-MVP growth validation

## What this is

A vertical SEO tool site covering counter-drone and anti-UAV technology:

- **Drone Signal Database** — RF parameters for 90+ drone models (control freq, video protocol, GPS, counter-freq)
- **RF Calculators** — jammer effectiveness, RF detection range, and FSPL tools
- **Technical Blog** — in-depth articles on drone frequencies, jamming, RF detection, GNSS, and sensor fusion
- **Industry News** — automated counter-UAS news aggregation
- **Frequency SEO Pages** — static landing pages for 2.4GHz, 5.8GHz, and GNSS bands
- **Brand SEO Pages** — static landing pages for indexed drone brands, with source confidence labels

## Project structure

```
counteruavhub/
├── web/                  # Next.js app (Cloudflare Pages)
│   ├── app/              # App Router pages
│   ├── components/       # UI components
│   ├── data/             # JSON-backed drone/news data and TS exports
│   ├── content/blog/     # Markdown articles
│   ├── scripts/          # News/drone update scripts and tests
│   └── lib/              # Utilities
├── 00-项目启动.md
├── 02-PRD.md
├── 03-技术方案.md
├── 04-研发任务拆解.md
├── 05-运营计划.md
└── 06-交付验收.md
```

## Development

```bash
cd web
npm install
npm run dev      # localhost:3000
npm run lint
npm run test:news
npm run test:drones
npm run test:site
npm run build    # static export to out/
```

## Deployment

Git push → GitHub → Cloudflare Pages auto-deploy  
Build command: `npm run build`  
Output directory: `out`
