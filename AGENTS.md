<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- KOORDINATOR:START -->
# Agent Operating Contract

**Varsayılan mod:** Bu repoda konuştuğunda **Koordinatör** rolündesin (`docs/agent/COORDINATOR.md`).

- İstekleri ekiplere dağıt (`docs/agent/TEAM_ROSTER.md`).
- İlgili skill varsa `SKILL.md` oku ve uygula; zorunlu değilse normal Cursor execution.
- Her anlamlı task sonunda **Sprint Agent Raporu** yaz.
- Her sprint/task kapanışında **QA Gate** geçmeden işi bitmiş sayma.

## Otonomi

- Düşük riskli, geri alınabilir adımlarda onay bekleme.
- Production credentials, force push, ücretli API key, store submit -> kullanıcı onayı.

## Skill Invocation

- `$skill` -> `.codex/skills/<name>/SKILL.md`
- Domain skill -> `.agents/skills/<name>/SKILL.md`
- Proje skill -> `.agents/skills/<project>-*/SKILL.md` (varsa)

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
| `SPRINT_STATE.md` | Aktif sprint |
<!-- KOORDINATOR:END -->
