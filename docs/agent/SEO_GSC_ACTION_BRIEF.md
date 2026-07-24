# Summify — SEO Agent Action Brief

**Kaynak:** Google Analytics (24 Nis–22 Tem 2026) + Search Console (son 3 ay, export 24 Tem 2026)  
**Hedef pazar:** ABD ağırlıklı (EN-US)  
**Bu doküman:** Koordinatör ve SEO/growth agent’ların sitede yapacağı işlerin tek kaynak brief’i.  
**Skill set:** `seo-audit` · `programmatic-seo` · `schema-markup` · `analytics-tracking` · `product-analytics`

---

## 0) Durum özeti (kanıt)

| Metrik | Değer | Yorum |
|--------|-------|--------|
| Analytics açılış / ilk aktivite | Mayıs 2026 | 90g pencerede en olgun site |
| GSC ilk gösterim | 2026-05-20 | ~2 aylık arama varlığı |
| GA aktif / yeni (90g) | 150 / 158 | Returning var |
| Ort. engagement | **5m 18s** | Ürün sinyali güçlü (diğer 3 siteden çok üstün) |
| Organik GA (Google+Bing) | ~6 kullanıcı | SEO henüz kırılmamış |
| GSC tıklama / gösterim | 11 / 1.934 | CTR %0.57 |
| US gösterim payı | **%45** (873 imps) | US tıklama: **0** |
| Sorgu / sayfa sayısı | 158 / 82 | Index geniş, sıra derin |
| Ort. pozisyon (site) | ~41 | Çoğu gösterim 41+ |

**Teşhis:** Ürün tutuyor; arama görünürlüğü zayıf. Asıl blokaj: **www ↔ non-www sinyal bölünmesi** + non-brand cluster (`pdf summarizer`) poz 44–80.

---

## 1) Önem sırası (P0 → P3)

### P0 — Bu sprint (1–2 hafta) — blokaj kaldır

1. **Tek host kararı + 301 + canonical**
   - Kanıt: `summify.app/` 826 imps @35.4 vs `www.summify.app/` 278 imps @7.8
   - Yapılacak: tek tercih edilen host (öneri: `www` veya apex — birini seç, diğerini 301), tüm internal link + sitemap + OG URL hizala
   - Agent: SEO + engineering
2. **Primary landing: PDF summarizer (US)**
   - Kanıt: `pdf summarizer` 131@44 — en yakın non-brand win
   - Tek URL’ye title/H1/FAQ/meta hizala; `summarize pdf`, `ai pdf summarizer` secondary
3. **GSC’de US filtre + P0 URL izleme checklist** (haftalık pozisyon)

### P1 — 2–4 hafta — tıklama kırılımı

4. Mode sayfaları: `/summarize-powerpoint`, `/modes/contract-analyzer`
5. Internal link hub: homepage / upload / modes / blog cluster
6. FAQ + HowTo/SoftwareApplication schema (landing + modes)
7. CWV / LCP tool sayfalarında (özellikle upload workspace)

### P2 — 4–8 hafta — içerik ölçeği

8. US blog öncelik listesi (aşağı §5)
9. Alternatives cluster (`notebooklm alternatives` 18@68)
10. Study/exam-prep açıları (zaten bazı blog’lar poz 6–25 — çoğalt)

### P3 — Bilinçli ertele

11. Head term tam savaş (`best ai summarizer 2026` poz 100+) — DA yükselmeden ağır bütçe yok
12. TR-first içerik önceliği — US hedefiyle çelişir (TR secondary)

---

## 2) Odaklanılması gerekenler

### Birincil odak (90 gün)

> **Tek canonical host + 1 killer US landing: “AI PDF Summarizer”**  
> Ardından PowerPoint + Contract mode sayfaları.

### Kategori önceliği (GSC non-brand imps)

| Sıra | Kategori | ~Imps | Aksiyon |
|------|----------|-------|---------|
| 1 | document-summarizer | 654 | Ana savaş alanı |
| 2 | contract | 91 | Mode sayfası güçlendir |
| 3 | study / student | 55 | Blog LT (zaten iyi poz sinyali) |
| 4 | alternatives | 47 | Comparison içerik |
| 5 | summarizer-generic | 52 | Landing’e yönlendir, ayrı thin page çoğaltma |

### Nokta atışı kelimeler (US EN)

| Öncelik | Sorgu | Göst. | Poz | Hedef URL |
|---------|-------|-------|-----|-----------|
| P0 | pdf summarizer | 131 | 44 | Ana summarizer landing |
| P0 | summarize pdf | 110 | 57 | Aynı landing (H2/FAQ) |
| P1 | ai pdf summarizer / pdf summarizer ai | 43+33 | 73–79 | Aynı landing |
| P1 | pdf summary generator / summarizer pdf | 24+23 | 52–63 | Aynı landing |
| P1 | summarize powerpoint | 27 | 90 | `/summarize-powerpoint` |
| P1 | contract summary (+ ai) | 55+14 | 77–91 | `/modes/contract-analyzer` |
| P2 | notebooklm alternatives | 18 | 68 | Yeni/güçlü comparison blog |
| Marka | summify / summify ai | 202+ | ~6–8 | Koru; CTR iyileştir (snippet) |

---

## 3) Tespit edilmesi / denetlenmesi gerekenler

Agent’lar aşağıdaki checklist’i **repo + canlı site** üzerinde doğrulasın:

- [ ] Apex vs www: hangi host 200, hangisi redirect? Canonical tutarlı mı?
- [ ] Sitemap’te duplicate host URL var mı?
- [ ] `summify.app` ve `www` ayrı property/GSC mi — birleştirme önerisi
- [ ] Title/H1 “PDF Summarizer” exact match ana landing’de var mı?
- [ ] Mode sayfaları thin mi, unique value var mı?
- [ ] Blog’da US intent vs TR/genel karışık mı?
- [ ] Pricing sayfası index: indexlenebilir mi, yoksa noindex mi olmalı? (GA’da 69 view — SEO vs ürün kararı)
- [ ] Soft-404 / boş state indexleniyor mu?
- [ ] robots.txt / middleware geo veya auth crawl engeli var mı?
- [ ] Core Web Vitals (CrUX veya PageSpeed) upload + workspace
- [ ] Analytics: direct şişkinliği — bot/owner exclusion (`ANALYTICS_EXCLUSION_*` dokümanıyla hizala)
- [ ] Organic landing page report: GSC tıklamaları hangi path’e geliyor?

---

## 4) SEO öncelikleri (iş listesi)

### On-page

1. Ana landing: title örneği  
   `AI PDF Summarizer — Summarize PDFs Instantly | Summify`
2. H1 exact; H2’ler: Summarize PDF, AI PDF Summarizer, PDF Summary Generator
3. Above-the-fold CTA + örnek çıktı (EEAT/ürün demosu)
4. FAQ 6–8 soru (schema)
5. Internal: blog → landing, modes → landing, iOS/upload → landing

### Teknik

1. Host birleştirme (P0)
2. XML sitemap + `lastmod` gerçek
3. Canonical her sayfada absolute preferred host
4. Schema: SoftwareApplication + FAQPage (+ HowTo gerektiğinde)
5. Open Graph / Twitter card URL preferred host
6. hreflang yok; `lang="en"` + EN-US copy net

### İçerik kalitesi

1. Thin mode sayfalarını birleştir veya derinleştir
2. “Best tools 2026” listicle’ları ancak unique data/table ile
3. Student/ADHD/exam-prep: US college intent

---

## 5) Yeni / öncelikli blog yazıları (US)

Sıra = etki × kazanılabilirlik (mevcut GSC’ye göre).

| # | Konu (çalışma başlığı) | Hedef sorgu / açı | Not |
|---|------------------------|-------------------|-----|
| 1 | How to Summarize a PDF with AI (2026) | summarize pdf, pdf summarizer | Landing’e funnel |
| 2 | Best AI PDF Summarizers — Honest Comparison | ai pdf summarizer | Summify satırında unique fark |
| 3 | NotebookLM Alternatives for Long Documents | notebooklm alternatives | 18@68 — yakın |
| 4 | Summarize PowerPoint Decks with AI | summarize powerpoint | Mode sayfasına link |
| 5 | AI Contract Summary: What to Extract (and What Not To) | contract summary | Legal disclaimer |
| 6 | AI Summarizers for Students & Exam Prep (US) | study cluster | Mevcut pozitif blog’u genişlet |
| 7 | PDF Summary Generator vs Manual Notes | pdf summary generator | LT |
| 8 | Best AI Tools for ADHD Students (refresh) | mevcut URL güçlendir | Zaten 1 tık almış |

**Yazım kuralları:** EN-US, tek primary keyword, 1 canonical CTA Summify tool’a, competitor claim’lerde abartma, her yazıda FAQ.

---

## 6) Site içi teknik SEO yapısı — önerilen IA

```
/ (veya /ai-pdf-summarizer)     ← P0 money page
/upload                         ← product entry (canonical ilişki net)
/summarize-powerpoint           ← P1 mode
/modes/contract-analyzer        ← P1 mode
/modes/*                        ← sadece unique value olanlar index
/blog/*                         ← US cluster’lar
/pricing                        ← index kararı bilinçli
/ios-app                        ← app store destek (zaten iyi poz sinyali)
```

**Internal link kuralı:** Her blog → max 1 primary money page + 1 ilgili mode. Orphan page bırakma.

---

## 7) Agent görev dağılımı

| Rol | Görev |
|-----|--------|
| **Koordinatör** | Bu brief’i sprint’e böl; P0 bitmeden P2 blog yağmuruna izin verme |
| **SEO agent** | Host audit, title/H1, sitemap, schema, GSC izleme |
| **Content agent** | §5 blog #1–4 önce; EN-US |
| **Engineering** | 301/canonical/middleware, CWV, duplicate host |
| **Analytics** | Organic segment, US country, landing path; exclusion doğrula |
| **QA / Guardian** | Contract mode disclaimer; pricing claim’ler |

---

## 8) Başarı metrikleri (90 gün)

1. Preferred host’ta birleşik gösterim (duplicate host imps → 0’a yakın)
2. `pdf summarizer` ortalama pozisyon ≤ 20 (hedef ≤ 12)
3. US CTR (GSC ülke=US) > %1
4. Organik tıklama (ay): iyimser kırılımda **~180–350 (3ay) / ~600–1.200 (6ay)**
5. GA organik kullanıcı artışı (direct’ten ayrıştırılmış)

---

## 9) Bilerek yapma

- Marka sorgusuna (`summify`) güvenip non-brand’i ihmal etme
- TR blog’u US’den önce çoğaltma
- 20 thin “AI tool” listicle aynı anda publish
- www düzeltmeden büyük içerik sprint’i (sinyal yine bölünür)

---

*Rapor tarihi: 2026-07-24 · Veri kesiti: GA 90g + GSC son 3 ay*
