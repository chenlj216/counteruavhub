# CounterUAVHub

Counter-drone technical reference platform for engineers, security professionals, and researchers.

**Domain:** counteruavhub.com  
**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Cloudflare Pages  
**Status:** MVP development — target launch 2026-04-25

## What this is

A vertical SEO tool site covering counter-drone and anti-UAV technology:

- **Drone Signal Database** — RF parameters for 25+ drone models (control freq, video protocol, GPS, counter-freq)
- **Technical Blog** — in-depth articles on drone frequencies, jamming, and RF detection
- **Industry News** — aggregated from FlightGlobal, The War Zone, Drone DJ

## Project structure

```
counteruavhub/
├── web/                  # Next.js app (Cloudflare Pages)
│   ├── app/              # App Router pages
│   ├── components/       # UI components
│   ├── data/drones.ts    # Drone frequency database
│   ├── content/blog/     # Markdown articles
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
npm run build    # static export to out/
```

## Deployment

Git push → GitHub → Cloudflare Pages auto-deploy  
Build command: `npm run build`  
Output directory: `out`
