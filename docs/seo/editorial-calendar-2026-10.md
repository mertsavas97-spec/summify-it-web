# Summify — Weekly Editorial Calendar (Oct 2026)

> Oluşturulma: 2026-09-27 · Kaynak: `docs/seo/competitor-top5-2026-09.md` + `docs/seo/title-inventory.md`
> Kural: her yazı `npm run test:unit` içindeki `blog-product-links.test.ts` şartını karşılamalı (relatedLinks'te en az 1 ürün sayfası).

## Seçim mantığı (rakip ilk 5'ten)

4 hedef kelimenin tamamında rakiplerin **0/5** yayınladığı H2'ler:
fiyat, gizlilik, limitler, kullanıcı yorumu / test metodolojisi.
Ayrıca `notebooklm alternatives` sonucunda **Audio Overview alternatifi, migration,
gizlilik ve ücretsiz plan limitleri** neredeyse hiç işlenmemiş (Summify'ın sesli özet
özelliği için doğrudan boşluk).

Uzunluk hedefi: ilk 5'te medyan ~2.700 kelime → **1.800–2.600 kelime** + karşılaştırma
tablosu zorunlu (liste formatı 5/5'te, FAQ 3/5'te).

## Kurallar (her yazı için)

1. **Zorunlu H2'ler:** Fiyat/limitler · Gizlilik & veri · Karşılaştırma tablosu · Test
   metodolojisi ("nasıl değerlendirdik") · SSS.
2. **Ürün linki:** en az biri `relatedLinks`'te (`/summarize-pdf`,
   `/summarize-powerpoint`, `/summarize-youtube-video`, `/audio-study`, `/upload`).
   Gövdede Cluster CTA (`BlogInlineCta`) yazılıyor.
3. **Kannibalizasyon kontrolü:** yeni slug, `docs/seo/title-inventory.md` Bölüm B'deki
   head-term gruplarıyla çakışıyorsa title/H1 niyeti o gruptan ayrılmalı.
4. **Guardian:** fiyat/limit/rakip iddiaları repodaki veriyle (`pricingPlans.ts`,
   `UploadPaywallModal.tsx`) tutarlı olmalı; uydurma testimonial yasak.
5. **Tarih:** her Salı yayın. İlk iki konu aşağıda sabit.

## Haftalık takvim

| Hafta | Yayın | Tür | Slug | Hedef kelime | Durum |
|---|---|---|---|---|---|
| W1 | 2026-10-06 (Salı) | blog | `free-pdf-summarizer-limits-2026` | free pdf summarizer limits / pdf summarizer free | **YAYINDA** |
| W2 | 2026-10-13 (Salı) | blog | `notebooklm-alternatives-audio` | notebooklm alternatives | **YAYINDA** |
| W3 | 2026-10-20 | blog | `best-ai-summarizer-tools-2026` | best ai summarizer tools 2026 | Taslak başlık |
| W4 | 2026-10-27 | guide | `contract-summary-checklist` (mevcut `/guides/contract-summary-ai-guide` derinleştirme) | contract summary | Taslak başlık |

## Sabit ilk iki konu

### W1 — `free-pdf-summarizer-limits-2026`
**Title (taslak, ≤60 kr + marka):** `Free PDF Summarizer Limits in 2026 — What Free Gets You`
**Neden:** rakiplerin hiçbirinde "ücretsiz plan limiti" H2'si yok; SUM50 kampanyasıyla
doğrudan beslenir (free → limit sıkışması → Pro indirimi).
**Yapı:**
- H2 Ücretsiz planda gerçekten ne alırsın (5 analiz/gün — repo kaynağı:
  `UploadPaywallModal.tsx`)
- H2 Dosya boyutu ve format limitleri karşılaştırması (tablo)
- H2 Gizlilik: ücretsiz araçlar verini ne yapıyor (rakiplerin politikasına bak, link ver)
- H2 Ne zaman Pro'ya geçmek mantıklı → `/summarize-pdf` + `/pricing`
- SSS: "Ücretsiz PDF özeticiler güvenli mi?" / "Limit neden var?"

### W2 — `notebooklm-alternatives-audio`
**Title (taslak):** `NotebookLM Alternatives in 2026 — 7 Tools (Audio Overview + Privacy)`
**Neden:** ilk 5 sonucun 3'ü 3.000+ kelimelik liste + puanlı tablo; ama **Audio Overview
alternatifi, migration ve gizlilik H2 olarak yok**. `/compare/notebooklm` zaten var →
yazı ona inner link verir, listicle sorgusunu blog alır.
**Yapı:**
- H2 NotebookLM neyi iyi yapıyor (adil değerlendirme)
- H2 Alternatifler tablosu (sesli özet, gizlilik, ücretsiz limit, kaynak türü)
- H2 Audio Overview'a alternatif: `/audio-study`
- H2 Kaynak taşıma (migration): Notion/Drive yerine dosya yükleme akışı
- H2 Gizlilik & veri saklama
- SSS + `relatedLinks`: `/compare/notebooklm`, `/audio-study`, `/upload`

## Backlog (sıraya alınmış)

- `contract summary` için ticari açılım: rakip ilk 5 tamamen devlet PDF'i →
  "tanım + örnek + AI ile 3 adım" sayfası yapısal rakipsiz.
- Blog arşivine ürün linki denetimi kalıcı: `tests/unit/blog-product-links.test.ts`
  (`npm run test:unit`) — yeni yazı eklerken zorunlu.
- CMS (Supabase) yazıları bu takvimin dışında; canlı sitemap'te onlar da var.
