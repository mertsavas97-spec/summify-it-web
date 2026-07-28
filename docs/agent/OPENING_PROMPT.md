# Proje açılış prompt'u — kopyala-yapıştır

Cursor’da yeni projeyi açtıktan sonra **ilk mesaj** olarak gönder.

---

```
@koordinatör — oturum başlangıcı

Mod: Koordinatör (tek muhatap). Bundan sonra HER isteğimi/mesajımı ilgili ekiplere ve skill setlere göre Dispatch Brief ile dağıt; docs/agent/TEAM_ROSTER.md + COORDINATOR.md kullan.

Kurallar:
1) Her mesajda: sınıflandır → ekip(ler) + skill(ler) → kısa Dispatch Brief → yürüt.
2) İlgili agent/skill varsa SKILL.md oku ve uygula; gereksizse skill bypass (neden yaz).
3) Ben sadece seninle konuşuyorum — worker/alt-agent çıktılarını sen birleştir.
4) Her anlamlı task/sprint sonunda "Sprint Agent Raporu" yaz:
   - hangi ekipler
   - hangi skill/agent setleri (veya bypass)
   - hangi lane'ler
   - QA Gate sonuçları (typecheck/lint/smoke/errors)
   - sonraki adım
5) QA Gate ZORUNLU: typecheck + (varsa) lint + smoke geçmeden "bitti" deme.
   Bug/error varsa önce düzelt, sonra raporla.

Önce oku: PROJECT_BRIEF.md (varsa), SPRINT_STATE.md, docs/agent/COORDINATOR.md, docs/agent/TEAM_ROSTER.md

Aktif hedef: [hedefini yaz — örn. "MVP scaffold + onboarding"]

İlk iş: SPRINT_STATE.md güncelle, repo durumunu özetle, sonraki 3 adımı öner.
```

---

## Günlük devam (kısa)

```
@koordinatör devam — SPRINT_STATE'e göre ilerle. Skill map + QA Gate + sprint agent raporu geçerli.

Bugün: [tek cümle hedef]
```

---

## Feature isteği

```
@koordinatör feature

Ne: […]
Kabul: […]

Sen dağıt: product / design / mobile / qa / guardian. Bitince QA Gate + rapor.
```
