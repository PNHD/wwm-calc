# AutoClaw task — crawl wwmdb.vlt.fyi for Inner Way data

WebFetch trả 403 (site cần JS/browser). Cần AutoClaw chạy Playwright runtime như đã làm với
competitor bundle (decode `Ft`/`Ha`). Mục tiêu: lấy **đầy đủ substat ("Attribute Buff") + max-stack
mechanic của tất cả Inner Ways** để nhập vào `src/data/innerways.ts` thay cho việc user chụp tay từng cái.

## Site
`https://wwmdb.vlt.fyi/` — game DB cho Where Winds Meet (gear/skill/inner-way). 403 với fetch thường.

## Cần lấy (per Inner Way)
1. **Tên** (EN + nếu có CN/ID — game ID format giống `4062314033`).
2. **Path/class** nó thuộc về (Bamboocut-Dust/Wind, Bellstrike-Splendor/Umbra, Silkbind-Jade/Deluge,
   Stonesplit-Might/Strength, General).
3. **Basic Buff** (cơ chế, kèm max-stack & per-stack value — vd "Collapse +5 Pen/+5% CDmg ×5 stacks").
4. **Attribute Buff** (substat panel — đây là phần QUAN TRỌNG NHẤT): các dòng kiểu
   Precision Rate %, Crit Rate %, Crit DMG %, Direct Crit %, Direct Affinity %, Affinity DMG %,
   Physical Penetration, Min/Max Physical Attack, Min/Max <element> Attack, Physical DMG Bonus %.
   ⚠️ **Attribute Buff thường có NHIỀU dòng, mỗi dòng mở khóa ở một tier khác nhau** (vd Mountain's
   Might: T2 mở "Max Bellstrike", T5 mở "Bellstrike Pen +6"). Phải gom **TẤT CẢ dòng Attribute Buff
   từ mọi tier** thành tổng cuối ở max tier — KHÔNG chỉ lấy dòng hiện ở T6 breakthrough screen.
   ⚠️ Nhiều dòng ghi **"based on Solo Mode Level"** = giá trị ĐỘNG theo level → cần con số ở **Lv91/95
   (Global T91)**. wwmdb có thể cho số cố định theo level; nếu có level selector chọn 91/95. Số cố định
   verified ở 91: Min Phys 63.8 / Min hệ 36.2 / Pen 5.1 hoặc 6 / DMG bonus 2.5-2.8% / Precision 6.5% /
   Direct Crit 4.1-4.6% — dùng làm mốc đối chiếu.
5. **Tier 1-6 breakthrough gains** (mỗi tier 1 dòng) + **đánh dấu tier nào mở dòng Attribute Buff nào**.

## Cách crawl (gợi ý)
- Mở site bằng Playwright, để JS render. Tìm route list inner-ways (thử `/inner-way`, `/innerways`,
  `/心法`, hoặc xem network tab có API JSON `/api/...` trả data không — ưu tiên API hơn scrape DOM).
- Nếu có API JSON: dump raw JSON, đó là nguồn sạch nhất.
- Nếu chỉ có DOM: scrape mỗi inner-way page lấy 5 mục trên.
- Output: 1 file JSON `{ id, nameEn, path, basicBuff, attributeBuff: {stat:value...}, tiers:[...] }[]`.

## Mapping về app (để agent nhập sau biết đường)
Field substat → key trong `innerways.ts` `stat:{}`:
- Precision% → `prec` · Crit% → `crit` · Crit DMG% → `critDmg` · Direct Crit% → `dcrit`
- Direct Affinity% → `daff` · Affinity DMG% → `affDmg` · Physical DMG Bonus% → `outerDmg`
- Physical Penetration → `outerPen` · Min/Max Phys Atk → `minOuter`/`maxOuter`
- Min/Max <element> Atk → `minPz`/`maxPz` (pz = own-element) · Element Pen → `pzPen` · Element DMG% → `pzDmg`
- all-damage% (cơ chế "increases all damage") → `generalDmg` (NHƯNG generalDmg chỉ tính nếu hiệu quả
  trên boss; bỏ qua nếu cơ chế cần 3+ enemy / non-boss / mob-only).

## Đã verify tay (cross-check, AutoClaw KHỚP thì yên tâm)
- Breaking Point: Collapse ×5 = +25 Pen/+25% CDmg, T6 +Precision 6.5% +Direct Crit 4.1%.
- Bitter Seasons: T6 −10 PhysRes (=+10 pen), T5 +Precision 6.5% +Phys DMG 2.5%.
- Hawkwing 4pc (SET not IW): +10% Phys ATK (5 stack). Sword Morph T5 +Direct Affinity 2.3%.
  Mountain's Might T5 +Bellstrike Pen 6.
- Song of Tang T6 +15% CDmg(MA)+4% +Precision 6.5%. Phantom Rally T6 +8.2% Crit +2.8% PhysDMG.
- Morale Chant / Seasonal Edge: +Min/Max Phys 23.6/47.2. Invigorated +8% all-dmg +Pen 5.1 +Min 63.8.
- Towline +Min Phys 63.8. Light Anew +Min Bamboocut 36.2.

## CẢNH BÁO
- Competitor (wherewindsmath) paths đã SAI lần trước — wwmdb có thể cũng nhóm khác. App paths trong
  `innerways.ts` ĐÚNG (user confirm). Chỉ lấy STAT/substat từ wwmdb, đừng đổi path theo wwmdb.
- App áp MAX stat (full uptime) ở tier cao nhất (T6 chứa toàn bộ); T1-4 trung gian không cộng dồn.
