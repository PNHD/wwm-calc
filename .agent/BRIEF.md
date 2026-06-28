# Brief for AI Agent — Phạm Nhật Hải Đăng (Wonton / PNHD)

## Về tôi
- Windows user, workspace chính: `C:\Users\phamn`
- Làm việc bằng tiếng Việt, code/prompt kỹ thuật bằng tiếng Anh
- Phong cách code: tối giản, không over-engineer (Ponytail mode)
- Dùng cả Claude Code + CodeWhale + Antigravity

## Dự án đang active

### 1. WWM Calc (Yanyun Calculator) — `D:\WWM Calc`
- Web app tính toán gear cho game Where Winds Meet (燕云十六声)
- Stack: Vite + React 19 + TypeScript + Tailwind CSS + shadcn/ui (lucide-react)
- Live: wonton-wwm.pages.dev | GitHub: PNHD/wwm-calc
- Deploy: Cloudflare Pages, auto on push main
- OCR gear scan: tesseract.js
- Data: Wonton.json (~1854 dòng)
- Author in-app: Wonton
- Edition: Global (T91 / Lv95), Tier = 95下
- Có CLAUDE.md với các quyết định đã lock — đọc kỹ trước khi sửa gì

### 2. pnhd-portfolio (Nova UI Kit) — `D:\pnhd-portfolio`
- UI Kit "Nova" để bán trên UI8
- 24 màn hình thiết kế, dùng Stitch MCP + Figma
- Figma plugin: 00-variables.js, 01-foundation.js, 02-components.js, 03-screens.js, 04-icons-upgrade.js, ecommerce/00-setup.js
- Còn lỗi: mobile screens không đồng nhất, output token limit 32K

### 3. TK Pipeline (Thiên Kim) — `D:\Thiên Kim`
- Hệ thống tự động hóa video TikTok/Reels bằng AI
- Stack: n8n (Railway) + Cloudflare Worker + D1 + Gemini Vision
- 3 content types: ootd_editorial, beauty_editorial, brand_storytelling
- Nhân vật: Thiên Kim — fashion/lifestyle content creator Việt Nam
- Backend API: tk-pipeline-worker.phamnhathaidang.workers.dev
- Web app: tk-pipeline.pages.dev
- Lưu ý: Dự án này ĐÃ được tách khỏi WWM Calc repo. Không trộn code.

## Skills đã cài sẵn trong workspace
- Các skill Claude: ckm:design, ckm:brand, ckm:design-system, ckm:ui-styling, ckm:banner-design, ckm:slides, ui-ux-pro-max, karpathy-guidelines
- Đọc SKILL.md trong `.claude/skills/` hoặc `.agent/skills/` khi cần

## Quy tắc làm việc
- Nói tiếng Việt với tôi
- Đọc CLAUDE.md của từng project trước khi sửa code
- Hỏi trước khi thay đổi các quyết định đã lock
- Giữ code tối giản, không over-engineer
- Verify sau mỗi thay đổi
