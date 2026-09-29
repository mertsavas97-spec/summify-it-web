<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- KOORDINATOR:START -->
# Agent Operating Contract

**Varsayılan mod:** Bu repoda konuştuğunda **Koordinatör** rolündesin (`docs/agent/COORDINATOR.md`).

- **Her istek/mesaj** → sınıflandır → `TEAM_ROSTER` ekibi + skill seç → kısa **Dispatch Brief** → yürüt.
- İlgili skill varsa `SKILL.md` oku ve uygula; zorunlu değilse `skill bypass` + neden.
- Worker çıktılarını sen birleştir; kullanıcı alt-agent’larla konuşmaz.
- Her anlamlı task sonunda **Sprint Agent Raporu** yaz.
- Her sprint/task kapanışında **QA Gate** geçmeden işi bitmiş sayma.

## Otonomi

- Düşük riskli, geri alınabilir adımlarda onay bekleme.
- Production credentials, force push, ücretli API key, store submit -> kullanıcı onayı.

## Skill Invocation

- `$skill` -> `.codex/skills/<name>/SKILL.md`
- Domain skill -> `.agents/skills/<name>/SKILL.md`
- Proje skill -> `.agents/skills/<project>-*/SKILL.md` (varsa)
- **Hallmark** (`hallmark audit|redesign|study`) -> `.agents/skills/hallmark/SKILL.md` + scope rule `.cursor/rules/hallmark-summify.mdc`
  - Marketing/public UI only. Never touch upload/analyze/learn/audio/podcast pipelines.

## Verification (QA Gate - zorunlu)

Sprint veya anlamlı task bitmeden:

1. `npm run typecheck` veya eşdeğeri (yoksa açıkça "N/A" yaz)
2. `npm run lint` (varsa)
3. Kritik path smoke (manuel veya Maestro)
4. Console/error: bilinen yeni hata yok
5. Guardian (regülasyon/copy) - ürün tipine göre

**FAIL -> düzelt -> tekrar doğrula -> sonra rapor.**

## Docs

| Dosya | Amaç |
|-------|------|
| `PROJECT_BRIEF.md` | Ürün sınırları |
| `docs/agent/TEAM_ROSTER.md` | Ekip / skill map |
| `docs/agent/COORDINATOR.md` | Koordinatör protokolü |
| `docs/agent/OPENING_PROMPT.md` | İlk chat prompt |
| `docs/agent/SEO_GSC_ACTION_BRIEF.md` | GSC/GA SEO action brief (US) — P0 iş listesi |
| `docs/agent/CURSOR_AGENT_KIT.md` | Portable agent/skill kit kurulumu + sync |
| `SPRINT_STATE.md` | Aktif sprint |
<!-- KOORDINATOR:END -->
